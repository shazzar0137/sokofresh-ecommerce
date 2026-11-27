# 03 Pending Work

_Updated 2026-11-27. Phase 3 backend and frontend foundations built on `feature/phase-3-foundations`._

## Owner decisions and actions
- [x] Go-ahead for Phase 3 (Foundations) (2026-11-26).
- [x] Claude GitHub App installed; branch pushed; CI green (2026-11-27).
- [x] `feature/phase-3-foundations` merged to `main` by the owner (PR #1, 2026-11-27).
- [ ] **Review** `docs/reviews/PHASE_3_INDEPENDENT_REVIEW.md` and the correction PR `fix/phase-3-integration-review`; merge only after the independent agent re-review.
- [ ] Enable branch protection on `main` with required checks (KI-020).
- [ ] Update the local folder: `git pull` on `main` (KI-021); delete `tmp/phase-3-foundations.bundle`.
- [ ] Confirm ADR-0014 (items 1–21) and D-046 (frontend choices), both "owner to confirm".
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
- [x] Frontend scaffold: Next.js 16 + TypeScript + Tailwind + ESLint; KI-003 fixed; shadcn/ui pattern; Vitest/RTL; Playwright + axe; MSW (2026-11-27).
- [x] Design tokens and fonts extracted from the PDF/Figma file (2026-11-27).
- [ ] Owner: confirm D-046 (frontend Phase 3 choices P3-F1 to P3-F8).
- [x] Backend scaffold: uv, Django 6.1.3, 10 apps, **custom user model before first migration**, django-environ settings, pytest (on the branch, 2026-11-26).
- [ ] Neon dev branch (owner account needed; local PostgreSQL used meanwhile).
- [x] drf-spectacular → `shared/contracts/openapi.yaml`; drift check (backend test).
- [x] openapi-typescript generation + drift check; contract points F-1 to F-7 answered, F-8 raised (2026-11-27).
- [x] Backend CI workflow with PostgreSQL service, pip-audit and gitleaks (passed on GitHub 2026-11-27).
- [x] Frontend CI workflow (passed on GitHub 2026-11-27).
- [ ] Phase 4 frontend: catalogue mapper (generated types → card props; drop bad prices), search box keeps `q` (UX-5), add-to-basket names the product (A11Y-3), visual-regression baselines in CI (KI-016), MSW response validation (QA-15), Bricolage single-weight font (PERF-5).
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
- [ ] CSP: interim static policy in place (KI-015); decide SRI or route nonces before the first sign-in/checkout screen.
- [ ] **KI-014** proxy/client-IP design and test (Backend + Phase 8) **before any deployment**.
- [ ] Before launch: `__Host-` cookie names (KI-017); CSP reporting; brotli at the edge (PERF-6); WebKit + manual accessibility checks (KI-016).
- [ ] Pochi verification procedure for staff (what to check on the M-Pesa statement) before Phase 7.
