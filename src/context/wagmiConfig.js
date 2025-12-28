import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { mainnet, bsc, polygon, arbitrum, optimism, base, avalanche } from "wagmi/chains";

const REMEMBER_WALLET_KEY = "bits_remember_wallet"; // "true" | "false" (default false)

const shouldRememberWallet = () => {
  try {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(REMEMBER_WALLET_KEY);
    // default OFF unless explicitly set to "true"
    return v === "true";
  } catch (_) {
    return false;
  }
};

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

  // ✅ ENABLE persistent connection:
  // wagmi will persist the last connector in storage and reconnect on refresh/restart
  ssr: false, // Disable server-side rendering features that might trigger auto-connect

  // ✅ Conditional persistence (user-controlled):
  // If the user disables "Remember my wallet", we block wagmi storage reads/writes
  // so the site behaves like manual-connect-only until re-enabled.
  storage: {
    getItem(key) {
      try {
        if (!shouldRememberWallet() && String(key || "").startsWith("wagmi.")) return null;
        return localStorage.getItem(key);
      } catch (_) {
        return null;
      }
    },
    setItem(key, value) {
      try {
        // Always allow writes so that if user later enables "Remember wallet",
        // the last connection state is already available to restore.
        // Reads are still blocked when "Remember wallet" is OFF.
        localStorage.setItem(key, value);
      } catch (_) {}
    },
    removeItem(key) {
      try {
        localStorage.removeItem(key);
      } catch (_) {}
    },
  },
});

