# CLOB SEI – TODO for next session

**Last updated:** after UI/selector/wallet/English pass. Use this list to continue development tomorrow.

---

## Done so far

- [x] Page `/dex/clob-sei` with chart, order book, place order form (Market/Limit, Buy/Sell)
- [x] Token pair selector in Header (same look as Trade/SEI), ClobSeiMarketContext
- [x] Multiple pairs in config: wSEI/USDC, WETH/USDC, wSEI/USDT (real addresses: wSEI, USDC, WETH, USDT on Sei EVM)
- [x] Sei EVM wallet CTA in Header on CLOB SEI (no Cosmos wallet there); Connect wallet / Install MetaMask; uses pickEvmProvider (MetaMask or Trust, not Phantom)
- [x] UI in English (toasts, labels, aria-labels, empty state, error message)
- [x] Order book read via MgvReader (orderBookService, useClobSeiOrderBook)

---

## TODO for next session

### 1. Live order execution (high priority)

- [ ] **1.1** Add `clob-sei/services/clobTradeService.js`: sign and send tx for limit order (MangroveOrder) or market (Mangrove) on Sei EVM. Need Mangrove/MangroveOrder ABI (write methods).
- [ ] **1.2** In ClobSeiTradePage: on form submit, call clobTradeService with connected EVM wallet (chain 1329) instead of toast placeholder.
- [ ] **1.3** Optional: detect connected Sei EVM wallet in header and show short address + disconnect (like other chain headers).

### 2. Order book & RPC

- [ ] **2.1** If order book stays empty: verify RPC (CLOB_SEI_RPC), Mangrove/MgvReader addresses on Sei mainnet, and OLKey (outbound/inbound/tickSpacing) for each market.
- [ ] **2.2** Optional: add manual “Refresh” for order book (or keep current auto-refresh only).

### 3. UX & UI

- [ ] **3.1** Open orders: component to list user’s open limit orders (read from chain or indexer).
- [ ] **3.2** Order history: list of recent fills/cancellations (needs indexer or events).
- [ ] **3.3** Depth chart: optional depth chart next to order book (like Oxium).

### 4. Config & docs

- [ ] **4.1** Confirm WETH/USDT addresses on Sei EVM if new deployments; update config if needed.
- [ ] **4.2** README: add “Next steps” section pointing to this TODO and to live execution.

### 5. Contracts (if you want to be maker)

- [ ] **5.1** Maker contract (makerExecute + optional makerPosthook) in `clob-mangrove/` for reactive liquidity (see docs/OXIUM_CLOB_IMPLEMENTATION_TODO.md).
- [ ] **5.2** Provision scripts / docs for Mangrove (native token for bounty).

---

## Quick reference

| Item              | Location / note |
|-------------------|------------------|
| Config            | `clob-sei/config.js` (RPC, chain ID, tokens, CLOB_SEI_MARKETS) |
| Order book read   | `clob-sei/services/orderBookService.js`, `useClobSeiOrderBook.js` |
| Page              | `frontend/pages/ClobSeiTradePage.jsx` |
| Selector          | `clob-sei/components/ClobSeiMarketSelect.jsx` (compact, same as Trade/SEI) |
| Context           | `clob-sei/context/ClobSeiMarketContext.jsx` |
| Full TODO (docs)  | `docs/OXIUM_CLOB_IMPLEMENTATION_TODO.md` |

---

*Remove or tick items as you go. For full architecture and contract TODO, see docs/OXIUM_CLOB_IMPLEMENTATION_TODO.md.*
