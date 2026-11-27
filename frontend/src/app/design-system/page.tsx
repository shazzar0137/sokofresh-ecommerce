import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ErrorState } from "@/components/common/error-state";
import { EmptyState, LoadingState } from "@/components/common/states";
import { Heading, Text } from "@/components/common/typography";
import { PhoneField } from "@/components/forms/phone-field";
import { TextField } from "@/components/forms/text-field";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { PriceDisplay } from "@/components/products/price-display";
import { ProductCard } from "@/components/products/product-card";
import { DiscountBadge, OriginLine, StockNote } from "@/components/products/product-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isDesignSystemPageEnabled } from "@/config/public-env";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

/**
 * Internal preview of the design tokens and foundation components, used for
 * visual checks and the automated accessibility scan. Not part of the
 * storefront: returns 404 in production builds unless
 * NEXT_PUBLIC_SHOW_DESIGN_SYSTEM=true (set only for test builds).
 *
 * All product values below are SAMPLE values for display, not live data.
 */

const swatches = [
  ["ink", "bg-ink", "#16130F"],
  ["cream", "bg-cream", "#FBF8F1"],
  ["tint", "bg-tint", "#F2ECDD"],
  ["line", "bg-line", "#E6DFD0"],
  ["ink-muted", "bg-ink-muted", "#6B6459"],
  ["brand", "bg-brand", "#0C6B3F"],
  ["accent", "bg-accent", "#B8262B"],
  ["gold", "bg-gold", "#F0A30A"],
] as const;

function Swatch({ name, className, hex }: { name: string; className: string; hex: string }) {
  return (
    <li className="flex flex-col gap-2">
      <span aria-hidden="true" className={`h-16 rounded-card border border-line ${className}`} />
      <span className="text-small font-semibold text-ink">{name}</span>
      <span className="text-caption text-ink-muted">{hex}</span>
    </li>
  );
}

function Demo({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-display text-h3 font-extrabold text-ink">{title}</h3>
      {children}
    </div>
  );
}

function Emoji({ children }: { children: string }) {
  return (
    <span aria-hidden="true" className="text-[3.5rem] leading-none md:text-[4.25rem]">
      {children}
    </span>
  );
}

export default function DesignSystemPage() {
  if (!isDesignSystemPageEnabled) notFound();

  return (
    <>
      <PageContainer className="pt-12">
        <Heading level={1}>Design system</Heading>
        <Text variant="sub" className="mt-2">
          Tokens and foundation components from the SokoFresh design reference. Product values are samples.
        </Text>
      </PageContainer>

      <Section id="colours" title="Colours">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {swatches.map(([name, className, hex]) => (
            <Swatch key={name} name={name} className={className} hex={hex} />
          ))}
        </ul>
      </Section>

      <Section id="type" title="Typography" tone="tint">
        <div className="flex flex-col gap-4">
          <p className="font-display text-display font-extrabold">Picked at dawn.</p>
          <p className="font-display text-h1 font-extrabold">Fresh from the soko</p>
          <p lang="sw" className="font-display text-h2 font-extrabold">
            Ugali na sukuma
          </p>
          <p className="font-display text-h3 font-extrabold">Named farms</p>
          <p className="font-display text-product font-extrabold">Sukuma wiki bunch</p>
          <Text variant="lead">Vegetables from Kinangop, mangoes from Kitui.</Text>
          <Text variant="sub">Prices today. Stock is limited.</Text>
          <Text>Body text in Figtree Regular.</Text>
          <Text variant="small">Small text: origins, footer.</Text>
        </div>
      </Section>

      <Section id="controls" title="Buttons and inputs">
        <div className="grid gap-10 lg:grid-cols-2">
          <Demo title="Buttons">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg">Start shopping</Button>
              <Button size="sm">Add</Button>
              <Button variant="accent" shape="pill">
                Basket
              </Button>
              <Button variant="dark">Search</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="surface-brand flex flex-wrap gap-3 rounded-panel bg-brand p-5">
              <Button variant="light">Add whole kit</Button>
            </div>
          </Demo>
          <Demo title="Form fields">
            <TextField label="Delivery landmark" hint="A building, gate or shop near you" name="landmark" />
            <PhoneField name="phone" error="Enter a Kenyan mobile number, for example 0712 345 678." />
          </Demo>
        </div>
      </Section>

      <Section id="products" title="Product primitives" tone="tint">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-6">
            <DiscountBadge percent={40} />
            <Badge variant="sticker">Picked 5am today</Badge>
            <Badge variant="neutral">From Kirinyaga</Badge>
            <PriceDisplay price={30} wasPrice={50} />
            <PriceDisplay price={414} wasPrice={450} wasStyle="full" size="lg" />
            <StockNote remaining={9} isLow />
            <StockNote remaining={0} isLow />
            <OriginLine localName="Nyanya" origin="Kirinyaga" />
          </div>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-5">
            <li>
              <ProductCard
                name="Sukuma wiki bunch"
                localName="Kale"
                localNameLang="en"
                origin="Kinangop"
                price={30}
                wasPrice={50}
                discountPercent={40}
                stockRemaining={40}
                stockIsLow={false}
                tone="green"
                media={<Emoji>🥬</Emoji>}
                action={
                  <Button size="sm" aria-label="Add Sukuma wiki bunch to basket">
                    Add
                  </Button>
                }
              />
            </li>
            <li>
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
                media={<Emoji>🍅</Emoji>}
                action={
                  <Button size="sm" aria-label="Add Tomatoes 1kg to basket">
                    Add
                  </Button>
                }
              />
            </li>
            <li>
              <ProductCard
                name="Kenya tea 250g"
                localName="Majani ya chai"
                origin="Kericho"
                price={140}
                stockRemaining={0}
                stockIsLow
                tone="mint"
                media={<Emoji>🍵</Emoji>}
                action={
                  <Button size="sm" disabled aria-label="Add Kenya tea 250g to basket (sold out)">
                    Add
                  </Button>
                }
              />
            </li>
          </ul>
        </div>
      </Section>

      <Section id="states" title="Loading, empty and error states">
        <div className="grid gap-6 lg:grid-cols-3">
          <LoadingState label="Loading products" />
          <EmptyState title="No products match" description="Try another word, like sukuma or unga." headingLevel={3} />
          <ErrorState headingLevel={3} />
        </div>
      </Section>
    </>
  );
}
