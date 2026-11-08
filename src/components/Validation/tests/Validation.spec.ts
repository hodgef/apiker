import { describe, it, expect } from "@jest/globals";
import { isEmail, isRequiredLength } from "..";

/**
 * Unit tests for the Validation helpers.
 */
describe("Validation", () => {
  describe("isEmail", () => {
    it.each(["a@b.co", "john.doe@example.com", "x+y@sub.domain.org"])(
      "accepts valid address %s",
      (email) => {
        expect(isEmail(email)).toBe(true);
      }
    );

    it.each(["", "abc", "no-at-symbol", "a@b", "@b.co"])(
      "rejects invalid address %s",
      (email) => {
        expect(isEmail(email)).toBe(false);
      }
    );

    it("rejects undefined without throwing", () => {
      expect(isEmail(undefined as any)).toBeFalsy();
    });

    it("rejects an address that is too long (> 50 chars)", () => {
      const local = "a".repeat(60);
      expect(isEmail(`${local}@example.com`)).toBe(false);
    });

    it("allows an explicit maximum without widening the default", () => {
      const email = `member@${"a".repeat(60)}.${"b".repeat(60)}.${"c".repeat(60)}.${"d".repeat(60)}.com`;
      expect(email).toHaveLength(254);
      expect(isEmail(email)).toBe(false);
      expect(isEmail(email, 254)).toBe(true);
      expect(isEmail(`x${email}`, 254)).toBe(false);
    });

    it("rejects non-string values even if they have a plausible length", () => {
      expect(isEmail({ length: 15, toString: () => "a@example.com" } as any, 254)).toBe(false);
    });
  });

  describe("isRequiredLength", () => {
    it("uses the default bounds (5..20)", () => {
      expect(isRequiredLength("12345")).toBe(true);
      expect(isRequiredLength("1234")).toBe(false);
      expect(isRequiredLength("a".repeat(20))).toBe(true);
      expect(isRequiredLength("a".repeat(21))).toBe(false);
    });

    it("respects custom min/max bounds", () => {
      expect(isRequiredLength("ab", 1, 3)).toBe(true);
      expect(isRequiredLength("abcd", 1, 3)).toBe(false);
      expect(isRequiredLength("a", 2, 3)).toBe(false);
    });

    it("rejects an empty string", () => {
      expect(isRequiredLength("")).toBe(false);
    });
  });
});
