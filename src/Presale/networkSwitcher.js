import { toast } from "react-toastify";
import { switchChain } from '@wagmi/core';
import { config } from '../context/wagmiConfig';
import { forceFixPhantomHijack } from '../utils/walletFilter';

// 🌐 Network Definitions (Wagmi Compatible)
// Note: We use numeric Chain IDs for Wagmi v2 compatibility
const NETWORKS = {
  BNB_MAIN: {
    chainId: 56, // 0x38
    chainName: "BSC Mainnet",
  },
  ETH: {
    chainId: 1, // Ethereum Mainnet
    chainName: "Ethereum Mainnet",
  },
  MATIC: {
    chainId: 137, // Polygon Mainnet
    chainName: "Polygon Mainnet",
  },
};

// Presale is MAINNET-only
const isMainnet = true;

const TOKEN_TO_NETWORK = {
  BNB: "BNB_MAIN",
  USDT: "BNB_MAIN",
  USDC: "BNB_MAIN",
  ETH: "ETH",
  SHIB: "ETH",
  MATIC: "MATIC",
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

    // 🛑 CRITICAL: FIX PHANTOM HIJACK BEFORE SWITCH
    console.log('🔧 [NetworkSwitcher] Checking for Phantom hijack before switch...');
    forceFixPhantomHijack();
    
    // 🛑 CRITICAL: CLEAR PENDING REQUESTS BEFORE SWITCH
    console.log('🧹 [NetworkSwitcher] Clearing pending requests before switch...');
    try {
      sessionStorage.removeItem('wallet_pending_request');
      sessionStorage.removeItem('wagmi.connector');
      
      // Clear any pending wallet requests
      if (window.ethereum) {
        try {
          await window.ethereum.request({ 
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }]
          }).catch(() => {}); // Ignore errors
        } catch (e) {}
      }
    } catch (clearErr) {
      console.warn('⚠️ [NetworkSwitcher] Error clearing pending:', clearErr);
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
