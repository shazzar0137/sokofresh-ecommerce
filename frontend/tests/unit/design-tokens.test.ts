// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Reads the real token file (src/app/globals.css) and checks colour contrast
 * against WCAG 2.2 AA: 4.5:1 for text, 3:1 for large text and UI outlines.
 * If someone changes a colour to one that is hard to read, this fails.
 */

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})\\b`));
  if (!match?.[1]) throw new Error(`Token --color-${name} not found as a hex value`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe("contrast helper", () => {
  it("matches known values", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 1);
  });
});

describe("design token values (from the design reference)", () => {
  it.each([
    ["ink", "#16130f"],
    ["cream", "#fbf8f1"],
    ["tint", "#f2ecdd"],
    ["brand", "#0c6b3f"],
    ["accent", "#b8262b"],
    ["gold", "#f0a30a"],
    ["ink-muted", "#6b6459"],
  ])("--color-%s is %s", (name, hex) => {
    expect(token(name).toLowerCase()).toBe(hex);
  });
});

const TEXT = 4.5;
const LARGE_OR_UI = 3;

describe("WCAG AA contrast of token pairs", () => {
  it.each([
    // [foreground, background, minimum, where it is used]
    ["ink", "cream", TEXT, "body text on the page"],
    ["ink", "tint", TEXT, "text on the catalogue band and reason cards"],
    ["ink", "card", TEXT, "product names on cards"],
    ["ink-muted", "cream", TEXT, "subtitles"],
    ["ink-muted", "tint", TEXT, "subtitles on the catalogue band"],
    ["ink-muted", "card", TEXT, "origins and old prices on product cards"],
    ["brand-foreground", "brand", TEXT, "text on green buttons and the trust band"],
    ["accent-foreground", "accent", TEXT, "basket button and discount badge"],
    ["accent", "card", TEXT, "'Only N left today' on cards"],
    ["accent", "cream", TEXT, "form errors"],
    ["brand", "tint", TEXT, "ETA pill text"],
    ["brand", "cream", LARGE_OR_UI, "'Soko' in the logo (large text)"],
    ["accent", "cream", LARGE_OR_UI, "'Fresh' in the logo (large text)"],
    ["gold-foreground", "gold", TEXT, "sticker text"],
    ["cream", "ink", TEXT, "top bar and footer text"],
    ["ink", "card", LARGE_OR_UI, "2 px input and tab borders"],
    ["ink", "cream", LARGE_OR_UI, "focus outline on light surfaces"],
    ["cream", "ink", LARGE_OR_UI, "focus outline on dark surfaces"],
  ])("%s on %s ≥ %s:1 (%s)", (fg, bg, min) => {
    const ratio = contrast(token(fg), token(bg));
    expect(ratio).toBeGreaterThanOrEqual(min);
  });
});
