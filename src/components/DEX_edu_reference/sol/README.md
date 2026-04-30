# SOL (Solana) - BitSwapDEX Integration

**Status:** Schelet UI creat  
**Data:** 2026-02

---

## Componente disponibile

- **SolLayout.jsx** – Layout cu outlet pentru Trade/Swap (fără provider extra; folosește WalletContext + SolanaProvider din App). Toolbar-ul SOL (wallet, pereche, Trade/Swap) este în **Header-ul principal DEX** (`common/Header.jsx`), nu în SolHeader.
- **SolHeader.jsx** – (Legacy/opțional) Header SOL Trade; în producție toolbar-ul este în `common/Header.jsx`.
- **WalletConnector.sol.jsx** – Conectare Phantom / Solflare prin connectWallet('solana') (UnifiedWalletModal).
- **TokenSelector.sol.jsx** – Selector pereche sau token (SOL, USDC, USDT, BONK).
- **SwapPanel.sol.jsx** – From/To, amount, slippage, buton Swap (skeleton).
- **solConfig.js** – Rețea, RPC, token-uri.
- **solContractConfig.js** – Program IDs (user-vault, ai-trading-executor).
- **services/solContractService.js** – readAccount (placeholder), executeSwap (TODO Jupiter/Raydium + semnare).

---

## Variabile de mediu (opțional)

- `REACT_APP_SOL_CLUSTER` – mainnet-beta / devnet
- `REACT_APP_SOL_RPC` – default https://api.mainnet-beta.solana.com
- `REACT_APP_SOL_USER_VAULT_PROGRAM_ID` / `REACT_APP_SOL_AI_TRADING_EXECUTOR_PROGRAM_ID` – după deploy

---

## Documentație

Vezi `docs/SOL_CONTRACTS_VERIFICATION_AND_DEPLOYMENT.md` pentru programe Anchor și deploy.  
Contracte (Rust/Anchor): `C:\Users\bits\Desktop\remix\OTA\SOLANA`.
