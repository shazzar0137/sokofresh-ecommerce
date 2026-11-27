# API contract: how frontend and backend share it

_Created 2026-11-26 (Phase 3, Backend). For the Frontend conversation and the Project Architect._

## The file

`shared/contracts/openapi.yaml` is the API contract (OpenAPI 3.0.3). It is **generated** from the Django code by drf-spectacular and **must not be edited by hand** (ADR-0004, 0011).

## Flow

1. Backend changes an endpoint and regenerates the file (command in `backend/documentation/api/API.md`).
2. The backend test suite fails if the committed file is out of date (drift check).
3. Frontend regenerates TypeScript types from the file with openapi-typescript (ADR-0009) and calls the API with openapi-fetch. A contract change shows up as type errors.
4. Endpoints not built yet are mocked with MSW, shaped from the same file.
5. Breaking changes need `/api/v2/` and Architect approval.

## What the contract contains today (Phase 3)

- `GET /api/v1/health`.
- `ProblemDetail` and `FieldError` schemas: every operation documents `4XX` and `5XX` responses as `application/problem+json`.

## Points for the Frontend (agree or raise)

| # | Point | Detail |
|---|---|---|
| F-1 | Error format | RFC 9457 with a stable `code` (published as an **enum** in the contract, so it becomes a TypeScript union) and a flat `errors` list (dotted field paths, `null` for whole-request errors). Validation errors are **422**; not signed in is **401**; CSRF problems are `csrf_failed`. See `backend/documentation/api/API.md` |
| F-2 | Sign-in endpoints are not in this file | They are allauth headless (`/_allauth/browser/v1/…`), documented by allauth. Errors there use allauth's format |
| F-3 | Phone numbers to allauth must be E.164 | allauth rejects `07…` forms (`invalid_phone`); the frontend normaliser (FE-32) converts first. The shared list `shared/test-fixtures/phone-numbers.json` defines accepted inputs and their E.164 results for both test suites |
| F-4 | Login codes | 6 digits, valid 5 minutes, 3 attempts; over the request limit allauth returns 400 `too_many_login_attempts` |
| F-5 | No trailing slashes on `/api/v1/` paths | e.g. `/api/v1/health` |
| F-7 | Sign-up, staff, phone change | Sign-up is closed until Phase 5 (403 for every number). Staff accounts cannot sign in with a code. `…/account/phone` is not available (404) |
| F-6 | CSRF | Get the `csrftoken` cookie from `GET /_allauth/browser/v1/config` and send it as `X-CSRFToken` on every POST/PUT/PATCH/DELETE (same-origin via Next.js rewrites, ADR-0011 item 3) |

## Frontend response (2026-11-27, Phase 3 frontend)

| # | Frontend position | Where |
|---|---|---|
| F-1 | **Agreed and implemented.** Errors parsed as RFC 9457 with a runtime shape check; code switches on `code`; the enum becomes a TypeScript union, and the frontend's message table is typed `Record<code, string>`, so a new code is a compile error until it has wording. Unknown codes at runtime fall back to `error` | `frontend/src/api/errors.ts` |
| F-2 | **Noted.** allauth endpoints are called through the same-origin rewrite; their error format will be handled separately when sign-in is built (Phase 5) | `frontend/next.config.ts` |
| F-3 | **Agreed and implemented.** `normaliseKenyanMobile()` converts 07…/01…/254…/+254… to E.164 before calling allauth; tested against `shared/test-fixtures/phone-numbers.json` | `frontend/src/utils/phone.ts`, `frontend/tests/unit/phone.test.ts` |
| F-4 | **Noted** for the sign-in UI (Phase 5): 6-digit code, 5 minutes, 3 attempts, `too_many_login_attempts` | — |
| F-5 | **Agreed.** Rewrites forward paths unchanged, without adding slashes | `frontend/next.config.ts` |
| F-6 | **Agreed and implemented.** `X-CSRFToken` on POST/PUT/PATCH/DELETE from the `csrftoken` cookie; one bootstrap `GET /_allauth/browser/v1/config` if the cookie is missing | `frontend/src/api/csrf.ts`, `frontend/tests/integration/api-client.test.ts` |
| F-7 | **Noted** (sign-up closed until Phase 5; staff cannot use codes; no phone change) | — |

**New point for the backend (F-8), observed with a stub backend:** through the Next.js rewrite Django receives `Host` = its own host (`BACKEND_ORIGIN`), the browser's `Origin` unchanged, and `X-Forwarded-Host` = the storefront host. Production settings therefore need `DJANGO_ALLOWED_HOSTS` to include the backend's internal host name and `DJANGO_CSRF_TRUSTED_ORIGINS` to include the storefront origin. Development defaults (`localhost:3000`) already work. Also (security review SEC-1, **KI-014, deployment blocker**): the rewrite neither adds the client IP to `X-Forwarded-For` nor removes client-sent `X-Forwarded-For` / `X-Forwarded-Proto`, so the trusted-proxy count, per-IP rate limits and `SECURE_PROXY_SSL_HEADER` must be designed for the real proxy chain and tested before deployment.
