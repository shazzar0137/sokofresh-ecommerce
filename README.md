# SokoFresh

SokoFresh is a Kenyan online grocery marketplace. Customers will order fresh produce and groceries from named farms and suppliers, pay with M-Pesa, and receive same-day delivery.

> **Current phase: Phase 3 (Foundations).** The backend and frontend foundations are on `main` (PR #1, merged 2026-11-27). The Phase 3 integration review is complete and its corrections are merged (PR #2, 2026-11-27); Phase 4 (catalogue) waits for the owner's go-ahead. See `docs/reviews/PHASE_3_INDEPENDENT_REVIEW.md`.
> Approved stack: Next.js 16 + TypeScript frontend, Django 6 + DRF backend, PostgreSQL (Neon), Django admin for staff. See `docs/architecture/SYSTEM_ARCHITECTURE.md`. There are no customer-facing features yet (storefront features start in Phase 4).

## Repository layout

This is a monorepo: one repository holding several separate parts of one product.

| Directory | Purpose |
|---|---|
| `frontend/` | Customer storefront (Next.js 16, TypeScript) |
| `backend/` | Business logic, APIs, data access, integrations and the Django admin for staff (Django 6, DRF, Python 3.13) |
| `shared/` | Contracts and schemas that both frontend and backend agree on |
| `security/` | Security design work: threat model, controls, checklists |
| `tests/` | Cross-application tests (system, end-to-end, acceptance, load) |
| `infrastructure/` | Environments, deployment, monitoring and backup plans |
| `docs/` | Requirements, architecture, decisions (ADRs) and guides |
| `assets/` | Design references, branding, images, icons, fonts |
| `scripts/`, `tools/` | Project automation and developer tools (empty for now) |
| `logs/` | Local runtime logs (contents are git-ignored) |
| `PROJECT_STATE/` | Continuity record for every work session; read this first |

## Architecture boundaries

- **Frontend and backend are separate applications.** They communicate only through documented API contracts.
- **`shared/` holds the agreements.** Any data structure both sides depend on is defined here, not duplicated.
- **Backend is a modular monolith,** not microservices: 10 Django apps (`core`, `accounts`, `catalogue`, `inventory`, `basket`, `orders`, `payments`, `delivery`, `notifications`, `store`), created at the Phase 3 scaffold (ADR-0011).
- **Application tests stay with their application** (`frontend/tests/`, `backend/tests/`). Tests that span both live in the root `tests/`.

## Navigating the documentation

1. Start with `PROJECT_STATE/00_HANDOVER.md`.
2. `PROJECT_STATE/05_DOCUMENT_INDEX.md` lists every document with its path.
3. `TECHNOLOGY_DECISIONS_PENDING.md` lists the technology choices still open.
4. Architectural decisions are recorded in `docs/decisions/adr/`.
5. The original design is in `assets/design-references/`. Notes on it are in `docs/research/DESIGN_REFERENCE_NOTES.md`.
