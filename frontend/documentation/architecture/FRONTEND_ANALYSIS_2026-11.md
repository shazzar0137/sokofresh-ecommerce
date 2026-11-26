# Frontend Analysis — First Assignment (Proposed)

_Author: Frontend Specialist conversation · Date: 2026-11-26 · Status: **Accepted by owner 2026-11-26**, with the decisions below; **amended by the approved architecture review (ADR-0011, ADR-0012), see next section**_

## Approved amendments from the architecture review (2026-11-26)

These override anything later in this document that disagrees. Sources: `docs/architecture/TECHNICAL_ARCHITECTURE_PROPOSAL_2026-11.md` (approved), ADR-0011, ADR-0012.

| # | Amendment | Affects |
|---|---|---|
| A-1 | **Zustand removed.** The basket lives on the server; read and change it with TanStack Query; UI state in React state; filters in the URL | §3.11, §10 step 5 |
| A-2 | **Same-origin API:** the browser calls `/api/v1/...` and `/_allauth/...` on the storefront's own domain; Next.js rewrites them to Django. Personal data (basket, account, orders, rider) is fetched in the browser; public catalogue pages are server-rendered | §2, §8 |
| A-3 | **Checkout sign-in:** checkout asks for phone + one-time code, which signs in or creates the account. Guest checkout (FE-37) is merged into sign-in. "Send code" is protected by Cloudflare Turnstile | FE-31, FE-37, FE-40, `/checkout` |
| A-4 | **Payments at launch: Pochi la Biashara with manual verification.** Payment screen shows the Pochi number, exact amount and order reference, with a field for the M-Pesa confirmation code; statuses `awaiting_verification`, `paid`, `rejected`, `needs_review`. **No STK Push prompt at launch** (Pochi has no API). Daraja only in the development sandbox; Pesapal is a future update | FE-33, FE-34, FE-51, §3.7, §8 |
| A-5 | **Payment-timing switch:** the API's store settings say whether pay-now, pay-on-delivery or both are enabled; the UI shows only enabled options. Admin can switch at any time | FE-31, FE-33 |
| A-6 | **Guest basket identity agreed:** the Django session cookie (closes the D-015 coordination item) | §8 |
| A-7 | **Prices and stock change during the day:** wording "Only N left" (not "today" only); basket shows changes (FE-24); checkout handles 409 "prices changed" | FE-04, FE-24 |
| A-8 | **Delivery coverage:** Nairobi County and Kiambu, Kajiado, Machakos; zone list and fast/slot mode come from the API | FE-30, `DeliveryAreaPicker` |
| A-9 | **Design tokens unblocked:** PDF and Figma file are in `assets/design-references/` (KI-002 resolved); extraction is the first Phase 3 frontend task | §0, §4 |
| A-10 | **Runtime:** Node.js 24 LTS; one shared phone-number test list in `shared/test-fixtures/` | §7 item 7, tests |
| A-11 | **Google Maps (ADR-0013):** `@vis.gl/react-google-maps`. New components: `AddressPicker` (Places Autocomplete restricted to Kenya, session tokens, then a map with a **draggable pin the customer confirms**, plus estate/building/landmark fields), `MapView` (shared wrapper, Google attribution), `DeliveryPointLink` ("Open in Google Maps" URL, no API cost). Maps JS loads **only** on checkout, address and rider screens, never on home/shop (performance budget) | FE-30, FE-31, FE-43, §3.7, §7 |
| A-12 | **Fast vs slots decided by the server from the pin** (within 42 km of the dispatch point = fast with calculated ETA; rest of the four counties = slots). The hero area picker shows the zone list; exact mode, fee and ETA come from the API after the pin is set. Never promise "45 minutes" before the address is known | FE-02, FE-30, D-4 |
| A-13 | **Delivery partner, not in-house riders:** the rider screens (FE-50/51) are used by the partner's riders with Rider accounts; each delivery shows the address, landmark, pin link, items, amount due and Pochi details | §1.6, `/rider` |
| A-14 | Browser Maps key comes from public env config, restricted by website address and API; MSW mocks the backend geo endpoints; e2e tests use a mocked map or a test key | §8, tests |

## Owner decisions (2026-11-26)

| Item | Decision |
|---|---|
| This analysis | Accepted as the frontend baseline |
| §7 library choices | Accepted; recorded as ADR-0009 |
| Basket model (§8) | **Server-side basket for everyone, guests included.** The customer reads and changes it through the API; the frontend does not keep its own copy as the source of truth. Needs agreement with the Backend conversation on the endpoints and how a guest is identified |
| Testimonial (D-6) | Keep **one** clearly marked placeholder testimonial for development; it **must be deleted before launch** (launch-checklist item) |
| Delivery promise (D-4) | **Both:** fast delivery with an estimated arrival time for nearby areas; delivery slots for all other areas |
| Tea / pantry category (D-12) | New category **Beverages (Vinywaji)** for tea; further categories are planned in `docs/business-requirements/PRODUCT_CATEGORIES.md` |

This document is the frontend's first assignment: an analysis of the SokoFresh design reference and the approved project decisions, done **before** any code is written. Nothing here is implemented. Items marked **Proposed** need approval before they are acted on.

