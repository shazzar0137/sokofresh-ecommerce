# Design Tokens

_Extracted 2026-11-27 from `assets/design-references/Soko Fresh – Kenyan grocery store.pdf` (desktop frame 1440 px, mobile frame 390 px, basket) and `.fig`. Source of truth in code: `frontend/src/app/globals.css` (`@theme`). Preview: `/design-system` in development._

## How they were extracted

| What | Method |
|---|---|
| Colours | Fill colours of the PDF's vector shapes (pdfplumber) and pixel samples of the rendered pages at known positions |
| Typefaces and weights | Font names stored in the Figma file (decoded `canvas.fig`): **Bricolage Grotesque ExtraBold** (108 uses) and **Figtree** Regular / SemiBold / Bold (454 uses). The PDF embeds outlined glyphs only |
| Sizes and positions | Character sizes and coordinates from the PDF text layer |
| Radii, button heights | Edge scans of a 2×-resolution render (±1 px) |

## Colour

| Token (`--color-*`) | Hex | Seen in the design | Tailwind classes |
|---|---|---|---|
| `ink` | `#16130F` | Text, top bar, footer, dark "Pilau night" kit, 2 px borders | `text-ink`, `bg-ink`, `border-border-strong` |
| `cream` | `#FBF8F1` | Page background | `bg-cream` |
| `tint` | `#F2ECDD` | Catalogue band, reason cards, ETA pill, plate rim | `bg-tint` |
| `line` | `#E6DFD0` | Dividers, quiet borders | `border-line` |
| `ink-muted` | `#6B6459` | Origins, subtitles, old prices | `text-ink-muted` |
| `card` | `#FFFFFF` | Product card body, inputs, "Add whole kit" button | `bg-card` |
| `brand` | `#0C6B3F` | Primary buttons, trust band, "Soko" in the logo, Ugali kit | `bg-brand`, `text-brand` |
| `accent` | `#B8262B` | Basket button, discount badges, low stock, "Fresh" in the logo, Chapati kit, testimonial | `bg-accent`, `text-accent` |
| `gold` | `#F0A30A` | "Picked 5am today" sticker | `bg-gold` |
| `tile-*` (15) | `#CFE8D3` … `#D7E9CF` | Pastel photo tiles behind each product (green, rose, lilac, lime, mango, avocado, lemon, maize, rice, wheat, sky, shell, lake, peach, mint) | `bg-tile-green` … |

Semantic aliases (`background`, `foreground`, `surface`, `border`, `price`, `price-was`, `discount`, `stock-low`, `success`, `danger`, `focus`) point at these, so components say *what* a colour means.

**Kenyan flag stripe:** the top edge of both frames has a 7 px stripe: 3 px ink, 2 px accent red, 2 px brand green (`FlagStripe`).

**Focus outline** (not in the design, needed for keyboard users): 3 px `ink` on light surfaces, `cream` inside `.surface-dark` (top bar, footer). No new brand colour was introduced.

### Contrast (WCAG 2.2 AA), checked in `tests/unit/design-tokens.test.ts` and by axe in a real browser

| Pair | Ratio | Needed |
|---|---|---|
| ink on cream / tint / card | 17.5 / 15.7 / 18.5 | 4.5 |
| ink-muted on cream / tint / card | 5.5 / 5.0 / 5.9 | 4.5 |
| white on brand (buttons, trust band) | 6.6 | 4.5 |
| white on accent (basket, badges) | 6.3 | 4.5 |
| accent text on card / cream (low stock, errors) | 6.3 / 5.9 | 4.5 |
| brand text on tint (ETA pill) | 5.6 | 4.5 |
| ink on gold (sticker) | 8.8 | 4.5 |
| cream on ink (top bar, footer) | 17.5 | 4.5 |

The green "Soko" and red "Fresh" wordmark do **not** have enough contrast on the black footer, which is why the footer shows the name in cream, as in the design.

## Typography

| Token (`--text-*`) | Mobile → desktop | Used for | Typeface |
|---|---|---|---|
| `display` | 44 → 72 px, line-height 1, −0.02em | Hero headline | Bricolage Grotesque 800 |
| `h1` | 32 → 44 px | Section and page titles ("Fresh from the soko") | Bricolage 800 |
| `h2` | 26 → 30 px | Meal-kit titles | Bricolage 800 |
| `h3` | 19 → 21 px | Reason card titles | Bricolage 800 |
| `product` | 16 → 19 px | Product names on cards | Bricolage 800 |
| `lead` | 16 → 19 px | Hero paragraph | Figtree 400 |
| `sub` | 15 → 17 px | Section subtitles | Figtree 400 |
| `body` | 16 px | Text, inputs | Figtree 400 |
| `small` | 14 px | Origins, top bar, footer | Figtree 400 |
| `caption` | 13 px | "Only 9 left today" (bold) | Figtree 700 |
| `micro` | 12 px | Discount badge (bold) | Figtree 700 |

Sizes between the two frames scale smoothly with `clamp()`. Prices: Figtree 700 at 18 px on cards, 28 px on kits. Button labels: Figtree 600.

Fonts: Latin variable files from Fontsource (`src/app/fonts/`, SIL Open Font License 1.1, licences alongside), loaded with `next/font/local`, `font-display: swap`, preloaded. Bricolage ≈ 41 KB, Figtree ≈ 20 KB.

> Naming note: `text-h1` is the *section-title size*, not "the h1 element". A page's `<h1>` may use `text-display` (home hero) or `text-h1`; a section's `<h2>` uses `text-h1`.

## Shape, layout, elevation

| Token | Value | Design source |
|---|---|---|
| `--radius-control` | 8 px | "Start shopping", "Add", area select, inputs |
| `--radius-card` | 14 px | Product and reason cards |
| `--radius-panel` | 18 px | Meal-kit cards, testimonial |
| `--radius-pill` | full | Search field, basket button, category tabs, badges |
| `--container-page` | 1280 px | Content width inside the 1440 frame |
| Page margins | 20 px (mobile) → 32 → 48 → 80 px (≥ 1280) | `PageContainer` |
| `--breakpoint-xs` | 360 px | Smallest supported phone |
| `--shadow-card`, `--shadow-overlay` | subtle | Cards are almost flat in the design |

Button heights: 48 px (primary CTA, design 49), 44 px (header controls), 36 px (card "Add", design 34). Inputs 48 px with a 2 px ink border. Product grid: 5 columns at ≥ 1280 px (cards ≈ 242 px, gaps ≈ 18 px in the design), 3 at 768–1279 px, 2 on phones.

## Corrections to the earlier design notes

The visual check corrected four points in `FRONTEND_ANALYSIS_2026-11.md` §9 that came from the PDF's text layer only:
- **D-1** Mobile meal-kit old prices are **not** cut off (KES 450 / 1,600 / 940 render fully); the text layer was misread.
- **D-2** Mobile origins are **not** swapped; the two-column text order confused the extraction.
- **D-8** The basket **does** have minus buttons (− 1 +). Unit prices are still missing (line totals only).
- **D-11** The eggs card **does** have an Add button.
