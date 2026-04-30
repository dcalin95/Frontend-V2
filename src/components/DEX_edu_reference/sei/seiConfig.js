/**
 * seiConfig.js - Network and token config for SEI frontend.
 * Reuses bridgeConfig.sei and extends it with token lists (native + CW-20) and prefix.
 */

import { chainConfigs } from '../bridge/bridgeConfig';

export const seiNetwork = chainConfigs.sei || {
  chainId: 'pacific-1',
  rpcEndpoint: process.env.REACT_APP_SEI_RPC || 'https://rpc.sei-apis.com',
  restEndpoint: process.env.REACT_APP_SEI_REST || 'https://rest.sei-apis.com',
  nativeToken: 'usei',
  blockExplorer: 'https://www.sei.explorers.guru',
};

export const SEI_CHAIN_ID = seiNetwork.chainId;
// RPCs in priority order; polkachu is unstable.
export const SEI_RPC_LIST = [
  seiNetwork.rpcEndpoint,
  'https://rpc.sei-apis.com',
  'https://rpc-sei.stingray.plus',
  'https://sei-rpc.polkachu.com',
].filter((v, i, a) => v && a.indexOf(v) === i); // dedup
export const SEI_RPC = SEI_RPC_LIST[0];

// REST APIs in priority order; polkachu REST often fails.
export const SEI_REST_LIST = [
  seiNetwork.restEndpoint,
  'https://rest.sei-apis.com',
  'https://sei-api.polkachu.com',
].filter((v, i, a) => v && a.indexOf(v) === i);
export const SEI_REST = SEI_REST_LIST[0];
export const SEI_BECH32_PREFIX = 'sei';
export const SEI_NATIVE_DENOM = seiNetwork.nativeToken || 'usei';

/** Tokens listed for UI (native + known CW-20). Extend with real addresses after deploy. */
export const SEI_TOKENS = [
  { denom: SEI_NATIVE_DENOM, symbol: 'SEI', name: 'Sei', decimals: 6, native: true },
  // CW-20: add contract addresses after deploy.
];

export default seiNetwork;