## How to read this document

| Label | Meaning |
|---|---|
| **Fact** | Verified from the design text, the filesystem or an accepted ADR |
| **Proposed** | A recommendation that needs approval |
| **Assumption** | Something we believe but have not confirmed |
| **Verify** | Needs checking against the visual PDF/Figma file |

## 0. Inputs and limits of this analysis

**Read before writing:** `PROJECT_STATE/00`–`05`, ADR-0001 to ADR-0008, `docs/requirements/REQUIREMENTS_BASELINE.md`, `docs/architecture/SYSTEM_ARCHITECTURE.md`, `docs/research/TECHNOLOGY_RESEARCH_2026-11.md`, `docs/research/DESIGN_REFERENCE_NOTES.md`, and the design PDF's text (Claude Project copy).

**Filesystem check (2026-11-26):** `frontend/` contains only empty folders with `.gitkeep` files and two READMEs. No package manifest, no code, no tests. (Fact)

**Limitation at the time of writing (now resolved, A-9):** the design PDF was not yet in the repository (KI-002) and the Claude Project only holds its *extracted text*. That means this analysis covers **content, structure, layout order and behaviour**, but it **cannot** give exact colour values, font families, font sizes, spacing or corner radii. Section 4 lists those tokens with "TBD — extract from PDF". Owner action: copy the PDF (and ideally the `.fig` Figma file) into `assets/design-references/`; then tokens can be extracted precisely.

**Already decided (ADR-0001, accepted):** Next.js 16 App Router, React, TypeScript, Tailwind CSS, shadcn/ui (Radix), TanStack Query, React Hook Form + Zod (Zustand removed by ADR-0011); tests with Vitest, React Testing Library, Playwright, axe-core. ADR-0004: REST + OpenAPI generated by the backend, frontend types via openapi-typescript. ADR-0008: staff use Django admin, so **no custom admin UI at launch**.

---

## 1. Frontend requirements

These translate the requirements baseline (FR/NFR IDs) and the design into what the frontend must do. "Pri" follows the baseline: M = launch, S = soon after, L = later.

### 1.1 Storefront and catalogue
| ID | Frontend requirement | Source | Pri |
|---|---|---|---|
| FE-01 | Global header: logo, search, delivery-area selector, free-delivery message, pay-on-delivery message, basket button with live item count | Design p1/p2 | M |
| FE-02 | Home page sections in design order: hero with delivery area + ETA, trust strip, meal kits, product grid with category tabs, "Why Nairobi shops with us", testimonial, footer | Design p1 | M |
| FE-03 | Category filter loaded from the API (launch list: All, Mboga, Matunda, Unga, Maziwa & Mayai, Nyama & Samaki, Vinywaji; register in `docs/business-requirements/PRODUCT_CATEGORIES.md`); filter state kept in the URL so it can be shared and survives refresh | FR-01 | M |
| FE-04 | Product card: image, English name, Swahili name, origin ("from Kinangop"), unit, price in KES, optional was-price + "Save X%" badge, optional "Only N left today", Add button, then a quantity stepper once added | FR-02–04 | M |
| FE-05 | Out-of-stock state: card shows "Sold out today", Add disabled. Add/stepper cannot exceed remaining stock (backend still enforces) | FR-04 | M |
| FE-06 | Search by English or Swahili name with results page, empty state and suggestions; search box submits to a URL (`?q=`) | FR-05 | M |
| FE-07 | Product detail page: larger image, both names, unit, price, origin, farm summary, stock, add to basket | FR-06 | S |
| FE-08 | Farm/supplier profile page | FR-07 | S |
| FE-09 | All prices, discounts and stock shown are **values returned by the API**; the frontend formats them but never calculates the authoritative price | Architecture §2 | M |

### 1.2 Meal kits
| ID | Frontend requirement | Source | Pri |
|---|---|---|---|
| FE-10 | Meal-kit card: name, item list, kit price, separate-items total (struck through), "Add whole kit" | FR-10 | M |
| FE-11 | Adding a kit shows a clear result: success, or which item is out of stock and what the customer can do | FR-11 | M |
| FE-12 | Kit appears in the basket as one line that can expand to show its items | FR-11 | M |

### 1.3 Basket
| ID | Frontend requirement | Source | Pri |
|---|---|---|---|
| FE-20 | Basket page (and a slide-over panel on desktop): line items with image, name, unit price, line total, decrease / increase / remove controls | FR-20, design p3 | M |
| FE-21 | Basket survives page changes and return visits; it is stored **on the server** for guests and signed-in customers (owner decision 2026-11-26, §8) | FR-20 | M |
| FE-22 | Free-delivery progress: "Add KES 410 more for free delivery", with a progress bar; message changes when the threshold is reached | FR-21 | M |
| FE-23 | Subtotal, delivery fee and total shown from the API's basket quote | FR-21 | M |
| FE-24 | When prices or stock changed since an item was added, the basket shows what changed before checkout | FR-04, FE-09 | M |
| FE-25 | Empty-basket state with a route back to shopping | — | M |

