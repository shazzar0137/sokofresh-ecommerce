import { cn } from "@/lib/utils";
import { formatAmount, formatKES } from "@/utils/money";

function isWholeShillings(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

/**
 * Current price with an optional struck-through old price (FE-04, FR-03).
 * Values come from the API; nothing is calculated here.
 *
 * Strikethrough is not announced by screen readers, so they get hidden
 * text instead: "KES 30, was KES 50". The visible struck-through price is
 * hidden from them to avoid hearing it twice, and on product cards it is shown
 * from the `sm` width only, as in the mobile design.
 *
 * An invalid amount (not whole, negative) renders "Price unavailable"
 * instead of crashing the page (review ARCH-9); the catalogue mapper in
 * Phase 4 should stop such data before it gets here.
 */
export interface PriceDisplayProps {
  price: number;
  wasPrice?: number | null;
  /** "card": old price without "KES" (product cards). "full": with "KES" (meal kits). */
  wasStyle?: "card" | "full";
  size?: "md" | "lg";
  /** Colour scheme for use on dark or coloured panels (meal-kit cards). */
  onDark?: boolean;
  className?: string;
}

export function PriceDisplay({ price, wasPrice, wasStyle = "card", size = "md", onDark = false, className }: PriceDisplayProps) {
  if (!isWholeShillings(price)) {
    console.error("PriceDisplay: invalid price", price);
    return <p className={cn("text-small font-semibold text-ink-muted", className)}>Price unavailable</p>;
  }
  const showWas = typeof wasPrice === "number" && isWholeShillings(wasPrice) && wasPrice > price;
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span
        className={cn(
          "font-sans font-bold",
          size === "lg" ? "text-[1.5rem] md:text-[1.75rem]" : "text-[1rem] md:text-[1.125rem]",
          onDark ? "text-current" : "text-price",
        )}
      >
        {formatKES(price)}
      </span>
      {showWas ? (
        <>
          <span className="sr-only">, was {formatKES(wasPrice)}</span>
          <del
            aria-hidden="true"
            className={cn(
              "text-small",
              onDark ? "text-current/80" : "text-price-was",
              wasStyle === "card" && "hidden sm:inline",
            )}
          >
            {wasStyle === "full" ? formatKES(wasPrice) : formatAmount(wasPrice)}
          </del>
        </>
      ) : null}
    </p>
  );
}
