# Components (Phase 3 foundation)

_Updated 2026-11-27. Live preview of everything below: `/design-system` (development and test builds only)._

Rules: components take plain values and never calculate prices or stock; Server Components by default, `"use client"` only for interactivity; every interactive element has an accessible name; class names merge through `cn()` (`src/lib/utils.ts`, which knows the custom font-size tokens).

## Primitives (`src/components/ui/`, shadcn/ui pattern)

| Component | Props worth knowing | Notes |
|---|---|---|
| `Button` | `variant`: primary · accent · dark · light · outline · ghost; `size`: sm (36) · md (44) · lg (48) · icon; `shape`: control · pill; `block`; `asChild` | Defaults to `type="button"`. `asChild` styles a `next/link` as a button |
| `Input` | all `<input>` props | 2 px ink border, 48 px; red border when `aria-invalid` |
| `Label` | Radix label | Client component |
| `Badge` | `variant`: discount · sticker · neutral | "Save 40%", "Picked 5am today", "From Kirinyaga" |
| `Skeleton` | `className` | Hidden from screen readers |

## Layout and navigation

| Component | File | Notes |
|---|---|---|
| `SiteHeader` | `layout/site-header.tsx` | Logo · search · basket in one row from 768 px; search on its own row on phones. `announcements` and `basketCount` props are empty until store settings (Phase 4) and the basket (Phase 5) exist |
| `AnnouncementBar`, `FlagStripe` | `layout/announcement-bar.tsx` | Black top bar under the flag stripe; only the first message shows on phones |
| `SiteFooter` | `layout/site-footer.tsx` | No contact details until they come from store settings (D-7) |
| `PageContainer` | `layout/page-container.tsx` | 20 → 80 px margins, 1280 px content |
| `Section` | `layout/section.tsx` | Full-width band with an `<h2>` title, optional subtitle, `tone` cream or tint; labelled by its heading |
| `SkipLink` | `layout/skip-link.tsx` | First Tab stop; jumps to `#main-content` |
| `Logo` | `navigation/logo.tsx` | Text wordmark, links home |
| `SearchBox` | `navigation/search-box.tsx` | Plain GET form to `/shop?q=`; works without JavaScript; 100-character limit |
| `BasketButton` | `navigation/basket-button.tsx` | Announces "Basket, 3 items"; shows no number while the count is unknown |

## Typography and states (`components/common/`)

| Component | Notes |
|---|---|
| `Heading` (`level`, `size`), `Text` (`variant`), `VisuallyHidden` | `level` sets the element (page outline), `size` sets the look |
| `LoadingState` | `role="status"`, polite announcement, skeleton rows |
| `EmptyState` | Title, description, action; `headingLevel` 2 or 3 |
| `ErrorState` | Client component; friendly wording from the error code; optional retry |
| `MockDataBanner` | Visible whenever MSW mock data is on |

## Forms (`components/forms/`)

| Component | Notes |
|---|---|
| `TextField` | Visible label, hint and error linked with `aria-describedby`; `aria-invalid` on error. Spread React Hook Form's `register()` into it |
| `PhoneField` | `type="tel"`, phone keypad, autofill. Validate with `kenyanMobileSchema` (`utils/phone.ts`), which outputs E.164 for allauth |

## Product presentation (`components/products/`)

| Component | Notes |
|---|---|
| `PriceDisplay` | `price`, `wasPrice`, `wasStyle` card/full, `size`, `onDark`. Screen readers hear "KES 30, was 50". Throws on non-integer or negative amounts |
| `DiscountBadge` | Shows the API's percentage; nothing for 0 or invalid values |
| `StockNote` | "Only N left today" when the API flags low stock; "Sold out today" at 0 |
| `OriginLine` | "Nyanya · from Kirinyaga" with `lang="sw"` on the local name |
| `ProductCard` | Pastel `tone` tile, `media` slot, optional `action` slot (add-to-basket arrives in Phase 5). Presentation only |

## Adding a shadcn/ui component later

`components.json` is configured, so on a machine with internet access: `npx shadcn@latest add dialog`. Then adjust its colours to the tokens above and add a test.
