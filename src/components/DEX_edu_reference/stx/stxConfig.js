/**
 * stxConfig.js – Config rețea și token-uri pentru Stacks (frontend).
 * STX = native token; SIP-010 = fungible token standard pe Stacks.
 */

export const stxNetwork = {
  chainId: process.env.REACT_APP_STX_CHAIN_ID || 'mainnet',
  rpcEndpoint: process.env.REACT_APP_STX_RPC || 'https://api.stacks.co',
  apiEndpoint: process.env.REACT_APP_STX_API || 'https://api.stacks.co',
  nativeToken: 'STX',
  blockExplorer: 'https://explorer.stacks.co',
};

export const STX_CHAIN_ID = stxNetwork.chainId;
export const STX_RPC = stxNetwork.rpcEndpoint;
export const STX_API = stxNetwork.apiEndpoint;
export const STX_NATIVE_SYMBOL = stxNetwork.nativeToken;

/** Token-uri pentru UI (STX + SIP-010 cunoscute). Extinde cu contract principal după deploy. */
export const STX_TOKENS = [
  { symbol: 'STX', name: 'Stacks', decimals: 6, native: true },
  { symbol: 'USDA', name: 'USDA', decimals: 6, native: false },
  { symbol: 'sBTC', name: 'Synthetic Bitcoin', decimals: 8, native: false },
];

export default stxNetwork;
