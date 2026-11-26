# 0002. Backend: Python, Django and Django REST Framework

- Status: Accepted (2026-11-26)
- Date: 2026-11-26
- Decided by: Project owner (Danny)

## Context
The backend owns stock, orders, payments, delivery and administration, and must be secure by default with minimal custom infrastructure.

## Options considered
- Django + DRF: built-in admin, auth, ORM, migrations, strong security defaults.
- Node.js + NestJS: single language, but more assembly and custom security work.
- Backend-as-a-service: fast start, scattered business logic, lock-in.

Evidence and sources: `../../research/TECHNOLOGY_RESEARCH_2026-11.md`.

## Decision
Python 3.13+, latest Django 6.x, Django REST Framework, drf-spectacular for OpenAPI, Django Tasks with django-tasks-db for background jobs, pytest + pytest-django for tests.

## Consequences
- Two languages in the project; mitigated by generated contracts (ADR-0004).
- Annual Django upgrades planned (6.1 security support ends Dec 2027).
- Background worker process needed in hosting.
