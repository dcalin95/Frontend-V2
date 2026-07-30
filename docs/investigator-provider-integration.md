# BITS Investigator - Provider Integration

## Current state

The Express route uses Etherscan V2 only for ERC-20 transfers. The browser uses public RPC endpoints for balances and contract bytecode. The FastAPI MVP duplicates Etherscan and must not be a second production source.

## Target interface

Provider adapters expose capability-aware methods for balances, normal transactions, internal transactions, token transfers, transaction/receipt/log data, contract creation, source, ABI, holders, liquidity, ownership, proxy implementation, blocks, labels, and bridge events.

Every returned observation includes provider, chain ID, method, collected time, block number, transaction hash, log index, normalization version, completeness, and provider limits.

## Failure contract

- Missing credential: `503 PROVIDER_NOT_CONFIGURED` with the exact environment variable name.
- Unsupported capability: `422 CAPABILITY_UNSUPPORTED`.
- Rate limit: retry with bounded backoff, then `partial`.
- Timeout/outage: preserve completed stages and return retryable structured status.
- No records: successful empty result, distinct from provider failure.
- Synthetic or random fallback: prohibited.

## Environment

- `ETHERSCAN_API_KEY`: Etherscan V2 for supported EVM chains. It must be configured
  as a secret on the `backend-server` Render service; `BSCSCAN_API_KEY` is not a
  substitute for the Etherscan V2 multichain credential.
- `BSC_RPC_URL`, `ETH_RPC_URL`, `BASE_RPC_URL`: server-side RPC overrides.
- `INVESTIGATOR_MAX_TRANSFERS`, `INVESTIGATOR_MAX_GRAPH_NODES`, `INVESTIGATOR_MAX_GRAPH_EDGES`, `INVESTIGATOR_MAX_HOPS`: hard server caps.

Secrets remain server-side and are redacted from logs and provider errors.
