import { expect, test } from "@playwright/test";

test.describe("application shell and navigation", () => {
  test("home page renders the root layout", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await expect(page).toHaveTitle("SokoFresh: fresh Kenyan groceries, delivered");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Picked at dawn. At your gate by evening.");
    expect(errors).toEqual([]);
  });

  test("self-hosted brand fonts load", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const families = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family));
    expect(families.join(" ")).toMatch(/figtree/i);
    expect(families.join(" ")).toMatch(/bricolage/i);
    const headingFont = await page.getByRole("heading", { level: 1 }).evaluate((el) => getComputedStyle(el).fontFamily);
    expect(headingFont).toMatch(/bricolage/i);
  });

  test("Start shopping goes to the shop", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start shopping" }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fresh from the soko");
    await expect(page).toHaveTitle("Shop · SokoFresh");
  });

  test("search submits to /shop?q= and shows the term safely", async ({ page }) => {
    let dialogOpened = false;
    page.on("dialog", (d) => {
      dialogOpened = true;
      void d.dismiss();
    });
    await page.goto("/");
    const search = page.getByRole("searchbox", { name: "Search products" });
    await search.fill('sukuma <img src=x onerror="alert(1)">');
    await search.press("Enter");
    await expect(page).toHaveURL(/\/shop\?q=sukuma/);
    await expect(page.getByText(/You searched for/)).toContainText('sukuma <img src=x onerror="alert(1)">');
    expect(await page.locator("main img").count()).toBe(0);
    expect(dialogOpened).toBe(false);
  });

  test("basket link and logo link work", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("link", { name: "Basket" }).click();
    await expect(page).toHaveURL(/\/basket$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your basket");
    await page.getByRole("link", { name: "SokoFresh home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("unknown pages show the 404 page with status 404", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
    await page.getByRole("link", { name: "Go to the home page" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("the first Tab focuses the skip link, which moves focus to main content", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard navigation is checked on desktop");
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main-content$/);
    await page.keyboard.press("Tab");
    // Next focusable element is inside main, not back in the header.
    const inMain = await page.evaluate(() => document.querySelector("main")?.contains(document.activeElement));
    expect(inMain).toBe(true);
  });
});

test.describe("security", () => {
  test("pages are served with the security headers", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toContain("object-src 'none'");
    expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("the served CSP is exactly the reviewed policy", async ({ request }) => {
    const csp = (await request.get("/shop")).headers()["content-security-policy"];
    expect(csp).toBe(
      "default-src 'self'; script-src 'self' 'unsafe-inline'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; " +
        "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; frame-src 'none'",
    );
  });

  test("the MSW worker file is not served by a production build", async ({ request }) => {
    expect((await request.get("/mockServiceWorker.js")).status()).toBe(404);
  });

  test("no third-party requests are made by the shell (no Google Maps on home/shop)", async ({ page, baseURL }) => {
    const origins = new Set<string>();
    page.on("request", (req) => origins.add(new URL(req.url()).origin));
    for (const path of ["/", "/shop", "/basket"]) {
      await page.goto(path, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
    }
    expect([...origins].filter((o) => o !== new URL(baseURL!).origin && !o.startsWith("data:"))).toEqual([]);
  });

  test("the page works with the strict CSP (no CSP violations reported)", async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (msg) => /Content Security Policy/i.test(msg.text()) && violations.push(msg.text()));
    // Includes inline-handler attempts: script-src-attr 'none' must not break React.
    await page.goto("/design-system", { waitUntil: "load" });
    await page.getByRole("button", { name: "Start shopping" }).click();
    expect(violations).toEqual([]);
  });
});
