import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { apiker } from "../../Apiker";
import { OBN } from "../../ObjectBase";
import { createJWT } from "../../Auth";
import { adminLoginMiddleware, adminMiddleware, adminWhitelistMiddleware } from "../middleware";
import { getAdminRoutes } from "../Admin";
import { loginEndpoint } from "../Api/loginEndpoint";
import { createAdminEndpoint } from "../Api/adminsEndpoint";

/**
 * Unit tests for the admin panel's gates.
 *
 * These cover who is allowed to reach a privileged admin route and who is
 * allowed to claim the very first admin account, which are the two points where
 * a mistake exposes the panel to the public internet.
 */

let adminIds: string[] | undefined;
let currentUser: any;
let registered: any[];
let checkedCredentials: any[];
let existingAccounts: Record<string, { id: string; password: string }>;
let promoted: string[];

jest.mock("../../Auth", () => {
  const actual: any = jest.requireActual("../../Auth");
  return {
    ...actual,
    getCurrentUser: async () => currentUser,
    isCurrentUserAdmin: async () =>
      !!currentUser?.id && Array.isArray(adminIds) && adminIds.includes(currentUser.id),
    checkUser: async (email: string, password: string) => {
      checkedCredentials.push({ email, password });
      const account = existingAccounts[email];
      if (account) return account.password === password ? { id: account.id } : undefined;
      return { id: "existing-admin" };
    },
    registerUserAction: async (email: string, password: string, extra: any) => {
      if (existingAccounts[email]) return undefined;
      registered.push({ email, password, extra });
      return { id: "new-admin" };
    },
    addAdminId: async (id: string) => {
      promoted.push(id);
      return true;
    },
    getTokens: () => ({ token: "t" }),
    isUserAdmin: async (id: string) =>
      (Array.isArray(adminIds) && adminIds.includes(id)) || promoted.includes(id),
  };
});

jest.mock("../../Logging", () => ({ addLogEntry: async () => undefined }));
jest.mock("../../Geolocation", () => ({
  getCurrentUserGeodata: async () => ({ isp: "RealISP", city: "Lisbon" }),
}));

const params = (body: any = {}): any => ({
  body,
  state: () => ({ get: async (key: string) => (key === "adminIds" ? adminIds : undefined) }),
});

const setHeaders = (headers: Record<string, string> = {}) => {
  apiker.requestParams = {
    headers: new Headers({ "CF-Connecting-IP": "1.2.3.4", ...headers }),
    request: new Request("https://api.test/admp"),
  } as any;
};

