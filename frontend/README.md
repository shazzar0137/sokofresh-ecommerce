# Frontend

The SokoFresh customer storefront (and, later, the rider screens). Staff administration is Django admin, not this app (ADR-0008).

**Stack (approved, ADR-0001, 0009, 0011):** Next.js 16 App Router · React 19 · TypeScript 5.9 (strict) · Tailwind CSS v4 · shadcn/ui pattern on Radix (`radix-ui`) · TanStack Query · React Hook Form + Zod · openapi-fetch + openapi-typescript · MSW (development mocks) · Vitest + React Testing Library + axe-core · Playwright. Node.js 24 LTS, npm. **No Zustand:** the basket lives on the server (D-015).

**Status:** Phase 3 foundation. The storefront itself (catalogue, basket, checkout) is **not built yet**; see `../PHASE_3_FRONTEND_COMPLETION_REPORT.md`.

## Run it on Windows (first time)

1. Install **Node.js 24 LTS** from <https://nodejs.org> (the "LTS" button). Accept the defaults.
2. Open **PowerShell** and check: `node -v` should print `v24.…`.
3. Go to the frontend folder:
   `cd C:\Users\danie\OneDrive\Documents\sokofresh-ecommerce\frontend`
4. Install the exact package versions from the lockfile: `npm ci`
5. Copy the example settings: `Copy-Item .env.example .env.local`
6. Start the development server: `npm run dev`
7. Open <http://localhost:3000> in your browser. The component preview is at <http://localhost:3000/design-system>.

API calls go to the Django backend at `http://127.0.0.1:8000` (start it as described in `../backend/documentation/developer/GETTING_STARTED.md`). To work without the backend, open `.env.local` in a text editor, change `NEXT_PUBLIC_API_MOCKING=disabled` to `NEXT_PUBLIC_API_MOCKING=enabled`, save, and restart `npm run dev`. A yellow banner then says the page shows mock data.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build. Needs `BACKEND_ORIGIN` and `NEXT_PUBLIC_SITE_URL` (both in `.env.local` once you copied `.env.example`) |
| `npm run check:production` | After a build: proves the production configuration (no preview page, no mock code, JS budget) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types, then TypeScript check |
| `npm run api:types` | Regenerate `src/api/schema.d.ts` from `../shared/contracts/openapi.yaml` (after the backend changes the contract) |
| `npm run api:check` | Fail if `schema.d.ts` is out of date with the contract (runs in CI) |
| `npm test` | Unit, component, integration and accessibility tests (Vitest) |
| `npm run test:coverage` | The same, with a coverage report |
| `npm run test:e2e` | Playwright end-to-end tests (builds and starts the app itself). First run once: `npx playwright install chromium` |

## Folder map

| Path | Holds |
|---|---|
| `src/app/` | Routes (App Router), root layout, error/not-found/loading pages, fonts, global styles and design tokens (`globals.css`) |
| `src/components/ui/` | shadcn/ui-style primitives: Button, Input, Label, Badge, Skeleton |
| `src/components/{layout,navigation,common,forms,products}/` | Foundation components (header, footer, typography, states, form fields, product display) |
| `src/api/` | Generated contract types, typed client, error handling, CSRF, TanStack Query setup |
| `src/config/` | Environment handling, security headers, backend origin |
| `src/features/` | Feature logic (only `search/` so far) |
| `src/mocks/` | MSW handlers (development and tests only) |
| `src/utils/`, `src/lib/` | Money and phone helpers; `cn()` class helper |
| `tests/` | Vitest suites (`unit`, `component`, `integration`, `accessibility`) and Playwright (`e2e`) |
| `documentation/` | Architecture, design system, components, testing, security, quality reports |

Empty folders kept from the Phase 1 skeleton (`components/account`, `cart`, `checkout`, `orders`, `admin`, `features/*`, `hooks/`, `services/`, `state/`, `types/`, `accessibility/`, `constants/`) are reserved for later phases.

## Documentation

- Architecture and decisions: `documentation/architecture/FRONTEND_ARCHITECTURE.md` (current) and `FRONTEND_ANALYSIS_2026-11.md` (approved analysis)
- Design tokens: `documentation/design-system/DESIGN_TOKENS.md`
- Components: `documentation/components/COMPONENTS.md`
- Testing: `documentation/testing/TESTING.md`
- Security: `documentation/security/SECURITY.md`
- Review evidence: `documentation/quality/FRONTEND_REVIEW_REPORT.md`
