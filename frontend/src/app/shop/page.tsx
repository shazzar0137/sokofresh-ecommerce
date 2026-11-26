import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/common/states";
import { PageContainer } from "@/components/layout/page-container";
import { SearchSummary } from "@/features/search/search-summary";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Shop" };

/**
 * Catalogue placeholder (Phase 3). The real product grid, categories and
 * search results arrive with the catalogue API in Phase 4.
 */
export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <PageContainer className="py-12 md:py-16">
      <h1 className="mb-6 font-display text-h1 font-extrabold text-ink">Fresh from the soko</h1>
      <Suspense fallback={null}>
        <SearchSummary searchParams={searchParams} />
      </Suspense>
      <EmptyState
        title="The shop is opening soon"
        description="We're getting today's produce ready. Products and prices will appear here."
        action={
          <Button asChild variant="outline">
            <Link href="/">Back to the home page</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
