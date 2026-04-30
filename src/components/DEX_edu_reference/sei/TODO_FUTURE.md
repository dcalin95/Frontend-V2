# SEI Auto Bot — Future TODO

**Last updated:** 2026-02-22  
**Status:** Production (multi-pool bot active on Render)

---

## ✅ Implemented (Current State)

- [x] SEI Auto bot live on Render (backend-server)
- [x] Astroport Router integration (`sei16awrdehvla6kqq2dk5v4m6ze83qfg8trpw55qc8rvfrg9qdmfvhq7hj6x9`)
- [x] Multi-pool monitoring: SEI/USDC (CL) + SEI/ATOM (XYK)
- [x] Pool health check per cycle (spread < 5% threshold)
- [x] Up to 3 simultaneous positions per user
- [x] AI signal per pair (OpenAI analyzeMarket)
- [x] Profit tracking per execution (DB + UI)
- [x] Pool health indicator in UI (live, refresh every 60s)
- [x] Connected wallet balance via CosmJS RPC
- [x] Bot wallet balance via CosmJS RPC (derived from BOT_SEI_PRIVATE_KEY)

---

## 🔜 TODO — Future Improvements

### 1. Oxium CLOB Integration (HIGH VALUE)

**What:** Integrate Oxium DEX (first onchain CLOB on SEI) as a price source and execution venue.

**Why:** Oxium uses Mangrove Protocol — a CLOB order book without AMM spread issues.  
When Astroport pools are imbalanced, Oxium could offer better prices.

**Technical details found:**
- Protocol: **Mangrove Protocol** (confirmed from contract bytecode)
- CLOB contract (EVM): `0xd9834d7caa2acf81c40e7aac645cf9a57cb14bcd`
- Governance contract (EVM): `0x822f30360bef8b4e5950e1a7201816cafbb58c02`
- Deployer: `0x00007Fef391695B3D2cf4FFCF59d6710456Ead29` (labeled "Oxium: Deployer" on SeiScan)
- SDK: `@mangrovedao/mgv` (npm, official Mangrove SDK)
- SEI RPC (EVM): `https://evm-rpc.sei-apis.com`

**Implementation plan:**
```
Step 1: Add price query module (read-only)
  - Query Oxium best bid/ask for SEI/USDC via EVM RPC
  - Compare with Astroport simulation price
  - Log difference per cycle

Step 2: Add execution via EVM stack
  - Add ethers.js or viem to backend
  - Derive EVM address from BOT_SEI_PRIVATE_KEY
    (SEI v2: same private key works for both CosmWasm + EVM)
  - Execute "market order" on Oxium when price is better

Step 3: Route selector
  - If Oxium spread < Astroport spread → use Oxium
  - If Astroport spread < 5% → use Astroport Router
  - If both bad → skip cycle
```

**Effort:** ~3-5 days  
**Priority:** Medium — implement after Astroport pools stabilize

---

### 2. Add More Astroport Pools (LOW EFFORT)

**What:** Add new pools to `POOL_REGISTRY` in `SeiAutoExecutor.js` when they appear on mainnet.

**Verified pools on pacific-1 (2026-02-22):**
| Pool | Address | Type | Status |
|------|---------|------|--------|
| SEI/USDC | `sei1ltr0r989uds8y0gahfl6uqec5rqulks06fyugpre0syml8ul0jtsjgv69c` | CL | Active (imbalanced) |
| SEI/ATOM | `sei14kxy2g2cw37ng0mmyk6u54qq7xxxnksyhwcvsaf57g30q7ym23vqlmjpm0` | XYK | Active |
| SEI/WETH | — | — | Does not exist yet |
| SEI/SOL | — | — | Does not exist yet |
| SEI/USDT | — | — | Does not exist yet |

**How to add:** Edit `POOL_REGISTRY` array in:
```
backend-server/src/ota/services/SeiAutoExecutor.js
```

---

### 3. Persistent Per-Pool Position Tracking (MEDIUM)

**What:** Save per-pool positions in DB (not just in-memory Map).

**Why:** If Render restarts the backend, in-memory positions are lost.  
Currently only the primary pool (SEI/USDC) syncs to DB.

**Implementation:**
- Add `bot_pool_positions` JSONB column to `ota.sei_auto_users` table
- Or create new `ota.sei_pool_positions` table
- Serialize/deserialize `poolPositions` Map on startup

**Migration needed:** Yes (DB schema change)  
**Effort:** ~1 day

---

### 4. Pool Health UI Indicator (DONE — future: multi-pool)

**What:** Show health status for ALL monitored pools in UI (not just SEI/USDC).

**Current:** Only SEI/USDC CL is checked in `OtaSeiMicroProfitPanel.jsx`  
**Future:** Show a badge per pool (SEI/USDC, SEI/ATOM, Oxium)

---

### 5. Configurable Max Positions in UI

**What:** Let the user set `maxConcurrentPositions` (1, 2, or 3) from the UI.

**Current:** Hardcoded at 3 in `SeiAutoExecutor.js`  
**Future:** Add slider/select in SEI Auto panel

---

## 📝 Notes

- SEI v2 uses same private key for both CosmWasm and EVM — no need for separate wallets
- Astroport factory on pacific-1: `sei1xr3rq8yvd7qplsw5yx90ftsr2zdhg4e9z60h5duusgxpv72hud3shh3qfl`
- Astroport Router on pacific-1: `sei16awrdehvla6kqq2dk5v4m6ze83qfg8trpw55qc8rvfrg9qdmfvhq7hj6x9`
- SEI REST (mainnet): `https://sei-api.polkachu.com`
- SEI RPC CosmWasm: `https://sei-rpc.polkachu.com`
- SEI RPC EVM: `https://evm-rpc.sei-apis.com`