### 1.4 Checkout, payment, orders
| ID | Frontend requirement | Source | Pri |
|---|---|---|---|
| FE-30 | Delivery area selection. **Fast areas** show an estimated arrival time; **slot areas** show available slots and cut-off messaging ("Order by 2pm for an evening slot"). The UI follows the mode the API returns for each area (owner decision 2026-11-26) | FR-22, FR-50 | M |
| FE-31 | Checkout steps: delivery (area, address details, landmark, slot) → contact (name, phone for M-Pesa) → review and place order | FR-23 | M |
| FE-32 | Kenyan phone input that accepts `07…`, `01…`, `+254…`, `254…` and spaces, normalises for the API, and gives clear errors (backend re-validates) | FR-23 | M |
| FE-33 | Order confirmation page with order reference, what happens next, and payment explanation (e.g. "Pay the rider's shown Pochi la Biashara number when your order arrives", following the enabled payment timing, A-4/A-5) | FR-24, FR-31 | M |
| FE-34 | Payment screen and status for Pochi la Biashara (A-4): Pochi number, amount, order reference, M-Pesa code entry, then `awaiting_verification` / `paid` / `rejected` / `needs_review`. Shows only the status the backend reports; never marks an order paid on its own | FR-30–32 | M |
| FE-35 | Order tracking page: confirmed → packed → out for delivery → delivered, with timestamps | FR-51 | M |
| FE-36 | Order history and reorder | FR-42 | S |
| FE-37 | ~~Guest checkout~~ merged into phone + code sign-in at checkout (A-3) | FR-25 | — |

### 1.5 Accounts and privacy
| ID | Frontend requirement | Source | Pri |
|---|---|---|---|
| FE-40 | Sign in / register with phone number and one-time code (UI depends on ADR-0005, still Proposed) | FR-40 | M |
| FE-41 | Account page: profile, orders, sign out | FR-40 | M |
| FE-42 | Request account and data deletion, with confirmation | FR-43 | M |
| FE-43 | Saved addresses | FR-41 | S |
| FE-44 | Privacy policy, terms, refund/freshness-guarantee policy pages linked from footer and checkout | NFR-07 | M |

### 1.6 Rider screens
| ID | Frontend requirement | Source | Pri |
|---|---|---|---|
| FE-50 | Rider list of assigned deliveries (mobile only layout), address, phone, items, amount | FR-52 | M |
| FE-51 | Rider "Arrived" action, then a pay-on-delivery screen showing the Pochi details and a field to record the customer's M-Pesa code (A-4); then payment status; "Delivered" confirmation; item rejection for the fresh guarantee (S) | FR-31, FR-52, FR-33 | M |

### 1.7 Administration
Staff administration is **Django admin** at launch (ADR-0008). The frontend builds **no admin screens** now; `admin-dashboard` folders stay reserved for Phase 10. (Fact)

### 1.8 Cross-cutting
| ID | Requirement | Source |
|---|---|---|
| FE-60 | Every data view has loading (skeleton), empty, error and offline states | Quality |
| FE-61 | Mobile-first; fully usable from 320 CSS px (WCAG reflow) and designed for 360 px | NFR-03, NFR-08 |
| FE-62 | Performance budget: LCP < 2.5 s, INP < 200 ms, CLS < 0.1 on a mid-range Android over 4G; storefront initial JavaScript kept small (**Proposed** target: under 170 KB compressed on home/shop) | NFR-01 |
| FE-63 | WCAG 2.2 AA (see §6) | NFR-08 |
| FE-64 | KES formatting (`KES 1,090`), Africa/Nairobi times, Swahili names marked `lang="sw"`; English UI at launch, structured so Swahili UI can be added later | NFR-09 |
| FE-65 | Browser support: Chrome Android, Safari iOS, Samsung Internet, desktop Chrome/Edge/Firefox | NFR-10 |
| FE-66 | Security: no secrets in frontend code; session cookies handled by the backend (HttpOnly); CSP and security headers; no `dangerouslySetInnerHTML` on API text; role checks are UI convenience only, backend authorises | §6 of role brief, Architecture §5 |
| FE-67 | Errors reported to the error tracker (Sentry proposed in ADR-0007) without personal data | NFR-13 |
| FE-68 | Mock data is clearly labelled in the UI during development and never shipped to production | Role brief §8 |

---

## 2. Page and route inventory

Next.js App Router uses folders under `src/app/` as URLs. Route groups in brackets, e.g. `(shop)`, organise folders **without** appearing in the URL. All routes are **Proposed**.

