/**
 * Live on-chain position refresh — moderate polling to limit BSC RPC load.
 * Visibility + focus refresh are additional; txs still call refetch explicitly.
 */
export const LIVE_POSITIONS_POLL_MS = 22000;
