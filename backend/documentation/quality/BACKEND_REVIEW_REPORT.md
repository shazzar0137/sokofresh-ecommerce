# Backend Review Report: Phase 3 foundations

_Date: 2026-11-26/27 · Branch `feature/phase-3-foundations` · Reviewed commit `2895fd7`; corrections in `9b32959`, `6b776d7` and the commit that adds this report_
_Coordinated by the Backend Specialist conversation; the reviews were done by independent Claude subagents that had not written the code_

## 1. Summary

| | Result |
|---|---|
| Review agents | 6 independent reviewers, then 3 independent re-reviewers of the corrections (§2) |
| Findings | **100 recorded** across the 9 reviews (several reviewers reported the same issue): 12 High, 30 Medium, 37 Low, 21 Info. **No Critical.** Per review: architecture 16 (2 H), database 13 (2 H), security 13 (2 H), API 14 (2 H), testing/CI 18 (3 H), dependencies/performance 10 (1 H), re-reviews 16 (0 H) |
| High findings | The 12 High labels cover **10 distinct issues: all fixed, with tests, and verified by re-review** |
| Medium findings | All fixed except 4 open items with a recorded plan: DB-4, ARCH-7, API-4 and the residual cache-flood risk RSEC-2/RQA-2 (§9) |
| Tests | 89 → **211**, all passing on PostgreSQL 16 (random order and 4-way parallel too) |
| Coverage | **94%** of backend code, counting production settings that run in subprocesses (89% in-process only) |
| Mutation checks | 50 by the QA reviewer at the start (34 caught); after the corrections, 31 targeted mutations, **all caught** |
| Final assessment | Phase 3 foundation is **verified for development use**. It is **not** production-ready, and must not be deployed before KI-007 (admin MFA/rate limit) and KI-012 (SMS-flood protection) are closed (§10) |

## 2. Review agents activated

The requested specialist agent types for architecture (`code-modernization:architecture-critic`) and security (`code-modernization:security-auditor`) **failed to load from their plugin**. Those two reviews were run with the general-purpose agent using the same brief. Every reviewer worked on its own clone and its own PostgreSQL database, and could not change the original repository.

| # | Review | Agent type | Ran commands? | Findings |
|---|---|---|---|---|
| 1 | Django architecture and code quality | general-purpose (architecture-critic unavailable) | Yes | ARCH-1 … ARCH-16 |
| 2 | Database design and integrity | general-purpose | Yes | DB-1 … DB-13 |
| 3 | Authentication and backend security | general-purpose (security-auditor unavailable) | Yes | SEC-1 … SEC-13 |
| 4 | API design and OpenAPI contract | feature-dev:code-reviewer | **No** (no shell in that agent; code reading only). Its main claims were then **verified by running them** (§3.4) | API-1 … API-14 |
| 5 | Automated testing and CI/CD | general-purpose | Yes (incl. 50 mutations) | QA-1 … QA-18 |
| 6 | Dependency management and performance | general-purpose | Yes | DEP-1 … DEP-5, PERF-1 … PERF-5 |
| R1 | Re-review of security corrections (`9b32959`) | general-purpose | Yes | RSEC-1 … RSEC-5 |
| R2 | Re-review of DB/API/test corrections (`9b32959`) | general-purpose | Yes | RQA-1 … RQA-7 |
| R3 | Re-review of second-round corrections (`6b776d7`) | general-purpose | Yes | R3-1 … R3-4 |

## 3. Files and modules reviewed

All backend code and configuration on the branch:
- `backend/config/` (settings `base`, `dev`, `test`, `prod`, `_env`, `urls`, `api_v1`, `wsgi`, `asgi`)
- `backend/apps/core/` (phone, logging, exceptions, openapi, views, pagination, http; added during review: authentication, admin_site, `purge_expired_cache` command, migration 0001)
- `backend/apps/accounts/` (models, manager, roles, adapter, admin, migrations 0001–0003, factories)
- `backend/apps/notifications/` (sms, services)
- The other seven apps: configuration only (empty by design in Phase 3)
- `backend/conftest.py`, every test file, `pyproject.toml`, `uv.lock`
- `shared/contracts/openapi.yaml`, `shared/test-fixtures/phone-numbers.json`
- `.github/workflows/*.yml`, `.gitleaks.toml`, `.gitignore`
- The backend documentation, checked against the code

### 3.4 Claims of the API reviewer checked by running them

