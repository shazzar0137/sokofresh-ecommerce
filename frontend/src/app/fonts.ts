import localFont from "next/font/local";

/**
 * Self-hosted fonts (ADR-0009): no request to Google at runtime or at build
 * time. Files: Latin subset of the variable fonts from Fontsource, SIL Open
 * Font License 1.1 (licences next to the files). Typefaces and weights come
 * from the Figma file: Bricolage Grotesque ExtraBold for headings, Figtree
 * Regular / SemiBold / Bold for text.
 */

export const figtree = localFont({
  src: "./fonts/Figtree-latin-wght.woff2",
  variable: "--font-figtree",
  weight: "300 900",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

export const bricolage = localFont({
  src: "./fonts/BricolageGrotesque-latin-wght.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
  fallback: ["Arial Black", "system-ui", "sans-serif"],
});
