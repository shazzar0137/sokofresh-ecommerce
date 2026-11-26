# Architecture Decision Records (ADRs)

An ADR is a short document that records one significant decision: what was decided, why, and what alternatives were rejected. It lets future contributors understand *why* the project looks the way it does.

## When to write one

Write an ADR for any decision that is hard to reverse or affects several parts of the system, for example choosing the frontend framework, backend language, database, payment approach or hosting.

## How

1. Copy the template below into a new file: `NNNN-short-title.md` (e.g. `0001-frontend-framework.md`), numbered in order.
2. Set status to **Proposed** while it is being discussed.
3. The project owner approves it; change status to **Accepted** and add the date.
4. Never delete or rewrite an accepted ADR. If a decision changes, write a new ADR and mark the old one **Superseded by NNNN**.
5. Add a line to `PROJECT_STATE/02_DECISIONS_AND_CHANGES.md` and `05_DOCUMENT_INDEX.md`.

## Template

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Rejected | Superseded by NNNN
- Date: YYYY-MM-DD
- Decided by:

## Context
What problem or need prompts this decision?

## Options considered
For each option: benefits, limitations, cost/free tier, security, learning curve, lock-in.

## Decision
What was chosen.

## Consequences
What becomes easier, what becomes harder, and any follow-up work.
```

## Records

| ADR | Title | Status |
|---|---|---|
| [0001](0001-frontend-framework.md) | Frontend: Next.js + React + TypeScript | Accepted 2026-11-26; amended by 0011 |
| [0002](0002-backend-framework.md) | Backend: Python + Django + DRF | Accepted 2026-11-26 |
| [0003](0003-database.md) | Database: PostgreSQL | Accepted 2026-11-26 |
| [0004](0004-api-and-contracts.md) | REST + generated OpenAPI contracts | Accepted 2026-11-26; amended by 0011 |
| [0005](0005-authentication.md) | django-allauth headless, phone OTP | Accepted 2026-11-26 |
| [0006](0006-payments.md) | Payments behind a gateway interface | Accepted with modifications; amended by 0012 |
| [0007](0007-hosting-and-services.md) | Hosting and supporting services | Accepted as revised 2026-11-26 |
| [0008](0008-admin-interface.md) | Django admin first for staff | Accepted 2026-11-26 |
| [0009](0009-frontend-supporting-libraries.md) | Frontend supporting libraries | Accepted 2026-11-26 |
| [0010](0010-backend-supporting-libraries.md) | Backend supporting libraries | Accepted 2026-11-26 |
| [0011](0011-consolidated-architecture-review.md) | Consolidated architecture review: amendments | Accepted 2026-11-26 |
| [0012](0012-payments-at-launch.md) | Pochi la Biashara at launch; Daraja sandbox; Pesapal future | Accepted 2026-11-26 |
| [0013](0013-maps-and-location.md) | Maps and location: Google Maps Platform, fast-delivery radius | Accepted 2026-11-26 |

Phase 1 decisions are recorded in `PROJECT_STATE/02_DECISIONS_AND_CHANGES.md`.

Note: on Windows this folder appears as `adr` (lowercase). It existed before Phase 1 and satisfies the planned `docs/decisions/ADR/` path, because Windows folder names are case-insensitive.