| Route | Page | Pri | Rendering (proposed) | Auth |
|---|---|---|---|---|
| `/` | Home (hero, trust, meal kits, product grid, reasons, footer) | M | Server-rendered, short cache | Public |
| `/shop` | All products; `?category=mboga&q=sukuma&page=2` | M | Server-rendered | Public |
| `/shop/[category]` | Category page (SEO-friendly alias of the filter) | S | Server-rendered | Public |
| `/search?q=` | Search results (may simply redirect to `/shop?q=`) | M | Server-rendered | Public |
| `/products/[slug]` | Product detail | S | Server-rendered | Public |
| `/meal-kits` | All meal kits | M | Server-rendered | Public |
| `/meal-kits/[slug]` | Meal-kit detail | S | Server-rendered | Public |
| `/farms/[slug]` | Farm/supplier profile | S | Server-rendered | Public |
| `/basket` | Basket (full page; mobile primary) | M | Client | Public |
| `/checkout` | Checkout steps (delivery → contact → review) | M | Client | Phone + code at checkout (A-3) |
| `/orders/[ref]` | Confirmation + tracking + payment status | M | Client with polling | Owner of order |
| `/sign-in` | Phone entry | M | Client | Public |
| `/sign-in/verify` | Code entry | M | Client | Public |
| `/account` | Account overview | M | Client | Customer |
| `/account/orders` | Order history | S | Client | Customer |
| `/account/addresses` | Saved addresses | S | Client | Customer |
| `/account/privacy` | Data download/deletion request | M | Client | Customer |
| `/rider` | Assigned deliveries | M | Client | Rider |
| `/rider/deliveries/[id]` | Delivery detail, request payment, mark delivered | M | Client | Rider |
| `/delivery` | Delivery areas, fees, cut-off times | M | Static/ISR | Public |
| `/help` | FAQ + WhatsApp/contact | M | Static | Public |
| `/legal/privacy`, `/legal/terms`, `/legal/refunds` | Policies | M | Static | Public |
| `not-found`, `error`, `global-error` | 404 / error pages | M | — | — |

**Overlays (not separate URLs):** basket slide-over (desktop), delivery-area picker dialog, mobile search sheet, mobile menu.

**Folder change needed (KI-003):** `frontend/src/pages/` must be removed or renamed at scaffold because Next.js treats `src/pages/` as its older router. **Proposed:** screens live in `src/app/` route folders; delete the empty `src/pages/*` folders and `src/routes/` (App Router replaces both). Requires owner approval at Phase 3.

---

## 3. Component inventory

Strategy: **reuse shadcn/ui primitives** (accessible, built on Radix, copied into our repo so there is no lock-in) and build **only SokoFresh-specific components** on top. Folder names follow the existing scaffold.

### 3.1 Primitives from shadcn/ui (`src/components/ui/`) — reuse, then style
Button, Input, Label, Form (React Hook Form binding), Select, RadioGroup, Checkbox, Dialog, Sheet (slide-over/bottom sheet), Tabs (or ToggleGroup for categories), Badge, Card, Skeleton, Separator, Alert, Sonner (toasts), Accordion (FAQ), Progress, InputOTP (code entry), ScrollArea, DropdownMenu.

### 3.2 Layout and navigation (`components/layout`, `components/navigation`)
| Component | Notes |
|---|---|
| `SiteHeader` | Desktop: logo, search, area picker, basket. Mobile: logo + basket row, search below |
| `AnnouncementBar` | "Free delivery over KES 1,500", "Pay on delivery with M-Pesa" (values from API settings) |
| `DeliveryAreaPicker` | Button "Kilimani ▾" opening a dialog of areas with ETA/fee; "My area isn't listed" path |
| `SearchBox` | Submits to `/shop?q=`; mobile opens a sheet |
| `BasketButton` | Count badge with accessible label "Basket, 3 items" |
| `MobileBasketBar` | Sticky bottom bar on mobile when the basket has items: total + "View basket" |
| `SiteFooter` | Contact, hours, M-Pesa till, links to policies |
| `SkipLink`, `PageContainer`, `Section`, `SectionHeading` | Structure and spacing consistency |

### 3.3 Catalogue (`components/products`)
`ProductCard`, `ProductGrid`, `CategoryTabs`, `PriceDisplay` (price + was-price with screen-reader text), `DiscountBadge`, `StockNote`, `OriginLine` ("Kale from Kinangop"), `ProductImage` (next/image wrapper with fallback), `AddToBasketControl` (Add → `QuantityStepper`), `EmptyResults`, `ProductDetail`, `FarmCard`.

### 3.4 Meal kits (`components/products` or a `meal-kits` subfolder)
`MealKitCard`, `MealKitItemList`, `AddKitButton`, `MealKitCarousel` (scroll on mobile, grid on desktop).

### 3.5 Trust and marketing (`components/common`)
`HeroDelivery`, `TrustStrip`, `ReasonsGrid`, `Testimonial` (real, consented quotes only — see §9).

### 3.6 Basket (`components/cart`)
`BasketPanel` (slide-over), `BasketLineItem`, `BasketKitLine`, `QuantityStepper` (shared), `FreeDeliveryProgress`, `BasketSummary`, `BasketChangesNotice`, `EmptyBasket`.

### 3.7 Checkout and payment (`components/checkout`, `components/forms`)
`CheckoutSteps` (progress indicator), `DeliveryDetailsForm`, `SlotPicker`, `ContactForm`, `PhoneInput` (Kenyan normalisation), `OrderReview`, `PlaceOrderButton`, `PaymentStatus` (waiting/paid/failed/timeout), `FormErrorSummary`.

### 3.8 Orders and account (`components/orders`, `components/account`)
`OrderStatusTimeline`, `OrderSummaryCard`, `OrderHistoryList`, `ReorderButton`, `AccountNav`, `DeleteAccountRequest`, `PhoneSignInForm`, `CodeVerifyForm`.

### 3.9 Rider (`components/rider` — new folder, Proposed)
`DeliveryList`, `DeliveryCard`, `RequestPaymentButton`, `DeliveryStatusActions`.

