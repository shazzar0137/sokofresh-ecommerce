import "server-only";

import { resolveBackendOrigin } from "@/config/backend-origin";

import { createApiClient } from "./client";

/**
 * API client for Server Components and route handlers. It calls Django
 * directly (no browser, no rewrite), so it needs the absolute backend origin.
 * It does not forward the visitor's cookies: use it only for public data
 * (catalogue, settings). Signed-in data is fetched from the browser.
 */
export function createServerApiClient() {
  return createApiClient({ baseUrl: resolveBackendOrigin(process.env), csrf: false });
}
