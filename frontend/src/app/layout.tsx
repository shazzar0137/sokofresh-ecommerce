import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { MockDataBanner } from "@/components/common/mock-data-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { siteUrl } from "@/config/public-env";

import { bricolage, figtree } from "./fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SokoFresh: fresh Kenyan groceries, delivered",
    template: "%s · SokoFresh",
  },
  description:
    "Fresh produce and groceries from named Kenyan farms, delivered in Nairobi and neighbouring counties. Pay with M-Pesa.",
  applicationName: "SokoFresh",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf8f1",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${bricolage.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        <Providers>
          <MockDataBanner />
          <SiteHeader />
          <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
