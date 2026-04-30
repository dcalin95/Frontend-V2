# OTA Learning Features (panouri pe /dex/ota)

Panouri afișate pe pagina OTA AI (Advisory mode sau Auto), pentru configurare și monitorizare:

- **Backtest:** Configurare strategie, token, timeframe; rulare backtest.  
- **Strategy Execution:** Listă strategii disponibile (ex. Trend-Following); descrieri și indicatori.  
- **ML Predictions (Model Inference):** Status modele (RegimeClassifier, ReturnPredictor, VolatilityPredictor); parametri. Predicțiile sunt heuristic/placeholder până la integrarea ONNX.  
- **Bandit Selector:** Selector bandit pentru strategii (dacă e activ).  
- **Meta Controller:** Panou meta-controller (dacă e activ).  
- **Risk Gating:** Limite risc (max % per trade, per day, daily loss limit, max drawdown); setări suplimentare.  
- **AutoTradePanel (mode=auto):** Enable Auto Execution, Activity Feed (semnale din analyzeMarket), Stats; trimite analyzeMarket cu recentOutcomes, backend adaugă Binance + outcomes din DB.

**Surse date pentru LLM:** Binance klines (24h), marketData (BSC/CoinGecko), recentOutcomes (frontend + ota.trade_outcomes), record-outcome manual după swap. Nu există mock în producție; la eroare se afișează stare de eroare sau liste goale.

**Referințe documentație (Brain tabs):**
- **Index complet:** `docs/OTA_LLM_BRAIN_TABS_REFERENCE.md` – Meta, Bandit, Backtest, Governance (API + fișiere).
- **Meta Controller:** `docs/OTA_META_CONTROLLER_REFERENCE.md` – contract record-outcome, executor, singleton backend.
- **Governance / Level64–69:** `docs/OTA_GOVERNANCE_NO_GO_EXPLICATIE.md`, `docs/OTA_LLM_AUTONOMY_LEVEL64_LEVEL69_REFERENCE.md`.
- **Contract FE–BE:** `docs/OTA_FRONTEND_BACKEND_CONTRACT.md` §2.10.
- **Bandit / Backtest:** `otaBanditService`, `otaBacktestService`; ModelInferencePanel – hint, acțiuni, equity curve, refresh la focus.
