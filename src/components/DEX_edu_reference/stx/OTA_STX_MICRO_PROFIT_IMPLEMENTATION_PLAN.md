# Plan de implementare complet: OTA Micro-Profit pe STX + BITS pentru gas

**Index navigare OTA STX:** `docs/OTA_STX_README.md`  
**Env frontend (swap după deploy):** `docs/STX_FRONTEND_ENV.md`  
**Contracte / deploy:** `docs/STX_CONTRACTS_VERIFICATION_AND_DEPLOYMENT.md` — inventar fișiere **SSOT:** `remix/OTA/STACKS/README.md`  
**Locație:** `src/components/DEX/stx/OTA_STX_MICRO_PROFIT_IMPLEMENTATION_PLAN.md`  
**Referință:** SEI – `src/components/DEX/sei/OTA_SEI_MICRO_PROFIT_IMPLEMENTATION_PLAN.md`  
**Contracte (cod Clarity):** `C:\Users\bits\Desktop\remix\OTA\STACKS`  
**Backend Faza 2 (spec):** `docs/OTA_STX_BACKEND_FAZA2_SPEC.md` – implementare în backend-server (repo separat).

**Scop:** Micro-profit pe Stacks (la fel ca pe SEI): strategie dump & pump, profit mic per round-trip peste costul de gas. Plus: pregătire pentru **$BITS ca token cu care se poate plăti gas** (relayer/sponsor) și opțiuni **bridge vs wrap** BITS pe Stacks.

---

## 1. Da, se poate la fel ca pe SEI

| Aspect | SEI | STX (plan) |
|--------|-----|------------|
| Strategie | micro-profit-sei, round-trip buy/sell | micro-profit-stx, round-trip buy/sell |
| Pereche | SEI/USDC | STX/USDA (sau STX/sBTC) pe Alex |
| Gas | usei, ~0.000245 USD/swap | STX, estimat per tx (Hiro API) |
| Min profit | % peste gas (50–200%) sau USD fix | Idem |
| Execuție | User semnează swap sau bot (Auto) | User semnează sau bot prin executor (user-vault) |
| Backend | chain=sei, strategie, quote, execute | chain=stx, strategie, quote, execute |
| UI | OtaSeiMicroProfitPanel | OtaStxMicroProfitPanel (sau secțiune în layout STX) |

Fluxul este același: config → live price/spread → shouldTriggerRoundTrip → executeRoundTrip (semnare user sau backend cu bot).

---

## 2. Arhitectură pe 3 straturi (STX)

| Strat | Locație | Rol |
|-------|---------|-----|
| **Frontend** | `src/components/DEX/stx/` | Config micro-profit, estimare gas STX, quote, execuție swap (Leather/Connect), UI panel |
| **Backend** | backend-server (Render) | chain=stx, strategie MicroProfitStx, quote STX, execute (sau tx pentru semnare), istoric |
| **Contracte** | remix/OTA/STACKS | user-vault, ai-trading-executor, dex-wrapper, access-control — vezi README remix |

---

## 2b. Status implementare (2026-03) — verificare în repo

| Livrabil | Unde în cod / doc | Notă |
|----------|-------------------|------|
| `otaStxMicroProfitService.js` | `stx/services/otaStxMicroProfitService.js` | Config, quote API, `executeRoundTrip`, Auto API, `stacksProvider` către `executeSwap`. |
| `executeSwap` (semnare) | `stx/services/stxContractService.js` | `openContractCall` (`@stacks/connect`); `dex-wrapper.swap` sau `txForSigning` backend; **necesită** env din `docs/STX_FRONTEND_ENV.md`. |
| Principalii SIP-010 | `stx/stxStacksPrincipals.js` | Mapare simbol → `REACT_APP_STX_SIP010_*` (fără adrese hardcodate). |
| UI round-trip | `OtaStxMicroProfitPanel.jsx` | `getStacksProvider()` transmis la `runRoundTrip`. |
| Pagină OTA STX | `frontend/pages/OTAStxPage.jsx` | — |
| Backend `chain=stx` | `docs/OTA_STX_BACKEND_FAZA2_SPEC.md` | Implementare în **backend-server** — nu este verificată aici. |
| Deploy contracte | remix + env | Faza 4 rămâne până la deploy + setare `REACT_APP_STX_*`. |
| Dependențe npm (Stacks) | `package.json` | `@stacks/connect`, `@stacks/transactions`, `@stacks/network`. |

**Test manual recomandat după deploy + env:** Leather conectat → `/dex/ota/stx` → Run round-trip → confirmă `txHash` în explorer (rețea din `REACT_APP_STX_CHAIN_ID`).

