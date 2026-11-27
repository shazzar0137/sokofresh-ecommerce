# 0014. Backend foundation choices made during the Phase 3 scaffold

- Status: **Accepted** (made under the owner's Phase 3 delegated authority 2026-11-26; confirmed by the owner 2026-11-27, D-052)
- Date: 2026-11-26
- Decided by: Backend Specialist conversation, under the Phase 3 instruction "for ordinary reversible technical decisions within the approved architecture, make the most reasonable decision, document the reasoning and continue"

## Context
ADR-0010 left some choices open ("verify at scaffold"), and building the foundation raised small questions the earlier ADRs did not cover. Each choice below is reversible and stays inside the approved architecture.

## Decisions

| # | Decision | Why | Reversal cost |
|---|---|---|---|
| 1 | **Error format: a small custom DRF exception handler** (`apps/core/exceptions.py`) producing RFC 9457 problem details, instead of drf-standardized-errors | ADR-0010 allowed either. drf-standardized-errors' default format is not RFC 9457; adapting both its formatter and its OpenAPI output would be more code than the ~150-line handler. One dependency fewer | Low |
| 2 | **Validation errors return 422**; malformed JSON returns 400 | Separates "your data is wrong" (show field errors) from "the request is broken" | Low (contract change before any client exists) |
| 3 | **Linter/formatter: ruff** (dev-only tool) | CI needs backend linting (Phase 3 instruction); ruff is one fast tool for lint, import order and formatting, including Django and security (bandit) rules. Not a runtime dependency | Very low |
| 4 | **Shared cache: Django database cache** (`sokofresh_cache` table) in base/production settings | allauth and DRF rate limits must be shared by all server processes; the default per-process memory cache would let each process count separately. The database cache needs no Redis (ADR-0010). Requires `manage.py createcachetable` at deploy | Low |
| 5 | **Code layout: `backend/apps/<app>/` and `backend/config/`**, replacing the empty `backend/src/` skeleton | ADR-0011 item 4 removes the layer folders; `apps.<name>` imports with short app labels (`accounts`, `catalogue`, ...) keep Django conventions simple | Low now, higher once models exist |
| 6 | **allauth endpoints accept phone numbers only in E.164** (`+2547…`) | allauth headless always requires E.164 for phone input (its own source says so). The frontend already normalises numbers (FE-32). Our adapter then rejects non-Kenyan numbers | Low |
| 7 | **Login codes: 6 digits, no dash, valid 5 minutes, 3 attempts**; code requests limited to 3 per number per 10 minutes and 10 per day, 30 per minute per IP | Easy to type on a phone; tighter than allauth defaults against SMS-pumping cost; the per-IP limit stays generous because Kenyan mobile users often share carrier IP addresses | Very low (settings) |
| 8 | **Production SMS default refuses to send** (`DisabledSmsBackend`) until the Africa's Talking backend is built (Phase 5); production refuses console/in-memory backends | Fail safely rather than appear to work | Very low |
| 9 | **HSTS starts at 1 hour**; `security.W005` (include subdomains) and `security.W021` (preload) are silenced deliberately | Raise HSTS to a year once HTTPS is stable; subdomain and preload commitments wait for the final domain plan | Very low |
| 10 | **Packages deferred to the phase that first needs them:** django-filter, django-auditlog, django-storages (Phase 4); time-machine (Phase 5–6); sentry-sdk (Phase 8); Schemathesis (Phase 4, once real endpoints exist) | "Smallest suitable dependency set" (Phase 3 instruction). All remain approved by ADR-0010 | None |
| 11 | **Secret scanning runs the MIT-licensed gitleaks tool directly in CI** (checksum-verified), not the gitleaks GitHub Action | The Action has its own commercial licence terms | Very low |
| 12 | **CI database: PostgreSQL 17**; local development may use PostgreSQL 16+ | Neon offers 17/18 (ADR-0003); tests require 16 or newer | Very low |

## Additions after the independent review (2026-11-27)

Made under the same delegated authority, to fix review findings (`backend/documentation/quality/BACKEND_REVIEW_REPORT.md`). All reversible; confirmed by the owner 2026-11-27 (D-052).

| # | Decision | Why |
|---|---|---|
| 13 | **Sign-up closed** (`ACCOUNT_SIGNUP_OPEN = False`) until account creation at checkout (Phase 5) | It crashed and revealed registered numbers (SEC-2) |
| 14 | **Staff/superusers cannot sign in with an SMS code** (and no code is texted to them); **Django admin requires a password sign-in on the admin login page in the same session** (custom `AdminSite` via `AdminConfig.default_site`) | SIM-swap risk; promoted users and allauth API logins bypassed the admin page (SEC-1, RSEC-1) |
| 15 | **`DJANGO_TRUSTED_PROXY_COUNT`** feeds DRF `NUM_PROXIES` and allauth `TRUSTED_PROXY_COUNT`; 0 by default, required in production | Spoofed `X-Forwarded-For` bypassed limits; behind a proxy all users shared one IP (ARCH-1/2) |
| 16 | **Database cache: 100,000 rows + `purge_expired_cache` command** (host cron); tests use the same database cache | The 300-row default let counters be evicted (PERF-1). Residual flood risk accepted until Turnstile (KI-012) |
| 17 | **allauth features not offered yet are shadowed** (phone change, email, email verification, password reset/change) | They could send SMS/email to arbitrary addresses (SEC-8, RSEC-3) |
| 18 | **401 for "not signed in"** (`apps.core.authentication.SessionAuthentication` adds a challenge header) | Matches the documented contract (API-1) |
| 19 | **django-allauth without the `[headless]` extra** | The extra only adds PyJWT/cryptography for token clients we do not use (DEP-1) |
| 20 | **coverage** (and PyYAML, used by the contract test) as development dependencies | Coverage figures for the review (QA-13) |
| 21 | **Secret scan in its own workflow** on every push, with a narrow `.gitleaks.toml` allow list | It was skipped for non-backend pushes (QA-7) |

## Consequences
- The OpenAPI contract documents a shared `ProblemDetail` schema on every operation (`4XX`, `5XX`).
- Deployment steps must include `createcachetable` (recorded in the developer guide).
- ADR-0010's "verify at scaffold" item for the error handler is closed by decision 1.
