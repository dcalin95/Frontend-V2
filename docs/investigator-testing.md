# BITS Investigator - Verification Plan

## Automated frontend

- Dedicated route and deep-link standalone rendering.
- Back navigation and panel collapse.
- Single and multiple subject validation.
- Start, progress, cancel, partial, failure, and completed states.
- Paginated findings/evidence/transactions and selection inspector.
- Finding review, notes, reopen, archive, and AI-disabled behavior.
- Keyboard focus, landmarks, labels, contrast, and responsive layout.

## Automated backend

- Identifier normalization and supported chains.
- Authentication, tenant isolation, and IDOR rejection.
- Provider capability, timeout, rate-limit, empty, and partial responses.
- Provenance and content-hash stability.
- Detector determinism and evidence linkage.
- Job idempotency, retry, cancel, and hard graph limits.
- AI-disabled and malformed/citation-invalid AI output.
- Secure export and audit events.

## Security fixtures

Use XSS strings in token metadata and notes, prompt injection in contract source, oversized subject lists, excessive graph depth, forged case IDs, invalid explorer identifiers, and provider error bodies containing fake secrets.

## End-to-end gates

Production-complete status requires migrations, authenticated real provider data for wallet/contract/transaction subjects, persisted reopen after reload, evidence-linked findings, partial/outage behavior, AI-disabled behavior, lint, tests, build, browser console inspection, server log inspection, and screenshots of each required state.

## Current verified scope

The existing frontend unit tests cover one mocked address run, local persistence helpers, notes, and assistant invocation. They do not prove live providers, authorization, database persistence, multi-subject cases, graph behavior, or production end-to-end operation.
