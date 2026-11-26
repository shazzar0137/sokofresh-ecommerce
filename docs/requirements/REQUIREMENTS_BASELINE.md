# Requirements Baseline (v0.3)

_Status: v0.3, updated 2026-11-26 with the owner's answers and the approved architecture (ADR-0011, ADR-0012, ADR-0013). Sources: design reference (`docs/research/DESIGN_REFERENCE_NOTES.md`) and the project scope in `PROJECT_STATE/00_HANDOVER.md`._

Priority key: **M** = must have for launch (MVP), **S** = should have soon after, **L** = later.

## 1. Business goals

- BG-1 Let Nairobi households buy fresh produce and groceries online and receive them the same day.
- BG-2 Build trust by showing the farm or origin of every product.
- BG-3 Accept M-Pesa, including payment at delivery.
- BG-4 Increase basket size through meal kits and a free-delivery threshold.
- BG-5 Run operations (stock, orders, deliveries) without spreadsheets.

## 2. Users and roles

| Role | Description |
|---|---|
| Guest | Browses and builds a basket without an account |
| Customer | Registered; checks out, sees order history |
| Staff | Manages products, daily stock and orders |
| Rider | Sees assigned deliveries, confirms arrival and payment |
| Admin | Everything above plus users, settings and reports |

## 3. Functional requirements

### Catalogue and search
| ID | Requirement | Pri |
|---|---|---|
| FR-01 | Show products by category (Mboga, Matunda, Unga, Maziwa & Mayai, Nyama & Samaki, Vinywaji; maintained in `docs/business-requirements/PRODUCT_CATEGORIES.md`) | M |
| FR-02 | Each product shows English and Swahili names, origin/farm, unit (e.g. 1kg, bunch), price in KES and image | M |
| FR-03 | Show discounts as a was-price and "Save X%" badge | M |
| FR-04 | Show low stock ("Only 9 left") and block ordering beyond available stock. Stock and prices change **throughout the day** (perishable produce); the basket re-quotes live and checkout refuses a changed total (409) | M |
| FR-05 | Search by English or Swahili name, tolerant of small spelling differences | M |
| FR-06 | Product detail page with farm/supplier information | S |
| FR-07 | Farmer/supplier profiles | S |

### Meal kits
| ID | Requirement | Pri |
|---|---|---|
| FR-10 | Meal kits bundle several products at a kit price lower than the separate total | M |
| FR-11 | "Add whole kit" adds the kit; stock is checked for every item in it | M |

### Basket and checkout
| ID | Requirement | Pri |
|---|---|---|
| FR-20 | Add, change quantity, remove items; basket persists across pages and visits | M |
| FR-21 | Show progress to free delivery (e.g. "Add KES 410 more") and the total | M |
| FR-22 | Choose delivery area; show estimated arrival / available slots | M |
| FR-23 | Checkout collects phone number (M-Pesa), delivery address details and slot | M |
| FR-24 | Order confirmation by SMS (and email if provided) | M |
| FR-25 | ~~Guest checkout with phone verification~~ **Merged into FR-40** (ADR-0011): checkout uses phone + one-time code, which signs in or creates the account | — |

### Payments
| ID | Requirement | Pri |
|---|---|---|
| FR-30 | Pay with M-Pesa via **Pochi la Biashara** at launch: show Pochi number, exact amount and order reference; customer enters the M-Pesa confirmation code; staff verify in Django admin (ADR-0012). Automatic STK Push only via a future provider (Pesapal) or a Till | M |
| FR-31 | Pay on delivery: rider shows the payment details at the door and records the customer's M-Pesa code; staff verify | M |
| FR-35 | **Payment-timing switch:** admin enables pay-now, pay-on-delivery, or both, and can switch at any time; new orders follow the current setting, existing orders keep theirs | M |
| FR-32 | Record every payment attempt and verification action; mark orders paid only after confirmation (staff verification for Pochi; provider confirmation for future gateways); an M-Pesa code can be used once | M |
| FR-33 | Refunds for items rejected at the door (fresh guarantee) | S |
| FR-34 | Card payments | L |

### Accounts and orders
| ID | Requirement | Pri |
|---|---|---|
| FR-40 | Register and sign in with phone number and one-time code | M |
| FR-41 | Saved addresses | S |
| FR-42 | Order history and reorder | S |
| FR-43 | Customer can request account/data deletion | M |

