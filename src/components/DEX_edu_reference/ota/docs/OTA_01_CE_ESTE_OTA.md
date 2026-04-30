# Ce este OTA AI

**OTA** = On-Token-Agent (OpenAI Trading Agent). Este agentul AI al BitSwap DEX care oferă analiză de piață și semnale de trading folosind **OpenAI** (model configurat via `OPENAI_MODEL`, default `gpt-4o-mini`).

- **Provider:** OpenAI  
- **Scop:** Analiză piață, semnale (buy/sell/hold/swap), recomandări entry/stop/take-profit.  
- **Unde rulează:** Backend (Render); cheia OpenAI este doar pe server.  
- **Frontend:** Pagini DEX (/dex/ota, /dex/ota/chat), panouri Backtest, Strategy Execution, ML Predictions, Risk Gating, AutoTradePanel.

**Moduri de acces:** guest (vizitator), preview (autentificat, fără înregistrare on-chain), full (autentificat + înregistrat on-chain).  
**Moduri de trading:** Advisory (recomandări, user execută manual), Assisted (AI pregătește, user semnează), Auto (execuție automată cu bot autorizat).

**Index documentație:** vezi `OTA_08_INDEX_DOCUMENTATIE.md`.
