import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PriceDisplay } from "@/components/products/price-display";
import { ProductCard } from "@/components/products/product-card";
import { DiscountBadge, OriginLine, StockNote } from "@/components/products/product-labels";

const NBSP = " ";

describe("PriceDisplay", () => {
  it("shows the price and a struck-through old price with screen-reader 'was'", () => {
    const { container } = render(<PriceDisplay price={30} wasPrice={50} />);
    expect(container.textContent).toBe(`KES${NBSP}30, was 50`);
    expect(container.querySelector("del")).toHaveTextContent("50");
  });

  it("uses the full currency for meal-kit style old prices", () => {
    const { container } = render(<PriceDisplay price={1472} wasPrice={1600} wasStyle="full" />);
    expect(container.querySelector("del")?.textContent).toBe(`KES${NBSP}1,600`);
  });

  it.each([null, undefined, 30, 25])("hides the old price when it is %s (not higher than the price)", (was) => {
    const { container } = render(<PriceDisplay price={30} wasPrice={was} />);
    expect(container.querySelector("del")).toBeNull();
  });

  it("refuses an invalid price instead of showing nonsense", () => {
    expect(() => render(<PriceDisplay price={-30} />)).toThrow(RangeError);
  });
});

describe("DiscountBadge", () => {
  it("shows the API's percentage", () => {
    render(<DiscountBadge percent={40} />);
    expect(screen.getByText("Save 40%")).toBeInTheDocument();
  });

  it.each([0, -5, Number.NaN])("renders nothing for %s", (percent) => {
    const { container } = render(<DiscountBadge percent={percent} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("StockNote", () => {
  it("warns when stock is low", () => {
    render(<StockNote remaining={9} isLow />);
    expect(screen.getByText("Only 9 left today")).toBeInTheDocument();
  });
  it("says sold out at zero, whatever the low flag", () => {
    render(<StockNote remaining={0} isLow={false} />);
    expect(screen.getByText("Sold out today")).toBeInTheDocument();
  });
  it("stays quiet when stock is fine", () => {
    const { container } = render(<StockNote remaining={40} isLow={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("OriginLine", () => {
  it("marks the Swahili name for correct pronunciation", () => {
    render(<OriginLine localName="Nyanya" origin="Kirinyaga" />);
    expect(screen.getByText("Nyanya")).toHaveAttribute("lang", "sw");
    expect(screen.getByText("from Kirinyaga")).toBeInTheDocument();
  });
  it("renders nothing without data", () => {
    const { container } = render(<OriginLine />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ProductCard", () => {
  it("lays out the design's card content in reading order", () => {
    render(
      <ProductCard
        name="Tomatoes 1kg"
        localName="Nyanya"
        origin="Kirinyaga"
        price={120}
        wasPrice={150}
        discountPercent={20}
        stockRemaining={9}
        stockIsLow
        tone="rose"
        media={<span aria-hidden="true">🍅</span>}
        action={<button type="button">Add</button>}
      />,
    );
    const card = screen.getByRole("article");
    expect(within(card).getByRole("heading", { level: 3, name: "Tomatoes 1kg" })).toBeInTheDocument();
    expect(card).toHaveTextContent(/Save 20%.*Tomatoes 1kg.*Nyanya.*from Kirinyaga.*Only 9 left today.*KES.120, was 150.*Add/);
    expect(within(card).getByRole("button", { name: "Add" })).toBeInTheDocument();
    expect(card.querySelector(".bg-tile-rose")).not.toBeNull();
  });
});
