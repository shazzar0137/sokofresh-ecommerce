# 0012. Payments at launch: Pochi la Biashara with staff verification; Daraja sandbox for development; Pesapal as a future update

- Status: Accepted (2026-11-26)
- Date: 2026-11-26
- Decided by: Project owner (Danny)

## Context
ADR-0006 put payments behind a `PaymentGateway` interface, developed on the Daraja sandbox, with the production provider chosen before go-live. On 2026-11-26 the owner stated:
- the business is registered and licensed by the county;
- payments are received with **M-Pesa Pochi la Biashara**;
- Daraja is used **only in the sandbox**, not in production;
- **Pesapal** (M-Pesa, Airtel Money, cards, some banks) is the preferred provider for a **future update**;
- payment timing: **both** pay-now and pay-on-delivery, with **admin choosing** which is offered and switching at any time.

**Research finding:** Pochi la Biashara has no developer API. A website cannot send an STK prompt to, or automatically confirm a payment into, a Pochi wallet. STK Push and payment confirmation need a business shortcode (Till or Paybill).

## Decision
1. **Launch collection method: Pochi la Biashara with manual verification** (`ManualPochiGateway` behind `PaymentGateway`):
   - the customer sees the Pochi number, the exact amount and the order reference, pays from their phone, and enters the M-Pesa confirmation code;
   - the payment becomes `awaiting_verification`; staff check it against the business M-Pesa statement/messages and mark it `paid` or `rejected` in Django admin;
   - an M-Pesa code can be used only once (unique); amount must match; every action is audit-logged.
2. **Payment timing switch:** store settings hold `allow_pay_now` and `allow_pay_on_delivery` (at least one must be on). The storefront shows only the enabled options; changes affect new orders only; each order keeps its own choice.
3. **Daraja:** sandbox only, for development and learning the STK flow. Not used in production unless the owner later obtains a Till/Paybill.
4. **Pesapal:** planned future update (`PesapalGateway`), researched and decided in its own ADR before it is built.

## Consequences
- No automatic payment confirmation at launch: staff workload grows with order volume; a staff verification queue and daily reconciliation in Django admin are required.
- Fraud risk: fake M-Pesa messages or reused codes. Mitigation: verify only against the real M-Pesa statement, unique codes, amount match, audit log.
- Pochi limits apply (personal M-Pesa limits; customer pays the sending charge above KES 200, per secondary sources: verify).
- Recommendation recorded for later: a Buy Goods Till (or Pesapal) enables automatic STK confirmation and removes manual checks.
