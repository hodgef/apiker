import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { apiker } from "../../Apiker";
import { OBN } from "../../ObjectBase";
import { updateUserEndpoint } from "../Api/updateUserEndpoint";

/**
 * Unit tests for editing and deleting an account from the panel.
 *
 * Both paths have to keep the directory truthful, and neither may be used to touch
 * an administrator.
 */

let indexedUsers: any[];
let unindexedUsers: any[];
let stored: Record<string, any>;

jest.mock("../../Auth", () => ({
  indexUser: async (user: any) => {
    indexedUsers.push(user);
    return true;
  },
  unindexUser: async (user: any) => {
    unindexedUsers.push(user);
    return true;
  },
}));

jest.mock("../../Bans", () => ({ unbanEntity: async () => undefined }));

const state = (objectName: string, objectId: string) => ({
  get: async (key: string) => stored[`${objectName}:${key}`],
  put: async (entry: any) => {
    Object.entries(entry).forEach(([key, value]) => {
      stored[`${objectName}:${key}`] = value;
    });
  },
  delete: async (key: string) => {
    delete stored[`${objectName}:${key}`];
  },
  deleteAll: async () => {
    Object.keys(stored)
      .filter((key) => key.startsWith(`${objectName}:${objectId}`))
      .forEach((key) => delete stored[key]);
  },
});

const params = (method: string, body: any = {}, search = ""): any => ({
  state,
  body,
  request: new Request(`https://api.test/admp/user${search}`, { method }),
});

const seedUser = (overrides: any = {}) => {
  const user = {
    id: "u1",
    email: "user@example.com",
    password: "hashed",
    verified: true,
    createdAt: 5,
    ...overrides,
  };

  stored[`${OBN.EMAILTOUUID}:${user.email}`] = user.id;
  stored[`${OBN.USERS}:${user.id}`] = user;
  return user;
};

const body = async (res: any) => JSON.parse(await res.text());

describe("Update user endpoint", () => {
  beforeEach(() => {
    apiker.debug = false;
    apiker.responseHeaders = new Headers();
    indexedUsers = [];
    unindexedUsers = [];
    stored = {};
  });

  it("returns the account without its password", async () => {
    seedUser();

    const res = await updateUserEndpoint(params("GET", {}, "?userEmail=user@example.com"));
    const payload = await res.clone().text();

    expect(JSON.parse(payload).partialUser.email).toBe("user@example.com");
    expect(payload).not.toContain("hashed");
  });

  it("rejects a value that is not an email", async () => {
    const res: any = await updateUserEndpoint(params("GET", {}, "?userEmail=not-an-email"));

    expect(res.status).toBe(400);
  });

  it("reindexes the account when its email changes", async () => {
    seedUser();

    await updateUserEndpoint(
      params("PUT", {
        userEmail: "user@example.com",
        updatedUser: JSON.stringify({ email: "moved@example.com" }),
      })
    );

    expect(indexedUsers).toHaveLength(1);
    expect(indexedUsers[0].email).toBe("moved@example.com");
    expect(indexedUsers[0].id).toBe("u1");
  });

  it("drops the old email from the directory so a search cannot find it", async () => {
    seedUser();

    await updateUserEndpoint(
      params("PUT", {
        userEmail: "user@example.com",
        updatedUser: JSON.stringify({ email: "moved@example.com" }),
      })
    );

    expect(unindexedUsers.map((entry) => entry.email)).toEqual(["user@example.com"]);
  });

  it("does not touch the directory when nothing changed", async () => {
    seedUser();

    await updateUserEndpoint(
      params("PUT", {
        userEmail: "user@example.com",
        updatedUser: JSON.stringify({ email: "user@example.com" }),
      })
    );

    expect(indexedUsers).toEqual([]);
  });

  it("removes the account from the directory when it is deleted", async () => {
    seedUser();

    await updateUserEndpoint(params("DELETE", { userEmail: "user@example.com" }));

    expect(unindexedUsers.map((entry) => entry.id)).toEqual(["u1"]);
  });

  it("refuses to delete an administrator", async () => {
    seedUser({ role: "admin" });

    const res: any = await updateUserEndpoint(params("DELETE", { userEmail: "user@example.com" }));

    expect(res.status).toBe(401);
    expect(unindexedUsers).toEqual([]);
  });

  it("reports an email that belongs to no account", async () => {
    const res: any = await updateUserEndpoint(params("GET", {}, "?userEmail=ghost@example.com"));

    expect(res.status).toBe(400);
  });
});
