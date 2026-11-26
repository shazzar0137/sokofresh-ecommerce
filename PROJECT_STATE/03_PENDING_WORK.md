# 03 Pending Work

_Updated 2026-11-26 night. Phase 3 authorised by the owner; backend foundation built on `feature/phase-3-foundations`._

## Owner decisions and actions
- [x] Go-ahead for Phase 3 (Foundations) (2026-11-26).
- [ ] **Push `feature/phase-3-foundations`** from `tmp/phase-3-foundations.bundle` (`PHASE_3_BACKEND_COMPLETION_REPORT.md` §10); check CI; review; merge by pull request.
- [ ] Confirm ADR-0014 (backend foundation choices, items 1–21).
- [ ] Decide KI-011 (customer deletion vs phone constraint) **before Phase 4**.
- [ ] Decide KI-013 (admin static files in production, e.g. WhiteNoise).
- [x] Independent backend review and corrections (2026-11-27, `backend/documentation/quality/BACKEND_REVIEW_REPORT.md`).
- [ ] Create the Neon development project and set `DATABASE_URL` locally (guide §2).
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
- [x] git + GitHub repository (owner created `shazzar0137/sokofresh-ecommerce`; local `main` = `origin/main`).
- [ ] Branch protection on `main` (require CI and a pull request): owner, in GitHub **Settings → Branches**.
- [ ] Frontend scaffold: Next.js 16 + TypeScript + Tailwind + ESLint; fix KI-003; shadcn/ui; Vitest/RTL; Playwright + axe; MSW.
- [ ] Design tokens and fonts extracted from the PDF/Figma file.
- [x] Backend scaffold: uv, Django 6.1.3, 10 apps, **custom user model before first migration**, django-environ settings, pytest (on the branch, 2026-11-26).
- [ ] Neon dev branch (owner account needed; local PostgreSQL used meanwhile).
- [x] drf-spectacular → `shared/contracts/openapi.yaml`; drift check (backend test).
- [ ] openapi-typescript generation (Frontend); Frontend to confirm contract points F-1 to F-6 (`shared/documentation/CONTRACTS.md`).
- [x] Backend CI workflow with PostgreSQL service, pip-audit and gitleaks (written; **first run pending the push**).
- [ ] Frontend CI jobs (Frontend conversation).
- [x] Shared phone-number test list `shared/test-fixtures/phone-numbers.json` (used by backend tests).
- [x] Verify Django 6 support of the ADR-0010 packages installed so far (tests pass on 6.1.3; see KI-010). Remaining packages checked when installed (Phase 4+).
- [ ] Maps keys handled as environment configuration (no real key in the repo); `GeoService` and `AddressPicker` built in Phase 6.

## Later phases
See `docs/IMPLEMENTATION_ROADMAP.md` (Phases 4–10): catalogue slice; accounts and basket; checkout and orders; Pochi manual payments + payment-timing switch + rider + notifications (Daraja sandbox adapter for development); hardening and staging (choose production host); go-live; future updates (Pesapal, WhatsApp, Swahili UI, live tracking).

## Security
- [ ] Phase 5: staff MFA + admin login rate limiting (KI-007) **before any deployment**.
- [ ] Phase 5: Turnstile on code requests + daily SMS budget (KI-012) **before enabling a real SMS provider**.
- [ ] Phase 4: coverage report in CI; Schemathesis and time-machine as the testing strategy plans.
- [ ] Phase 8: schedule `manage.py purge_expired_cache` (host cron); proxy must overwrite `X-Forwarded-Proto`; origin not directly reachable.
- [ ] Threat model and data classification (Phase 3/4).
- [ ] CSP approach decision (risk R-9) in a Phase 3 security spike.
- [ ] Pochi verification procedure for staff (what to check on the M-Pesa statement) before Phase 7.
