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