| Claim | Result when run |
|---|---|
| API-1: not signed in gives 403, not 401 | Confirmed (`{"status": 403, "code": "not_authenticated"}`) |
| API-3: spoofed `X-Forwarded-For` bypasses throttling | Confirmed (0 of 130 rotated requests throttled) |
| API-5: Django `ValidationError` in a view gives 500 | Confirmed |
| API-6: bad `Host` header gives an HTML 400 | Confirmed |
| API-2: health check gives 500 instead of 503 when the database is down | Confirmed by code path (throttle cache I/O before the view); fixed and tested |

## 4. Tests actually executed

| Run | Result |
|---|---|
| Baseline before review (`2895fd7`): `uv run pytest` | 89 passed |
| Final (`uv run pytest`) | **211 passed, 0 failed, 0 skipped** |
| Random order (pytest-randomly, several seeds) | 209–211 passed every run |
| Parallel (pytest-xdist `-n 4`) | All passed |
| CI simulation on a fresh clone of `6b776d7` with a new empty database (`uv sync --locked`, ruff check, ruff format --check, makemigrations --check, pytest, pip-audit) | All passed |
| `manage.py check --deploy --fail-level WARNING` with production settings | Passes (inside the suite) |
| `manage.py check` with development settings | No issues |
| OpenAPI regeneration with `--validate --fail-on-warn`, diffed against the committed contract | Identical |
| `pip-audit` on all locked dependencies | No known vulnerabilities |
| `ruff check`, `ruff format --check` | Clean |

Test files (211 tests): accounts: `test_phone_login` 23, `test_user_model` 19, `test_admin` 11, `test_adapter` 6, `test_roles` 4. core: `test_logging` 33, `test_http` 15, `test_api_errors` 13, `test_exceptions` 10, `test_phone` 6, `test_health` 2. notifications: `test_sms` 4. Project-wide: `integration/test_settings` 29, `integration/test_database` 6, `contract/test_openapi` 5, `security/test_security_baseline` 19, `security/test_rate_limits` 6.

**Not executed:** the GitHub Actions workflows and gitleaks. The branch is not on GitHub yet (KI-005), and running the gitleaks binary in this session was declined (KI-008).

## 5. Coverage

Measured with `coverage` (added as a development-only tool for this review), excluding migrations and tests.

| Measurement | Result |
|---|---|
| In-process | 89% |
| Including subprocess-run production settings (`patch = ["subprocess"]`) | **94%** (710 statements, 41 missed) |
| 100% | adapter, admin, roles, authentication, http, phone, pagination, sms, services, `prod.py`, `base.py`, `test.py`, `_env.py`, urls |
| Below 100% | models 96%, exceptions 97%, purge command 95%, openapi 94%, logging 92%, views 91%, admin_site 88%, `api_v1.py` 75% (development-only docs routes) |
| 0% (not run by tests, by design) | `dev.py` (manual development), `wsgi.py`, `asgi.py` (server entry points) |

Coverage is not yet measured in CI; adding a coverage step is listed in §9.

## 6. Security findings

All High and Medium security findings, and what happened to them. Low and Info items are in the full register (§8).

