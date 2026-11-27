import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge must know our custom type-scale names (from globals.css
 * `--text-*`). Without this it reads `text-body` as a text *colour* and
 * removes a component's real colour class (e.g. `text-brand-foreground`),
 * which once gave primary buttons dark text on green.
 */
export const FONT_SIZE_TOKENS = [
  "display",
  "h1",
  "h2",
  "h3",
  "product",
  "lead",
  "sub",
  "body",
  "small",
  "caption",
  "micro",
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [...FONT_SIZE_TOKENS],
    },
  },
});

/**
 * Joins class names and resolves Tailwind conflicts, so a caller's
 * `className="px-6"` correctly overrides a component's default `px-4`.
 * (Standard shadcn/ui helper.)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
