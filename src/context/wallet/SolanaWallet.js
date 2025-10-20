// Importăm iconițele locale
import phantomIcon from "../../assets/icons/phantom-logo.png";
import solflareIcon from "../../assets/icons/solflare-logo.ico";
import cloverIcon from "../../assets/icons/clover-logo.webp";
import solletIcon from "../../assets/icons/Sollet-logo.webp";
import slopeIcon from "../../assets/icons/slope-logo.avif";
import solanaIcon from "../../assets/icons/solana-logo.png"; // Iconița pentru Solana

// Link-urile pentru descărcarea wallet-urilor
const walletDownloadLinks = {
  Phantom: "https://phantom.app/",
  Solflare: "https://solflare.com/",
  Clover: "https://clover.finance/",
  Sollet: "https://www.sollet.io/",
  Slope: "https://slope.finance/",
};

// Funcție pentru promptul de instalare a unui wallet
const promptInstallWallet = async (walletName) => {
  const userConfirmed = window.confirm(
    `${walletName} Wallet is not installed. Would you like to visit the official installation page?`
  );
  if (userConfirmed && walletDownloadLinks[walletName]) {
    window.open(walletDownloadLinks[walletName], "_blank");
  }
};

// Funcția generală de conectare pentru wallet-uri
const connectGenericWallet = async (walletName, isInstalled) => {
  if (!isInstalled()) {
    await promptInstallWallet(walletName);
    return null;
  }

  try {
    return `Connected to ${walletName}!`; // Placeholder pentru wallet-uri neimplementate
  } catch (error) {
    throw new Error(`Failed to connect to ${walletName}: ${error.message}`);
  }
};

// Conectare la Phantom Wallet
const connectPhantom = async () => {
  if (!window.solana || !window.solana.isPhantom) {
    return promptInstallWallet("Phantom");
  }

  try {
    const response = await window.solana.connect();
    console.log("Connected to Phantom:", response.publicKey.toString());
    return response.publicKey.toString();
  } catch (error) {
    console.error("Error connecting to Phantom:", error);
    throw new Error("Failed to connect to Phantom. Please try again.");
  }
};

// Lista wallet-urilor Solana cu iconițele locale
export const solanaWallets = [
  {
    name: "Phantom",
    icon: phantomIcon,
    color: "#9146ff",
    installLink: walletDownloadLinks.Phantom,
    isInstalled: () => !!window.solana && window.solana.isPhantom,
    connect: connectPhantom,
  },
  {
    name: "Solflare",
    icon: solflareIcon,
    color: "#ffac33",
    installLink: walletDownloadLinks.Solflare,
    isInstalled: () => false, // Extensia browserului nu este disponibilă
    connect: () => connectGenericWallet("Solflare", () => false),
  },
  {
    name: "Clover",
    icon: cloverIcon,
    color: "#00a65a",
    installLink: walletDownloadLinks.Clover,
    isInstalled: () => false, // Extensia browserului nu este disponibilă
    connect: () => connectGenericWallet("Clover", () => false),
  },
  {
    name: "Sollet",
    icon: solletIcon,
    color: "#00a3e2",
    installLink: walletDownloadLinks.Sollet,
    isInstalled: () => false, // Extensia browserului nu este disponibilă
    connect: () => connectGenericWallet("Sollet", () => false),
  },
  {
    name: "Slope",
    icon: slopeIcon,
    color: "#a9a9a9",
    installLink: walletDownloadLinks.Slope,
    isInstalled: () => false, // Extensia browserului nu este disponibilă
    connect: () => connectGenericWallet("Slope", () => false),
  },
];

// Export pentru selectorul rețelei (Solana Icon)
export const solanaNetwork = {
  name: "Solana",
  icon: solanaIcon, // Iconița pentru selectorul de rețea
};

