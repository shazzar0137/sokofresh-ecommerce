/**
 * CSRF (cross-site request forgery) protection, contract point F-6.
 *
 * Django sets a `csrftoken` cookie that JavaScript may read (on purpose:
 * CSRF_COOKIE_HTTPONLY = False). Every request that changes data (POST, PUT,
 * PATCH, DELETE) must copy it into the `X-CSRFToken` header. Another website
 * cannot read our cookie, so it cannot forge that header.
 *
 * If the cookie is missing, `GET /_allauth/browser/v1/config` makes Django set it.
 * The session cookie itself is HttpOnly: this code never sees it.
 */

export const CSRF_COOKIE_NAME = "csrftoken";
export const CSRF_HEADER_NAME = "X-CSRFToken";
export const CSRF_BOOTSTRAP_PATH = "/_allauth/browser/v1/config";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

export function isUnsafeMethod(method: string): boolean {
  return !SAFE_METHODS.has(method.toUpperCase());
}

/** Reads one cookie value from a `document.cookie`-style string. */
export function readCookie(name: string, cookieString: string): string | null {
  for (const part of cookieString.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      const value = rest.join("=");
      if (!value) return null;
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return null;
}

function browserCookies(): string {
  return typeof document === "undefined" ? "" : document.cookie;
}

let inflight: Promise<string | null> | null = null;

/**
 * Returns the CSRF token, asking Django to set the cookie first if needed.
 * Concurrent callers share one bootstrap request.
 */
export async function ensureCsrfToken(fetchImpl: typeof fetch = fetch): Promise<string | null> {
  const existing = readCookie(CSRF_COOKIE_NAME, browserCookies());
  if (existing) return existing;
  if (typeof document === "undefined") return null; // Server side: no browser cookies.

  inflight ??= fetchImpl(CSRF_BOOTSTRAP_PATH, {
    method: "GET",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  })
    .then(() => readCookie(CSRF_COOKIE_NAME, browserCookies()))
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
