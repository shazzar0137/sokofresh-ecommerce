import { describe, expect, it } from "vitest";

import { cn, FONT_SIZE_TOKENS } from "@/lib/utils";

describe("cn", () => {
  it("keeps a colour and a custom font size together (regression: primary buttons lost white text)", () => {
    expect(cn("text-brand-foreground", "text-body")).toBe("text-brand-foreground text-body");
  });

  it.each(FONT_SIZE_TOKENS)("treats text-%s as a font size, not a colour", (size) => {
    const out = cn("text-ink", `text-${size}`).split(" ");
    expect(out).toContain("text-ink");
    expect(out).toContain(`text-${size}`);
  });

  it("still lets a later size replace an earlier size", () => {
    expect(cn("text-body", "text-small")).toBe("text-small");
  });

  it("still lets a later colour replace an earlier colour", () => {
    expect(cn("text-ink", "text-accent")).toBe("text-accent");
  });

  it("lets callers override padding", () => {
    expect(cn("px-4 py-2", "px-8")).toBe("py-2 px-8");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
