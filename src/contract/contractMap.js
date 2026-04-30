import BitsABI from '../abi/BitsABI.js';
import stakingABI from '../abi/stakingABI.js';
import nodeABI from "../abi/nodeABI.js";
import AdditionalRewardABI from '../abi/AdditionalRewardABI.js';
import CellManagerABI from '../abi/CellManagerABI.js';
import TelegramRewardContractABI from '../abi/TelegramRewardContractABI.js';
import erc20ABI from '../abi/erc20ABI.js';
import { ethers } from 'ethers';
import UserVaultABI from '../abi/UserVaultABI.js';
import AITradingAccessControlABI from '../abi/AITradingAccessControlABI.js';
import LeverageTradingABI from '../abi/LeverageTradingABI.js';
import { getLeverageTradingAddress } from '../config/runtimeConfig.js';

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

// Keep host-level env overrides for the existing frontend contracts while adding DEX OTA contracts below.
const getEnvString = (key, fallback) => {
  const value = process.env[key];
  return value ? String(value) : fallback;
};

const getBitsTokenAddress = () => {
  const env1 = process.env.REACT_APP_BITS_TOKEN;
  const env2 = process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS;
  const fallback = "0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe";
  return (env1 || env2 || fallback).toLowerCase();
};

const getNodeAddress = () => {
  const env1 = process.env.REACT_APP_NODE;
  const env2 = process.env.REACT_APP_NODE_ADDRESS;
  const fallback = "0xE6536756d73F0771d9a317F49453de96541C352F";
  return (env1 || env2 || fallback).toLowerCase();
};

const getActiveNetworkValue = () => {
  const network = getEnvString("REACT_APP_NETWORK", "bsc-mainnet");
  return network.toLowerCase().includes("test") ? "TESTNET" : "MAINNET";
};

const ACTIVE_NETWORK = getActiveNetworkValue();

/**
 * Maparea centralizată a contractelor active pe BSC
 * Actualizată cu noile adrese de contracte pentru TESTNET
 * TODO: Adăugați adresele pentru MAINNET când sunt deployate
 */
