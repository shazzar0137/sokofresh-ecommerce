# Technology Research — November 2026

_Researched: 2026-11-26. Prices and free-tier limits change often; re-check each one before committing money or going live._

This is the evidence behind the proposed ADRs in `docs/decisions/adr/`. Each section gives the shortlist, the recommendation and the reasons. Nothing here is approved until the owner accepts the matching ADR.

Selection criteria used throughout: fit for SokoFresh (Kenyan mobile shoppers, M-Pesa, fresh-stock inventory), learning curve for a developing engineer, security defaults, maintenance and community, free-tier and production cost, and lock-in.

---

## 1. Frontend framework

| Option | Strengths | Weaknesses for SokoFresh |
|---|---|---|
| **Next.js (React)** | Server rendering for fast first load and search-engine visibility; largest React ecosystem; v16 is the Active LTS line | Fast-moving; frequent security releases to keep up with; best hosting experience is on Vercel |
| React + Vite (single-page app) | Simplest mental model | Poor SEO and slower first load on cheap phones; you build routing/data loading yourself |
| SvelteKit / Nuxt (Vue) | Excellent performance, smaller bundles | Smaller ecosystem and job market; fewer ready-made accessible component kits |

**Recommendation: Next.js 16 (App Router) with React.** A grocery storefront needs product pages that load fast on mid-range Android phones and appear in Google search; server rendering gives both. Next.js 16 is the Active LTS major (released 21 Oct 2025); 15.x is in maintenance. Next.js now publishes scheduled monthly security releases (e.g. 3 Nov 2026), so the project must update promptly.

**Language: TypeScript (proposed, needs approval).** TypeScript is JavaScript plus type annotations; it compiles to JavaScript, so it stays within the "JavaScript frontend" decision. It catches mistakes such as passing a price as text instead of a number, and lets the frontend use types generated from the backend API contract. Plain JavaScript remains possible if the owner prefers.

Supporting frontend tools (all free, open source, widely maintained):

| Need | Proposed | Why |
|---|---|---|
| Styling | Tailwind CSS | Utility classes make it quick to match the design; no runtime cost |
| Components | shadcn/ui (on Radix primitives) | Accessible components copied into the repo, so no lock-in |
| Server data | TanStack Query | Caching, retries, loading states for API calls |
| Cart/UI state | Zustand (small) — **later removed (ADR-0011): basket is server-side** | Basket must survive page changes; far simpler than Redux |
| Forms & validation | React Hook Form + Zod | Same validation rules on screen as in types |
| Testing | Vitest, React Testing Library, Playwright, axe-core | Unit, component, end-to-end and automated accessibility checks |

### Compatibility warning
Next.js treats a folder named `src/pages/` as its older "Pages Router". The Phase 1 skeleton has `frontend/src/pages/` alongside `frontend/src/app/`. If Next.js is approved, `src/pages/` must be renamed (proposed: `src/screens/` or removed in favour of App Router route folders) when the app is scaffolded. Logged as KI-003.

---

## 2. Backend language and framework

| Option | Strengths | Weaknesses |
|---|---|---|
| **Python + Django + Django REST Framework (DRF)** | Built-in admin site, authentication, ORM, migrations; strong default protection against SQL injection, XSS, CSRF, clickjacking; very large community | Two languages in the project (Python + JS/TS) |
| Node.js + NestJS (TypeScript) | One language end to end; can share types directly | No built-in admin or ORM; more pieces to choose and wire together; more custom security work |
| Backend-as-a-service (e.g. Supabase) | Very fast start | Business logic (stock, M-Pesa callbacks, delivery rules) ends up scattered; conflicts with the separate-backend architecture; higher lock-in |

**Recommendation: Python + Django 6.x + DRF.**

Reasons:
1. **Reuse before building.** Django's admin site gives staff screens for products, farmers, stock and orders with configuration rather than new code. This could replace the first version of the custom admin dashboard (see ADR-0008).
2. **Security defaults.** Django ships CSRF protection, ORM query parameterisation, password hashing, and, since 6.0, built-in Content Security Policy support.
3. **Background work without extra infrastructure.** Django 6.0 added a built-in Tasks framework. Django itself provides no worker, so a backend package is needed; `django-tasks-db` runs tasks from the database without Redis. Celery can replace it later without rewriting task code.
4. **DRF over Django Ninja.** Ninja is more modern (Pydantic, automatic OpenAPI), but DRF has the larger community, built-in throttling (rate limiting) and permissions, and most learning material. DRF is mature and changes slowly; that is acceptable for this project. OpenAPI generation via `drf-spectacular`.

