# Backend

Business logic, APIs, database access and third-party integrations (M-Pesa, notifications, delivery). **Approved:** Python 3.13, Django 6.x + Django REST Framework, PostgreSQL (ADR-0002, 0003, 0010, 0011).

## Structure

| Path | Holds |
|---|---|
| `src/domain/` | Core business rules and concepts, independent of frameworks and databases |
| `src/application/` | Use cases that coordinate domain logic (e.g. "place order") |
| `src/modules/` | One folder per business area; see `src/modules/README.md` |
| `src/api/` | HTTP layer: routes, controllers, middleware, validators, serializers, contracts |
| `src/services/`, `src/repositories/` | Shared services and data-access code |
| `src/database/` | Migrations, seed data, schemas and queries |
| `src/integrations/` | Adapters for payments, notifications, delivery and other external services |
| `src/security/`, `config/`, `logging/`, `monitoring/`, `utils/` | Cross-cutting concerns |
| `tests/` | Backend-only tests (unit, integration, API, contract, security, performance) |
| `documentation/` | Backend architecture, API, database and integration notes |

## Design intent

A **modular monolith**: one deployable application split into well-separated modules. This keeps things simple to run and learn, while allowing a module to be extracted later if a real need appears.

## Approved change to this layout (ADR-0011)
At the Phase 3 scaffold the backend becomes **10 Django apps** (core, accounts, catalogue, inventory, basket, orders, payments, delivery, notifications, store), each with `models.py`, `services.py`, `api/`, `admin.py`, `tasks.py` where needed and `tests/`. The `domain/`, `application/`, `services/` and `repositories/` folders above are then removed (with approval at scaffold). Design: `documentation/architecture/BACKEND_ANALYSIS_2026-11.md`.

Maps (ADR-0013): `GeoService` in the `delivery` app calls Google Geocoding and Routes with a server key from environment variables.