---

## 3. Faze de implementare

### Faza 1 – Frontend: serviciu + config (STX)

- [x] **1.1** Creare **otaStxMicroProfitService.js** în `stx/services/`:
  - `STRATEGY_NAME = 'micro-profit-stx'`
  - `DEFAULT_STRATEGY_CONFIG`: pair STX/USDA (sau STX/sBTC), minProfitOverGasPercent, maxSlippageBps, gasEstimateUsdPerSwap (estimare STX → USD)
  - `getStrategyConfig()` – cache + API `?chain=stx&strategy=micro-profit-stx` (fallback local)
  - `estimateGasCostPerRoundTrip()` – 2 tx (sell + buy) în STX sau USD (Hiro fee estimate sau constantă inițială)
  - `getMinProfitUsd(config, gasRoundTripUsd)` – ca pe SEI
  - `shouldTriggerRoundTrip(marketData)` – compara spread × notional vs minProfit
  - `fetchStxQuote(tokenIn, tokenOut, amountIn, slippageBps)` – backend `/api/ai-trading/quote?chain=stx&...` sau Alex API
  - `executeRoundTrip(params)` – backend `POST .../execution/execute` cu `chain: 'stx'` + `txForSigning` → `executeSwap`; sau fallback quote + `executeSwap` direct (vezi `stxStacksPrincipals.js` + env)
  - `getStxAutoStatus(userId)`, `setStxAuto(userId, params)` – echivalent SEI Auto (necesită backend STX)
- [x] **1.2** Constante / env: `REACT_APP_STX_USER_VAULT_ADDRESS`, `REACT_APP_STX_AI_TRADING_EXECUTOR_ADDRESS`; pereche default în config; **BITS**: `REACT_APP_STX_BITS_TOKEN_ADDRESS`, `REACT_APP_STX_PAY_GAS_WITH_BITS` (stxContractConfig.js).
- [x] **1.3** **stxContractService.js** — **executeSwap** implementat: `openContractCall` (`@stacks/connect`), provider Leather (`stacksProvider` din `OtaStxMicroProfitPanel`); apel `swap` pe `REACT_APP_STX_DEX_WRAPPER_ADDRESS` sau normalizare `backendPayload` (`txForSigning`). **Dependențe:** `@stacks/connect`, `@stacks/transactions`, `@stacks/network`. **Env obligatorii pentru swap manual:** `docs/STX_FRONTEND_ENV.md` (`DEX_WRAPPER` + `REACT_APP_STX_SIP010_*`). **readContract:** Hiro `call-read` (path adresă/nume/funcție). **Rămâne:** flux „plătești gas cu BITS” / relayer — §7 (nu în `executeSwap` de bază).

### Faza 2 – Backend: chain=stx + strategie + quote

**Spec implementare backend:** `docs/OTA_STX_BACKEND_FAZA2_SPEC.md` (contract API + checklist pentru backend-server).

- [ ] **2.1** Backend: parametru **chain** (evm | sei | **stx**) în rutele OTA (execution, strategies, quote) – vezi spec §2.1.
- [ ] **2.2** Serviciu **StxQuoteService** + **StxTxBuilder**: quote minAmountOut; pentru execute: construcție apel Clarity (execute-trade sau swap) – spec §2.2, §2.3, §2.4.
- [ ] **2.3** Strategie **MicroProfitStxStrategy**: preț STX/USDA, spread, gas estimat, min profit over gas → semnal buy/sell/skip – spec §2.5.
- [ ] **2.4** Endpoint execute acceptă `chain: 'stx'`; returnează txForSigning (semnare frontend) sau execută cu bot wallet STX – spec §2.4.
- [ ] **2.5** Sursă preț pentru STX: Binance STX/USDT → CoinGecko → Hiro (cache 1–2 min) – spec §2.6.

### Faza 3 – UI: panou Micro-Profit STX

- [x] **3.1** **OtaStxMicroProfitPanel.jsx** (sau secțiune în StxLayout):
  - Conectare Stacks wallet (StxWalletContext).
  - Pereche STX/USDA, live price, estimare gas round-trip, min profit % (50/100/150/200).
  - Toggle „OTA AI auto-trade” (local sau server dacă userId).
  - Secțiune „STX Auto”: max STX per trade, Launch session / Stop session, adresă deposit pentru bot (dacă backend expune).
  - Butoane: „Check signal”, „Run round-trip” (manual).
  - Recent activity / executions (dacă backend expune).
