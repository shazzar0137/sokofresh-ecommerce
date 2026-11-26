import type { ComponentProps, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Headings and text in the design's type scale.
 * `level` sets the HTML element (for a correct outline: one h1 per page);
 * `size` sets the look. They are separate on purpose, so a visually large
 * section title can still be an <h2>.
 */

const headingSizes = {
  display: "text-display",
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
  product: "text-product",
} as const;

type HeadingLevel = 1 | 2 | 3 | 4;

export interface HeadingProps extends Omit<ComponentProps<"h2">, "children"> {
  level: HeadingLevel;
  size?: keyof typeof headingSizes;
  children: ReactNode;
}

export function Heading({ level, size, className, ...props }: HeadingProps) {
  const Tag = `h${level}` as ElementType;
  const resolved = size ?? (level === 1 ? "h1" : level === 2 ? "h1" : "h3");
  return (
    <Tag className={cn("font-display font-extrabold text-ink", headingSizes[resolved], className)} {...props} />
  );
}

const textVariants = {
  lead: "text-lead text-ink-muted",
  sub: "text-sub text-ink-muted",
  body: "text-body text-ink",
  small: "text-small text-ink-muted",
  caption: "text-caption text-ink-muted",
} as const;

export interface TextProps extends ComponentProps<"p"> {
  variant?: keyof typeof textVariants;
  as?: "p" | "span" | "div";
}

export function Text({ variant = "body", as: Tag = "p", className, ...props }: TextProps) {
  return <Tag className={cn(textVariants[variant], className)} {...props} />;
}

/** Visible only to screen readers (e.g. "was" before a struck-through price). */
export function VisuallyHidden({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn("sr-only", className)} {...props} />;
}
