import { BasketButton } from "@/components/navigation/basket-button";
import { Logo } from "@/components/navigation/logo";
import { SearchBox } from "@/components/navigation/search-box";

import { AnnouncementBar } from "./announcement-bar";
import { PageContainer } from "./page-container";

export interface SiteHeaderProps {
  announcements?: readonly string[];
  basketCount?: number;
}

/**
 * Desktop: logo · search · basket on one row (design p1).
 * Mobile: logo and basket on one row, full-width search underneath (design p2).
 */
export function SiteHeader({ announcements, basketCount }: SiteHeaderProps) {
  return (
    <header className="border-b border-line bg-cream">
      <AnnouncementBar messages={announcements} />
      <PageContainer className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-4 py-4 md:grid-cols-[auto_1fr_auto] md:py-5">
        {/* Source order = phone visual order (logo, basket, search) so Tab follows what
            people see (review A11Y-4); the grid places search in the middle from md. */}
        <Logo className="justify-self-start" />
        <div className="col-start-2 row-start-1 justify-self-end md:col-start-3">
          <BasketButton count={basketCount} />
        </div>
        <div className="col-span-2 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1">
          <SearchBox />
        </div>
      </PageContainer>
    </header>
  );
}
