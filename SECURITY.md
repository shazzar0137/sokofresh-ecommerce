# Security Policy

SokoFresh will handle customer personal data, delivery addresses and M-Pesa payments. Security is a design requirement from the start, not a final step.

## Current state

No application code exists, so there is no running system to attack yet. The security planning outline is in `docs/security/SECURITY_PLANNING_OUTLINE.md`, and design work will be stored in `security/`.

## Rules that apply now

- Never place credentials, API keys, tokens, passwords or real customer data in this repository.
- Environment files (`.env` and variants) are git-ignored. Only a placeholder template, with no real values, may be committed.
- M-Pesa integration will follow Safaricom's official Daraja documentation, including callback validation.
- Do not describe the system as "secure" unless the claim is backed by executed security tests.

## Reporting a vulnerability

A reporting contact and process will be defined before any public deployment. Until then, report issues directly to the project owner and do not open public issues for security problems.
