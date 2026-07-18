# Documentation Audit - Frontend - 2026-07-17

## Scope

- Repository: `C:\Users\bits\Desktop\frontend`.
- Reviewed documentation-like files after audit artifacts were added: 262.
- Files already under `_archive`: 72.
- The per-file classification is recorded in `docs/DOCUMENTATION_CATALOG_2026-07-17.md`.
- Cross-repository backend documentation was reviewed separately in `C:\Users\bits\Desktop\backend-server\docs\DOCUMENTATION_AUDIT_2026-07-17.md`.

## Classification policy

| Class | Meaning | Authority |
| --- | --- | --- |
| Current SSOT | Dated status snapshot, context manifest, product truth and current OTA index | Use first |
| Active contract | Architecture, API or operational contract confirmed by current code | Use with live verification |
| Historical evidence | Phase reports, old audits, migration notes and superseded status documents | Context only |
| Generated diagnostic | Test output, logs, generated bundles and temporary reports | Never treat as product truth |

## Findings

- **High:** `src/components/DEX_edu_reference/ota/docs/otaSystemPrompt.js`, the runtime prompt used by OTA chat, still names nonexistent roots `frontend-edu` and `backend-server-repo` and advertises an `ota-memory-server` script that is not present in this repository. The Markdown source now carries a correction, but the generated runtime prompt has not been synchronized. Until code is updated and tested, OTA chat can still give wrong file-access instructions.
- Fifteen non-archived files contain an undeployed-backend claim.
- Six contain paper-only claims.
- Twenty-one contain broad production-ready wording.
- Thirteen mention mock or fallback behavior.
- Fifteen mention legacy `/dex/ota` or `/dex/profile` routes.
- These matches are not all defects: many are valid historical evidence. The defect was the absence of a clear current supersession rule.

## Resolution

- Added `src/components/DEX_edu_reference/ota/docs/CURRENT_PROJECT_STATUS_2026-07-17.md` as the dated frontend SSOT.
- Preserved historical files instead of deleting or rewriting evidence.
- Updated the mandatory context and OTA indexes to point to the new snapshot.
- Defined `/dex-edu/*` as the active richer product surface and `/dex/*` as legacy.
- Recorded authentication, payment-accounting and OTA-profit truth explicitly.
- Recorded public runtime operator secrets and missing S3 versioning as known risks.
- Recorded the runtime-prompt/documentation mismatch as a code follow-up; this documentation-only audit does not silently modify the OTA chat behavior.

## Cross-repository operational evidence - 2026-07-18

- Backend OTA stability: 24 suites and 252 tests passed.
- Live post-deploy read-only checks passed for health, readiness, token configuration and tracked-token coverage.
- Analytics PnL and database migration evidence remain incomplete because the audit environment lacked `OTA_USER_ID` and `DATABASE_URL` respectively.

## Rules for future documentation

1. Every operational snapshot must have a date and list its evidence.
2. Do not use `FINAL`, `COMPLETE` or `PRODUCTION READY` as proof.
3. Never publish secret values, session tokens, private keys or signed URLs.
4. Do not promise profit. State costs, evidence size and unresolved risk.
5. When a contract changes, update the current snapshot and index in the same change.
6. Preserve historical reports, but label them historical and link to the current SSOT.
