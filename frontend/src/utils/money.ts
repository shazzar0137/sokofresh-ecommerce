/**
 * Money display. The API sends prices as whole Kenyan shillings (integers,
 * backend API.md "Money"). The frontend only formats them; it never calculates
 * prices, discounts, fees or totals (the browser is untrusted).
 */

const kesNumber = new Intl.NumberFormat("en-KE", {
  maximumFractionDigits: 0,
  useGrouping: true,
});

/** Non-breaking space, so "KES" never wraps away from the amount. */
const NBSP = " ";

function assertWholeShillings(amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new RangeError(`Expected a whole, non-negative number of shillings, got ${amount}`);
  }
}

/** 1090 → "KES 1,090" */
export function formatKES(amount: number): string {
  assertWholeShillings(amount);
  return `KES${NBSP}${kesNumber.format(amount)}`;
}

/** 1090 → "1,090" (for the struck-through old price on product cards, which omits "KES"). */
export function formatAmount(amount: number): string {
  assertWholeShillings(amount);
  return kesNumber.format(amount);
}

/** Words for screen readers: 1090 → "1,090 Kenyan shillings". */
export function spokenKES(amount: number): string {
  assertWholeShillings(amount);
  return `${kesNumber.format(amount)} Kenyan shillings`;
}
