import { createConfig, http } from "wagmi";
import { mainnet, bsc, polygon, arbitrum, optimism, base, avalanche } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

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
export const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || "";

// Dev fallback (keeps local dev + emergency prod hotfix working if env var is not set)
const DEV_FALLBACK_PROJECT_ID = "3a8170812b534d0ff9d794f19a901d64";
const effectiveProjectId = projectId || DEV_FALLBACK_PROJECT_ID;

// Production safety: do NOT crash the whole app if env is missing (avoid white-screen).
// Instead, log loudly; check-env.js should prevent deploying without this.
if (process.env.NODE_ENV === "production" && !projectId) {
  // eslint-disable-next-line no-console
  console.error(
    "[ENV] Missing REACT_APP_WALLETCONNECT_PROJECT_ID. WalletConnect will use a fallback projectId; please set the env var and redeploy."
  );
}

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

/**
 * ✅ IMPORTANT (CSP / WalletConnect):
 * We DO NOT use Web3Modal/AppKit here because it can load wallet UI via embedded iframes,
 * which may be blocked by CSP / frame-ancestors.
 *
 * Instead, we use wagmi native connectors (WalletConnect v2 + injected + Coinbase SDK),
 * which do NOT rely on embedded iframe wallet UIs.
 */
export const config = createConfig({
  chains,
  ssr: false,
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons?.[0],
    }),
    walletConnect({
      projectId: effectiveProjectId,
  metadata,
      showQrModal: true,
    }),
  ],
  transports: {
    [bsc.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [avalanche.id]: http(),
  },
  // ✅ Conditional persistence (user-controlled):
  // If the user disables "Remember my wallet", we block wagmi storage reads
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

