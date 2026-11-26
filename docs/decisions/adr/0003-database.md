# 0003. Database: PostgreSQL via the Django ORM

- Status: Accepted (2026-11-26)
- Date: 2026-11-26
- Decided by: Project owner (Danny)

## Context
Orders, payments and daily stock must stay consistent under concurrent use. Search must tolerate Swahili/English spelling variation.

## Options considered
- PostgreSQL: transactions, locking, constraints, full-text and trigram search.
- MySQL: capable, weaker search features.
- Document databases: poor fit for transactional orders/payments.
Hosts: Neon (permanent free plan), Render (free DB expires after 30 days), Supabase (pauses idle projects).

Evidence and sources: `../../research/TECHNOLOGY_RESEARCH_2026-11.md`.

## Decision
PostgreSQL with Django migrations. Neon Free for development/staging; paid Neon or host-managed Postgres for production. Postgres full-text + pg_trgm for search at launch. Scheduled pg_dump to R2 in addition to provider backups.

## Consequences
- No separate search service to run or pay for at launch.
- Backups exportable to storage we control (exit route).
