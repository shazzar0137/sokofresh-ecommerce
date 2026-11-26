"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { makeQueryClient } from "@/api/query-client";
import { MockingGate } from "@/mocks/mocking-gate";

/**
 * Client-side providers for the whole app. Server Components passed as
 * `children` stay Server Components: wrapping them here does not turn them
 * into browser code.
 */
export function Providers({ children }: { children: ReactNode }) {
  // One QueryClient per browser tab (and per request on the server), never shared between visitors.
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <MockingGate>{children}</MockingGate>
    </QueryClientProvider>
  );
}
