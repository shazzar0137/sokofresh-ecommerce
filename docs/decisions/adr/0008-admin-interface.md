# 0008. Staff administration: Django admin first, custom dashboard later

- Status: Accepted (2026-11-26)
- Date: 2026-11-26
- Decided by: Project owner (Danny)

## Context
Staff must manage products, farmers, stock, meal kits, orders and riders from launch. Building a custom admin UI is a large effort.

## Options considered
- Customised Django admin: available almost free, secure, role-based.
- Custom Next.js admin dashboard: best user experience, months of work.
- Third-party admin builders: extra cost and lock-in.

Evidence and sources: `../../research/TECHNOLOGY_RESEARCH_2026-11.md`.

## Decision
Use a customised Django admin (with audit logging and MFA) for launch. Keep `frontend/src/pages/admin-dashboard` and related folders reserved; build a custom dashboard in Phase 10 only if staff outgrow Django admin.

## Consequences
- Large saving in Phases 4–7.
- Admin UI looks like Django, not like the storefront.
- The frontend admin folders stay empty for now.
