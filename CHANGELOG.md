# Changelog

All notable changes to this project are recorded here. Newest entries first.

## [Phase 3 backend foundations] - 2026-11-26 (branch `feature/phase-3-foundations`)

### Added
- Django 6.1.3 backend with uv (Python 3.13): settings split, ten apps, phone-based custom user model and role groups, allauth headless phone-code sign-in foundation, RFC 9457 errors, `GET /api/v1/health`, outbound-HTTP allow list, log redaction.
- Generated OpenAPI contract `shared/contracts/openapi.yaml` with drift check; shared phone-number fixtures.
- 89 backend tests (all passing on PostgreSQL); backend CI workflow (lint, tests, pip-audit, gitleaks).
- ADR-0014; backend developer guide, API, database and security docs; `shared/documentation/CONTRACTS.md`; `PHASE_3_BACKEND_COMPLETION_REPORT.md`.

### Removed
- Empty `backend/src/` layer folders (ADR-0011 item 4).

### Notes
- Branch not yet on GitHub (KI-005): delivered as `tmp/phase-3-foundations.bundle` for the owner to push.

## [Phase 2 follow-up] - 2026-11-26 (owner answers, Google Maps)

### Added
- ADR-0013: Google Maps Platform (Places Autocomplete + confirmed pin, Geocoding, Routes, Maps URLs); fast delivery = 42 km radius from a configurable dispatch point.
- Frontend amendments A-11 to A-14; backend amendments B-12 to B-16 (GeoService, location fields, DeliveryPartner, `/delivery/quote`).
- Requirements v0.3: FR-54 (map address capture), FR-52 delivery partner riders, answers Q1/Q4/Q7/Q8.

### Changed
- System architecture, roadmap, testing strategy, security outline, research addendum, technology list and PROJECT_STATE updated.

### Removed
- Empty folders `frontend/public/assets/` and `tests/stress/` (KI-001 resolved).

## [Phase 2 complete] - 2026-11-26 (architecture approval)

### Added
- `docs/architecture/TECHNICAL_ARCHITECTURE_PROPOSAL_2026-11.md` (approved), ADR-0010, ADR-0011, ADR-0012, `docs/testing/TESTING_STRATEGY.md`, research addendum (Pochi la Biashara, Pesapal, hosting terms).

### Changed
- ADR-0005 accepted; ADR-0007 accepted as revised; ADR-0001 and 0004 amended by 0011; ADR-0006 amended by 0012.
- `SYSTEM_ARCHITECTURE.md` and `IMPLEMENTATION_ROADMAP.md` rewritten as approved baselines.
- Requirements v0.2: owner answers; FR-25 merged into FR-40; FR-30/31/32/61 updated; new FR-35 (payment-timing switch).
- Frontend analysis amendments A-1 to A-10; backend analysis accepted with amendments B-1 to B-11.
- Root, frontend, backend and shared READMEs updated; testing and security outlines point to the approved documents.
- PROJECT_STATE synchronised; KI-002 text corrected; KI-004 added (Pochi has no API).

## [Phase 2, earlier] - 2026-11-26

### Added
- `docs/research/TECHNOLOGY_RESEARCH_2026-11.md`: technology research with sources.
- `docs/requirements/REQUIREMENTS_BASELINE.md`: draft functional and non-functional requirements.
- `docs/architecture/SYSTEM_ARCHITECTURE.md`: proposed architecture.
- `docs/IMPLEMENTATION_ROADMAP.md`: proposed phased roadmap.
- ADR-0001 to ADR-0008 (status: Proposed).
- `frontend/documentation/architecture/FRONTEND_ANALYSIS_2026-11.md`: frontend first-assignment analysis (Proposed).
- `backend/documentation/architecture/BACKEND_ANALYSIS_2026-11.md`: backend first-assignment analysis (Proposed).

### Decided
- Accepted: ADR-0001 (Next.js + React + TypeScript), ADR-0002 (Django + DRF), ADR-0003 (PostgreSQL), ADR-0004 (REST + OpenAPI), ADR-0008 (Django admin first).
- Accepted with modifications: ADR-0006 (Daraja sandbox now; production provider deferred).
- Accepted: ADR-0009 (frontend supporting libraries) and the frontend analysis; server-side basket for all visitors; one placeholder testimonial, to be deleted before launch.
- Decided: delivery promise (fast zones + slot zones); new Beverages (Vinywaji) category.
- Added `docs/business-requirements/PRODUCT_CATEGORIES.md` (category and product register); FR-01 and FR-50 updated.
- Still proposed: ADR-0005, ADR-0007.

### Notes
- No application code created.
- KI-002 resolved: design PDF and Figma file now in `assets/design-references/`.

## [Phase 1] - 2026-11-26

### Added
- Monorepo directory structure: `frontend/`, `backend/`, `shared/`, `security/`, `tests/`, `infrastructure/`, `docs/`, `assets/`, `scripts/`, `tools/`, `logs/`, `PROJECT_STATE/`.
- Root documentation, `PROJECT_STATE/` continuity files, ADR guide, testing strategy outline, security planning outline and design reference notes.
- Repository hygiene files: `.gitignore`, `.editorconfig`, `.gitattributes`.

### Notes
- No application code, dependencies or framework configuration were created.
- An empty directory skeleton already existed at this path (created 2026-11-20). It was kept as found and completed.
