/**
 * clob-sei/config.js – Config pentru CLOB (Mangrove) pe Sei.
 * Adrese și RPC pentru integrare cu order book onchain (Oxium-style).
 *
 * Verifică întotdeauna: https://docs.mangrove.exchange/quick-links/deployment-adresses (secțiunea Sei)
 */

// RPC pentru Sei (EVM – Mangrove pe Sei folosește layer EVM)
// Ordinea contează la citire: unele noduri publice returnează revert fals la eth_call către MgvReader; verificat 2026-04.
export const CLOB_SEI_RPC_FALLBACKS = [
  'https://evm-rpc.sei-apis.com',
  'https://sei.drpc.org',
  'https://evm.sei.io',
];

export const CLOB_SEI_RPC =
  process.env.REACT_APP_CLOB_SEI_RPC || process.env.REACT_APP_SEI_EVM_RPC || CLOB_SEI_RPC_FALLBACKS[0];

// Chain ID Sei (EVM) – poate diferi de pacific-1 (Cosmos)
export const CLOB_SEI_CHAIN_ID = process.env.REACT_APP_CLOB_SEI_CHAIN_ID || '1329';

/**
 * Adrese Mangrove pe Sei (din docs: https://docs.mangrove.exchange/quick-links/deployment-adresses)
 */
export const MANGROVE_SEI = {
  Mangrove: process.env.REACT_APP_MANGROVE_SEI || '0xD9834d7caA2ACf81C40e7AAC645Cf9a57cb14bcd',
  MgvReader: process.env.REACT_APP_MGV_READER_SEI || '0xfeafb31AC7f09892B50c4d6DA06a1e48D487499E',
  MangroveOrder: process.env.REACT_APP_MANGROVE_ORDER_SEI || '0x5bA0761FF644560529B0F54362C8f6024175928b',
};

/**
 * Token-uri Sei EVM (mainnet pacific-1, chain ID 1329).
 * Surse: docs.sei.io/evm/ecosystem-contracts, docs.sei.io/evm/usdc-on-sei, LayerZero/Sei USDT migration.
 * decimals: valori standard ERC20 (18 pentru wrapped native/ETH, 6 pentru stablecoins).
 */
export const SEI_EVM_TOKENS = {
  /** DragonSwap WSEI – wrapped SEI pe EVM (18 decimals standard ERC20 wrapped native) */
  wSEI: { address: process.env.REACT_APP_SEI_WSEI_ADDRESS || '0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7', decimals: 18 },
  /** Native USDC (Circle CCTP) – 6 decimals */
  USDC: { address: process.env.REACT_APP_SEI_USDC_ADDRESS || '0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392', decimals: 6 },
  /** Sei Bridged WETH – 18 decimals */
  WETH: { address: process.env.REACT_APP_SEI_WETH_ADDRESS || '0x160345fC359604fC6e70E3c5fAcbdE5F7A9342d8', decimals: 18 },
  /** USDT0 (Tether via LayerZero OFT) – 6 decimals */
  USDT: { address: process.env.REACT_APP_SEI_USDT_ADDRESS || '0x9151434b16b9763660705744891fa906f660ecc5', decimals: 6 },
};

/**
 * Perechi (outbound, inbound) pentru care afișăm order book.
 * OLKey: { outbound_tkn, inbound_tkn, tickSpacing }
 * baseDecimals/quoteDecimals: folosite în clobTradeService pentru parseUnits.
 */
/** TradingView simbol proxy per pereche CLOB (preț de referință, nu order book on-chain). */
export const CLOB_CHART_SYMBOL_BY_MARKET = {
  'wSEI-USDC': 'BINANCE:SEIUSDT',
  'WETH-USDC': 'BINANCE:ETHUSDT',
  'wSEI-USDT': 'BINANCE:SEIUSDT',
};

/** Bază URL explorer tranzacții Sei (fără slash final pe hash). */
export const CLOB_SEI_TX_EXPLORER_BASE =
  (process.env.REACT_APP_CLOB_SEI_EXPLORER_URL || 'https://seistream.app/transactions').replace(/\/$/, '');

/** Fereastră blocuri pentru eth_getLogs (evenimente MangroveOrder). */
export const CLOB_SEI_LOG_LOOKBACK_BLOCKS = Number(process.env.REACT_APP_CLOB_SEI_LOG_LOOKBACK_BLOCKS || 50000);

/** Dimensiune chunk getLogs (Mangrove core + MangroveOrder) — lățime redusă dacă RPC returnează limită. */
export const CLOB_SEI_LOG_CHUNK_BLOCKS = Number(process.env.REACT_APP_CLOB_SEI_LOG_CHUNK_BLOCKS || 2500);

export const CLOB_SEI_MARKETS = [
  {
    id: 'wSEI-USDC',
    base: 'wSEI',
    quote: 'USDC',
    outboundAddress: SEI_EVM_TOKENS.wSEI.address,
    inboundAddress:  SEI_EVM_TOKENS.USDC.address,
    baseDecimals:    SEI_EVM_TOKENS.wSEI.decimals,
    quoteDecimals:   SEI_EVM_TOKENS.USDC.decimals,
    tickSpacing: 1,
  },
  {
    id: 'WETH-USDC',
    base: 'WETH',
    quote: 'USDC',
    outboundAddress: SEI_EVM_TOKENS.WETH.address,
    inboundAddress:  SEI_EVM_TOKENS.USDC.address,
    baseDecimals:    SEI_EVM_TOKENS.WETH.decimals,
    quoteDecimals:   SEI_EVM_TOKENS.USDC.decimals,
    tickSpacing: 1,
  },
  {
    id: 'wSEI-USDT',
    base: 'wSEI',
    quote: 'USDT',
    outboundAddress: SEI_EVM_TOKENS.wSEI.address,
    inboundAddress:  SEI_EVM_TOKENS.USDT.address,
    baseDecimals:    SEI_EVM_TOKENS.wSEI.decimals,
    quoteDecimals:   SEI_EVM_TOKENS.USDT.decimals,
    tickSpacing: 1,
  },
];

export default {
  CLOB_SEI_RPC,
  CLOB_SEI_RPC_FALLBACKS,
  CLOB_SEI_CHAIN_ID,
  MANGROVE_SEI,
  SEI_EVM_TOKENS,
  CLOB_SEI_MARKETS,
  CLOB_CHART_SYMBOL_BY_MARKET,
  CLOB_SEI_TX_EXPLORER_BASE,
  CLOB_SEI_LOG_LOOKBACK_BLOCKS,
  CLOB_SEI_LOG_CHUNK_BLOCKS,
};