### 3.10 Feedback and system
`LoadingState`, `ErrorState` (with retry), `OfflineBanner`, `MockDataBanner` (development only), `LiveRegion` (announces basket changes to screen readers).

### 3.11 Non-UI feature logic (`src/features/*`)
`catalogue` (queries), `search`, `cart` (TanStack Query hooks for the server basket), `checkout`, `payments` (status polling), `authentication`, `order-management`, `delivery` (areas, slots). `src/api/` holds the generated client; `src/utils/` holds `formatKES`, `normaliseKenyanPhone`, date helpers.

---

## 4. Design-system inventory

Design tokens are named values (colours, sizes) defined once and used everywhere, so the look stays consistent and can change in one place. They will live in Tailwind's theme / CSS variables (`src/styles/`).

### 4.1 Colour tokens — **values TBD, extract from PDF (KI-002)**
| Token | Use seen in design |
|---|---|
| `brand` / `brand-foreground` | Primary actions (Add, Start shopping, Add whole kit, Pay) |
| `brand-subtle` | Hero/section backgrounds |
| `surface`, `surface-muted`, `border` | Cards, page background, dividers |
| `text`, `text-muted` | Body text, origin lines, secondary copy |
| `price` | Current price |
| `price-was` | Struck-through old price (must still meet contrast) |
| `discount` | "Save 40%" badge |
| `stock-low` | "Only 9 left today" |
| `success`, `warning`, `danger`, `info` | Payment and form states |
| `focus-ring` | Keyboard focus outline |
| `mpesa` (Assumption) | If the design uses M-Pesa green; check brand-usage rules before using Safaricom's colours/logo |

Every text/background pair must reach 4.5:1 contrast (3:1 for large text and UI outlines); checked automatically with axe and manually during token extraction.

### 4.2 Typography — **families and sizes TBD (PDF)**
Proposed scale (adjust to the design): display (hero), h1, h2 (section titles such as "Fresh from the soko"), h3 (card titles), body, small (origin, stock notes), caption. Fonts self-hosted with `next/font` (no request to Google at runtime, better privacy and speed), maximum two families, `font-display: swap`, minimum body size 16 px on mobile.

### 4.3 Spacing, size, shape
- Spacing on a 4 px base (Tailwind default scale). **Verify** card padding and section gaps against the PDF.
- Radii: `sm` (inputs/badges), `md` (cards), `full` (pills, count badges) — values TBD.
- Elevation: 2 levels (card, overlay) — TBD.
- Touch targets: at least 44 × 44 px for buttons and steppers (WCAG minimum is 24 × 24).

### 4.4 Breakpoints (Proposed: Tailwind defaults)
`base` < 640 · `sm` ≥ 640 · `md` ≥ 768 · `lg` ≥ 1024 · `xl` ≥ 1280. Content max width ~1200–1280 px (**Verify**).

### 4.5 Iconography and imagery
- The design uses **emoji** as product images and icons (🥬 🚚 📱). Proposed: real product photos for products, a consistent icon set (Lucide) for UI, emoji kept only as decorative fallbacks with `aria-hidden`. Reason: emoji render differently across Android brands, are read aloud by screen readers ("leafy green"), and look less trustworthy for a food shop.
- Product images: square 1:1, WebP/AVIF via `next/image`, explicit sizes to avoid layout shift, low-quality placeholder.

### 4.6 Motion
Short (150–200 ms) transitions for basket count and panel open; all disabled under `prefers-reduced-motion`.

### 4.7 Content patterns (part of the design system)
- Money: `KES 1,090` (no decimals; thin non-breaking space between `KES` and amount). Was-price: visually struck; screen readers hear "Now KES 30, was KES 50".
- Product naming: English name first, then Swahili name + origin: "Kale from Kinangop" with "Sukuma wiki" marked `lang="sw"`.
- Stock: "Only N left today" when below a threshold set by the backend.
- Tone: warm, short, bilingual phrases ("Karibu") as in the design.

---

## 5. Responsive behaviour requirements

| Area | Mobile (360 px) | Tablet (768 px) | Desktop (≥ 1024 px) |
|---|---|---|---|
| Header | Logo + basket on one row; search full-width below; area picker in hero | Search inline | Full single row: logo, search, area, basket; announcement bar above |
| Announcement messages | One message, rotates or truncates | Two messages | Both messages visible |
| Hero | Stacked: headline, copy, area picker, CTA; decorative produce visual reduced or hidden | Two columns if space | Two columns: copy + visual ("Picked 5am today" badges) |
| Trust strip | Horizontal scroll of chips, 1.5 visible to hint scrolling | 2 × 2 | 4 in a row |
| Meal kits | Horizontal scroll cards; item list collapsed to emoji/short line (as in design p2) | 2 columns | 3 columns with full item list |
| Category tabs | Horizontally scrollable, sticky under header | Same | Inline row |
| Product grid | 2 columns (design p2) | 3 columns | 4–5 columns (**Verify** count in PDF) |
| Product card | Compact: image, names, price, Add | Same | Adds Swahili name + origin line in full |
| Basket | Full page `/basket`; sticky bottom basket bar while shopping | Slide-over sheet | Slide-over sheet from right, plus `/basket` page |
| Checkout | One column, one step per screen, sticky "Continue" button | One column, wider | Two columns: form + order summary |
| Reasons section | Stacked, 3 items (design drops "Evening slots" on mobile) | 2 × 2 | 4 in a row |
| Footer | Stacked | 2 columns | Multi-column |
| Rider screens | Designed for phones only; usable but not optimised on desktop | — | — |

