# CLOB SEI – Order Book / Oxium-style (frontend)

Modul **frontend** pentru CLOB (Central Limit Order Book) pe Sei, în spiritul **Oxium** / **Mangrove**: order book onchain, limit/market orders, reactive liquidity.

Acest director este **separat** de `sei/` (swap/trade existent) ca să fie ușor de identificat și extins fără a amesteca logica.

## Structură

```
clob-sei/
├── README.md              (acest fișier)
├── config.js              (Mangrove, SEI_EVM_TOKENS, CLOB_SEI_MARKETS, CLOB_CHART_SYMBOL_BY_MARKET, CLOB_SEI_TX_EXPLORER_BASE)
├── constants.js           (CLOB_FEE_BPS, CLOB_ORDER_TYPES, DEFAULT_TICK_SPACING, CLOB_MARKET_SLIPPAGE_FRACTION)
├── index.js               (export config, constants, orderBookService)
├── abi/
│   └── MgvReaderABI.js    (ABI minim: offerList, isEmptyOB)
├── components/
│   ├── ClobSeiOrderBook.jsx
│   ├── ClobSeiMarketSelect.jsx
│   └── ClobSeiBeginnerHints.jsx
├── context/
│   └── ClobSeiMarketContext.jsx
├── hooks/
│   └── useClobSeiOrderBook.js
├── services/
│   ├── orderBookService.js
│   └── clobTradeService.js
├── utils/
│   └── clobSeiFormat.js
└── (pagină: frontend/pages/ClobSeiTradePage.jsx; CSS: frontend/styles/components/clob-sei-page.css)
```

## Integrare

- **Rută:** `/dex/clob-sei` în `DEXApp.jsx` → `ClobSeiTradePage`.
- **Sidebar:** item „CLOB SEI” (icon BarChart3).
- **Wallet:** pentru executare ordine e nevoie de wallet **EVM pe Sei** (chain ID 1329), nu Keplr/Compass.

## Fine-tuning (complet)

- **Pagină:** toast în loc de alert, a11y (aria-label, aria-pressed, focus-visible), grid responsive, clase CSS pentru tab/side buttons.
- **Hook:** loading afișat doar la prima încărcare sau la refresh manual; refresh la interval fără flicker.
- **Order book:** empty state („Nicio ofertă momentan”), constantă ORDER_BOOK_DISPLAY_ROWS, aria-label pe tabel.
- **CSS:** `clob-sei-page.css` – responsive, focus-visible, variabile --clob-*.

## Referințe

- `docs/CLOB_SEI_PAGE.md` – **SSOT** rută, env, fișiere, comportament UI
- `docs/CLOB_SEI_ORDER_SOURCE_OF_TRUTH.md` – RPC vs indexer backend, lifecycle ordine
- **Backend:** repo `backend-server`, `docs/CLOB_SEI_INDEXER.md` – API `/api/clob-sei/*`, ingest Mangrove (Postgres)
- `docs/OXIUM_CLOB_IMPLEMENTATION_TODO.md` – TODO list complet
- `docs/OXIUM_MANGROVE_LIQUIDITY_AND_OUR_STACK.md` – context Oxium/Mangrove
- `docs/OXIUM_SEI_CONTRACTS_AND_DEPLOYMENT.md` – contracte pe Sei, ce deployăm noi
- [Mangrove Deployment (Sei)](https://docs.mangrove.exchange/quick-links/deployment-adresses)
- [Oxium Docs](https://docs.oxium.xyz/)
