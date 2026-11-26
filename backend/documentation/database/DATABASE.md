# Database (as implemented)

_Updated 2026-11-26 (Phase 3, after the independent review). The full planned data model is in `../architecture/BACKEND_ANALYSIS_2026-11.md` §2–3 (with amendments); tables are added phase by phase._

## Engine and connection

- **PostgreSQL** via the Django ORM (ADR-0003). Tests run against real PostgreSQL, never SQLite.
- Connection from the `DATABASE_URL` environment variable (django-environ), e.g. `postgres://user:password@host:5432/db?sslmode=require`. Never written in code.
- Connections reused for 60 s (`DATABASE_CONN_MAX_AGE`) with health checks.
- **Neon pooler:** if `DATABASE_URL` uses Neon's pooled (`-pooler`) host, set `DATABASE_TRANSACTION_POOLER=true` (turns off server-side cursors, which PgBouncer transaction mode cannot handle). With the direct host, leave it unset.
- Timestamps stored in **UTC**; displayed and cut-offs calculated in **Africa/Nairobi** (`USE_TZ = True`, `TIME_ZONE = "Africa/Nairobi"`).

| Environment | Database | Status |
|---|---|---|
| Local development | Local PostgreSQL 16+ or a Neon development branch | Local PostgreSQL 16 used while building Phase 3 |
| Automated tests | Temporary `test_<name>` database created by pytest-django | Working |
| CI | PostgreSQL 17 service container in GitHub Actions | Configured, not yet run on GitHub |
| Neon development | Neon Free project | **Not set up yet** (needs the owner's Neon account) |
| Staging / production | Neon paid plan or host Postgres (Phase 8) | Not set up |

## Tables in Phase 3

| Table | From | Purpose |
|---|---|---|
| `accounts_user` | `apps.accounts` | Custom user (below) |
| `accounts_user_groups`, `accounts_user_user_permissions` | Django auth | Role membership and per-user permissions |
| `auth_group` (+ permissions) | Django auth | Roles: **Customer, Rider, Staff, Admin** (created by migration `accounts.0002`) |
| `django_session` | Django sessions | Signed-in sessions; allauth's pending login-code state |
| `django_admin_log` | Django admin | Admin action history |
| `django_tasks_database_dbtaskresult` | django-tasks-db | Background task queue (ADR-0010) |
| `sokofresh_cache` | Django database cache | Rate-limit counters. Created by migration `core.0001`; limit 1,000,000 entries so counters cannot be evicted by a flood of other keys |
| `django_content_type`, `auth_permission`, `django_migrations` | Django | Framework bookkeeping |

## The custom user model (`accounts_user`)

Created before the first migration (Django cannot easily switch user models later).

| Column | Type | Rules |
|---|---|---|
| `id` | bigint identity | Primary key; never shown in URLs |
| `phone` | varchar(16) | **Unique**; login identifier; **CHECK** `^\+254[17][0-9]{8}$` (Kenyan mobile in E.164) |
| `phone_verified` | boolean | Set when the user confirms a code |
| `email` | varchar(254), nullable | Optional; **unique ignoring case** when present (`accounts_user_email_unique_ci`); **CHECK** NULL or non-empty, trimmed and lower-case (`accounts_user_email_normalised`); normalised on every save |
| `full_name` | varchar(150) | Optional |
| `password` | varchar(128) | Hashed. Customers have an *unusable* password (they sign in with codes); staff have a real one. **CHECK** not empty (`accounts_user_password_set`) |
| `is_staff`, `is_superuser`, `is_active` | boolean | Django admin access and status |
| `date_joined`, `last_login` | timestamptz | — |

The phone CHECK and email uniqueness are **database constraints**, so even code that bypasses the model cannot store an invalid number or a duplicate email (tested in `apps/accounts/tests/test_user_model.py`).

## Migrations

- Generated per app with `uv run python manage.py makemigrations`, committed, and never edited after being applied in a shared environment.
- CI and the test suite fail if a model change has no migration.
- Current migrations: `core.0001_create_cache_table`, `accounts.0001_initial` (user), `accounts.0002_create_role_groups` (roles), `accounts.0003_user_email_password_constraints`.
- Admin login accepts local phone formats (`UserManager.get_by_natural_key` normalises).

## Deploying to a new database

```
uv run python manage.py migrate
```
(`migrate` also creates the cache table.)

## Open design question (needs a decision before Phase 4 adds tables that reference users)

**DB-4:** the approved deletion plan (backend analysis §3.5) replaces a deleted customer's phone with a one-way hash, but the phone column only accepts real Kenyan numbers (CHECK constraint, 16 characters), and keeping a hashed or old number would also block the number's next owner (Kenyan operators recycle numbers). Recommended: make `phone` nullable (unique when present) and keep the hash in a separate column. Recorded as KI-011.

## Not yet done

- Neon project and development branch (owner account needed); `pg_trgm` availability on Neon (ADR-0003 "verify") is checked in Phase 4 when search is built.
- Backups and restore tests (Phase 8).
