# Phase 3 Independent Integration Review

_Reviewer: Project Architect (this session) · Date: 2026-11-27 · Reviewed commit: `b2ed918` (= `feature/phase-3-foundations` head = content of `main` after PR #1, merge commit `0e6c91d`) · Corrections: branch `fix/phase-3-integration-review`_

## 0. Approval status

**NOT APPROVED (interim).** The Architect's own review, test runs and corrections are complete. The **independent agent reviews have not completed** (see §1). Phase 3 cannot pass the quality gate, and Phase 4 is not authorised, until the agent reviews and the re-review of the corrections are done and the owner has reviewed this report.

Important context: **Phase 3 was already merged into `main`** by the owner's account (`shazzar0137`) through PR #1 at 2026-11-27 06:16 (Nairobi), about eight minutes before this review was requested. This review therefore audits the merged code. No commit was made to `main` by this review; corrections are on a separate branch with a pull request.

## 1. Agent participation (disclosed honestly)

| # | Review area | Agent requested | What happened |
|---|---|---|---|
| 1 | Architecture and integration | `code-modernization:architecture-critic` | **Failed to load from its plugin**; relaunched as `general-purpose`, which then **stopped on a usage limit** before reporting |
| 2 | Backend security and DB integrity | `code-modernization:security-auditor` | **Failed to load**; relaunched as `general-purpose`, **stopped on a usage limit** before reporting |
| 3 | Frontend security and accessibility | `general-purpose` | **Stopped on a usage limit** before reporting |
| 4 | API contracts and compatibility | `general-purpose` | **Stopped on a usage limit** before reporting |
| 5 | Testing and CI/CD | `general-purpose` | **Stopped on a usage limit** before reporting |
| 6 | Code quality and maintainability | `feature-dev:code-reviewer` | **Stopped on a usage limit** before reporting |

**No findings in this report come from agents.** All six reviews were performed by the Project Architect directly, on the actual files, with the commands listed in §3. This is not equivalent to independent review: the agents are scheduled to resume after the usage limit resets (10:30 Nairobi time), and their findings, plus a re-review of the corrections, will be added to this report as §8.

## 2. Scope and method

- Inspected: GitHub repository `shazzar0137/sokofresh-ecommerce` (branches `main`, `feature/phase-3-foundations`), PR #1, all GitHub Actions runs and jobs, branch protection; the owner's local folder (read-only listing; the device shell failed, KI-006).
- Not relied on: the backend/frontend completion and review reports. Their claims were re-checked by running the suites and by direct experiments.
- Environment: fresh clone; Python 3.13.18 with uv; PostgreSQL 16.15; **Node 24.22.3** (matching `.nvmrc`); system Google Chrome for Playwright (the Playwright browser download is blocked here).

## 3. Test and check results (actually executed)

| Area | Command | Result |
|---|---|---|
| Backend lint | `uv run ruff check .` / `ruff format --check .` | Pass / pass |
| Migrations | `makemigrations --check --dry-run` (test settings) | Pass: no missing migrations |
| Backend tests (`b2ed918`) | `uv run pytest` | **211 passed** |
| Backend tests (with corrections) | `uv run pytest` | **220 passed** (+9 new) |
| Backend coverage (corrections branch) | `coverage run -m pytest; coverage report` | **92%** of application code (migrations, tests, dev settings, server entry points excluded) |
| Backend dependency audit | `pip-audit` on `uv export --all-groups` | No known vulnerabilities |
| Frontend install | `npm ci` (Node 24) | Pass |
| Frontend lint / types | `npm run lint`, `npm run typecheck` | Pass / pass |
| Frontend contract types | `npm run api:check` | Pass (types match `shared/contracts/openapi.yaml`) |
| Frontend unit/component/integration/axe | `npm test` | **343 passed** (25 files) |
| Frontend production build | `npm run build` with the CI variables | Pass (without `BACKEND_ORIGIN` it correctly refuses to build) |
| Production build check | `npm run check:production` | Pass: 144.8 KB gzip initial JS (budget 170 KB), no design-system page, no MSW |
| Frontend dependency audit | `npm audit --omit=dev` | 0 vulnerabilities |
| End-to-end (Playwright, Chrome) | `npm run test:e2e` | **53 passed, 13 skipped** (skips: desktop-only layout and rewrite tests not repeated on the mobile profile) |
| Drift detection, frontend | edited the contract; `npm run api:check` | Fails as it should (exit 1) |
| Drift detection, backend | edited the contract; renamed a URL | `test_committed_contract_matches_the_code` fails as it should |
| Real integration (dev settings) | Django `runserver` + `next start`, requests through Next.js | health 200; allauth config 200; CSRF cookie set through the proxy; CSRF-protected POST accepted with token, **403 without** |
| Real integration (prod settings) | Django with `config.settings.prod`, headers as sent by Next.js | **Sign-in POST rejected: "Origin checking failed"** → finding INT-1 |
| Proxy header probe | header-echo server behind `next start` | Django receives `Host` = backend, `Origin` = storefront, `X-Forwarded-Host` = storefront; client-sent `X-Forwarded-For` passed through unchanged |
| GitHub Actions | REST API, runs and jobs | All jobs green on `b2ed918` and `0e6c91d`: Backend CI (lint, tests, pip-audit), Frontend CI (checks, npm audit, **e2e**), Secret scan (gitleaks) |
| Secrets in history | full `git log -p` pattern scan; tracked file names | Only deliberate test values (fake CSRF tokens, a fake staff test password); no `.env`, key or credential files; gitleaks passed on GitHub |

## 4. Verification of the ten required points

| # | Point | Verdict | Evidence |
|---|---|---|---|
| 1 | Approved stack | **Pass** | Next.js 16.4.6, React 19.3.1, TypeScript 5.9.3, Tailwind 4.3.3, radix-ui/shadcn, TanStack Query 5, RHF + Zod 4, openapi-fetch 0.17, MSW 3, **no Zustand**; Node 24. Django 6.1.3, DRF 3.18.3, drf-spectacular 0.30, allauth 65.23, django-tasks-db 0.13, django-environ, httpx, phonenumbers, psycopg 3; uv; Python 3.13. No unapproved runtime dependency found. Deferred (approved later): django-filter, auditlog, storages, sentry-sdk, time-machine, Schemathesis |
| 2 | Structure | **Pass with notes** | 10 Django apps in `backend/apps/`; layered `backend/src/` removed (ADR-0011); frontend `src/pages/` and `src/routes/` removed (KI-003). Empty skeleton folders remain in `frontend/src/` (CQ-2) |
| 3 | Custom user model before first migration | **Pass** | `showmigrations --plan`: `accounts.0001_initial` runs right after Django's `contenttypes`/`auth`, before allauth, admin and sessions; created in the first backend commit |
| 4 | OpenAPI + frontend types | **Pass** | Contract generated and drift-checked on both sides; both checks proven to fail on a change (§3) |
| 5 | Next.js rewrites vs Django | **Fail → fixed** | Paths match (`/api/v1/*`, `/_allauth/*`, no trailing slash). Production CSRF broken behind the rewrite (INT-1, fixed). Proxy IP chain still open (KI-014) |
| 6 | Testing frameworks execute | **Pass** | §3: 211/220 backend, 343 Vitest, 53 Playwright, all executed |
| 7 | GitHub Actions run required checks | **Pass with gaps** | All required jobs exist and passed on GitHub. Gaps: no backend coverage minimum (fixed), no Schemathesis yet, no test of real Django behind Next.js (QA-1) |
| 8 | No secrets committed | **Pass** | §3 |
| 9 | Security configuration | **Pass for development; not deployable** | Fail-closed production settings, CSP/headers served, CSRF, deny-by-default API. Deployment blockers remain: KI-007, KI-012, KI-014, KI-015 |
| 10 | PROJECT_STATE accuracy | **Fail → fixed on branch** | It said "not merged" and "`main` = `965e047`"; listed stale test counts and "CI not yet run" lines; ADR-0014 missing from the ADR row. The owner's local folder is still pre-Phase 3 (KI-021) |

## 5. Findings (prioritised)

| ID | Severity | Area | Finding | Files | Correction | Status |
|---|---|---|---|---|---|---|
| INT-1 | **High** | Integration / backend security config | Production settings did not require `DJANGO_CSRF_TRUSTED_ORIGINS`. Through the Next.js rewrite Django sees its own `Host` but the storefront `Origin`, so **every sign-in POST fails CSRF in production** (reproduced: "Origin checking failed - https://www.sokofresh.co.ke does not match any trusted origins"). The frontend had reported this as F-8; it was merged unresolved | `backend/config/settings/prod.py`; `shared/documentation/CONTRACTS.md` (F-8) | Require non-empty https storefront origins (no path, no wildcard) at start-up; refusal tests; behavioural tests with the exact rewrite headers, including a foreign-origin refusal; mutation check (6 tests fail without the fix) | **Fixed** (branch) |
| GOV-1 | **High** (process) | Governance | Phase 3 was merged to `main` before the integration quality gate, and `main` has **no branch protection or rulesets**, so nothing enforces review or green checks | GitHub settings | Owner enables protection (§7); this review audits the merged code; Phase 4 stays blocked until the gate passes | **Open: owner action** (KI-020) |
| SEC-PROXY | **High if deployed** | Integration / security | Next.js passes client-sent `X-Forwarded-For` / `X-Forwarded-Proto` through and does not add the visitor's IP (measured). Per-IP limits and the HTTPS detection depend on the hosting topology | `frontend/next.config.ts`; `backend/config/settings/prod.py` | Already tracked as KI-014 (deployment blocker); design and test the real proxy chain in Phase 8 | Open (accepted for development) |
| DOC-1 | Medium | PROJECT_STATE | State files contradicted GitHub (not merged, `main` = `965e047`, "89 tests", "CI not yet run", ADR row without 0014) | `PROJECT_STATE/00`, `01`, `03`; `CHANGELOG.md` | Corrected; D-050, D-051, KI-019–021 added | **Fixed** (branch) |
| DOC-2 | Medium | Continuity | Owner's local folder is at `965e047` (old PROJECT_STATE says "no code, not a git repository"); stale `tmp/phase-3-foundations.bundle` | Local folder | Owner: `git pull` on `main`; delete the bundle | Open: owner (KI-021) |
| QA-1 | Medium | Testing | No automated test runs the **real Django** behind the **real Next.js** server; the e2e rewrite tests use a stub backend, which is why INT-1 passed CI | `frontend/tests/e2e/rewrites.spec.ts`; CI | Partly covered by the new backend rewrite-CSRF tests. Recommended for Phase 4: a CI job that starts Django (prod-like settings) + `next start` and runs the sign-in flow through the proxy | Open (Phase 4) |
| QA-2 | Medium | CI | Backend coverage was not measured in CI (frontend has enforced thresholds) | `.github/workflows/backend-ci.yml`, `backend/pyproject.toml` | Coverage step with an 85% minimum; currently 92% | **Fixed** (branch) |
| QA-3 | Medium | Testing strategy | Schemathesis contract testing (required by the approved testing strategy) is not in place; deferred by ADR-0014, which is still "owner to confirm" | ADR-0014; `docs/testing/TESTING_STRATEGY.md` | Owner confirms the deferral; add Schemathesis with the first real endpoints (Phase 4) | Open (Phase 4) |
| GOV-2 | Medium | Decisions | ADR-0014 (items 1–21) and D-046 (frontend choices) were made under delegated authority and are marked "owner to confirm" | `docs/decisions/adr/0014-*.md`; `PROJECT_STATE/02` | Owner confirms or asks for changes | Open: owner |
| CQ-1 | Low | Repository hygiene | Two completion reports sit at the repository root | `PHASE_3_*_COMPLETION_REPORT.md` | Move to `docs/reviews/` in a later tidy-up (links must be updated) | Open |
| CQ-2 | Low | Structure | Empty skeleton folders in `frontend/src/` (`state/`, `services/`, `hooks/`, `constants/`, `types/`, `styles/`, `accessibility/`); `state/` suggests a client store, which ADR-0011 removed | `frontend/src/*` | Remove empty folders or replace with a one-line README when first used | Open |
| INFO-1 | Info | Deployment | Known deployment blockers remain (not Phase 3 defects): KI-007 admin MFA/rate limit, KI-012 cache flood, KI-014 proxy chain, KI-015 CSP `unsafe-inline`, KI-013 admin static files, KI-011 deletion design | `PROJECT_STATE/04_KNOWN_ISSUES.md` | As planned in each issue | Open |

No **Critical** findings. No duplicated dependencies or unapproved technologies were found.

## 6. Corrections made (branch `fix/phase-3-integration-review`)

| Change | Files | Verification |
|---|---|---|
| INT-1: `DJANGO_CSRF_TRUSTED_ORIGINS` required in production (https, lower case, no path, no wildcard) | `backend/config/settings/prod.py` | 6 new refusal cases + missing-variable test; 3 behavioural rewrite-CSRF tests (`backend/tests/security/test_rewrite_csrf.py`); mutation check: removing the fix fails 6 tests |
| QA-2: backend coverage in CI, minimum 85% | `backend/pyproject.toml` (`[tool.coverage]`), `.github/workflows/backend-ci.yml` | Local run 92%; `uv lock --check` unchanged |
| DOC-1: PROJECT_STATE, CHANGELOG, contract note F-8, backend security doc | `PROJECT_STATE/*`, `CHANGELOG.md`, `shared/documentation/CONTRACTS.md`, `backend/documentation/security/SECURITY.md` | Reviewed against GitHub state |
| Full suites after the corrections | — | Backend 220 passed; ruff clean; frontend unchanged |

## 7. Owner actions

1. **Enable branch protection on `main`:** GitHub → repository **Settings** → **Branches** → **Add branch ruleset** (or **Add rule**) → target `main` → tick **Require a pull request before merging** (1 approval) and **Require status checks to pass**, adding *Lint (ruff)*, *Tests (pytest + PostgreSQL)*, *Dependency audit (pip-audit)*, *Lint, types, contract, unit/component tests, build*, *End-to-end and accessibility (Playwright + axe)*, *Dependency audit (npm audit)*, *Secret scan (gitleaks)* → **Create**.
2. **Do not merge** the correction PR until the agent re-review in §8 is done.
3. Update your local folder: in PowerShell, `cd C:\Users\danie\OneDrive\Documents\sokofresh-ecommerce`, then `git switch main` and `git pull`; then delete `tmp\phase-3-foundations.bundle`.
4. Confirm or change ADR-0014 and D-046 (including the Schemathesis deferral, QA-3).

## 8. Independent agent review (pending)

To be completed after the usage limit resets: the six reviewers resume on their isolated copies of `b2ed918`, then re-review the corrections on `fix/phase-3-integration-review`. Their findings, any further corrections and the final approval status will be recorded here.

## 9. Outstanding risks

- Merging happened before the gate; until branch protection exists, the same can recur (GOV-1).
- The real browser → Next.js → Django path in production (proxy headers, HTTPS detection, CSRF) is only partly tested; it must be tested end to end on staging (QA-1, KI-014).
- All six independent reviews are outstanding; this report's findings come from one reviewer.
