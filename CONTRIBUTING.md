# Contributing to SokoFresh

## Before you start

1. Read `PROJECT_STATE/00_HANDOVER.md`, `01_CURRENT_STATE.md` and `03_PENDING_WORK.md`.
2. Check `PROJECT_STATE/02_DECISIONS_AND_CHANGES.md` so you do not contradict an approved decision.
3. Inspect the actual files. The filesystem is the source of truth, not earlier conversations.

## Ground rules

- **Do not select a technology on your own.** Research it, recommend it, and wait for approval. Record approved choices as ADRs in `docs/decisions/adr/`.
- **Reuse before building.** Check for maintained libraries, official SDKs and services first.
- **Respect boundaries.** The frontend must not assume an API exists; the backend must not change an agreed contract without coordination. Contracts live in `shared/contracts/`.
- **Never commit secrets** (API keys, M-Pesa credentials, passwords, real customer data). See `SECURITY.md`.
- **No fake code or fake tests.** Only report tests as passed if they were actually run.
- **Small, reversible changes.** Do not delete, rename or move existing files without a reason and approval.

## After you finish

1. Verify the change on disk.
2. Update the relevant `PROJECT_STATE/` files.
3. Add an entry to `CHANGELOG.md`.

## Conventions

- File and directory names: lowercase, hyphen-separated (`order-management`).
- Text files: UTF-8, LF line endings, 2-space indentation (see `.editorconfig`).
- Commit messages and branch strategy will be defined once version control is set up.
