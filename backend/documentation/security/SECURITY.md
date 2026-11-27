# Backend security (as implemented)

_Updated 2026-11-26 (Phase 3, after the independent review and corrections: `../quality/BACKEND_REVIEW_REPORT.md`). Architecture: `docs/architecture/TECHNICAL_ARCHITECTURE_PROPOSAL_2026-11.md` §9 (OWASP Top 10, OWASP API Security Top 10, Kenya Data Protection Act, 2019). This file lists what the code does **now**, how it is tested, and what is still missing. Adding a control is not the same as proving it: each "Tested by" entry is an automated test that ran and passed._

## Controls in place

| Area | Control | Tested by |
|---|---|---|
| Secrets | All secrets from environment variables; `.env`, database dumps and local tool settings git-ignored; `.env.example` holds no real values | Manual history scans (2026-11-26); gitleaks workflow on every push (not yet run on GitHub) |
| Production fails safe | `prod.py` refuses to start without `DJANGO_ALLOWED_HOSTS`, `DJANGO_TRUSTED_PROXY_COUNT` or `DJANGO_CSRF_TRUSTED_ORIGINS` (the storefront origin(s): https, no path, no wildcard; needed because the browser reaches Django through the Next.js rewrite); with a secret key shorter than 50 characters, with fewer than 5 different characters, or with a dev/test/`django-insecure` prefix; with an admin path that is not like `staff-x7k2/` (or contains `admin`); or with any SMS backend marked `dev_only` or not importable | `tests/integration/test_settings.py` (refusal cases); `tests/security/test_rewrite_csrf.py` (CSRF through the rewrite) |
| HTTPS and cookies | Production: SSL redirect, HSTS (1 hour to start), `Secure` session and CSRF cookies, proxy TLS header | `test_production_cookies_and_https`; `check --deploy` |
| Django deploy checklist | `manage.py check --deploy --fail-level WARNING` passes with production settings (W005/W021 silenced deliberately, ADR-0014 #9) | `test_production_settings_pass_the_deploy_checklist` |
| Sessions | HttpOnly, SameSite=Lax session cookie; 14-day lifetime | `test_core_security_defaults` |
| CSRF | Django CSRF on every state-changing request, including allauth sign-in | `tests/security/test_security_baseline.py` |
| Authentication | Phone + one-time code via allauth; codes 6 digits, 5 minutes, 3 attempts, single use; session key rotated at sign-in; no customer passwords; inactive accounts get no code | `apps/accounts/tests/test_phone_login.py` |
| Staff sign-in | **Staff and superusers cannot sign in with an SMS code** (SIM-swap risk); only the Django admin password login works for them | `test_staff_cannot_sign_in_with_an_sms_code`, `test_staff_can_still_sign_in_to_admin_with_password` |
| Sign-up | Closed until Phase 5; same 403 answer for new and existing numbers, no account created | `test_sign_up_is_closed_and_reveals_nothing` |
| SMS abuse / cost | 3 code requests per number per 10 min, 10 per day, 30/min per IP; invalid and non-Kenyan numbers refused before any SMS; unknown numbers get no SMS | `test_phone_login.py` |
| Account enumeration | Same response for known and unknown numbers, including when the SMS provider fails; sign-up closed (no new-vs-existing difference) | `test_unknown_number_…`, `test_sms_provider_failure_gives_the_same_answer_…`, `test_sign_up_is_closed_…` |
| SMS to arbitrary numbers | Phone-change endpoint unavailable until designed; `change_phone` limit 1/min, 3/day | `test_phone_change_endpoint_is_not_available` |
| Authorization | DRF deny-by-default (`IsAuthenticated`, 401 when not signed in); roles as Django groups; `has_role()` ignores inactive users (and does not treat superusers as members of every role: it fails closed); customers cannot open Django admin | `test_core_security_defaults`, `test_api_errors.py`, `test_roles.py`, `test_admin.py` |
| Staff passwords | Minimum 12 characters + Django's common/numeric/similarity validators | Django validators (configuration) |
| Input validation | Phone numbers normalised and validated with libphonenumber; database CHECK for E.164; DRF serializers for all future input | `test_phone.py`, `test_user_model.py` |
| Safe errors | RFC 9457 errors on API paths (including bad Host, CSRF failures and errors outside DRF); generic 500 with details only in logs; no parser internals; admin keeps HTML pages | `test_exceptions.py`, `test_api_errors.py`, `test_health.py` |
| Security headers | CSP (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: same-origin`, COOP | `test_api_responses_carry_security_headers` |
| API docs | Swagger UI and schema served only in development | `test_api_docs_are_not_served_outside_development` |
| SSRF | Outbound HTTP only through `outbound_client()`: host **and port** allow list (443 unless listed), case-insensitive, HTTPS only, timeout, no redirects; redirect/hook/transport overrides refused | `apps/core/tests/test_http.py` |
| Logging | Filter + redacting formatter mask Kenyan phone numbers (with spaces, dots, dashes, brackets, `(0)`) and remove codes (including JSON forms) from messages **and tracebacks**; `httpx` URLs logged only at WARNING. A safety net, not a guarantee: unusual formats may still slip through, so code must not log personal data | `test_logging.py`, `test_sms.py` |
| Rate limiting | DRF throttles (120/min anonymous, 240/min user) and allauth limits in a shared database cache sized so counters cannot be evicted by a flood of keys; client IP from `X-Forwarded-For` only past the configured trusted proxies. **Correction 2026-11-27 (frontend security review SEC-1, KI-014):** the Next.js rewrite between the browser and Django neither adds the client IP nor removes client-sent `X-Forwarded-For` / `X-Forwarded-Proto`, so the header *can* be spoofed or be missing unless the hosting topology is designed for it; must be settled before deployment | `tests/security/test_rate_limits.py` |
| Dependencies | Exact versions locked (`uv.lock`); pip-audit in CI | pip-audit run locally 2026-11-26: no known vulnerabilities |
| Supply chain (CI) | GitHub Actions pinned to commit SHAs; read-only token; gitleaks checksum-verified | Workflow review |

## Known gaps (must be closed before any deployment)

| Gap | Plan |
|---|---|
| **Django admin password login has no rate limit and no MFA yet** (SMS-code sign-in for staff is now refused, so the password is the only factor). allauth's admin protection and MFA need allauth's HTML views, which `HEADLESS_ONLY = True` turns off | Phase 5: MFA (TOTP) for staff and a throttled admin login; decision recorded then. **Do not deploy before this is done** |
| Admin static files (CSS/JS) not served in production | Decide in Phase 8 (e.g. WhiteNoise needs owner approval as a new package) |
| Timing difference between known and unknown numbers once a real SMS provider is called synchronously | Phase 5: send through a constant-time path |
| Proxy setup must overwrite `X-Forwarded-Proto` and the origin must not be reachable directly | Phase 8 hosting checklist |
| No real SMS provider (production refuses to send; sign-in requests still get the normal response) | Phase 5: Africa's Talking backend via `outbound_client()` + Cloudflare Turnstile on code requests |
| Account creation at checkout not enabled (sign-up closed) | Phase 5 (ADR-0011 item 5) |
| Secret scan and CI not yet run on GitHub | Runs on the first push of the branch |
| Error tracking (Sentry with personal-data scrubbing) | Phase 8 |
| Threat model and data classification | Phase 3/4 security task (`PROJECT_STATE/03_PENDING_WORK.md`) |
| HSTS raised to one year; subdomains/preload | After HTTPS is stable on the real domain |
| Audit log of staff edits (django-auditlog) | Phase 4, with the first business models |

## Reporting a problem

See the repository's `SECURITY.md`. Never paste real customer data or credentials into issues, chats or logs.