describe("Admin gates", () => {
  beforeEach(() => {
    apiker.env = { APIKER_SECRET_KEY: "super-secret" };
    apiker.responseHeaders = new Headers();
    adminIds = undefined;
    currentUser = undefined;
    registered = [];
    checkedCredentials = [];
    existingAccounts = {};
    promoted = [];
    setHeaders();
  });

  describe("claiming the first admin", () => {
    it("is refused when no setup secret is configured", async () => {
      const res: any = await loginEndpoint(params({ email: "a@b.c", password: "pw" }));

      expect(res.status).toBe(401);
      expect(registered).toEqual([]);
    });

    it("is refused when the setup secret does not match", async () => {
      apiker.env.ADMP_SETUP_SECRET = "expected";

      const res: any = await loginEndpoint(
        params({ email: "a@b.c", password: "pw", setupSecret: "wrong" })
      );

      expect(res.status).toBe(401);
      expect(registered).toEqual([]);
    });

    it("succeeds with the configured setup secret", async () => {
      apiker.env.ADMP_SETUP_SECRET = "expected";
      adminIds = [];

      await loginEndpoint(params({ email: "a@b.c", password: "pw", setupSecret: "expected" }));

      expect(registered).toHaveLength(1);
      expect(registered[0].extra).toEqual({ role: "admin" });
    });

    it("stops offering setup once an admin exists", async () => {
      adminIds = ["existing-admin"];
      apiker.env.ADMP_SETUP_SECRET = "expected";

      await loginEndpoint(params({ email: "a@b.c", password: "pw" }));

      // Credentials are verified rather than a second admin being created.
      expect(registered).toEqual([]);
      expect(checkedCredentials).toEqual([{ email: "a@b.c", password: "pw" }]);
    });
  });

  describe("the setup secret after bootstrap", () => {
    beforeEach(() => {
      apiker.env.ADMP_SETUP_SECRET = "expected";
      adminIds = ["existing-admin"];
    });

    it("cannot create a second admin account", async () => {
      await loginEndpoint(
        params({ email: "service@example.com", password: "pw", setupSecret: "expected" })
      );

      expect(registered).toEqual([]);
      expect(promoted).toEqual([]);
    });

    it("cannot promote an existing account", async () => {
      existingAccounts["service@example.com"] = { id: "svc", password: "right" };

      const res: any = await loginEndpoint(
        params({ email: "service@example.com", password: "right", setupSecret: "expected" })
      );

      expect(promoted).toEqual([]);
      expect(res.status).toBe(401);
    });

    it("still refuses a wrong password", async () => {
      existingAccounts["service@example.com"] = { id: "svc", password: "right" };

      const res: any = await loginEndpoint(
        params({ email: "service@example.com", password: "guess", setupSecret: "expected" })
      );

      expect(res.status).toBe(401);
    });
  });

  describe("createAdminEndpoint", () => {
    const adminParams = (
      body: any,
      emailToId: Record<string, string> = {},
      users: Record<string, any> = {}
    ): any => ({
      body,
      state: (objectName: string) => ({
        get: async (key: string) => {
          if (objectName === OBN.EMAILTOUUID) return emailToId[key];
          if (objectName === OBN.USERS) return users[key];
          return undefined;
        },
      }),
    });

    it("rejects an invalid email", async () => {
      const res: any = await createAdminEndpoint(adminParams({ email: "not-an-email" }));

      expect(res.status).toBe(400);
      expect(registered).toEqual([]);
    });

    it("creates an admin account when the email is unknown", async () => {
      await createAdminEndpoint(adminParams({ email: "new@example.com", password: "pw" }));

      expect(registered).toEqual([
        { email: "new@example.com", password: "pw", extra: { role: "admin" } },
      ]);
    });

    it("promotes an existing account without needing its password", async () => {
      const res: any = await createAdminEndpoint(
        adminParams({ email: "user@example.com" }, { "user@example.com": "u1" }, { u1: { id: "u1" } })
      );

      expect(res.status).toBe(200);
      expect(promoted).toEqual(["u1"]);
      expect(registered).toEqual([]);
    });

    it("rejects an email that maps to a missing user record", async () => {
      const res: any = await createAdminEndpoint(
        adminParams({ email: "ghost@example.com" }, { "ghost@example.com": "gone" })
      );

      expect(res.status).toBe(400);
      expect(promoted).toEqual([]);
    });
  });

  describe("adminLoginMiddleware", () => {
    it("rejects an anonymous caller", async () => {
      const res: any = await adminLoginMiddleware(params());
      expect(res.status).toBe(401);
    });

    it("rejects a signed-in user who is not an admin", async () => {
      currentUser = { id: "someone" };
      adminIds = ["the-admin"];

      const res: any = await adminLoginMiddleware(params());
      expect(res.status).toBe(401);
    });

    it("lets an admin through", async () => {
      currentUser = { id: "the-admin" };
      adminIds = ["the-admin"];

      expect(await adminLoginMiddleware(params())).toBeUndefined();
    });
  });

  describe("adminMiddleware", () => {
    const handler = async () => new Response("secret data");

    const csrfHeaders = (sub?: string) => ({
      "X-Apiker-Csrf": createJWT(sub ? { sub } : { pageName: "AdminPanelPage" }),
    });

    it("does not run the handler for a caller who is not an admin", async () => {
      // A CSRF token without a subject is what an anonymous visitor is handed.
      setHeaders(csrfHeaders());
      adminIds = ["the-admin"];

      const res: any = await adminMiddleware(params(), handler);
      expect(res.status).toBe(401);
    });

    it("runs the handler for an admin", async () => {
      currentUser = { id: "the-admin" };
      adminIds = ["the-admin"];
      setHeaders(csrfHeaders("the-admin"));

      const res: any = await adminMiddleware(params(), handler);
      expect(await res.text()).toBe("secret data");
    });

    it("refuses a request without a CSRF token", async () => {
      currentUser = { id: "the-admin" };
      adminIds = ["the-admin"];

      const res: any = await adminMiddleware(params(), handler);
      expect(res.status).toBe(401);
    });

    /**
     * The signed-out panel page hands a subject-less token to anyone who loads it,
     * so a privileged route must not settle for one.
     */
    it("refuses a token minted by the signed-out page, even from an admin", async () => {
      currentUser = { id: "the-admin" };
      adminIds = ["the-admin"];
      setHeaders(csrfHeaders());

      const res: any = await adminMiddleware(params(), handler);
      expect(res.status).toBe(401);
    });

    it("refuses a token issued for somebody else", async () => {
      currentUser = { id: "the-admin" };
      adminIds = ["the-admin", "other-admin"];
      setHeaders(csrfHeaders("other-admin"));

      const res: any = await adminMiddleware(params(), handler);
      expect(res.status).toBe(401);
    });

    it("refuses a token that was not signed by this deployment", async () => {
      currentUser = { id: "the-admin" };
      adminIds = ["the-admin"];
      setHeaders({ "X-Apiker-Csrf": `${createJWT({ sub: "the-admin" })}tampered` });

      const res: any = await adminMiddleware(params(), handler);
      expect(res.status).toBe(401);
    });
  });

  /**
   * The bundle renders the login form, so it has to answer to signed-out visitors
   * — but only the ones allowed to reach the panel at all.
   */
  describe("the panel bundle", () => {
    const staticRoute = () => getAdminRoutes()["/admp/static.js"];

    it("is served to a signed-out visitor on an allowed network", async () => {
      const res: any = await staticRoute()(params());

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/javascript");
    });

    it("is withheld from a network the panel itself refuses", async () => {
      apiker.env.ADMP_IP_WHITELIST = "9.9.9.9";

      const res: any = await staticRoute()(params());

      expect(res.status).toBe(401);
    });

    it("is served when the whitelist allows the caller", async () => {
      apiker.env.ADMP_IP_WHITELIST = "1.2.3.4";

      const res: any = await staticRoute()(params());

      expect(res.status).toBe(200);
    });
  });

  describe("adminWhitelistMiddleware", () => {
    it("is inert when nothing is configured", async () => {
      expect(await adminWhitelistMiddleware(params())).toBeUndefined();
    });

    it("rejects an address outside the allowed one", async () => {
      apiker.env.ADMP_IP_WHITELIST = "9.9.9.9";

      const res: any = await adminWhitelistMiddleware(params());
      expect(res.status).toBe(401);
    });

    it("accepts the allowed address", async () => {
      apiker.env.ADMP_IP_WHITELIST = "1.2.3.4";

      expect(await adminWhitelistMiddleware(params())).toBeUndefined();
    });

    // An admin moves between networks; one variable has to cover all of them.
    it("accepts any address in a comma-separated list", async () => {
      apiker.env.ADMP_IP_WHITELIST = "9.9.9.9, 1.2.3.4 ,8.8.8.8";

      expect(await adminWhitelistMiddleware(params())).toBeUndefined();
    });

    it("still rejects an address missing from the list", async () => {
      apiker.env.ADMP_IP_WHITELIST = "9.9.9.9,8.8.8.8";

      const res: any = await adminWhitelistMiddleware(params());
      expect(res.status).toBe(401);
    });

    it("does not treat a partial match as a member of the list", async () => {
      apiker.env.ADMP_IP_WHITELIST = "1.2.3.44";

      const res: any = await adminWhitelistMiddleware(params());
      expect(res.status).toBe(401);
    });

    it("rejects an unexpected city", async () => {
      apiker.env.ADMP_CITY_WHITELIST = "Porto";

      const res: any = await adminWhitelistMiddleware(params());
      expect(res.status).toBe(401);
    });
  });
});