### Delivery
| ID | Requirement | Pri |
|---|---|---|
| FR-50 | Coverage: **Nairobi County and its immediate neighbouring counties (Kiambu, Kajiado, Machakos)**. **Fast delivery** within 42 km of the dispatch point (Nairobi and satellite towns such as Ruaka, Rongai, Ngong, Mlolongo, Limuru, Thika); **slots** elsewhere in the four counties (ADR-0013). Delivery zones with fee, free-delivery threshold and a delivery mode: **fast** (estimated arrival time) for nearby zones, **slots** with cut-off times (e.g. order by 2pm for evening slot) for other zones (owner decision 2026-11-26) | M |
| FR-51 | Order status tracking: confirmed, packed, out for delivery, delivered | M |
| FR-52 | Rider view for the **delivery partner's** riders: assigned orders, address, landmark, "Open in Google Maps" pin link, items, amount, payment-code capture, arrival/delivery confirmation | M |
| FR-54 | **Map address capture:** Google Places search plus a map pin the customer confirms; the server decides fast/slots, fee and ETA from the pin | M |
| FR-53 | Live map tracking of rider | L |

### Administration
| ID | Requirement | Pri |
|---|---|---|
| FR-60 | Manage products, categories, farmers, prices, discounts, meal kits | M |
| FR-61 | Adjust stock quantity and price per product **throughout the day**, every change recorded (stock movements, audit log) | M |
| FR-62 | View and update orders; assign riders | M |
| FR-63 | Daily sales and payment reconciliation report | S |
| FR-64 | Audit log of staff changes to prices, stock and orders | M |

### Notifications and reviews
| ID | Requirement | Pri |
|---|---|---|
| FR-70 | SMS for login codes, order confirmation and delivery updates | M |
| FR-71 | Product reviews/ratings | L |
| FR-72 | WhatsApp updates | L |

## 4. Non-functional requirements

| ID | Area | Requirement |
|---|---|---|
| NFR-01 | Performance | Home and shop pages: Largest Contentful Paint under 2.5 s on a mid-range Android phone over 4G (measured in staging) |
| NFR-02 | Performance | Typical API responses under 500 ms at the server |
| NFR-03 | Mobile-first | Fully usable at 360 px wide; low data use (compressed images) |
| NFR-04 | Availability | Target 99.5% monthly uptime from launch; evening peak (5–8pm) is critical |
| NFR-05 | Security | OWASP Top 10 and API Top 10 addressed; see `docs/security/SECURITY_PLANNING_OUTLINE.md` |
| NFR-06 | Payment integrity | No order marked paid without provider confirmation; duplicate callbacks have no effect |
| NFR-07 | Privacy | Comply with Kenya Data Protection Act, 2019; minimal data collection; ODPC registration status confirmed before launch |
| NFR-08 | Accessibility | WCAG 2.2 level AA |
| NFR-09 | Localisation | KES currency, Africa/Nairobi time zone, Swahili product names; UI in English at launch, Swahili UI later (L) |
| NFR-10 | Browser support | Current Chrome (Android), Safari (iOS), Samsung Internet, desktop Chrome/Edge/Firefox |
| NFR-11 | Data protection | Encrypted in transit (TLS); daily backups; tested restore |
| NFR-12 | Maintainability | Automated tests run on every change; documented API contract |
| NFR-13 | Observability | Errors reported to an error tracker; payment callbacks logged |
| NFR-14 | Cost | Development at zero cost; production running cost agreed with owner before launch |

## 5. Owner answers (2026-11-26)

| # | Question | Answer |
|---|---|---|
| 1 | Business registration | Registered and licensed by the county (small business). KRA PIN and ODPC registration: **coming soon** |
| 2 | M-Pesa account | **Pochi la Biashara** (no Till/Paybill). Pochi has no API → manual verification (ADR-0012). Pesapal as a future update |
| 3 | Pay timing | **Both**; admin chooses which is offered and can switch seamlessly (FR-35) |
| 4 | Delivery coverage | **Nairobi and its immediate neighbouring counties** (Kiambu, Kajiado, Machakos). Fast = Nairobi + satellite towns (42 km radius); slots elsewhere. Deliveries by a **delivery partner** |
| 5 | Stock model | **Updated throughout the day**; prices also volatile |
| 6 | Budget | Approved estimate about US$30–55/month plus SMS (ADR-0007); confirm in Phase 8 |
| 7 | Admin users | **2** at launch |
| 8 | Record retention | Accountant check deferred to a future update |
