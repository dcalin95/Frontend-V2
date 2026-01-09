/**
 * 🔗 Blockchain Configuration
 * 
 * Configuration pentru blockchain interaction (BSC):
 * - Network configuration
 * - Contract addresses
 * - Provider configuration
 * - Gas settings
 * 
 * @module blockchain
 */

module.exports = {
  // BSC Network
  network: {
    name: 'BSC',
    chainId: 56, // BSC Mainnet
    testnetChainId: 97, // BSC Testnet
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/',
    testnetRpcUrl: process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/'
  },

  // Contract Addresses
  contracts: {
    // BitSwapDEX Wrapper (va fi setat după deployment)
    wrapper: process.env.WRAPPER_CONTRACT_ADDRESS || '',
    
    // PancakeSwap Router V2
    pancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    
    // WBNB (Wrapped BNB)
    wbnb: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    
    // Token Addresses (BSC Mainnet)
    tokens: {
      BNB: '0x0000000000000000000000000000000000000000', // Native BNB
      BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
      ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      USDT: '0x55d398326f99059fF775485246999027B3197955',
      BITS: process.env.BITS_TOKEN_ADDRESS || '' // Va fi setat
    }
  },

  // Gas Settings
  gas: {
    maxGasPrice: process.env.MAX_GAS_PRICE || 50, // Max 50 gwei
    defaultGasLimit: process.env.DEFAULT_GAS_LIMIT || 300000,
    slippageTolerance: process.env.SLIPPAGE_TOLERANCE || 0.5, // 0.5%
    deadline: process.env.DEADLINE_MINUTES || 5 // 5 minutes
  },

  // Wallet Configuration
  wallet: {
    privateKey: process.env.WALLET_PRIVATE_KEY || '', // Set în Render env vars
    address: process.env.WALLET_ADDRESS || '' // Calculat din private key
  },

  // Protocol Fees
  fees: {
    protocolFeeBps: 10, // 0.1% (10 basis points)
    distribution: {
      burn: 50, // 50%
      stakers: 30, // 30%
      treasury: 20 // 20%
    }
  }
};

