import { expect, test } from "@playwright/test";

/**
 * Responsive behaviour at the agreed widths (frontend analysis §5):
 * 360, 390 (design mobile frame), 768, 1024, 1280, 1440 (design desktop frame).
 */
const VIEWPORTS = [
  { width: 360, height: 780, grid: 2, inlineSearch: false },
  { width: 390, height: 844, grid: 2, inlineSearch: false },
  { width: 768, height: 1024, grid: 3, inlineSearch: true },
  { width: 1024, height: 768, grid: 3, inlineSearch: true },
  { width: 1280, height: 800, grid: 5, inlineSearch: true },
  { width: 1440, height: 900, grid: 5, inlineSearch: true },
] as const;

test.describe("responsive layout", () => {
  test.skip(({ isMobile }) => isMobile, "Viewport sizes are set explicitly on the desktop project");

  for (const vp of VIEWPORTS) {
    test(`${vp.width}px: no horizontal scroll, header and grid follow the design`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const path of ["/", "/shop", "/basket", "/design-system"]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
      }

      await page.goto("/");
      const logo = await page.getByRole("link", { name: "SokoFresh home" }).boundingBox();
      const search = await page.getByRole("search").boundingBox();
      const basket = await page.getByRole("link", { name: "Basket" }).boundingBox();
      expect(logo && search && basket).toBeTruthy();
      if (vp.inlineSearch) {
        // Desktop/tablet: logo · search · basket on one row.
        expect(Math.abs(search!.y + search!.height / 2 - (logo!.y + logo!.height / 2))).toBeLessThan(12);
        expect(search!.x).toBeGreaterThan(logo!.x + logo!.width);
        expect(basket!.x).toBeGreaterThan(search!.x + search!.width - 1);
      } else {
        // Phone: logo and basket on one row, search full width underneath.
        expect(search!.y).toBeGreaterThan(logo!.y + logo!.height);
        expect(Math.abs(basket!.y - logo!.y)).toBeLessThan(24);
        expect(search!.width).toBeGreaterThan(vp.width - 2 * 32 - 2);
      }

      // Page side margins: 20 px on phones up to 80 px on the 1440 desktop frame.
      const margin = logo!.x;
      if (vp.width <= 390) expect(margin).toBe(20);
      if (vp.width === 1440) expect(margin).toBe(80);

      // Product grid columns on the design-system preview.
      await page.goto("/design-system");
      const grid = page.locator("#products ul").last();
      const columns = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
      expect(columns).toBe(vp.grid);
    });
  }

  test("hero headline uses the design's 72 px at 1440 and 44 px at 390", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    expect(await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeCloseTo(72, 0);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeCloseTo(44, 0);
  });
});
