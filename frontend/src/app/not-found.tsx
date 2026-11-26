import Link from "next/link";

import { EmptyState } from "@/components/common/states";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageContainer className="py-12 md:py-20">
      <h1 className="mb-6 font-display text-h1 font-extrabold text-ink">Page not found</h1>
      <EmptyState
        title="We couldn't find that page"
        description="It may have moved, or the link may be wrong."
        action={
          <Button asChild>
            <Link href="/">Go to the home page</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
