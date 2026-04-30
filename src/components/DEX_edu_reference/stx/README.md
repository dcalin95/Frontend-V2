# STX (Stacks) - BitSwapDEX Integration

**Status:** Schelet UI creat  
**Data:** 2026-02  
**Index doc (SSOT navigare OTA STX):** `docs/OTA_STX_README.md` — hartă documente, backend, contracte, căutare rapidă.

---

## Componente disponibile

- **StxLayout.jsx** – Layout cu outlet pentru Trade/Swap. Toolbar-ul STX (wallet, pereche, Trade/Swap) este în **Header-ul principal DEX** (`common/Header.jsx`), nu în StxHeader.
- **StxHeader.jsx** – (Legacy/opțional) Header STX Trade; în producție toolbar-ul este în `common/Header.jsx`.
- **WalletConnector.stx.jsx** – Conectare Leather / Hiro / Xverse.
- **TokenSelector.stx.jsx** – Selector pereche sau token (STX, USDA, sBTC).
- **SwapPanel.stx.jsx** – From/To, amount, slippage, buton Swap (skeleton).
- **StxWalletContext.jsx** – Context wallet Stacks (fără wagmi).
- **stxConfig.js** – Rețea, API, token-uri.
- **stxContractConfig.js** – Adrese contracte (user-vault, ai-trading-executor).
- **services/stxContractService.js** – readContract (Hiro); **executeSwap** — `@stacks/connect` + Leather; vezi `docs/STX_FRONTEND_ENV.md`.
- **stxStacksPrincipals.js** – principalii SIP-010 din env (`REACT_APP_STX_SIP010_*`).

---

## Variabile de mediu (opțional)

- `REACT_APP_STX_CHAIN_ID` – mainnet / testnet
- `REACT_APP_STX_RPC` / `REACT_APP_STX_API` – default https://api.stacks.co
- `REACT_APP_STX_USER_VAULT_ADDRESS` / `REACT_APP_STX_AI_TRADING_EXECUTOR_ADDRESS` – după deploy

---

## Documentație

- **Index complet OTA STX:** `docs/OTA_STX_README.md`
- **Env frontend după deploy (SIP-010, dex-wrapper):** `docs/STX_FRONTEND_ENV.md`
- **Contracte și deploy:** `docs/STX_CONTRACTS_VERIFICATION_AND_DEPLOYMENT.md`
