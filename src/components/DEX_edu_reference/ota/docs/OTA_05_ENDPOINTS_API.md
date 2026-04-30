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
