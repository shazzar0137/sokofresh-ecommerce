# 0005. Authentication: django-allauth (headless) with phone OTP

- Status: Accepted (2026-11-26)
- Date: 2026-11-26
- Decided by: Project owner (Danny), approving the architecture proposal §17 item 3

## Context
Kenyan customers commonly identify by phone number. Sign-in, codes, rate limits and admin protection are complex to build safely.

## Options considered
- django-allauth headless: phone login, login-by-code, MFA, rate limits, admin protection.
- Hosted auth service (e.g. Clerk/Auth0): fast, but monthly cost and data outside our control.
- Build our own: highest risk.

Evidence and sources: `../../research/TECHNOLOGY_RESEARCH_2026-11.md`.

## Decision
django-allauth in headless mode; session cookies (Secure, HttpOnly, SameSite) with frontend and API on the same parent domain; SMS codes via Africa's Talking; MFA required for staff/admin.

## Consequences
- SMS cost per login code; rate limiting essential.
- Domain planning needed before production (e.g. sokofresh.co.ke + api.sokofresh.co.ke).

## Additions from the architecture review (2026-11-26)
- allauth does not store phone numbers: the custom User model holds the phone, and our account adapter implements the phone hooks and `send_verification_code_sms` (Africa's Talking via httpx).
- Cloudflare Turnstile on the "send code" step, plus per-phone and per-IP limits, against SMS-pumping fraud.
- Checkout uses this same phone + code sign-in (ADR-0011 item 5).
- Login codes are sent directly, not through the task queue (ADR-0011 item 8).
