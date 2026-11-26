import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins class names and resolves Tailwind conflicts, so a caller's
 * `className="px-6"` correctly overrides a component's default `px-4`.
 * (Standard shadcn/ui helper.)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
