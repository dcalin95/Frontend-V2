# Endpoints API OTA (SSOT)

**Bază:** getApiBaseUrl() + calea de mai jos (ex: `/api` + `/ai-trading/health`).

| Endpoint | Metodă | Scop |
|----------|--------|------|
| /ai-trading/health | GET | Health check serviciu |
| /ai-trading/ready | GET | Readiness (OpenAI disponibil, circuit breaker) |
| /ai-trading/analyze | POST | Analiză piață OpenAI |
| /ai-trading/record-outcome | POST | Înregistrare outcome manual (post-swap) |
| /ai-trading/quote | GET | Quote swap |
| /ai-trading/swap-tx | GET | Date tranzacție swap |
| /ai-trading/chat | POST | Chat direct cu OpenAI (același key) |
| /ai-trading/ota-memory/apply | POST | Memorie OTA (SAVE/DELETE) – funcționează și pe S3, vezi OTA_AGENT_BACKEND_API.md |
| /ai-trading/ota-vault/set | POST | Vault – informații sensibile (doar proprietar verificat) |
| /ai-trading/ota-vault/get | GET | Citire vault – doar pentru utilizatorul autentificat |
| /ai-trading/ota-files/read | GET | Citire fișier din repo backend (Proprietar), opțional |
| /ai-trading/ota-files/list | GET | Listare director backend, opțional |
| /ai-trading/registration-status | GET | Status înregistrare OTA |
| /ai-trading/register | POST | Pregătire tranzacție înregistrare |
| /ai-trading/authorize-bot | POST | Pregătire tranzacție autorizare bot |
| /ai-trading/policy/get, /policy/set | GET/POST | Policy (limits, allowlist) |
| /ai-trading/circuit-breaker/reset | POST | Reset circuit breaker OpenAI |
| /ai-trading/status | GET | Status bot (start/stop) |
| /ai-trading/stats | GET | Statistici bot |

**SSOT în cod:** src/config/apiEndpoints.js (API_ENDPOINTS).

---

## Added for context - 2026-07-04

Lista de mai sus este o listă scurtă istorică. Pentru starea curentă completă, folosește:

- frontend `src/components/DEX_edu_reference/config/apiEndpoints.js`
- backend `server.js`
- backend `src/ota/routes/aiTradingRoutes.js`
- backend `src/ota/routes/shortOpsRoutes.js`
- backend `src/ota/routes/longOpsRoutes.js`
- backend `routes/ai-trading/openaiProxyRoutes.js`
- snapshot: `CURRENT_PROJECT_STATUS_2026-07-04.md`

Endpoint groups active/current from code inspection:

| Group | Base | Notes |
|------|------|-------|
| OTA core | `/api/ai-trading/*` | health, ready, market, quote, analyze, record-outcome, policy, registration, safety, auto status, direct-entry, tasks |
| OpenAI proxy/chat | `/api/ai-trading/openai-proxy`, `/api/ai-trading/chat` | OpenAI key stays on backend |
| Chat transcript | `/api/ai-trading/ota-chat-transcript` | GET/PUT per wallet/user |
| Analytics | `/api/ai-trading/analytics/*` | transaction costs, portfolio summary, open positions, vault chain history |
| Futures SHORT | `/api/ai-trading/short/*` | requires `OTA_SHORT_OPS_SECRET`; open-shorts, manual-close, live-status, venue probes, kill/token blocks, win-rate stats |
| Futures LONG | `/api/ai-trading/long/*` | requires `OTA_LONG_OPS_SECRET`; open-longs, manual-close, live-status, venue probes, kill/token blocks, recent LLM signals, win-rate stats |
| Signals | `/api/ai-trading/signals/*` | list, stream, generate, performance, validate |
| Execution | `/api/ai-trading/execution/*` | execute, trades, cancel |
| Performance | `/api/ai-trading/performance/*` | metrics, risk, token breakdown, history, charts |
| Backtest/training/model | `/api/ai-trading/backtest/*`, `/training-data/*`, `/model-inference/*`, `/model-policy/*`, `/fine-tuning/*` | AI learning/control-plane |
| SEI/STX/Grid | `/api/ai-trading/sei/*`, `/stx/*`, `/grid/*` | chain-specific workers/settings |
| DEX API | `/api/dex/v1/*` | DEX auth/orders/trades/matching/leverage demo |
| CLOB SEI | `/api/clob-sei/*` | indexer/market routes |
