import { z } from "zod";

/**
 * Kenyan mobile number normaliser (FE-32, ADR-0009).
 *
 * People type numbers in many forms: 0712 345 678, +254 712 345 678,
 * 254712345678, 0757-000-001. The backend's sign-in (allauth) accepts only the
 * international E.164 form, "+254712345678" (contract point F-3). This turns a
 * typed number into that form, or returns null.
 *
 * Accepted: Kenyan mobile numbers, which have 9 digits after the country code
 * starting with 7 or 1 (07…, 01…). Rejected: landlines (020…), other
 * countries, wrong lengths.
 *
 * This is a convenience for the customer. The backend validates again and
 * is the authority: never treat a passing check here as proof the number is
 * valid. The test list lives in shared/test-fixtures/phone-numbers.json and is
 * used by both frontend and backend tests.
 */

const SEPARATORS = /[\s\-.()]/g;
const NATIONAL_MOBILE = /^[17]\d{8}$/;

export function normaliseKenyanMobile(input: string): string | null {
  const compact = input.trim().replace(SEPARATORS, "");
  if (compact.length === 0 || compact.length > 16) return null;

  let national: string;
  if (compact.startsWith("+254")) national = compact.slice(4);
  else if (compact.startsWith("254")) national = compact.slice(3);
  else if (compact.startsWith("0")) national = compact.slice(1);
  else return null;

  return NATIONAL_MOBILE.test(national) ? `+254${national}` : null;
}

export const PHONE_ERROR_MESSAGE = "Enter a Kenyan mobile number, for example 0712 345 678.";

/** Zod schema for forms: validates and outputs the E.164 form. */
export const kenyanMobileSchema = z
  .string()
  .trim()
  .min(1, { message: "Enter your mobile number." })
  .transform((value, ctx) => {
    const e164 = normaliseKenyanMobile(value);
    if (!e164) {
      ctx.addIssue({ code: "custom", message: PHONE_ERROR_MESSAGE });
      return z.NEVER;
    }
    return e164;
  });
