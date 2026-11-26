# Product Categories Register

_Owner: project owner (Danny) · Created: 2026-11-26 · Status: Working list, update as the range grows_

This file is the planning list of product categories and the products that belong in them. Use it to add new categories or products **before** they are entered in the system.

Once the backend exists, categories and products are managed by staff in Django admin (ADR-0008). This file then becomes the starting data (seed) and a planning record; the live list is in the database.

## How to add a category or product

1. Add a row to the table below (or to the products table further down).
2. Give both an English and a Swahili name. Mark the Swahili name "check" if it needs confirming.
3. The **slug** is the short web-address name: lowercase, hyphens instead of spaces (e.g. `maziwa-mayai`). Once a category is live, do not change its slug, because links would break.
4. Set **Status**: `Live at launch`, `Planned` or `Idea`.
5. Record the change in the change log at the bottom.

The storefront category tabs read this list from the API, so new categories appear without frontend code changes. The tabs scroll sideways on mobile, so the list can grow.

## Categories

| Order | English name | Swahili name | Slug | Status | Source / notes |
|---|---|---|---|---|---|
| 1 | Vegetables | Mboga | `mboga` | Live at launch | Design reference |
| 2 | Fruit | Matunda | `matunda` | Live at launch | Design reference |
| 3 | Flour and grains | Unga | `unga` | Live at launch | Design reference; holds maize flour, wheat flour and rice in the design |
| 4 | Milk and eggs | Maziwa & Mayai | `maziwa-mayai` | Live at launch | Design reference |
| 5 | Meat and fish | Nyama & Samaki | `nyama-samaki` | Live at launch | Design reference |
| 6 | Beverages | Vinywaji (check) | `vinywaji` | Live at launch | Added 2026-11-26 by owner decision; tea had no category in the design |
| — | _(next category)_ | | | Idea | e.g. cooking oil, sugar, spices, cleaning supplies — owner to decide |

## Products from the design reference

| Product | Swahili name | Category | Origin shown in design |
|---|---|---|---|
| Sukuma wiki bunch | Sukuma wiki | Mboga | Kinangop |
| Tomatoes 1kg | Nyanya | Mboga | Kirinyaga |
| Red onions 1kg | Vitunguu | Mboga | Nyandarua |
| Cabbage head | Kabeji | Mboga | Limuru |
| Mangoes, 4 pieces | Maembe (apple) | Matunda | Kitui |
| Hass avocados, 4 | Parachichi | Matunda | Murang'a |
| Ripe bananas | Ndizi | Matunda | Kisii |
| Maize flour 2kg | Unga wa ugali | Unga | Eldoret |
| Pishori rice 2kg | Mchele | Unga | Mwea |
| Wheat flour 2kg | Unga wa chapati | Unga | Narok |
| Fresh milk 1L | Maziwa | Maziwa & Mayai | Nyahururu |
| Eggs, tray of 30 | Mayai | Maziwa & Mayai | Thika |
| Tilapia 1kg | Samaki | Nyama & Samaki | Lake Victoria |
| Kienyeji chicken | Kuku | Nyama & Samaki | Machakos |
| Kenya tea 250g | Majani ya chai | **Vinywaji** | Kericho |

Prices are not kept here: they change daily and are set in the admin.

## Products not yet documented

Add products the shop plans to sell that are not in the design.

| Product | Swahili name | Category | Origin / supplier | Status |
|---|---|---|---|---|
| _(example)_ Coffee 250g | Kahawa (check) | Vinywaji | _to confirm_ | Idea |

## Change log

| Date | Change | By |
|---|---|---|
| 2026-11-26 | Register created with the five design categories and their products; Beverages (Vinywaji) added for tea | Owner decision, recorded by Frontend conversation |
