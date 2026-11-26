# 04 Known Issues

Real, observed issues only. Add an entry when something is found; mark it Resolved rather than deleting it.

| ID | Date found | Issue | Impact | Status |
|---|---|---|---|---|
| KI-001 | 2026-11-26 | The pre-existing skeleton contains three directories not in the Phase 1 specification: `frontend/public/assets/`, `tests/stress/`, and `docs/decisions/adr/` (spec says `ADR/`). They were kept, not deleted. `adr` is being used as the ADR folder (D-005). | Low. Owner should decide whether to keep or remove `frontend/public/assets/` and `tests/stress/`. | **Resolved 2026-11-26**: owner approved removal; `frontend/public/assets/` and `tests/stress/` deleted (they held only `.gitkeep`). `docs/decisions/adr` kept as the ADR folder (D-005) |
| KI-002 | 2026-11-26 | The design PDF had not been copied into `assets/design-references/` (Claude's access was limited to the project folder). | Medium: design tokens could not be extracted. | **Resolved 2026-11-26**: owner copied the PDF and `.fig` file; PDF size verified as 3,389,791 bytes |
| KI-003 | 2026-11-26 | `frontend/src/pages/` conflicts with Next.js, which treats a `src/pages/` folder as its older Pages Router. Applies only if ADR-0001 (Next.js) is accepted. | Medium: would cause routing conflicts at scaffold. Fix: rename (e.g. `src/screens/`) or remove at Phase 3, with approval. | Open: fix at Phase 3 scaffold (remove `src/pages/` and `src/routes/`, ADR-0011) |
| KI-004 | 2026-11-26 | Pochi la Biashara (the business's M-Pesa collection method) has no developer API: payments cannot be prompted (STK) or confirmed automatically. | Medium: every payment needs a staff check; fake-message fraud risk; staff workload grows with orders. Handled by ADR-0012 (manual verification, unique codes, amount match, audit). Permanent fix: Buy Goods Till or Pesapal (future update). | Open: accepted limitation at launch |
