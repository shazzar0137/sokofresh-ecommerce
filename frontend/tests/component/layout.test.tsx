import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Section } from "@/components/layout/section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { BasketButton } from "@/components/navigation/basket-button";

describe("SiteHeader", () => {
  it("has the logo link home, a search form and the basket link", () => {
    render(<SiteHeader />);
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("link", { name: "SokoFresh home" })).toHaveAttribute("href", "/");

    const search = within(header).getByRole("search");
    expect(search).toHaveAttribute("action", "/shop");
    expect(search).toHaveAttribute("method", "get");
    const box = within(search).getByRole("searchbox", { name: "Search products" });
    expect(box).toHaveAttribute("name", "q");
    expect(box).toHaveAttribute("maxlength", "100");
    expect(within(search).getByRole("button", { name: "Search" })).toHaveAttribute("type", "submit");

    expect(within(header).getByRole("link", { name: "Basket" })).toHaveAttribute("href", "/basket");
  });

  it("puts the basket before the search in Tab order, matching the phone layout", () => {
    render(<SiteHeader />);
    const header = screen.getByRole("banner");
    const order = [...header.querySelectorAll("a[href], input, button")].map(
      (el) => el.getAttribute("aria-label") ?? el.getAttribute("name") ?? el.textContent,
    );
    expect(order).toEqual(["SokoFresh home", "Basket", "q", "Search"]);
  });

  it("shows announcements only when given (store settings, Phase 4)", () => {
    const { rerender } = render(<SiteHeader />);
    expect(screen.queryByRole("list", { name: "Store announcements" })).not.toBeInTheDocument();
    rerender(<SiteHeader announcements={["Free delivery over KES 1,500", "Pay on delivery with M-Pesa"]} />);
    expect(within(screen.getByRole("list", { name: "Store announcements" })).getAllByRole("listitem")).toHaveLength(2);
  });
});

describe("BasketButton", () => {
  it.each([
    [undefined, "Basket"],
    [0, "Basket, 0 items"],
    [1, "Basket, 1 item"],
    [3, "Basket, 3 items"],
  ])("count %s is announced as %j", (count, name) => {
    render(<BasketButton count={count} />);
    expect(screen.getByRole("link", { name })).toBeInTheDocument();
  });
});

describe("AnnouncementBar", () => {
  it("always shows the decorative flag stripe, hidden from screen readers", () => {
    const { container } = render(<AnnouncementBar />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(container).toHaveTextContent("");
  });
});

describe("SkipLink", () => {
  it("targets the main content", () => {
    render(<SkipLink />);
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");
  });

  it("keeps its padding when it becomes visible on focus (focus:not-sr-only resets padding)", () => {
    render(<SkipLink />);
    const cls = screen.getByRole("link").className.split(" ");
    expect(cls).toEqual(expect.arrayContaining(["focus:not-sr-only", "focus:px-4", "focus:py-3"]));
  });
});

describe("Section", () => {
  it("labels the section by its heading", () => {
    render(
      <Section id="kits" title="Tonight's plate, one tap" subtitle="Pick the meal.">
        content
      </Section>,
    );
    expect(screen.getByRole("region", { name: "Tonight's plate, one tap" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "kits-title");
  });
});

describe("SiteFooter", () => {
  it("marks the Swahili tagline", () => {
    render(<SiteFooter />);
    expect(screen.getByText("Karibu. Chakula kizuri, bei nzuri.")).toHaveAttribute("lang", "sw");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("does not publish the design's placeholder contact details (D-7)", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("contentinfo")).not.toHaveTextContent(/0700 000 000|000000/);
  });
});
