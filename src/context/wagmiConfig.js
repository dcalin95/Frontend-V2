import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { mainnet, bsc, polygon, arbitrum, optimism, base, avalanche } from "wagmi/chains";

// ⚙️ WALLET CONNECT CONFIGURATION (Modern Setup)
// NOTE: Get a free projectId from https://cloud.walletconnect.com
export const projectId = "3a8170812b534d0ff9d794f19a901d64"; // ID Public de test Web3Modal 

const metadata = {
  name: "BitSwapDEX AI",
  description: "AI-Powered Decentralized Exchange - Multi-Chain Support",
  url: "https://bits-ai.io",
  icons: ["https://bits-ai.io/logo.png"]
};

// 🌐 Supported EVM chains: BSC, Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche
export const chains = [
  bsc,          // Binance Smart Chain
  mainnet,      // Ethereum Mainnet
  polygon,      // Polygon (MATIC)
  arbitrum,     // Arbitrum One (Layer 2)
  optimism,     // Optimism (Layer 2)
  base,         // Base (Coinbase L2)
  avalanche     // Avalanche C-Chain
];

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableCoinbase: true,
  enableEmail: true,
  enableEIP6963: true, // Detects multiple injected wallets (MetaMask, Trust, Phantom, etc.)
  enableInjected: true, // Essential for dApp browsers (Trust Wallet Browser, MetaMask Browser)
  enableWalletConnect: true, // Standard connection for external wallets
  
  // 🛑 CRITICAL: DISABLE AUTO-CONNECT to prevent automatic reconnection at refresh
  // User MUST manually connect each time - no automatic reconnection
  ssr: false, // Disable server-side rendering features that might trigger auto-connect
  
  // 🛑 CRITICAL: Configure storage to BLOCK auto-reconnect completely
  storage: {
    getItem(key) {
      const value = localStorage.getItem(key);
      console.log(`🔍 [Wagmi Storage] GET ${key}:`, value);
      
      // 🛑 CRITICAL: BLOCK ALL auto-reconnect attempts
      // Only allow manual connections initiated by user
      if (key === 'wagmi.recentConnectorId' || key === 'wagmi.store' || key.includes('connector')) {
        console.warn(`🛑 [Wagmi Storage] BLOCKED auto-reconnect for key: ${key}`);
        console.warn(`🛑 [Wagmi Storage] User MUST manually connect - no automatic reconnection allowed`);
        return null; // Return null to prevent ANY auto-reconnect
      }
      
      return value;
    },
    setItem(key, value) {
      console.log(`🔍 [Wagmi Storage] SET ${key}:`, value);
      
      // 🛑 CRITICAL: Don't save connector IDs that might trigger auto-reconnect
      if (key === 'wagmi.recentConnectorId') {
        console.warn(`🛑 [Wagmi Storage] NOT saving recent connector ID to prevent auto-reconnect`);
        return; // Don't save
      }
      
      localStorage.setItem(key, value);
    },
    removeItem(key) {
      console.log(`🔍 [Wagmi Storage] REMOVE ${key}`);
      localStorage.removeItem(key);
    },
  },
});

