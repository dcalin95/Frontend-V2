import BitsABI from '../abi/BitsABI.js';
import stakingABI from '../abi/stakingABI.js';
import nodeABI from "../abi/nodeABI.js";
import AdditionalRewardABI from '../abi/AdditionalRewardABI.js';
import CellManagerABI from '../abi/CellManagerABI.js';
import TelegramRewardContractABI from '../abi/TelegramRewardContractABI.js';
import erc20ABI from '../abi/erc20ABI.js';

/**
 * Configurare pentru network și contracte
 * Poate comuta între BSC Testnet și BSC Mainnet
 */
const NETWORK_CONFIG = {
  TESTNET: {
    chainId: 97,
    name: "BSC Testnet",
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/"
  },
  MAINNET: {
    chainId: 56,
    name: "BSC Mainnet", 
    rpcUrl: "https://bsc-dataseed1.binance.org/"
  }
};

// Set active network (change to MAINNET for production)
const ACTIVE_NETWORK = 'MAINNET';

/**
 * Maparea centralizată a contractelor active pe BSC
 * Actualizată cu noile adrese de contracte pentru TESTNET
 * TODO: Adăugați adresele pentru MAINNET când sunt deployate
 */
export const CONTRACT_MAP = {
  BITS_TOKEN: {
    name: "BitsToken",
    address: "0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe",
    abi: BitsABI,
  },
  // Alias for backward compatibility
  BITS: {
    name: "BitsToken",
    address: "0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe",
    abi: BitsABI,
  },
  STAKING: {
    name: "TokenStaking", 
    address: "0xF1fd04dB28545C5d5d2f2a7709135839B22984de",
    abi: stakingABI,
  },
  NODE: {
    name: "NodeContract",
    address: "0xE6536756d73F0771D9a317F49453DE96541C352F",
    abi: nodeABI,
  },
  ADDITIONAL_REWARD: {
    name: "AdditionalReward",
    address: "0x15473d61a9c8F866eb1a3a5b24e2B520acdb0Fc6",
    abi: AdditionalRewardABI,
  },
  CELL_MANAGER: {
    name: "CellManager", 
    address: "0x957B858cc0684c8a91ec3C7f8A9E3DA2Df9F3bC6",
    abi: CellManagerABI,
  },
  TELEGRAM_REWARD: {
    name: "TelegramRewardContract",
    address: "0x5b861fbB5b40a04eb943428d2bD395B4c87D837e",
    abi: TelegramRewardContractABI,
  },
  
  // === ERC20 Token Payment Contracts (BSC MAINNET addresses) ===
  USDT: {
    name: "Tether USD",
    address: "0x55d398326f99059fF775485246999027B3197955", // Binance-Peg USDT (BSC Mainnet)
    abi: erc20ABI,
    decimals: 18,
  },
  USDC: {
    name: "USD Coin",
    address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // Binance-Peg USDC (BSC Mainnet)
    abi: erc20ABI,
    decimals: 18,
  },
  BUSD: {
    name: "Binance USD", 
    address: "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD (legacy, optional)
    abi: erc20ABI,
  },
  DAI: {
    name: "DAI Stablecoin",
    address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", // Binance-Peg DAI (BSC Mainnet)
    abi: erc20ABI,
  },
  MATIC: {
    name: "Polygon MATIC",
    address: "0xCC42724C6683B7E57334c4E856f4c9965ED682bD", // Binance-Peg MATIC (BSC Mainnet)
    abi: erc20ABI,
    decimals: 18,
  },
};

/**
 * Funcție generică pentru crearea instanțelor de contracte
 * @param {string} contractKey - Cheia contractului din CONTRACT_MAP
 * @param {ethers.providers.Provider | ethers.Signer | null} signerOrProvider - Signer sau Provider
 * @returns {ethers.Contract}
 */
export const getContractInstance = (contractKey, signerOrProvider) => {
  const contractInfo = CONTRACT_MAP[contractKey];
  
  if (!contractInfo) {
    throw new Error(`Contract ${contractKey} not found in CONTRACT_MAP`);
  }
  
  if (!signerOrProvider) {
    throw new Error('Signer or Provider is required to create contract instance');
  }
  
  const { ethers } = require('ethers');
  return new ethers.Contract(contractInfo.address, contractInfo.abi, signerOrProvider);
};

/**
 * Funcțiile specifice pentru fiecare contract activ
 */
export const getBITSContract = (signerOrProvider) => 
  getContractInstance('BITS_TOKEN', signerOrProvider);

export const getStakingContract = (signerOrProvider) => 
  getContractInstance('STAKING', signerOrProvider);

export const getNodeContract = (signerOrProvider) => 
  getContractInstance('NODE', signerOrProvider);

export const getAdditionalRewardContract = (signerOrProvider) => 
  getContractInstance('ADDITIONAL_REWARD', signerOrProvider);

export const getCellManagerContract = (signerOrProvider) => 
  getContractInstance('CELL_MANAGER', signerOrProvider);

export const getTelegramRewardContract = (signerOrProvider) => 
  getContractInstance('TELEGRAM_REWARD', signerOrProvider);

/**
 * Export pentru configurarea network-ului
 */
export const getActiveNetwork = () => NETWORK_CONFIG[ACTIVE_NETWORK];
export const getActiveNetworkName = () => ACTIVE_NETWORK;
export const isTestnet = () => ACTIVE_NETWORK === 'TESTNET';
export const isMainnet = () => ACTIVE_NETWORK === 'MAINNET';

/**
 * Funcție helper pentru debugging contracte
 */
export const getContractAddresses = () => {
  return Object.entries(CONTRACT_MAP).reduce((acc, [key, contract]) => {
    acc[key] = contract.address;
    return acc;
  }, {});
};

// Debug logging (can be removed in production)
// console.log("🌐 Active Network:", ACTIVE_NETWORK, NETWORK_CONFIG[ACTIVE_NETWORK]);
// console.log("📝 Contract Addresses:", getContractAddresses());
