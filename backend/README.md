# Backend

The SokoFresh API and staff admin: **Python 3.13, Django 6.1, Django REST Framework, PostgreSQL** (ADR-0002, 0003), organised as one modular monolith with ten Django apps (ADR-0011).

Status: **Phase 3 foundations** (2026-11-26). The project, settings, custom user model, phone sign-in foundation, error format, health endpoint, OpenAPI contract, tests and CI exist. Business features (catalogue, basket, orders, payments, delivery) start in Phase 4. See `../PHASE_3_BACKEND_COMPLETION_REPORT.md`.

## Quick start

Full beginner steps for Windows: [`documentation/developer/GETTING_STARTED.md`](documentation/developer/GETTING_STARTED.md).

```bash
cd backend
uv sync                                   # install the exact locked dependencies
copy .env.example .env                    # Windows (macOS/Linux: cp); then edit DATABASE_URL
uv run python manage.py migrate
uv run python manage.py createcachetable
uv run python manage.py runserver         # http://127.0.0.1:8000/api/v1/health
uv run pytest                             # all tests (needs PostgreSQL)
```

## Layout

| Path | Holds |
|---|---|
| `pyproject.toml`, `uv.lock`, `.python-version` | Dependencies (locked by uv) and tool settings (pytest, ruff) |
| `manage.py` | Django command-line entry point (uses `config.settings.dev` by default) |
| `config/settings/` | `base.py` (shared), `dev.py`, `test.py`, `prod.py` |
| `config/urls.py`, `config/api_v1.py` | URL routes: `/api/v1/`, `/_allauth/`, the admin path |
| `apps/<app>/` | The ten apps: `core`, `accounts`, `catalogue`, `inventory`, `basket`, `orders`, `payments`, `delivery`, `notifications`, `store` |
| `apps/<app>/tests/` | Tests for that app |
| `tests/` | Project-wide tests: `integration/` (settings, database), `contract/` (OpenAPI drift), `security/` |
| `conftest.py` | Shared pytest fixtures |
| `documentation/` | Architecture, developer guide, API, database and security notes |

Each app will hold `models.py`, `services.py` (business rules), `api/` (serializers, views), `admin.py`, `tasks.py` where needed, `migrations/` and `tests/`. Apps change each other's data only through `services.py` (backend analysis §1.3).

## Documentation

| Topic | Document |
|---|---|
| Getting started (Windows) | `documentation/developer/GETTING_STARTED.md` |
| API conventions and contract | `documentation/api/API.md` |
| Database | `documentation/database/DATABASE.md` |
| Security | `documentation/security/SECURITY.md` |
| Design (accepted analysis) | `documentation/architecture/BACKEND_ANALYSIS_2026-11.md` |
| Foundation decisions | `../docs/decisions/adr/0014-backend-foundation-choices.md` |

## Rules

- Never commit `.env` or any real credential. Settings come from environment variables.
- `shared/contracts/openapi.yaml` is generated; never edit it by hand (see `documentation/api/API.md`).
- Every model change needs a migration; CI fails if one is missing.
- Business rules live in the backend; the browser is untrusted.
