import { describe, expect, it } from "vitest";

import { formatAmount, formatKES, spokenKES } from "@/utils/money";

const NBSP = " ";

describe("formatKES", () => {
  it.each([
    [0, `KES${NBSP}0`],
    [30, `KES${NBSP}30`],
    [1090, `KES${NBSP}1,090`],
    [1500, `KES${NBSP}1,500`],
    [1_234_567, `KES${NBSP}1,234,567`],
  ])("formats %i as %s", (amount, expected) => {
    expect(formatKES(amount)).toBe(expected);
  });

  it("keeps KES and the amount together with a non-breaking space", () => {
    expect(formatKES(120)).not.toContain(" ");
  });

  it.each([-1, 12.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 2])(
    "rejects %s (prices are whole, non-negative shillings)",
    (bad) => {
      expect(() => formatKES(bad)).toThrow(RangeError);
    },
  );
});

describe("formatAmount and spokenKES", () => {
  it("formats the old price without the currency", () => {
    expect(formatAmount(1100)).toBe("1,100");
  });
  it("spells out the currency for screen readers", () => {
    expect(spokenKES(1600)).toBe("1,600 Kenyan shillings");
  });
  it("validates like formatKES", () => {
    expect(() => formatAmount(-5)).toThrow(RangeError);
    expect(() => spokenKES(0.5)).toThrow(RangeError);
  });
});
