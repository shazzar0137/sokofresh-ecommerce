# 05 Document Index

Paths are relative to the project root. Update this index whenever a document is added, moved or retired.

## Start here
| Document | Purpose |
|---|---|
| `PROJECT_STATE/00_HANDOVER.md` | Project summary, continuity rule, next action |
| `PROJECT_STATE/01_CURRENT_STATE.md` | Verified current status |
| `PROJECT_STATE/02_DECISIONS_AND_CHANGES.md` | Approved decisions |
| `PROJECT_STATE/03_PENDING_WORK.md` | Future work by area |
| `PROJECT_STATE/04_KNOWN_ISSUES.md` | Issue register |
| `PROJECT_STATE/05_DOCUMENT_INDEX.md` | This index |

## Root
| Document | Purpose |
|---|---|
| `README.md` | Project overview, structure, boundaries |
| `PROJECT_STATUS.md` | One-screen status summary |
| `CONTRIBUTING.md` | How to work on the project |
| `SECURITY.md` | Security policy |
| `CHANGELOG.md` | Change history |
| `TECHNOLOGY_DECISIONS_PENDING.md` | Open technology choices |
| `PHASE_1_COMPLETION_REPORT.md` | Phase 1 verification results and directory tree |
| `PHASE_3_BACKEND_COMPLETION_REPORT.md` | Phase 3 backend: what was built, dependencies, tests run, security, CI, commits, owner push steps, outstanding issues |

## Planning and guides
| Document | Purpose |
|---|---|
| `docs/README.md` | Map of the `docs/` folders |
| `docs/decisions/adr/README.md` | How ADRs are written, plus template |
| `docs/testing/TESTING_STRATEGY.md` | Approved project-wide testing strategy |
| `docs/testing/TESTING_STRATEGY_OUTLINE.md` | Earlier outline (superseded) |
| `docs/security/SECURITY_PLANNING_OUTLINE.md` | Security planning outline |
| `docs/research/DESIGN_REFERENCE_NOTES.md` | Summary of the three design pages |
| `docs/research/TECHNOLOGY_RESEARCH_2026-11.md` | Phase 2 technology research with sources |
| `docs/business-requirements/PRODUCT_CATEGORIES.md` | Product categories register and planned products (owner maintains) |
| `docs/requirements/REQUIREMENTS_BASELINE.md` | Requirements v0.3 with owner answers |
| `docs/architecture/SYSTEM_ARCHITECTURE.md` | **Current approved architecture** |
| `docs/architecture/TECHNICAL_ARCHITECTURE_PROPOSAL_2026-11.md` | Consolidated technical architecture proposal reconciling frontend and backend research (Approved 2026-11-26; decision record) |
| `docs/IMPLEMENTATION_ROADMAP.md` | Approved phased roadmap and cost estimate |
| `backend/README.md` | Backend overview, layout, quick start |
| `backend/documentation/developer/GETTING_STARTED.md` | Beginner setup on Windows: uv, PostgreSQL/Neon, `.env`, migrate, run, tests |
| `backend/documentation/api/API.md` | API conventions as implemented, error format, endpoints, sign-in flow, contract regeneration |
| `backend/documentation/database/DATABASE.md` | Database configuration, tables, custom user model, migrations |
| `backend/documentation/security/SECURITY.md` | Backend security controls with their tests, and known gaps |
| `backend/documentation/quality/BACKEND_REVIEW_REPORT.md` | Independent post-implementation review of the Phase 3 backend: agents, findings, tests, coverage, corrections, outstanding issues, assessment |
| `shared/documentation/CONTRACTS.md` | How the generated OpenAPI contract is shared; points F-1 to F-6 for the Frontend |
| `shared/contracts/openapi.yaml` | Generated API contract (never edit by hand) |
| `shared/test-fixtures/phone-numbers.json` | Shared phone-number test cases |
| `.github/workflows/backend-ci.yml` | Backend CI: lint, tests + PostgreSQL, pip-audit |
| `.github/workflows/secret-scan.yml`, `.gitleaks.toml` | Secret scan (gitleaks) on every push, with allow list for fictional test values |
| `backend/documentation/architecture/BACKEND_ANALYSIS_2026-11.md` | Backend analysis: modules, domain model, database rules, API inventory, payments, libraries, decisions requested (Accepted with amendments 2026-11-26) |
| `frontend/documentation/architecture/FRONTEND_ANALYSIS_2026-11.md` | Frontend analysis: requirements, routes, components, design system, responsive, accessibility, library choices, design issues, sequence (Accepted 2026-11-26, amended) |

## Architecture Decision Records (all Accepted; see `docs/decisions/adr/README.md`)
`docs/decisions/adr/0001` to `0014`: frontend, backend, database, API, authentication, payments, hosting, admin, frontend libraries, backend libraries, architecture amendments, payments at launch, maps and location, backend foundation choices

## Area READMEs
`frontend/README.md`, `frontend/src/features/README.md`, `backend/README.md`, `shared/README.md`, `security/README.md`, `tests/README.md`, `infrastructure/README.md`, `assets/README.md`, `scripts/README.md`, `tools/README.md`, `logs/README.md`

## Reference materials
| Item | Location |
|---|---|
| Original design PDF (desktop, mobile, cart) | `assets/design-references/Soko Fresh – Kenyan grocery store.pdf` (in repo; KI-002 resolved) |
| Figma source file | `assets/design-references/Soko Fresh – Kenyan grocery store.fig` |
| Original source folder (outside project, unchanged) | `C:\Users\danie\Downloads\Jackie Website files\` (PDF and `.fig` Figma file) |
