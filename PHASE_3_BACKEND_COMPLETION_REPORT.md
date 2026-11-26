# Phase 3 Backend Foundations: Completion Report

_Date: 2026-11-26 (overnight session) · Author: Backend Specialist conversation · Branch: `feature/phase-3-foundations`_

**This is a foundation, not a production-ready system.** Nothing has been deployed. Known gaps that block any deployment are listed in §11.

## ⚠ Blocking item for the owner (read first)

**The branch is not on GitHub yet.** This session could read the repository but not write to it:
- The GitHub connector returned `403 Resource not accessible by integration` when creating the branch.
- The session's request for push access was declined.

Following the instruction "never request or expose personal access tokens", no token was asked for. Instead, the finished branch was delivered to the project folder as a git bundle: `tmp/phase-3-foundations.bundle` (`tmp/` is git-ignored). The owner pushes it with their own credentials using the steps in §10. Until then, GitHub `main` and the local `main` are unchanged at `965e047`.

---

## 1. What was implemented

| Area | Result |
|---|---|
| Git | Verified local repo (`main` = `origin/main` = `965e047`, remote `git@github.com:shazzar0137/sokofresh-ecommerce.git`, no uncommitted changes: 233 local files match the commit). Work done on `feature/phase-3-foundations`; nothing on `main`; no force push |
| Django project | uv project (Python 3.13, Django 6.1.3, locked); settings split `base` / `dev` / `test` / `prod`; django-environ; URL routing (`/api/v1/`, `/_allauth/`, admin path from env); logging with personal-data redaction; JSON error pages |
| Ten apps | `core`, `accounts`, `catalogue`, `inventory`, `basket`, `orders`, `payments`, `delivery`, `notifications`, `store` under `backend/apps/`. Only `core`, `accounts` and `notifications` have code in Phase 3; the rest are registered, empty apps ready for their phase. Empty `backend/src/` layer folders removed (ADR-0011 item 4) |
| Custom user model | Phone-based `accounts.User`, created **before the first migration**; Kenyan E.164 CHECK constraint; optional case-insensitive unique email; customers without usable passwords; superusers require a password; role groups Customer, Rider, Staff, Admin; Django admin for users |
| Authentication foundation | django-allauth headless (browser client), phone + one-time code login for existing accounts; our adapter implements allauth's five phone hooks; SMS sending abstraction with development, test and fail-closed production backends; tighter code-request limits |
| API | DRF, deny-by-default permissions, session auth with CSRF, throttles, pagination, RFC 9457 errors (custom handler, ADR-0014), `GET /api/v1/health` |
| OpenAPI | drf-spectacular; contract generated to `shared/contracts/openapi.yaml` (OpenAPI 3.0.3); `ProblemDetail` on every operation; drift check in tests; Swagger UI in development only (CSP-compatible split view) |
| Outbound HTTP | `outbound_client()` (httpx): host allow list, HTTPS only, timeouts, no redirects |
| Tests | 89 pytest tests on real PostgreSQL |
| CI | `.github/workflows/backend-ci.yml`: lint, tests with PostgreSQL 17 service, dependency audit, secret scan |
| Docs | Backend README, developer guide (Windows), API, database and security docs, contract note for Frontend, ADR-0014, PROJECT_STATE |

## 2. Files created and modified

All changes are in the two code commits and the documentation commit on the branch (§9). Summary:

| Kind | Paths |
|---|---|
| Created: project | `backend/pyproject.toml`, `backend/uv.lock`, `backend/.python-version`, `backend/.env.example`, `backend/manage.py`, `backend/conftest.py`, `backend/config/` (settings ×4, `urls.py`, `api_v1.py`, `wsgi.py`, `asgi.py`) |
| Created: apps | `backend/apps/<10 apps>/` (`apps.py`, `migrations/`, `tests/`); code in `core` (`phone.py`, `logging.py`, `exceptions.py`, `openapi.py`, `views.py`, `pagination.py`, `http.py`), `accounts` (`models.py`, `roles.py`, `adapter.py`, `admin.py`, migrations 0001–0002, `tests/factories.py`), `notifications/sms.py` |
| Created: tests | 14 test files in `backend/apps/*/tests/` and `backend/tests/{integration,contract,security}/` |
| Created: shared | `shared/contracts/openapi.yaml` (generated), `shared/test-fixtures/phone-numbers.json`, `shared/documentation/CONTRACTS.md` |
| Created: CI | `.github/workflows/backend-ci.yml` |
| Created: docs | `backend/documentation/{developer/GETTING_STARTED.md, api/API.md, database/DATABASE.md, security/SECURITY.md}`, `docs/decisions/adr/0014-backend-foundation-choices.md`, this report |
| Modified | `.gitignore` (Python entries), `backend/README.md`, ADR index, `CHANGELOG.md`, `PROJECT_STATUS.md`, all six `PROJECT_STATE/` files |
| Removed | `backend/src/**` (empty `.gitkeep` folders + two READMEs describing the old layered layout), `.gitkeep` files in folders that now hold real files |

## 3. Dependencies installed and why