Rules for all sizes:
- No horizontal page scrolling at 320 px; text zoom to 200% must not break layouts.
- Sticky elements (header, category tabs, basket bar) must not hide the focused element (WCAG 2.4.11) — limit sticky height on small screens.
- Images served at the size they are displayed (`sizes` attribute) to save mobile data.
- Tested at 360, 390, 768, 1024, 1280 and 1440 px in Playwright (Chromium, WebKit) plus at least one real mid-range Android device before launch.

---

## 6. Accessibility requirements (WCAG 2.2 AA, NFR-08)

**Structure and navigation**
- One `h1` per page; section headings in order. Landmarks: header, nav, main, footer. Skip link to main content.
- Page `<title>` changes on navigation; focus moves to the new page heading after client-side navigation.
- Category tabs: use a list of links (shareable URLs) or Radix Tabs with arrow-key support.

**Content**
- `lang="en"` on the page; Swahili words wrapped with `lang="sw"` (screen readers pronounce them correctly).
- Emoji used as decoration get `aria-hidden="true"`; real images get meaningful `alt` ("Sukuma wiki bunch").
- Prices: strikethrough is not read by screen readers, so add visible-or-hidden text "was". Discount badges read as "Save 40 percent".
- Colour never the only signal (low stock also uses text; errors use text and icon).

**Interaction**
- All controls reachable and usable by keyboard; visible focus ring (`focus-ring` token, ≥ 3:1).
- Quantity stepper buttons labelled "Decrease quantity of Tomatoes 1kg" / "Increase…"; remove button "Remove Tilapia 1kg from basket". The design's cart shows "1 +" and "✕" without a visible minus — add a minus button.
- Target size ≥ 24 × 24 px minimum (2.5.8); project target 44 × 44.
- Basket updates announced through a polite live region ("Tomatoes 1kg added. Basket: 3 items.").
- Dialogs/sheets (area picker, basket) trap focus, close with Esc, and return focus to the opener (Radix does this).

**Forms**
- Visible labels (placeholder text like "07XX XXX XXX" is not a label). Correct `type`, `inputmode="tel"`, `autocomplete="tel"`, `autocomplete="one-time-code"` on the code field.
- Errors: inline next to the field and a summary at the top, linked to fields; focus moves to the summary on submit.
- Redundant entry (3.3.7): do not ask for the phone number twice; prefill from sign-in.
- Accessible authentication (3.3.8): code input allows paste and autofill; no puzzles.
- Payment waiting screen does not time out silently; status changes announced.

**Help and consistency**
- WhatsApp/help link in the same place on every page (3.2.6).

**Testing**
- Automated: axe-core in component tests and Playwright on every page and key state (empty basket, errors, dialogs open).
- Manual before launch: keyboard-only run of the purchase flow; TalkBack (Android) and VoiceOver (iOS) checks; 200% zoom; reduced motion.
- Automated tools catch roughly a third of issues, so manual checks are required, not optional.

---

## 7. Frontend technology comparison

The main stack is decided (ADR-0001). The table below covers **only the frontend choices still open**. Each recommendation is **Proposed** and should be approved as one ADR (suggested **ADR-0009: Frontend supporting libraries**) coordinated with the Project Architect.

Versions checked 2026-11-26: Next.js 16.x is current, with monthly scheduled security releases (latest November 2026). Re-check all versions at scaffold time.

