# Phase 3 Independent Integration Review

_Reviewer: Project Architect (this session) with six independent review agents and one independent re-reviewer · Date: 2026-11-27 · Reviewed commit: `b2ed918` (= content of `main` after PR #1, merge commit `0e6c91d`) · Corrections: branch `fix/phase-3-integration-review`, PR #2 (`844783d`, `be9f74b`, `dffd124`, `bcc4861`, `5771c79` and this fix-up)_

## 0. Approval status

**APPROVED FOR DEVELOPMENT.** The owner reviewed this report and merged PR #2 on 2026-11-27 (15:13 Nairobi, merge commit `809964b`). Phase 4 has not started; it waits for the owner's go-ahead.

_At the time of writing: corrections complete and recommended for approval; not merged._

- All six independent reviews reported (§1). No Critical findings.
- Every High finding that can be fixed in code before deployment is fixed and independently re-reviewed (§5, §8).
- Three High items remain open by design, because they are about the real hosting setup or a later phase, and they **block any deployment**:
  - GOV-1/KI-020: branch protection, owner action.
  - SEC-PROXY/KI-014: the proxy chain, Phase 8.
  - BSEC-1 residual/KI-007: admin MFA, Phase 5; production refuses to start without an explicit acceptance.
- The Phase 3 integration gate passes for **development**, subject to the owner reviewing this report and PR #2. It does **not** approve deployment.

Context: Phase 3 was merged into `main` by the owner's account through PR #1 (2026-11-27 06:16 Nairobi), before this review. This review audited the merged code. No commit was made to `main`; every correction is on PR #2.

## 1. Agent participation (disclosed honestly)

| # | Review area | Agent | What happened |
|---|---|---|---|
| 1 | Architecture and integration | `general-purpose` (the requested `code-modernization:architecture-critic` failed to load) | Stopped once on a usage limit, resumed, **reported** (ARC-1 to ARC-12) |
| 2 | Backend security and DB integrity | `general-purpose` (the requested `code-modernization:security-auditor` failed to load) | Stopped once, resumed, **reported** (BSEC-1 to BSEC-12) |
| 3 | Frontend security and accessibility | `general-purpose` | Stopped once, resumed, **reported** (FSEC-1 to FSEC-6, A11Y-1 to A11Y-4) |
| 4 | API contracts and compatibility | `general-purpose` | Stopped once, resumed, **reported** (API-1 to API-10) |
| 5 | Testing and CI/CD | `general-purpose` | Stopped once, resumed, **reported** (QA-1 to QA-12, 25 mutation tests) |
| 6 | Code quality and maintainability | `feature-dev:code-reviewer` | Stopped once, resumed, **reported** (CQ-1 to CQ-15; read-only agent, so no test runs) |
| R | Re-review of all corrections | fresh `general-purpose` agent (did not write the fixes) | Three rounds: `be9f74b` (RR-1 to RR-10), `dffd124` (RR-11 to RR-13), `bcc4861` (§8) |

Each reviewer worked on its own copy of the repository and its own database, and reported file paths, evidence and commands. Reports were checked against the code before acting; the Architect reproduced or confirmed every High finding himself (§5).

## 2. Scope and method

- Inspected: GitHub repository `shazzar0137/sokofresh-ecommerce` (branches `main`, `feature/phase-3-foundations`), PR #1, all GitHub Actions runs and jobs, branch protection; the owner's local folder (read-only listing; the device shell failed, KI-006).
- Not relied on: the backend/frontend completion and review reports. Their claims were re-checked by running the suites and by direct experiments.
- Environment: fresh clone; Python 3.13.18 with uv; PostgreSQL 16.15; **Node 24.22.3** (matching `.nvmrc`); system Google Chrome for Playwright (the Playwright browser download is blocked here).

## 3. Test and check results (actually executed)

### 3.1 At the reviewed commit `b2ed918` (Architect's runs; the reviewers' own runs agreed)

| Area | Result |
|---|---|
| Backend: ruff, `makemigrations --check`, pytest | Pass; no missing migrations; **211 passed** (also in random order ×5 and in parallel) |
| Backend: pip-audit | No known vulnerabilities |
| Frontend: lint, typecheck, `api:check`, Vitest | Pass; **343 passed** |
| Frontend: build, `check:production`, `npm audit` | Pass; 144.8 KB gzip initial JS (budget 170 KB); 0 vulnerabilities |
| Frontend: Playwright (Chrome) | **53 passed, 13 skipped** (desktop-only tests skipped on the mobile profile by design) |
| Drift checks | Both sides fail on a contract change, as they should |
| Real Django (prod settings) behind real `next start` | **Sign-in POST refused: "Origin checking failed"** → INT-1 |
| Proxy header probe | Client `X-Forwarded-For`/`X-Forwarded-Proto` pass through Next.js unchanged → KI-014 |
| GitHub Actions | All jobs green on `b2ed918` and `0e6c91d` |
| Secrets | History scan and gitleaks: only deliberate test values |

### 3.2 After the corrections (latest: `bcc4861`)

| Area | Command | Result |
|---|---|---|
| Backend lint/format | `ruff check .`, `ruff format --check .` | Pass |
| Migrations | `makemigrations --check --dry-run` | No changes |
| Backend tests | `coverage run -m pytest` | **272 passed** |
| Backend coverage | `coverage combine && coverage report` (branch coverage, CI minimum 85%) | **96%**; `prod.py` 99% (now measured in its subprocesses) |
| Frontend | lint, typecheck, `api:check`, `test:coverage` | Pass; **360 passed**; statements 98.2%, branches 93.5% |
| Frontend | `build`, `check:production`, Playwright | Pass; pass; **53 passed, 13 skipped** |
| Real stack | `tests/end-to-end/real-stack-smoke.sh` (Django prod settings behind `next start`) | **All 16 checks pass**; fails as it should when pointed straight at Django, with a wrong trusted origin, or with the `/_allauth` rewrite removed |
| Admin login burst | 30 simultaneous wrong passwords for one account, real Django | 5 checked, 25 refused (limit 5); before the fix, 26 got through |
| Phone rules | every 4-digit 1xxx/7xxx block × 3 formats, frontend vs backend (re-reviewer) | 18,000 inputs, **0 disagreements** |
| GitHub Actions on PR #2 | Backend CI, Frontend CI, Secret scan, **Real-stack CI** | **All green** on `be9f74b`, `dffd124` and `bcc4861` (pull-request and push runs) |

**Mutation checks** (a fix removed on purpose, to prove the tests notice):

| Mutation | Result |
|---|---|
| No admin attempt limit | 10 tests fail |
| No phone-number normalisation for the limit | 6 fail |
| A success also clears the IP counter | 1 fails |
| IP counter checked before the account counter | 1 fails |
| `auth/login` route not shadowed | fails |
| No MFA start-up gate | fails |
| `:443` accepted | fails |
| `prod.py` drops the trusted origin after validating it | the real-`prod.py` CSRF test fails |
| Contract constants changed in `frontend/src/api/csrf.ts` | 1 fails each |
| Frontend phone regex: old version, or any boundary widened or narrowed | 1–2 fail each (7 mutants) |

Reverting `prod.py` to its pre-review version does **not** fail the real-`prod.py` test. This is an equivalent mutant, because `base.py` also reads the same variable; the settings refusal tests catch it instead (re-reviewer agreed).

## 4. Verification of the ten required points

| # | Point | Verdict | Evidence |
|---|---|---|---|
| 1 | Approved stack | **Pass** | Matches ADR-0001/0009/0010/0011/0014; no Zustand, axios or SWR; no unapproved or duplicated dependency (ARC, CQ reviewers agree). Corrections add **no** dependency |
| 2 | Structure | **Pass with notes** | Ten Django apps; `src/pages`/`src/routes` gone. Empty skeleton folders remain in `frontend/src/` (CQ-2/ARC-11, Low) |
| 3 | Custom user model before migrations | **Pass** | `accounts.0001_initial` runs before allauth, admin and sessions (confirmed by two reviewers) |
| 4 | OpenAPI and type generation | **Pass** | Drift checks enforced on both sides. The allauth API, which is outside the OpenAPI contract, is now pinned too (QA-4) |
| 5 | Next.js rewrites vs Django | **Fail → fixed** | Paths match. Production CSRF fixed (INT-1); real-stack CI proves it. Proxy IP chain open (KI-014, deployment) |
| 6 | Tests execute | **Pass** | §3 |
| 7 | GitHub Actions checks | **Pass after fixes** | Path filters removed so every check reports on every PR; real-stack job added; coverage minimum; `main` runs never cancelled |
| 8 | No secrets | **Pass** | gitleaks green on every commit; reviewer and Architect scans |
| 9 | Security configuration | **Pass for development; not deployable** | Admin attempt limits; MFA start-up gate; stricter host/origin checks; password API routes closed. Deployment blockers: KI-007, KI-012–KI-015 |
| 10 | PROJECT_STATE accuracy | **Fail → fixed** | PROJECT_STATE, README, PROJECT_STATUS and other docs corrected (DOC-1, ARC-5, RR-9, RR-10) |

## 5. Findings

Severity is the reviewer's, checked by the Architect. "Fixed" means fixed on PR #2 and re-reviewed (§8).

### 5.1 Critical and High

| ID | Sev | Finding | Status |
|---|---|---|---|
| INT-1 / ARC-1 | High | Production CSRF failed for every sign-in POST through the rewrite | **Fixed** (`844783d`; tests strengthened in `be9f74b`) |
| BSEC-1 | High | Admin password login had no attempt limit (40 wrong, then success) | **Fixed** (limits + MFA start-up gate); MFA itself is Phase 5 (KI-007) |
| QA-2 | High | Path filters would block required checks forever | **Fixed** |
| QA-3 / ARC-6 / QA-1 (Architect) | High | No automated test of real Django behind real Next.js | **Fixed** (Real-stack CI) |
| QA-1 (testing) / GOV-1 | High | `main` has no branch protection; PR #1 merged before the gate | **Open: owner action** (§7, KI-020) |
| FSEC-1 / ARC-3 / API-2 / BSEC-3 / SEC-PROXY | High if deployed | Client forwarding headers pass through Next.js (rate-limit bypass or site-wide lock-out) | **Open: deployment blocker** (KI-014, Phase 8) |

### 5.2 Medium

| ID | Finding | Status |
|---|---|---|
| BSEC-2 | allauth `auth/login`, `auth/reauthenticate` accepted staff passwords | **Fixed** |
| ARC-2 / QA-12 | Rewrite-CSRF tests did not load the real `prod.py` | **Fixed** |
| ARC-4 | Server-rendered calls share one IP for throttling; http backend gives 301 | **Open → KI-022**, decide in the Phase 4 design |
| ARC-5 / DOC-1 | Stale statements in about nine documents | **Fixed** |
| QA-4 / API-5 | allauth API outside the contract drift check | **Fixed** (contract test + real-stack checks) |
| QA-5 / ARC-8 | No coverage minimum; `prod.py` not measured | **Fixed** |
| QA-6 / QA-3 (Architect) | Strategy promised Schemathesis on every push | **Fixed** in the strategy; Schemathesis deferred to Phase 4 (ADR-0014, confirmed) |
| API-3 | Frontend cannot parse allauth errors; allauth's 401 flow states treated as errors | **Open**, before the Phase 5 sign-in screens |
| API-4 | Frontend phone check accepted numbers the backend rejects | **Fixed** (0 disagreements) |
| API-6 | No real Django + Next CI job | **Fixed** (= QA-3) |
| FSEC-2 | CSP allows inline scripts | **Open** (KI-015, before the first sign-in screen) |
| CQ-1 | HSTS differs: frontend 1 year + subdomains, Django 1 hour | **Open**, decide with hosting (Phase 8) |
| RR-1 | Admin limit bypassed by spelling the phone number differently | **Fixed** |
| GOV-2 | ADR-0014 and D-046 awaiting confirmation | **Closed**: owner confirmed (D-052) |
| DOC-2 | Owner's local folder out of date | **Closed**: owner pulled (KI-021) |

### 5.3 Low and Info (summary)

- **Fixed:**
  - BSEC-4, BSEC-6, ARC-9, RR-3, RR-8: host and origin validation.
  - QA-8: never cancel `main` runs.
  - RR-2: burst race.
  - RR-4: smoke test proves the route through Next.js.
  - RR-5: phone boundary fixtures.
  - RR-6: workflow server start.
  - RR-9, RR-10, RR-13: docs.
  - RR-11: a success no longer resets the IP counter.
  - RR-12: account checked first.
  - RR-15: stale settings comment.
  - ARC-10: production variables listed in `.env.example`; a full deployment reference is Phase 8.
- **Open (accepted, tracked in `03_PENDING_WORK.md`):**
  - ARC-7: Swagger UI loops through the storefront in development; it is reachable on Django's own port.
  - CQ-2/ARC-11: empty skeleton folders.
  - Completion reports at the repository root.
  - QA-7: e2e runs on a build with the preview page enabled.
  - QA-9: Dependabot.
  - QA-10: PostgreSQL version target.
  - QA-11: no action needed.
  - FSEC-3 to FSEC-6, A11Y-1 to A11Y-4: Low frontend items for Phase 4 screens.
  - QA-1 (frontend): WebKit not tested (KI-016).
  - RR-7 and RR-14: anyone can lock an admin out for 15 minutes with 5 wrong guesses, and attempts refused by the IP limit still count against the account; accepted and documented.
  - CQ-3 to CQ-15: style and maintainability notes.
  - BSEC-5, BSEC-7 to BSEC-12: Low/Info backend notes.
  - API-1, API-7 to API-10: Info.
- **Already tracked:** KI-011, KI-012, KI-013, KI-017.

## 6. Corrections made (PR #2)

| Commit | Changes |
|---|---|
| `844783d` | INT-1: `DJANGO_CSRF_TRUSTED_ORIGINS` required in production; rewrite-CSRF tests; coverage in CI (85%); first PROJECT_STATE corrections |
| `be9f74b` | BSEC-1 admin attempt limits and MFA start-up gate (`DJANGO_ACCEPT_ADMIN_WITHOUT_MFA`); BSEC-2 route shadowing; BSEC-4/6 validation; real-`prod.py` CSRF test; PR path filters removed; Real-stack CI and smoke script; allauth contract test; branch and subprocess coverage; frontend phone ranges; stale docs |
| `dffd124` | Re-review fixes RR-1 to RR-6 and RR-9 |
| `bcc4861` | RR-11 to RR-13 (separate account and IP counters); owner confirmations (D-052); D-053, D-054, KI-022; PROJECT_STATE, CHANGELOG |

No new dependency was added. Nothing was committed to `main`.

## 7. Owner actions

1. **Review this report and PR #2**: https://github.com/shazzar0137/sokofresh-ecommerce/pull/2. If you are satisfied, merge it: on the PR page, click **Ready for review** (it is a draft), then **Merge pull request** → **Confirm merge**.
2. **After PR #2 is merged, protect `main`:**
   - GitHub → repository **Settings** → **Rules** → **Rulesets** → **New ruleset** → **New branch ruleset**.
   - **Ruleset name:** `main protection`; **Enforcement status:** Active.
   - **Target branches** → **Add target** → **Include default branch**.
   - Tick **Restrict deletions**, **Block force pushes**, and **Require a pull request before merging**. Set **Required approvals** to **0**, because GitHub does not let you approve your own PR.
   - Tick **Require status checks to pass** → **Add checks**, and add these eight: *Lint (ruff)*, *Tests (pytest + PostgreSQL)*, *Dependency audit (pip-audit)*, *Lint, types, contract, unit/component tests, build*, *End-to-end and accessibility (Playwright + axe)*, *Dependency audit (npm audit)*, *Secret scan (gitleaks)*, *Real stack (Django + Next.js)*.
   - Click **Create**.
3. **Do not deploy** (for example, the Vercel "Deploy project" email): KI-007 and KI-014 are open.
4. Before Phase 4: decide KI-011 and KI-013; KI-022 is decided with the Phase 4 design.

## 8. Independent re-review of the corrections

A fresh agent that did not write the fixes re-reviewed them adversarially, on its own copy and database.

| Round | Commit | Result |
|---|---|---|
| 1 | `be9f74b` (and `844783d`) | Items 2 to 9 Fixed. BSEC-1 Partly fixed: RR-1 (Medium, spelling bypass), RR-2 (burst race). Plus Low/Info RR-3 to RR-10. 257 backend and 349 frontend tests passed in its runs; real-stack smoke 13/13 |
| 2 | `dffd124` | RR-1 to RR-6 and RR-9 **Fixed**, each verified by its own probes: 5 guesses per account across 16 spellings and rotating IPs; burst {429: 25, 200: 5} three times; 18,000-input phone comparison with 0 disagreements; smoke fails without Next.js or without the rewrite. New: RR-11 (Low), RR-12 (Info), RR-13 (docs). 270 backend, 360 frontend tests passed |
| 3 | `bcc4861` | **No Critical, High or Medium.** RR-11, RR-12, RR-13 **Fixed**. RR-1 and RR-2 still hold: 5 guesses per account across spellings and IPs; burst gave 5 checked for one account and 10 for one IP. No way found to pass the account check and skip the IP check. Docs and state accurate. Two Info items: RR-14, accepted and documented; RR-15, a stale comment, fixed in the report commit. 272 backend tests, 96% coverage |

## 9. Outstanding risks

- `main` stays unprotected until the owner creates the ruleset (GOV-1). The same kind of early merge can happen again.
- Deployment blockers:
  - KI-007: admin MFA, Phase 5.
  - KI-014: proxy chain and client IP, Phase 8.
  - KI-015: CSP, before the sign-in screens.
  - KI-012: SMS cost abuse, before a real SMS provider.
  - KI-013: admin static files.
- KI-022 (server-rendered calls and throttling) must be designed before public catalogue pages ship.
- Not verified anywhere:
  - behaviour under a production WSGI server;
  - the real hosting proxy chain;
  - WebKit (iOS Safari).
