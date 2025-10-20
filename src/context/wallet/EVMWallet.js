import { ethers } from "ethers";
import { showCustomConfirm } from "./utils";
import { createConfiguredProvider } from "./providerConfig";

// Importăm iconițele locale
import evmIcon from "../../assets/icons/evm-logo.jpg"; // Iconiță pentru selectorul de rețea EVM
import metamaskIcon from "../../assets/icons/metamask-logo.png";
import coinbaseIcon from "../../assets/icons/coinbase-logo.png";
import okxIcon from "../../assets/icons/okx-logo.png";
import rainbowIcon from "../../assets/icons/rainbow-logo.png";
import trustWalletIcon from "../../assets/icons/trustwallet-logo.png";
import torusIcon from "../../assets/icons/torus-logo.png";
import walletConnectIcon from "../../assets/icons/wallet-connect-logo.png";

// Link-uri pentru descărcare wallet-uri
const walletDownloadLinks = {
  MetaMask: "https://metamask.io/download/",
  "Coinbase Wallet": "https://www.coinbase.com/wallet",
  "OKX Wallet": "https://www.okx.com/web3",
  Rainbow: "https://rainbow.me/",
  "Trust Wallet": "https://trustwallet.com/",
  Torus: "https://tor.us/",
  WalletConnect: "https://walletconnect.com/",
};

// Funcție pentru promptul de instalare a unui wallet
const promptInstallWallet = async (walletName) => {
  const userConfirmed = await showCustomConfirm(
    `${walletName} is not installed. Would you like to visit the official installation page?`
  );
  if (userConfirmed && walletDownloadLinks[walletName]) {
    window.open(walletDownloadLinks[walletName], "_blank");
  }
};

// Funcția generală de conectare pentru wallet-uri
const connectGenericWallet = async (walletName, customLogic) => {
  // Verifică dacă wallet-ul este instalat
  let isInstalled = false;
  
  if (walletName === "MetaMask") {
    isInstalled = !!window.ethereum && window.ethereum.isMetaMask;
  } else if (walletName === "Coinbase Wallet") {
    isInstalled = !!window.coinbaseWalletExtension || (window.ethereum && window.ethereum.isCoinbaseWallet);
  } else if (walletName === "Rainbow") {
    isInstalled = !!window.ethereum && window.ethereum.isRainbow;
  } else {
    isInstalled = !!window.ethereum;
  }

  if (!isInstalled) {
    return promptInstallWallet(walletName);
  }

  try {
    return await customLogic();
  } catch (error) {
    console.error(`Error connecting to ${walletName}:`, error);
    throw new Error(`Failed to connect to ${walletName}. Please try again.`);
  }
};

// Logica specifică pentru conectarea MetaMask
const connectMetaMask = async () => {
  const provider = createConfiguredProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  return address;
};

// Logica specifică pentru conectarea Coinbase Wallet
const connectCoinbaseWallet = async () => {
  if (window.coinbaseWalletExtension) {
    // Coinbase Wallet Extension
    const provider = createConfiguredProvider(window.coinbaseWalletExtension);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    return address;
  } else if (window.ethereum && window.ethereum.isCoinbaseWallet) {
    // Coinbase Wallet prin window.ethereum
    const provider = createConfiguredProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    return address;
  } else {
    throw new Error("Coinbase Wallet not found. Please install Coinbase Wallet extension.");
  }
};

// Logica specifică pentru conectarea Rainbow Wallet
const connectRainbowWallet = async () => {
  if (window.ethereum && window.ethereum.isRainbow) {
    // Rainbow Wallet prin window.ethereum
    const provider = createConfiguredProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    return address;
  } else {
    throw new Error("Rainbow Wallet not found. Please install Rainbow Wallet extension.");
  }
};

// Lista wallet-urilor disponibile
export const evmWallets = [
  {
    name: "MetaMask",
    icon: metamaskIcon,
    color: "#f6851b",
    installLink: walletDownloadLinks.MetaMask,
    isInstalled: () => !!window.ethereum && window.ethereum.isMetaMask,
    connect: () => connectGenericWallet("MetaMask", connectMetaMask),
  },
  {
    name: "Coinbase Wallet",
    icon: coinbaseIcon,
    color: "#0052ff",
    installLink: walletDownloadLinks["Coinbase Wallet"],
    isInstalled: () => !!window.coinbaseWalletExtension || (window.ethereum && window.ethereum.isCoinbaseWallet),
    connect: () => connectGenericWallet("Coinbase Wallet", connectCoinbaseWallet),
  },
  {
    name: "Rainbow",
    icon: rainbowIcon,
    color: "#ff007e",
    installLink: walletDownloadLinks.Rainbow,
    isInstalled: () => !!window.ethereum && window.ethereum.isRainbow,
    connect: () => connectGenericWallet("Rainbow", connectRainbowWallet),
  },
  {
    name: "OKX Wallet",
    icon: okxIcon,
    color: "#000",
    installLink: walletDownloadLinks["OKX Wallet"],
    isInstalled: () => false, // Browser extension unavailable
    connect: async () => {
      throw new Error("OKX Wallet connection not yet implemented.");
    },
  },
  {
    name: "Rainbow",
    icon: rainbowIcon,
    color: "#ff007e",
    installLink: walletDownloadLinks.Rainbow,
    isInstalled: () => false, // Browser extension unavailable
    connect: async () => {
      throw new Error("Rainbow Wallet connection not yet implemented.");
    },
  },
  {
    name: "Trust Wallet",
    icon: trustWalletIcon,
    color: "#3377cc",
    installLink: walletDownloadLinks["Trust Wallet"],
    isInstalled: () => false, // Browser extension unavailable
    connect: async () => {
      throw new Error("Trust Wallet does not support browser extensions.");
    },
  },
  {
    name: "Torus",
    icon: torusIcon,
    color: "#0052ff",
    installLink: walletDownloadLinks.Torus,
    isInstalled: () => !!window.torus,
    connect: async () => {
      throw new Error("Torus Wallet connection not yet implemented.");
    },
  },
  {
    name: "WalletConnect",
    icon: walletConnectIcon,
    color: "#3b99fc",
    installLink: walletDownloadLinks.WalletConnect,
    isInstalled: () => false, // Browser extension unavailable
    connect: async () => {
      throw new Error("WalletConnect is a protocol, not a browser wallet.");
    },
  },
];

// Export pentru selectorul rețelei (EVM Icon)
export const evmNetwork = {
  name: "EVM",
  icon: evmIcon, // Iconița pentru selectorul de rețea
};

