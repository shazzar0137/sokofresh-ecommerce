# Testing Strategy (Approved)

_Status: **Approved 2026-11-26** (architecture proposal §10). Replaces `TESTING_STRATEGY_OUTLINE.md` as the authority. No tests exist yet; nothing is reported as passed unless it was executed._

## Tools
| Layer | Tools |
|---|---|
| Frontend | Vitest, React Testing Library, axe-core, MSW, Playwright (+ screenshots) |
| Backend | pytest, pytest-django (real PostgreSQL), factory_boy, respx, time-machine, Schemathesis |
| Whole product | Playwright against the real stack; ZAP baseline; a light load-test tool chosen in Phase 8 |

## Levels
| Level | Frontend | Backend | Whole product (`tests/`) |
|---|---|---|---|
| Unit | Formatting, phone normaliser, hooks | Fees, thresholds, kit pricing, cut-offs, status transitions, payment-timing switch | — |
| Component | RTL + axe | — | — |
| Integration | Pages against MSW | Stock reservation, constraints, **race for the last item**, basket merge, price change → 409 | — |
| API / contract | Types from the generated contract | Every endpoint: 200/401/403/404/409/422; Schemathesis; OpenAPI drift check | — |
| End-to-end | Playwright vs mocks (`frontend/tests/e2e`) | — | Playwright vs real stack (`tests/end-to-end`): browse → basket → sign-in → checkout → payment → tracking |
| Payments | Pochi payment screen, code entry, statuses | **Pochi manual verification:** code reused (rejected), wrong amount, unknown code, staff approve/reject, `needs_review`, audit entries; pay-now vs pay-on-delivery; switch changes only new orders. Daraja **sandbox** cases (development only) | Full flow in staging |
| Accessibility | axe everywhere; manual keyboard, TalkBack, VoiceOver, 200% zoom before launch | — | — |
| Visual regression | Playwright screenshots, baselines generated **in CI only** | — | — |
| Security | Headers | CSRF, IDOR (404 for others' objects), throttles, secrets not logged, Turnstile on code requests | ZAP baseline on staging |
| Performance | LCP < 2.5 s, INP < 200 ms, CLS < 0.1 on staging + a real mid-range Android | API p95 < 500 ms | Evening-peak load test |
| Location (ADR-0013) | AddressPicker with mocked Google responses; Maps JS not loaded on home/shop | Fast/slots rule at the radius edge (41.9 vs 42.1 km), county check, outside-area refusal, Google timeout fallback, only confirmed pins stored; all Google calls mocked with respx | Checkout with a mocked map or test key in staging |

Shared fixtures: `shared/test-fixtures/` (phone numbers, sample catalogue) used by both apps.

## CI (GitHub Actions)
Every push: frontend lint, type-check, unit/component tests; backend lint and pytest with a PostgreSQL service container; OpenAPI drift check; dependency and secret scans; a real-stack smoke test (Django behind `next start`, `tests/end-to-end/real-stack-smoke.sh`) on every pull request and on `main`. Schemathesis is **deferred to Phase 4** and time-machine to Phase 5–6 (ADR-0014): neither is installed yet. Main branch and releases: full end-to-end flows against the real stack as features arrive.

## Ownership
Frontend conversation: frontend tests. Backend conversation: backend and contract tests. Architect: whole-product tests, CI rules and release gates.
