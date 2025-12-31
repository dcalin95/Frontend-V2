// src/config/presaleConfig.js

/**
 * Presale Configuration
 * 
 * Centralized configuration for all presale-related constants.
 * Values can be overridden via environment variables.
 */

export const PRESALE_CONFIG = {
  // 💰 Minimum purchase amount in USD
  // This is the minimum amount a user must spend to participate in the presale
  MIN_PURCHASE_USD: parseFloat(process.env.REACT_APP_MIN_PURCHASE_USD) || 10,
  
  // 💎 Default BITS price in USD (fallback if contract read fails)
  DEFAULT_BITS_PRICE_USD: parseFloat(process.env.REACT_APP_DEFAULT_BITS_PRICE_USD) || 0.001,
  
  // 🔢 Default minimum amounts per token (fallback if price feed fails)
  DEFAULT_MIN_AMOUNTS: {
    SOL: parseFloat(process.env.REACT_APP_MIN_SOL) || 0.001,
    'USDC-Solana': parseFloat(process.env.REACT_APP_MIN_USDC_SOLANA) || 0.01,
    BTCB: parseFloat(process.env.REACT_APP_MIN_BTCB) || 0.0001,
    BNB: parseFloat(process.env.REACT_APP_MIN_BNB) || 0.01,
    ETH: parseFloat(process.env.REACT_APP_MIN_ETH) || 0.001,
    USDT: parseFloat(process.env.REACT_APP_MIN_USDT) || 10,
    USDC: parseFloat(process.env.REACT_APP_MIN_USDC) || 10,
  },
  
  // 📊 Step amounts for increment/decrement buttons
  STEP_AMOUNTS: {
    SOL: 0.001,
    'USDC-Solana': 0.01,
    BTCB: 0.0001,
    BNB: 0.01,
    ETH: 0.001,
    USDT: 0.01,
    USDC: 0.01,
  },
  
  // 🔢 Decimal places for display
  DECIMALS: {
    SOL: 3,
    'USDC-Solana': 2,
    BTCB: 4,
    BNB: 4,
    ETH: 4,
    USDT: 2,
    USDC: 2,
  },
  
  // 💵 Fallback prices (used if price feed fails or is unavailable)
  FALLBACK_PRICES: {
    SOL: parseFloat(process.env.REACT_APP_FALLBACK_SOL_PRICE) || 150,
    BNB: parseFloat(process.env.REACT_APP_FALLBACK_BNB_PRICE) || 600,
    ETH: parseFloat(process.env.REACT_APP_FALLBACK_ETH_PRICE) || 3500,
    BTCB: parseFloat(process.env.REACT_APP_FALLBACK_BTC_PRICE) || 95000,
    USDT: 1,
    USDC: 1,
    'USDC-Solana': 1,
  },
  
  // ⛽ Gas/Fee buffers for transaction balance checks
  GAS_BUFFERS: {
    SOLANA: parseFloat(process.env.REACT_APP_SOL_GAS_BUFFER) || 0.001,
    EVM: parseFloat(process.env.REACT_APP_EVM_GAS_BUFFER) || 0.003,
  },
};

export default PRESALE_CONFIG;

