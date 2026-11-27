# 00 Handover

_Last updated: 2026-11-27 evening (Phase 3 closed: PR #1 and PR #2 merged; `main` = `809964b`)_

> **Phase 3 integration gate: passed for development.** The owner merged PR #2 (2026-11-27 15:13 Nairobi) after the review (`docs/reviews/PHASE_3_INDEPENDENT_REVIEW.md`). **Not approved for deployment:** KI-007 and KI-012 to KI-015 remain open by design.

> **GitHub:** Claude can push feature branches (Claude GitHub App). The owner merges by pull request. `main` is protected by the ruleset "Protect main" (no deletion, no force push, PR required, 0 approvals); it currently requires only *Secret scan (gitleaks)*, so the other seven checks still need adding (KI-020).

> **Before Phase 4:** the owner's go-ahead. KI-011 is decided (D-055) and is implemented as the first Phase 4 backend task. KI-022 is decided in the Phase 4 design. KI-013 waits until Phase 8.

## Continuity rule

**Every substantial Claude session must read the relevant PROJECT_STATE files before working and update them after verified changes.**

Minimum reading before work: this file, `01_CURRENT_STATE.md`, `03_PENDING_WORK.md`; consult `02_DECISIONS_AND_CHANGES.md` and `04_KNOWN_ISSUES.md` where relevant. Then inspect the actual files: the filesystem is the source of truth, and a discussion in another conversation does not mean the work was done.

## The project

SokoFresh is a Kenyan grocery e-commerce platform connecting customers in Nairobi and its neighbouring counties with fresh produce from named farms and suppliers: storefront, catalogue and search, meal kits, server-side basket, checkout, accounts, orders, delivery and tracking, M-Pesa payments, notifications, and staff administration in Django admin.

Goal: a complete, secure, maintainable, production-ready application.

## Current phase

**Phase 2 is complete.** **Phase 3 (Foundations)** is built and on `main` (PR #1, 2026-11-27): backend (`PHASE_3_BACKEND_COMPLETION_REPORT.md`) and frontend (`PHASE_3_FRONTEND_COMPLETION_REPORT.md`). The Architect's integration review and its corrections are on PR #2, awaiting the owner. Storefront features are not built (Phase 4 onward).

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
- Phase 3 backend (merged): Django 6.1.3 with uv, settings split, ten apps, phone-based custom user model before the first migration, role groups, allauth headless phone-code sign-in, RFC 9457 errors, `/api/v1/health`, generated contract with drift check, outbound-HTTP allow list, log redaction; independent backend review (`backend/documentation/quality/BACKEND_REVIEW_REPORT.md`).
- Phase 3 frontend (merged): Next.js 16.4.6 App Router, design tokens from the PDF/Figma, foundation components, typed API client, MSW, security headers, same-origin rewrites; independent frontend review (`frontend/documentation/quality/FRONTEND_REVIEW_REPORT.md`).
- Phase 3 integration review (2026-11-27, PR #2, merged): 6 independent reviewers + re-review; fixes for production CSRF behind the rewrite, admin login attempt limits and MFA start-up gate, extra password routes, settings validation, CI path filters, a real-stack CI job, contract and coverage gaps. Latest results: backend 272 tests, 96% coverage; frontend 360 Vitest + 53 Playwright; real-stack smoke all checks passing; all four workflows green on GitHub.
- ADR-0014 and D-046 confirmed by the owner (2026-11-27, D-052).
- KI-011 decided by the owner (2026-11-27, D-055): nullable phone (unique when present) + separate hash column on account deletion.

## Outstanding

- **Owner:** add the seven remaining required checks to the "Protect main" ruleset (KI-020); give the go-ahead for Phase 4; create the Neon development project; KRA PIN and ODPC registration (coming soon); real dispatch point; choose the delivery partner; Google Cloud billing account for Maps; slot times and cut-offs for slot areas. Accountant check of retention: future update.
- Open known issues: see `04_KNOWN_ISSUES.md`; **KI-014 (client IP through the Next.js rewrite) and KI-007 (admin MFA) block any deployment**.

## Architectural constraints

- Monorepo; frontend and backend separate applications linked only by `shared/contracts/`.
- Modular monolith; no microservices.
- The browser is untrusted: prices, stock, fees, totals and payment status are decided on the server.
- Reuse → Integrate → Configure → Build only what is missing.
- Security-first; no secrets or real customer data in the repository; no fake code or tests.
- Any new technology needs research, owner approval and an ADR.

## Next action

1. Owner: add the seven remaining required checks to the "Protect main" ruleset (review report §7, KI-020).
2. Owner: go-ahead for Phase 4.
3. Phase 4, in order: implement D-055 (KI-011: user phone nullable + hash column, migration and tests) before any table references users; decide KI-022 in the Phase 4 design; then the catalogue slice (backend API first, Schemathesis with it; then the frontend catalogue). Explain each new package before installing.
