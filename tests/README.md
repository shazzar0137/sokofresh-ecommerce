# Project-wide tests

Tests that span the whole product, frontend and backend together: system, end-to-end, acceptance, regression, security, performance, load, accessibility and compatibility.

Tests for a single application live inside that application (`frontend/tests/`, `backend/tests/`).

`reports/` holds generated test output and is git-ignored.

The plan is in `../docs/testing/TESTING_STRATEGY_OUTLINE.md`. The application tests live in `frontend/tests/` and `backend/tests/` (Vitest, Playwright, pytest; ADR-0009, ADR-0010). The first cross-application test is `end-to-end/real-stack-smoke.sh`: the real Django backend (production settings) behind the real Next.js server, run by `.github/workflows/real-stack-ci.yml`.
