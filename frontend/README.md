# Frontend

The customer storefront and the admin dashboard. **Approved:** Next.js 16 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query (ADR-0001, 0009, 0011). Node.js 24 LTS.

| Path | Holds |
|---|---|
| `public/` | Static files served as-is (images, icons, fonts) |
| `src/app/` | Application entry point and top-level setup |
| `src/components/` | Reusable UI pieces, grouped by area (common, layout, products, cart...) |
| `src/pages/` | One folder per screen (home, shop, product-details, checkout...) |
| `src/features/` | Feature logic that is not UI: catalogue, cart, checkout, payments... |
| `src/api/` | Code that calls the backend; must follow `shared/contracts/` |
| `src/services/`, `hooks/`, `state/`, `routes/` | App-wide logic, state and navigation |
| `src/utils/`, `constants/`, `config/`, `types/` | Helpers and settings |
| `src/styles/`, `src/accessibility/` | Design tokens, global styles, accessibility helpers |
| `tests/` | Frontend-only tests (unit, component, e2e, visual regression...) |
| `documentation/` | Frontend architecture, component and design-system notes |

This layout is provisional. Once a framework is chosen, it may expect different folder names; adjust then and record the change in an ADR.

Visual reference: `../assets/design-references/` and `../docs/research/DESIGN_REFERENCE_NOTES.md`.

## Approved changes at scaffold (KI-003, ADR-0011)
Remove `src/pages/` and `src/routes/` (the App Router in `src/app/` replaces both); add `src/components/ui/` and `src/components/rider/`. No Zustand: basket state comes from the server. Design: `documentation/architecture/FRONTEND_ANALYSIS_2026-11.md`.

Maps (ADR-0013): `@vis.gl/react-google-maps` for the address picker and pin, loaded only on checkout, address and rider screens.
