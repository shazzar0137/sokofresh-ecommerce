import { z } from "zod";

/**
 * Kenyan mobile number normaliser (FE-32, ADR-0009).
 *
 * People type numbers in many forms: 0712 345 678, +254 712 345 678,
 * 254712345678, 0757-000-001. The backend's sign-in (allauth) accepts only the
 * international E.164 form, "+254712345678" (contract point F-3). This turns a
 * typed number into that form, or returns null.
 *
 * Accepted: Kenyan mobile numbers, which have 9 digits after the country code:
 * any 7xx range, and the 1xx ranges the backend's phone library (libphonenumber)
 * treats as mobile. Rejected: unassigned 1xx ranges such as 015…, landlines
 * (020…), other countries, wrong lengths. Matching the backend here (review
 * finding API-4) saves customers a confusing round trip; the shared test list
 * fails on both sides if the two ever disagree.
 *
 * This is a convenience for the customer. The backend validates again and
 * is the authority: never treat a passing check here as proof the number is
 * valid. The test list lives in shared/test-fixtures/phone-numbers.json and is
 * used by both frontend and backend tests.
 */

const SEPARATORS = /[\s\-.()]/g;
// 7xx: all mobile. 1xx: 100-108, 110-121, 124, 130, 135-146, 180-189.
const NATIONAL_MOBILE = /^(?:7\d{2}|1(?:0[0-8]|1\d|2[0-14]|3[05-9]|4[0-6]|8\d))\d{6}$/;

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
