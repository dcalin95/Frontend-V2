/**
 * solConfig.js - Network and token config for Solana frontend.
 * SOL = native token; SPL = standard token on Solana.
 */

export const solNetwork = {
  cluster: process.env.REACT_APP_SOL_CLUSTER || 'mainnet-beta',
  rpcEndpoint: process.env.REACT_APP_SOL_RPC || 'https://api.mainnet-beta.solana.com',
  nativeToken: 'SOL',
  blockExplorer: 'https://explorer.solana.com',
};

export const SOL_CLUSTER = solNetwork.cluster;
export const SOL_RPC = solNetwork.rpcEndpoint;
export const SOL_NATIVE_SYMBOL = solNetwork.nativeToken;

/** Tokens for UI (SOL + SPL). SSOT for lists: solTokenConfig.js. */
export const SOL_TOKENS = [
  { symbol: 'SOL', name: 'Solana', decimals: 9, native: true },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, native: false },
  { symbol: 'USDT', name: 'Tether', decimals: 6, native: false },
  { symbol: 'BONK', name: 'Bonk', decimals: 5, native: false },
  { symbol: 'JUP', name: 'Jupiter', decimals: 6, native: false },
  { symbol: 'RAY', name: 'Raydium', decimals: 6, native: false },
  { symbol: 'mSOL', name: 'Marinade SOL', decimals: 9, native: false },
];

export default solNetwork;