| ID | Sev | Finding | Status |
|---|---|---|---|
| SEC-1 | **High** | Staff and superusers could open Django admin with only an SMS code (SIM-swap risk) | **Fixed**: code sign-in refused for staff, and no code is texted to staff numbers. The admin also requires a password sign-in on the admin page in the same session (RSEC-1) |
| SEC-2 / QA-1 | **High** | Sign-up crashed (500) for new numbers and revealed which numbers have accounts | **Fixed**: sign-up closed until Phase 5; the same 403 for every number |
| PERF-1 / DB-2 | **High** | The database cache's 300-row limit let a flood of keys evict sign-in rate-limit counters (reproduced end-to-end) | **Fixed** for the reproduced attack (limit 100,000, purge command, tests on the real cache backend). Residual risk from a large multi-IP flood: **open, KI-012** |
| ARCH-1 / SEC-3 / API-3 | **High** | Spoofed `X-Forwarded-For` bypassed DRF throttling | **Fixed**: trusted-proxy count (0 = header ignored; required in production) |
| ARCH-2 | High | Behind a proxy, allauth would see one IP for all users (site-wide lockout) | **Fixed**: same trusted-proxy setting for allauth |
| RSEC-1 | Medium | A promoted customer's code-only session, or allauth's API password login, could open the admin | **Fixed**: custom admin site requiring a password sign-in on the admin page |
| RSEC-3 | Medium | allauth email and password-reset routes live (would allow arbitrary email / staff reset once configured) | **Fixed**: routes shadowed (404) |
| RSEC-4 | Medium | Log-redaction regex was quadratic: a crafted 8 KB header took 6.3 s | **Fixed**: linear patterns (a 60 KB worst case now takes about 8 ms) |
| SEC-4 / ARCH-5 | Medium | Redaction missed common phone formats and all tracebacks | **Fixed** (redacting formatter, more formats); known limits documented |
| SEC-5 | Medium | SMS provider failure gave a different response for known numbers | **Fixed**. Timing difference once a real provider is called: open, Phase 5 |
| SEC-8 | Low | Signed-in users could make the system text any number | **Fixed**: phone-change route shadowed |
| SEC-6 / 7, ARCH-9 / 10, RSEC-5 | Low | Production guard bypasses (admin path, weak secret keys, SMS backend name tricks, negative proxy count) | **Fixed**, 20 refusal cases tested |
| SEC-10 | Low | Outbound HTTP allow-list ignored ports | **Fixed**: host+port allow-list; TLS/proxy overrides refused |

**Secrets:** three independent scans of the full Git history (mine, the security reviewer's, and the QA reviewer's statistical check) found only deliberate placeholder values. No `.env`, key or credential file is tracked.

## 7. Architectural findings

| ID | Sev | Finding | Status |
|---|---|---|---|
| ARCH-3 / DB-1 | Medium | Invalid phone in Django admin gave a 500 | Fixed (form error) |
| ARCH-4 | Medium | `.env` values ignored by development/test settings | Fixed (`_env.py` read first; production never reads `.env`) |
| ARCH-6 | Medium | `outbound_client` could not take provider headers | Fixed |
| ARCH-7 | Medium | No plan for serving admin static files in production | **Open**: needs a package decision (e.g. WhiteNoise) by the owner; KI-013 |
| ARCH-8 | Low | JSON error pages also on admin pages | Fixed (JSON only on `/api/`, `/_allauth/`) |
| ARCH-12 | Low | accounts imported notifications internals, against the services rule | Fixed (`notifications/services.py`) |
| DB-3 | Medium | Blank and padded emails bypassed normalisation and uniqueness | Fixed (normalised on every save + CHECK constraint) |
| DB-4 | Medium | Approved deletion plan (hash the phone) conflicts with the phone CHECK constraint, and with number recycling | **Open: design decision needed** before Phase 4; KI-011. Architecture not changed silently |
| DB-5 | Medium | Rate limits depended on a manual `createcachetable` step | Fixed (migration `core.0001`) |
| API-1 | High | Not signed in returned 403 | Fixed (401 + `WWW-Authenticate`) |
| API-2 / PERF-2 | High / Medium | Health check throttled: a DB outage would be a 500; 13 queries per probe | Fixed (1 query, no throttle) |
| QA-2, QA-3 | High | No tests that inactive users get no code, or that codes stop after 3 wrong attempts (mutations survived) | Fixed (tests added; mutations now caught) |
| API-7 | Medium | Error `code` not typed in the contract | Fixed (enum generated from code) |
| QA-7 | Medium | Secret scan skipped on non-backend pushes | Fixed (own workflow) |
| RQA-1 | Medium | Test cache cleanup could wipe a developer's real cache | Fixed |
| DEP-1 | Low | allauth `headless` extra pulled cryptography (~15 MB), unused | Fixed (extra dropped; headless works without it) |
| ARCH-15 | Info | Small duplications (settings defaults, imports) | Partly tidied; rest harmless |

No unnecessary or duplicate implementations of approved libraries were found. Every direct dependency is approved and used (dependency review §3). Approved architecture was not changed: the new admin site is Django's documented customisation point, and the two items that would change approved decisions (DB-4, ARCH-7) are open questions for the owner.

## 8. Corrections completed

Two correction rounds, each followed by independent re-review:

| Round | Commit | Content | Re-review |
|---|---|---|---|
| 1 | `9b32959` | All High findings and most Medium/Low (list in the commit message) | R1 + R2: all fixes verified; 12 new findings (RSEC-1–5, RQA-1–7) |
| 2 | `6b776d7` | RSEC-1–5, RQA-1–7 | R3: all verified; 2 Low + 2 Info |
| 3 | (this commit) | R3-1 (doc), R3-2 (redact before truncating), R3-4 (no SMS to staff numbers) | Verified by tests and mutation checks; small and low-risk, so no further agent re-review |

