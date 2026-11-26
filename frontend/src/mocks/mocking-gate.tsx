"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Starts the MSW service worker before the app makes API calls, but only when
 * NEXT_PUBLIC_API_MOCKING=enabled in a development build (ADR-0009).
 *
 * The condition is written inline with `process.env.*` on purpose: Next.js
 * replaces these with literal values at build time, so in production builds
 * the whole branch, including the `import("./browser")`, is removed and the MSW
 * code is never shipped. (MSW's browser module also refuses to load on the
 * server, so it must only ever be imported here, inside useEffect.)
 */
const MOCKING =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

export function MockingGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!MOCKING);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_API_MOCKING !== "enabled") return;
    let cancelled = false;
    import("./browser")
      .then(({ worker }) => worker.start({ onUnhandledFrame: "bypass", quiet: true }))
      .catch((error: unknown) => console.error("MSW failed to start", error))
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready ? children : null;
}