- [x] **3.2** Stiluri: reutilizare `ota-sei-micro-profit.css` (wrapper `ota-stx-micro-profit`).
- [x] **3.3** Integrare: pagină /dex/ota/stx (OTAStxPage), rută DEXApp, Sidebar „OTA STX"; hook useOtaStxMicroProfit.

### Faza 4 – Contracte și DEX real

- [ ] **4.1** Deploy contracte STACKS (user-vault, executor, access-control, dex-wrapper) pe testnet/mainnet; setare env în frontend și backend.
- [ ] **4.2** **dex-wrapper** producție: înlocuire mock cu integrare Alex Protocol (swap real STX/USDA etc.).
- [ ] **4.3** (Opțional) User-vault: flow register → authorize-bot → deposit; executor execute-trade pentru Auto (bot semnează).

---

## 4. $BITS ca token pentru plătit gas – logică și opțiuni

### 4.1 Realitatea pe Stacks

- **Gas-ul nativ** pe Stacks se plătește **doar în STX**. Nu există „pay gas in BITS” la nivel de protocol.
- **Sponsored transactions**: un sponsor (relayer) plătește STX pentru tx; userul poate „plăti” în alt mod (ex. sBTC sau, în viitor, BITS) prin acord off-chain sau prin contract care primește BITS și notifică sponsorul.

### 4.2 Cum poți face „plătești gas cu BITS” pe viitor

1. **Relayer / Sponsor service**
   - User semnează tx cu `sponsored: true` (sau trimite intent).
   - Backend (sau contract) verifică că userul a „plătit” în BITS (ex. transfer BITS către treasury sau lock în contract).
   - Relayer-ul tău plătește STX pentru tx și broadcast.
   - Deci: **BITS ca „credite” pentru gas** – user dă BITS, sistemul plătește STX în numele lui.

2. **Contract „pay gas with BITS”**
   - User aprobă transfer BITS către un contract Stacks.
   - Contractul ține STX; când primește BITS (SIP-010), execută sau notifică un relayer să execute tx-ul userului și să consume STX din contract.
   - Rate de schimb BITS→STX poate fi fix sau din oracle.

Pentru ambele variante ai nevoie de **BITS pe Stacks**. De unde vine BITS-ul pe Stacks?

---

## 5. Bridge BITS (BSC → Stacks) vs Wrap / Mint BITS pe Stacks

### 5.1 Opțiunea A: Bridge BITS de pe BSC pe Stacks

- **Ce înseamnă:** Folosești un bridge (ex. Allbridge, XLink sau un bridge custom) care să ia BITS de pe BSC și să emită „wrapped BITS” (wBITS sau BITS.stx) pe Stacks.
- **Avantaje:**
  - Un singur token BITS „canonic” pe BSC; pe Stacks ai reprezentare 1:1 (sau cu fee).
  - Utilizatorii care dețin deja BITS pe BSC pot să îl folosească și pe Stacks fără a crea un token nou.
- **Dezavantaje:**
  - Trebuie ca bridge-ul să suporte token custom (BITS). Allbridge/XLink pot avea liste limitate; poate fi nevoie de **bridge partener** sau **bridge propriu**.
  - Cost și complexitate operațională (lichiditate, securitate bridge).

**Verdict:** **Mai bine pentru UX și pentru un singur supply** dacă găsești (sau construiești) un bridge care suportă BITS. Ideal pentru „plătești gas cu BITS” pe termen lung: userii își transferă BITS de pe BSC pe Stacks și îl folosesc la relayer.

### 5.2 Opțiunea B: Token BITS nativ / wrap pe Stacks (fără bridge din BSC)

- **Ce înseamnă:** Deploy contract SIP-010 pe Stacks cu nume „BITS” (sau „Wrapped BITS”). Supply-ul pe Stacks este independent (mint la cerere sau airdrop).
- **Avantaje:**
  - Nu depinzi de niciun bridge extern; poți lansa rapid „BITS pe Stacks” pentru gating (ex. min BITS pentru OTA) sau pentru utilitate în app.
  - Poți implementa relayer „pay gas with BITS” imediat: user trimite BITS (Stacks) către treasury, relayer plătește STX.
- **Dezavantaje:**
  - **Două surse de supply** (BSC și Stacks) dacă nu ai mecanism de burn/mint legat de bridge. Economic poate fi confuz (2 prețuri).
  - Dacă mai târziu faci bridge, trebuie aliniat (ex. burn pe BSC când mint pe Stacks).

