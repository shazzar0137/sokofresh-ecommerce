# 0010. Backend supporting libraries

- Status: Accepted (2026-11-26)
- Date: 2026-11-26
- Decided by: Project owner (Danny), approving `docs/architecture/TECHNICAL_ARCHITECTURE_PROPOSAL_2026-11.md` §17 item 5

## Context
ADR-0002 fixed Django + DRF. The backend analysis (§6) proposed supporting libraries; the architecture review (§2.2–2.3, §4) removed duplicates.

## Options considered
See `backend/documentation/architecture/BACKEND_ANALYSIS_2026-11.md` §6 and the proposal §4.

## Decision
| Need | Choice |
|---|---|
| Runtime / packaging | Python 3.13; **uv** with a lockfile |
| Sign-in | django-allauth[headless] (ADR-0005) |
| Phone numbers | phonenumbers |
| List filtering | django-filter |
| OpenAPI | drf-spectacular |
| Background jobs | Django Tasks + django-tasks-db (no Redis) |
| Outbound HTTP (Daraja sandbox, Africa's Talking REST, future Pesapal) | **httpx only** (no Africa's Talking SDK) |
| Settings | django-environ only |
| Object storage | django-storages (S3 API → Cloudflare R2) |
| Audit of staff edits | django-auditlog (not on the history tables) |
| Error format (RFC 9457) | drf-standardized-errors **or** a small custom handler: verify at scaffold, keep only one |
| Error tracking | sentry-sdk with personal-data scrubbing |
| Tests | pytest, pytest-django, factory_boy, **respx** (only mocking library), time-machine, Schemathesis |
| Security checks | pip-audit, `manage.py check --deploy` |

Not adopted: Africa's Talking SDK, `responses`, Redis/Celery, third-party Daraja packages.

## Consequences
- Each package's Django 6 support is verified at install; fallbacks: custom error handler, django-simple-history.
- Built ourselves (justified): thin payment-provider clients, idempotency records, stock reservation, basket quote, slot availability.
