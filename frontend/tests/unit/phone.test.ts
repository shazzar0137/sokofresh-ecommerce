import { describe, expect, it } from "vitest";

import fixtures from "@shared/test-fixtures/phone-numbers.json";
import { kenyanMobileSchema, normaliseKenyanMobile, PHONE_ERROR_MESSAGE } from "@/utils/phone";

// The same list the backend tests use (ADR-0011 item 11), so both apps agree.
describe("normaliseKenyanMobile against shared/test-fixtures/phone-numbers.json", () => {
  it("has fixtures to test", () => {
    expect(fixtures.valid.length).toBeGreaterThan(0);
    expect(fixtures.invalid.length).toBeGreaterThan(0);
  });

  it.each(fixtures.valid.map((c) => [c.input, c.e164, c.note]))("accepts %j → %s (%s)", (input, e164) => {
    expect(normaliseKenyanMobile(input)).toBe(e164);
  });

  it.each(fixtures.invalid.map((c) => [c.input, c.note]))("rejects %j (%s)", (input) => {
    expect(normaliseKenyanMobile(input)).toBeNull();
  });
});

describe("normaliseKenyanMobile edge cases", () => {
  it.each([
    ["  0712345678  ", "+254712345678"],
    ["(0712) 345.678", "+254712345678"],
  ])("tolerates surrounding space and punctuation: %j", (input, e164) => {
    expect(normaliseKenyanMobile(input)).toBe(e164);
  });

  it.each([
    ["+2540712345678", "zero after the country code"],
    ["712345678", "no prefix at all"],
    ["0812345678", "08 is not a mobile range"],
    ["07123456a8", "letter inside"],
    ["+254 712 345 678 999 999", "far too long"],
    ["++254712345678", "double plus"],
  ])("rejects %j (%s)", (input) => {
    expect(normaliseKenyanMobile(input)).toBeNull();
  });
});

describe("kenyanMobileSchema", () => {
  it("outputs the E.164 form for valid input", () => {
    expect(kenyanMobileSchema.parse("0757-000-001")).toBe("+254757000001");
  });

  it("asks for a number when empty", () => {
    const result = kenyanMobileSchema.safeParse("   ");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter your mobile number.");
  });

  it("explains the expected format for an invalid number", () => {
    const result = kenyanMobileSchema.safeParse("0201234567");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(PHONE_ERROR_MESSAGE);
  });
});
