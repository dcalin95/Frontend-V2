/**
 * 🌉 Bridge Configuration - Multi-Chain Bridge Settings
 * 
 * Configurează setările pentru bridge-uri cross-chain între SEI, EVM și Solana.
 * Suportă multiple bridge protocols: Wormhole, Axelar, LayerZero.
 * 
 * @module BridgeConfig
 */

/**
 * Chain Types
 */
export const ChainType = {
  SEI: 'sei',
  EVM: 'evm',
  SOLANA: 'solana',
};

/**
 * Bridge Protocols
 */
export const BridgeProtocol = {
  WORMHOLE: 'wormhole',
  AXELAR: 'axelar',
  LAYERZERO: 'layerzero',
};

/**
 * Chain Configuration
 * 
 * Definește configurația pentru fiecare blockchain supportat
 */
export const chainConfigs = {
  // SEI Network (CosmWasm). Set REACT_APP_SEI_CHAIN_ID=atlantic-2 + RPC/REST for testnet.
  sei: {
    chainId: process.env.REACT_APP_SEI_CHAIN_ID || 'pacific-1',
    chainType: ChainType.SEI,
    rpcEndpoint: process.env.REACT_APP_SEI_RPC || 'https://sei-rpc.polkachu.com',
    restEndpoint: process.env.REACT_APP_SEI_REST || 'https://sei-api.polkachu.com',
    bridgeContract: process.env.REACT_APP_SEI_BRIDGE_CONTRACT || '',
    nativeToken: 'usei', // Native SEI token denom
    supportedBridgeProtocols: [BridgeProtocol.WORMHOLE, BridgeProtocol.AXELAR],
    blockExplorer: 'https://www.sei.explorers.guru',
  },

  // BSC (Binance Smart Chain) - EVM
  bsc: {
    chainId: 56, // Mainnet: 56, Testnet: 97
    chainType: ChainType.EVM,
    rpcEndpoint: process.env.REACT_APP_BSC_RPC || 'https://bsc-dataseed.binance.org/',
    bridgeContract: process.env.REACT_APP_BSC_BRIDGE_CONTRACT || '',
    nativeToken: 'BNB',
    supportedBridgeProtocols: [BridgeProtocol.WORMHOLE, BridgeProtocol.LAYERZERO],
    blockExplorer: 'https://bscscan.com',
  },

  // Ethereum - EVM
  ethereum: {
    chainId: 1, // Mainnet: 1, Goerli: 5
    chainType: ChainType.EVM,
    rpcEndpoint: process.env.REACT_APP_ETH_RPC || 'https://eth.llamarpc.com',
    bridgeContract: process.env.REACT_APP_ETH_BRIDGE_CONTRACT || '',
    nativeToken: 'ETH',
    supportedBridgeProtocols: [BridgeProtocol.WORMHOLE, BridgeProtocol.AXELAR, BridgeProtocol.LAYERZERO],
    blockExplorer: 'https://etherscan.io',
  },

  // Solana
  solana: {
    chainId: 'mainnet-beta', // Mainnet: 'mainnet-beta', Devnet: 'devnet'
    chainType: ChainType.SOLANA,
    rpcEndpoint: process.env.REACT_APP_SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
    bridgeProgram: process.env.REACT_APP_SOLANA_BRIDGE_PROGRAM || '',
    nativeToken: 'SOL',
    supportedBridgeProtocols: [BridgeProtocol.WORMHOLE, BridgeProtocol.AXELAR],
    blockExplorer: 'https://solscan.io',
  },
};

/**
 * Bridge Protocol Configuration
 * 
 * Configurează setările pentru fiecare protocol de bridge
 */
