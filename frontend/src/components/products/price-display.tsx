import { formatAmount, formatKES } from "@/utils/money";
import { cn } from "@/lib/utils";

/**
 * Current price with an optional struck-through old price (FE-04, FR-03).
 * Values come from the API; nothing is calculated here.
 *
 * Strikethrough is not announced by screen readers, so the old price is
 * prefixed with hidden "was" text: "KES 30, was 50".
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
  const showWas = typeof wasPrice === "number" && wasPrice > price;
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
        <span className={cn("text-small", onDark ? "text-current/80" : "text-price-was")}>
          <span className="sr-only">, was </span>
          <del>{wasStyle === "full" ? formatKES(wasPrice) : formatAmount(wasPrice)}</del>
        </span>
      ) : null}
    </p>
  );
}
