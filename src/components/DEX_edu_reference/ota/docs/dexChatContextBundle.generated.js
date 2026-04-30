/**
 * AUTO-GENERATED – nu edita manual.
 * Sursă: dexChatContext.manifest.json + fișierele listate acolo.
 * Regenerează: node scripts/sync-dex-chat-context.js
 */
export function getOtaDocsContextForPrompt() {
  return `# CONTEXT DOCUMENTAȚIE DEX + OTA (bundle)

Acest text este injectat în system prompt pentru /dex-edu/ota/chat. Răspunde pe baza lui pentru structură DEX, rute, OTA, contracte, reguli UI.

---

## FILE: docs/AI_CONTEXT.md

# AI Context (SSOT Map)

## 📁 Local File Paths & Deployment (MANDATORY REFERENCE)

**See:** \`docs/PROJECT_REPOS_AND_DEPLOYMENT.md\` – path-uri exacte și unde rulează fiecare aplicație.

**Quick Reference:**
- **Frontend (Active):** \`C:\\Users\\bits\\Desktop\\frontend-edu\` ✅ – rulează local (dev) și pe S3 (prod).
- **Backend:** \`C:\\Users\\bits\\Desktop\\backend-server\` – **NU rulează local; rulează pe Render.** Codul se editează local, aplicația live e pe Render.
- Frontend (Alt): \`C:\\Users\\bits\\Desktop\\frontend\`
- Remix: \`C:\\Users\\bits\\Desktop\\remix\`

## SSOT (Single Source of Truth)

### Data Policy (MANDATORY)
- **SSOT:** \`docs/DATA_POLICY.md\` – **DOAR DATE REALE.** Interzis: fake, mock, demo, hardcodat (date), minciună, „dezvoltare” ca scuză. Real data or error/empty only. Supersedes any conflicting text in other docs.

### API Endpoints
- **SSOT:** \`src/config/apiEndpoints.js\` - Single source of truth for all API endpoints
- **Re-export (backward compat):** \`src/components/DEX/frontend/utils/constants.js\` - Re-exports from SSOT
- **Rule:** Always import from SSOT. Do NOT create duplicate endpoint definitions.

### OTA AI (On-Token-Agent / OpenAI Trading Agent)
- **Index documentație:** \`docs/README.md\` – secțiunea OTA listează documentele OTA active. Doar date reale (DATA_POLICY).
- **Arhitectură SSOT:** \`docs/OTA_ARCHITECTURE.md\` – structură /dex-edu/ota, componente, API, contracte, fluxuri. Fără demo data – doar real sau empty. Assisted mode folosește /dex-edu/swap (AssistedTradePanel a fost eliminat).

### OTA Trading Modes
- **SSOT:** \`src/components/DEX/frontend/utils/otaTradingModes.js\` - Trading mode constants
- **Hook:** \`src/components/DEX/frontend/hooks/useOTAMode.js\` - Trading mode management
- **Rule:** Access Level (guest/preview/full) and Trading Mode (advisory/assisted/auto) are ORTHOGONAL concepts. Do NOT confuse them.

### OTA Access Control
- **Access Level Hook:** \`src/components/DEX/frontend/hooks/useOTAAccess.js\`
- **Registration Hook:** \`src/components/DEX/frontend/hooks/useOTARegistration.js\`
- **Rule:** Access Level determines data visibility. Trading Mode determines execution method.

### OTA flow (Authorize Bot → executeTrade → executeSwapForUser)
- **SSOT:** \`docs/OTA_FLOW_AND_CONTRACT_LOGIC.md\` – cine trebuie autorizat (BOT_WALLET EOA), ce verifică UserVault / OTAAutoExecutor / OTAPolicyManager. Frontend: adresa bot doar de la backend GET /api/ai-trading/bot-address (fără ENV).

### DEX UI language
- **Rule:** **UI is in English, not Romanian.** All user-facing labels, buttons, toasts, and messages in the DEX must be in English. See \`docs/DEX_UI_LANGUAGE.md\`.

### DEX Swap & Trade UI
- **SSOT:** \`docs/DEX_SWAP_TRADE_UI.md\` – Header Swap (Token Selector, Open Orders, Order History, Close, Home), layout Trade, panoul Open Orders / Order History, footer Limit, flux ordin.
- **Reguli:** Swap header → portal în \`#dex-header-center-slot\`. Ordine deschise doar în panoul de jos pe Trade (nu în panoul Buy/Sell).

### DEX Background (MANDATORY)
- **Regulă:** **Background-ul DEX este negru pur (#000000), ca Oxium** – [app.oxium.xyz](https://app.oxium.xyz) – negru negru dark strălucitor. Toate paginile, main content, body și containere folosesc \`#000000\`. Interzis: \`rgba(255,255,255,X)\` pe background (creează gri), nuanțe gri (#0a0a0a, #0f0f0f etc.), gradiente pentru fundal. Vezi \`docs/DEX_THEMES.md\`.

<Auth SSOT paths TBD after discovery>
<Wallet SSOT paths TBD after discovery>

## Auth map
- Entry points (routes/layouts): <TBD>
- Canonical components/services: <TBD>
- Forbidden duplicates: AuthModal, Login, Register, SignIn, SignUp

## Wallet map
- Entry points: <TBD>
- Canonical provider/context/connector: <TBD>
- Forbidden duplicates: WalletContext, WalletProvider

---

## FILE: docs/PROJECT_REPOS_AND_DEPLOYMENT.md

# Repos și deployment – referință obligatorie

**Data:** 2026-02-01  
**Scop:** Locațiile exacte ale repo-urilor și unde rulează aplicațiile. **Citește acest doc înainte de task-uri care ating backend sau deployment.**

---

## Repo-uri locale (path-uri exacte)

| Repo | Path local | Unde rulează aplicația |
|------|------------|-------------------------|
| **Frontend (activ)** | \`C:\\Users\\bits\\Desktop\\frontend-edu\` | Dev: local (npm run dev / localhost). Prod: S3 + CloudFront (edu.bits-ai.io). |
| **Backend** | \`C:\\Users\\bits\\Desktop\\backend-server\` | **Rulează pe Render, NU local.** API-ul live este pe Render; nu există server backend pornit local. |
| **Remix (contracte)** | \`C:\\Users\\bits\\Desktop\\remix\` | Local / Remix IDE. Contracte OTA: \`remix/OTA/BSC/\`. |

---

## Backend: regula importantă

- **Backend-ul rulează deja pe Render** (API live: backend-server-f82y.onrender.com). Nu e nevoie să pornești server backend local.
- **Codul backend** se editează local în: \`C:\\Users\\bits\\Desktop\\backend-server\`.
- **Aplicația backend** (Node.js/Express) **nu rulează local** – rulează exclusiv pe **Render**.
- Pentru modificări backend: editezi în \`backend-server\`, faci push; Render face auto-deploy. Testarea se face împotriva API-ului de pe Render (sau prin frontend care apelează Render).
- Variabile de mediu, migrații DB, loguri: toate se gestionează pe **Render Dashboard** (backend-server service).

## ⚠️ Nu există server backend în frontend-edu (este fals)

- **În repo-ul frontend-edu NU există server backend.** Orice cod sau folder care pare „backend” în acest repo **nu este backend-ul real**:
  - **\`src/utils/backend.js\`** – este **client API** (apelează API-ul de pe Render); nu este un server.
  - *(Fostul folder \`_archive/backend-local/\` a fost șters – nu există cod server backend în frontend-edu.)*
- **Backend-ul real** este doar: **\`C:\\Users\\bits\\Desktop\\backend-server\`**, și **rulează pe Render**, nu local și nu în altă parte.
- Frontend-ul (edu.bits-ai.io) folosește **runtime-config.json** sau env pentru URL către Render; acel URL trebuie să pointeze la backend-server-f82y.onrender.com.

---

## Frontend

- **Proiectul activ** este \`frontend-edu\`. Build (Vite), deploy: \`dist/\` pe S3, URL producție edu.bits-ai.io.
- Frontend apelează backend-ul prin URL din runtime-config sau \`REACT_APP_BACKEND_URL\` (în producție: URL Render).

## Hostname canonic vs confuzie frecventă (DNS)

- **Canonic (același nume ca bucket-ul S3 + doc-ul acestui repo):** \`https://edu.bits-ai.io\` — cratimă între \`bits\` și \`ai\` (\`bits-ai.io\`).
- **Nu este același domeniu:** \`https://edu.bits.ai.io\` — punct între \`bits\` și \`ai\` (zonă DNS \`bits.ai.io\`). Poate exista ca CNAME separat sau bookmark greșit; **deploy-ul din \`frontend-edu\` urcă în bucket \`edu.bits-ai.io\`**, iar distribuția CloudFront din \`.env\` trebuie să fie cea atașată la **\`edu.bits-ai.io\`**.
- **Acțiune AWS (în afara repo):** dacă ambele hosturi trebuie să servească același site, în Route53/CloudFront setează alias sau redirect explicit; altfel folosește doar **\`https://edu.bits-ai.io\`** în bookmark-uri și în CORS pe backend.

---

## Referințe rapide

- Backend env / runbook: \`docs/OTA_AI_AUTO_BACKEND_ENV_AND_RUNBOOK.md\`, \`docs/DEX_RENDER_BACKEND_ENV_WRAPPER.md\`.
- Arhitectură OTA (frontend + backend): \`docs/OTA_ARCHITECTURE.md\`.

**Last updated:** 2026-03-20

---

## FILE: docs/DATA_POLICY.md

# Politica de date – SSOT (Single Source of Truth)

**Data:** 2026-02-01  
**Scop:** Regulă obligatorie pentru tot proiectul. Supersedează orice text contradictoriu din alte documente.

---

## Regula de aur: DOAR DATE REALE

**În aplicație se folosesc DOAR date reale.**  
Nu există excepții: nu fake, nu mock, nu demo, nu hardcodat (date inventate), nu minciună, nu „dezvoltare” ca scuză.

---

## Reguli absolute (fără excepții)

1. **DOAR DATE REALE** – Orice date afișate sau folosite în fluxuri provin din API-uri reale (backend, Binance, blockchain, etc.) sau sunt stare de eroare/listă goală, clar etichetate.
2. **FĂRĂ DATE FAKE** – Interzis orice date inventate, simulate sau false.
3. **FĂRĂ MOCK** – Interzis folosirea de date mock în fluxuri de aplicație (producție sau „development”). Mock doar în \`__tests__/*\` pentru unit tests.
4. **FĂRĂ DEMO** – Interzis date demo, ecrane demo cu date inventate, „preview cu demo data”. La preview: fie date reale (dacă există acces), fie mesaj clar / listă goală.
5. **FĂRĂ HARDCODAT (DATE)** – Interzis date hardcodate în cod (ex: listă de tranzacții false, user-123, semnale inventate). Config (URL-uri, adrese contract) din env/config este permis.
6. **FĂRĂ MINCIUNI** – Nu se afișează nimic care să sugereze date reale dacă datele nu sunt reale.
7. **FĂRĂ FALSEURI** – Nu se folosesc fallback-uri la mock/fake/demo pentru a „umple” UI-ul. La lipsă de date: stare de eroare sau listă goală, clar etichetată.
8. **FĂRĂ JUSTIFICARE „DEZVOLTARE”** – Modul „development” sau „not production ready” **nu** justifică date false, mock, demo sau comportament înșelător. Fie date reale, fie eroare/goale.
9. **FĂRĂ MARKETING ÎNȘELĂTOR** – Interzis text care promite rezultate (cel mai bun, optimal, garantat). Descrieri funcționale da; promisiuni de performanță nu.

---

## Ce este permis

- **Date reale** din API-uri reale (backend, Binance, blockchain, etc.).
- **Stare de eroare** când API-ul/backend-ul nu răspunde – mesaj clar, fără date inventate.
- **Liste/goale** când nu există date – afișare explicită „fără date” / empty state.
- **Config din env** – URL-uri, adrese contract, chei – din \`runtime-config.json\`, \`apiEndpoints.js\`, env vars. Nu „date de afișat” inventate.
- **Mock doar în teste** – în fișiere \`__tests__/*\`, pentru unit tests; niciodată în fluxul normal al aplicației.

---

## Ce este interzis

- Date mock/fake/demo în UI sau în fluxuri de date normale.
- Fallback la mockData.js sau orice sursă de date inventate pentru a evita erori sau ecrane goale.
- Formulări de tip „development mode deci putem folosi mock/demo”.
- Afișare de conținut care pretinde a fi real dar provine din surse false.
- Hardcodare de date de afișat (tranzacții, semnale, user-123, etc.).
- Text de marketing care promite rezultate („best", „optimal", „guaranteed") sau sugerează certitudini false.

---

## Validare reală (fără mock, fără date false)

**Singura validare care dovedește comportament real:** flux real, backend real, date reale. Fără mock, fără falsuri, fără hardcodări, fără marketing.

- **Smoke checklist + backend live:** \`scripts/ota-smoke-checklist.md\` + \`scripts/ota-smoke-check-apis.js\` pe URL backend real = validare că API-urile și fluxul răspund.
- **Testele unitare din \`__tests__/*\`** folosesc mock-uri doar pentru izolare; verifică structură/regresie UI. **Nu înlocuiesc** validarea reală și **nu dovedesc** că datele sau răspunsurile sunt reale.
- În **aplicație (flux normal):** zero mock, zero date false, zero minciuni. Fie date reale, fie eroare/goale.

---

## Referințe

- OTA: \`docs/OTA_PRODUCTION_NO_MOCK.md\` – aliniat cu această politică.
- DEX: orice referință la „mock fallback”, „demo data” sau „development mode” pentru date este **supersedată** de acest document.

**Last updated:** 2026-02-03 — Regula 9 (fără marketing înșelător); OTATutorial + MarketAnalysis: limbaj fără promisiuni (best/optimal/garantat).

---

## FILE: docs/DEX_UI_LANGUAGE.md

# DEX UI language

**Rule: The DEX UI is in English, not Romanian.**

All user-facing text in the DEX (labels, buttons, toasts, placeholders, aria-labels, error messages) must be written in **English**. This includes:

- Profile page (OTAProfilePage): edit profile, phone, bank, **legal trading documents** (document type selector, upload button, list labels, verification status, toasts).
- Trade, Swap, Leverage, OTA, and any other DEX screens.
- Auth flows (login, register, wallet connect) when rendered inside the DEX.

Internal documentation, code comments, and repo docs may use Romanian; the **visible UI language is English only.**

**Reference:** \`src/components/DEX/frontend/\` – all strings shown to the user must be in English.

---

## FILE: docs/DEX_SWAP_TRADE_UI.md

# DEX – Swap & Trade UI (referință completă)

**Data:** 2026-01-30  
**Scop:** Documentație SSOT pentru paginile Swap și Trade (header, footer, navigare, ordine).

---

## Pagina /dex-edu/swap

**URL:** \`http://127.0.0.1:3000/dex-edu/swap\` (dev) / \`/dex-edu/swap\` (prod)

### Header (portal în \`#dex-header-center-slot\`)

Toolbar-ul Swap se injectează în header-ul DEX și conține:

| Element | Descriere | Acțiune |
|--------|-----------|---------|
| **HeaderTokenSelector** | Selector token (BNB, BTC, etc.) | Schimbă perechea pentru Swap/Limit |
| **Open Orders** | Buton cu icon ClipboardList | Navigare la \`/dex-edu/open-orders\` |
| **Order History** | Buton cu icon History | Navigare la \`/dex-edu/order-history\` |
| **Close** | Buton cu icon X | Navigare la \`/dex-edu/trade\` |
| **Home** | Buton cu icon Home | Navigare la \`/dex-edu/dashboard\` |

**Fișiere:** \`src/components/DEX/frontend/pages/Swap.jsx\`, \`src/components/DEX/frontend/styles/components/swap-header-toolbar.css\`

### Conținut pagină

- **Tab-uri:** Swap | Limit (ca Oxium).
- **Swap tab:** \`SwapPanel\` – swap instant (Pay/Receive, quote, Approve/Swap).
- **Limit tab:** \`LimitOrderPanel\` – limit orders (Buy/Sell, Price, Amount, Risk Management, Place Order).
- **Footer Limit:** același chenar ca pe Trade (border, border-radius, background, buton Place Order albastru/roșu după Buy/Sell). Stiluri: \`swap-page.css\` (\`.swap-page-content .limit-order-panel-container .ui-card-footer\`).

### Fără scroll

- \`.ai-trading-main-content:has(.swap-page)\` → \`overflow: hidden !important\`.
- La schimbare tab Limit nu apare scroll; conținutul rămâne în viewport.

---

## Pagina /dex-edu/trade

**URL:** \`http://127.0.0.1:3000/dex-edu/trade\` (dev) / \`/dex-edu/trade\` (prod)

### Header

Toolbar-ul Trade (favorit, Market Stats, Order Book, Live Market Data, Alerts, History, Shortcuts) + Token Selector. Poate fi în \`#dex-header-center-slot\` sau inline.

### Layout principal

- **Stânga:** Chart TradingView + sub el bara închisă „Open Orders (N)” / „Order History” (previzualizare).
- **Splitter vertical:** redimensionare panou dreapta.
- **Dreapta:** Panou **Limit** (Buy/Sell, Pay/Receive, Price, Amount, Risk Management, Place Order). **Nu** conține lista de ordine active; ordinele sunt doar în panoul de jos.

### Panoul de jos (Open Orders / Order History)

- **Închis:** două butoane – „Open Orders (N)” (N = număr ordine) și „Order History”. Click → deschide panoul la 50vh cu tab-ul ales.
- **Deschis:** tab-uri Open Orders | Order History + buton Close. Conținut: tabele cu ordine deschise / istoric; date din API (\`getOrders\`, \`getTrades\`).
- **Navigare din Swap:** la click pe „Open Orders” sau „Order History” în header-ul Swap se navighează la \`/dex-edu/trade\` cu \`state: { openBottomPanel: true, bottomTab: 'openOrders' | 'orderHistory' }\`; Trade deschide panoul pe tab-ul corespunzător.

### Footer panou Limit (Buy/Sell)

- Wallet (scurt) + Protocol Fee + buton **Place Order**.
- **Chenar:** border, border-radius 10px, background \`var(--ds-bg-elevated)\`, box-shadow (identic cu Risk Management).
- **Culori buton:** Buy → albastru (#1e40af); Sell → roșu (#dc2626). Stiluri: \`trade-page.css\` (\`.trade-pane-orders .limit-order-panel-container .ui-card-footer\`).

### Flux ordin

1. Utilizator completează Price/Amount, opțional Risk Management, apasă Place Order.
2. Apare **ConfirmationModal** (Confirm Order).
3. La Confirm → plasare API; modal rămâne deschis cu loading, apoi se închide.
4. Apare **popup „Order placed”** (Your limit order has been placed successfully. View it in Open Orders below.) + toast.
5. Ordinul **nu** apare în panoul Buy/Sell; apare în panoul de jos **Open Orders** (refresh prin \`onOrderPlaced\` din Trade).

**Fișiere:** \`Trade.jsx\`, \`LimitOrderPanel.jsx\`, \`trade-page.css\`, \`limit-order-panel.css\`.

---

## Fișiere cheie (SSOT)

| Rol | Fișier |
|-----|--------|
| Pagina Swap | \`src/components/DEX/frontend/pages/Swap.jsx\` |
| Pagina Trade | \`src/components/DEX/frontend/pages/Trade.jsx\` |
| Panou Limit (partajat Swap + Trade) | \`src/components/DEX/frontend/components/trade/LimitOrderPanel.jsx\` |
| Panou Swap | \`src/components/DEX/frontend/components/trade/SwapPanel.jsx\` |
| Stiluri Trade | \`src/components/DEX/frontend/styles/components/trade-page.css\` |
| Stiluri Swap | \`src/components/DEX/frontend/styles/components/swap-page.css\`, \`swap-header-toolbar.css\` |
| Risk Management (Limit) | \`docs/DEX_RISK_MANAGEMENT_SECTION.md\` |

---

## Rute relevante

- \`/dex-edu/dashboard\` – Home (Dashboard)
- \`/dex-edu/swap\` – Swap & Limit (token selector + Open Orders / Order History / Close / Home în header)
- \`/dex-edu/trade\` – Trade (chart + Limit + Open Orders / Order History în panoul de jos)
- \`/dex-edu/open-orders\` – Pagină Open Orders (\`OpenOrdersPage\`)
- \`/dex-edu/order-history\` – Pagină Order History (\`OrderHistoryPage\`)

---

**Last updated:** 2026-01-30

---

## FILE: docs/LEVERAGE_SSOT.md

# Leverage — surse de adevăr (SSOT)

**Actualizat:** contractul live este **LeverageTradingV2** pe BSC. **LeverageTrading.sol (V1)** a fost eliminat și din \`frontend-edu\` și din folderul Remix \`TradeOTA\` — nu mai păstrăm sursa V1 acolo; SSOT Solidity rămâne doar **LeverageTradingV2.sol**.

## Solidity (sursă autoritativă)

| Rol | Cale (mașina de dezvoltare) |
|-----|-----------------------------|
| Contract deployat | \`C:\\Users\\bits\\Desktop\\remix\\OTA\\BSC\\TradeOTA\\LeverageTradingV2.sol\` |

Orice referință la logică on-chain (setări owner, structuri, evenimente) trebuie verificată în acest fișier sau în artefactul de compilare folosit la deploy.

## Frontend (ABI + adresă)

| Rol | Cale / locație |
|-----|----------------|
| ABI canonic (V2) | \`src/abi/LeverageTradingABI.js\` |
| Alias import | \`src/abi/LeverageTradingV2ABI.js\` (re-export către același ABI) |
| Adresă contract | \`public/runtime-config.json\` → \`LEVERAGE_TRADING_ADDRESS\`, sau \`REACT_APP_LEVERAGE_TRADING_ADDRESS\`, sau fallback în \`src/contract/contractMap.js\` |

## Scripturi operator (BSC)

| Script | Rol |
|--------|-----|
| \`scripts/leverage-set-all-config.js\` | \`setLendingPool\`, feeds Spot/CFD, \`setDefaultSettlementToken\` |
| \`scripts/leverage-deposit-reserve.js\` | \`approve\` + \`depositReserve\` (rezervă pentru profit CFD) |
| \`scripts/leverage-set-cfd-feeds-only.js\` | doar feed-uri CFD (dacă există) |

## Documentație înrudită

- Setări owner: \`docs/LEVERAGE_CONTRACT_ALL_SETTINGS.md\`, \`docs/LEVERAGE_OWNER_SETUP.md\`
- Status / verificări: \`docs/LEVERAGE_STATUS_VERIFIED.md\`
- Flux fonduri CFD: \`docs/LEVERAGE_CFD_FUND_FLOW.md\`
- Audit / V2: \`docs/LEVERAGE_SMART_CONTRACT_AUDIT_AND_UPGRADE.md\`

---

## FILE: docs/OTA_ARCHITECTURE.md

# OTA Architecture Documentation

**Date:** 2025-01-27 (updated 2026-01-30)  
**Status:** Current Implementation

---

## Architecture Overview

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
├─────────────────────────────────────────────────────────────┤
│  /dex-edu/ota                                                    │
│  ├── OTAPage.jsx (Main entry)                                │
│  │   ├── OTATradingModeSelector (Mode selection)            │
│  │   ├── OTAAccessControl (Registration UI)                  │
│  │   ├── OTASettingsPanel, OTAConditionsEditor              │
│  │   └── Learning Features (panels, mode-aware)             │
│  │   (Assisted mode: use /dex-edu/swap – AssistedTradePanel removed) │
│  │                                                           │
│  ├── Hooks:                                                  │
│  │   ├── useOTAAccess (Access level: guest/preview/full)    │
│  │   ├── useOTAMode (Trading mode: advisory/assisted/auto) │
│  │   └── useOTARegistration (On-chain registration)         │
│  │                                                           │
│  └── Services:                                               │
│      └── otaContractService.jsx (On-chain interactions)      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (Node.js/Express)                      │
│              ⚠️ NOT IN THIS REPO - BLOCKED                   │
├─────────────────────────────────────────────────────────────┤
│  Location: backend-server (deploy Render)              │
│                                                               │
│  /api/ai-trading/*                                           │
│  ├── GET  /registration-status                               │
│  ├── POST /register (prepare transaction)                    │
│  ├── POST /authorize-bot (prepare transaction)               │
│  ├── GET  /quote (swap quote)                                │
│  ├── GET  /swap-tx (transaction data)                        │
│  ├── POST /analyze (OpenAI market analysis)                  │
│  ├── POST /record-outcome (manual trade outcome → ota.trade_outcomes) │
│  └── POST /sei/round-trip-ack (SEI round-trip → optional OpenAI ack; spec: OTA_SEI_ROUND_TRIP_ACK_SPEC.md) │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ (Optional, if USERVault_ADDRESS set)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Smart Contracts (BSC Mainnet)                        │
│         ⚠️ NOT IN THIS REPO - BLOCKED                        │
├─────────────────────────────────────────────────────────────┤
│  Location: C:\\Users\\bits\\Desktop\\remix\\OTA\\BSC              │
│                                                               │
│  UserVault.sol                                               │
│  ├── register() - User on-chain registration                 │
│  ├── authorizeBot() - Bot authorization                      │
│  └── isRegistered() - Check registration                     │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## Single Source of Truth (SSOT) Files

### Routing
- **Frontend Routes:** \`src/components/DEX/DEXApp.jsx\` (lines 144-168)
- **Backend Routes:** \`backend-server/src/ota/routes/aiTradingRoutes.js\` ⚠️ **BLOCKED** (not in this repo)

### API Endpoints
- **SSOT:** \`src/config/apiEndpoints.js\` ✅ **CONSOLIDATED**
- **Re-export (backward compat):** \`src/components/DEX/frontend/utils/constants.js\` (re-exports from SSOT)

### OTA UI Components
- **Main Page:** \`src/components/DEX/frontend/pages/OTAPage.jsx\`
- **Mode Selector:** \`src/components/DEX/frontend/components/ai-trading/OTATradingModeSelector.jsx\`
- **Access Control:** \`src/components/DEX/ota/OTAAccessControl.jsx\`
- **Settings Panel:** \`src/components/DEX/ota/OTASettingsPanel.jsx\`
- **Conditions Editor:** \`src/components/DEX/ota/OTAConditionsEditor.jsx\`

### State Management Hooks
- **Access Level:** \`src/components/DEX/frontend/hooks/useOTAAccess.js\`
- **Trading Mode:** \`src/components/DEX/frontend/hooks/useOTAMode.js\` ✅ **NEW**
- **Registration State:** \`src/components/DEX/frontend/hooks/useOTARegistration.js\`
- **Contract Status:** \`src/components/DEX/frontend/hooks/useContractDeploymentStatus.js\`

### Trading Mode Constants
- **SSOT:** \`src/components/DEX/frontend/utils/otaTradingModes.js\` ✅ **NEW**

### Authentication & Wallet
- **DEX Auth Context:** \`src/components/DEX/frontend/context/DexAuthContext.jsx\`
- **Wallet Hook:** \`src/components/DEX/frontend/hooks/useWallet.jsx\`

### API Integration
- **Contract Service:** \`src/components/DEX/frontend/services/otaContractService.jsx\`

### Backend Services
- **Registration Service:** \`backend-server/src/ota/services/OTARegistrationService.js\` ⚠️ **BLOCKED**
- **AI Trading Service:** \`backend-server/src/ota/services/AITradingService.js\` ⚠️ **BLOCKED**

### Smart Contracts
- **UserVault:** \`C:\\Users\\bits\\Desktop\\remix\\OTA\\BSC\\UserVault.sol\` ⚠️ **BLOCKED**
- **Access Control:** \`C:\\Users\\bits\\Desktop\\remix\\OTA\\BSC\\AITradingAccessControl.sol\` ⚠️ **BLOCKED**

---

## Access Level vs Trading Mode Separation

### Two Orthogonal Concepts

**Access Level** (Authentication & Registration):
- Determines what data user can see
- Enforced by: \`useOTAAccess\` hook
- Values: \`guest\` | \`preview\` | \`full\`

**Trading Mode** (Execution Method):
- Determines how trades are executed
- Enforced by: \`useOTAMode\` hook
- Values: \`advisory\` | \`assisted\` | \`auto\`

### Matrix

| Access Level | Advisory | Assisted | Auto |
|--------------|----------|----------|------|
| guest | ✅ Preview (no demo data – error/empty only) | ❌ | ❌ |
| preview | ✅ Preview (no demo data – real or empty only) | ❌ | ❌ |
| full | ✅ Real | ✅ | ⚠️ Requires bot auth |

---

## Data Flow

### Advisory Mode Flow
\`\`\`
User → OTAPage (advisory mode)
  └─> BacktestPanel / MarketAnalysis / StrategyExecutionPanel
      └─> GET /api/ai-trading/analyze (OpenAI analysis)
          └─> User sees recommendations
              └─> User executes manually (if full access)
\`\`\`

### Assisted Mode Flow
\`\`\`
User → OTAPage (assisted mode) → redirect / use /dex-edu/swap for execution
  └─> /dex-edu/swap (classical Swap: quote + sign via MetaMask)
      └─> User configures trade (tokenIn, tokenOut, amount, slippage)
          └─> GET /api/ai-trading/quote (or DEX quote endpoint)
              └─> Backend returns quote
                  └─> User signs via MetaMask
                      └─> Transaction sent to blockchain
                          └─> User receives tokens
(AssistedTradePanel was removed; use Swap page – see OTA_ASSISTEDTRADEPANEL_REMOVAL_FIX.md)
\`\`\`

### Auto Mode Flow (Planned)
\`\`\`
User → OTAPage (auto mode)
  └─> User configures risk settings
      └─> Settings saved (localStorage)
          └─> [Future] Backend auto-trade service
              └─> AITaskManager creates task
                  └─> AITradingExecutor executes
                      └─> UserVault.useFunds() (if authorized)
                          └─> Trade executed on-chain
\`\`\`

---

## Known Issues & Inconsistencies

### Resolved
- ✅ API endpoints duplicate removed - consolidated to \`src/config/apiEndpoints.js\`
- ✅ Trading modes implemented with proper gating

### Current Limitations
- ⚠️ Auto mode execution not implemented (backend service missing)
- ⚠️ Backend not in this repo (marked as BLOCKED in docs)
- ⚠️ Contracts not deployed (USERVault_ADDRESS not set)

---

## Recommended Next Steps

1. **Deploy Contracts** (P0)
   - Deploy UserVault.sol to BSC Mainnet
   - Set USERVault_ADDRESS in backend environment

2. **Backend Auto Execution** (P0)
   - Implement AITradingExecutor service
   - Integrate with AITaskManager
   - Connect to UserVault.useFunds()

3. **On-Chain Policy Executor** (P1)
   - Deploy policy executor contract
   - Enforce risk limits on-chain

---

**End of Document**

---

## FILE: docs/OTA_FLOW_AND_CONTRACT_LOGIC.md

# OTA – Flux complet și logica din contractele Solidity

**Scop:** Sursă unică pentru fluxul Authorize Bot → executeTrade → executeSwapForUser și pentru ce verifică fiecare contract. Frontend și backend trebuie aliniate la această logică.

**Contracte sursă:** \`C:\\Users\\bits\\Desktop\\remix\\OTA\\BSC\\TradeOTA\\\` (UserVault.sol, AITradingAccessControl.sol, OTA/OTAAutoExecutor.sol, OTA/OTAPolicyManager.sol).

---

## 1. Cine trebuie autorizat de user (anomalie rezolvată)

- **UserVault.authorizeBot(_botAddress, _maxAmount)** salvează \`botAuthorizations[msg.sender][_botAddress]\` (user = msg.sender la apel).
- **UserVault.authorizeBot** cere: \`accessControl.isAuthorizedBot(_botAddress)\` → adresa \`_botAddress\` trebuie să fie deja înregistrată în **AITradingAccessControl** (de owner).
- **OTAAutoExecutor.executeTrade** (și AITradingExecutor.executeTrade) verifică: \`userVault.botAuthorizations(_user, msg.sender)\` → **msg.sender** la apelul executeTrade este **caller-ul** (wallet-ul care semnează tx), adică **backend BOT_WALLET (EOA)**.
- **UserVault.executeSwapForUser** are modifier **onlyOTAExecutor** → \`authorizedExecutors[msg.sender]\` → caller-ul este **contractul** OTAAutoExecutor (sau AITradingExecutor), nu EOA.

**Concluzie:** Utilizatorul trebuie să autorizeze în UserVault **adresa wallet-ului bot (EOA)** – adresa derivată din \`BOT_WALLET_PRIVATE_KEY\` pe backend – **nu** adresa contractului OTAAutoExecutor. Contractul OTAAutoExecutor este „executor” autorizat la UserVault (poate apela executeSwapForUser); bot-ul EOA este cel verificat în \`botAuthorizations(user, msg.sender)\` în executeTrade.

---

## 2. Flux numerotat (user → UI → chain → rezultat)

1. **Owner** (deployer): în **AITradingAccessControl** apelează \`authorizeBot(botWalletAddress, EXECUTE, ...)\` → bot EOA este recunoscut.
2. **Owner**: în **UserVault** apelează \`setOTAAutoExecutor(OTAAutoExecutorAddress)\` sau \`setExecutor(OTAAutoExecutorAddress, true)\` → doar contractul poate apela \`executeSwapForUser\`.
3. **User** (frontend): apelează **UserVault.authorizeBot(botWalletAddress, maxAmount)** (wallet conectat = user). Adresa \`botWalletAddress\` trebuie să fie cea a BOT_WALLET (EOA).
4. **Backend** (worker): la semnal, apelează **OTAAutoExecutor.executeTrade(user, tokenIn, tokenOut, amountIn, amountOutMin, path, deadline)** cu **signer = BOT_WALLET**.
5. **OTAAutoExecutor**: verifică \`accessControl.isAuthorizedBot(msg.sender)\` (msg.sender = BOT_WALLET) → OK; verifică \`userVault.botAuthorizations(_user, msg.sender).isActive\` → OK; apelează \`policyManager.validateAndConsume(...)\`; apelează **userVault.executeSwapForUser(...)**.
6. **UserVault.executeSwapForUser**: modifier \`onlyOTAExecutor\` → msg.sender = OTAAutoExecutor → OK; execută swap și actualizează vault-ul userului.

---

## 3. Logica extrasă din contracte (pentru frontend / mesaje)

### UserVault (referință: UserVault.sol)

- **authorizeBot(_botAddress, _maxAmount)**  
  - Require: \`_botAddress != 0\`, \`accessControl.isAuthorizedBot(_botAddress)\`.  
  - Efect: \`botAuthorizations[msg.sender][_botAddress]\` = { botAddress, maxAmount, usedAmount=0, authorizedAt, isActive=true }.
- **executeSwapForUser**  
  - Modifier: \`onlyOTAExecutor\` (authorizedExecutors[msg.sender]).  
  - Nu verifică botAuthorizations aici – verificarea e în OTAAutoExecutor.

### AITradingAccessControl (referință: AITradingAccessControl.sol)

- **authorizeBot(_botAddress, level, maxTradesPerHour, maxTradeAmount)** – doar owner.  
  - Bot-ul (EOA sau contract) este înregistrat ca autorizat pentru nivel EXECUTE etc.

### OTAAutoExecutor (referință: OTA/OTAAutoExecutor.sol)

- **executeTrade(...)**  
  - Modifier: \`onlyAuthorizedBot(msg.sender)\` → \`accessControl.isAuthorizedBot(msg.sender)\`.  
  - Require: \`userVault.canUserUseOTA(_user)\`, \`userVault.botAuthorizations(_user, msg.sender).isActive\`, path 2-hop, deadline >= block.timestamp.  
  - Apelează: \`policyManager.validateAndConsume(...)\`, apoi \`userVault.executeSwapForUser(...)\`.

### OTAPolicyManager (referință: OTA/OTAPolicyManager.sol)

- **validateAndConsume(_user, _tokenIn, _tokenOut, _amountIn, _slippageBps)** – doar apelat de OTAAutoExecutor.  
  - Verifică: policy.enabled, expiresAt, maxSlippageBps, minDelaySeconds, allowlist token/pair, token limits (maxPerTrade, dailyMax); consumă (spentToday, lastTradeAt).

---

## 4. Ce trebuie în frontend și backend

- **Adresa de autorizat:** adresa publică a **BOT_WALLET** (EOA), nu adresa contractului OTAAutoExecutor.  
- **Sursă adresă (singura):** backend pe Render expune **GET /api/ai-trading/bot-address**; răspuns: \`{ "botWalletAddress": "0x..." }\`. Adresa este derivată pe backend din \`BOT_WALLET_PRIVATE_KEY\` (ex: \`ethers.Wallet(privateKey).address\`).  
- **Frontend:** nu folosește niciun ENV pentru adresa bot; obține adresa doar prin apel la acest endpoint. Dacă endpoint-ul lipsește sau răspunde cu eroare, panoul Authorize Bot nu se afișează.  
- **Nu folosi** adresa OTAAutoExecutor pentru Authorize Bot – userul autorizează EOA-ul care apelează executeTrade (msg.sender).

---

## 5. De ce a apărut anomalia

- În frontend se folosea adresa **OTA_AUTO_EXECUTOR** (contract) ca „bot” la Authorize Bot.  
- În Solidity, **OTAAutoExecutor.executeTrade** verifică \`botAuthorizations(_user, msg.sender)\` unde **msg.sender** este wallet-ul care semnează (BOT_WALLET), nu contractul.  
- Deci autorizarea pentru adresa contractului nu satisface verificarea din executeTrade; trebuie autorizat BOT_WALLET (EOA).

Actualizare: frontend obține adresa bot **doar de la backend** (GET /api/ai-trading/bot-address). Backend pe Render implementează acest endpoint; nu se folosește REACT_APP_ în frontend.

---

## FILE: docs/OTA_CONTRACT_ADDRESSES.md

# 🔗 OTA Smart Contract Addresses

**Network:** BSC Mainnet (ChainID: 56)  
**Date:** 2026-01-22  
**Status:** ✅ **DEPLOYED & ACTIVE**

---

## 📜 DEPLOYED CONTRACTS

### **Core Token**
\`\`\`javascript
BITS_TOKEN_ADDRESS = "0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe"
\`\`\`
- **Contract Name**: BitsToken (ERC20)
- **Purpose**: Platform utility token
- **Used for**: OTA registration fees, privileges, staking

---

### **OTA Smart Contracts**

#### 1. **AITradingAccessControl.sol**
\`\`\`javascript
ACCESS_CONTROL_ADDRESS = "0x8B32ce487A502a0f8c428A36163967058F89D1C0"
\`\`\`
- **Purpose**: Bot access control and authorization
- **Functions**:
  - \`authorizeBot(address botAddress)\`
  - \`revokeBot(address botAddress)\`
  - \`isBotAuthorized(address user, address bot)\`

#### 2. **UserVault.sol** (apelat prin UpgradeableProxy)
\`\`\`javascript
// OBLIGATORIU: folosește adresa PROXY pentru toate apelurile (frontend + backend).
USER_VAULT_ADDRESS = "0x279852b048eCB3390D87Ce14398C3A884928fCB9"  // Proxy
// Implementation (după upgrade): 0x1ea23e21eb33204fd0df3437107573939dca5cfa
\`\`\`
- **Purpose**: User registration and BITS privileges management
- **⚠️ CRITICAL**: Frontend și **backend (Render)** trebuie să folosească **PROXY** (\`0x27985...\`), **NU** adresa implementation. Dacă backend are \`USER_VAULT_ADDRESS\` = implementation, citește stare veche și bot auth pare mereu expirată.
- **History (crypto) / bridge / \`eth_getLogs\`:** evenimentele \`FundsDeposited\` / \`FundsWithdrawn\` și tx-urile user apar pe **proxy** (BscScan). Backend: \`getUserVaultProxyAddressForLogs()\`; frontend: \`getUserVaultProxyAddressForHistory()\` — nu scana implementation pentru istoric.
- **Functions**:
  - \`register()\` - Register user on-chain
  - \`authorizeBot(address botAddress)\` - Authorize OTA bot
  - \`getUserPrivileges(address user)\` - Get user access level
  - \`isUserRegistered(address user)\` - Check registration status
  - \`canUseOTA(address user)\` - Check OTA access

---

## 🔧 BACKEND CONFIGURATION

### **Render Environment Variables**

**SSOT adrese:** \`src/contract/contractMap.js\`. Valorile de mai jos sunt sincronizate cu contractMap (frontend); backend trebuie să folosească **aceleași** adrese.

Copy-paste these into your Render dashboard:

\`\`\`bash
# Core Token
BITS_TOKEN_ADDRESS=0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe

# OTA Contracts (BSC Mainnet) – aliniate cu contractMap.js
ACCESS_CONTROL_ADDRESS=0x8B32ce487A502a0f8c428A36163967058F89D1C0
USER_VAULT_ADDRESS=0x279852b048eCB3390D87Ce14398C3A884928fCB9
OTA_POLICY_MANAGER_ADDRESS=0x37CfEA29005638e4703D35F0D318d22db0f22649
OTA_AUTO_EXECUTOR_ADDRESS=0x5590574050b937cFa920f8F093D26c60592D1739
AI_TASK_MANAGER_ADDRESS=0x038fE2095AA747f6c1c87a2a2198Ab4a22e6D460
AI_TRADING_EXECUTOR_ADDRESS=0x42E3E5ED00AE153347e4D883507598b0d83b215b
LEVERAGE_TRADING_ADDRESS=0x14e89879f5e7715Ea59ae54A5A161E28A9d58452
BITSWAP_WRAPPER_ADDRESS=0x5dC470e76AB02190491a2d1a110c6e067623a761

# Network
BSC_RPC_URL=https://bsc-dataseed1.binance.org
BSC_CHAIN_ID=56

# OpenAI (for /api/ai-trading/analyze)
ENABLE_OPENAI=true
OPENAI_API_KEY=<your-key-here>
OPENAI_MODEL=gpt-4-turbo-preview
\`\`\`

---

### **Verificare Render (checklist)**

Compară în **Render → backend-server → Environment** fiecare variabilă cu tabelul de mai jos. Valorile trebuie să fie **identice** cu cele din frontend (contractMap.js).

| Variabilă Render | Valoare corectă (BSC Mainnet) | Notă |
|------------------|--------------------------------|------|
| \`USER_VAULT_ADDRESS\` | \`0x279852b048eCB3390D87Ce14398C3A884928fCB9\` | **OBLIGATORIU PROXY.** Nu pune implementation (\`0x1ea23e...\` sau \`0x7F5744...\`). |
| \`ACCESS_CONTROL_ADDRESS\` | \`0x8B32ce487A502a0f8c428A36163967058F89D1C0\` | AITradingAccessControl |
| \`BITS_TOKEN_ADDRESS\` | \`0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe\` | BITS token |
| \`OTA_POLICY_MANAGER_ADDRESS\` | \`0x37CfEA29005638e4703D35F0D318d22db0f22649\` | Policy manager |
| \`OTA_AUTO_EXECUTOR_ADDRESS\` | \`0x5590574050b937cFa920f8F093D26c60592D1739\` | OTAAutoExecutor (align cu contractMap) |
| \`AI_TASK_MANAGER_ADDRESS\` | \`0x038fE2095AA747f6c1c87a2a2198Ab4a22e6D460\` | AI Task Manager |
| \`AI_TRADING_EXECUTOR_ADDRESS\` | \`0x42E3E5ED00AE153347e4D883507598b0d83b215b\` | AITradingExecutor (bot Direct Entry) |
| \`LEVERAGE_TRADING_ADDRESS\` | \`0x14e89879f5e7715Ea59ae54A5A161E28A9d58452\` | LeverageTradingV2 (BSC) |
| \`BITSWAP_WRAPPER_ADDRESS\` | \`0x5dC470e76AB02190491a2d1a110c6e067623a761\` | BitSwapDEXWrapper (align cu contractMap) |
| \`BSC_RPC_URL\` | \`https://bsc-dataseed1.binance.org\` | RPC BSC |
| \`BSC_CHAIN_ID\` | \`56\` | Mainnet |

După orice modificare la variabile: **Save** → **Manual Deploy** (sau așteaptă auto-deploy) ca noile valori să fie active.

---

## 📊 FRONTEND INTEGRATION STATUS

### ✅ **Already Configured:**

1. **\`src/contract/contractMap.js\`**
   - ✅ BITS_TOKEN: \`0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe\`
   - ✅ AI_TRADING_ACCESS_CONTROL: \`0x8B32ce487A502a0f8c428A36163967058F89D1C0\`
   - ✅ USER_VAULT: \`0x279852b048eCB3390D87Ce14398C3A884928fCB9\` (Proxy)

2. **\`src/utils/tokenList.js\`**
   - ✅ BITS token address configured

3. **\`src/components/DEX/frontend/services/\`**
   - ✅ swapExecutionService.jsx - Uses BITS address
   - ✅ walletBalanceService.jsx - Uses BITS address

---

## 🚀 VERIFICATION CHECKLIST

### **On-Chain Registration Flow:**

1. **User connects wallet** → \`useUnifiedWallet()\`
2. **Frontend calls** → \`GET /ai-trading/registration-status\`
3. **Backend queries** → \`UserVault.isUserRegistered(walletAddress)\`
4. **If not registered:**
   - Frontend: \`POST /ai-trading/register\`
   - Backend: Prepares tx for \`UserVault.register()\`
   - User signs in MetaMask
   - Transaction confirmed on-chain
5. **Status updated** → \`OTARegistrationContext\` updates \`isRegistered: true\`

### **Bot Authorization Flow:**

1. **User registered** → \`isRegistered: true\`
2. **User wants Auto Mode** → Clicks "Authorize Bot"
3. **Frontend calls** → \`POST /ai-trading/authorize-bot\`
4. **Backend queries** → \`AITradingAccessControl.isBotAuthorized(user, botAddress)\`
5. **If not authorized:**
   - Backend: Prepares tx for \`UserVault.authorizeBot(botAddress)\`
   - User signs in MetaMask
   - Transaction confirmed on-chain
6. **Auto Mode enabled** → User can configure auto-trading policies

---

### **3. OTAPolicyManager**
\`\`\`javascript
OTA_POLICY_MANAGER_ADDRESS = "0x37CfEA29005638e4703D35F0D318d22db0f22649"
\`\`\`
- **Purpose**: User policy and risk limits for Auto Mode
- **După redeploy:** actualizează \`REACT_APP_OTA_POLICY_MANAGER_ADDRESS\` (frontend) și \`OTA_POLICY_MANAGER_ADDRESS\` (backend Render). Token limits / policy se citesc **doar din acest contract** (fără fallback backend).

### **4. OTAAutoExecutor**
\`\`\`javascript
OTA_AUTO_EXECUTOR_ADDRESS = "0x5590574050b937cFa920f8F093D26c60592D1739"
\`\`\`
- **Purpose**: Automated trade execution

### **5. AITaskManager**
\`\`\`javascript
AI_TASK_MANAGER_ADDRESS = "0x038fE2095AA747f6c1c87a2a2198Ab4a22e6D460"
\`\`\`
- **Purpose**: Task creation and tracking on-chain

### **6. AITradingExecutor**
\`\`\`javascript
AI_TRADING_EXECUTOR_ADDRESS = "0x42E3E5ED00AE153347e4D883507598b0d83b215b"
\`\`\`
- **Purpose**: Trade execution via DEX

### **7. LeverageTradingV2**
\`\`\`javascript
LEVERAGE_TRADING_ADDRESS = "0x14e89879f5e7715Ea59ae54A5A161E28A9d58452"
\`\`\`
- **Purpose**: Spot leverage + CFD (/dex-edu/leverage). SSOT Solidity: \`remix/OTA/BSC/TradeOTA/LeverageTradingV2.sol\`; ABI: \`src/abi/LeverageTradingABI.js\`. Sincronizat cu contractMap / runtime-config.

### **8. BitSwapDEXWrapper**
\`\`\`javascript
BITSWAP_WRAPPER_ADDRESS = "0x5dC470e76AB02190491a2d1a110c6e067623a761"
\`\`\`
- **Purpose**: Swap + fee collection. Sincronizat cu contractMap.js.

---

## 📝 TESTING GUIDE

### **Test Registration:**

\`\`\`bash
# 1. Check registration status
curl -X GET "https://your-backend.onrender.com/ai-trading/registration-status?walletAddress=0xYourAddress"

# Expected response:
{
  "isRegistered": true/false,
  "canUseOTA": true/false,
  "bitsBalance": "58509.84",
  "minBITSRequired": "5000.0",
  "hasSufficientBITS": true/false,
  "privileges": {
    "payGasWithBITS": true,
    "accessAdvancedOTA": true,
    "cashbackRate": "50"
  }
}
\`\`\`

### **Test Bot Authorization:**

\`\`\`bash
# 2. Authorize bot
curl -X POST "https://your-backend.onrender.com/ai-trading/authorize-bot" \\
  -H "Content-Type: application/json" \\
  -d '{
    "walletAddress": "0xYourAddress",
    "botAddress": "0xBotAddress"
  }'

# Expected response:
{
  "success": true,
  "transactionData": {
    "to": "0x279852b048eCB3390D87Ce14398C3A884928fCB9",
    "data": "0x...",
    "value": "0"
  }
}
\`\`\`

---

## 🎯 INTEGRATION STATUS

| Component | Status | Notes |
|-----------|--------|-------|
| BITS Token | ✅ Deployed | \`0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe\` |
| AITradingAccessControl | ✅ Deployed | \`0x8B32ce487A502a0f8c428A36163967058F89D1C0\` |
| UserVault | ✅ Deployed (Proxy) | \`0x279852b048eCB3390D87Ce14398C3A884928fCB9\` |
| Frontend Integration | ✅ Complete | All services updated |
| Backend Integration | ⏳ Verify | Check Render env vars |
| OpenAI Integration | ✅ Complete | \`/api/ai-trading/analyze\` |
| Auto Mode | ⏳ Pending | Needs AITaskManager, AITradingExecutor, etc. |

---

## 🔍 TROUBLESHOOTING

### **Issue: "User not registered" despite having BITS**

**Solution:**
1. Check backend logs for \`registration-status\` endpoint
2. Verify \`USER_VAULT_ADDRESS\` in Render env vars
3. Confirm wallet has 5,000+ BITS
4. Try re-connecting wallet

### **Issue: "Contract not deployed" error**

**Solution:**
1. Verify contract addresses in Render env vars
2. Check BSC Explorer: https://bscscan.com/address/[contract-address]
3. Confirm network is BSC Mainnet (ChainID: 56)

### **Issue: OpenAI analysis returns error**

**Solution:**
1. Check \`ENABLE_OPENAI=true\` in Render
2. Verify \`OPENAI_API_KEY\` is valid
3. Check backend logs for OpenAI API errors
4. Confirm \`/api/ai-trading/analyze\` endpoint is accessible

### **Issue: BOT_AUTH_MISMATCH / on-chain authorization always expired after UserVault upgrade**

**Cauză:** Backend-ul (AITradingExecutor) citește \`getBotAuthorization\` de la o adresă greșită – de ex. **implementation** în loc de **proxy**.

**Solution:**
1. În **Render** → backend-server → **Environment**: \`USER_VAULT_ADDRESS\` trebuie să fie **PROXY**: \`0x279852b048eCB3390D87Ce14398C3A884928fCB9\`.
2. **NU** pune adresa implementation (\`0x1ea23e21eb33204fd0df3437107573939dca5cfa\` sau vechea \`0x7F5744...\`) – starea (bot authorizations, register) este în **proxy**.
3. După ce corectezi, redeploy backend pe Render și verifică din nou logurile.

---

**Last Updated:** 2026-03-12  
**SSOT:** Toate adresele sincronizate în frontend (contractMap, runtime-config), backend (ota/config.js, OTA_ENV_VARIABLES.md), Remix (TradeOTA/CONTRACT_ADDRESSES.md)

---

## FILE: src/components/DEX/ota/docs/OTA_01_CE_ESTE_OTA.md

# Ce este OTA AI

**OTA** = On-Token-Agent (OpenAI Trading Agent). Este agentul AI al BitSwap DEX care oferă analiză de piață și semnale de trading folosind **OpenAI** (model configurat via \`OPENAI_MODEL\`, default \`gpt-4o-mini\`).

- **Provider:** OpenAI  
- **Scop:** Analiză piață, semnale (buy/sell/hold/swap), recomandări entry/stop/take-profit.  
- **Unde rulează:** Backend (Render); cheia OpenAI este doar pe server.  
- **Frontend:** Pagini DEX (/dex-edu/ota, /dex-edu/ota/chat), panouri Backtest, Strategy Execution, ML Predictions, Risk Gating, AutoTradePanel.

**Moduri de acces:** guest (vizitator), preview (autentificat, fără înregistrare on-chain), full (autentificat + înregistrat on-chain).  
**Moduri de trading:** Advisory (recomandări, user execută manual), Assisted (AI pregătește, user semnează), Auto (execuție automată cu bot autorizat).

**Index documentație:** vezi \`OTA_08_INDEX_DOCUMENTATIE.md\`.

---

## FILE: src/components/DEX/ota/docs/OTA_02_ARHITECTURA.md

# Arhitectură OTA

## Frontend (React)

- **Rută principală:** \`/dex-edu/ota\` → OTAPage.jsx  
- **Componente:** OTATradingModeSelector, OTAAccessControl, OTASettingsPanel, OTAConditionsEditor, panouri Learning (Backtest, Strategy Execution, ML Predictions, Bandit, Meta Controller, Risk Gating), AutoTradePanel (mode=auto).  
- **Hooks:** useOTAAccess (guest/preview/full), useOTAMode (advisory/assisted/auto), useOTARegistration, useAITrading.  
- **API client:** aiTradingApiService (analyzeMarket, recordManualOutcome, etc.); otaApiRequest cu getApiBaseUrl().

## Backend (Node/Express – Render)

- **Locație:** backend-server-repo (deploy pe Render).  
- **Rute:** /api/ai-trading/* (health, ready, analyze, record-outcome, quote, swap-tx, registration-status, register, authorize-bot, policy, circuit-breaker, **chat**).  
- **Servicii:** AITradingService (analyzeMarket), OpenAIModel (OpenAI API), BinanceKlinesService, MarketDataService, PriceHistoryService, OTARegistrationService, OTAPolicyService.  
- **Config:** OPENAI_API_KEY, OPENAI_MODEL, BSC_RPC_URL, contract addresses (UserVault, OTAPolicyManager, OTAAutoExecutor).

## Contracte (BSC Mainnet)

- UserVault: register(), authorizeBot(), isRegistered().  
- OTAPolicyManager: policy, limits, allowlist.  
- OTAAutoExecutor: execuție auto (când e implementată).

## Flux analiză (Advisory / Auto)

1. Frontend: aiTradingApiService.analyzeMarket(token, options) cu recentOutcomes.  
2. Backend: AITradingService.analyzeMarket() → Binance klines + marketData + outcomes din DB → OpenAIModel.analyze() → OpenAI API.  
3. Răspuns: { signal, confidence, reasoning, entryPrice, stopLoss, takeProfit }.

**SSOT rute frontend:** DEXApp.jsx. **SSOT endpoint-uri:** src/config/apiEndpoints.js.

---

## FILE: src/components/DEX/ota/docs/OTA_03_MODURI_TRADING.md

# Moduri de trading OTA

OTA are **trei moduri** de trading, ortogonale față de nivelul de acces (guest/preview/full):

## 1. Advisory

- **Definiție:** AI dă recomandări; user execută manual tranzacțiile.  
- **Disponibil pentru:** guest (preview), preview, full.  
- **Features:** Analiză piață, semnale, backtest, strategii, ML predictions, risk gating. Execuție manuală doar la full.  
- **UI:** BacktestPanel, MarketAnalysis, StrategyExecutionPanel, BanditSelectorPanel, MetaControllerPanel, RiskGatingPanel.

## 2. Assisted

- **Definiție:** AI pregătește tranzacția; user o revizuiește și semnează în wallet. Fără custodie la bot.  
- **Disponibil pentru:** full.  
- **Flow:** Quote → Prepare TX → User sign (MetaMask) → Execuție on-chain.  
- **Endpoints:** GET /api/ai-trading/quote, GET /api/ai-trading/swap-tx.

## 3. Auto

- **Definiție:** AI execută automat în baza strategiilor și policy-ului. Necesită autorizare bot on-chain.  
- **Disponibil pentru:** full + bot authorization.  
- **Status:** UI și policy există; execuția automată (worker backend) poate fi activată pe Render (OTA_AUTO_EXECUTION_ENABLED, BOT_WALLET_PRIVATE_KEY).  
- **UI:** AutoTradePanel pe /dex-edu/ota?mode=auto.

**Persistență mod:** URL \`?mode=advisory|assisted|auto\`. Default: advisory.

---

## FILE: src/components/DEX/ota/docs/OTA_04_OPENAI_ANALIZA.md

# OpenAI și analiza de piață

- **Model:** OPENAI_MODEL (env), default \`gpt-4o-mini\`; opțional \`gpt-4o\`, \`gpt-4-turbo\`, \`gpt-4\`, \`gpt-3.5-turbo\`.  
- **Key:** OPENAI_API_KEY setat doar pe backend (Render). Niciodată în frontend.  
- **Endpoint analiză:** POST /api/ai-trading/analyze.  
- **Body:** token, quoteToken, userId, marketData, amountIn, recentOutcomes (opțional).  
- **Backend:** AITradingService.analyzeMarket() → adaugă Binance klines, marketData, outcomes din DB → OpenAIModel.analyze() → OpenAI Chat Completions.  
- **Răspuns:** signal (buy|sell|hold|swap), confidence, reasoning, entryPrice, stopLoss, takeProfit.

**Surse pentru prompt OpenAI:** Binance klines (24h), marketData (preț, volume, change24h), recentOutcomes (din frontend + ota.trade_outcomes), opțional Alpha Vantage (ALPHA_VANTAGE_API_KEY).  
**Record outcome manual:** După swap, frontend apelează POST /api/ai-trading/record-outcome → insert ota.trade_outcomes (source='manual'); aceste outcome-uri intră în recentOutcomes la analizele următoare.

**Chat direct cu OpenAI:** POST /api/ai-trading/chat (același key). Frontend: /dex-edu/ota/chat.

**Fallback când LLM eșuează (server):** Dacă apelul OpenAPI eșuează sau precheck-ul e blocat de circuit breaker, backend-ul poate livra în continuare semnalul **din motorul OTA** (fără acțiune obligatorie în UI). Env **\`OTA_OPENAI_FALLBACK_ENGINE_ON_ERROR\`** — implicit activ; dezactivare: \`false\` sau \`0\`. În răspuns poate apărea **\`analysisSource\`: \`engine_fallback_openai_error\`**; retry-ul exterior (după circuit) folosește calea **\`engine_no_openai\`**. Detalii contract: \`docs/OTA_FRONTEND_BACKEND_CONTRACT.md\` (POST /analyze).

---

## FILE: src/components/DEX/ota/docs/OTA_05_ENDPOINTS_API.md

# Endpoints API OTA (SSOT)

**Bază:** getApiBaseUrl() + calea de mai jos (ex: \`/api\` + \`/ai-trading/health\`).

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

## FILE: src/components/DEX/ota/docs/OTA_07_RUTE_UI.md

# Rute UI OTA (DEX)

- **/dex-edu** – redirect la /dex-edu/dashboard.  
- **/dex-edu/dashboard** – Dashboard.  
- **/dex-edu/ota** – Pagina principală OTA AI (OTAPage); mode selector (Advisory / Auto); Learning Features; Access Control.  
- **/dex-edu/ota?mode=advisory** – Mod Advisory (implicit).  
- **/dex-edu/ota?mode=auto** – Mod Auto (AutoTradePanel dacă full + bot autorizat).  
- **/dex-edu/ota/chat** – Chat direct cu OpenAI (proprietar key); autentificare email.  
- **/dex-edu/ota/login, /dex-edu/ota/register, /dex-edu/ota/forgot-password, /dex-edu/ota/reset-password** – Auth OTA.  
- **/dex-edu/ota/profile** – Profil OTA (protejat).  
- **/dex-edu/swap** – Swap; după swap se poate apela recordManualOutcome.  
- **/dex-edu/trade** – Trade (orderbook, limit orders).  
- **/dex-edu/signals** – Lista semnale (același userId/wallet ca AutoTradePanel).
- **/dex-edu/complaints** – **Singurul canal oficial în app** pentru reclamații: formular (mesaj + opțional email de contact + context wallet). Nu există alt „formular de contact” separat pentru DEX în acest produs. **Nu** folosi adrese inventate (ex. support@bitswapdex.com) sau Discord/Telegram ca răspuns standard — nu sunt documentate aici ca flux de reclamații. Din Dashboard: More links → Support → Complaints & feedback.

**SSOT rute:** src/components/DEX/DEXApp.jsx. Sidebar: link-uri către Dashboard, OTA AI, Chat OpenAI, Swap, Trade, etc.

---

## FILE: ../frontend/README.md

# 🎁 FF Project - AI Rewards Hub & Portfolio Analytics

Advanced Web3 application with AI-powered portfolio analytics and enhanced rewards system.

## Environment variables (required)

Create a \`.env.local\` file in the project root before running:

\`\`\`
REACT_APP_BACKEND_URL=https://backend-server-f82y.onrender.com
REACT_APP_ADMIN_PASS=your_strong_password
\`\`\`

The dev/build scripts run a preflight check and will fail fast if these vars are missing.

## Available Scripts

In the project directory, you can run:

### \`npm start\`

Runs the app in the development mode.\\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\\
You may also see any lint errors in the console.

### \`npm test\`

Launches the test runner in the interactive watch mode.\\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### \`npm run build\`

Builds the app for production to the \`build\` folder.\\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### \`npm run eject\`

**Note: this is a one-way operation. Once you \`eject\`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can \`eject\` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except \`eject\` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use \`eject\`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### \`npm run build\` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
=======
# 🤖 Unified Telegram Bots Service

**BitSwapDEX Telegram Bots** - Unified service running both Simple Bot and AI Bot in a single Render worker service.

## 🚀 Features

### 🤖 Simple Bot
- **User Tracking**: Monitor user activity and engagement
- **Commands**: \`/help\`, \`/price\`, \`/cell\`, \`/stats\`, \`/activity\`, \`/myreward\`, \`/register\`
- **Automated Messages**: Real-time updates every 5 minutes
- **Live Data**: Fetches data from backend API with price correction
- **Database**: PostgreSQL integration for user activity

### 🧠 AI Bot
- **OpenAI Integration**: Powered by GPT for intelligent responses
- **BITS Documentation**: Comprehensive knowledge about BitSwapDEX
- **Natural Language**: Responds to questions about BITS project
- **Context Awareness**: Understands crypto and blockchain queries

## 💰 Cost
- **$7/month** - Single Render worker service
- **Both bots** running in one service
- **24/7 availability**

## 🔧 Configuration

### Environment Variables
\`\`\`env
# Telegram Bot Tokens
TELEGRAM_BOT_TOKEN=7094285105:AAHLMP_ITMBNgug1xvYtp45B0aYw6aRzvDM
TELEGRAM_AI_BOT_TOKEN=7738929253:AAFnr7Y-WvQUOpVn7ikKfPPYNbR8RFEFnG8

# Telegram Group ID
TELEGRAM_GROUP_ID=-1002179349195

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Database Configuration
DATABASE_PASSWORD=your_database_password

# API URLs
BACKEND_API_URL=https://backend-server-f82y.onrender.com
FRONTEND_API_URL=https://bits-ai.io
\`\`\`

## 📦 Files Structure
\`\`\`
telegram-bots-deploy/
├── unified-bots.js          # Main service file
├── simple-bot.js            # Simple bot implementation
├── bot.js                   # AI bot implementation
├── ask-gpt.js              # OpenAI integration
├── docs.md                 # BITS documentation
├── package.json            # Dependencies
├── render.yaml             # Render deployment config
└── README.md               # This file
\`\`\`

## 🚀 Deployment

### Render Deployment
1. Create new repository on GitHub
2. Push this code to the repository
3. Connect to Render
4. Deploy using \`render.yaml\` configuration
5. Set environment variables in Render dashboard

### Local Testing
\`\`\`bash
npm install
npm start
\`\`\`

## 📊 Data Sources
- **Primary**: Backend API (https://backend-server-f82y.onrender.com)
- **Fallback**: Frontend API (https://bits-ai.io)
- **Simulation**: Local data (if APIs unavailable)

## 🔄 Automated Features
- **Price Updates**: Every 5 minutes
- **User Activity Tracking**: Real-time
- **Database Sync**: PostgreSQL integration
- **Error Handling**: Graceful fallbacks

## 🛠️ Commands

### Simple Bot Commands
- \`/help\` - Show available commands
- \`/price\` - Get current BITS price
- \`/cell\` - Get cell status and statistics
- \`/stats\` - Advanced statistics
- \`/activity\` - Check your activity
- \`/myreward\` - Check your rewards
- \`/register\` - Register for tracking

### AI Bot Interactions
- Ask questions about BITS
- Get information about BitSwapDEX
- Crypto and blockchain queries
- Natural language responses

## 📈 Monitoring
- **Heartbeat**: Every minute
- **Error Logging**: Comprehensive error handling
- **Database Connection**: Automatic fallback
- **API Health**: Multiple fallback sources

## 🔒 Security
- **Environment Variables**: Secure token storage
- **Database SSL**: Encrypted connections
- **API Keys**: Protected configuration
- **Error Handling**: No sensitive data exposure

## 📞 Support
For issues or questions, contact the BitSwapDEX development team.

---
**BitSwapDEX Team** | **Version 1.0.0** | **MIT License**
>>>>>>> d57d2cbc012c01e57d4e4dc15346c51c7becdd77

---

## FILE: ../frontend/BACKEND_ENV_VARIABLES.md

# 🔐 Backend Server - Environment Variables Checklist

## 📋 Variabile de mediu necesare pentru backend-server pe Render

### ✅ **CRITICAL - AUTENTIFICARE & SESSION** (NOU - pentru sistemul de login)

| Variabilă | Descriere | Exemplu | Status |
|-----------|-----------|---------|--------|
| \`SESSION_SECRET\` | Secret pentru sesiuni (cookies) - **OBLIGATORIU** | \`your-super-secret-key-change-in-production\` | ⚠️ **VERIFICĂ** |
| \`CORS_ALLOWED_ORIGINS\` | Origin-uri permise pentru CORS (separate prin virgulă) | \`https://bits-ai.io,https://www.bits-ai.io\` | ⚠️ **VERIFICĂ** |
| \`FRONTEND_URL\` | URL-ul frontend-ului pentru link-uri email | \`https://bits-ai.io\` | ⚠️ **VERIFICĂ** |
| \`NODE_ENV\` | Environment (production/development) | \`production\` | ⚠️ **VERIFICĂ** |

### ✅ **CRITICAL - EMAIL** (NOU - pentru verificare și resetare parolă)

**OPȚIUNE 1: Resend (Recomandat - mai simplu)**
| Variabilă | Descriere | Exemplu | Status |
|-----------|-----------|---------|--------|
| \`RESEND_API_KEY\` | API key de la Resend.com | \`re_xxxxxxxxxxxxx\` | ⚠️ **ADĂUGĂ** |
| \`EMAIL_FROM\` | Adresa email expeditor (trebuie verificată în Resend) | \`noreply@bits-ai.io\` | ⚠️ **ADĂUGĂ** |

**OPȚIUNE 2: SMTP (Alternativă)**
| Variabilă | Descriere | Exemplu | Status |
|-----------|-----------|---------|--------|
| \`SMTP_HOST\` | SMTP server host | \`smtp.gmail.com\` sau \`smtp.sendgrid.net\` | ⚠️ **ADĂUGĂ** |
| \`SMTP_USER\` | SMTP username | \`your-email@gmail.com\` | ⚠️ **ADĂUGĂ** |
| \`SMTP_PASS\` | SMTP password | \`your-app-password\` | ⚠️ **ADĂUGĂ** |
| \`SMTP_PORT\` | SMTP port (default: 587) | \`587\` sau \`465\` | ⚠️ **ADĂUGĂ** |
| \`SMTP_SECURE\` | SSL/TLS (true pentru port 465) | \`false\` sau \`true\` | ⚠️ **ADĂUGĂ** |
| \`EMAIL_FROM\` | Adresa email expeditor | \`noreply@bits-ai.io\` | ⚠️ **ADĂUGĂ** |

**NOTĂ:** Sistemul încearcă mai întâi Resend, apoi SMTP. Dacă niciuna nu este configurată, doar loghează link-urile (pentru development).

### ✅ **CRITICAL - DATABASE** (Există deja)

| Variabilă | Descriere | Status |
|-----------|-----------|--------|
| \`DATABASE_URL\` | PostgreSQL connection string | ✅ **VERIFICAT** (din imagine) |

---

## 📋 **EXISTING VARIABLES** (Verifică că sunt setate corect)

### 🔹 **Telegram** (Există deja)
- ✅ \`TELEGRAM_BOT_TOKEN\`
- ✅ \`TELEGRAM_AI_BOT_TOKEN\`
- ✅ \`TELEGRAM_BROADCAST_BOT_TOKEN\`
- ✅ \`TELEGRAM_CHAT_ID\`
- ✅ \`TELEGRAM_GROUP_ID\`
- ✅ \`TELEGRAM_REPORT_CHAT_ID\`
- ✅ \`TELEGRAM_CONTRACT_ADDRESS\`

### 🔹 **Stripe** (Există deja)
- ✅ \`STRIPE_SECRET_KEY\`
- ✅ \`STRIPE_WEBHOOK_SECRET\`
- ✅ \`STRIPE_PRICE_ID_EUR10\`

### 🔹 **Solana** (Există deja)
- ✅ \`SOLANA_RECEIVE_WALLET\`

### 🔹 **Blockchain** (Verifică dacă există)
- ⚠️ \`BSC_RPC_URL\` sau \`BLOCKCHAIN_URL\`
- ⚠️ \`TOKEN_CONTRACT_ADDRESS\` sau \`BITS_TOKEN_ADDRESS\`
- ⚠️ \`SOL_RPC_HTTP\`
- ⚠️ \`BACKEND_PRIVATE_KEY\` sau \`ADMIN_PRIVATE_KEY\`
- ⚠️ \`ADMIN_PASSWORD\` sau \`ADMIN_PASS\`

### 🔹 **OpenAI** (Dacă folosești AI features)
- ⚠️ \`OPENAI_API_KEY\`
- ⚠️ \`OPENAI_MODEL\` (opțional, default: \`gpt-4o-mini\`)

### 🔹 **AWS** (Dacă folosești AWS SES pentru email)
- ⚠️ \`AWS_ACCESS_KEY_ID\`
- ⚠️ \`AWS_SECRET_ACCESS_KEY\`
- ⚠️ \`AWS_REGION\`

---

## 🚀 **CHECKLIST PENTRU RENDER**

### **PASUL 1: Verifică variabilele existente**
- [ ] \`DATABASE_URL\` - ✅ Setat
- [ ] \`TELEGRAM_*\` - ✅ Setate
- [ ] \`STRIPE_*\` - ✅ Setate
- [ ] \`SOLANA_RECEIVE_WALLET\` - ✅ Setat

### **PASUL 2: Adaugă variabilele NOI pentru login**

#### **A. Session & CORS**
- [ ] \`SESSION_SECRET\` - **OBLIGATORIU** - Generează un secret puternic
  \`\`\`bash
  # Generează un secret:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  \`\`\`
- [ ] \`CORS_ALLOWED_ORIGINS\` - **OBLIGATORIU**
  \`\`\`
  https://bits-ai.io,https://www.bits-ai.io
  \`\`\`
- [ ] \`FRONTEND_URL\` - **OBLIGATORIU**
  \`\`\`
  https://bits-ai.io
  \`\`\`
- [ ] \`NODE_ENV\` - **OBLIGATORIU**
  \`\`\`
  production
  \`\`\`

#### **B. Email Service (Alege UNA dintre opțiuni)**

**OPȚIUNE A: Resend (Recomandat)**
- [ ] \`RESEND_API_KEY\` - Obține de la https://resend.com/api-keys
- [ ] \`EMAIL_FROM\` - Adresa verificată în Resend (ex: \`noreply@bits-ai.io\`)

**OPȚIUNE B: SMTP (Gmail, SendGrid, etc.)**
- [ ] \`SMTP_HOST\` - ex: \`smtp.gmail.com\` sau \`smtp.sendgrid.net\`
- [ ] \`SMTP_USER\` - Username SMTP
- [ ] \`SMTP_PASS\` - Password SMTP (pentru Gmail, folosește App Password)
- [ ] \`SMTP_PORT\` - \`587\` (TLS) sau \`465\` (SSL)
- [ ] \`SMTP_SECURE\` - \`false\` pentru port 587, \`true\` pentru port 465
- [ ] \`EMAIL_FROM\` - Adresa expeditor

---

## 🔍 **VERIFICARE FINALĂ**

După ce adaugi variabilele, verifică în Render:
1. **Environment** tab → Toate variabilele sunt setate
2. **Logs** tab → Verifică că nu sunt erori la pornire
3. **Testează** endpoint-ul \`/api/auth/register\` pentru a verifica că email-urile sunt trimise

---

## 📝 **NOTĂ IMPORTANTĂ**

- \`SESSION_SECRET\` trebuie să fie **unic și secret** - nu îl partaja niciodată
- \`CORS_ALLOWED_ORIGINS\` trebuie să includă **toate** domeniile frontend (cu și fără www)
- Pentru email, **Resend** este mai simplu de configurat decât SMTP
- Dacă nu configurezi email, sistemul va funcționa dar va doar loga link-urile (pentru development)

---

## 🎯 **PRIORITATE**

**CRITICAL (Sistemul nu funcționează fără):**
1. \`SESSION_SECRET\` ⚠️
2. \`CORS_ALLOWED_ORIGINS\` ⚠️
3. \`FRONTEND_URL\` ⚠️
4. \`NODE_ENV=production\` ⚠️
5. \`DATABASE_URL\` ✅ (deja setat)

**IMPORTANT (Email-urile nu vor fi trimise fără):**
6. \`RESEND_API_KEY\` + \`EMAIL_FROM\` SAU \`SMTP_*\` variabilele ⚠️

---

## FILE: ../telegram-bot-repo-git/README.md

# 🤖 BitSwapDEX Telegram Bots

Unified Telegram bots service for BitSwapDEX - User tracking, automated messages, and AI assistance.

## 🚀 Features

### Simple Bot (\`simple-bot.js\`)
- **User Activity Tracking** - Register and track user activity in Telegram groups
- **Live Price Data** - Fetch real-time $BITS price from backend API
- **Round Statistics** - Display current presale round information
- **Automated Messages** - Send scheduled messages with random timing
- **Commands**: \`/test\`, \`/register\`, \`/price\`, \`/cell\`, \`/stats\`, \`/activity\`, \`/myreward\`

### AI Bot (\`bot.js\`)
- **OpenAI Integration** - Answer questions about BitSwapDEX using GPT-3.5-turbo
- **Documentation Knowledge** - Uses internal docs.md for accurate responses
- **Conversation Memory** - Maintains context for better interactions

## 📊 Data Sources

### Primary: Backend API (Render)
- **URL**: \`https://backend-server-f82y.onrender.com/api/presale/current\`
- **Data**: Real-time presale round data, timer information, sales progress

### Fallback: Frontend API
- **URL**: \`https://bits-ai.io/api/presale/current\`
- **Data**: Frontend presale data when backend is unavailable

### Database: PostgreSQL (Render)
- **Purpose**: User activity tracking and rewards
- **Tables**: \`telegram_user_activity\`

## 🔧 Configuration

### Environment Variables
\`\`\`bash
# Telegram Bot Tokens
TELEGRAM_BOT_TOKEN=7738929253:AAFnr7Y-WvQUOpVn7ikKfPPYNbR8RFEFnG8
TELEGRAM_AI_BOT_TOKEN=7738929253:AAFnr7Y-WvQUOpVn7ikKfPPYNbR8RFEFnG8

# Telegram Group ID
TELEGRAM_GROUP_ID=-1002179349195

# OpenAI API Key
OPENAI_API_KEY=your_openai_key_here

# Database Configuration
DATABASE_PASSWORD=your_db_password
DATABASE_URL=your_db_url

# API URLs
BACKEND_API_URL=https://backend-server-f82y.onrender.com
FRONTEND_API_URL=https://bits-ai.io
\`\`\`

## 🚀 Deployment

### Render.com
1. **Service Type**: Worker
2. **Build Command**: \`npm install\`
3. **Start Command**: \`node index.js\`
4. **Cost**: $7/month

### Local Development
\`\`\`bash
# Install dependencies
npm install

# Start both bots
npm start

# Or start individually
node simple-bot.js
node bot.js
\`\`\`

## 📱 Commands

### User Commands
- \`/test\` - Test bot functionality
- \`/register\` - Register for activity tracking
- \`/price\` - Get current $BITS price
- \`/cell\` - Get presale cell status
- \`/stats\` - Get advanced statistics
- \`/activity\` - Check your activity status
- \`/myreward\` - Check your rewards
- \`/help\` - Show all commands

### Admin Commands (Automated Messages)
- \`/auto_daily\` - Send daily message
- \`/auto_hourly\` - Send hourly message
- \`/auto_education\` - Send educational tip
- \`/auto_celebration\` - Send celebration message
- \`/auto_stats\` - Send round statistics

## 🔄 Automated Messages

### Scheduling
- **Daily Messages**: 09:00 AM
- **Hourly Messages**: Every hour
- **Periodic Messages**: Every 4 hours
- **Random Statistics**: 30 minutes - 3 hours (random timing)

### Message Types
- Daily reminders
- Hourly engagement questions
- Educational tips
- Celebration messages
- Round statistics updates

## 📊 Database Schema

### telegram_user_activity
\`\`\`sql
CREATE TABLE telegram_user_activity (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  chat_id BIGINT,
  first_seen BIGINT,
  last_seen BIGINT,
  seconds_spent INTEGER DEFAULT 0,
  wallet_address VARCHAR(255),
  last_reward_date TIMESTAMP,
  total_rewards_claimed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

## 🛠️ Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram      │    │   Backend API   │    │   Frontend API  │
│   Group         │◄──►│   (Render)      │◄──►│   (bits-ai.io)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Simple Bot    │    │   PostgreSQL    │    │   OpenAI API    │
│   (Tracking)    │    │   Database      │    │   (GPT-3.5)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Bot        │    │   Automated     │    │   Documentation │
│   (OpenAI)      │    │   Messages      │    │   (docs.md)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## 🔍 Monitoring

### Logs
- Real-time console logging
- Error tracking and reporting
- API response monitoring
- Database connection status

### Health Checks
- Bot status monitoring
- API availability checks
- Database connectivity
- Automated message delivery

## 🚨 Error Handling

### Fallback Mechanisms
1. **Backend API** → **Frontend API** → **Simulated Data**
2. **Database** → **Local Mode** (simulated data)
3. **OpenAI** → **Error message** with retry

### Graceful Degradation
- Bots continue working with simulated data
- User experience maintained during outages
- Automatic recovery when services return

## 📈 Performance

### Optimization
- Connection pooling for database
- Request timeouts (10s backend, 5s frontend)
- Memory-efficient conversation history
- Efficient automated message scheduling

### Scalability
- Stateless bot design
- External database for persistence
- Modular architecture for easy scaling

## 🔐 Security

### Data Protection
- Environment variables for sensitive data
- Database connection with SSL
- Input validation and sanitization
- Rate limiting for API calls

### Access Control
- Telegram group membership verification
- User activity tracking
- Reward system with thresholds

## 📞 Support

For issues or questions:
1. Check logs in Render dashboard
2. Verify environment variables
3. Test API endpoints manually
4. Review database connectivity

---

**Cost**: $7/month (1 Render worker service)
**Uptime**: 99.9% (with fallback mechanisms)
**Features**: User tracking, automated messages, AI assistance

---

## FILE: ../telegram-bot-repo-git/project-kb.md

# BitSwapDEX AI — Product Knowledge Base

## Quick Links (Official)
- Website: https://bits-ai.io
- Whitepaper (GitBook): https://bitswap-5.gitbook.io/bitswapdex-ai/
- Presale: https://bits-ai.io/#/presale
- AI Hub: https://bits-ai.io/#/ai-hub
- DEX: https://bits-ai.io/#/dex-edu
- Bitcoin Academy: https://bits-ai.io/#/bitcoin-academy
- Rewards Hub: https://bits-ai.io/#/rewards-hub
- Staking: https://bits-ai.io/#/staking

---

## Presale — How to buy $BITS (on website)

1. **Connect Wallet** (MetaMask, Trust, Coinbase, etc.) — BSC or Ethereum network recommended.
2. **Choose Payment Method:**
   - Crypto: BNB, ETH, USDT, BTCB, STX, SOL (if SOL, you must provide a BSC/Ethereum receiving wallet).
   - Fiat/Card: Stripe integration (USD, EUR, etc.) — processed as USD equivalent in $BITS.
3. **Enter Amount** → Review → **Buy Now** → Sign transaction (on-chain) or complete Stripe flow (off-chain).
4. **Receive $BITS:** allocated immediately (visible in Presale Dashboard / "My Allocation"), claimable at TGE.

**Additional Investment Bonus (paid in $BITS):**
- $100 → 3%
- $250 → 5%
- $500 → 7%
- $1,000 → 10%

---

## Referral / Invite (Presale)

- **How it works:** Invite friends via your unique referral link (includes \`?ref=<your_wallet_address>\` param).
- **Where to get your link:**
  - In Telegram: \`/invite\` (Simple Bot).
  - On website: Presale Dashboard → "Referral" section.
- **Reward calculation:** Backend/contract tracks purchases made via your link; rewards can be claimed in **$BITS** or **USDC** (treasury payout during presale).
- **Claim & Stake:** In the Rewards Hub, you can choose:
  - **Claim to Wallet:** Receive $BITS or USDC directly.
  - **Transfer to Staking:** Move $BITS rewards directly to the Staking contract to earn more.
- **Where to claim:** Rewards Hub (https://bits-ai.io/#/rewards-hub) → "Invite/Referral" card → Choose Currency → Claim.
- **Tracking:** \`/myrefs\` (Telegram) or Presale Dashboard → "My Referrals" section.

---

## SOL / Solana payments (Important UX)

- **User must provide a BSC/Ethereum receiving wallet** when paying with SOL, because $BITS is a BEP-20 token (Binance Smart Chain).
- **Why:** Solana wallets cannot receive BEP-20 tokens; the backend receives SOL, then allocates $BITS to the BSC/ETH address provided by the user.
- **Bot guidance:** If a user asks "I paid with SOL but don't see my BITS in my Solana wallet," explain that they need to check the BSC/Ethereum wallet they specified during purchase.

---

## "Cells" / "Rounds" (CellManager.sol)

- **What they are:** The presale is structured into "cells" (rounds), each with a fixed supply and a price that increases progressively as cells sell out.
- **Where to see:** Presale Dashboard → "Current Cell" / "Next Cell" / "Price" / "Supply Remaining".
- **Data source:** Smart contract \`CellManager.sol\` (BSC: \`0x957B858cc0684c8a91ec3C7f8A9E3DA2Df9F3bC6\`) via frontend API \`/api/presale/current\`.
- **Price changes:** Automatic on-chain (when a cell's supply is exhausted, the next cell activates at a higher price per $BITS).
- **Bot guidance:** If a user asks "When does price go up?", the answer is "When the current cell sells out."

---

## Claiming / Delivery (TGE)

- **Allocation:** All $BITS purchased during presale (including bonuses) are allocated immediately and visible in Presale Dashboard.
- **Claiming:** At TGE (Token Generation Event), users can claim their full allocation via the Presale Dashboard ("Claim" button → BSC transaction).
- **Requirements:** Connected wallet must be the same wallet used for purchase; user needs BNB for gas.
- **After claim:** $BITS tokens are transferred to user's wallet on BSC; visible in MetaMask/Trust/etc. (add token: \`0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe\`).

---

## Networks + gas (brief troubleshooting)

- **Primary network:** Binance Smart Chain (BSC) — BEP-20 tokens.
- **Gas token:** BNB (native BSC token).
- **Common errors:**
  - "Insufficient funds for gas" → user needs BNB in wallet (even if paying with USDT/ETH/etc., gas is always in BNB on BSC).
  - "Wrong network" → user's wallet is on Ethereum/Polygon/etc., not BSC; switch network to BSC in wallet settings.
  - "Transaction failed" → likely insufficient BNB, or user rejected signature, or slippage (for DEX swaps, not presale).

---

## How to answer when user asks "where do I do X?"

- **Buy $BITS:** Presale page (https://bits-ai.io/#/presale).
- **See my allocation / how much I bought:** Presale Dashboard (same page, after connecting wallet).
- **Claim my $BITS:** Presale Dashboard → "Claim" button (available at TGE).
- **Stake $BITS:** Staking page (https://bits-ai.io/#/staking).
- **See/claim Telegram rewards:** Rewards Hub (https://bits-ai.io/#/rewards-hub) → "Telegram Activity" card. Can claim in $BITS (standard), USDC (treasury), or Stake directly.
- **See/claim referral rewards:** Rewards Hub → "Invite/Referral" card. Can claim in $BITS, USDC, or Stake directly.
- **Trade (demo):** DEX page (https://bits-ai.io/#/dex-edu).
- **AI tools (Stress Test, etc.):** AI Hub (https://bits-ai.io/#/ai-hub).
- **Learn about Bitcoin/crypto:** Bitcoin Academy (https://bits-ai.io/#/bitcoin-academy).

---

## AI Hub (AI Utility Nexus)

**What it is:** A suite of AI-powered tools for crypto traders/investors, accessible via https://bits-ai.io/#/ai-hub.

**Tools available:**
1. **Portfolio Stress Test:** Simulates market crashes and tests user's psychological resilience under extreme conditions (includes audio/video feedback, breaking news TTS, etc.).
2. **Mind Mirror:** Psychological analysis feature (prompts user for wallet address + personality assessment) → generates a "crypto psyche profile."
3. **(Other tools may be added in the future, e.g., sentiment analysis, AI trading signals, etc.)**

**Access:**
- Some tools may require a **connected wallet holding $BITS** (implementation-dependent; Mind Mirror typically requires $BITS holding).
- If a tool is gated and user doesn't hold $BITS, UI will prompt: "Connect wallet with $BITS balance to access."

**Routes:**
- AI Hub main: \`/#/ai-hub\`
- Portfolio Stress Test: \`/#/ai-hub/portfolio-stress\`
- Mind Mirror: \`https://bits-ai.io/mind-mirror\` (may also be accessible via AI Hub nav)

**Disclaimers:**
- Tools are for **educational/entertainment purposes**, not financial advice.
- Stress Test simulates fictional scenarios; does not predict real market outcomes.

---

## DEX (Demo + Real Mode)

**What it is:** A decentralized exchange UI (swap interface) with two modes:
1. **Demo Mode (default):** Simulates trading with fake/placeholder tokens (no real blockchain transactions).
2. **Real Mode (if enabled):** Connects to real BSC liquidity pools and executes on-chain swaps (requires connected wallet + BNB for gas).

**UX:**
- **Token universe:** BNB (native), BTCB, ETH (Binance-Peg), USDT, STX (wrapped), BITS (on BSC).
- **How to use:** Select "From" token + amount → Select "To" token → "Swap" → (in Real Mode) sign transaction in wallet.
- **Slippage / Price Impact:** Real Mode shows slippage tolerance settings; Demo Mode may simulate price impact for realism.

**Cinematic loader:**
- DEX uses a "cosmic loader" animation during initial load (referenced in \`CosmicLoader.jsx\`).

**Bot guidance:**
- If a user asks "Can I trade $BITS now?", answer: "You can use the DEX demo to simulate trades; real trading will be available after TGE/listing."
- If a user asks "Why can't I swap?", check: (1) wallet connected?, (2) correct network (BSC)?, (3) sufficient balance + gas (BNB)?

---

## Bitcoin Academy

**What it is:** Educational hub with articles/lessons about Bitcoin, blockchain, and crypto fundamentals.

**Access:** https://bits-ai.io/#/bitcoin-academy

**Topic types:**
- Bitcoin basics (what is Bitcoin, how it works, etc.)
- Blockchain fundamentals (consensus, mining, wallets, etc.)
- Trading/investment concepts (DCA, HODL, technical analysis, etc.)
- Security (private keys, hardware wallets, phishing prevention, etc.)

**Bot guidance:**
- If a user asks "How do I learn about Bitcoin?", point them to the Bitcoin Academy.
- If a user asks a basic question (e.g., "What is a wallet?"), you can answer briefly and suggest "For more, see Bitcoin Academy: https://bits-ai.io/#/bitcoin-academy."

---

## Future Exchange / Pro Trade (Draft Roadmap — NOT LIVE)

**Important:** This feature is **planned / in draft**, not yet implemented. Do not present it as a live product. If a user asks "Is there an exchange?", answer: "Currently, the DEX (demo/real mode) is available. A full-featured exchange (Pro Trade) is on the roadmap, planned for post-TGE."

**Economic Principle:**
- Traditional centralized exchanges (CEX) take fees but offer zero monetary incentive for users to trade actively.
- Pro Trade vision: "**Trade to Earn**" — active traders earn $BITS rewards (mechanism TBD: volume-based, referral-based, or hybrid).

**Architecture (draft):**
- **Centralized order book** (off-chain matching engine for speed) + **on-chain settlement** (custody/withdrawals via smart contracts on BSC).
- **Front-end:** React-based UI (similar to DEX, but with advanced charting, order types, etc.).
- **Back-end:** Node.js API (order matching, account management, KYC if needed) + PostgreSQL/Redis for state.
- **Custody:** Multi-sig or contract-based (TBD; security audit required).

**Implementation Options (brief):**
1. **Build from scratch:** Full control, but highest dev/audit cost.
2. **Modify open-source DEX engine** (e.g., 0x, dYdX-style) — faster, but less differentiation.
3. **Partner with existing CEX white-label** (fastest, but depends on third-party).

**Roadmap (draft):**
- **MVP (v1):** Spot trading (BTC, ETH, BNB, USDT, BITS pairs), basic order types (limit, market), web UI.
- **v2:** Advanced orders (stop-loss, take-profit), mobile app, API for algo traders.
- **v3:** Margin/leverage (if legally feasible), staking integration, cross-chain deposits.

**Go/No-Go Criteria:**
- **Liquidity:** Minimum $5M TVL (Total Value Locked) or partnerships with market makers.
- **Security:** Clean audit from reputable firm (CertiK, Hacken, etc.).
- **Regulatory:** Legal green-light in target jurisdictions (TBD; possibly geo-restricted).

**Bot guidance:**
- If a user asks "When will Pro Trade launch?", answer: "It's on the roadmap for post-TGE; exact timeline depends on development/audit progress. Check official announcements."
- If a user asks "Can I use leverage?", answer: "Not currently; margin trading is planned for v3 (future release)."

---

## Planned Exchange Listings + Liquidity (Forward-Looking Plan — NOT LIVE / NOT GUARANTEED)

**Important:** The following is a **draft plan / aspirational roadmap**, not a confirmed commitment. Market conditions, regulatory factors, and project progress may affect actual outcomes.

**Target Exchange Listings (top 10, aspirational):**
1) Binance  
2) Coinbase  
3) Kraken  
4) OKX  
5) Bybit  
6) KuCoin  
7) Gate.io  
8) Crypto.com Exchange  
9) Bitfinex  
10) HTX (Huobi)  

*(List is not exhaustive; additional Tier-2/Tier-3 exchanges may be pursued.)*

**Planned Initial Liquidity:**
- Target starting liquidity: **$25,000,000 USD** (planned to be applied in full as initial liquidity).
- Source: Treasury allocation + presale proceeds + strategic partners (implementation-dependent).

**Supply Context:**
- Total **3,000,000,000 $BITS** minted (fixed supply, no further minting).
- Listing price will be determined by order book dynamics / AMM reserves and market conditions at launch.

**Reference Planning Price:**
- Internally, the project is planning for a listing price in the **"cents range"** (forward-looking estimate, not a guarantee).
- If you compute a simple reference as \\( P_{ref} = \\frac{25,000,000}{3,000,000,000} \\), you get ≈ $0.0083 per $BITS, but actual listing price depends on:
  - Order book depth / AMM liquidity concentration.
  - Market demand at launch (buy pressure vs. sell pressure).
  - Tokenomics (vesting schedules, circulating supply at TGE, etc.).

**Technical Note (for the bot):**
- **Liquidity ≠ Market Cap:** $25M liquidity does not mean market cap = $25M. Market cap is (circulating supply × price), which can be much higher if demand drives price up.
- **Price is not guaranteed:** The "cents range" is a planning target, not a promise. Do not quote exact numbers unless explicitly approved for public disclosure.

**Bot guidance:**
- If a user asks "What will the listing price be?", answer: "The project is planning for a listing price in the cents range, but the exact price will be determined by market conditions at launch. Listing price depends on liquidity depth, demand, and order book dynamics."
- If a user asks "Which exchanges?", answer: "The team is targeting top-tier exchanges (Binance, Coinbase, etc.) and Tier-2 platforms. Listings are subject to exchange approval and market readiness; official announcements will be made closer to TGE."
- If a user asks for a specific price number, say: "The project does not guarantee a specific listing price. The reference planning range is in the cents, but final price depends on market forces. For updates, follow official channels."

---

## Notes for the Bot (Meta-Instructions)

- **Always answer in the user's language** (if user writes in Romanian, answer in Romanian; if English, answer in English, etc.).
- **Never mention competitors** (e.g., similar projects).
- **Never promise specific outcomes** (listing price, exchange approvals, etc.) — use "planned," "targeted," "draft," "subject to market conditions."
- **Prioritize official links** (bits-ai.io, GitBook whitepaper) over third-party sources.
- **If uncertain:** Say "I don't have that information in my knowledge base; please check the official website (https://bits-ai.io) or whitepaper for the latest updates."
- **Keep answers concise and crypto-focused** — avoid unnecessary jargon or overly technical explanations unless user asks for details.

---

`;
}
