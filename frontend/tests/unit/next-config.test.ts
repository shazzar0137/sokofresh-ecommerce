// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildNextConfig } from "../../next.config";

type Rewrite = { source: string; destination: string };
type Rewrites = { beforeFiles: Rewrite[]; afterFiles: Rewrite[]; fallback: Rewrite[] };

const prod = buildNextConfig({ backendOrigin: "https://backend.internal:8000", isDev: false, isHttps: true });
const dev = buildNextConfig({ backendOrigin: "http://127.0.0.1:8000", isDev: true, isHttps: false });

describe("same-origin rewrites (ADR-0011 item 3)", () => {
  it("forwards exactly /api/v1 and /_allauth to the backend, without adding slashes (F-5)", async () => {
    const rewrites = (await prod.rewrites!()) as Rewrites;
    expect(rewrites.afterFiles).toEqual([
      { source: "/api/v1/:path*", destination: "https://backend.internal:8000/api/v1/:path*" },
      { source: "/_allauth/:path*", destination: "https://backend.internal:8000/_allauth/:path*" },
    ]);
    expect(rewrites.fallback).toEqual([]);
  });

  it("never serves the MSW worker outside development (SEC-4)", async () => {
    expect(((await prod.rewrites!()) as Rewrites).beforeFiles).toEqual([
      { source: "/mockServiceWorker.js", destination: "/__no-mock-worker" },
    ]);
    expect(((await dev.rewrites!()) as Rewrites).beforeFiles).toEqual([]);
  });
});

describe("security headers on every route (reviewed literal, QA-7)", () => {
  it("sends exactly this set in production over HTTPS", async () => {
    const [rule] = await prod.headers!();
    expect(rule?.source).toBe("/:path*");
    expect(Object.fromEntries((rule?.headers ?? []).map((h) => [h.key, h.value]))).toEqual({
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; " +
        "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; frame-src 'none'; upgrade-insecure-requests",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    });
  });

  it("hides the framework and keeps no remote image hosts", () => {
    expect(prod.poweredByHeader).toBe(false);
    expect(prod.images?.remotePatterns).toEqual([]);
  });
});
