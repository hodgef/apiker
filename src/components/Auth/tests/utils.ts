import { describe, it, expect, beforeEach } from "@jest/globals";
import { apiker } from "../../Apiker";
import {
  compare_bcrypt,
  createJWT,
  decodeString,
  encodeString,
  extractToken,
  getClientId,
  getRawIp,
  getSignedIp,
  getTokens,
  hash_bcrypt,
  parseJWT,
  randomHash,
  sign,
  sign_sha1,
  sign_sha256,
} from "../Apiker/utils";

/**
 * Configures the request context used by the auth utilities.
 */
const setRequest = (url = "https://api.test/path", headers: Record<string, string> = {}) => {
  apiker.requestParams = {
    headers: new Headers({ "CF-Connecting-IP": "1.2.3.4", "User-Agent": "jest", ...headers }),
    request: new Request(url),
  } as any;
};

/**
 * Unit tests for the auth crypto/token utilities.
 */
describe("Auth utils", () => {
  beforeEach(() => {
    apiker.env = { APIKER_SECRET_KEY: "super-secret" };
    setRequest();
  });

  describe("encodeString / decodeString", () => {
    it("round-trips a JSON payload", () => {
      const enc = encodeString(JSON.stringify({ a: 1, b: "x" }));
      expect(decodeString(enc)).toEqual({ a: 1, b: "x" });
    });
  });

  describe("createJWT / parseJWT", () => {
    it("round-trips a payload", () => {
      const token = createJWT({ sub: "u1" });
      expect(parseJWT(token, true)?.sub).toBe("u1");
    });

    it("rejects a token with a tampered signature", () => {
      const token = createJWT({ sub: "u1" });
      expect(parseJWT(`${token}tampered`, true)).toBeUndefined();
    });

    it("rejects an empty token", () => {
      expect(parseJWT("", true)).toBeUndefined();
    });

    it("rejects a token whose clientId does not match the caller", () => {
      const token = createJWT({ sub: "u1", clientId: "someone-else" });
      expect(parseJWT(token)).toBeUndefined();
    });
  });

  describe("bcrypt", () => {
    it("hashes and verifies a matching value", () => {
      const hash = hash_bcrypt("secret-pw");
      expect(compare_bcrypt("secret-pw", hash)).toBe(true);
    });

    it("rejects a non-matching value", () => {
      const hash = hash_bcrypt("secret-pw");
      expect(compare_bcrypt("wrong-pw", hash)).toBe(false);
    });
  });

  describe("signing", () => {
    it("sign is deterministic for the same input", () => {
      expect(sign("message")).toBe(sign("message"));
    });

    it("sign throws when APIKER_SECRET_KEY is missing", () => {
      apiker.env = {};
      expect(() => sign("message")).toThrow("APIKER_SECRET_KEY");
    });

    it("sign_sha256 and sign_sha1 return hex strings", () => {
      expect(sign_sha256("m")).toMatch(/^[0-9a-f]+$/);
      expect(sign_sha1("m")).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("randomHash", () => {
    it("returns a 64-char hex string and differs between calls", () => {
      const a = randomHash();
      const b = randomHash();
      expect(a).toMatch(/^[0-9a-f]{64}$/);
      expect(a).not.toBe(b);
    });
  });

  describe("client identifiers", () => {
    it("getRawIp returns the CF-Connecting-IP header", () => {
      expect(getRawIp()).toBe("1.2.3.4");
    });

    it("getSignedIp returns a stable signed hash of the IP", () => {
      expect(getSignedIp()).toBe(sign_sha1("1.2.3.4"));
    });

    it("getClientId returns a signed hash string", () => {
      expect(getClientId()).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("extractToken", () => {
    it("reads a Bearer token from the Authorization header", () => {
      setRequest("https://api.test/path", { Authorization: "Bearer header-token" });
      expect(extractToken()).toBe("header-token");
    });

    it("reads a token from the apikerToken cookie", () => {
      setRequest("https://api.test/path", { Cookie: "apikerToken=Bearer cookie-token" });
      expect(extractToken()).toBe("cookie-token");
    });

    it("reads a token from the ?t query parameter", () => {
      setRequest("https://api.test/path?t=query-token");
      expect(extractToken()).toBe("query-token");
    });

    it("returns an empty string when no token is present", () => {
      setRequest();
      expect(extractToken()).toBe("");
    });
  });

  describe("getTokens", () => {
    it("returns a token and refresh token bound to the user id", () => {
      const { userId, token, refreshToken } = getTokens("user-123");
      expect(userId).toBe("user-123");
      expect(parseJWT(token)?.sub).toBe("user-123");
      expect(parseJWT(refreshToken)?.isRefreshToken).toBe(true);
    });
  });
});
