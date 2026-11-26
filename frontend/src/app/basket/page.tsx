import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/common/states";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your basket" };

/** Basket placeholder (Phase 3). The server-side basket (D-015) is built in Phase 5. */
export default function BasketPage() {
  return (
    <PageContainer className="py-12 md:py-16">
      <h1 className="mb-6 font-display text-h1 font-extrabold text-ink">Your basket</h1>
      <EmptyState
        title="Your basket is empty"
        description="Products you add will appear here."
        action={
          <Button asChild>
            <Link href="/shop">Start shopping</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
