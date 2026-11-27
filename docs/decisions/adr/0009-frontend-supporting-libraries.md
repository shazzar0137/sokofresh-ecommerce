# 0009. Frontend supporting libraries

- Status: Accepted (2026-11-26); see ADR-0011 (Zustand from ADR-0001 removed)
- Date: 2026-11-26
- Decided by: Project owner (Danny)

## Context
ADR-0001 fixed the main frontend stack (Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod, Vitest, React Testing Library, Playwright, axe-core). Several smaller frontend choices were still open. They were compared in `frontend/documentation/architecture/FRONTEND_ANALYSIS_2026-11.md` §7.

## Options considered
See the analysis §7 for each option, with reasons.

## Decision
| Need | Choice |
|---|---|
| Typed API client | `openapi-fetch` (types from openapi-typescript, ADR-0004); `openapi-react-query` only if it simplifies hooks |
| API mocks during development | MSW (Mock Service Worker), typed from the contract, visibly labelled, never active in production builds |
| Icons | Lucide (`lucide-react`) |
| Toasts | Sonner (shadcn/ui default) |
| Fonts | `next/font`, self-hosted; typefaces from the design reference, licence checked |
| Images | `next/image`; image loader decided with hosting (ADR-0007) |
| Kenyan phone validation | Custom Zod normaliser (`07…`, `01…`, `+254…`, `254…`); backend remains authoritative |
| Visual regression | Playwright `toHaveScreenshot()`, baselines generated in CI |
| Component workshop | Storybook deferred; reassess at about 10 design-system components |
| Translations (Swahili UI) | Library deferred to Phase 10; `lang` attributes used now |
| Analytics | **Vercel Analytics remains the candidate for now** (owner, 2026-11-27). Not installed yet: it only works when the site is hosted on Vercel (ADR-0007 Option B; the preferred Option A is Railway), and it needs a privacy check (Kenya DPA) before it is switched on |
| Package manager | npm |

Not adopted: other UI kits (MUI, Chakra), Redux, CSS-in-JS, hosted search.

## Consequences
- Every package is installed only at Phase 3 scaffold, with the exact versions checked then.
- Mocks must be removed endpoint by endpoint as the backend delivers each endpoint.
- Hosted visual-testing, Storybook, i18n and analytics may be added later through new ADRs.
