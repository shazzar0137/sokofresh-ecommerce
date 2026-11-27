/**
 * HTTP security headers for every storefront response.
 *
 * Content Security Policy (CSP) tells the browser which sources it may load
 * scripts, styles, images and connections from, limiting the damage of any
 * cross-site scripting (XSS) bug.
 *
 * Phase 3 choice (interim, see frontend/documentation/security/SECURITY.md):
 * a static CSP set in next.config, without per-request nonces. Nonces would
 * force every page to render on each request and disable static rendering,
 * CDN caching and partial prerendering, which conflicts with the LCP < 2.5 s
 * target on mobile networks (NFR-01). Without nonces, Next.js needs
 * `'unsafe-inline'` for its own inline bootstrap scripts. Every other
 * directive is strict. Revisit before launch (risk R-9): Next.js's
 * experimental Subresource Integrity option or nonces on dynamic pages only.
 *
 * Google Maps (ADR-0013) will need its domains added on the checkout route
 * only, when the AddressPicker is built. It must never load on the home page
 * or catalogue.
 */

export interface SecurityHeaderOptions {
  /** `next dev`: React needs `eval` for its debugging tools. */
  isDev: boolean;
  /** The site is served over HTTPS (enables HSTS and upgrade-insecure-requests). */
  isHttps: boolean;
}

export interface Header {
  key: string;
  value: string;
}

export function buildContentSecurityPolicy({ isDev, isHttps }: SecurityHeaderOptions): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    // Blocks inline event handlers such as <img onerror="…">, even though
    // 'unsafe-inline' allows inline <script> elements (review SEC-2).
    "script-src-attr": ["'none'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    // API calls are same-origin (Next.js rewrites to Django).
    "connect-src": ["'self'", ...(isDev ? ["ws:"] : [])],
    "worker-src": ["'self'"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "frame-src": ["'none'"],
  };

  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (isHttps) {
    parts.push("upgrade-insecure-requests");
  }
  return parts.join("; ");
}

export function buildSecurityHeaders(options: SecurityHeaderOptions): Header[] {
  const headers: Header[] = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(options) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Geolocation stays available to our own pages for the future address picker.
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];

  if (options.isHttps) {
    // One year. Not preloaded: preloading is hard to undo and needs the final domain.
    headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
  }

  return headers;
}
