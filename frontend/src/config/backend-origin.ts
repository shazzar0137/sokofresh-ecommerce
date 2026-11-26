/**
 * Where the Django backend lives, as seen from the Next.js server.
 *
 * The browser never talks to Django directly. It calls `/api/v1/...` and
 * `/_allauth/...` on the storefront's own address, and Next.js forwards
 * ("rewrites") those requests to this origin (ADR-0011 item 3). This keeps
 * cookies same-origin, so the session and CSRF cookies work without CORS.
 *
 * This value is read on the server only. It is deliberately NOT prefixed with
 * `NEXT_PUBLIC_`, so it is never bundled into browser JavaScript.
 */

export const DEFAULT_DEV_BACKEND_ORIGIN = "http://127.0.0.1:8000";

export class BackendOriginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackendOriginError";
  }
}

type Env = Record<string, string | undefined>;

/**
 * Returns a validated origin such as `https://api.internal.example` (scheme +
 * host + optional port, no path, no trailing slash).
 *
 * - In development and tests, falls back to Django's default local address.
 * - When `required` is true (production build or server), `BACKEND_ORIGIN`
 *   must be set: silently pointing a live storefront at localhost would break
 *   every API call. By default it is required when NODE_ENV is "production".
 */
export function resolveBackendOrigin(
  env: Env,
  { required = env.NODE_ENV === "production" }: { required?: boolean } = {},
): string {
  const raw = env.BACKEND_ORIGIN?.trim();

  if (!raw) {
    if (required) {
      throw new BackendOriginError(
        "BACKEND_ORIGIN must be set for production builds (for example https://backend.internal:8000).",
      );
    }
    return DEFAULT_DEV_BACKEND_ORIGIN;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new BackendOriginError(`BACKEND_ORIGIN is not a valid URL: "${raw}"`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BackendOriginError("BACKEND_ORIGIN must use http or https.");
  }
  if (url.username || url.password) {
    throw new BackendOriginError("BACKEND_ORIGIN must not contain a username or password.");
  }
  if ((url.pathname && url.pathname !== "/") || url.search || url.hash) {
    throw new BackendOriginError(
      "BACKEND_ORIGIN must be an origin only (scheme, host and port), with no path, query or fragment.",
    );
  }

  return url.origin;
}
