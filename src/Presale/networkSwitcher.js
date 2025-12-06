import { toast } from "react-toastify";
import { switchChain } from '@wagmi/core';
import { config } from '../../context/wagmiConfig';

// 🌐 Network Definitions (Wagmi Compatible)
// Note: We use numeric Chain IDs for Wagmi v2 compatibility
const NETWORKS = {
  BNB_TEST: {
    chainId: 97, // 0x61
    chainName: "BSC Testnet",
  },
  BNB_MAIN: {
    chainId: 56, // 0x38
    chainName: "BSC Mainnet",
  },
  ETH: {
    chainId: 1, // Ethereum Mainnet
    chainName: "Ethereum Mainnet",
  },
  ETH_TEST: {
    chainId: 11155111, // Sepolia
    chainName: "Sepolia Testnet",
  },
  MATIC: {
    chainId: 137, // Polygon Mainnet
    chainName: "Polygon Mainnet",
  },
  MATIC_TEST: {
    chainId: 80002, // Amoy
    chainName: "Polygon Amoy",
  },
};

const isMainnet = process.env.REACT_APP_ENV === "mainnet";

const TOKEN_TO_NETWORK = {
  BNB: isMainnet ? "BNB_MAIN" : "BNB_TEST",
  USDT: isMainnet ? "BNB_MAIN" : "BNB_TEST",
  USDC: isMainnet ? "BNB_MAIN" : "BNB_TEST",
  ETH: isMainnet ? "ETH" : "ETH_TEST",
  SHIB: isMainnet ? "ETH" : "ETH_TEST",
  MATIC: isMainnet ? "MATIC" : "MATIC_TEST",
};

/**
 * 🔄 Switch Network using Wagmi Core (Provider Agnostic)
 * This prevents Phantom hijacking by using the actual connected connector via Wagmi.
 */
export const switchNetwork = async (selectedToken) => {
  const networkKey = TOKEN_TO_NETWORK[selectedToken];
  
  if (!networkKey) {
    // If token is not mapped (e.g. SOL), we might be on Solana which is handled differently
    return;
  }

  const network = NETWORKS[networkKey];

  if (!network) {
    console.warn(`⚠️ No network setup for token: ${selectedToken}`);
    return;
  }

  try {
    const currentChainId = config.state.chainId;
    
    if (currentChainId === network.chainId) {
      // ✅ Already on correct chain
      return;
    }

    toast.info(`🔄 Switching to ${network.chainName}...`);
    
    // 🚀 USE WAGMI CORE - Uses the ACTIVE connector (MetaMask, WalletConnect, etc.)
    await switchChain(config, { chainId: network.chainId });
    
    toast.success(`✅ Switched to ${network.chainName}`);
  } catch (err) {
    console.error("❌ Network switch error:", err);
    
    // Handle user rejection
    if (err.message?.includes("User rejected") || err.code === 4001) {
      toast.warn("⚠️ Network switch cancelled.");
      return;
    }

    // If switch fails (e.g. chain not added), Wagmi handles basic errors.
    // For custom "Add Chain" logic, Wagmi usually handles it automatically for supported chains.
    toast.error(`❌ Failed to switch: ${err.message?.substring(0, 50)}...`);
  }
};
