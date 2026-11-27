# Technology Decisions Pending

Decided so far (approved 2026-11-26, ADR-0001 to ADR-0013; Phase 3 foundation choices in ADR-0014, confirmed by the owner 2026-11-27): **Next.js 16 + React + TypeScript; Django 6 + DRF; PostgreSQL (Neon); REST + generated OpenAPI; django-allauth phone sign-in; Django admin; Pochi la Biashara with staff verification at launch (Pesapal future); hosting on commercial plans, chosen in Phase 8; Google Maps Platform for addresses and delivery distance.**
Every item below has now been decided (see the Status column); this file is kept as the record of what was assessed. Phase 2 research (2026-11-26) produced a proposed answer for each item, recorded as ADRs in `docs/decisions/adr/`, which the owner then accepted. New technology choices still need research, owner approval and an ADR. Evidence: `docs/research/TECHNOLOGY_RESEARCH_2026-11.md`.

Each option should be assessed for: benefits, limitations, learning curve, security, performance, maintenance, hosting, free-tier limits and costs, integration with M-Pesa and other services, and vendor lock-in.

| # | Decision | Notes for research | Status |
|---|---|---|---|
| 1 | Frontend framework | Must suit a responsive storefront plus an admin dashboard; consider SEO and low-bandwidth mobile users | **Accepted:** Next.js + React + TypeScript (ADR-0001) |
| 2 | Backend language and framework | Must support a modular monolith, M-Pesa Daraja integration and good testing tools | **Accepted:** Python + Django + DRF (ADR-0002) |
| 3 | Database | Orders, payments and inventory need strong consistency and transactions | **Accepted:** PostgreSQL (ADR-0003) |
| 4 | API style (REST, GraphQL, etc.) | Must be documentable as contracts in `shared/contracts/` | **Accepted:** REST + OpenAPI (ADR-0004) |
| 5 | Authentication solution | Build vs. managed service; phone-number sign-in is common in Kenya | **Accepted:** django-allauth headless, phone + code (ADR-0005) |
| 6 | Payment provider and implementation | M-Pesa is required; decide between direct Daraja integration or an aggregator | **Accepted:** Pochi la Biashara with staff verification at launch; Daraja sandbox only; Pesapal future update (ADR-0012) |
| 7 | Hosting | Latency to Kenyan users, cost, data location | **Accepted:** dev free tiers; production on commercial plans, Railway Pro preferred, final in Phase 8 (ADR-0007) |
| 8 | Infrastructure (containers, managed services) | Keep simple; avoid needless complexity | **Accepted:** managed platforms; host cron + worker service (ADR-0007, 0011) |
| 9 | CI/CD | Automated tests and security scanning on every change | **Accepted:** GitHub Actions (ADR-0007) |
| 10 | Testing frameworks | Chosen after items 1 and 2 | **Accepted:** see `docs/testing/TESTING_STRATEGY.md` |
| 11 | Notifications (SMS, email, WhatsApp) | Order and delivery updates | **Accepted:** Africa's Talking SMS (REST), Resend email (ADR-0007, 0010) |
| 12 | Monitoring and logging | Error tracking and uptime monitoring | **Accepted:** Sentry + host logs (ADR-0007) |
| 13 | File and image storage | Product images | **Accepted:** Cloudflare R2 (ADR-0007) |
| 14 | Search | Database search may be enough at first | **Accepted:** PostgreSQL full-text + pg_trgm (ADR-0003) |
| 15 | Maps and location | Address search, pin, fast-zone radius, ETA | **Accepted:** Google Maps Platform (Places Autocomplete, Maps JS, Geocoding, Routes) via @vis.gl/react-google-maps and a backend `GeoService` (ADR-0013) |
