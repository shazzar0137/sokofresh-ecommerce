# 01 Current State

_Last verified: 2026-11-27 (Phase 3 backend after independent review)_

## Verified on disk

| Item | State |
|---|---|
| Project path | `C:\Users\danie\OneDrive\Documents\sokofresh-ecommerce` |
| Directory structure | All 182 Phase 1 directories exist; the two unspecified pre-existing folders were removed (KI-001 resolved) |
| Design reference | `assets/design-references/`: PDF (3,389,791 bytes) and `.fig` file |
| Requirements | `docs/requirements/REQUIREMENTS_BASELINE.md` v0.3 (owner answers recorded) |
| Architecture | `docs/architecture/SYSTEM_ARCHITECTURE.md` (approved baseline); `TECHNICAL_ARCHITECTURE_PROPOSAL_2026-11.md` (approved decision record) |
| ADRs | 0001–0013: all Accepted (0001, 0004 amended by 0011; 0006 amended by 0012; 0007 accepted as revised) |
| Frontend design | `frontend/documentation/architecture/FRONTEND_ANALYSIS_2026-11.md` (accepted, amendments A-1 to A-14) |
| Backend design | `backend/documentation/architecture/BACKEND_ANALYSIS_2026-11.md` (accepted, amendments B-1 to B-16) |
| Testing | `docs/testing/TESTING_STRATEGY.md` (approved) |
| Roadmap | `docs/IMPLEMENTATION_ROADMAP.md` (approved) |
| Git | Local repo: `main` = `origin/main` = `965e047` (verified by reading `.git`). Branch `feature/phase-3-foundations` exists in the Claude workspace and as `tmp/phase-3-foundations.bundle` in the project folder; **not yet on GitHub** (KI-005) |

## Verified on branch `feature/phase-3-foundations` (not yet merged)

| Item | State |
|---|---|
| Backend project | `backend/`: uv (Python 3.13), Django 6.1.3, DRF 3.18.3, drf-spectacular 0.30.0, allauth 65.23.0, django-tasks-db 0.13.0; `config/settings/{base,dev,test,prod}.py` |
| Apps | Ten apps in `backend/apps/`; code in `core`, `accounts`, `notifications` only |
| Custom user model | `accounts.User` (phone login, E.164 CHECK, optional unique email); migrations `accounts.0001`, `0002` (role groups) |
| Sign-in | allauth headless phone + code for existing **customer** accounts; sign-up closed; staff refused code sign-in; admin requires password sign-in on the admin page; unused allauth routes shadowed; SMS: console (dev), in-memory (tests), refusing (prod) |
| API | `GET /api/v1/health`; RFC 9457 errors; contract `shared/contracts/openapi.yaml` generated, drift-checked |
| Tests | **211** pytest tests, **all passing** on PostgreSQL 16.15 (2026-11-27), also in random order and in parallel; coverage 94% (incl. subprocess-run production settings); ruff clean; pip-audit: no known vulnerabilities |
| Independent review | Done 2026-11-27: `backend/documentation/quality/BACKEND_REVIEW_REPORT.md`. All High findings fixed and re-reviewed; 4 Medium items open (KI-011, KI-012, KI-013, API-4) |
| CI | `.github/workflows/backend-ci.yml` and `secret-scan.yml` written; **not yet run on GitHub** |
| Docs | backend README, developer guide, API, database, security docs; ADR-0014; `PHASE_3_BACKEND_COMPLETION_REPORT.md` |

## Not implemented (nothing below exists)

- On `main`: no application code yet (the backend foundation is on the unmerged branch).
- Frontend application, package manifest or tests (Frontend conversation).
- Business models and endpoints (catalogue, inventory, basket, orders, payments, delivery): Phase 4 onward.
- Real SMS provider, account creation at checkout, staff MFA (Phase 5).
- Any hosting, Neon database, or third-party account set up by Claude.

## Pre-existing content

Before Phase 1, an empty directory skeleton (90 directories, no files, dated 2026-11-20) existed at this path and was kept; its two folders outside the specification were removed on 2026-11-26 at the owner's request (KI-001).
