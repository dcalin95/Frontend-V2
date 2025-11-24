import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { mainnet, bsc, polygon, arbitrum, optimism, base, avalanche } from "wagmi/chains";

// ⚙️ WALLET CONNECT CONFIGURATION (Modern Setup)
// NOTE: Get a free projectId from https://cloud.walletconnect.com
export const projectId = "a699c0c2623f235c0373506d45f16284"; 

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
});

