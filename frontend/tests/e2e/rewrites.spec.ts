import { expect, test } from "@playwright/test";

/**
 * Same-origin API (ADR-0011 item 3): the browser calls the storefront's own
 * address and Next.js forwards to the backend (a stub here). Review QA-6.
 */
test.describe("same-origin rewrites to the backend", () => {
  test.skip(({ isMobile }) => isMobile, "Device-independent: checked once on desktop");

  test("/api/v1 is forwarded with path and query, and the backend's cookie comes back first-party", async ({ page, baseURL }) => {
    await page.goto("/");
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/v1/catalogue/products?page=2");
      return { status: res.status, body: await res.json(), cookie: document.cookie };
    });
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ stub: true, method: "GET", path: "/api/v1/catalogue/products?page=2" });
    expect(result.body.forwardedHost).toBe(new URL(baseURL!).host);
    expect(result.cookie).toContain("csrftoken=stub-token");
  });

  test("/_allauth is forwarded with cookies and the CSRF header on POST", async ({ page }) => {
    await page.goto("/");
    const body = await page.evaluate(async () => {
      document.cookie = "csrftoken=browser-token; path=/";
      const res = await fetch("/_allauth/browser/v1/auth/code/request", {
        method: "POST",
        headers: { "X-CSRFToken": "browser-token", "Content-Type": "application/json" },
        body: "{}",
      });
      return res.json();
    });
    expect(body).toMatchObject({ stub: true, method: "POST", path: "/_allauth/browser/v1/auth/code/request", csrf: "browser-token" });
    expect(body.cookie).toContain("csrftoken=browser-token");
  });

  test("paths outside /api/v1 and /_allauth are not forwarded", async ({ request }) => {
    const admin = await request.get("/admin", { maxRedirects: 0 });
    expect(admin.status()).toBe(404);
    expect(await admin.text()).not.toContain('"stub":true');
  });
});
