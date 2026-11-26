# 02 Decisions and Changes

Approved decisions and significant changes, newest first. Formal technology decisions from Phase 2 onward are recorded as ADRs in `docs/decisions/adr/` and summarised here.

| ID | Date | Decision / change | Status | Reason |
|---|---|---|---|---|
| D-037 | 2026-11-26 | Removed `frontend/public/assets/` and `tests/stress/` (empty except `.gitkeep`) | Done (owner approved) | KI-001 |
| D-036 | 2026-11-26 | Record retention: accountant check deferred to a future update; proposed conservative periods apply meanwhile | Approved (owner) | — |
| D-035 | 2026-11-26 | KRA PIN and ODPC registration: coming soon (small business) | Fact (owner) | — |
| D-034 | 2026-11-26 | Deliveries made by a **delivery partner**; partner riders use Rider accounts and the rider screens; partner API later | Approved (owner) | Requirements Q4 |
| D-033 | 2026-11-26 | Fast delivery = Nairobi + immediate satellite towns, implemented as a 42 km radius from a configurable dispatch point (provisional Nairobi CBD); slots for the rest of the four counties | Approved (owner request; radius set by Architect) | ADR-0013 |
| D-032 | 2026-11-26 | Google Maps Platform integration: Places Autocomplete + confirmed pin, Geocoding, Routes, Maps URLs (ADR-0013) | Approved (owner request) | Address accuracy; fast/slot decision; ETA |
| D-031 | 2026-11-26 | 2 admin (staff) users at launch, MFA required | Approved (owner) | Requirements Q7 |
| D-030 | 2026-11-26 | All project documents synchronised with the approved architecture (ADRs, requirements v0.2, system architecture, roadmap, testing strategy, frontend and backend analyses, READMEs, PROJECT_STATE) | Done | Owner instruction |
| D-029 | 2026-11-26 | Business is registered and licensed by the county; KRA PIN and ODPC position still to confirm | Fact (owner) | Requirements Q1 |
| D-028 | 2026-11-26 | Delivery coverage: Nairobi County and immediate neighbouring counties (Kiambu, Kajiado, Machakos) | Approved (owner) | Requirements Q4 |
| D-027 | 2026-11-26 | Stock and prices updated throughout the day (perishable produce) | Approved (owner) | Requirements Q5 |
| D-026 | 2026-11-26 | Payment timing: both pay-now and pay-on-delivery; admin chooses which is offered and can switch at any time (FR-35) | Approved (owner) | Requirements Q3 |
| D-025 | 2026-11-26 | Payments at launch: Pochi la Biashara with staff verification (Pochi has no API); Daraja sandbox only; Pesapal as a future update (ADR-0012) | Approved (owner) | Owner's M-Pesa account is Pochi la Biashara |
| D-024 | 2026-11-26 | Hosting: free tiers in development; commercial plans in production, Railway Pro preferred, final choice in Phase 8; budget ≈ US$30–55/month + SMS (ADR-0007 revised) | Approved | Proposal §11–12 |
| D-023 | 2026-11-26 | Backend analysis accepted with amendments B-1 to B-11; backend libraries ADR-0010 | Approved | Proposal §17 items 4–5 |
| D-022 | 2026-11-26 | Architecture amendments ADR-0011: Zustand removed, same-origin routing, 10 apps, checkout sign-in, single status path, `needs_review`, direct login SMS, host cron, runtime pins, OpenAPI version | Approved | Proposal §2 conflicts C-1 to C-12 |
| D-021 | 2026-11-26 | Authentication ADR-0005 accepted with additions (our allauth adapter, Turnstile, staff MFA) | Approved | Proposal §17 item 3 |
| D-020 | 2026-11-26 | Consolidated technical architecture proposal approved (all ten §17 items); security §9, testing §10 and roadmap §16 adopted | Approved (owner) | `docs/architecture/TECHNICAL_ARCHITECTURE_PROPOSAL_2026-11.md` |
| D-019 | 2026-11-26 | Backend first-assignment analysis written: domain model, database rules, API inventory, guest basket via Django session, payment controls, libraries (to become ADR-0010) | Superseded by D-023 | Accepted with amendments |
| D-018 | 2026-11-26 | Add category Beverages (Vinywaji) for tea; categories and future products planned in `docs/business-requirements/PRODUCT_CATEGORIES.md` | Approved | Tea had no category; range will grow |
| D-017 | 2026-11-26 | Delivery promise: fast delivery with estimated arrival for nearby zones, slots for all other zones (per-zone delivery mode) | Approved | Resolves conflicting design copy (analysis D-4) |
| D-016 | 2026-11-26 | Testimonial: one marked placeholder during development, deleted before launch (analysis D-6) | Approved | Do not publish invented reviews as real |
| D-015 | 2026-11-26 | Basket stored on the server for all visitors, guests included; customer reads and changes it through the API | Approved by owner; endpoint details to agree with Backend | Server stays the source of truth for prices and stock |
| D-014 | 2026-11-26 | Frontend supporting libraries (ADR-0009): openapi-fetch, MSW, Lucide, Sonner, next/font, next/image, custom Zod phone rule, Playwright screenshots, npm; Storybook/i18n/analytics deferred | Approved | See ADR-0009 |
| D-013 | 2026-11-26 | Frontend analysis accepted as the frontend baseline | Approved | `frontend/documentation/architecture/FRONTEND_ANALYSIS_2026-11.md` |
| D-012 | 2026-11-26 | Payments: build behind `PaymentGateway`, develop on Daraja sandbox; production provider (Daraja direct or Paystack) deferred until business registration is known (ADR-0006) | Approved with modifications | Business not yet registered |
| D-011 | 2026-11-26 | Staff administration via customised Django admin at launch (ADR-0008) | Approved | Saves months of custom admin work |
| D-010 | 2026-11-26 | Frontend in TypeScript (compiles to JavaScript) | Approved | Type safety; generated API types |
| D-009 | 2026-11-26 | Core stack: Next.js + React, Python + Django + DRF, PostgreSQL, REST + OpenAPI generated from backend (ADR-0001 to 0004) | Approved | See ADRs and research record |
| D-008 | 2026-11-26 | ADR-0005 (authentication) and ADR-0007 (hosting/services) remain Proposed | Superseded by D-021, D-024 | Not yet presented for decision |
| D-007 | 2026-11-26 | Phase 2 proposals ADR-0001 to ADR-0008 written (Next.js+TS, Django+DRF, PostgreSQL, REST+OpenAPI, allauth, Daraja, hosting, Django admin) | Superseded by D-008 to D-012 | Owner decided 2026-11-26 |
| D-006 | 2026-11-26 | Project destination is `C:\Users\danie\OneDrive\Documents\sokofresh-ecommerce` (the brief originally named `C:\Users\danie\Downloads\sokofresh-ecommerce`) | Approved by owner during Phase 1 | Owner instruction |
| D-005 | 2026-11-26 | Use the existing `docs/decisions/adr` folder for ADRs instead of creating `ADR` | Applied | Windows folder names are case-insensitive; both names point to the same folder |
| D-004 | 2026-11-26 | Backend organised as a modular monolith | Approved (project instructions) | Simpler to build, run and learn; avoids premature microservices |
| D-003 | 2026-11-26 | Frontend framework, backend language/framework, database, API style, authentication, payments, hosting, infrastructure, CI/CD and testing frameworks are **undecided** | Approved: deliberately open | To be researched in Phase 2; owner makes final choice |
| D-002 | 2026-11-26 | JavaScript for frontend development | Approved | Owner's confirmed preference |
| D-001 | 2026-11-26 | Monorepo with separate top-level `frontend/`, `backend/`, `shared/`, `security/`, `tests/`, `infrastructure/`, `docs/`, `assets/`, `PROJECT_STATE/` | Approved | One integrated product with clear application boundaries |

## Change log reference

Chronological change history is in `../CHANGELOG.md`.