**Verdict:** **Mai bine pentru viteză și control** dacă vrei să oferi „plătești gas cu BITS” rapid, fără să aștepți un bridge. Poți folosi BITS (Stacks) doar în app (gating, fee discount, relayer) și păstra BITS (BSC) ca token principal; mai târziu poți unifica prin bridge.

### 5.3 Recomandare scurtă

- **Pe termen scurt (MVP):** Deploy **BITS ca SIP-010 pe Stacks** (sau wrapped cu nume clar, ex. wBITS). Folosești BITS (Stacks) pentru:
  - gating OTA (min BITS pentru register, dacă vrei),
  - relayer „pay gas with BITS”: user trimite BITS → relayer plătește STX.
- **Pe termen lung:** **Bridge BITS BSC → Stacks** (când există partener sau bridge propriu) pentru un singur supply și UX consistent. Atunci wBITS de pe Stacks poate fi înlocuit/redenumit în „BITS” bridged.

Adăugarea în cod: **pregătire** acum (config, env pentru BITS contract address pe Stacks, flag „payGasWithBITS”), implementare relayer după ce ai BITS pe Stacks (bridge sau wrap).

---

## 6. Fișiere cheie (referință)

| Rol | Cale (frontend-edu) | Cale (backend) | Cale (Remix) |
|-----|---------------------|----------------|--------------|
| Plan (acest doc) | `stx/OTA_STX_MICRO_PROFIT_IMPLEMENTATION_PLAN.md` | – | Pointer: `remix/OTA/STACKS/README.md` + doc proiect |
| Serviciu micro-profit STX | `stx/services/otaStxMicroProfitService.js` | – | – |
| Principalii SIP-010 (env) | `stx/stxStacksPrincipals.js` | – | – |
| Config contracte STX | `stx/stxContractConfig.js` | – | – |
| Contract service STX | `stx/services/stxContractService.js` | – | – |
| UI panel Micro-Profit STX | `stx/OtaStxMicroProfitPanel.jsx` | – | – |
| Hook | `stx/hooks/useOtaStxMicroProfit.js` | – | – |
| Pagină OTA STX | `frontend/pages/OTAStxPage.jsx` | – | – |
| Rute execuție / quote | – | executionRoutes.js, quote (spec în `OTA_STX_BACKEND_FAZA2_SPEC.md`) | – |
| Strategie micro-profit STX | – | strategies/MicroProfitStxStrategy.js (planificat) | – |
| Tx/quote STX | – | StxTxBuilder / StxQuoteService (planificat) | – |
| Contracte OTA STX | – | – | `remix/OTA/STACKS/*.clar` |
| BITS pe Stacks (viitor) | `stxContractConfig` / env | – | SIP-010 deploy sau bridge |

---

## 7. Pregătire BITS pentru gas (în cod)

- [ ] **7.1** Env / config: `REACT_APP_STX_BITS_TOKEN_ADDRESS` (principal contract BITS pe Stacks). Opțional: `REACT_APP_STX_PAY_GAS_WITH_BITS=true`.
- [ ] **7.2** În **user-vault** (sau doc): deja există `min-bits-for-ota`; pe Stacks poți folosi același concept (user are X BITS pe Stacks pentru a folosi OTA). Nu schimbă direct „plătești gas în BITS” – asta e la relayer.
- [ ] **7.3** (Viitor) Relayer: endpoint sau service care primește tx semnat de user + proof că a trimis BITS; relayer plătește STX și face broadcast. Poate fi în backend-server sau serviciu separat.

---

## 8. Ordine recomandată de lucru (actualizat 2026-03)

1. **Faza 1 (frontend):** [x] serviciu + panel + `executeSwap` + env SIP-010 (`stxStacksPrincipals.js`, `docs/STX_FRONTEND_ENV.md`). Rămâne validare end-to-end cu contracte deployate + Leather.
2. **Faza 2 (backend):** [ ] `chain=stx` — `docs/OTA_STX_BACKEND_FAZA2_SPEC.md` (backend-server).
3. **Faza 3 (UI):** [x] integrare `/dex/ota/stx` — vezi §2b.
4. **Faza 4 (chain):** [ ] Deploy `remix/OTA/STACKS` (ordine în README remix); setare toate `REACT_APP_STX_*`; dex-wrapper producție (Alex) dacă nu folosiți doar modelul de test.
5. **BITS:** [ ] §4–§7 — relayer / bridge; nu e blocant pentru micro-profit de bază.

---

**Ultima actualizare:** 2026-03-21 (secțiuni 2b, 1.3, §6, §8, linkuri către `STX_FRONTEND_ENV` și contracte)
