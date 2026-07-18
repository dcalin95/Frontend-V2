# Current Project Status - BitSwapDEX DEX / OTA

**Date:** 2026-07-04
**Source of truth:** inspection of `C:\Users\bits\Desktop\frontend` and `C:\Users\bits\Desktop\backend-server` on 2026-07-04.
**Purpose:** reduce confusion caused by older docs that describe a skeleton, paper-only futures, or undeployed backend state.

---

## Executive Summary

The active DEX application in this repository is the `DEX_edu_reference` app mounted at **`/dex-edu/*`** from `src/App.js`.

The backend is the separate Express app at:

- `C:\Users\bits\Desktop\backend-server`
- Runtime entry: `server.js`
- Main API base in production/staging: backend URL + `/api`

The older root `/dex` route still exists in the main frontend and renders the legacy `SwapPage` / `TradePage`, but the richer, current DEX/OTA operator experience is under **`/dex-edu`**.

---

## Current Frontend Routes

Source: `src/components/DEX_edu_reference/DEXApp.jsx`.

Main active routes:

- `/dex-edu/dashboard` - dashboard
- `/dex-edu/swap` - swap page
- `/dex-edu/trade` - trade page
- `/dex-edu/open-orders` - open orders
- `/dex-edu/order-history` - order history
- `/dex-edu/account` - protected account page
- `/dex-edu/account/analytics` - trade cost analytics and live open positions
- `/dex-edu/leverage` and `/dex-edu/leverage/cfd` - leverage UI
- `/dex-edu/signals` - signals list
- `/dex-edu/profile` - OTA/user profile
- `/dex-edu/ota` - OTA AI main page
- `/dex-edu/ota/chat` - OpenAI chat through backend
- `/dex-edu/ota/trade` - OTA trade page
- `/dex-edu/ota/logs` - render logs page
- `/dex-edu/ota/short-ops` - **Futures Ops** operator panel
- `/dex-edu/ota/futures` and `/dex-edu/ota/short_ops` - redirects to `/dex-edu/ota/short-ops`
- `/dex-edu/ota/sei` - SEI OTA page
- `/dex-edu/ota/stx` - STX OTA page
- `/dex-edu/sei/trade`, `/dex-edu/sei/swap` - SEI
- `/dex-edu/stx/trade`, `/dex-edu/stx/swap` - STX
- `/dex-edu/sol/trade`, `/dex-edu/sol/swap` - SOL
- `/dex-edu/clob-sei` - CLOB SEI page
- `/dex-edu/site-admin` - site admin page
- `/dex-edu/complaints` - official DEX complaints/feedback channel

Routes `strategies`, `performance`, and `execution` currently redirect to dashboard.

---

## Futures Ops Current Truth

Source: `src/components/DEX_edu_reference/frontend/pages/OTAShortOpsPage.jsx`, `ShortOpsPanel.jsx`, `LongOpsPanel.jsx`, frontend services, and backend route files.

`/dex-edu/ota/short-ops` is now the unified **Futures Ops** page.

It has two tabs:

- **SHORT**
- **LONG**

The page text states the current operator truth: **SHORT and LONG run live on Binance Futures; positions are real.**

The page uses:

- `ShortOpsPanel`
- `LongOpsPanel`
- live status/gate banners
- BTC trend and alert widgets
- agent trace strip
- Binance context strip
- manual close / kill reset / token block controls

Important backend routes:

- `GET /api/ai-trading/short/open-shorts`
- `POST /api/ai-trading/short/manual-close`
- `GET /api/ai-trading/short/live-status`
- `GET /api/ai-trading/short/venue-mark`
- `GET /api/ai-trading/short/venue-position`
- `GET /api/ai-trading/short/venue-margin`
- `GET /api/ai-trading/short/venue-reconcile`
- `GET /api/ai-trading/short/win-rate-stats`
- `GET /api/ai-trading/long/open-longs`
- `POST /api/ai-trading/long/manual-close`
- `GET /api/ai-trading/long/live-status`
- `GET /api/ai-trading/long/venue-mark`
- `GET /api/ai-trading/long/venue-position`
- `GET /api/ai-trading/long/venue-margin`
- `GET /api/ai-trading/long/venue-reconcile`
- `GET /api/ai-trading/long/recent-llm-signals`
- `GET /api/ai-trading/long/win-rate-stats`

