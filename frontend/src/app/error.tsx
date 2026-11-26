"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/common/error-state";
import { PageContainer } from "@/components/layout/page-container";

/**
 * Error boundary for every page under the root layout. In production, errors
 * from Server Components arrive with a generic message and a `digest` id that
 * matches the server log; details are never shown to the customer.
 */
export default function RouteError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // Replaced by Sentry reporting when monitoring is set up (ADR-0007).
    console.error(error);
  }, [error]);

  return (
    <PageContainer className="py-12 md:py-20">
      <h1 className="sr-only">Error</h1>
      <ErrorState error={error} onRetry={retry} />
    </PageContainer>
  );
}
