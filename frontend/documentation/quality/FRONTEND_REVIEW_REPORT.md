# Frontend Review Report: Phase 3 Foundations

_Date: 2026-11-27 · Branch `feature/phase-3-foundations` · Reviewed commits `5cb25b2`, `04cc057`, `cfaaaa3`; corrections in `bdc7011` and later._

## 1. Reviewers activated

All reviewers were Claude subagents that read the actual files and ran their own commands. None could edit the repository; each worked read-only or in a copy under `/tmp`.

| # | Area | Agent | Ran tests itself? |
|---|---|---|---|
| R1 | Architecture and code quality | `feature-dev:code-reviewer` | **No**: this agent had no shell. It read the source and the Next.js and openapi-fetch code, but executed nothing |
| R2 | Security (OWASP) | general-purpose (the `code-modernization:security-auditor` agent failed to load) | Yes: own production build, header and rewrite probes with a stub backend, Django URL resolution, `npm audit` |
| R3 | UI/UX, responsive design, accessibility | general-purpose | Yes: build, 259 Vitest + 44 Playwright tests, screenshots at 7 widths compared with the PDF, axe at 3 widths |
| R4 | Testing strategy and coverage | general-purpose | Yes: Vitest with coverage, Playwright, 35 Vitest mutants + 3 Playwright mutants, shuffled order, repeat-each |
| R5 | Performance and dependencies | `vercel:performance-optimizer` (local files only, no external calls) | Yes: own build, bytes per route over the wire, slow-4G/4× CPU lab runs, `npm ls/audit/outdated` |

Re-reviews of the corrections: R4 (testing), R2 (security), R3 (accessibility); see §5.

## 2. Areas and files inspected

All of `frontend/src` (app, api, components, config, features, lib, mocks, utils), `next.config.ts`, `package.json` and the lockfile, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `playwright.config.ts`, `frontend/tests/**`, `.github/workflows/frontend-ci.yml`, `.env.example`, `.gitignore`, the generated `src/api/schema.d.ts`, the design PDF, and on the backend side `config/settings/*.py`, `documentation/security/SECURITY.md` and `shared/documentation/CONTRACTS.md`.

## 3. Test evidence

| Run | Result |
|---|---|
| Before review (author): Vitest | 259 passed; coverage 96.4% lines |
| Before review (author): Playwright vs production build | 44 passed, 8 skipped by design |
| R3 / R4 independent runs | Same counts, 0 failures, 0 flaky over 3 repeats × 4 workers |
| R4 mutation testing (before fixes) | 35 Vitest mutants: 18 killed, 17 survived; 3 e2e mutants: 1 killed |
| After corrections (author, `bdc7011`): lint · typecheck · contract drift | Clean · clean · in sync |
| After corrections: Vitest with coverage | **342 passed** (25 files); statements 96.7%, branches 91%, lines 99%; per-folder thresholds met |
| After corrections: Playwright (CI mode, stub backend) | **51 passed**, 11 skipped by design (device-independent checks run once on desktop), 0 flaky |
| After corrections: `npm run check:production` | Passes on a real production build; **fails as intended** on a build with the test-only preview flag |
| `npm audit` | 0 vulnerabilities (699 packages) |

## 4. Findings and what was done

Severity as reported by the reviewer. **Fixed** = code or tests changed in `bdc7011` and verified by the runs above. **Recorded** = cannot be fixed in the frontend now; tracked in PROJECT_STATE.

### High

| ID | Finding | Outcome |
|---|---|---|
| SEC-1 (= ARCH-6) | The Next.js rewrite neither adds the client IP nor strips client-sent `X-Forwarded-For` / `X-Forwarded-Proto`, so Django's per-IP limits can be shared by all users or bypassed | **Recorded as KI-014, deployment blocker** (Backend + Phase 8 hosting). It depends on the production proxy topology. Backend SECURITY.md "cannot be spoofed" claim corrected; contract note F-8; frontend SECURITY.md |
| QA-1 | Production-only switches (no mock data, no preview page) were not protected by any test | **Fixed**: `tests/unit/production-switches.test.tsx` (NODE_ENV=production); `scripts/check-production-build.mjs` in CI (preview 404, worker 404, no banner, no MSW code, JS budget), proven to fail on a wrongly flagged build |

### Medium

| ID | Finding | Outcome |
|---|---|---|
| ARCH-1 | Non-RFC 9457 bodies (allauth, proxy pages) got misleading codes | **Fixed**: status-based fallback codes; allauth's own error format handled when sign-in is built (Phase 5) |
| ARCH-7, SEC-3 | HSTS silently missing when `NEXT_PUBLIC_SITE_URL` is unset | **Fixed**: `src/config/site-url.ts`; production builds require an https URL (local addresses allowed for test builds) |
| ARCH-9 | `formatKES` throwing at render would crash a page on one bad price | **Fixed**: `PriceDisplay` shows "Price unavailable"; the Phase 4 catalogue mapper must reject bad data |
| SEC-2 | CSP allows inline scripts | **Partly fixed**: `script-src-attr 'none'` blocks inline event handlers. Rest **recorded as KI-015** (decide SRI or route nonces before sign-in/checkout) |
| QA-2, QA-3 | CSRF tests compared the code with itself; the concurrency test could not fail | **Fixed**: literal contract values; deferred-promise test |
| QA-4 | A hung CSRF bootstrap froze every later write | **Fixed**: bootstrap timeout, failed attempt not cached; regression tests (unit + integration) |
| QA-6 | Same-origin rewrites were untested | **Fixed**: `next-config.test.ts`; Playwright `rewrites.spec.ts` with a stub backend |
| QA-7 | Security-header tests pinned only some directives | **Fixed**: exact literals in unit and e2e tests |
| QA-11 | No coverage thresholds | **Fixed**: global and per-folder thresholds in `vitest.config.mts` |
| A11Y-1 | Focus ring 2.8:1 on coloured panels | **Fixed**: `.surface-brand` / `.surface-accent` cream ring; contrast tested |
| A11Y-2 | Screen-reader old price lacked the currency | **Fixed**: "KES 30, was KES 50"; visual duplicate hidden from screen readers |
| A11Y-3 | Identical "Add" buttons, unnamed product articles | **Fixed** for the card (`aria-labelledby`); the add-to-basket control must name the product (Phase 5, pending work) |
| UX-1 | Card button 36 px, under the project's 44 px aim | **Fixed**: 44 px below `md`, design's 36 px from `md` |
| PERF-1 | JS budget nearly used before features exist | **Fixed/recorded**: budget defined (initial JS, gzip, excluding the legacy polyfill) and enforced in CI; now 145 KB of 170; KI-018 |

