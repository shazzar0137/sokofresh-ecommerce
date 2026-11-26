import axe from "axe-core";

/**
 * Runs axe-core (WCAG 2.0–2.2 A and AA rules) on a rendered container.
 * jsdom has no layout or real colours, so `color-contrast` is checked in the
 * Playwright tests (real browser) and by design-tokens.test.ts instead.
 */
export async function axeViolations(container: Element): Promise<axe.Result[]> {
  const results = await axe.run(container, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
    rules: {
      "color-contrast": { enabled: false },
      // Components are tested in isolation, not inside a full page with landmarks.
      region: { enabled: false },
      "landmark-one-main": { enabled: false },
      "page-has-heading-one": { enabled: false },
    },
  });
  return results.violations;
}

export function describeViolations(violations: axe.Result[]): string {
  return violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`).join("\n");
}
