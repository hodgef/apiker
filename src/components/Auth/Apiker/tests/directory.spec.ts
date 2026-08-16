import { describe, it, expect, beforeEach } from "@jest/globals";
import { apiker } from "../../../Apiker";
import { OBN } from "../../../ObjectBase";
import { findUsers, indexUser, listAdminUsers, listIndexedUsers, unindexUser } from "../directory";

/**
 * Unit tests for the user directory.
 *
 * Users are stored one object instance each, so this index is the only thing that
 * makes them listable. It has to stay cheap as the account count grows, which means
 * a page must cost a fixed number of reads and never a sweep.
 */

interface Written {
  instance: string;
  key: string;
  value: any;
}

let written: Written[];
let deleted: { instance: string; key: string }[];
let listPayloads: { instance: string; payload: any }[];
let storage: Record<string, Record<string, any>>;

const setup = () => {
  apiker.objects = [OBN.USERS];
  apiker.requestParams = {
    // An object read with no instance (the Common object) is keyed by its name.
    state: (objectName: string, instanceId?: string) => {
      const instance = instanceId || objectName;

      return {
      get: async (key: string) => (storage[instance] || {})[key],
      put: async (entry: any) => {
        Object.entries(entry).forEach(([key, value]) => written.push({ instance, key, value }));
      },
      delete: async (key: string) => {
        deleted.push({ instance, key });
      },
      list: async (payload: any) => {
        listPayloads.push({ instance, payload });
        const stored = storage[instance] || {};
        const keys = Object.keys(stored)
          .filter((key) => key.startsWith(payload.prefix || ""))
          .filter((key) => (payload.end ? key < payload.end : true))
          .sort();

        const ordered = payload.reverse ? keys.reverse() : keys;
        return Object.fromEntries(ordered.slice(0, payload.limit).map((key) => [key, stored[key]]));
      },
      };
    },
  } as any;
};

const user = (id: string, createdAt: number, extra: any = {}) => ({
  id,
  email: `${id}@example.com`,
  password: "hashed",
  verified: true,
  createdAt,
  updatedAt: createdAt,
  ...extra,
});