| # | Need | Options considered | Recommendation | Why |
|---|---|---|---|---|
| 1 | Typed API client | (a) `openapi-fetch` (+ optional `openapi-react-query`); (b) `@hey-api/openapi-ts` generated SDK; (c) Orval; (d) hand-written `fetch` | **(a) openapi-fetch**, from the same openapi-ts project as the already-approved openapi-typescript; add the ~1 KB `openapi-react-query` wrapper only if it simplifies hooks | Tiny, no generated code to maintain, URL and parameter typos become type errors; same maintainers as the type generator. (b)/(c) generate more code and add a dependency surface |
| 2 | API mocks while the backend is unbuilt | (a) MSW (Mock Service Worker); (b) json-server; (c) hard-coded fixtures in components | **(a) MSW**, handlers typed from the OpenAPI contract, fixtures in `frontend/tests/fixtures` | Intercepts real network calls, so the same code runs against mocks and the live API; reused in Vitest and Playwright. Mocks visibly labelled (`MockDataBanner`) and disabled in production builds |
| 3 | Icons | Lucide, Heroicons, emoji | **Lucide (`lucide-react`)** | shadcn/ui default, tree-shaken (only used icons are bundled), ISC licence |
| 4 | Toasts | Sonner, Radix Toast | **Sonner** (shadcn default) | Accessible, already part of shadcn's set |
| 5 | Fonts | `next/font` self-host, Google Fonts link | **`next/font`** with the PDF's typefaces (licence to be checked) | No runtime third-party request (privacy, speed), no layout shift |
| 6 | Image delivery | `next/image` with host optimisation; `next/image` + custom loader to Cloudflare Images/R2 transformations; pre-sized uploads | **`next/image` now; loader decided with ADR-0007 (hosting)** | Host image-optimisation is metered on some plans; decide with hosting cost |
| 7 | Phone validation | Custom Zod rule; `libphonenumber-js` | **Custom Zod normaliser** for Kenyan mobile numbers (`07`, `01`, `+254`, `254`) | Kenyan-only service; avoids a large library; backend remains authoritative |
| 8 | Visual regression | Playwright `toHaveScreenshot()`; hosted (Chromatic/Percy/Argos, free tiers ~5,000 shots/month) | **Playwright built-in**, baselines generated in the CI Docker image | Free, already in our stack; hosted tools can be added later if review becomes painful |
| 9 | Component workshop | Storybook; none | **Defer** until the design system has ~10 components; then reassess | Useful for documenting the design system, but a large extra tool while learning |
| 10 | Translations (Swahili UI is "L") | next-intl now; later; none | **Defer the library**; keep UI copy in components but use `lang` attributes and avoid text baked into images | Avoids complexity now; next-intl is the likely choice in Phase 10 |
| 11 | Analytics | Vercel Analytics, Plausible, none | **Defer**; decide with privacy (Kenya DPA) and hosting | Must not collect personal data without a lawful basis |
| 12 | Package manager | npm, pnpm | **npm** (Phase 3 decision) | Comes with Node, simplest for learning; pnpm possible later |

What was deliberately **not** added: a separate UI kit (MUI, Chakra) — shadcn covers it; Redux — Zustand is enough; a CSS-in-JS library — Tailwind covers it; a search service (Algolia) — PostgreSQL search is approved (ADR-0003).

---

## 8. Backend coordination (to agree with the Backend conversation and Architect)

**Nothing here is an agreed contract.** These are the frontend's needs, to be turned into OpenAPI endpoints by the backend. Until then the frontend uses labelled MSW mocks shaped like this list.

| Need | Data the frontend expects | Notes |
|---|---|---|
| Store settings | free-delivery threshold, opening hours, contact, till number | Avoid hard-coding KES 1,500 |
| Categories | id, slug, English + Swahili name, order | Tea (Kenya tea 250g) fits none of the design's categories — see §9 |
| Product list | slug, names (en/sw), unit label, price, was-price, discount %, stock remaining today, low-stock flag, image URLs + alt, category, origin/farm summary | Filters: category, `q`, page; pagination format to agree |
| Product detail, farm | + description, farm name, location, story | S priority |
| Meal kits | slug, name, items (product + qty), kit price, separate total, availability | Server computes saving |
| Delivery areas | name, fee, **delivery mode (fast or slots)**, ETA for fast areas, slots and cut-off for slot areas; **quote for a confirmed pin** (lat/lng + place ID → mode, fee, ETA or slots, or outside area) | Drives hero picker and checkout (D-017, A-11/A-12) |
| Basket | Server basket for every visitor: get basket, add item/kit, change quantity, remove item; response includes validated prices, stock problems, delivery fee and total | **Decided: server basket** (owner, 2026-11-26). **Agreed (A-6):** guest basket held in the Django session; CSRF on writes; 30-day expiry; merge into the account at sign-in |
| Orders | create order (idempotency key), get order by reference, status history | Order reference must not be guessable |
| Payments | Pochi details (number, amount, reference), submit M-Pesa code, payment status per order (`awaiting_verification`/`paid`/`rejected`/`needs_review`), enabled payment timings from store settings | Frontend never decides paid status (A-4, A-5) |
| Auth | allauth headless endpoints, session cookie, CSRF token flow | Depends on ADR-0005 |
| Rider | assigned deliveries, request-payment action, mark delivered | Rider role permission on backend |
| Errors | One consistent error format for all endpoints (**Proposed:** RFC 9457 "problem details" with field-level errors) | Needed for form error display |

---

## 9. Design review: issues and proposed improvements

The design is a strong reference. Its pricing is internally consistent: every kit's separate total equals the sum of its items, and the discount percentages and the basket total (KES 1,090, KES 410 to free delivery) check out. The items below should not be copied blindly. Each needs a quick owner decision.

