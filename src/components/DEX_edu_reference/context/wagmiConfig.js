import { createConfig, http } from "wagmi";
import { mainnet, bsc, polygon, arbitrum, optimism, base, avalanche } from "wagmi/chains";
import { walletConnect, coinbaseWallet, injected } from "wagmi/connectors";

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

// ⚙️ WALLET CONNECT / REOWN CONFIGURATION (Modern Setup)
// Project "bits" (Reown dashboard): 138a200f790cd554ae995d688546a71a
// Override: REACT_APP_WALLETCONNECT_PROJECT_ID in .env or build env.
export const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || "138a200f790cd554ae995d688546a71a";

// Dev/prod fallback when env var is not set (same as project "bits")
const DEV_FALLBACK_PROJECT_ID = "138a200f790cd554ae995d688546a71a";
const effectiveProjectId = projectId || DEV_FALLBACK_PROJECT_ID;

// Production safety: do NOT crash the whole app if env is missing (avoid white-screen).
// Instead, log loudly; check-env.js should prevent deploying without this.
if (process.env.NODE_ENV === "production" && !projectId) {
  // eslint-disable-next-line no-console
  console.error(
    "[ENV] Missing REACT_APP_WALLETCONNECT_PROJECT_ID. WalletConnect will use a fallback projectId; please set the env var and redeploy."
  );
}

// url dinamic: localhost în dev (evită warning "metadata.url differs from page url"), production altfel
const getMetadataUrl = () =>
  (typeof window !== "undefined" && (window.location?.hostname === "localhost" || window.location?.hostname === "127.0.0.1"))
    ? window.location.origin
    : "https://edu.bits-ai.io";
const metadata = {
  name: "BitSwapDEX AI - Education",
  description: "AI-Powered Crypto Education Platform - Multi-Chain Support",
  url: getMetadataUrl(),
  icons: ["https://edu.bits-ai.io/logo.png"]
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
  // EIP-6963: wagmi ascultă eip6963:announceProvider și creează conectori
  // IZOLAȚI per wallet (io.metamask, com.trustwallet.app etc.)
  // Fiecare are providerul lui propriu — nu se amestecă NICIODATĂ.
  // NU folosim metaMask() SDK — acesta capturează window.ethereum la startup
  // iar Trust Wallet hijackuiește window.ethereum ÎNAINTE → MetaMask SDK ar
  // deschide Trust în loc de MetaMask. EIP-6963 rezolvă asta complet.
  multiInjectedProviderDiscovery: true,
  connectors: [
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons?.[0],
    }),
    walletConnect({
      projectId: effectiveProjectId,
      metadata,
      showQrModal: true,
    }),
    // Generic injected — fallback; forcePickEvmInjectedProvider swapuiește
    // window.ethereum la providerul corect ÎNAINTE de connect()
    injected({ shimDisconnect: true }),
    // Binance Web3 Wallet — target explicit (nu e detectat prin EIP-6963)
    injected({
      shimDisconnect: true,
      target() {
        if (typeof window === "undefined" || !window.binancew3w?.ethereum?.request) return undefined;
        return {
          id: "binance-web3",
          name: "Binance Web3 Wallet",
          provider: window.binancew3w.ethereum,
        };
      },
    }),
  ],
  // BSC: wagmi chain default RPC (1rpc.io, bnb.llamarpc.com) blochează CORS din browser → forțăm RPC CORS-safe
  transports: {
    [bsc.id]: http('https://bsc-dataseed1.binance.org'),
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
