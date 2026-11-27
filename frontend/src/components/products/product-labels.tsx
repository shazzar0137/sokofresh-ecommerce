import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** "Save 40%": the percentage comes from the API (FR-03), never computed here. */
export function DiscountBadge({ percent, className }: { percent: number; className?: string }) {
  if (!Number.isFinite(percent) || percent <= 0) return null;
  return (
    <Badge variant="discount" className={className}>
      Save {Math.round(percent)}%
    </Badge>
  );
}

/**
 * Daily stock note (FR-04). Shows "Only N left today" when the backend marks
 * stock as low, and "Sold out today" at zero. Colour is not the only signal:
 * the words carry the meaning.
 */
export function StockNote({
  remaining,
  isLow,
  className,
}: {
  remaining: number;
  isLow: boolean;
  className?: string;
}) {
  if (remaining <= 0) {
    return <p className={cn("text-caption font-bold text-ink-muted", className)}>Sold out today</p>;
  }
  if (!isLow) return null;
  return <p className={cn("text-caption font-bold text-stock-low", className)}>Only {remaining} left today</p>;
}

/**
 * Second line on a product card: local name and origin, e.g.
 * "Nyanya · from Kirinyaga". `localNameLang` marks Swahili words so screen
 * readers pronounce them correctly (NFR-09).
 */
export function OriginLine({
  localName,
  localNameLang = "sw",
  origin,
  className,
}: {
  localName?: string;
  localNameLang?: "sw" | "en";
  origin?: string;
  className?: string;
}) {
  if (!localName && !origin) return null;
  return (
    <p className={cn("text-small text-ink-muted", className)}>
      {localName ? <span lang={localNameLang}>{localName}</span> : null}
      {localName && origin ? <span aria-hidden="true"> · </span> : null}
      {localName && origin ? <span className="sr-only">, </span> : null}
      {origin ? <span>from {origin}</span> : null}
    </p>
  );
}
