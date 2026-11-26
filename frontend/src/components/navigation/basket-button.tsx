import { ShoppingBasket } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Link to the basket with its item count. The basket lives on the server
 * (D-015); the count will come from the basket API in Phase 5. Until then
 * `count` is undefined and no number is shown, rather than a made-up "0".
 */
export function BasketButton({ count, className }: { count?: number; className?: string }) {
  const hasCount = typeof count === "number";
  const label = hasCount ? `Basket, ${count} ${count === 1 ? "item" : "items"}` : "Basket";
  return (
    <Link
      href="/basket"
      aria-label={label}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-2 rounded-pill bg-accent px-4 font-semibold text-accent-foreground hover:bg-accent/90",
        className,
      )}
    >
      <ShoppingBasket aria-hidden="true" className="size-5" />
      <span aria-hidden="true" className="hidden sm:inline">
        Basket
      </span>
      {hasCount ? <span aria-hidden="true">({count})</span> : null}
    </Link>
  );
}
