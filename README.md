# SokoFresh

SokoFresh is a Kenyan online grocery marketplace. Customers will order fresh produce and groceries from named farms and suppliers, pay with M-Pesa, and receive same-day delivery.

> **Current phase: Phase 2 complete (architecture approved 2026-11-26); Phase 3 (Foundations) awaiting the owner's go-ahead.**
> Approved stack: Next.js 16 + TypeScript frontend, Django 6 + DRF backend, PostgreSQL (Neon), Django admin for staff. See `docs/architecture/SYSTEM_ARCHITECTURE.md`. No application code exists yet.

## Repository layout

This is a monorepo: one repository holding several separate parts of one product.

| Directory | Purpose |
|---|---|
| `frontend/` | Customer storefront and admin dashboard (JavaScript; framework not yet chosen) |
| `backend/` | Business logic, APIs, data access and integrations (language not yet chosen) |
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
