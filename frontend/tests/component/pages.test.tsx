import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BasketPage from "@/app/basket/page";
import RouteError from "@/app/error";
import NotFound, { metadata as notFoundMetadata } from "@/app/not-found";
import HomePage from "@/app/page";
import { readSearchQuery, SearchSummary } from "@/features/search/search-summary";

describe("Home page", () => {
  it("has one h1 with the design's headline and a link to the shop", () => {
    render(<HomePage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Picked at dawn. At your gate by evening.");
    expect(screen.getByRole("link", { name: "Start shopping" })).toHaveAttribute("href", "/shop");
  });

  it("does not make promises the business has not confirmed (D-4, D-5)", () => {
    const { container } = render(<HomePage />);
    expect(container).not.toHaveTextContent(/45 minutes|Live delivery tracking/i);
  });
});

describe("Basket and not-found pages", () => {
  it("basket placeholder links back to the shop", () => {
    render(<BasketPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Your basket" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start shopping" })).toHaveAttribute("href", "/shop");
  });

  it("404 page explains and offers a way home", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
  });

  it("404 page has its own browser title (WCAG 2.4.2)", () => {
    expect(notFoundMetadata.title).toBe("Page not found");
  });
});

describe("Route error boundary", () => {
  it("shows a friendly message and retries", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    render(<RouteError error={new Error("database password=hunter2")} retry={retry} />);
    expect(screen.getByRole("alert")).not.toHaveTextContent("hunter2");
    screen.getByRole("button", { name: "Try again" }).click();
    expect(retry).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
  });
});

describe("Search summary", () => {
  it.each([
    [undefined, null],
    ["", null],
    ["   ", null],
    ["sukuma", "sukuma"],
    [["mangoes", "unga"], "mangoes"],
    ["x".repeat(300), "x".repeat(100)],
  ])("reads q=%j as %j", (q, expected) => {
    expect(readSearchQuery(q)).toBe(expected);
  });

  it("renders a search term as text, not HTML", async () => {
    const ui = await SearchSummary({ searchParams: Promise.resolve({ q: '<img src=x onerror="alert(1)">' }) });
    const { container } = render(ui);
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent('You searched for “<img src=x onerror="alert(1)">”.');
  });
});