Version note: Django 6.1 is current (5 Aug 2026), with mainstream support expected to end April 2027 and security support December 2027. Django moves to annual releases with three-year support from January 2028 ("Django 2028"). Plan to stay on the latest 6.x and upgrade yearly.

---

## 3. Database

**Recommendation: PostgreSQL**, accessed through the Django ORM with Django migrations.

Why relational: orders, payments and stock must stay consistent (two shoppers must not buy the last 4 chickens; a payment must link to exactly one order). PostgreSQL gives transactions, row locking, constraints and JSON columns when needed. It also offers full-text search and the `pg_trgm` extension for typo-tolerant search ("sukuma" vs "sukumawiki"), so no separate search service is needed at launch.

Hosting options:

| Option | Free tier | Notes |
|---|---|---|
| **Neon** | 100 projects, 1 GB storage and 100 CU-hours each; scales to zero after 5 minutes; no card | Free plan is permanent; paid "Launch" is pay-as-you-go ($0.106/CU-hour, $0.35/GB-month). Same database when upgrading |
| Render Postgres | One free database | Free databases expire after 30 days (14-day grace), so unsuitable beyond experiments |
| Supabase | 2 free projects that pause after a week of inactivity | Good, but brings extra platform features we would not use |

**Proposed:** Neon Free for development and staging; Neon paid (or the production host's managed Postgres) for production. Backups: provider point-in-time restore on the paid plan, plus a scheduled `pg_dump` to object storage we control (exit route away from any single vendor).

---

## 4. API style and shared contracts

**Recommendation: REST over HTTPS with JSON, described by OpenAPI 3.1.**

- The backend generates the OpenAPI document (`drf-spectacular`); it is committed to `shared/contracts/openapi.yaml`.
- The frontend generates TypeScript types from that file (`openapi-typescript`), so a contract change shows up as a type error.
- Contract tests (e.g. Schemathesis) check the running API against the file.
- Versioned under `/api/v1/`. GraphQL was not chosen: more complex caching and security for little benefit at this size.

---

## 5. Authentication

**Recommendation: django-allauth in headless mode.**

It provides a JSON API for single-page apps and mobile clients, supports phone-number login and login-by-code (one-time code), phone verification, rate limiting, and multi-factor authentication. It also offers a helper to protect the Django admin login with the same rate limits and 2FA. This avoids building sign-in, password reset and OTP flows ourselves.

Session approach: secure, HTTP-only session cookies with the frontend and API on the same parent domain (e.g. `sokofresh.co.ke` and `api.sokofresh.co.ke`). Avoids storing tokens in browser JavaScript.

SMS codes require an SMS provider (section 8).

---

## 6. Payments: M-Pesa

| Option | Cost | Pros | Cons |
|---|---|---|---|
| **Safaricom Daraja direct (M-Pesa Express / STK Push)** | No aggregator fee; Safaricom's own merchant tariffs apply | Full control; official API; most-used route in Kenya | Needs registered business, a Till or Paybill, and go-live approval; we handle callbacks and reconciliation |
| Paystack Kenya | 1.5% per M-Pesa payment, 2.9% local cards; no setup fee | Also takes cards and Apple Pay; CBK-authorised PSP; simpler onboarding | Fee on every order; refunds via support; another dependency |

Daraja status: Safaricom launched Daraja 3.0 (cloud-native, self-service go-live) in November 2025. Existing integrations continued to work. **A blog post claiming a March 2026 endpoint rename could not be corroborated by official or news sources and is disregarded; confirm endpoint paths on developer.safaricom.co.ke at implementation time.**

Go-live prerequisites reported by integration guides: a registered Kenyan business with KRA compliance, a live Paybill/Till, publicly reachable HTTPS callback URLs, and sandbox-tested flows.

**Recommendation:** Daraja STK Push direct, behind a `PaymentGateway` interface in the payments module so Paystack (or another provider) can be added for cards later without touching orders. **Owner decision needed:** business registration and Till/Paybill (non-technical prerequisites, potentially weeks).

Payment security rules (to become ADR detail and tests): never trust payment status sent from the browser; confirm each callback by querying Daraja's status API; make callback handling idempotent (the same callback twice must not double-credit); unguessable callback URL path; log every callback; reconcile daily.

"Pay on delivery" in the design: implement as an STK Push triggered when the rider confirms arrival (or a Till payment reconciled against the order). Exact flow is a business decision (see requirements open questions).

---

## 7. Hosting, storage, CDN

**Important licensing finding:** Vercel's free Hobby plan is restricted to non-commercial personal use. SokoFresh is commercial, so production on Vercel requires Pro (or Enterprise). Hobby is acceptable only while prototyping.

| Layer | Development (free) | Production (proposed; decide in Phase 9) |
|---|---|---|
| Frontend (Next.js) | Vercel Hobby | Vercel Pro, or run Next.js as a Node service on the same host as the backend |
| Backend (Django) | Local machine; optional Render Free (sleeps after 15 min idle, ~1 min wake-up) | Railway (Hobby $5/month incl. $5 usage; Pro $20) or Render paid instance |
| Database | Neon Free | Neon Launch (pay-as-you-go) |
| Images & backups | Cloudflare R2: 10 GB-month, 1M writes, 10M reads free; **no egress fees** | Same, pay beyond free tier ($0.015/GB-month) |
| DNS / CDN / TLS | Cloudflare Free | Cloudflare Free |

Cloudflare Workers (via OpenNext) was considered for the frontend because its free plan permits commercial use, but it has a 3 MiB Worker size limit on the free plan, documented Windows tooling issues, and Cloudflare now points new apps to a different adapter. Too much moving risk for a first project; reconsider later.

No major provider in the shortlist has a Kenyan region; choose European regions (closest common option) and rely on Cloudflare's CDN for static files and images. Measure latency from Kenya during staging.

---

## 8. Notifications

| Channel | Proposed | Free tier / cost |
|---|---|---|
| SMS (OTP, order updates) | Africa's Talking | Pay per message; third-party comparisons put Kenyan bulk SMS around KES 0.4–0.8, and a branded sender ID about KES 7,500 + VAT one-time. **Confirm on Africa's Talking's own pricing page.** Sender ID needs business documents |
| Email (receipts) | Resend | Free: 3,000 emails/month, max 100/day, no surprise overage. Pro $20/month for 50,000 |
| WhatsApp | Deferred | Meta WhatsApp Business Platform later |

Django sends email through its standard backend, so the email provider is replaceable.

---

## 9. Delivery and location

**Launch approach (no paid API):** delivery zones as data (e.g. Kilimani, Karen) with fee, minimum order, time slots and estimated time; free delivery threshold (KES 1,500 in the design). Tracking as order status steps (confirmed → packed → out for delivery → delivered) with SMS updates.

**Later:** live rider GPS map (needs a rider app); map tiles via OpenStreetMap/Leaflet or Google Maps Platform (paid per use). Deferred until there is demand.

---

## 10. Monitoring, logging, CI/CD

| Need | Proposed | Free tier |
|---|---|---|
| Error tracking | Sentry (frontend + backend SDKs) | Developer plan: 1 user, 5,000 errors/month; Team $26/month. Self-hosting or GlitchTip are exits |
| Logs | Hosting provider logs + structured JSON logging from Django | Included |
| Uptime | A free external uptime checker (choose in Phase 9) | — |
| CI/CD | GitHub (private repo) + GitHub Actions; Dependabot for dependency alerts | Free minutes allowance on private repos |

Prerequisite: put the project under git and on GitHub (Phase 3).

---

## 11. Legal and compliance (not legal advice)

Kenya's Data Protection Act, 2019 applies. Data controllers and processors must register with the Office of the Data Protection Commissioner (ODPC) unless exempt; the registration regulations set exemptions for small entities (reported as annual turnover below KES 5 million and fewer than 10 employees), but certain listed sectors must register regardless. **Have a lawyer or the ODPC confirm SokoFresh's position before launch.** Design implications now: collect only needed data, record purposes, support deletion requests, secure storage.

---

## Sources (accessed 2026-11-26)

- Vercel fair use and Hobby plan: https://vercel.com/docs/plans/hobby , https://vercel.com/docs/limits/fair-use-guidelines
- Next.js support policy and blog: https://nextjs.org/support-policy , https://nextjs.org/blog
- Django 6.0 / 6.1 releases and release cycle: https://docs.djangoproject.com/en/6.0/releases/6.0/ , https://djangoproject.com/weblog/2026/aug/05/django-61-released , https://djangoproject.com/weblog/2026/aug/10/annual-release-cycle , https://forum.djangoproject.com/t/djangos-tasks-framework-in-django-6-0/43054
- DRF vs Django Ninja (secondary): https://softaims.com/blog/django-rest-framework-vs-ninja-api-guide-2026
- django-allauth headless: https://django-allauth.readthedocs.io/en/latest/headless/introduction.html
- Neon plans: https://neon.com/faqs/free-plan-limits-and-quotas , https://neon.com/pricing
- Render free tier: https://render.com/docs/free , https://render.com/changelog/free-postgresql-instances-now-expire-after-30-days-previously-90
- Railway plans: https://docs.railway.com/pricing/plans
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- OpenNext Cloudflare: https://opennext.js.org/cloudflare , https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- Daraja 3.0: https://developer.safaricom.co.ke/ , https://techcabal.com/2025/11/25/safaricom-overhauls-m-pesa-api-platform/ , https://dev.to/ronnyabuto/what-daraja-30-actually-changed-for-developers-and-what-it-did-not-3ek4
- Daraja go-live guides (secondary): https://mctaba.com/learn/mpesa/daraja-production-checklist , https://paybillke.com/guides/mpesa-daraja-api-complete-guide-2026
- Paystack Kenya pricing: https://paystack.com/ke/pricing , https://support.paystack.com/en/articles/2130306
- Africa's Talking (secondary pricing): https://www.sent.dm/resources/kenya-sms-pricing , https://techweez.com/2025/03/18/cheapest-bulk-sms-service-provider-in-kenya/
- Resend limits: https://resend.com/docs/knowledge-base/account-quotas-and-limits , https://resend.com/pricing
- Sentry pricing: https://sentry.io/pricing/ , https://last9.io/blog/sentry-pricing/
- ODPC registration: https://www.odpc.go.ke/wp-content/uploads/2024/02/ODPC-Guidance-Note-on-Registration-of-Data-Controllers-and-Data-Processors.pdf , https://bowmanslaw.com/insights/kenya-data-protection-getting-ready-for-registration/

---

## Addendum (2026-11-26, after the architecture review)

- **Pochi la Biashara** (owner's collection method): a business wallet on the owner's phone number, set up via *334#, with no Till/Paybill. Sources describe it as not built for developer integration, and one integration report states it has no API, so payments into it cannot be prompted (STK) or confirmed automatically. Daraja STK Push needs a business shortcode (Till or Paybill). Outcome: ADR-0012 (manual verification at launch).
  - https://helloduty.com/blogs/m-pesa-application-all-you-need-to-know , https://tech-ish.com/2026/06/22/safaricom-m-pesa-pochi-la-biashara-explained/ , https://paybillke.com/guides/pochi-la-biashara , https://github.com/sugutlaban4-lgtm/Learn-Smart-Hub-Laban/pull/11
- **Pesapal** (owner's preferred future provider): API 3.0, one integration for M-Pesa, Airtel Money, cards and bank channels; hosted payment page or API. Fees reported by secondary sources around 3–3.5% for M-Pesa (verify on Pesapal's pricing page before deciding).
  - https://www.pesapal.com/blog/why-developers-in-kenya-uganda-and-beyond-are-choosing-pesapal-s-apis , https://paybillke.com/guides/mpesa-payment-gateway-kenya-2026
- **Hosting commercial terms:** Railway positions Hobby for personal projects and recommends Pro ($20/month incl. $20 usage) for commercial apps; Render background workers have no free tier; Vercel Pro is $20/month with $20 usage credit. Sources in the architecture proposal.
- **Google Maps Platform** (ADR-0013): pricing in Essentials / Pro / Enterprise categories with free monthly caps per SKU (most Essentials SKUs 10,000 billable events; Pro 5,000; Enterprise 1,000). Geocoding is an Essentials SKU; Autocomplete sessions followed by Place Details are not charged separately. Service terms: place IDs may be cached; other content such as geocoded coordinates only temporarily (generally up to 30 days) unless replaced by end-user-confirmed data; Google content not to be used with non-Google maps; attribution required. React library: `@vis.gl/react-google-maps` (Google-sponsored).
  - https://developers.google.com/maps/billing-and-pricing/pricing , https://developers.google.com/maps/billing-and-pricing/faq , https://cloud.google.com/maps-platform/terms/maps-service-terms , https://github.com/visgl/react-google-maps
