# 03 Pending Work

_Updated 2026-11-26. Phase 3 needs the owner's go-ahead before it starts._

## Owner decisions and actions
- [ ] Go-ahead for Phase 3 (Foundations).
- [ ] KRA PIN and ODPC registration (owner: coming soon).
- [x] Admin users at launch: 2 (2026-11-26).
- [x] Fast vs slots decided: 42 km radius from the dispatch point (2026-11-26).
- [ ] Set the real dispatch point; slot times, cut-offs, capacity and fees per zone (in admin, Phase 6).
- [ ] Google Cloud project + billing account for Google Maps Platform (before Phase 6).
- [x] Rider arrangement: delivery partner (2026-11-26).
- [ ] Choose the delivery partner.
- [ ] Accountant check of retention periods: **future update** (owner, 2026-11-26).
- [ ] SMS sender ID application (business documents).
- [x] KI-001: folders removed (2026-11-26).
- [ ] Extend `docs/business-requirements/PRODUCT_CATEGORIES.md` with planned products.
- [ ] Later: consider a Buy Goods Till or Pesapal to remove manual payment checks (KI-004).

## Phase 3: Foundations
- [ ] git init + private GitHub repository; branch rules.
- [ ] Frontend scaffold: Next.js 16 + TypeScript + Tailwind + ESLint; fix KI-003; shadcn/ui; Vitest/RTL; Playwright + axe; MSW.
- [ ] Design tokens and fonts extracted from the PDF/Figma file.
- [ ] Backend scaffold: uv, Django 6.1 project, 10 apps, **custom user model before first migration**, django-environ settings, Neon dev branch, pytest.
- [ ] drf-spectacular → `shared/contracts/openapi.yaml`; drift check; openapi-typescript generation.
- [ ] CI (GitHub Actions) for both apps with a PostgreSQL service container; dependency and secret scans.
- [ ] Shared phone-number test list in `shared/test-fixtures/`.
- [ ] Verify Django 6 support of every ADR-0010 package at install (fallbacks named).
- [ ] Maps keys handled as environment configuration (no real key in the repo); `GeoService` and `AddressPicker` built in Phase 6.

## Later phases
See `docs/IMPLEMENTATION_ROADMAP.md` (Phases 4–10): catalogue slice; accounts and basket; checkout and orders; Pochi manual payments + payment-timing switch + rider + notifications (Daraja sandbox adapter for development); hardening and staging (choose production host); go-live; future updates (Pesapal, WhatsApp, Swahili UI, live tracking).

## Security
- [ ] Threat model and data classification (Phase 3/4).
- [ ] CSP approach decision (risk R-9) in a Phase 3 security spike.
- [ ] Pochi verification procedure for staff (what to check on the M-Pesa statement) before Phase 7.
