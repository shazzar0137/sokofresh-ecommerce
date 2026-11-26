# Security Planning Outline

> **Approved security architecture (2026-11-26):** see `docs/architecture/TECHNICAL_ARCHITECTURE_PROPOSAL_2026-11.md` §9 and ADR-0005, 0011, 0012. Added risk: Pochi la Biashara payments are verified manually; fake M-Pesa messages and reused codes must be checked against the real M-Pesa statement. Google Maps keys (ADR-0013): browser key restricted by website address and API; server key in environment variables, restricted to Geocoding/Routes; quotas and budget alerts. Customer location is personal data.

Status: **Outline only.** No security controls are implemented, because no application exists yet. Detailed work will be stored in `security/`.

Reference guidance: OWASP Top 10 (web applications), OWASP API Security Top 10, OWASP ASVS, and Safaricom Daraja (M-Pesa) documentation. Kenya's Data Protection Act, 2019 applies to customer personal data.

## What needs protecting

- Customer accounts, phone numbers, delivery addresses and order history.
- Payment records and M-Pesa transaction data.
- Inventory, pricing and supplier/farmer information.
- Admin access.

## Planning areas (each maps to a folder in `security/`)

| Area | Key questions |
|---|---|
| Threat model | Who might attack, what they want, and where the weak points are |
| Authentication | How customers and admins sign in; password and OTP handling |
| Authorization | Role-based access (customer, staff, admin); no access to other users' orders |
| Session management | Session expiry, secure cookies or tokens |
| Input validation | Validate all input; protect against injection and XSS |
| API security | Rate limiting, CSRF protection, SSRF prevention, error messages that leak nothing |
| Data protection | Encryption in transit and at rest; data minimisation; retention |
| Payment security | Verify M-Pesa callbacks; never trust payment status from the browser; idempotent processing |
| Dependency security | Vet packages before adding; automated vulnerability scanning |
| Secrets management | No secrets in code; environment-based secrets; rotation |
| Security testing | Automated scans plus manual testing of critical flows |
| Incident response | What to do if a breach or payment fault happens |
| Checklists | Pre-release and per-feature security checklists |

## Sequencing

1. Threat model and data classification: before the database and API are designed.
2. Authentication and authorization design: with the backend technology choice.
3. Payment security design: before any M-Pesa code is written.
4. Security testing: alongside each feature, not at the end.
