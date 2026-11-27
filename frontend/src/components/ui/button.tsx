import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Button (shadcn/ui pattern, styled from the design).
 * - primary: green "Start shopping" / "Add" buttons
 * - accent: red "Cart" pill
 * - dark: black "Search" button
 * - light: white "Add whole kit" on coloured meal-kit cards
 * - outline: 2 px ink border (secondary actions)
 * - ghost: text-only (icon buttons, "close")
 *
 * Use `asChild` to style a link as a button: <Button asChild><Link href="/shop">…</Link></Button>
 */
export const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-sans font-semibold",
    "transition-colors select-none",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-brand text-brand-foreground hover:bg-brand/90",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90",
        dark: "bg-ink text-cream hover:bg-ink/85",
        light: "bg-card text-ink hover:bg-cream",
        outline: "border-2 border-border-strong bg-card text-ink hover:bg-tint",
        ghost: "text-ink hover:bg-tint",
      },
      size: {
        // Compact "Add" button on product cards: 44 px tall on phones (touch
        // target, analysis §4), 36 px from the md width (design 34 px).
        sm: "h-11 px-4 text-[0.9375rem] md:h-9",
        // 44 px: header controls.
        md: "h-11 px-5 text-body",
        // 48 px: main calls to action (design "Start shopping").
        lg: "h-12 px-6 text-[1.0625rem]",
        icon: "size-11",
      },
      shape: {
        control: "rounded-control",
        pill: "rounded-pill",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md", shape: "control", block: false },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  shape,
  block,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      // Default to type="button" so a button inside a form never submits it by accident.
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size, shape, block }), className)}
      {...props}
    />
  );
}