export const CONTRACT_MAP = {
  BITS_TOKEN: {
    name: "BitsToken",
    address: getBitsTokenAddress(),
    abi: BitsABI,
  },
  // Alias for backward compatibility
  BITS: {
    name: "BitsToken",
    address: getBitsTokenAddress(),
    abi: BitsABI,
  },
  STAKING: {
    name: "TokenStaking", 
    address: getEnvString("REACT_APP_STAKING", "0xF1fd04dB28545C5d5d2f2a7709135839B22984de").toLowerCase(),
    abi: stakingABI,
  },
  NODE: {
    name: "NodeContract",
    address: getNodeAddress(),
    abi: nodeABI,
  },
  ADDITIONAL_REWARD: {
    name: "AdditionalReward",
    address: getEnvString("REACT_APP_ADDITIONAL_REWARD", "0x15473d61a9c8F866eb1a3a5b24e2B520acdb0Fc6").toLowerCase(),
    abi: AdditionalRewardABI,
  },
  CELL_MANAGER: {
    name: "CellManager", 
    address: getEnvString("REACT_APP_CELL_MANAGER", "0x957B858cc0684c8a91ec3C7f8A9E3DA2Df9F3bC6").toLowerCase(),
    abi: CellManagerABI,
  },
  TELEGRAM_REWARD: {
    name: "TelegramRewardContract",
    address: getEnvString("REACT_APP_TELEGRAM_REWARD", "0x5b861fbB5b40a04eb943428d2bD395B4c87D837e").toLowerCase(),
    abi: TelegramRewardContractABI,
  },
  
  // === OTA (OpenAI Trading Agent) Contracts (BSC MAINNET) ===
  // C3: Env override for staging/testnet – set REACT_APP_OTA_*_ADDRESS to use different deployed addresses.
  // Sync process (C1): When you redeploy from remix/OTA, update defaults below and backend env on Render.
  AI_TRADING_ACCESS_CONTROL: {
    name: "AITradingAccessControl",
    address: process.env.REACT_APP_AI_TRADING_ACCESS_CONTROL_ADDRESS || "0x8B32ce487A502a0f8c428A36163967058F89D1C0",
    abi: AITradingAccessControlABI,
  },
  // UserVault (BSC Mainnet) – TREBUIE folosită adresa PROXY. Citire/scriere (register, authorizeBot, getBotAuthorization) DOAR la proxy.
  // Proxy: 0x279852b048eCB3390D87Ce14398C3A884928fCB9 | Implementation (post-upgrade): 0x1ea23e21eb33204fd0df3437107573939dca5cfa
  // Backend (Render) USER_VAULT_ADDRESS trebuie să fie PROXY, nu implementation – altfel citește stare veche/greșită.
  USER_VAULT: {
    name: "UserVault",
    address: process.env.REACT_APP_USER_VAULT_ADDRESS || "0x279852b048eCB3390D87Ce14398C3A884928fCB9",
    abi: UserVaultABI,
  },

  // === OTA Auto Mode (Mode 3) Contracts (BSC MAINNET) ===
  // După redeploy OTAPolicyManager: set REACT_APP_OTA_POLICY_MANAGER_ADDRESS (frontend) + OTA_POLICY_MANAGER_ADDRESS (backend).
  OTA_POLICY_MANAGER: {
    name: "OTAPolicyManager",
    address: process.env.REACT_APP_OTA_POLICY_MANAGER_ADDRESS || "0x37CfEA29005638e4703D35F0D318d22db0f22649",
    abi: [],
  },
  OTA_AUTO_EXECUTOR: {
    name: "OTAAutoExecutor",
    address: process.env.REACT_APP_OTA_AUTO_EXECUTOR_ADDRESS || "0x5590574050b937cFa920f8F093D26c60592D1739",
    abi: [],
  },
  AI_TASK_MANAGER: {
    name: "AITaskManager",
    address: process.env.REACT_APP_AI_TASK_MANAGER_ADDRESS || "0x038fE2095AA747f6c1c87a2a2198Ab4a22e6D460",
    abi: [],
  },
  AI_TRADING_EXECUTOR: {
    name: "AITradingExecutor",
    address: process.env.REACT_APP_AI_TRADING_EXECUTOR_ADDRESS || "0x42E3E5ED00AE153347e4D883507598b0d83b215b",
    abi: [],
  },
  PANCAKE_ROUTER: {
    name: "PancakeSwapRouter",
    address: process.env.REACT_APP_PANCAKE_ROUTER_ADDRESS || "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    abi: [],
  },
  BITSWAP_WRAPPER: {
    name: "BitSwapDEXWrapper",
    address: process.env.REACT_APP_BITSWAP_WRAPPER_ADDRESS || "0x5dC470e76AB02190491a2d1a110c6e067623a761",
    abi: [],
  },

  // === Leverage Trading (BSC) - runtime-config.json | env | fallback deployed BSC Mainnet ===
  LEVERAGE_TRADING: {
    name: "LeverageTrading",
    get address() {
      return getLeverageTradingAddress() || process.env.REACT_APP_LEVERAGE_TRADING_ADDRESS || "0x14e89879f5e7715Ea59ae54A5A161E28A9d58452";
    },
    abi: LeverageTradingABI,
  },
  
  // === ERC20 Token Payment Contracts (BSC MAINNET addresses) ===
  USDT: {
    name: "Tether USD",
    address: process.env.REACT_APP_BSC_USDT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955", // Binance-Peg USDT (BSC Mainnet)
    abi: erc20ABI,
    decimals: 18,
  },
  USDC: {
    name: "USD Coin",
    address: process.env.REACT_APP_BSC_USDC_ADDRESS || "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // Binance-Peg USDC (BSC Mainnet)
    abi: erc20ABI,
    decimals: 18,
  },
  // EUR stablecoins – set REACT_APP_EURS_ADDRESS / REACT_APP_EURC_ADDRESS (ex: bridged pe BSC)
  EURS: {
    name: "EURS (Stasis Euro)",
    address: process.env.REACT_APP_EURS_ADDRESS || "",
    abi: erc20ABI,
    decimals: 18,
  },
  EURC: {
    name: "EURC (Circle Euro)",
    address: process.env.REACT_APP_EURC_ADDRESS || "",
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
  SHIB: {
    name: "SHIBA INU (Binance-Peg BSC)",
    address: process.env.REACT_APP_BSC_SHIB_ADDRESS || "0x2859e4544c4bb03966803b044a93563bd2d0dd4d",
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

/** Implementare deploy-ată (logică); evenimente reale user apar pe **proxy**, nu aici. */
export const USER_VAULT_IMPLEMENTATION_BSC = '0x1ea23e21eb33204fd0df3437107573939dca5cfa';

/** Proxy canonic BSC mainnet (operațional) dacă `REACT_APP_USER_VAULT_ADDRESS` e setat greșit la implementation. */
export const USER_VAULT_PROXY_DEFAULT_BSC = '0x279852b048eCB3390D87Ce14398C3A884928fCB9';

/**
 * Adresa **proxy** UserVault pentru getLogs / istoric (inclusiv fallback browser în Personal Account).
 * Dacă env indică implementation-ul, revine la proxy canonic.
 */
export function getUserVaultProxyAddressForHistory() {
  const raw = CONTRACT_MAP?.USER_VAULT?.address;
  if (!raw) return null;
  let a;
  try {
    a = ethers.utils.getAddress(String(raw).trim());
  } catch {
    return null;
  }
  if (a.toLowerCase() === ethers.utils.getAddress(USER_VAULT_IMPLEMENTATION_BSC).toLowerCase()) {
    console.error(
      '[contractMap] USER_VAULT address este implementation — pentru evenimente folosesc proxy canonic:',
      USER_VAULT_PROXY_DEFAULT_BSC
    );
    return ethers.utils.getAddress(USER_VAULT_PROXY_DEFAULT_BSC);
  }
  return a;
}