Compatibility was checked on PyPI before installing, then proven by running the full test suite on Django 6.1.3.

| Package | Version | Why | Django 6.1 status |
|---|---|---|---|
| django | 6.1.3 | Framework (ADR-0002) | — |
| djangorestframework | 3.18.3 | API (ADR-0002) | Declares 6.1 |
| drf-spectacular | 0.30.0 | OpenAPI generation (ADR-0004) | Declares up to 6.0; **verified by tests** |
| django-allauth[headless] | 65.23.0 | Phone + code sign-in (ADR-0005). The `headless` extra pulls PyJWT/cryptography | Declares 6.1 |
| django-tasks-db | 0.13.0 | Background task queue without Redis (ADR-0010) | Declares up to 6.0; **verified**: 21 migrations applied, task enqueued |
| django-environ | 0.14.0 | Settings from environment (ADR-0010) | Declares up to 6.0; verified |
| psycopg[binary] | 3.3.9 | PostgreSQL driver | — |
| phonenumbers | 9.0.44 | Phone validation (ADR-0010) | — |
| httpx | 0.29.0 | Outbound HTTP (ADR-0010) | — |
| Dev: pytest 9.2.0, pytest-django 4.14.0, factory-boy 3.3.3, respx 0.23.1 | | Testing (ADR-0010) | pytest-django and factory-boy declare older Django; verified |
| Dev: ruff 0.17.6 | | Lint + format (ADR-0014 #3) | — |
| Dev: pip-audit 2.10.1 | | Dependency vulnerability scan (ADR-0010) | — |

**Deferred** (approved but not needed yet, ADR-0014 #10): django-filter, django-auditlog, django-storages, time-machine, sentry-sdk, Schemathesis. **Not adopted** (as ADR-0010): Africa's Talking SDK, `responses`, Redis/Celery, third-party Daraja packages, drf-standardized-errors.

## 4. Database configuration

- PostgreSQL via `DATABASE_URL`. Built and tested on **local PostgreSQL 16.15**; CI uses PostgreSQL 17.
- **Neon is not set up**: it needs the owner's Neon account (instruction: "only after verifying account access"). Steps are in `backend/documentation/developer/GETTING_STARTED.md` §2.
- Database cache table `sokofresh_cache` for shared rate limits (`createcachetable`).
- Details: `backend/documentation/database/DATABASE.md`.

## 5. Custom user model status

**Done before the first migration.** `AUTH_USER_MODEL = "accounts.User"`, `USERNAME_FIELD = "phone"`. Implications reviewed before migrating (ADR-0014; database doc): phone is the unique login; database CHECK enforces Kenyan E.164; email optional and unique ignoring case; roles are groups, so no role columns. Migrations `accounts.0001_initial` and `accounts.0002_create_role_groups` applied cleanly on a fresh database.

## 6. API and OpenAPI status

- `/api/v1/health` (public): 200 `{"status":"ok","database":"ok"}`, 503 problem details if the database is down.
- RFC 9457 errors for all API errors and unknown URLs; validation errors 422 with flat field paths.
- Contract `shared/contracts/openapi.yaml` generated and validated with `--fail-on-warn`; drift check passes.
- Sign-in endpoints at `/_allauth/browser/v1/` (allauth's own spec). **Frontend note:** they require E.164 phone input (allauth design); see `shared/documentation/CONTRACTS.md`.
- Coordination with Frontend: points F-1 to F-6 in `shared/documentation/CONTRACTS.md` are for the Frontend conversation to confirm.

## 7. Tests executed and actual results

Run on 2026-11-26 against PostgreSQL 16.15, Python 3.13.18, Django 6.1.3.

| Run | Result |
|---|---|
| `uv run pytest` (full suite, repeated) | **89 passed, 0 failed** |
| CI simulation on a fresh clone of the branch (`uv sync --locked`, ruff check, ruff format --check, makemigrations --check, pytest, new empty database, only `DATABASE_URL` set) | **All passed** (89 tests) |
| `ruff check .` / `ruff format --check .` | Clean |
| `manage.py check --deploy --fail-level WARNING` (production settings, fake values) | Passes (inside the test suite) |
| `pip-audit` on the locked dependency set | **No known vulnerabilities** |
| Manual development check (`runserver`) | health 200; docs page 200 with CSP; admin login 200; code request printed a masked SMS to the console |

| Test file | Tests | Covers |
|---|---|---|
| `tests/integration/test_settings.py` | 11 | Ten apps, security defaults, PostgreSQL, production deploy check, production refusing 5 unsafe configurations and a missing secret key, secure cookies/HTTPS |
| `tests/integration/test_database.py` | 4 | PostgreSQL ≥ 16, UTC storage, migrations in sync, task stored by django-tasks-db |
| `tests/contract/test_openapi.py` | 3 | Valid schema, ProblemDetail on all operations, **drift check** |
| `tests/security/test_security_baseline.py` | 5 | Security headers + CSP, CSRF required for sign-in, docs not served, admin path |
| `apps/accounts/tests/test_user_model.py` | 9 | Normalisation, uniqueness, DB CHECK, email rules, superuser password, masked `str()` |
| `apps/accounts/tests/test_phone_login.py` | 11 | Real allauth flow: code request → SMS → confirm → session; wrong code; E.164 rule; non-Kenyan rejected; invalid number no SMS; unknown number no SMS; rate limit (3 SMS then refused); stable error code; sign-out |
| `apps/accounts/tests/test_roles.py` / `test_admin.py` | 4 / 3 | Role groups, `has_role`, admin pages, admin creates password-less customer, customers blocked from admin |
| `apps/core/tests/*` | 35 | Phone fixtures, log redaction, error format, health, outbound HTTP allow list (respx) |
| `apps/notifications/tests/test_sms.py` | 4 | SMS backends, masking, production default refuses |

**Not executed:** the GitHub Actions workflow (the branch is not pushed yet); gitleaks (running the downloaded binary in this session was declined, so it runs in CI only).

## 8. Security measures established

See `backend/documentation/security/SECURITY.md` (controls, each with the test that proves it, and gaps). Highlights: production fails safely on unsafe config; HTTPS-only cookies; CSRF; deny-by-default API; SMS abuse limits and no account enumeration; database constraints; safe 500s; CSP and security headers; SSRF allow list; phone numbers and codes redacted from logs; locked dependencies with an audit; CI actions pinned to commit SHAs.

## 9. Git commits

| Commit | Message |
|---|---|
| `620f0a6` | Scaffold Django backend foundations (Phase 3) |
| `20f316c` | Add backend CI workflow (GitHub Actions) |
| `44f4b67` | Document Phase 3 backend foundations |
| (this commit) | Record commit hashes in the completion report |

GitHub links will exist only after the owner pushes (§10): branch `https://github.com/shazzar0137/sokofresh-ecommerce/tree/feature/phase-3-foundations`, CI under the repository's **Actions** tab.

## 10. Owner steps: put the branch on GitHub

In **PowerShell**, in the project folder (`cd C:\Users\danie\OneDrive\Documents\sokofresh-ecommerce`):

1. Check you are on a clean `main`: `git status` should say `On branch main` and `nothing to commit, working tree clean`.
2. Check the bundle: `git bundle verify tmp\phase-3-foundations.bundle` should end with `is okay`.
3. Bring in the branch: `git fetch tmp\phase-3-foundations.bundle feature/phase-3-foundations:feature/phase-3-foundations`
4. Switch to it: `git switch feature/phase-3-foundations`
5. Check: `git log --oneline -5` shows the four branch commits (newest first), then `965e047 Initial commit`.
6. Push (uses your existing SSH key): `git push -u origin feature/phase-3-foundations`
7. On GitHub, open the repository → **Actions** tab → **Backend CI**, and check that all four jobs show a green tick.
8. Optional: delete the bundle file: `del tmp\phase-3-foundations.bundle`.

Do not merge into `main` until CI is green and you have reviewed the changes (open a pull request: repository → **Pull requests** → **New pull request** → base `main`, compare `feature/phase-3-foundations`).

## 11. Outstanding issues

| Issue | Impact | Next step |
|---|---|---|
| Branch not pushed (no write access from this session), KI-005 | GitHub not yet in sync | Owner: §10 |
| CI and gitleaks not yet run on GitHub, KI-008 | Failures possible on GitHub's runners that the local simulation missed (e.g. PostgreSQL 17 differences) | Check the first CI run |
| Django admin login has no MFA or rate limit yet, KI-007 | **Do not deploy** | Phase 5 |
| No real SMS provider (production refuses to send) | Expected for Phase 3 | Phase 5: Africa's Talking + Turnstile |
| Account creation at checkout (unknown numbers) not enabled | Expected for Phase 3 | Phase 5 (ADR-0011 item 5) |
| Neon development database not set up, KI-009 | Local PostgreSQL used instead | Owner: create Neon project; guide §2 |
| Several packages declare support only up to Django 6.0 (verified working on 6.1.3), KI-010 | Small upgrade risk | Re-check at each upgrade; CI catches breakage |
| Shell on the owner's computer (device workspace) failed every command this session, KI-006 | Work was done in the cloud workspace and delivered by bundle | None needed if it recurs; bundle route works |
| Frontend has not yet confirmed contract points F-1 to F-6 | Minor rework risk | Frontend conversation |
| Frontend scaffold, design tokens, contract type generation | Outside this backend assignment | Frontend conversation (Phase 3) |

## 12. Next recommended tasks

1. Owner: push the branch (§10), check CI, review, then merge to `main` through a pull request.
2. Owner: confirm ADR-0014 (or ask for changes); create the Neon project.
3. Frontend: confirm F-1 to F-6; generate types from `shared/contracts/openapi.yaml`.
4. **Phase 4 (catalogue slice):** install django-filter, django-auditlog, django-storages; build `catalogue`, `inventory` and `store` models with constraints, Django admin, read API (categories, products, meal kits, store settings, zones list), seed data from `PRODUCT_CATEGORIES.md`, Schemathesis in CI, `pg_trgm` check on Neon.
5. Phase 3 security tasks still open: threat model and data classification; CSP decision for Next.js (R-9).
