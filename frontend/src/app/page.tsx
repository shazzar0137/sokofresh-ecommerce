import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

/**
 * Home page: Phase 3 shows only the hero copy from the design. Meal kits,
 * the product grid, the delivery-area picker and trust messages need the
 * catalogue and store-settings APIs (Phase 4) and are not faked here.
 */
export default function HomePage() {
  return (
    <section aria-labelledby="hero-title" className="bg-cream py-12 md:py-20">
      <PageContainer>
        <div className="max-w-[40rem]">
          <h1 id="hero-title" className="font-display text-display font-extrabold text-ink">
            Picked at dawn. At your gate by evening.
          </h1>
          <p className="mt-5 text-lead text-ink-muted">
            Vegetables from Kinangop, mangoes from Kitui, tilapia from Lake Victoria. Order from the farmers you
            already trust, without the trip to the market.
          </p>
          <Button asChild size="lg" className="mt-8 w-full sm:w-auto">
            <Link href="/shop">Start shopping</Link>
          </Button>
        </div>
      </PageContainer>
    </section>
  );
}
