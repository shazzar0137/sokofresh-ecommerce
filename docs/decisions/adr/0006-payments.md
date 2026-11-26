# 0006. Payments: M-Pesa via Safaricom Daraja behind a gateway interface

- Status: Accepted with modifications (2026-11-26); **amended by ADR-0012** (Pochi la Biashara at launch, Daraja sandbox only, Pesapal future)
- Date: 2026-11-26
- Decided by: Project owner (Danny)

## Context
M-Pesa is mandatory; the design offers payment on delivery. Payment integrity is the highest-risk part of the system.

## Options considered
- Daraja direct (STK Push): no aggregator fee; requires registered business, Till/Paybill and go-live approval.
- Paystack Kenya: 1.5% per M-Pesa payment, adds cards; simpler onboarding.
- Other aggregators: not shortlisted.

Evidence and sources: `../../research/TECHNOLOGY_RESEARCH_2026-11.md`.

## Decision
**Owner decision:** the business is not yet registered, so the production provider is **deferred**. For now:
- Build the payments module behind a `PaymentGateway` interface and develop against the **Daraja sandbox** (STK Push).
- Choose the production provider (Daraja direct or Paystack) before Phase 9 go-live, once registration and Till/Paybill status are known. Record that choice in a new ADR that supersedes this one.

Original recommendation, kept for reference:
Daraja STK Push direct, implemented behind a `PaymentGateway` interface so another provider can be added for cards. Rules: confirm every callback with Daraja before marking paid; idempotent processing; log all callbacks; daily reconciliation; secrets only in environment variables.

## Consequences
- Owner must arrange business registration and Till/Paybill before production.
- Build and test entirely on the Daraja sandbox until then.
- Confirm current endpoint paths on the official portal at implementation.
