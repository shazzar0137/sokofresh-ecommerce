import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Product search (FE-06). A plain HTML form that loads /shop?q=…, so it works
 * before JavaScript loads and the results page has a shareable address.
 * Search itself is done by the backend (PostgreSQL search, ADR-0003).
 */
export function SearchBox({ className, defaultValue }: { className?: string; defaultValue?: string }) {
  return (
    <form action="/shop" method="get" role="search" className={cn("flex w-full", className)}>
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        enterKeyHint="search"
        maxLength={100}
        defaultValue={defaultValue}
        placeholder="Search sukuma, mangoes, unga…"
        className="h-12 min-w-0 flex-1 rounded-l-pill border-2 border-r-0 border-border-strong bg-card px-5 text-body text-ink placeholder:text-ink-muted"
      />
      <button
        type="submit"
        className="inline-flex h-12 items-center gap-2 rounded-r-pill bg-ink px-4 font-semibold text-cream hover:bg-ink/85 sm:px-6"
      >
        <Search aria-hidden="true" className="size-5 sm:hidden" />
        <span className="sr-only sm:not-sr-only">Search</span>
      </button>
    </form>
  );
}
