# Implementation Roadmap (Approved)

_Status: **Approved 2026-11-26** (architecture proposal §16, updated with the owner's answers). No phase starts without the owner's go-ahead; each ends with tests actually run and PROJECT_STATE updated._

| Phase | Goal | Frontend | Backend | Exit criteria |
|---|---|---|---|---|
| 1 | Initialisation | — | — | **Done** |
| 2 | Research and architecture | — | — | **Done** (ADR-0001 to 0013) |
| 3 Foundations | Empty apps + pipelines | Scaffold Next.js (fix KI-003), design tokens from PDF, shadcn init, MSW, test runners | uv project, 10 apps, **custom user model**, settings, Neon dev branch, OpenAPI → `shared/contracts`, pytest | git + GitHub; CI green; contract drift check |
| 4 Catalogue slice | Real storefront data | Header, home, shop, search, meal kits, zone list picker (no map on these pages) | catalogue, inventory (stock + price edits through the day), store settings, zones read API; Django admin | Home/shop show seeded data from the real API at 360/768/1280 px; axe clean |
| 5 Accounts & basket | Sign-in and server basket | Phone + code sign-in, basket UI | allauth adapter + Africa's Talking sandbox + Turnstile; basket API + merge | Basket survives sign-in; throttles tested |
| 6 Checkout & orders | Place orders safely | Checkout steps with **Google Maps address picker + pin**, payment-timing options, confirmation, tracking | orders, `GeoService` (Geocoding/Routes), `/delivery/quote`, fast radius, slots/ETA, idempotency, stock reservation, re-pricing (409) | Race-for-last-item test passes |
| 7 Payments, rider, notifications | Collect and verify payments | Pochi payment screen; rider screens for the **delivery partner** with map links | `ManualPochiGateway` + staff verification queue in admin + reconciliation; Daraja **sandbox** adapter (development only); notifications worker; cron | Full purchase with Pochi manual verification; pay-now and pay-on-delivery both tested; switch tested |
| 8 Hardening & staging | Production-like | Visual baselines, manual accessibility, real-phone performance | ZAP scan, load test, backup/restore test | Staging live; production host chosen (ADR-0007) |
| 9 Go-live | Launch | Remove placeholders (D-016, contacts) | Real Pochi details in settings; SMS sender ID; ODPC position; KRA PIN check | Launch checklist complete |
| 10 Future updates | Grow | Swahili UI, reviews | **Pesapal** (own ADR), WhatsApp, live tracking, custom admin only if Django admin is outgrown | — |

## Owner actions with long lead time
- KRA PIN and ODPC registration (owner: coming soon).
- Google Cloud project with a billing account for Google Maps Platform; set the real dispatch point.
- Choose the delivery partner and agree how its riders use the rider screens.
- SMS sender ID application (needs business documents).
- Decide which zones are fast vs slots, slot times and cut-offs (can be done in admin later).
- Consider a Buy Goods Till or Pesapal when manual Pochi checks become a burden.

## Estimated running cost
- Development: about US$0/month.
- Production: about US$30–55/month plus SMS (estimate; confirm in Phase 8). Pochi la Biashara: no aggregator fee; customer pays M-Pesa sending charges above KES 200 (secondary sources; verify). Pesapal later: per-transaction fees (secondary sources cite about 3–3.5% for M-Pesa; verify).
