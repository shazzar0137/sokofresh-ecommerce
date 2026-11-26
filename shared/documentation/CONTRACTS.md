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
| F-1 | Error format | RFC 9457 with a stable `code` and a flat `errors` list (dotted field paths, `null` for whole-request errors). Validation errors are **422**. See `backend/documentation/api/API.md` |
| F-2 | Sign-in endpoints are not in this file | They are allauth headless (`/_allauth/browser/v1/…`), documented by allauth. Errors there use allauth's format |
| F-3 | Phone numbers to allauth must be E.164 | allauth rejects `07…` forms (`invalid_phone`); the frontend normaliser (FE-32) converts first. The shared list `shared/test-fixtures/phone-numbers.json` defines accepted inputs and their E.164 results for both test suites |
| F-4 | Login codes | 6 digits, valid 5 minutes, 3 attempts; over the request limit allauth returns 400 `too_many_login_attempts` |
| F-5 | No trailing slashes on `/api/v1/` paths | e.g. `/api/v1/health` |
| F-6 | CSRF | Get the `csrftoken` cookie from `GET /_allauth/browser/v1/config` and send it as `X-CSRFToken` on every POST/PUT/PATCH/DELETE (same-origin via Next.js rewrites, ADR-0011 item 3) |