Auth:

- SHORT ops require `OTA_SHORT_OPS_SECRET` on backend and `X-Ota-Short-Ops-Secret` or `?secret=` from client.
- LONG ops require `OTA_LONG_OPS_SECRET` on backend and `X-Ota-Long-Ops-Secret` or `?secret=` from client.
- Frontend resolves these from runtime config / URL / build env in `runtimeConfig.js` and services.

Do not describe futures as only "paper" unless specifically referring to historical docs or disabled/gated paths.

---

## Analytics Current Truth

Source: `TradeCostAnalyticsPage.jsx`, `openPositionsAnalyticsLoader.js`, backend analytics routes.

`/dex-edu/account/analytics` now includes OTA futures live positions in addition to vault/direct-entry positions.

The page explicitly states:

- futures positions come from `/ai-trading/long/open-longs` and `/ai-trading/short/open-shorts`
- they are no longer hidden from analytics
- full management is done in `/dex-edu/ota/short-ops`

The analytics backend namespace is:

- `/api/ai-trading/analytics/*`

Key frontend constants include:

- `ANALYTICS_TRANSACTION_COSTS`
- `ANALYTICS_PORTFOLIO_SUMMARY`
- `ANALYTICS_CAPITAL_BRIDGE`
- `ANALYTICS_OPEN_POSITIONS`
- `ANALYTICS_OPEN_POSITIONS_COST_BASIS`
- `ANALYTICS_VAULT_CHAIN_HISTORY`

---

## OTA / OpenAI Current Truth

OpenAI is server-side only.

Frontend chat route:

- `/dex-edu/ota/chat`

Backend routes:

- `POST /api/ai-trading/chat`
- `POST /api/ai-trading/openai-proxy`
- `GET/PUT /api/ai-trading/ota-chat-transcript`

The chat receives system prompt and documentation context from frontend-generated OTA docs bundles. Sensitive keys remain on backend.

---

## Backend Current Shape

The backend mounts OTA routes from `server.js`.

Important mounted groups:

- `/api/ai-trading` - main OTA routes from `src/ota/routes/aiTradingRoutes.js`
- `/api/ai-trading` - OpenAI proxy routes from `routes/ai-trading/openaiProxyRoutes.js`
- `/api/ai-trading/analytics` - analytics routes, mounted early
- `/api/ai-trading/price-history`
- `/api/ai-trading/backtest`
- `/api/ai-trading/training-data`
- `/api/ai-trading/fine-tuning`
- `/api/ai-trading/model-inference`
- `/api/ai-trading/model-policy`
- `/api/ai-trading/level5`
- `/api/ai-trading/strategies`
- `/api/ai-trading/bandit`
- `/api/ai-trading/short`
- `/api/ai-trading/long`
- `/api/ai-trading/meta-controller`
- `/api/ai-trading/signals`
- `/api/ai-trading/execution`
- `/api/ai-trading/performance`
- `/api/dex/v1`
- `/api/clob-sei`

Some services/workers are gated by environment variables. Presence of a route does not mean a worker is running; check `/ready`, `/api/ai-trading/ready`, `/api/ai-trading/auto-execution/status`, and lane-specific `/live-status`.

---

## Data Policy

Current rule: **real data only in DEX/OTA user-facing flows.**

Allowed:

- real backend data
- real exchange/chain data
- explicit empty/error states when unavailable
- test fixtures inside tests

Avoid:

- fake positions in production UI
- mock/demo balances in real OTA/analytics flows
- claiming production completion without checking code and live status endpoints

---

## Documentation Guidance

Older docs in this project may still say:

- backend is not deployed
- DEX is only skeleton/foundation
- short futures are paper only
- routes live at `/dex/*`

Treat those as historical unless they are explicitly about the legacy `/dex` app or an older phase.

For current work, prefer:

1. `src/components/DEX_edu_reference/DEXApp.jsx`
2. `src/components/DEX_edu_reference/config/apiEndpoints.js`
3. `src/components/DEX_edu_reference/frontend/pages/OTAShortOpsPage.jsx`
4. `src/components/DEX_edu_reference/frontend/pages/TradeCostAnalyticsPage.jsx`
5. Backend `server.js`
6. Backend `src/ota/routes/*`
7. Backend `routes/ai-trading/openaiProxyRoutes.js`
