import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, buildSecurityHeaders } from "@/config/security-headers";

function directives(csp: string): Map<string, string[]> {
  return new Map(
    csp.split(";").map((part) => {
      const [name = "", ...values] = part.trim().split(/\s+/);
      return [name, values];
    }),
  );
}

describe("Content-Security-Policy", () => {
  const prod = directives(buildContentSecurityPolicy({ isDev: false, isHttps: true }));
  const dev = directives(buildContentSecurityPolicy({ isDev: true, isHttps: false }));

  it("blocks plugins, framing, base-tag and form hijacking", () => {
    expect(prod.get("object-src")).toEqual(["'none'"]);
    expect(prod.get("frame-ancestors")).toEqual(["'none'"]);
    expect(prod.get("base-uri")).toEqual(["'self'"]);
    expect(prod.get("form-action")).toEqual(["'self'"]);
    expect(prod.get("default-src")).toEqual(["'self'"]);
  });

  it("allows API calls only to our own origin", () => {
    expect(prod.get("connect-src")).toEqual(["'self'"]);
  });

  it("never allows eval in production, only in development", () => {
    expect(prod.get("script-src")).not.toContain("'unsafe-eval'");
    expect(dev.get("script-src")).toContain("'unsafe-eval'");
  });

  it("loads scripts, fonts and images only from our origin (no third-party hosts)", () => {
    for (const name of ["script-src", "font-src", "img-src", "style-src"]) {
      const values = prod.get(name) ?? [];
      expect(values.filter((v) => v.includes("."))).toEqual([]);
    }
  });

  it("does not load Google Maps anywhere yet (ADR-0013: never on home or catalogue)", () => {
    expect(buildContentSecurityPolicy({ isDev: false, isHttps: true })).not.toMatch(/google|gstatic/);
  });

  it("upgrades insecure requests only on HTTPS sites", () => {
    expect(prod.has("upgrade-insecure-requests")).toBe(true);
    expect(dev.has("upgrade-insecure-requests")).toBe(false);
  });
});

describe("security headers", () => {
  const byName = (isHttps: boolean) =>
    new Map(buildSecurityHeaders({ isDev: false, isHttps }).map((h) => [h.key, h.value]));

  it("sets the baseline headers", () => {
    const h = byName(false);
    expect(h.get("X-Content-Type-Options")).toBe("nosniff");
    expect(h.get("X-Frame-Options")).toBe("DENY");
    expect(h.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(h.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(h.get("Permissions-Policy")).toContain("camera=()");
  });

  it("sends HSTS only over HTTPS (so local http testing is not locked out)", () => {
    expect(byName(false).has("Strict-Transport-Security")).toBe(false);
    expect(byName(true).get("Strict-Transport-Security")).toMatch(/^max-age=31536000/);
  });
});
