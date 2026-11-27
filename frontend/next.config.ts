import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants";

import { resolveBackendOrigin } from "./src/config/backend-origin";
import { buildSecurityHeaders } from "./src/config/security-headers";
import { resolveSiteUrl } from "./src/config/site-url";

const isDev = process.env.NODE_ENV === "development";

export default function config(phase: string): NextConfig {
  // Fails `next build` / `next start` early if BACKEND_ORIGIN is missing or malformed:
  // rewrites are baked into the build output, so a missing value would ship
  // localhost. The dev server and `next typegen` (which also loads the config in
  // the build phase) fall back to the local Django address.
  const isTypegen = process.argv.includes("typegen");
  const required = phase === PHASE_PRODUCTION_SERVER || (phase === PHASE_PRODUCTION_BUILD && !isTypegen);
  const backendOrigin = resolveBackendOrigin(process.env, { required });
  const isHttps = resolveSiteUrl(process.env, { required }).protocol === "https:";
  return buildNextConfig({ backendOrigin, isDev, isHttps });
}

/** Exported for tests (tests/unit/next-config.test.ts). */
export function buildNextConfig({
  backendOrigin,
  isDev,
  isHttps,
}: {
  backendOrigin: string;
  isDev: boolean;
  isHttps: boolean;
}): NextConfig {
  return {
  // Next.js 16 defaults from create-next-app.
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  reactStrictMode: true,
  // Do not advertise the framework in an `X-Powered-By` header.
  poweredByHeader: false,

  images: {
    // AVIF first, WebP fallback: smallest files for mobile data (NFR-03).
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    // Product images will come from Cloudflare R2; the host is added when the
    // bucket exists (ADR-0007). Until then no remote images are allowed.
    remotePatterns: [],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: buildSecurityHeaders({ isDev, isHttps }),
      },
    ];
  },

  // Same-origin API (ADR-0011 item 3): the browser calls the storefront's own
  // address and Next.js forwards to Django, so session and CSRF cookies stay
  // first-party and no CORS is needed. No trailing slashes (contract F-5).
  async rewrites() {
    return {
      // Outside `next dev`, never serve the MSW worker even if the file exists
      // in public/ (review SEC-4): it is rewritten to a path that does not exist.
      beforeFiles: isDev ? [] : [{ source: "/mockServiceWorker.js", destination: "/__no-mock-worker" }],
      afterFiles: [
        { source: "/api/v1/:path*", destination: `${backendOrigin}/api/v1/:path*` },
        { source: "/_allauth/:path*", destination: `${backendOrigin}/_allauth/:path*` },
      ],
      fallback: [],
    };
  },
  };
}