describe("User directory", () => {
  beforeEach(() => {
    written = [];
    deleted = [];
    listPayloads = [];
    storage = {};
    setup();
  });

  describe("indexUser", () => {
    const timeEntries = () => written.filter(({ key }) => key.startsWith("user:"));
    const emailEntries = () => written.filter(({ key }) => key.startsWith("email:"));

    it("stores only the fields the panel lists", async () => {
      await indexUser(user("ab12", 5, { role: "admin" }) as any);

      expect(timeEntries()).toHaveLength(1);
      expect(timeEntries()[0].value).toEqual({
        id: "ab12",
        email: "ab12@example.com",
        role: "admin",
        verified: true,
        createdAt: 5,
      });
    });

    it("also files the account under its email so it can be searched", async () => {
      await indexUser(user("ab12", 5) as any);

      expect(emailEntries()).toHaveLength(1);
      expect(emailEntries()[0].key).toBe("email:ab12@example.com");
    });

    it("never stores the password", async () => {
      await indexUser(user("ab12", 5) as any);

      expect(JSON.stringify(written[0].value)).not.toContain("hashed");
    });

    it("keys entries by creation time so a page reads newest first", async () => {
      await indexUser(user("ab12", 5) as any);
      await indexUser(user("ab34", 40) as any);

      const [older, newer] = timeEntries().map(({ key }) => key);
      expect(newer > older).toBe(true);
    });

    it("spreads accounts over shards so registrations do not queue on one instance", async () => {
      await Promise.all(
        ["00aa", "3fbb", "7acc", "c1dd"].map((id) => indexUser(user(id, 1) as any))
      );

      expect(new Set(timeEntries().map(({ instance }) => instance)).size).toBeGreaterThan(1);
    });

    it("puts a user in the same shard every time", async () => {
      await indexUser(user("ab12", 5) as any);
      await indexUser(user("ab12", 5) as any);

      const [first, second] = timeEntries();
      expect(first.instance).toBe(second.instance);
    });

    it("does nothing without a user id", async () => {
      await expect(indexUser({} as any)).resolves.toBe(false);
      expect(written).toEqual([]);
    });

    it("does nothing when the Users object is not registered", async () => {
      apiker.objects = [];

      await expect(indexUser(user("ab12", 5) as any)).resolves.toBe(false);
      expect(written).toEqual([]);
    });
  });

  describe("unindexUser", () => {
    it("removes the entry from the user's shard", async () => {
      await indexUser(user("ab12", 5) as any);
      const timeEntry = written.find(({ key }) => key.startsWith("user:"))!;

      await unindexUser(user("ab12", 5) as any);

      expect(deleted).toContainEqual({ instance: timeEntry.instance, key: timeEntry.key });
    });

    it("does nothing without a user id", async () => {
      await expect(unindexUser({} as any)).resolves.toBe(false);
      expect(deleted).toEqual([]);
    });
  });

  describe("listIndexedUsers", () => {
    const seed = async (count: number) => {
      for (let index = 0; index < count; index++) {
        await indexUser(user(`${index.toString(16).padStart(4, "0")}`, index) as any);
      }

      written.forEach(({ instance, key, value }) => {
        storage[instance] = { ...(storage[instance] || {}), [key]: value };
      });
    };

    it("returns the newest accounts first, across shards", async () => {
      await seed(12);

      const { users } = await listIndexedUsers({ limit: 5 });

      expect(users.map((entry) => entry.createdAt)).toEqual([11, 10, 9, 8, 7]);
    });

    it("costs the same number of reads regardless of how many accounts exist", async () => {
      await seed(60);
      listPayloads = [];

      await listIndexedUsers({ limit: 5 });
      const readsForMany = listPayloads.length;

      storage = {};
      written = [];
      await seed(3);
      listPayloads = [];

      await listIndexedUsers({ limit: 5 });

      expect(listPayloads.length).toBe(readsForMany);
    });

    it("continues from the cursor without repeating a user", async () => {
      await seed(12);

      const first = await listIndexedUsers({ limit: 4 });
      const second = await listIndexedUsers({ limit: 4, cursor: first.cursor as string });

      expect(second.users.map((entry) => entry.createdAt)).toEqual([7, 6, 5, 4]);
      expect(listPayloads.every(({ payload }) => payload.limit === 4)).toBe(true);
    });

    it("stops offering a cursor on the last page", async () => {
      await seed(3);

      const { users, cursor } = await listIndexedUsers({ limit: 10 });

      expect(users).toHaveLength(3);
      expect(cursor).toBeNull();
    });

    it("returns nothing when the Users object is not registered", async () => {
      apiker.objects = [];

      await expect(listIndexedUsers()).resolves.toEqual({ users: [], cursor: null });
    });
  });

  describe("findUsers", () => {
    const commit = () => {
      written.forEach(({ instance, key, value }) => {
        storage[instance] = { ...(storage[instance] || {}), [key]: value };
      });
    };

    beforeEach(async () => {
      await indexUser(user("aa01", 1, { email: "jordan@example.com" }) as any);
      await indexUser(user("bb02", 2, { email: "jordana@example.com" }) as any);
      await indexUser(user("cc03", 3, { email: "sam@example.com" }) as any);
      commit();
      listPayloads = [];
    });

    it("finds an account by its full email", async () => {
      const found = await findUsers("jordan@example.com");

      expect(found.map((entry) => entry.id)).toEqual(["aa01"]);
    });

    it("finds every account whose email starts with the query", async () => {
      const found = await findUsers("jordan");

      expect(found.map((entry) => entry.id).sort()).toEqual(["aa01", "bb02"]);
    });

    it("ignores the case of the query", async () => {
      const found = await findUsers("JORDAN@EXAMPLE.COM");

      expect(found.map((entry) => entry.id)).toEqual(["aa01"]);
    });

    it("reads a single instance, whatever the query", async () => {
      await findUsers("jordan");

      expect(listPayloads).toHaveLength(1);
    });

    it("finds an account by its id", async () => {
      storage["a1b2c3d4e5f60718"] = { "a1b2c3d4e5f60718": user("a1b2c3d4e5f60718", 9) };

      const found = await findUsers("a1b2c3d4e5f60718");

      expect(found.map((entry) => entry.email)).toEqual(["a1b2c3d4e5f60718@example.com"]);
    });

    it("returns nothing for an id that does not exist", async () => {
      await expect(findUsers("f".repeat(40))).resolves.toEqual([]);
    });

    it("returns nothing for an empty query", async () => {
      await expect(findUsers("   ")).resolves.toEqual([]);
      expect(listPayloads).toEqual([]);
    });

    it("never returns a password", async () => {
      const found = await findUsers("jordan@example.com");

      expect(JSON.stringify(found)).not.toContain("hashed");
    });
  });

  describe("keeping search in step", () => {
    it("removes the email entry when a user is deleted", async () => {
      await indexUser(user("aa01", 1, { email: "gone@example.com" }) as any);
      const emailWrite = written.find(({ key }) => key.startsWith("email:"));

      await unindexUser(user("aa01", 1, { email: "gone@example.com" }) as any);

      expect(deleted).toContainEqual({ instance: emailWrite!.instance, key: emailWrite!.key });
    });
  });

  /**
   * `adminIds` is what actually grants access, so the listing follows it rather
   * than a `role` field that could have drifted.
   */
  describe("listAdminUsers", () => {
    const withAdmins = (ids: string[], users: any[]) => {
      storage[OBN.COMMON] = { adminIds: ids };
      users.forEach((stored) => {
        storage[stored.id] = { [stored.id]: stored };
      });
    };

    it("reads one instance per admin id, newest first", async () => {
      withAdmins(["aa01", "bb02"], [user("aa01", 1), user("bb02", 9)]);

      const admins = await listAdminUsers();

      expect(admins.map(({ id }) => id)).toEqual(["bb02", "aa01"]);
      expect(listPayloads).toHaveLength(0);
    });

    it("never returns a stored password", async () => {
      withAdmins(["aa01"], [user("aa01", 1)]);

      const [admin] = await listAdminUsers();

      expect(admin).not.toHaveProperty("password");
      expect(admin.email).toBe("aa01@example.com");
    });

    it("is empty when nobody is an admin", async () => {
      storage[OBN.COMMON] = {};

      await expect(listAdminUsers()).resolves.toEqual([]);
    });

    it("skips an id whose account no longer exists", async () => {
      withAdmins(["aa01", "missing"], [user("aa01", 1)]);

      const admins = await listAdminUsers();

      expect(admins.map(({ id }) => id)).toEqual(["aa01"]);
    });

    it("stops at the limit rather than reading every instance", async () => {
      withAdmins(["aa01", "bb02", "cc03"], [user("aa01", 1), user("bb02", 2), user("cc03", 3)]);

      await expect(listAdminUsers(2)).resolves.toHaveLength(2);
    });

    it("does nothing when the object is not registered", async () => {
      apiker.objects = [];

      await expect(listAdminUsers()).resolves.toEqual([]);
    });
  });
});
