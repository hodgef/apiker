import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { apiker } from "../../Apiker";
import { listUsersEndpoint, rebuildUserIndexEndpoint } from "../Api/usersEndpoint";

/**
 * Unit tests for the panel's account listing.
 *
 * Listing reads the directory, so it must stay a fixed cost. Rebuilding is the only
 * path that sweeps every object instance, and it has to be resumable and never
 * expose a stored password.
 */

let listed: { limit?: number; cursor?: string } | undefined;
let searched: { query?: string; limit?: number } | undefined;
let adminsListed: number | undefined;
let adminResults: any[];
let directoryPage: { users: any[]; cursor: string | null };
let searchResults: any[];
let indexed: any[];
let instances: any[];
let stored: Record<string, any>;
let instanceListError: Error | undefined;

jest.mock("../../Auth", () => ({
  listIndexedUsers: async (options: any) => {
    listed = options;
    return directoryPage;
  },
  findUsers: async (query: string, limit: number) => {
    searched = { query, limit };
    return searchResults;
  },
  listAdminUsers: async (limit: number) => {
    adminsListed = limit;
    return adminResults;
  },
  indexUser: async (user: any) => {
    indexed.push(user);
    return true;
  },
}));

jest.mock("../../Cloudflare", () => ({
  getInstanceList: async () => {
    if (instanceListError) throw instanceListError;
    return { result: instances };
  },
}));

const state = (_objectName: string, objectId: string) => ({
  list: async () => stored[objectId] || {},
});

const params = (search = ""): any => ({
  state,
  request: new Request(`https://api.test/admp/users${search}`),
});

const user = (id: string, overrides: any = {}) => ({
  id,
  email: `${id}@example.com`,
  password: "$2a$07$hashed",
  createdAt: 1,
  ...overrides,
});

const body = async (res: any) => JSON.parse(await res.text());

