# Plan de implementare: OTA AI Micro-Profit (dump & pump) pe SEI

**Unde găsești acest plan:**  
- **Frontend:** `src/components/DEX/sei/OTA_SEI_MICRO_PROFIT_IMPLEMENTATION_PLAN.md`  
- **Remix (pointer):** `C:\Users\bits\Desktop\remix\OTA\SEI\OTA_SEI_MICRO_PROFIT_PLAN.md`  
- **Doc temă:** `docs/OTA_AI_SEI_MICRO_PROFIT_DUMP_PUMP.md`

**Scop:** Logică OTA AI care pe SEI execută trading rapid (vânzare/cumpărare) pentru profituri mici, puțin peste costul de gas. SEI are finalitate ~400 ms și gas foarte mic (~0.000245 USD/swaps), deci este potrivit pentru acest tip de strategie.

**Backend:** `C:\Users\bits\Desktop\backend-server` (rulează pe Render). Planul include pașii și fișierele de creat/modificat acolo.

---

## 1. Arhitectură pe 3 straturi

| Strat | Locație | Rol |
|-------|---------|-----|
| **Frontend (frontend-edu)** | `src/components/DEX/sei/` | Config strategie, estimare gas, apel execuție (sau redirect), UI status micro-profit |
| **Backend (backend-server)** | `src/ota/` | Semnale micro-profit, construcție tx SEI (sau parametri), execuție (sau return tx pentru frontend), istoric |
| **Contracte (Remix SEI)** | `C:\Users\bits\Desktop\remix\OTA\SEI` | CosmWasm: sei-swap-executor, user-vault, ai-trading-executor; EVM opțional |

---

## 2. Faze de implementare

### Faza 1 – Schelet și contracte (acum / mâine)

- [ ] **1.1** Frontend: serviciu schelet **otaSeiMicroProfitService.js** (vezi secțiunea 4) – config, estimare gas, `shouldTriggerRoundTrip`, `executeRoundTrip` (stub).
- [ ] **1.2** Frontend: constantă strategie **STRATEGY_MICRO_PROFIT_SEI** și parametri (minProfitOverGas, pereche default, slippage).
- [ ] **1.3** Remix: asigură-te că **sei-swap-executor** este deployabil și că msg-urile (execute_swap, config) sunt aliniate cu frontend (seiContractConfig.js).
- [ ] **1.4** (Opțional) Remix: pregătire **user-vault** CosmWasm pentru înregistrare user + autorizare bot pe SEI.

### Faza 2 – Backend: chain SEI + strategie micro-profit

- [ ] **2.1** Backend: parametru **chain** (evm | sei) în rutele relevante OTA (ex. `src/ota/routes/ai-trading/executionRoutes.js`, signals, strategies).  
  - Fișiere: `executionRoutes.js`, `signalsRoutes.js`, eventual `AITradingExecutor.js` (sau nou `AITradingExecutorSei.js`).
- [ ] **2.2** Backend: serviciu **construcție tx SEI** (CosmJS-compatible): input (userAddress, tokenIn, tokenOut, amountIn, minAmountOut) → output (tx serializat sau msg-uri pentru frontend).  
  - Locație sugerată: `src/ota/services/SeiTxBuilder.js` sau `src/dex/sei/SeiSwapTxBuilder.js`.  
  - Folosește RPC/REST SEI (env: `SEI_RPC`, `SEI_REST`); fără cheie privată în backend dacă semnarea se face în frontend.
- [ ] **2.3** Backend: strategie **MicroProfitSei** (sau extinde TrendFollowingStrategy cu `chain === 'sei'` și parametri micro-profit).  
  - Locație: `src/ota/strategies/MicroProfitSeiStrategy.js`.  
  - Input: preț curent, spread, estimare gas SEI, min profit over gas. Output: semnal buy/sell sau skip.
- [ ] **2.4** Backend: endpoint (ex. POST `/api/ai-trading/execution/execute`) acceptă `chain: 'sei'`; pentru SEI apelează SeiTxBuilder și returnează tx/msg pentru frontend sau execută cu bot wallet SEI (dacă există).

### Faza 3 – Frontend: integrare reală

- [ ] **3.1** Conectare **otaSeiMicroProfitService** la API backend (base URL din env: `REACT_APP_OTA_API_URL` sau existent).  
  - Apel: get strategy config, get signals for SEI micro-profit, submit execute (chain=sei).
- [ ] **3.2** **SeiWalletContext** + **seiContractService.executeSwap**: finalizare semnare CosmJS (semnare în frontend cu Keplr/Compass) și broadcast.  
  - Doc: `SEI_TRADE_IMPLEMENTATION_TODO.md` – pasul „seiContractService + SwapPanel.sei”.
- [ ] **3.3** Pagină sau panou **OTA pe SEI**: selecție strategie „Micro-profit SEI”, afișare status (înregistrat / nu), buton Enable/Disable, istoric round-uri (dacă backend expune).

### Faza 4 – Date și DEX pe SEI

