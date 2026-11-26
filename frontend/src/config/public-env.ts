/**
 * Values safe to use in the browser. Anything starting with NEXT_PUBLIC_ is
 * copied into the JavaScript sent to every visitor, so it must never hold a
 * secret. Server-only settings live in backend-origin.ts.
 *
 * Next.js replaces `process.env.NEXT_PUBLIC_…` with literal values at build
 * time, which is why each one is read by its full name here.
 */

export const siteUrl: string = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * MSW mock data is for development only (ADR-0009): production builds can
 * never switch it on, whatever the environment variable says.
 */
export const isApiMockingEnabled: boolean =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

/** The internal design-system preview page (/design-system). Off in production unless explicitly enabled. */
export const isDesignSystemPageEnabled: boolean =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_DESIGN_SYSTEM === "true";