describe("Users endpoint", () => {
  beforeEach(() => {
    apiker.name = "demo-app";
    apiker.responseHeaders = new Headers();
    apiker.env = {
      CLOUDFLARE_ACCOUNT_ID: "acct",
      CLOUDFLARE_EMAIL: "ops@example.com",
      CLOUDFLARE_API_KEY: "key",
    };
    listed = undefined;
    searched = undefined;
    adminsListed = undefined;
    adminResults = [];
    directoryPage = { users: [], cursor: null };
    searchResults = [];
    indexed = [];
    instances = [];
    stored = {};
    instanceListError = undefined;
  });

  describe("listing", () => {
    it("returns a page of the directory", async () => {
      directoryPage = { users: [{ id: "a", email: "a@example.com" }], cursor: "user:5:a" };

      const payload = await body(await listUsersEndpoint(params()));

      expect(payload.users).toHaveLength(1);
      expect(payload.cursor).toBe("user:5:a");
    });

    // "Admins" on the dashboard is a count of who can sign in, so it leads to them.
    it("lists only the admins when asked for that role", async () => {
      adminResults = [{ id: "a", email: "a@example.com", role: "admin" }];

      const payload = await body(await listUsersEndpoint(params("?role=admin")));

      expect(adminsListed).toBe(25);
      expect(payload.users).toHaveLength(1);
      expect(payload.role).toBe("admin");
      expect(payload.cursor).toBeNull();
      expect(listed).toBeUndefined();
    });

    it("ignores a role it does not know", async () => {
      await listUsersEndpoint(params("?role=wizard"));

      expect(adminsListed).toBeUndefined();
      expect(listed).toEqual({ limit: 25, cursor: undefined });
    });

    it("prefers the role filter over a search", async () => {
      await listUsersEndpoint(params("?role=admin&q=someone"));

      expect(adminsListed).toBe(25);
      expect(searched).toBeUndefined();
    });

    it("passes the cursor through for the next page", async () => {
      await listUsersEndpoint(params("?cursor=user%3A5%3Aa"));

      expect(listed?.cursor).toBe("user:5:a");
    });

    it("asks for a bounded page", async () => {
      await listUsersEndpoint(params());

      expect(listed?.limit).toBe(25);
    });

    it("does not need the Cloudflare API", async () => {
      apiker.env = {};
      directoryPage = { users: [{ id: "a", email: "a@example.com" }], cursor: null };

      const payload = await body(await listUsersEndpoint(params()));

      expect(payload.users).toHaveLength(1);
    });
  });

  describe("searching", () => {
    it("searches instead of listing when a query is given", async () => {
      searchResults = [{ id: "a", email: "a@example.com" }];

      const payload = await body(await listUsersEndpoint(params("?q=a%40example.com")));

      expect(searched?.query).toBe("a@example.com");
      expect(payload.users).toHaveLength(1);
      expect(listed).toBeUndefined();
    });

    it("echoes the query back so the panel can label the results", async () => {
      const payload = await body(await listUsersEndpoint(params("?q=%20jordan%20")));

      expect(payload.query).toBe("jordan");
    });

    it("offers no cursor for a search", async () => {
      searchResults = [{ id: "a", email: "a@example.com" }];

      const payload = await body(await listUsersEndpoint(params("?q=a")));

      expect(payload.cursor).toBeNull();
    });

    it("bounds how many matches it returns", async () => {
      await listUsersEndpoint(params("?q=a"));

      expect(searched?.limit).toBe(25);
    });

    it("falls back to listing when the query is only whitespace", async () => {
      await listUsersEndpoint(params("?q=%20%20"));

      expect(searched).toBeUndefined();
      expect(listed?.limit).toBe(25);
    });
  });

  describe("rebuilding", () => {
    it("reports which variables are missing instead of failing", async () => {
      apiker.env = { CLOUDFLARE_ACCOUNT_ID: "acct" };

      const payload = await body(await rebuildUserIndexEndpoint(params()));

      expect(payload.available).toBe(false);
      expect(payload.missing).toEqual(["CLOUDFLARE_EMAIL", "CLOUDFLARE_API_KEY"]);
    });

    it("reports an unreachable Cloudflare API", async () => {
      instanceListError = new Error("Namespace for object Users not found");

      const payload = await body(await rebuildUserIndexEndpoint(params()));

      expect(payload.available).toBe(false);
      expect(payload.error).toBe("Namespace for object Users not found");
    });

    it("indexes the accounts it finds", async () => {
      instances = [{ id: "i1", hasStoredData: true }, { id: "i2", hasStoredData: true }];
      stored = { i1: { a: user("a") }, i2: { b: user("b") } };

      const payload = await body(await rebuildUserIndexEndpoint(params()));

      expect(payload.indexed).toBe(2);
      expect(indexed.map((entry) => entry.id).sort()).toEqual(["a", "b"]);
    });

    it("resumes where the previous chunk stopped", async () => {
      instances = Array.from({ length: 60 }, (_, i) => ({ id: `i${i}`, hasStoredData: true }));

      const first = await body(await rebuildUserIndexEndpoint(params()));
      const second = await body(await rebuildUserIndexEndpoint(params(`?offset=${first.nextOffset}`)));

      expect(first.read).toBe(25);
      expect(first.nextOffset).toBe(25);
      expect(second.read).toBe(50);
      expect(second.nextOffset).toBe(50);
    });

    it("stops offering an offset once every instance was read", async () => {
      instances = [{ id: "i1", hasStoredData: true }];

      const { nextOffset, instances: count } = await body(await rebuildUserIndexEndpoint(params()));

      expect(nextOffset).toBeNull();
      expect(count).toBe(1);
    });

    it("skips instances that hold nothing", async () => {
      instances = [{ id: "i1", hasStoredData: false }, { id: "i2", hasStoredData: true }];
      stored = { i2: { b: user("b") } };

      const { instances: count, indexed: total } = await body(await rebuildUserIndexEndpoint(params()));

      expect(count).toBe(1);
      expect(total).toBe(1);
    });

    it("ignores records that are not users", async () => {
      instances = [{ id: "i1", hasStoredData: true }];
      stored = { i1: { junk: { note: "not a user" } } };

      const { indexed: total } = await body(await rebuildUserIndexEndpoint(params()));

      expect(total).toBe(0);
    });

    it("keeps going when one instance cannot be read", async () => {
      instances = [{ id: "bad", hasStoredData: true }, { id: "ok", hasStoredData: true }];
      stored = { ok: { b: user("b") } };

      const failing = (_objectName: string, objectId: string) => ({
        list: async () => {
          if (objectId === "bad") throw new Error("unreachable");
          return stored[objectId] || {};
        },
      });

      const { indexed: total } = await body(
        await rebuildUserIndexEndpoint({
          state: failing,
          request: new Request("https://api.test/admp/users"),
        } as any)
      );

      expect(total).toBe(1);
    });

    it("never returns a stored password", async () => {
      instances = [{ id: "i1", hasStoredData: true }];
      stored = { i1: { a: user("a") } };

      const res = await rebuildUserIndexEndpoint(params());

      expect(await res.text()).not.toContain("$2a$07$hashed");
    });
  });
});
