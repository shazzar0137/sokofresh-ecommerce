# 0011. Consolidated architecture review: amendments

- Status: Accepted (2026-11-26)
- Date: 2026-11-26
- Decided by: Project owner (Danny), approving all ten items of `docs/architecture/TECHNICAL_ARCHITECTURE_PROPOSAL_2026-11.md` §17

## Context
The frontend and backend analyses were written separately. The Architect's review found conflicts (C-1 to C-12), duplication and unnecessary tools. This ADR records the resulting amendments to earlier ADRs.

## Decision
1. **Zustand removed** from the frontend stack (amends ADR-0001). The server basket is handled through TanStack Query; UI state uses React state; filters use the URL.
2. **OpenAPI version:** whatever drf-spectacular produces reliably (3.0.3 or 3.1) (amends ADR-0004).
3. **Same-origin routing:** the browser uses one site; Next.js rewrites `/api/*` and `/_allauth/*` to Django. Fallback: `api.` subdomain + django-cors-headers.
4. **Backend structure:** 10 Django apps (core, accounts, catalogue, inventory, basket, orders, payments, delivery, notifications, store); top-level layer folders removed at the Phase 3 scaffold.
5. **Checkout sign-in:** checkout uses phone + one-time code, which signs in or creates the account; guest checkout (FR-25) merges into FR-40.
6. **Single status path:** rider/staff actions change `Delivery`; the orders service updates `Order.status` in the same transaction.
7. **Payment status `needs_review`** for provider disagreements and manual checks, resolved in Django admin.
8. **Login codes sent directly** (short timeout, rate limited, Cloudflare Turnstile); order/delivery messages go through the worker.
9. **Scheduled jobs** run as host cron → Django management commands; the task worker runs as its own service.
10. **Runtime pins:** Node.js 24 LTS; Python 3.13; Django 6.1, moving to 6.2 when released.
11. **One test fixture list** for phone numbers in `shared/test-fixtures/`; auditlog not applied to history tables; one HTTP client (httpx) and one mock library (respx).

## Consequences
- ADR-0001 and ADR-0004 carry an "Amended by 0011" note.
- `docs/architecture/SYSTEM_ARCHITECTURE.md` is the current architecture; the proposal is the decision record.
