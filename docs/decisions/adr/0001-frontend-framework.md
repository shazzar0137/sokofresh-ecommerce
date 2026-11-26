# 0001. Frontend framework: Next.js with React and TypeScript

- Status: Accepted (2026-11-26); **amended by ADR-0011** (Zustand removed)
- Date: 2026-11-26
- Decided by: Project owner (Danny)

## Context
The storefront must load quickly on mid-range phones, be visible to search engines, and include basket, checkout, account and rider screens. JavaScript is already approved for the frontend.

## Options considered
- Next.js (React): server rendering, largest ecosystem, v16 Active LTS.
- React + Vite single-page app: simpler, but weaker SEO and first load.
- SvelteKit / Nuxt: fast, smaller ecosystems.
- Sub-decision: TypeScript vs plain JavaScript.

Evidence and sources: `../../research/TECHNOLOGY_RESEARCH_2026-11.md`.

## Decision
Next.js 16 (App Router) with React and **TypeScript** (owner chose TypeScript over plain JavaScript), Tailwind CSS, shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod. Tests: Vitest, React Testing Library, Playwright, axe-core.

## Consequences
- Must apply Next.js security releases promptly.
- `frontend/src/pages/` must be renamed at scaffold (KI-003).
- TypeScript adds a small learning step but enables generated API types.
