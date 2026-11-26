import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Real-browser axe scan, including colour contrast (WCAG 2.2 A and AA). */
const PAGES = ["/", "/shop", "/shop?q=sukuma", "/basket", "/design-system", "/no-such-page"];

for (const path of PAGES) {
  test(`${path} has no WCAG 2.2 A/AA violations`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    expect(summary).toEqual([]);
  });
}

test("every page has exactly one h1 and a main landmark", async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.locator("h1"), path).toHaveCount(1);
    await expect(page.getByRole("main"), path).toHaveCount(1);
  }
});

test("interactive targets are at least 24×24 CSS px (WCAG 2.5.8)", async ({ page }) => {
  for (const path of ["/", "/shop", "/basket", "/design-system"]) {
    await page.goto(path);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea")]
        .filter((el) => el.offsetParent !== null && !el.classList.contains("sr-only"))
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ el, r }) => {
          // Inline text links inside a sentence are exempt under 2.5.8.
          const inline = el.tagName === "A" && getComputedStyle(el).display === "inline";
          return !inline && (r.width < 24 || r.height < 24);
        })
        .map(({ el, r }) => `${el.tagName} "${el.textContent?.trim()}" ${Math.round(r.width)}×${Math.round(r.height)}`),
    );
    expect(small, path).toEqual([]);
  }
});

test("content reflows at 320 CSS px (equivalent to 400% zoom, WCAG 1.4.10)", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of ["/", "/shop", "/basket", "/design-system"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
