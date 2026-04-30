# Arhitectură OTA

## Frontend (React)

- **Rută principală:** `/dex/ota` → OTAPage.jsx  
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
