"use client";

import { useEffect } from "react";

import { userMessageFor } from "@/api/errors";

/**
 * Error boundary for every page under the root layout. In production, errors
 * from Server Components arrive with a generic message and a `digest` id that
 * matches the server log; details are never shown to the customer.
 *
 * Deliberately light (review PERF-2): Next.js loads this file on every page,
 * so it uses plain markup instead of ErrorState/Button, which would pull
 * tailwind-merge, class-variance-authority and the icon library into every
 * page's JavaScript. It keeps the same look as ErrorState.
 */
export default function RouteError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // Replaced by Sentry reporting when monitoring is set up (ADR-0007).
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-[calc(var(--container-page)+10rem)] px-5 py-12 sm:px-8 md:py-20 lg:px-12 xl:px-20">
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-card border-2 border-accent/30 bg-card px-6 py-10 text-center"
      >
        <h1 className="font-display text-h3 font-extrabold text-ink">Something went wrong</h1>
        <p className="max-w-prose text-sub text-ink-muted">{userMessageFor(error)}</p>
        <button
          type="button"
          onClick={retry}
          className="mt-2 inline-flex h-11 items-center justify-center rounded-control border-2 border-border-strong bg-card px-5 font-semibold text-ink hover:bg-tint"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
