# Frontend Security

_Updated 2026-11-27 (Phase 3). Project policy: `../../../SECURITY.md`; backend controls: `backend/documentation/security/SECURITY.md`. Independent review: `../quality/FRONTEND_REVIEW_REPORT.md`._

The browser is untrusted. The frontend never decides prices, stock, fees, totals, payment status or permissions; hiding a button is never access control. Client-side validation (Zod) is a convenience only; Django validates everything again.

## Controls in place, and the test that proves each

| Control | Implementation | Verified by |
|---|---|---|
| Content Security Policy | `src/config/security-headers.ts` via `next.config.ts` `headers()`: `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `connect-src 'self'`, no third-party hosts, no `unsafe-eval` in production | `tests/unit/security-headers.test.ts`; e2e "security headers" and "no CSP violations" |
| Clickjacking | `frame-ancestors 'none'` + `X-Frame-Options: DENY` | same |
| MIME sniffing, referrer, features | `nosniff`, `strict-origin-when-cross-origin`, `Permissions-Policy` (camera, microphone, payment, USB off; geolocation self only) | same |
| HSTS | Only when `NEXT_PUBLIC_SITE_URL` is `https://` (1 year, no preload yet) | unit test |
| Framework fingerprint | `poweredByHeader: false` | e2e |
| XSS | React escapes all text; ESLint `react/no-danger` is an error; search terms rendered as text | `tests/component/pages.test.tsx`; e2e search test (no `<img>`, no dialog) |
| CSRF | `X-CSRFToken` from the `csrftoken` cookie on every unsafe method; bootstrap via allauth config; Django enforces | `tests/integration/api-client.test.ts`, `tests/unit/csrf.test.ts` |
| Session | Django's HttpOnly session cookie; the frontend never reads or stores tokens; no `localStorage` use | code review |
| Same-origin API | Rewrites only `/api/v1/:path*` and `/_allauth/:path*` to a validated `BACKEND_ORIGIN` (no credentials, path or query allowed in it) | `tests/unit/backend-origin.test.ts`; manual stub-backend check |
| Secrets | None in the frontend. `BACKEND_ORIGIN` is server-only; `NEXT_PUBLIC_*` values are public and documented in `.env.example`; `.env*.local` ignored | review |
| Error detail | Customers see only wording from `src/api/errors.ts`; server errors keep only a digest | component tests |
| Mock data | MSW only in `next dev` with an explicit flag; production bundles contain no MSW code | build inspection (`setupWorker` absent from `.next/static`) |
| Third-party scripts | None. Google Maps (ADR-0013) will be allowed in the CSP for the checkout route only | e2e "no third-party requests" |
| Dependencies | Exact versions, lockfile, `npm ci --ignore-scripts` in CI, `npm audit --audit-level=high` | CI |
| CI | Read-only permissions, actions pinned to commit SHAs, no credentials persisted | workflow review |

## Accepted interim risk

**R-9, CSP allows inline scripts.** Without per-request nonces Next.js needs `script-src 'unsafe-inline'` for its bootstrap scripts, so the CSP does not block an injected inline script. It still blocks scripts from other origins, framing, plugins and `<base>` hijacking. React's escaping and the `no-danger` lint rule are the main XSS defences. Before launch, choose between Next.js's experimental SRI (hash-based, keeps static pages) or nonces on dynamic routes only, and re-test.

## Notes for the backend (production)

Through the rewrite Django receives `Host` = its own internal host, the browser's `Origin`, and `X-Forwarded-Host` = the storefront host. Production must therefore set `DJANGO_ALLOWED_HOSTS` to include the backend's internal host name and `DJANGO_CSRF_TRUSTED_ORIGINS` to the storefront origin (e.g. `https://sokofresh.co.ke`).
