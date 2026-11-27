# Frontend Testing

_Updated 2026-11-27. Strategy (authority): `docs/testing/TESTING_STRATEGY.md`. Results of each run are reported in `documentation/quality/FRONTEND_REVIEW_REPORT.md` and the phase completion report, never assumed._

## Layers

| Layer | Tool | Location | Runs against |
|---|---|---|---|
| Unit | Vitest | `tests/unit/` | Functions: money, phone normaliser (shared fixtures), backend origin, CSP/headers, CSRF, error parsing, retry policy, `cn()`, colour-token contrast |
| Component | Vitest + React Testing Library (jsdom) | `tests/component/` | Components and pages, including React Hook Form + Zod with the form fields |
| Integration | Vitest + MSW | `tests/integration/` | The real API client over intercepted HTTP: problem details, proxy HTML errors, network failure, timeout, cancellation, CSRF bootstrap; TanStack Query with UI states |
| Accessibility (fast) | axe-core in jsdom | `tests/accessibility/` | WCAG 2.2 A/AA rules except colour contrast (needs a real browser) |
| Contract | openapi-typescript `--check` | `npm run api:check` | `src/api/schema.d.ts` vs `shared/contracts/openapi.yaml` |
| End-to-end | Playwright | `tests/e2e/` | A **production build** (`next build && next start`): navigation, fonts, safe search rendering, security headers, no third-party requests |
| Accessibility (real browser) | @axe-core/playwright | `tests/e2e/accessibility.spec.ts` | Every page incl. colour contrast; one h1 and one main; 24 px targets; reflow at 320 px |
| Responsive | Playwright | `tests/e2e/responsive.spec.ts` | 360, 390, 768, 1024, 1280, 1440 px: no horizontal scroll, header arrangement, 20/80 px margins, 2/3/5-column grid, 72/44 px hero |

Shared fixtures: `shared/test-fixtures/phone-numbers.json` (also used by the backend). Any request without an MSW handler fails a Vitest test (`onUnhandledFrame: "error"`), so no test touches a real network.

## Running

```powershell
cd C:\Users\danie\OneDrive\Documents\sokofresh-ecommerce\frontend
npm test                    # Vitest suites
npm run test:coverage       # with coverage
npx playwright install chromium   # once
npm run test:e2e            # builds, starts on port 3100, runs Playwright
```

Playwright reuses a server already running on port 3100 when not in CI; stop old servers first if results look stale. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can point at an installed Chromium on machines that cannot download browsers.

## CI

`.github/workflows/frontend-ci.yml`: lint, type check, contract drift check, Vitest with coverage, production build, `npm audit --audit-level=high`, then Playwright (Chromium, desktop and Pixel 7 projects). A failing Playwright run uploads its HTML report.

## Not yet in place

- **Visual regression** baselines (`toHaveScreenshot`): to be generated in CI only (strategy), once real storefront screens exist in Phase 4.
- **WebKit (iOS Safari)** project: Chromium only for now.
- **Manual checks before launch:** keyboard-only purchase flow, TalkBack and VoiceOver, 200% text zoom, a real mid-range Android over 4G.