**Full register.** Every finding with its file, severity and action, by area:

| Area | Fixed | Documented / accepted | Open (with plan) |
|---|---|---|---|
| Architecture (ARCH-1–16) | 1–6, 8–14, 16 (doc) | 15 (tidy, partial) | 7 |
| Database (DB-1–13) | 1, 2, 3, 5, 6, 8, 9 (pooler flag), 13 | 7 (createsuperuser traceback, Low), 10 (allauth email table unused; `User.email` authoritative), 11, 12 | 4 |
| Security (SEC-1–13) | 1–8, 10, 11, 13 | 9 (proxy must overwrite header: hosting checklist), 12 (`has_role` fails closed for superusers, documented) | 5 (timing, Phase 5) |
| API (API-1–14) | 1, 2, 3, 5, 6, 7, 8, 9, 11 (docs), 12 (docs), 14 | 13 (OPTIONS/HEAD: acceptable) | 4 (send `got_request_exception` / Sentry DRF integration: Phase 8), 10 (request size limit at proxy: Phase 8) |
| Testing/CI (QA-1–18) | 1–12, 13 (coverage dev dep; CI step open), 14, 16 | 15 (duplicate push+PR runs accepted), 17 (pin image digests: optional), 18 | 13 (coverage in CI; Schemathesis/time-machine deferred per ADR-0014) |
| Dependencies/performance (DEP-1–5, PERF-1–5) | DEP-1, PERF-1, 2, 3, 4 | DEP-3, DEP-4 (classifier lag, KI-010), DEP-5 (psycopg LGPL: unmodified library use, fine), PERF-5 | DEP-2 (7-day release cooldown: policy decision) |
| Re-reviews (RSEC, RQA, R3) | RSEC-1, 3, 4, 5; RQA-1, 3, 4, 5, 7; R3-1, 2, 4 | RQA-6 (0003 assumes no existing data: true today), R3-3 (by design) | RSEC-2 / RQA-2 (KI-012) |

## 9. Outstanding issues

| ID | Issue | Severity | Owner / when |
|---|---|---|---|
| KI-007 | Django admin password login has no MFA and no rate limit | High if deployed | Phase 5; **no deployment before** |
| KI-012 | A large multi-IP flood can still evict rate-limit counters (database cache); no global SMS budget | Medium | Phase 5, **before a real SMS provider is enabled**: Turnstile + daily SMS budget; consider Redis/Upstash (needs approval) |
| KI-011 | DB-4: deletion/anonymisation design conflicts with the phone constraint and number recycling | Medium | Owner/Architect decision before Phase 4 |
| KI-013 | ARCH-7: admin static files in production (e.g. WhiteNoise, needs approval) | Medium | Owner decision before Phase 8 |
| KI-005 | Branch not on GitHub (session has no write access) | — | Owner pushes the bundle |
| KI-008 | CI workflows and gitleaks (incl. `.gitleaks.toml` format) not yet run on GitHub | Medium | First CI run after push |
| — | Coverage report step in CI; Schemathesis and time-machine as the testing strategy promises (deferred) | Low | Phase 4 |
| — | SEC-5 timing, API-4 error signal, API-10 body size, DEP-2 cooldown, ARCH-15 tidy-ups | Low | As listed in §8 |

## 10. Final quality assessment

- **The foundation is sound and now well tested.** The custom user model was correctly created before the first migration. Its constraints hold against raw SQL. Migrations run forwards and backwards on an empty database. The error format, the health check and the OpenAPI contract behave as documented, and the tests are genuine: 31 of 31 targeted mutations were caught after the corrections.
- **The review was necessary.** The original implementation passed its own 89 tests but had 10 distinct High issues that those tests didn't exercise. The main gaps were negative paths, the production cache backend and staff sign-in.
- **Verified for development and for starting Phase 4.** All High findings are fixed and re-reviewed.
- **Not production-ready.** KI-007 and KI-012 must be closed, and KI-011 and KI-013 decided, before any deployment. CI must also pass on GitHub.
- **Recommendation:** after the owner pushes the branch and the first CI run is green, decide KI-011 (it affects the Phase 4 data model), then proceed to Phase 4.
