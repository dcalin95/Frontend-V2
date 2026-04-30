# OpenAI și analiza de piață

- **Model:** OPENAI_MODEL (env), default `gpt-4o-mini`; opțional `gpt-4o`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`.  
- **Key:** OPENAI_API_KEY setat doar pe backend (Render). Niciodată în frontend.  
- **Endpoint analiză:** POST /api/ai-trading/analyze.  
- **Body:** token, quoteToken, userId, marketData, amountIn, recentOutcomes (opțional).  
- **Backend:** AITradingService.analyzeMarket() → adaugă Binance klines, marketData, outcomes din DB → OpenAIModel.analyze() → OpenAI Chat Completions.  
- **Răspuns:** signal (buy|sell|hold|swap), confidence, reasoning, entryPrice, stopLoss, takeProfit.

**Surse pentru prompt OpenAI:** Binance klines (24h), marketData (preț, volume, change24h), recentOutcomes (din frontend + ota.trade_outcomes), opțional Alpha Vantage (ALPHA_VANTAGE_API_KEY).  
**Record outcome manual:** După swap, frontend apelează POST /api/ai-trading/record-outcome → insert ota.trade_outcomes (source='manual'); aceste outcome-uri intră în recentOutcomes la analizele următoare.

**Chat direct cu OpenAI:** POST /api/ai-trading/chat (același key). Frontend: /dex/ota/chat.

**Fallback când LLM eșuează (server):** Dacă apelul OpenAPI eșuează sau precheck-ul e blocat de circuit breaker, backend-ul poate livra în continuare semnalul **din motorul OTA** (fără acțiune obligatorie în UI). Env **`OTA_OPENAI_FALLBACK_ENGINE_ON_ERROR`** — implicit activ; dezactivare: `false` sau `0`. În răspuns poate apărea **`analysisSource`: `engine_fallback_openai_error`**; retry-ul exterior (după circuit) folosește calea **`engine_no_openai`**. Detalii contract: `docs/OTA_FRONTEND_BACKEND_CONTRACT.md` (POST /analyze).
