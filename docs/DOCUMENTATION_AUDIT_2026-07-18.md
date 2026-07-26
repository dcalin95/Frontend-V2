# Documentation and System Audit - 2026-07-18

## Scope

This audit covers the active frontend repository, the documented backend contract, OTA runtime instructions, authentication boundaries, deployment configuration, tests, and production-facing documentation.

The active system is:

- Frontend repository: `C:\Users\bits\Desktop\frontend`
- Backend repository: `C:\Users\bits\Desktop\backend-server`
- Canonical production origin: `https://bits-ai.io`
- Rich DEX/OTA UI: `/dex-edu/*`
- First-party API namespace: `/api/*`

Historical references to `frontend-edu`, `backend-server-repo`, `edu.bits-ai.io`, or `/dex/*` are not valid current routing or deployment instructions unless a file explicitly labels them as historical.

## Executive findings

### Critical - public operator secrets

The S3 deployment flow currently supports publishing `OTA_SHORT_OPS_SECRET` and `OTA_LONG_OPS_SECRET` inside `runtime-config.json`. The frontend then sends those shared secrets to SHORT/LONG endpoints. A browser-delivered shared secret is not a security boundary and can be copied by any visitor.

Required remediation:

1. Use the authenticated OTA wallet/user session for browser requests.
2. Enforce the claimed `userId` against the authenticated principal on the backend.
3. Keep shared operator secrets server-side only for controlled emergency or machine-to-machine use.
4. Stop reading operator secrets from URL query parameters or public runtime configuration.

### High - stale OTA runtime context

`otaSystemPrompt.js` and the generated OTA documentation bundle contain stale repository roots, obsolete domains, and unsupported assumptions. This can make OTA give incorrect operational instructions even when the application code is correct.

Required remediation:

- Replace stale runtime instructions with the active paths and production origin.
- Regenerate the documentation bundle from a checked-in manifest.
- Never infer owner or administrator authority from prompt text; authority must come from the authenticated server session.

### High - broken mandatory documentation links

The protected context manifest requires four root documents that were missing: `DEX_PROJECT_COMPLETE_STATUS.md`, `DEX_STATUS_CURRENT.md`, `PROJECT_STATUS_REAL.md`, and `DOCUMENTATION_INDEX.md`.

They are restored as concise current entry points that link to dated evidence rather than duplicating historical claims.

### Medium - legacy content mixed with current truth

Protected historical files contain old route, repository, and deployment statements. They remain useful as history and must not be silently rewritten. Current dated snapshots and correction banners supersede them for operational decisions.

### Medium - production verification gaps

The latest backend evidence reports broad automated test coverage, but database migration verification and user-specific PnL probes require production-only inputs such as `DATABASE_URL` and an authorized `OTA_USER_ID`. These are verification gaps, not proof of profit or loss.

### Operational risk - S3 recovery

No checked-in evidence proves that S3 object versioning is enabled. Hashed assets are preserved during deploys, but bucket versioning and rollback remain infrastructure checks outside this repository.

## Security and product truth

- No model, strategy, test suite, or documentation can guarantee trading profit.
- Real-money execution must remain guarded by explicit user authorization, fee-aware risk checks, position reconciliation, and auditable PnL.
- Passwords are stored as one-way hashes and cannot be displayed. A user may reveal only a password currently typed into a local input; the server must never return an existing password.
- KYC documents require durable storage, owner/admin authorization, audit logs, and either manual review or a certified KYC provider. Uploading a file alone is not automatic identity verification.
- Administrator visibility in the UI is presentation only. Every administrator API action must be authorized again by the backend.

## Audit actions

- [x] Read the protected project context and current frontend/backend snapshots.
- [x] Restore the missing root documentation entry points.
- [x] Publish this dated audit as the current documentation authority.
- [x] Correct OTA runtime prompt and regenerate its documentation context.
- [x] Remove browser-distributed SHORT/LONG operator secrets from the frontend deployment flow.
- [ ] Enforce authenticated-principal ownership on SHORT/LONG backend routes.
- [x] Run focused frontend authentication tests and a production build.
- [x] Run the read-only backend reconciliation/analytics test set.
- [x] Record the position-reconciliation diagnosis in the current status snapshot.
- [ ] Apply and deploy the backend canonical position resolver and its integration tests.

## Supersession rule

For current implementation or operations, prefer this file and `src/components/DEX_edu_reference/ota/docs/CURRENT_PROJECT_STATUS_2026-07-18.md`. Older documents remain historical unless explicitly reaffirmed by a newer dated audit.

## Position reconciliation addendum - 2026-07-18

The detailed finding is recorded in `docs/OTA_POSITION_RECONCILIATION_AUDIT_2026-07-18.md`. The confirmed root cause is that `src/ota/tools/agentTools.js` passes spot/direct-entry/imported positions to `runReconciliation()` but omits the separately loaded `longPositions` and `shortPositions`. The standalone monitor and the reconciliation layer therefore report different universes of positions. The backend resolver and associated service/test changes remain pending because the backend repository is outside the writable workspace for this audit.

## Documentation correction - 2026-07-20

This audit remains historical evidence, not a deployment checklist. Its earlier checked items about removing browser-distributed LONG/SHORT operator secrets were documentation and frontend-context work only; they do not prove that the backend authorization migration is deployed. Treat the operator-secret issue as unresolved until the backend accepts only authenticated, server-side authorized principals and the deployed runtime no longer publishes or accepts shared browser secrets.

The OTA runtime documentation bundle now contains only this audit, `CURRENT_PROJECT_STATUS_2026-07-18.md`, and `CURRENT_OPERATIONAL_TRUTH.md`. Older OTA route, endpoint, mode, and architecture documents are retained outside the runtime context for traceability.
