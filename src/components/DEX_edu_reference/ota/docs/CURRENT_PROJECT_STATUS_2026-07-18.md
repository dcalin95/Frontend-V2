# Current Project Status - 2026-07-18

## Canonical system

- Frontend: `C:\Users\bits\Desktop\frontend`
- Backend: `C:\Users\bits\Desktop\backend-server`
- Production: `https://bits-ai.io`
- DEX/OTA UI: `/dex-edu/*`
- API: `/api/*`

## Audit state

The full current audit is `docs/DOCUMENTATION_AUDIT_2026-07-18.md`.

Confirmed remediation work for this snapshot:

1. Restore missing mandatory root documentation entry points.
2. Remove stale repository/domain claims from the runtime OTA context.
3. Replace browser-visible SHORT/LONG shared-secret authorization with authenticated user/wallet ownership.
4. Preserve backend-only emergency secrets without publishing them to S3.
5. Verify the changes with focused tests and a production build.

## Non-negotiable truths

- The system can improve selection, execution, and risk controls, but cannot guarantee profit.
- Browser-delivered secrets are public and must not authorize privileged operations.
- A frontend `Admin` badge or route is not authorization; the backend decides access.
- User passwords are not recoverable or displayable because only password hashes are stored.
- Uploaded identity and banking documents are not automatically verified unless a certified KYC integration explicitly performs that verification.

## Historical documents

Protected context documents are retained for traceability. Any references there to `frontend-edu`, `backend-server-repo`, `edu.bits-ai.io`, `/dex/*`, an undeployed backend, or mock-only production behavior are historical unless reaffirmed here.

## Verification record

Verification completed for the writable frontend workspace and read-only backend inspection:

- frontend focused authentication tests: 2 suites, 10 tests passed;
- backend reconciliation/analytics tests: 3 suites, 63 tests passed;
- frontend production build: passed;
- documentation context generator: passed;
- `git diff --check`: passed.

These results do not close the backend position contradiction because the existing backend test suite still contains an expectation for the defective long-position omission.

## Documentation correction - 2026-07-20

This file is an evidence snapshot, not proof that every listed remediation is deployed. The browser-distributed LONG/SHORT operator-secret problem remains unresolved until the backend requires authenticated, server-side authorized ownership and rejects shared browser secrets. The runtime OTA documentation context now excludes legacy `OTA_01` through `OTA_07` files; use `CURRENT_OPERATIONAL_TRUTH.md` for operational rules.

## Position reconciliation finding

The attached OTA audit found a confirmed backend contradiction: `getOpenPositionsResult()` returns `longPositions` in `allPositions` but excludes them from `trackedPositionsForRecon`. This is sufficient to produce `positionsReturned: 1` with `trackedCount: 0` while the standalone long monitor reports `openCount: 1`. See `docs/OTA_POSITION_RECONCILIATION_AUDIT_2026-07-18.md` for the source map and required backend patch. Production is not considered fixed until the backend resolver is deployed and the focused reconciliation tests pass.
