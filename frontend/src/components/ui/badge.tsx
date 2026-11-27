import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Small labels.
 * - discount: red "Save 40%" on product photos
 * - sticker: gold "Picked 5am today"
 * - neutral: white chip ("From Kirinyaga")
 */
export const badgeVariants = cva(
  "inline-flex items-center rounded-pill font-sans font-bold whitespace-nowrap",
  {
    variants: {
      variant: {
        discount: "bg-discount px-2.5 py-0.5 text-micro text-accent-foreground",
        sticker: "bg-gold px-3 py-1 text-small text-gold-foreground",
        neutral: "bg-card px-3 py-1 text-small text-ink",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}
