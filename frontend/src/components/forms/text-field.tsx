"use client";

import { useId, type ComponentProps, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * A labelled input with hint and error text, wired for assistive technology:
 * - the visible <label> is linked to the input (a placeholder is not a label);
 * - hint and error are announced via aria-describedby;
 * - aria-invalid marks the field when there is an error.
 *
 * Works on its own or with React Hook Form: spread `register("phone")` into it.
 */
export interface TextFieldProps extends Omit<ComponentProps<"input">, "id"> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  id?: string;
  containerClassName?: string;
}

export function TextField({ label, hint, error, id, containerClassName, className, ...inputProps }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? `field-${autoId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId, inputProps["aria-describedby"]].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      <Label htmlFor={inputId}>{label}</Label>
      {hint ? (
        <p id={hintId} className="text-small text-ink-muted">
          {hint}
        </p>
      ) : null}
      <Input
        {...inputProps}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={className}
      />
      {error ? (
        <p id={errorId} className="text-small font-semibold text-accent">
          {error}
        </p>
      ) : null}
    </div>
  );
}
