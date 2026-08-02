import { describe, it, expect } from "@jest/globals";
import { apiker } from "..";

/**
 * Additional unit tests for apiker.init() option handling, complementing the
 * smoke test in Apiker.js.
 */
describe("apiker.init() options", () => {
  const baseOptions = () => ({
    routes: { "/x": () => new Response() },
    objects: ["Common"],
    exports: {} as any,
  });

  it("returns a Response instead of throwing when required params are missing", () => {
    const result = apiker.init({} as any);
    expect(result).toBeInstanceOf(Response);
  });

  it("applies default object-state mappings", () => {
    apiker.init(baseOptions());
    expect(apiker.objectStateMapping.RateLimit).toBe("signedIp");
    expect(apiker.objectStateMapping.Logs).toBe("signedIp");
    expect(apiker.objectStateMapping.Bans).toBe("userId");
  });

  it("merges user overrides onto the default object-state mappings", () => {
    apiker.init({ ...baseOptions(), objectStateMapping: { Bans: "customId" } });
    expect(apiker.objectStateMapping.Bans).toBe("customId");
    expect(apiker.objectStateMapping.RateLimit).toBe("signedIp");
  });

  it("prepends the built-in auth routes when authRoutes is enabled", () => {
    apiker.init({ ...baseOptions(), authRoutes: true });
    expect(apiker.routes["/auth/login"]).toBeDefined();
    expect(apiker.routes["/auth/register"]).toBeDefined();
    expect(apiker.routes["/x"]).toBeDefined();
  });

  it("prepends the admin panel routes when adminPanel is enabled", () => {
    apiker.init({ ...baseOptions(), adminPanel: true });
    const hasAdminRoute = Object.keys(apiker.routes).some((r) => r.startsWith("/admp"));
    expect(hasAdminRoute).toBe(true);
  });

  it("exports a Durable Object class for every named object", () => {
    const exportsObj: any = {};
    apiker.init({ ...baseOptions(), objects: ["Common", "Users"], exports: exportsObj });
    expect(typeof exportsObj.Common).toBe("function");
    expect(typeof exportsObj.Users).toBe("function");
    expect(typeof exportsObj.handlers.fetch).toBe("function");
  });

  it("assigns controllers and a custom name", () => {
    class Ctrl {}
    apiker.init({ ...baseOptions(), controllers: { Ctrl }, name: "MyApi" });
    expect(apiker.controllers.Ctrl).toBe(Ctrl);
    expect(apiker.name).toBe("MyApi");
  });
});
