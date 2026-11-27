import { describe, expect, it } from "vitest";

import { DEFAULT_DEV_SITE_URL, resolveSiteUrl, SiteUrlError } from "@/config/site-url";

describe("resolveSiteUrl", () => {
  it("defaults to localhost when not required", () => {
    expect(resolveSiteUrl({}).href).toBe(`${DEFAULT_DEV_SITE_URL}/`);
  });

  it("is required for production builds (HSTS and links must not silently fall back to localhost)", () => {
    expect(() => resolveSiteUrl({}, { required: true })).toThrow(SiteUrlError);
  });

  it.each([
    ["https://sokofresh.co.ke", "https://sokofresh.co.ke"],
    ["https://sokofresh.co.ke/", "https://sokofresh.co.ke"],
    ["http://localhost:3100", "http://localhost:3100"],
    ["http://127.0.0.1:3000", "http://127.0.0.1:3000"],
  ])("accepts %j", (input, origin) => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: input }, { required: true }).origin).toBe(origin);
  });

  it.each([
    ["http://sokofresh.co.ke", "plain http on a public host"],
    ["ftp://sokofresh.co.ke", "wrong scheme"],
    ["not a url", "invalid"],
    ["https://sokofresh.co.ke/shop", "path"],
    ["https://user:pw@sokofresh.co.ke", "credentials"],
  ])("rejects %j (%s)", (input) => {
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: input })).toThrow(SiteUrlError);
  });
});
