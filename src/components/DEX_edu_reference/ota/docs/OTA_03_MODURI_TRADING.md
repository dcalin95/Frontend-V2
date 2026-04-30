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
- **UI:** AutoTradePanel pe /dex/ota?mode=auto.

**Persistență mod:** URL `?mode=advisory|assisted|auto`. Default: advisory.
