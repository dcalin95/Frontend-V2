# OTA Operational Truth

**Status:** Current operational reference
**Updated:** 2026-07-20
**Applies to:** `https://bits-ai.io`, `/dex-edu/*`, and the backend at `C:\Users\bits\Desktop\backend-server`

## Product scope

BitSwapDEX combines a public token/presale and education experience with a DEX interface, account services, and the OTA trading-operations system. OTA can analyze markets and, only when explicitly enabled and authorized, manage real trading integrations. It is not a guaranteed-profit product.

## Operational safety rules

1. Do not claim or imply guaranteed profit, a fixed accuracy rate, or a fixed return.
2. Real-money execution must require server-side authenticated ownership, explicit policy limits, fee-aware risk checks, and position reconciliation.
3. A browser-delivered secret, URL parameter, UI badge, or prompt text is not authorization.
4. Password hashes cannot be displayed or recovered. Password changes require the current password or a secure reset flow.
5. Uploading an ID or bank document is not identity verification. Use `uploaded`, `type_classified`, `manual_review`, `verified`, or `rejected` accurately. Only a certified KYC provider or authorized manual review may set `verified`.
6. Production changes require a reviewable diff, focused tests, and an explicit deployment decision. Do not deploy a change solely because it builds.

## Canonical references

1. `docs/DOCUMENTATION_AUDIT_2026-07-18.md` for audit findings and remediation status.
2. `CURRENT_PROJECT_STATUS_2026-07-18.md` for the frontend/backend evidence snapshot.
3. `C:\Users\bits\Desktop\backend-server\docs\OTA_PRODUCTION_CONTRACT.md` for backend execution and governance requirements.
4. Active route definitions and tested backend services for exact endpoint behavior.

## Historical documentation

Files marked **Historical reference** describe earlier routes, domains, architecture plans, or incomplete implementations. They are retained for traceability only. They must not be used for deployment, authorization, production safety, or trading decisions.
