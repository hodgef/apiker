import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { apiker } from "../../../Apiker";
import { OBN } from "../../../ObjectBase";
import { registerUserAction } from "../registerUser";
import { deleteUserAction } from "../deleteUser";

/**
 * Unit tests for the directory staying in step with a user's life cycle.
 *
 * An account that is created but never indexed is invisible to the panel, and one
 * that is deleted but left indexed shows up as a ghost.
 */

let indexedUsers: any[];
let unindexedUsers: any[];
let stored: Record<string, any>;

jest.mock("../directory", () => ({
  indexUser: async (user: any) => {
    indexedUsers.push(user);
    return true;
  },
  unindexUser: async (user: any) => {
    unindexedUsers.push(user);
    return true;
  },
}));

jest.mock("../utils", () => {
  const actual: any = jest.requireActual("../utils");
  return {
    ...actual,
    hash_bcrypt: () => "hashed",
    randomHash_SHA1: () => "generated-id",
    getTokens: () => ({ token: "t" }),
    getCurrentUser: async () => undefined,
  };
});

beforeEach(() => {
  indexedUsers = [];
  unindexedUsers = [];
  stored = {};

  apiker.objects = [OBN.USERS, OBN.EMAILTOUUID, OBN.COMMON];
  apiker.responseParams = { setError: () => undefined } as any;
  apiker.requestParams = {
    state: (objectName: string, objectId: string) => ({
      get: async (key: string) => stored[`${objectName}:${key}`],
      put: async (entry: any) => {
        Object.entries(entry).forEach(([key, value]) => {
          stored[`${objectName}:${key}`] = value;
        });
      },
      delete: async (key: string) => {
        delete stored[`${objectName}:${key}`];
      },
    }),
  } as any;
});

describe("User life cycle", () => {
  it("indexes an account when it is registered", async () => {
    const user = await registerUserAction("new@example.com", "a-password");

    expect(user?.id).toBe("generated-id");
    expect(indexedUsers).toHaveLength(1);
    expect(indexedUsers[0].email).toBe("new@example.com");
  });

  it("indexes the role an account was created with", async () => {
    await registerUserAction("admin@example.com", "a-password", { role: "admin" });

    expect(indexedUsers[0].role).toBe("admin");
  });

  it.each([5, 48, 1024])("registers a %i-character password", async (length) => {
    const user = await registerUserAction("new@example.com", "p".repeat(length));

    expect(user?.id).toBe("generated-id");
    expect(stored[`${OBN.USERS}:generated-id`]).toEqual(user);
    expect(stored[`${OBN.EMAILTOUUID}:new@example.com`]).toBe(user?.id);
    expect(indexedUsers).toEqual([user]);
  });

  it.each([51, 254])("registers a %i-character email with a long password", async (length) => {
    const email = `member@${"a".repeat(60)}.${"b".repeat(60)}.${"c".repeat(60)}.${"d".repeat(60)}.com`.slice(0, length - 4) + ".com";
    const user = await registerUserAction(email, "p".repeat(48));

    expect(email).toHaveLength(length);
    expect(user?.email).toBe(email);
    expect(stored[`${OBN.EMAILTOUUID}:${email}`]).toBe("generated-id");
    expect(indexedUsers).toEqual([user]);
  });

  it.each([
    ["not-an-email", "a-password"],
    ["new@example.com", "1234"],
    ["new@example.com", "p".repeat(1025)],
    [`${"a".repeat(243)}@example.com`, "a-password"],
    [undefined, "a-password"],
    ["new@example.com", undefined],
    [{ length: 10 }, "a-password"],
    ["new@example.com", { length: 10 }],
  ])("does not write or index invalid credentials (%p)", async (email, password) => {
    const user = await registerUserAction(email as any, password as any, { role: "admin" });

    expect(user).toBeUndefined();
    expect(stored).toEqual({});
    expect(indexedUsers).toEqual([]);
  });

  it("does not index a registration that was rejected", async () => {
    await registerUserAction("not-an-email", "a-password");

    expect(indexedUsers).toEqual([]);
  });

  it("does not index a duplicate registration", async () => {
    stored[`${OBN.EMAILTOUUID}:taken@example.com`] = "existing-id";

    await registerUserAction("taken@example.com", "a-password");

    expect(indexedUsers).toEqual([]);
    expect(stored).toEqual({ [`${OBN.EMAILTOUUID}:taken@example.com`]: "existing-id" });
  });

  it("removes an account from the directory when it is deleted", async () => {
    const user = await registerUserAction("bye@example.com", "a-password");

    await deleteUserAction(user as any);

    expect(unindexedUsers.map((entry) => entry.id)).toEqual(["generated-id"]);
  });
});
