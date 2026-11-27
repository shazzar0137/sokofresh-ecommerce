import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BasketPage from "@/app/basket/page";
import NotFound from "@/app/not-found";
import HomePage from "@/app/page";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState, LoadingState } from "@/components/common/states";
import { PhoneField } from "@/components/forms/phone-field";
import { TextField } from "@/components/forms/text-field";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";

import { axeViolations, describeViolations } from "../support/axe";

const cases: [string, React.ReactElement][] = [
  ["SiteHeader", <SiteHeader key="h" announcements={["Free delivery over KES 1,500"]} basketCount={2} />],
  ["SiteFooter", <SiteFooter key="f" />],
  ["SkipLink", <SkipLink key="s" />],
  ["Buttons", <div key="b"><Button>Add</Button><Button variant="outline" disabled>Disabled</Button></div>],
  ["TextField with error", <TextField key="t" label="Landmark" hint="Near your gate" error="Too long" />],
  ["PhoneField", <PhoneField key="p" />],
  ["LoadingState", <LoadingState key="l" />],
  ["EmptyState", <EmptyState key="e" title="Nothing here" description="Try again later." />],
  ["ErrorState", <ErrorState key="er" onRetry={() => {}} />],
  [
    "ProductCard",
    <ProductCard
      key="pc"
      name="Sukuma wiki bunch"
      localName="Kale"
      localNameLang="en"
      origin="Kinangop"
      price={30}
      wasPrice={50}
      discountPercent={40}
      stockRemaining={9}
      stockIsLow
      media={<span aria-hidden="true">🥬</span>}
      action={<Button size="sm">Add</Button>}
    />,
  ],
  ["Home page", <HomePage key="home" />],
  ["Basket page", <BasketPage key="basket" />],
  ["Not-found page", <NotFound key="nf" />],
];

describe("axe-core accessibility scan (WCAG 2.2 A/AA)", () => {
  it.each(cases)("%s has no violations", async (_name, ui) => {
    const { container } = render(ui);
    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});
