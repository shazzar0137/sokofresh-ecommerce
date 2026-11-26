# Testing Strategy Outline

> **Superseded 2026-11-26** by `TESTING_STRATEGY.md` (approved). Kept for history.

Status: **Outline only.** No tests or testing tools exist yet. Frameworks will be chosen after the application technologies (see `TECHNOLOGY_DECISIONS_PENDING.md`).

## Principles

- Testing happens during development, not after it.
- Every substantial change states its expected behaviour and edge cases, adds or updates tests, runs them, and reports actual results.
- A test is reported as passed only if it was executed. Unresolved failures are logged in `PROJECT_STATE/04_KNOWN_ISSUES.md`.
- Test data is fake. Real customer data and live M-Pesa credentials are never used in tests.

## Where tests live

| Location | Scope |
|---|---|
| `frontend/tests/` | Frontend only: unit, component, integration, accessibility, e2e, visual regression |
| `backend/tests/` | Backend only: unit, integration, API, contract, security, performance |
| `tests/` | Whole product: system, end-to-end, acceptance, regression, security, performance, load, accessibility, compatibility |

## Test types and their purpose

| Type | Checks |
|---|---|
| Unit | A single function or rule (e.g. meal-kit discount maths) |
| Component | A single UI component renders and behaves correctly |
| Integration | Parts working together (module + database) |
| API | Endpoints return the right data, status codes and errors |
| Contract | Frontend and backend agree with `shared/contracts/` |
| End-to-end | A real user journey: browse, add to basket, check out, pay |
| Acceptance | Business requirements are met |
| Regression | Previously fixed bugs stay fixed |
| Security | Authentication, access control, injection, M-Pesa callback validation |
| Performance / load | Speed and behaviour under many users (e.g. evening order peaks) |
| Accessibility | Usable with screen readers and keyboard; colour contrast |
| Compatibility | Common Kenyan devices and browsers, low-bandwidth connections |
| Visual regression | Storefront still matches the approved design |

## Critical journeys to cover first (once built)

1. Search and browse products, including stock limits ("Only 9 left today").
2. Add items and meal kits to the basket; quantity changes; free-delivery threshold.
3. Checkout with delivery area selection.
4. M-Pesa payment, including failed, cancelled and duplicate callbacks.
5. Order history and delivery tracking.
6. Admin inventory and order management.

## To decide in Phase 2+

- Testing frameworks for each layer.
- Coverage targets.
- How tests run in CI/CD.
- Test environments and M-Pesa sandbox use.
