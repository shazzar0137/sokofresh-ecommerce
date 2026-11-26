import createClient, { type Middleware } from "openapi-fetch";

import { CSRF_HEADER_NAME, ensureCsrfToken, isUnsafeMethod } from "./csrf";
import { ApiError, apiErrorFromResponse } from "./errors";
import type { paths } from "./schema";

/**
 * The typed SokoFresh API client (openapi-fetch, ADR-0009).
 *
 * Paths, parameters and response bodies are checked against the generated
 * contract types, so a typo in a URL or a renamed field is a compile error.
 *
 *   const health = await unwrap(api.GET("/api/v1/health"));
 *
 * In the browser, requests go to the storefront's own address and Next.js
 * forwards them to Django (same-origin). On the server use server-client.ts.
 */

export const DEFAULT_TIMEOUT_MS = 15_000;

export interface ApiClientOptions {
  /** The page's origin in the browser; the backend origin on the server. */
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
  /** Add the CSRF header on unsafe methods (browser only). Default true. */
  csrf?: boolean;
}

function withTimeout(fetchImpl: typeof fetch, timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = AbortSignal.any([request.signal, timeout]);
    try {
      return await fetchImpl(new Request(request, { signal }));
    } catch (error) {
      if (timeout.aborted) {
        throw new ApiError({
          status: 0,
          code: "timeout",
          title: "Request timed out",
          detail: `No response within ${timeoutMs} ms.`,
          cause: error,
        });
      }
      if (request.signal.aborted) throw error; // Cancelled by the caller (e.g. TanStack Query): not an error to show.
      throw new ApiError({
        status: 0,
        code: "network_error",
        title: "Network error",
        detail: "The request could not reach the server.",
        cause: error,
      });
    }
  };
}

function csrfMiddleware(fetchImpl: typeof fetch): Middleware {
  return {
    async onRequest({ request }) {
      if (!isUnsafeMethod(request.method)) return undefined;
      const token = await ensureCsrfToken(fetchImpl);
      if (token) request.headers.set(CSRF_HEADER_NAME, token);
      return request;
    },
  };
}

export function createApiClient(options: ApiClientOptions = {}) {
  const fetchImpl = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const client = createClient<paths>({
    baseUrl: options.baseUrl ?? "",
    credentials: "same-origin",
    headers: { Accept: "application/json, application/problem+json" },
    fetch: withTimeout(fetchImpl, options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  });
  if (options.csrf ?? true) client.use(csrfMiddleware(fetchImpl));
  return client;
}

/**
 * The browser client: same origin as the page. The origin is explicit (not a
 * relative URL) because Node's fetch, used during server rendering and in
 * tests, cannot resolve relative URLs.
 */
export const api = createApiClient({
  baseUrl: typeof window === "undefined" ? "" : window.location.origin,
});

interface FetchResultLike<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/**
 * Turns openapi-fetch's `{ data, error, response }` into a value or a thrown
 * ApiError, which is what TanStack Query expects from a query function.
 */
export async function unwrap<T>(resultPromise: Promise<FetchResultLike<T>>): Promise<T> {
  const { data, error, response } = await resultPromise;
  if (!response.ok) throw apiErrorFromResponse(response, error);
  if (data === undefined) {
    if (response.status === 204) return undefined as T;
    throw new ApiError({
      status: response.status,
      code: "invalid_response",
      title: "Empty response",
      detail: "The server returned no data.",
    });
  }
  return data;
}
