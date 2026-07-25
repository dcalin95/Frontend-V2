# Documentation and Deployment Audit — 2026-07-25

## Current system map

- Primary public application: `https://bits-ai.io`
- Frontend repository on this workstation: `C:\Users\bits\Desktop\frontend`
- Frontend Git remote: `https://github.com/dcalin95/Frontend.git`
- Frontend production path: GitHub Actions → AWS S3 bucket `bits-ai.io` → CloudFront distribution `E2TIH6RJTHIT1M`
- Backend repository on this workstation: `C:\Users\bits\Desktop\backend-server`
- Backend Git remote: `https://github.com/dcalin95/backend-server.git`
- Backend production service: `https://backend-server-eu.onrender.com`
- Backend production path: Render service `backend-server`, branch `main`, automatic deployment enabled

## Product purpose

BITS is a public Web3 application combining the BITS presale, staking and rewards,
wallet/portfolio tools, educational content, DEX functionality, and OTA market
analysis/operations. OTA is evidence-based software with explicit risk controls; it
does not guarantee profit.

## Live verification performed

On 2026-07-25:

- `https://bits-ai.io/runtime-config.json` returned HTTP 200 and pointed API,
  backend, and auth traffic to the EU backend.
- `https://backend-server-eu.onrender.com/health` returned HTTP 200 with status `ok`.
- `https://backend-server-eu.onrender.com/api/ai-trading/health` returned HTTP 200
  with OTA service status `ok`.
- The public runtime configuration did not expose OTA operations secrets.

## Corrections made locally

- Standardized active frontend backend fallbacks on
  `https://backend-server-eu.onrender.com`.
- Removed client/runtime handling of OTA short/long operations secrets. Sensitive
  routes use authenticated wallet sessions; browser-delivered shared secrets are
  not an acceptable boundary.
- Removed browser-side Pinata secret use and made the unsupported direct NFT upload
  path fail closed until an authenticated backend upload endpoint exists.
- Removed admin-password metadata from browser logs.
- Repaired the root README, which contained a merge artifact and leaked credential
  text.
- Corrected Render's `REACT_APP_BACKEND_URL` value to the active EU hostname.
- Made explicit billing refresh bypass the short GET deduplication cache.
- Updated tests to isolate runtime configuration and current English UI labels.
- Removed the backend `.env` file from Git tracking while leaving the local file in
  place for the workstation.

## Security action still required

The backend `.env` was present in Git history and contained production-style
credentials. Removing it from the current index does not erase history. Every
credential ever stored there must be treated as exposed and rotated at its
provider, then updated in Render or the relevant secret store. History
sanitization should be planned separately because rewriting shared Git history is
disruptive.

## Verification

- Frontend: 58 test suites, 465 tests passed.
- Frontend optimized production build: passed.
- Backend focused resolver, analytics-route, and wallet-auth tests: 4 suites,
  31 tests passed.
- Canonical open-position reconciliation is present in the backend and covered by
  tests, including futures positions without matching spot execution history.
- No deployment was performed during this audit.

## Operational rule

Use this audit together with `CURRENT_OPERATIONAL_TRUTH.md`. Older hostnames,
browser-shared operations secrets, and historical DEX prototype deployment notes
must not be used as current production instructions.