- [ ] **4.1** Backend: sursă preț pentru SEI (API Astroport/Phoenix sau aggregator; sau Binance SEI/USDT ca proxy).  
  - Integrare în `marketDataProvider.js` sau serviciu dedicat `SeiMarketDataService.js`.
- [ ] **4.2** Lichiditate și slippage: pereche lichidă (ex. SEI/USDC sau SEI/USDT pe Astroport), parametri max slippage în strategie și în executeSwap.

---

## 3. Fișiere cheie (referință rapidă)

| Rol | Cale (frontend-edu) | Cale (backend-server) | Cale (Remix) |
|-----|---------------------|----------------------------|--------------|
| Plan (acest doc) | `src/components/DEX/sei/OTA_SEI_MICRO_PROFIT_IMPLEMENTATION_PLAN.md` | – | `OTA/SEI/OTA_SEI_MICRO_PROFIT_PLAN.md` (pointer) |
| Serviciu micro-profit | `src/components/DEX/sei/services/otaSeiMicroProfitService.js` | – | – |
| Constante strategie | în serviciu sau `sei/constants/otaSeiMicroProfit.js` | – | – |
| Swap SEI (frontend) | `sei/services/seiContractService.js` | – | – |
| Config contracte SEI | `sei/seiContractConfig.js` | – | – |
| Rute execuție | – | `src/ota/routes/ai-trading/executionRoutes.js` | – |
| Executor OTA | – | `src/ota/services/AITradingExecutor.js` (EVM) | – |
| Builder tx SEI | – | `src/ota/services/SeiTxBuilder.js` (de creat) | – |
| Strategie micro-profit | – | `src/ota/strategies/MicroProfitSeiStrategy.js` (de creat) | – |
| Contract swap SEI | – | – | `remix/OTA/SEI/sei-swap-executor/` |
| User-vault / executor | – | – | `remix/OTA/SEI/` (user-vault, ai-trading-executor – de creat) |

---

## 4. Schelet serviciu frontend (otaSeiMicroProfitService.js)

Serviciul este creat în `src/components/DEX/sei/services/otaSeiMicroProfitService.js` cu următoarele funcții (implementare minimă / stub):

- **getStrategyConfig()** – returnează parametri: pereche default, minProfitOverGas (în SEI sau USD), maxSlippageBps, enabled. Poate fi din constantă locală până când backend expune endpoint.
- **estimateGasCostPerRoundTrip()** – estimare 2 tx (sell + buy) în SEI (usei). Poate constantă (ex. 0.0003 USD echivalent) până la integrare cu API SEI gas.
- **shouldTriggerRoundTrip(marketData)** – stub: primește marketData (preț, spread), compară cu minProfitOverGas; returnează { trigger: boolean, side: 'buy'|'sell'|null, reason }.
- **executeRoundTrip(params)** – stub: params = { userAddress, tokenIn, tokenOut, amountIn, signer }. Apelează în viitor seiContractService.executeSwap sau backend (chain=sei). Returnează { success, txHash, error }.

Integrare cu backend: base URL din `process.env.REACT_APP_OTA_API_URL` (sau `REACT_APP_BACKEND_URL`); apeluri GET/POST pentru config, signals, execute (cu `chain: 'sei'`). La implementare: endpoint execute poate cere și `userId` (din auth).

---

## 5. Backend – ce adăugi mâine (rezumat)

1. **Env (Render):** `SEI_RPC`, `SEI_REST`, opțional `SEI_SWAP_EXECUTOR_ADDRESS` (dacă backend construiește msg-uri).
2. **Rute:** În `executionRoutes.js` (sau nou fișier pentru SEI): body cu `chain: 'sei'`; delegare la SeiTxBuilder și return tx/msg sau execuție cu bot wallet.
3. **SeiTxBuilder.js:** Funcție `buildSwapTx(params)` sau `buildSwapMsg(params)` pentru CosmWasm execute_swap (aliniat cu seiContractConfig.js).
4. **MicroProfitSeiStrategy.js:** Calculează semnal pe baza preț, spread, gas estimat; export ca strategie în lista de strategii OTA.
5. **Market data SEI:** Sursa preț (API SEI/Astroport/Phoenix sau proxy Binance) și injectare în pipeline-ul de semnale pentru chain=sei.

---

## 6. Ordine recomandată (mâine)

1. Deploy / verificare **sei-swap-executor** pe SEI (testnet sau mainnet); actualizare `REACT_APP_SEI_SWAP_EXECUTOR_ADDRESS` în frontend.
2. Finalizare **seiContractService.executeSwap** cu CosmJS + signer din SeiWalletContext (semnare + broadcast).
3. Backend: adaugă **chain** la rutele OTA; implementează **SeiTxBuilder** (msg-uri swap) și **MicroProfitSeiStrategy**.
4. Frontend: leagă **otaSeiMicroProfitService** de API (config, execute cu chain=sei); UI Enable/Disable pentru „Micro-profit SEI”.

După acești pași, poți introduce date reale (preț, lichiditate) și fine-tuning parametri (minProfitOverGas, slippage, pereche).

---

**Ultima actualizare:** 2026-02-04
