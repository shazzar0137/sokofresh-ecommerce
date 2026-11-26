# Backend security (as implemented)

_Updated 2026-11-26 (Phase 3). Architecture: `docs/architecture/TECHNICAL_ARCHITECTURE_PROPOSAL_2026-11.md` §9 (OWASP Top 10, OWASP API Security Top 10, Kenya Data Protection Act, 2019). This file lists what the code does **now**, how it is tested, and what is still missing. Adding a control is not the same as proving it: each "Tested by" entry is an automated test that ran and passed._

## Controls in place

| Area | Control | Tested by |
|---|---|---|
| Secrets | All secrets from environment variables; `.env` git-ignored; `.env.example` holds no real values | Manual review of every commit; gitleaks in CI (not yet run on GitHub) |
| Production fails safe | `prod.py` refuses to start without `DJANGO_SECRET_KEY` (≥ 50 chars, not a dev/test key), without `DJANGO_ALLOWED_HOSTS`, with the default `admin/` path, or with a development SMS backend | `tests/integration/test_settings.py` |
| HTTPS and cookies | Production: SSL redirect, HSTS (1 hour to start), `Secure` session and CSRF cookies, proxy TLS header | `test_production_cookies_and_https`; `check --deploy` |
| Django deploy checklist | `manage.py check --deploy --fail-level WARNING` passes with production settings (W005/W021 silenced deliberately, ADR-0014 #9) | `test_production_settings_pass_the_deploy_checklist` |
| Sessions | HttpOnly, SameSite=Lax session cookie; 14-day lifetime | `test_core_security_defaults` |
| CSRF | Django CSRF on every state-changing request, including allauth sign-in | `tests/security/test_security_baseline.py` |
| Authentication | Phone + one-time code via allauth; codes 6 digits, 5 minutes, 3 attempts; no customer passwords | `apps/accounts/tests/test_phone_login.py` |
| SMS abuse / cost | 3 code requests per number per 10 min, 10 per day, 30/min per IP; invalid and non-Kenyan numbers refused before any SMS; unknown numbers get no SMS | `test_phone_login.py` |
| Account enumeration | Same response for known and unknown numbers | `test_unknown_number_gets_no_sms_and_no_account_is_revealed` |
| Authorization | DRF deny-by-default (`IsAuthenticated`); roles as Django groups; `has_role()` ignores inactive users; customers cannot open Django admin | `test_core_security_defaults`, `test_roles.py`, `test_admin.py` |
| Staff passwords | Minimum 12 characters + Django's common/numeric/similarity validators | Django validators (configuration) |
| Input validation | Phone numbers normalised and validated with libphonenumber; database CHECK for E.164; DRF serializers for all future input | `test_phone.py`, `test_user_model.py` |
| Safe errors | RFC 9457 errors; unexpected errors return a generic 500 with details only in server logs; health check hides database error text | `test_exceptions.py`, `test_health.py` |
| Security headers | CSP (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: same-origin`, COOP | `test_api_responses_carry_security_headers` |
| API docs | Swagger UI and schema served only in development | `test_api_docs_are_not_served_outside_development` |
| SSRF | Outbound HTTP only through `outbound_client()`: host allow list, HTTPS only, timeout, no redirects | `apps/core/tests/test_http.py` |
| Logging | Filter masks phone numbers and removes one-time codes from every log line; SMS logs show masked numbers only | `test_logging.py`, `test_sms.py` |
| Rate limiting | DRF throttles (120/min anonymous, 240/min user) and allauth limits in a cache shared by all processes | Configuration; allauth limits tested |
| Dependencies | Exact versions locked (`uv.lock`); pip-audit in CI | pip-audit run locally 2026-11-26: no known vulnerabilities |
| Supply chain (CI) | GitHub Actions pinned to commit SHAs; read-only token; gitleaks checksum-verified | Workflow review |

## Known gaps (must be closed before any deployment)

| Gap | Plan |
|---|---|
| **Django admin login has no rate limit and no MFA yet.** allauth's admin protection (`secure_admin_login`) and MFA need allauth's HTML views, which `HEADLESS_ONLY = True` turns off | Phase 5: add allauth MFA (TOTP) for staff and admin login protection, or a throttled admin login; decision recorded then. **Do not deploy before this is done** |
| No real SMS provider (production refuses to send) | Phase 5: Africa's Talking backend via `outbound_client()` + Cloudflare Turnstile on code requests |
| Account creation at checkout not enabled | Phase 5 (ADR-0011 item 5) |
| Secret scan and CI not yet run on GitHub | Runs on the first push of the branch |
| Error tracking (Sentry with personal-data scrubbing) | Phase 8 |
| Threat model and data classification | Phase 3/4 security task (`PROJECT_STATE/03_PENDING_WORK.md`) |
| HSTS raised to one year; subdomains/preload | After HTTPS is stable on the real domain |
| Audit log of staff edits (django-auditlog) | Phase 4, with the first business models |

## Reporting a problem

See the repository's `SECURITY.md`. Never paste real customer data or credentials into issues, chats or logs.