export const bridgeProtocolConfigs = {
  [BridgeProtocol.WORMHOLE]: {
    name: 'Wormhole',
    coreBridgeAddress: {
      sei: process.env.REACT_APP_WORMHOLE_SEI_ADDRESS || '',
      evm: process.env.REACT_APP_WORMHOLE_EVM_ADDRESS || '',
      solana: process.env.REACT_APP_WORMHOLE_SOLANA_ADDRESS || '',
    },
    apiEndpoint: 'https://api.wormhole.com',
    enabled: true,
  },

  [BridgeProtocol.AXELAR]: {
    name: 'Axelar',
    gatewayAddress: {
      sei: process.env.REACT_APP_AXELAR_SEI_GATEWAY || '',
      evm: process.env.REACT_APP_AXELAR_EVM_GATEWAY || '',
      solana: process.env.REACT_APP_AXELAR_SOLANA_GATEWAY || '',
    },
    apiEndpoint: 'https://api.axelarscan.io',
    enabled: true,
  },

  [BridgeProtocol.LAYERZERO]: {
    name: 'LayerZero',
    endpointAddress: {
      evm: process.env.REACT_APP_LAYERZERO_EVM_ENDPOINT || '',
      solana: process.env.REACT_APP_LAYERZERO_SOLANA_ENDPOINT || '',
    },
    apiEndpoint: 'https://api.layerzero.network',
    enabled: true,
  },
};

/**
 * Default Bridge Settings
 */
export const defaultBridgeSettings = {
  // Default protocol pentru fiecare chain pair
  defaultProtocols: {
    'sei-bsc': BridgeProtocol.WORMHOLE,
    'sei-ethereum': BridgeProtocol.AXELAR,
    'sei-solana': BridgeProtocol.WORMHOLE,
    'bsc-solana': BridgeProtocol.WORMHOLE,
    'ethereum-solana': BridgeProtocol.WORMHOLE,
    'bsc-ethereum': BridgeProtocol.LAYERZERO,
  },

  // Timeout pentru bridge transactions (în secunde)
  bridgeTimeout: 600, // 10 minute

  // Retry settings
  maxRetries: 3,
  retryDelay: 5000, // 5 secunde

  // Slippage tolerance pentru bridge (în basis points, 50 = 0.5%)
  slippageTolerance: 50,

  // Fee settings
  bridgeFeePercentage: 0.1, // 0.1% bridge fee
};

/**
 * OTA Bridge Settings
 */
export const otaBridgeSettings = {
  // Enable OTA-controlled bridges
  enabled: true,

  // Minimum amount pentru OTA-triggered bridge (în native token)
  minAmountForOTA: {
    sei: '1000000', // 1 SEI (în usei)
    evm: '1000000000000000000', // 0.001 ETH/BNB (în wei)
    solana: '1000000000', // 0.001 SOL (în lamports)
  },

  // Auto-bridge pentru OTA users
  autoBridgeEnabled: false, // Manual approval by default
};

/**
 * Get Chain Config
 * 
 * Returnează configurația pentru un chain specificat
 */
export function getChainConfig(chainId) {
  const chainIdLower = chainId.toLowerCase();
  
  // Caută direct în chainConfigs
  if (chainConfigs[chainIdLower]) {
    return chainConfigs[chainIdLower];
  }

  // Caută după chainId numeric (EVM chains)
  const chainById = Object.values(chainConfigs).find(
    config => config.chainId === chainId || config.chainId === parseInt(chainId)
  );

  if (chainById) {
    return chainById;
  }

  throw new Error(`Chain config not found for: ${chainId}`);
}

/**
 * Get Bridge Protocol Config
 * 
 * Returnează configurația pentru un protocol de bridge
 */
export function getBridgeProtocolConfig(protocol) {
  if (!bridgeProtocolConfigs[protocol]) {
    throw new Error(`Bridge protocol config not found: ${protocol}`);
  }
  return bridgeProtocolConfigs[protocol];
}

/**
 * Get Supported Bridge Protocol
 * 
 * Returnează protocolul de bridge suportat pentru un chain pair
 */
export function getSupportedBridgeProtocol(fromChain, toChain) {
  const fromConfig = getChainConfig(fromChain);
  const toConfig = getChainConfig(toChain);

  // Găsește protocol comun
  const commonProtocols = fromConfig.supportedBridgeProtocols.filter(
    protocol => toConfig.supportedBridgeProtocols.includes(protocol)
  );

  if (commonProtocols.length === 0) {
    throw new Error(`No common bridge protocol found between ${fromChain} and ${toChain}`);
  }

  // Returnează protocolul default sau primul disponibil
  const pairKey = `${fromConfig.chainId}-${toConfig.chainId}`;
  const defaultProtocol = defaultBridgeSettings.defaultProtocols[pairKey];

  if (defaultProtocol && commonProtocols.includes(defaultProtocol)) {
    return defaultProtocol;
  }

  return commonProtocols[0];
}
