# 0007. Hosting and supporting services

- Status: Accepted as revised (2026-11-26)
- Date: 2026-11-26
- Decided by: Project owner (Danny), approving the architecture proposal §17 item 7

## Context
Development should cost nothing; production must be legal for commercial use, reliable and affordable.

## Options considered
See research §7–10. Key finding: Vercel Hobby is non-commercial only.

Evidence and sources: `../../research/TECHNOLOGY_RESEARCH_2026-11.md`.

## Decision (revised by the architecture review)
- **Development:** free tiers: Neon Free (dev branches), Cloudflare (DNS/CDN/TLS/Turnstile/R2/Tunnel), Sentry Developer, Resend Free, Africa's Talking sandbox, Daraja sandbox, GitHub + Actions. Vercel Hobby only for non-commercial previews, if used at all.
- **Production:** only plans that allow commercial use; all services in one region. **Preferred: Option A, Railway Pro** (Next.js, Django web, worker, cron) + Neon Launch. Alternative: Option B, Vercel Pro + Render + Neon Launch. Final choice in Phase 8 after measuring staging.
- **Scheduled jobs:** host cron → Django management commands; worker as its own service.
- **Budget:** about US$30–55/month plus SMS (estimate, to confirm in Phase 8).

Details: `docs/architecture/TECHNICAL_ARCHITECTURE_PROPOSAL_2026-11.md` §11–13.

## Consequences
- Production cannot run on Vercel Hobby, Railway Hobby or Render free services.
- Every service stays replaceable (standard PostgreSQL, S3-compatible storage, SMTP, adapters for SMS and payments).
- Added 2026-11-26: Google Maps Platform (ADR-0013); usage expected within free monthly caps at launch; budget alerts required.
