# 03 Pending Work

_Updated 2026-11-27 evening. Phase 3 closed (PR #1 and PR #2 merged). Phase 4 awaiting the owner's go-ahead._

## Owner decisions and actions
- [x] Go-ahead for Phase 3 (Foundations) (2026-11-26).
- [x] Claude GitHub App installed; branch pushed; CI green (2026-11-27).
- [x] `feature/phase-3-foundations` merged to `main` by the owner (PR #1, 2026-11-27).
- [x] Reviewed the integration report and merged PR #2 (2026-11-27).
- [x] Ruleset "Protect main" created (no deletion, no force push, PR required).
- [ ] Add the seven remaining required checks to "Protect main" (KI-020; review report §7).
- [ ] Go-ahead for Phase 4.
- [x] Local folder updated with `git pull`; bundle deleted (KI-021, 2026-11-27).
- [x] ADR-0014 (items 1–21) and D-046 confirmed by the owner (2026-11-27, D-052).
- [x] KI-011 decided (D-055, 2026-11-27): nullable phone + separate hash column.
- [ ] Phase 4, first backend task: implement D-055 (migration, constraints, tests) before any table references users.
- [ ] Decide KI-013 (admin static files in production, e.g. WhiteNoise).
- [ ] Decide KI-022 (how server-rendered pages call Django: throttling and HTTPS) in the Phase 4 design.
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
- [x] Frontend scaffold: Next.js 16 + TypeScript + Tailwind + ESLint; KI-003 fixed; shadcn/ui pattern; Vitest/RTL; Playwright + axe; MSW (2026-11-27).
- [x] Design tokens and fonts extracted from the PDF/Figma file (2026-11-27).
- [x] Backend scaffold: uv, Django 6.1.3, 10 apps, **custom user model before first migration**, django-environ settings, pytest (on the branch, 2026-11-26).
- [ ] Neon dev branch (owner account needed; local PostgreSQL used meanwhile).
- [x] drf-spectacular → `shared/contracts/openapi.yaml`; drift check (backend test).
- [x] openapi-typescript generation + drift check; contract points F-1 to F-7 answered, F-8 raised (2026-11-27).
- [x] Backend CI workflow with PostgreSQL service, pip-audit and gitleaks (passed on GitHub 2026-11-27).
- [x] Frontend CI workflow (passed on GitHub 2026-11-27).
- [ ] Phase 4 frontend: catalogue mapper (generated types → card props; drop bad prices), search box keeps `q` (UX-5), add-to-basket names the product (A11Y-3), visual-regression baselines in CI (KI-016), MSW response validation (QA-15), Bricolage single-weight font (PERF-5).
- [x] Shared phone-number test list `shared/test-fixtures/phone-numbers.json` (used by backend and frontend tests; extended with the mobile-range boundaries, API-4, 2026-11-27).
- [x] Real-stack CI: real Django (production settings) behind `next start` (PR #2).
- [ ] Phase 5: frontend parsing of allauth error and 401-flow responses (API-3) before the sign-in screens.
- [ ] Low review items left open (review report §5): Swagger UI redirect loop through the storefront in dev (ARC-7), empty frontend skeleton folders (CQ-2/ARC-11), completion reports at the repository root, HSTS policy alignment between frontend and Django (CQ-1, decide in Phase 8), Dependabot (QA-9), PostgreSQL version target (QA-10).
- [x] Verify Django 6 support of the ADR-0010 packages installed so far (tests pass on 6.1.3; see KI-010). Remaining packages checked when installed (Phase 4+).
- [ ] Maps keys handled as environment configuration (no real key in the repo); `GeoService` and `AddressPicker` built in Phase 6.

## Later phases
See `docs/IMPLEMENTATION_ROADMAP.md` (Phases 4–10): catalogue slice; accounts and basket; checkout and orders; Pochi manual payments + payment-timing switch + rider + notifications (Daraja sandbox adapter for development); hardening and staging (choose production host); go-live; future updates (Pesapal, WhatsApp, Swahili UI, live tracking).

## Security
- [x] Admin login attempt limits (per IP and per account), PR #2 (BSEC-1).
- [ ] Phase 5: staff MFA (KI-007, D-031) **before any deployment**; then remove `DJANGO_ACCEPT_ADMIN_WITHOUT_MFA`.
- [ ] Phase 5: Turnstile on code requests + daily SMS budget (KI-012) **before enabling a real SMS provider**.
- [x] Coverage report in CI with an 85% minimum, branch and subprocess coverage (PR #2).
- [ ] Phase 4: Schemathesis with the first real endpoints; time-machine in Phase 5–6.
- [ ] Phase 8: schedule `manage.py purge_expired_cache` (host cron); proxy must overwrite `X-Forwarded-Proto`; origin not directly reachable.
- [ ] Threat model and data classification (Phase 3/4).
- [ ] CSP: interim static policy in place (KI-015); decide SRI or route nonces before the first sign-in/checkout screen.
- [ ] **KI-014** proxy/client-IP design and test (Backend + Phase 8) **before any deployment**.
- [ ] Before launch: `__Host-` cookie names (KI-017); CSP reporting; brotli at the edge (PERF-6); WebKit + manual accessibility checks (KI-016).
- [ ] Pochi verification procedure for staff (what to check on the M-Pesa statement) before Phase 7.
