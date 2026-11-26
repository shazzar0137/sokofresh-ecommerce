# 00 Handover

_Last updated: 2026-11-26 (owner answers recorded; Google Maps added, ADR-0013; KI-001 resolved)_

## Continuity rule

**Every substantial Claude session must read the relevant PROJECT_STATE files before working and update them after verified changes.**

Minimum reading before work: this file, `01_CURRENT_STATE.md`, `03_PENDING_WORK.md`; consult `02_DECISIONS_AND_CHANGES.md` and `04_KNOWN_ISSUES.md` where relevant. Then inspect the actual files: the filesystem is the source of truth, and a discussion in another conversation does not mean the work was done.

## The project

SokoFresh is a Kenyan grocery e-commerce platform connecting customers in Nairobi and its neighbouring counties with fresh produce from named farms and suppliers: storefront, catalogue and search, meal kits, server-side basket, checkout, accounts, orders, delivery and tracking, M-Pesa payments, notifications, and staff administration in Django admin.

Goal: a complete, secure, maintainable, production-ready application.

## Current phase

**Phase 2 (research, requirements, architecture) is complete.** The owner approved the consolidated architecture on 2026-11-26 (`docs/architecture/TECHNICAL_ARCHITECTURE_PROPOSAL_2026-11.md`, all ten items). **Phase 3 (Foundations) has not started** and needs the owner's go-ahead, because it installs packages.

## Approved architecture (summary)

- **Frontend:** Next.js 16 (App Router) + React + TypeScript, Tailwind, shadcn/ui, TanStack Query, React Hook Form + Zod, openapi-fetch, MSW; **no Zustand**; Node.js 24 LTS (ADR-0001, 0009, 0011).
- **Backend:** Python 3.13, Django 6.1 (→ 6.2) + DRF, drf-spectacular, django-allauth headless (phone + code), django-tasks-db, 10 Django apps; uv (ADR-0002, 0005, 0010, 0011).
- **Database:** PostgreSQL on Neon; integer KES; DB constraints; stock reserved at order placement (ADR-0003).
- **API:** REST `/api/v1`, generated OpenAPI in `shared/contracts/`, drift-checked; same-origin via Next.js rewrites (ADR-0004, 0011).
- **Staff:** Django admin ("Django admin is king", ADR-0008).
- **Payments:** `PaymentGateway`; **launch = Pochi la Biashara with staff verification** (Pochi has no API); payment timing pay-now / pay-on-delivery / both, switchable by admin; Daraja **sandbox only**; **Pesapal future update** (ADR-0006, 0012).
- **Hosting:** free tiers in development; commercial plans in production, Railway Pro preferred, decided in Phase 8; budget ≈ US$30–55/month + SMS (ADR-0007).
- **Coverage and delivery:** Nairobi County + Kiambu, Kajiado, Machakos. **Fast** within 42 km of the dispatch point (Nairobi + satellite towns: Ruaka, Rongai, Ngong, Mlolongo, Limuru, Thika); **slots** elsewhere. Deliveries by a **delivery partner** whose riders use the rider screens. Stock and prices updated throughout the day.
- **Maps:** Google Maps Platform: Places Autocomplete + confirmed map pin (frontend), Geocoding + Routes in `GeoService` (backend) (ADR-0013).
- **Staff:** 2 admin users at launch, MFA.

Authoritative current architecture: `docs/architecture/SYSTEM_ARCHITECTURE.md`. Roadmap: `docs/IMPLEMENTATION_ROADMAP.md`. Testing: `docs/testing/TESTING_STRATEGY.md`.

## Completed

- Phase 1 structure and documentation (`PHASE_1_COMPLETION_REPORT.md`); design PDF and Figma file in `assets/design-references/`.
- Phase 2: research record (+ addenda), requirements baseline v0.3, frontend analysis (accepted, amended), backend analysis (accepted with amendments), consolidated proposal (approved), ADR-0001 to ADR-0013, approved roadmap and testing strategy.

## Outstanding

- **Owner:** go-ahead for Phase 3; KRA PIN and ODPC registration (coming soon); real dispatch point; choose the delivery partner; Google Cloud billing account for Maps; slot times and cut-offs for slot areas. Accountant check of retention: future update.
- Open known issues: KI-003, KI-004 (`04_KNOWN_ISSUES.md`).

## Architectural constraints

- Monorepo; frontend and backend separate applications linked only by `shared/contracts/`.
- Modular monolith; no microservices.
- The browser is untrusted: prices, stock, fees, totals and payment status are decided on the server.
- Reuse → Integrate → Configure → Build only what is missing.
- Security-first; no secrets or real customer data in the repository; no fake code or tests.
- Any new technology needs research, owner approval and an ADR.

## Next action

Ask the owner for the Phase 3 go-ahead. Then: initialise git + private GitHub repo; scaffold Next.js (fix KI-003) and the Django project with the custom user model; CI; contract pipeline; design tokens. Explain each package before installing.
