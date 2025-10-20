import { walletIconMap } from "../../assets/icons/walletIconMap";

export const walletList = [
  // ---------- EVM Wallets ----------
  {
    name: "MetaMask",
    key: "metamask",
    color: "#e2761b",
    type: "evm",
  },
  {
    name: "Trust Wallet",
    key: "trustwallet",
    color: "#3375bb",
    type: "evm",
  },
  {
    name: "OKX Wallet",
    key: "okx",
    color: "#000000",
    type: "evm",
    disabled: true, // gri în UI
  },
  {
    name: "Coinbase Wallet",
    key: "coinbase",
    color: "#1652f0",
    type: "evm",
  },
  {
    name: "Torus",
    key: "torus",
    color: "#0084ff",
    type: "evm",
  },
  {
    name: "WalletConnect",
    key: "walletconnect",
    color: "#3b99fc",
    type: "evm",
  },

  // ---------- Solana Wallets ----------
  {
    name: "Phantom",
    key: "phantom",
    color: "#8a63d2",
    type: "solana",
  },
  {
    name: "Solflare",
    key: "solflare",
    color: "#ff8900",
    type: "solana",
  },
];

// Adaugăm iconurile din map
export const walletListWithIcons = walletList.map((wallet) => ({
  ...wallet,
  icon: walletIconMap[wallet.key],
}));

