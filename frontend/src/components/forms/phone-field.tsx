"use client";

import type { ComponentProps } from "react";

import { TextField } from "./text-field";

/**
 * Kenyan mobile number field (M-Pesa number, sign-in). Brings up the phone
 * keypad, lets the phone's autofill offer the number, and accepts any common
 * format; validation and E.164 conversion live in utils/phone.ts.
 */
export function PhoneField({
  label = "M-Pesa number",
  hint = "For example 0712 345 678",
  ...props
}: Partial<ComponentProps<typeof TextField>>) {
  return (
    <TextField
      label={label}
      hint={hint}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      maxLength={20}
      {...props}
    />
  );
}