### Low (all addressed or recorded)

| IDs | Outcome |
|---|---|
| ARCH-2, QA-5 (server could send client-only codes) · ARCH-3 (body-read errors) · ARCH-5 (fetch init dropped) · ARCH-10 (needless `use client`) · SEC-4, QA-14 (MSW worker served) · PERF-2 (root error boundary +20 KB) · DEP-3 (Node version not enforced) · UX-2 (skip-link padding) · UX-3 (old price wrapping) · UX-4 (hero 3 lines) · UX-6 (repeated wording) · A11Y-4 (Tab order) · A11Y-5 (404 title) · A11Y-6 (Swahili `lang`) · QA-8 (boundary cases) · QA-9 (aliases, tile contrast) · QA-13 (flaky-test policy, server reuse, `networkidle`) | **Fixed** in `bdc7011` |
| ARCH-4 (browser client imported on the server), ARCH-8 (`argv` typegen check), ARCH-11 (mock mode blanks the page), ARCH-12 (small clean-ups), PERF-4 (`notFound()` on a static page), PERF-5 (single-weight font), PERF-6 (brotli at the edge), DEP-1 (form libraries ahead of use), QA-10 (visual regression), QA-12 (mobile project scope), SEC-7 (`__Host-` cookies), UX-5 (search box keeps `q`) | **Recorded**: Phase 4 frontend list in `03_PENDING_WORK.md`, KI-016, KI-017, or accepted as documented behaviour |

Informational items (SEC-5, SEC-6 path traversal verified safe, PERF-7, DEP-2, QA-15, QA-16) needed no change.

## 5. Re-review of the corrections

| Re-reviewer | Verdict | New items and what was done |
|---|---|---|
| R4 testing (ran 342 Vitest + 51 Playwright; re-applied mutants) | **QA-1 resolved.** 16 of 17 earlier surviving mutants now killed, all 7 new fix-targeted mutants and both e2e mutants killed | NEW-1 = R-1 below (fixed). NEW-2 banner matched by wording → stable `data-mock-banner` marker (fixed). NEW-3 unclear error when the server never starts → explicit failure (fixed). M10 credentials untested → test on the Request itself, mutant now killed (fixed). NEW-4 (422 wording) and NEW-5 (`--save`) checked: no change needed (`--save` leaves `package.json` unchanged; without it MSW prompts) |
| R2 security (own build and probes) | **SEC-2, SEC-3, SEC-4 fixed; SEC-1 record adequate for Phase 3** | R-1 (Low): percent-encoded paths (`/%6DockServiceWorker.js`) could still fetch the worker if the file was present → the production check now fails if the file exists and tests the encoded spellings; builds must come from a clean checkout (fixed). R-2, R-3: SECURITY.md and CONTRACTS.md notes completed (fixed) |
| R3 accessibility (axe at 3 widths: 0 violations) | 10 of 11 resolved | A11Y-6 partly fixed → `nameLang="sw"` on the Sukuma card and samples (fixed). **UX-7 (Medium, present since the first build):** on 320–360 px phones the price was squeezed under the "Add" button ("KES 1,2…"). Fixed with a wrapping price row; e2e test checks the price never overlaps the button and the button stays inside the card. **The test was mutation-checked:** without the fix it fails, with the fix it passes 3/3 (a first version measured before layout and passed falsely; corrected) |

Final runs after all corrections (2026-11-27): ESLint, TypeScript, contract drift clean; **Vitest 343 passed**; **Playwright 53 passed**, 13 skipped by design, 0 flaky (also 3 full repeats earlier: 159/159); production check passes (initial JS 144.8 KB gzip). GitHub Actions on commit `bdc7011` (first ever run): **Frontend CI, Backend CI and Secret scan all passed** (run 45930788058: 25 Vitest files, 51 Playwright passed, production check passed).

## 6. Outstanding risks

- **KI-014** (High if deployed): client-IP handling through the proxy. Deployment blocker.
- **KI-015** (Medium): CSP allows inline scripts until SRI or nonces are chosen.
- **KI-016**: no visual regression, WebKit or real-device/screen-reader checks yet.
- **KI-018**: JavaScript budget will tighten in Phase 4.
- None from CI: all three workflows passed on GitHub (2026-11-27).

## 7. Final status

**Milestone complete.** Implementation verified; tests executed locally and on GitHub Actions; build and type checks pass; five independent reviews and three re-reviews done; every High finding resolved (QA-1 fixed and re-verified; SEC-1 recorded as deployment blocker KI-014 and judged adequate by the security re-reviewer); all Medium findings fixed or recorded; lower-severity items documented in §4 and PROJECT_STATE. One limitation: the architecture reviewer (R1) could not run commands.
