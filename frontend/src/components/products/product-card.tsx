import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { PriceDisplay } from "./price-display";
import { DiscountBadge, OriginLine, StockNote } from "./product-labels";

/**
 * Product card layout from the design (FE-04): pastel photo tile with an
 * optional discount badge, then name, local name and origin, stock note,
 * price and an action slot.
 *
 * This is a presentation primitive only: it receives plain values and an
 * `action` element. The real catalogue data (Phase 4) and the "Add to basket"
 * behaviour with the server basket (Phase 5) are wired in later.
 */

export const TILE_TONES = {
  green: "bg-tile-green",
  rose: "bg-tile-rose",
  lilac: "bg-tile-lilac",
  lime: "bg-tile-lime",
  mango: "bg-tile-mango",
  avocado: "bg-tile-avocado",
  lemon: "bg-tile-lemon",
  maize: "bg-tile-maize",
  rice: "bg-tile-rice",
  wheat: "bg-tile-wheat",
  sky: "bg-tile-sky",
  shell: "bg-tile-shell",
  lake: "bg-tile-lake",
  peach: "bg-tile-peach",
  mint: "bg-tile-mint",
} as const;

export type TileTone = keyof typeof TILE_TONES;

export interface ProductCardProps {
  name: string;
  localName?: string;
  localNameLang?: "sw" | "en";
  origin?: string;
  price: number;
  wasPrice?: number | null;
  discountPercent?: number | null;
  stockRemaining: number;
  stockIsLow: boolean;
  tone?: TileTone;
  /** Product image (next/image) or decorative placeholder. */
  media: ReactNode;
  /** Usually the add-to-basket control. */
  action?: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
}

export function ProductCard({
  name,
  localName,
  localNameLang,
  origin,
  price,
  wasPrice,
  discountPercent,
  stockRemaining,
  stockIsLow,
  tone = "rice",
  media,
  action,
  headingLevel = 3,
  className,
}: ProductCardProps) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-card border border-line bg-card shadow-card",
        className,
      )}
    >
      <div className={cn("relative flex aspect-[242/130] items-center justify-center", TILE_TONES[tone])}>
        {discountPercent ? <DiscountBadge percent={discountPercent} className="absolute top-2 left-2" /> : null}
        {media}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 md:p-4">
        <H className="font-display text-product font-extrabold text-ink">{name}</H>
        <OriginLine localName={localName} localNameLang={localNameLang} origin={origin} />
        <StockNote remaining={stockRemaining} isLow={stockIsLow} />
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <PriceDisplay price={price} wasPrice={wasPrice} />
          {action}
        </div>
      </div>
    </article>
  );
}