| # | Observation | Type | Proposed handling |
|---|---|---|---|
| D-1 | Mobile kit was-prices appear cut off ("KES 50", "KES 1,00", "KES 0" vs desktop 450 / 1,600 / 940) | Layout bug | Wrap or shrink on mobile; never truncate prices. **Verify** in PDF |
| D-2 | On mobile, origins look swapped (sukuma "From Kirinyaga", mangoes "From Murang'a") | Possible extraction order or design error | **Verify** in PDF; origins come from data anyway |
| D-3 | "Murang a" missing apostrophe | Text encoding | Use "Murang'a"; ensure UTF-8 throughout |
| D-4 | Hero promises "Arrives in about 45 minutes", while reasons say "Order by 2pm… evening slots" and the tagline says "at your gate by evening" | Conflicting delivery promise | **Decided:** fast delivery with ETA for nearby areas, slots elsewhere. Hero and checkout show the ETA or the next available slot for the chosen area; copy must not promise 45 minutes to slot-only areas |
| D-5 | "Live delivery tracking" in the trust strip, but live map tracking is a Later feature (FR-53) | Over-promise | Say "Track your order" at launch |
| D-6 | Testimonial "Wanjiku, Kilimani" is placeholder text | Trust/legal | **Decided:** one placeholder only, marked as placeholder in the data, deleted before launch. Real, consented quotes after launch |
| D-7 | Footer contact details are placeholders (0700 000 000, Till 000000) | Content | Load from store settings; block launch until real |
| D-8 | Basket shows line totals but not unit prices; no visible minus button | Usability/accessibility | Show "KES 30 each"; add minus and labelled remove |
| D-9 | Basket goes straight to "Pay with M-Pesa on delivery" with only a phone number; no address, slot or review | Missing checkout | Full checkout flow (FE-31) |
| D-10 | M-Pesa placeholder "07XX XXX XXX" | Validation gap | Also accept `01…` and `+254…` numbers |
| D-11 | Eggs card has no Add button in the extracted text | Unclear state | **Verify**; if intentional, define a "sold out" state |
| D-12 | No category for tea (and possibly other pantry items) | Information architecture | **Decided:** add Beverages (Vinywaji); keep future categories in `docs/business-requirements/PRODUCT_CATEGORIES.md`. Category tabs are data-driven, never hard-coded |
| D-13 | No sign-in, account or "track my order" entry in header | Missing navigation | Add account icon and order lookup |
| D-14 | Emoji as product images and icons | Trust, consistency, accessibility | Real photos + icon set (§4.5) |
| D-15 | No visible delivery fee before the threshold | Pricing transparency | Show fee in basket and checkout |
| D-16 | "Money back" / "Not fresh? Money back" guarantee | Policy dependency | Needs a written refund policy page (FR-33 is S) before the claim is shown |
| D-17 | Use of M-Pesa name/colours | Brand rules | Check Safaricom brand-usage guidance before using their logo or colours |

---

## 10. Recommended implementation sequence

Each step is small, testable and ends with tests run and PROJECT_STATE updated. **Steps 1 onward need owner approval** (they install packages).

| Step | Work | Depends on | Done when |
|---|---|---|---|
| 0 | Owner: copy PDF (+ Figma) into repo (KI-002); approve this analysis; decide ADR-0009 items; answer D-4, D-6, D-12 | — | Approvals recorded |
| 1 | **Scaffold** (Phase 3): `create-next-app` with TypeScript, App Router, Tailwind, ESLint; resolve KI-003; shadcn/ui init; Vitest + RTL; Playwright + axe; CI job for lint, type-check, tests | Step 0, git repo | Empty app builds; one smoke test each runner passes in CI |
| 2 | **Design tokens** extracted from PDF into Tailwind theme; fonts via next/font; contrast checked | PDF in repo | Token page renders; axe passes |
| 3 | **Foundations**: layout shell (header, footer, skip link), `formatKES`, phone normaliser (unit-tested), error/loading/empty components, API client + MSW mock layer from fixtures | Steps 1–2 | Unit and component tests pass |
| 4 | **Catalogue (read-only)**: product card, grid, category tabs, search, home page sections, delivery-area picker (display) | Step 3; backend catalogue contract draft | Home and shop match design at 360/768/1280; Lighthouse/LCP measured |
| 5 | **Basket + meal kits**: server basket via TanStack Query, stepper, free-delivery progress, quote validation, kits | Step 4; basket decision (§8) | Add/update/remove E2E tests pass |
| 6 | **Sign-in** (phone + code) | ADR-0005 accepted; backend auth | Sign-in E2E against backend in dev |
| 7 | **Checkout + orders**: delivery details, slots, review, place order, confirmation, tracking, payment status UI | Steps 5–6; backend orders/payments on Daraja sandbox | Full purchase E2E on sandbox, including failed/timeout payment |
| 8 | **Account**: order history, reorder, data-deletion request, addresses (S) | Step 7 | E2E pass |
| 9 | **Rider screens** | Backend rider API | Rider flow E2E |
| 10 | **Hardening**: visual regression baselines, full axe + manual screen-reader pass, real-phone performance, CSP/security headers, dependency audit | All above | Reports in `tests/reports/` |

Mocks are replaced by the real API endpoint by endpoint as the backend delivers them; each swap is a contract check, not a rewrite.

---

## 11. Decisions requested from the owner / Project Architect

1. Approve this analysis as the frontend baseline (or request changes).
2. Approve the supporting libraries in §7 (to be recorded as ADR-0009).
3. Basket model: device-stored guest basket validated by a quote endpoint, or server basket for everyone (§8, with Backend).
4. Delivery promise model (D-4) and testimonial handling (D-6).
5. Category for tea and pantry items (D-12).
6. Folder clean-up for KI-003 at scaffold: remove `src/pages/` and `src/routes/`, add `src/components/ui/` and `src/components/rider/`.
7. Owner action: copy the design PDF (and `.fig` file) into `assets/design-references/` so design tokens can be extracted.
