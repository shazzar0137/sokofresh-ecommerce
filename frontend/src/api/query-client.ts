import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "./errors";

const MAX_RETRIES = 2;

/**
 * Retries only failures that can fix themselves (network, timeout, 502/503/504),
 * never client errors such as 401, 404 or 422: repeating those wastes the
 * customer's data and, for sign-in codes, could hit rate limits.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  return error instanceof ApiError && error.isRetryable;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Prices and stock change during the day; 30 s avoids refetching on every navigation.
        staleTime: 30_000,
        retry: shouldRetry,
        refetchOnWindowFocus: true,
      },
      mutations: {
        // Never repeat a write automatically (basket changes, orders).
        retry: false,
      },
    },
  });
}
