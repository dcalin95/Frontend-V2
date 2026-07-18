# Current Project Status - 2026-07-17

This is the current frontend status snapshot for the BitSwapDEX DEX/OTA application. It supersedes older status claims, but it does not erase historical reports. Runtime code and live probes take precedence over this file.

## Read order

1. This snapshot.
2. `../../__PROJECT_CONTEXT__/00_READ_THIS_FIRST.md` and the mandatory context files listed there.
3. Backend snapshot: `C:\Users\bits\Desktop\backend-server\docs\CURRENT_PROJECT_STATUS_2026-07-17.md`.
4. Backend production contract: `C:\Users\bits\Desktop\backend-server\docs\OTA_PRODUCTION_CONTRACT.md`.

## Repository and deployment truth

- Frontend repository: `C:\Users\bits\Desktop\frontend`.
- Production domain: `https://bits-ai.io`.
- The richer current DEX/OTA application is mounted under `/dex-edu/*`.
- `/dex/*` remains a legacy surface and must not be treated as the complete current OTA product.
- Frontend production is an S3-hosted static build. Deployment must preserve runtime OTA configuration and existing hashed assets until the new build is verified.
- Backend repository: `C:\Users\bits\Desktop\backend-server`.
- Backend API is available through the first-party `/api/*` path on `bits-ai.io` and through the Render service.

## Current user-facing capabilities

- OTA dashboard, chat, governance, auto-trading configuration and telemetry.
- Futures Ops with separate SHORT and LONG operator views.
- Account analytics with OTA futures positions and recorded PnL data.
- Google, email/password and wallet authentication. Wallet authentication uses first-party `/api/auth/*` endpoints so the browser session remains on the production origin.
- Authenticated password change. Passwords are never recoverable or displayable because the backend stores password hashes, not plaintext passwords.
- Stripe payment history is distinct from Vault deposit balance. A completed product payment can appear in history and total spent without increasing the Vault balance.
- BSC transfer tracking for transfers over USD 1M, with private-wallet filtering, recurring routes and expandable wallet intelligence.

## OTA and profit truth

- OTA can rank, block, open, manage and close positions only when the relevant policy, risk, accounting, venue and authorization gates permit it.
- A mounted route, a visible button or an AI signal is not proof that an execution worker is enabled.
- AI output is advisory evidence inside the decision system; it is not a profit guarantee.
- Profitability must be measured from resolved real outcomes after venue fees, funding, gas where relevant, slippage and other execution costs.
- Fine-tuning success is not execution proof. OpenAI quota failures must degrade safely and must not silently authorize trades.

## Verified production checks

Checked on 2026-07-17:

| Check | Result |
| --- | --- |
| `GET https://bits-ai.io/api/health` | HTTP 200, JSON |
| `GET https://bits-ai.io/api/ready` | HTTP 200, JSON |
| `GET https://bits-ai.io/api/ai-trading/health` | HTTP 200, JSON |
| `GET https://bits-ai.io/api/ai-trading/ota-config-health` | HTTP 200, JSON |
| Wallet auth origin | First-party `/api/*` |
| Password change backend | Implemented in backend commit `075dbcc3` |
| Frontend wallet auth fix | Commit `5385bc4` |
| Runtime-secret deploy preservation | Commit `491304f` |
| Safety documentation rule | Commit `b8bab3e` |

## Known risks and required follow-up

- The generated runtime chat prompt `otaSystemPrompt.js` still contains old repository roots and local-memory-server instructions. Synchronize and test it before relying on OTA chat for file access.
- The current operator-panel authorization secrets are present in public runtime configuration. This is a security debt, not a desired architecture. Migrate operator authorization to an authenticated owner session or a backend-only control channel before removing the compatibility mechanism.
- S3 object versioning is not enabled. A bad static deployment therefore has a larger recovery risk.
- RPC, exchange, OpenAI, Stripe and email services are external dependencies. Their availability must be surfaced explicitly and failure must be fail-closed for money-moving actions.
- Historical documents may still contain old `/dex/*`, paper-only, mock, undeployed or production-ready claims. Use the documentation audit and this snapshot to interpret them.
- No documentation or UI claim may promise profit or imply that losses are impossible.

## Supersession rule

For current-state questions, this file supersedes `CURRENT_PROJECT_STATUS_2026-07-04.md`. The older file remains historical evidence. If code, live probes and this snapshot disagree, record the discrepancy and trust verified runtime behavior first.
