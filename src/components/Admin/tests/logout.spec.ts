import { describe, it, expect, beforeEach } from "@jest/globals";
import { apiker } from "../../Apiker";
import { logoutEndpoint } from "../Api/logoutEndpoint";

/** Unit tests for ending an admin session. */
describe("Logout endpoint", () => {
  beforeEach(() => {
    apiker.responseHeaders = new Headers();
  });

  it("clears the session cookie", async () => {
    const res: any = await logoutEndpoint({} as any);

    expect(res.status).toBe(200);
    expect(apiker.responseHeaders.get("Set-Cookie")).toMatch(/apikerToken=;/);
    expect(apiker.responseHeaders.get("Set-Cookie")).toMatch(/Max-Age=0/i);
  });
});
