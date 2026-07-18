# Index documentație OTA (ota/docs)

Documentația din acest folder este pentru OTA AI și poate fi folosită de tine sau de un assistant (ex. chat) care primește aceste fișiere ca context.

| Fișier | Conținut |
|--------|----------|
| **OTA_01_CE_ESTE_OTA.md** | Ce este OTA, provider OpenAI, moduri acces și trading. |
| **OTA_02_ARHITECTURA.md** | Frontend, backend, contracte, flux analiză. |
| **OTA_03_MODURI_TRADING.md** | Advisory, Assisted, Auto – definiții, disponibilitate, UI. |
| **OTA_04_OPENAI_ANALIZA.md** | Model, key, endpoint analyze, surse prompt, record-outcome, chat. |
| **OTA_05_ENDPOINTS_API.md** | Lista endpoint-uri /api/ai-trading/*. |
| **OTA_06_LEARNING_FEATURES.md** | Panouri: Backtest, Strategy Execution, ML, Bandit, Meta, Risk, AutoTradePanel. |
| **OTA_07_RUTE_UI.md** | Rute DEX: /dex/ota, /dex/ota/chat, /dex/swap, etc. |
| **OTA_08_INDEX_DOCUMENTATIE.md** | Acest index. |
| **PROMPT_OTA_IDENTITATE_SI_REGULI.md** | Prompt de sistem: cine e proprietarul, ce trebuie să facă OTA, reguli. |
| **CUM_ACCESEZI_OPENAI_CHAT.md** | Cum accesezi chat-ul și unde pui documentația. |
| **PROPRIETAR_OTA_GHID_COMPLET.md** | Ghid complet proprietar: chat, docs, acces fișiere. |
| **OTA_AI_FULL_FUNCTIONAL_ROADMAP.md** | Ce se poate implementa ca OTA să fie full funcțional (fără erori/halucinații), la nivel de Agent AI (Cursor-style): RAG, tools, structured outputs, anti-halucinație. |
| **OTA_LLM_TRADING_SPEC.md** | Funcția LLM de trading: zonă de trading separată, setări OTA (policy/limite), cum OTA poate lua decizia de a executa swap când setările permit; script: scripts/ota-llm-trading-ref.js. |
| **CURRENT_PROJECT_STATUS_2026-07-04.md** | Snapshot curent frontend + backend: rute `/dex-edu`, Futures Ops SHORT/LONG live, analytics, backend route mounts, reguli anti-confuzie pentru documente vechi. |

**Sursa completă:** Documentația din `docs/` (OTA_ARCHITECTURE.md, OTA_OPENAI_DOCUMENTATION.md, OTA_TRADING_MODES.md, OTA_LLM_LEARNING_AND_IMPROVEMENTS.md, OTA_OTA_MODE_AUTO_UI_AND_LLM_LEARNING.md, etc.) a fost extrasă și consolidată în aceste fișiere pentru referință rapidă și pentru a fi folosită în logică/prompt.

---

## Index update - 2026-07-17

| File | Current role |
| --- | --- |
| **CURRENT_PROJECT_STATUS_2026-07-17.md** | Current frontend SSOT; read first. |
| **CURRENT_PROJECT_STATUS_2026-07-04.md** | Historical snapshot; superseded for current claims. |
| `C:\Users\bits\Desktop\frontend\docs\DOCUMENTATION_AUDIT_2026-07-17.md` | Frontend documentation classification and contradiction audit. |
| `C:\Users\bits\Desktop\backend-server\docs\CURRENT_PROJECT_STATUS_2026-07-17.md` | Current backend SSOT. |

Old route, paper-only, undeployed, mock and broad production-ready wording must be interpreted through the current snapshot and verified against runtime behavior.

---

## Added for context - 2026-07-04

Pentru lucrul curent, citește mai întâi `CURRENT_PROJECT_STATUS_2026-07-04.md`. Documentele mai vechi rămân utile istoric, dar pot descrie etape depășite: `/dex` în loc de `/dex-edu`, backend nedeployat, futures paper-only sau arhitectură skeleton.
