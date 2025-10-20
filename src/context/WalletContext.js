import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import WalletConnectProvider from "@walletconnect/web3-provider";

import metamaskIcon from "../assets/icons/metamask-logo.png";
import phantomIcon from "../assets/icons/phantom-logo.png";
import walletConnectIcon from "../assets/icons/wallet-connect-logo.png";
import coinbaseIcon from "../assets/icons/coinbase-logo.png";
import rainbowIcon from "../assets/icons/rainbow-logo.png";
import { getContractInstance } from "../contract/getContract";
import { WALLET_TYPES } from "./wallet/walletTypes";
import { WALLET_CONNECT_CONFIG } from "./wallet/walletConnectConfig";
import { showCustomConfirm } from "./wallet/utils";
import { createConfiguredProvider } from "./wallet/providerConfig";
import MetaMaskInfoPopup from "../components/MetaMaskInfoPopup";

const WalletContext = createContext();
export default WalletContext;

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  
  // DEBUG: Monitor wallet address changes
  useEffect(() => {
    console.log("🚨 [WalletContext] WALLET ADDRESS CHANGED:", walletAddress);
  }, [walletAddress]);
  const [network, setNetwork] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null); // ✅ adăugat
  const [walletType, setWalletType] = useState(null);
  const [walletIcon, setWalletIcon] = useState(null);
  const [walletName, setWalletName] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [ethBalance, setEthBalance] = useState(0);
  const [bitsBalance, setBitsBalance] = useState(0);

  // MetaMask popup state
  const [showMetaMaskPopup, setShowMetaMaskPopup] = useState(false);
  const [pendingWalletType, setPendingWalletType] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Added isLoading state

  const networkNames = {
    1: "Ethereum Mainnet",
    56: "Binance Smart Chain",
    97: "BSC Testnet",
    137: "Polygon",
    43114: "Avalanche",
  };

  let web3authInstance = null;

  // Funcție pentru a gestiona instalarea wallet-urilor
  const promptInstallWallet = async (walletName) => {
    const walletDownloadLinks = {
      "Coinbase Wallet": "https://www.coinbase.com/wallet",
      "MetaMask": "https://metamask.io/download/",
      "Rainbow": "https://rainbow.me/",
    };

    const userConfirmed = await showCustomConfirm(
      `${walletName} is not installed. Would you like to visit the official installation page?`
    );
    
    if (userConfirmed && walletDownloadLinks[walletName]) {
      window.open(walletDownloadLinks[walletName], "_blank");
    }
  };

  const loginWithWeb3Auth = async () => {
    if (!web3authInstance) {
        web3authInstance = new Web3Auth({
        clientId: "BES8kujJeBgfBvVa1a9TLtNGuKUqVFTIXGfgOlEyB4sJv51AxncNougD4ImDK6qYVWVjGYtrRBO5MKteOzmdA8",
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: "0x38", // BSC Mainnet
          rpcTarget: "https://bsc-dataseed1.binance.org", // BSC MAINNET endpoint
        },
      });
      await web3authInstance.initModal();
    }

    const web3authProvider = await web3authInstance.connect();
    const ethersProvider = createConfiguredProvider(web3authProvider);
    const signer = ethersProvider.getSigner();
    const address = await signer.getAddress();

    return { address, provider: ethersProvider };
  };

  const connectWallet = async (type = WALLET_TYPES.EVM) => {
    try {
      // Check if it's MetaMask on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                      window.innerWidth <= 768 ||
                      ('ontouchstart' in window) ||
                      (navigator.maxTouchPoints > 0);
      
      const isMetaMask = type === WALLET_TYPES.EVM;
      
      // Show popup for MetaMask on mobile
      if (isMobile && isMetaMask) {
        setPendingWalletType(type);
        setShowMetaMaskPopup(true);
        return; // Exit early, will continue after user confirms
      }

      // Continue with normal connection logic
      await performWalletConnection(type);
    } catch (error) {
      console.error("Wallet connection error:", error);
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  // Separate function for actual wallet connection
  const performWalletConnection = async (type = WALLET_TYPES.EVM) => {
    console.log("🚨 [WalletContext] performWalletConnection START:", type);
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      if (type === WALLET_TYPES.EVM) {
        console.log("🚨 [WalletContext] Starting EVM connection...");
        if (!window.ethereum) {
          console.error("❌ [WalletContext] window.ethereum not found!");
          throw new Error("Please install MetaMask.");
        }
        console.log("🚨 [WalletContext] window.ethereum found, creating provider...");
        const web3Provider = createConfiguredProvider(window.ethereum);
        console.log("🚨 [WalletContext] Provider created, requesting accounts...");
        const accounts = await web3Provider.send("eth_requestAccounts", []);
        console.log("🚨 [WalletContext] Accounts received:", accounts);
        const network = await web3Provider.getNetwork();
        console.log("🚨 [WalletContext] Network info:", network);
        const address = accounts[0];

        console.log("🚨 [WalletContext] Setting wallet state...");
        setWalletAddress(address);
        setProvider(web3Provider);
        setSigner(web3Provider.getSigner()); // ✅ important!
        setNetwork(networkNames[network.chainId] || `Chain ID: ${network.chainId}`);
        setWalletType("EVM");
        setWalletIcon(metamaskIcon);
        setWalletName("MetaMask");

        console.log("🚨 [WalletContext] Fetching balances...");
        await fetchBalances(web3Provider, address);
        console.log("🚨 [WalletContext] EVM connection SUCCESS!");
      }

      else if (type === WALLET_TYPES.SOLANA) {
        if (!window.solana?.isPhantom) throw new Error("Phantom wallet not installed.");
        const response = await window.solana.connect();
        setWalletAddress(response.publicKey.toString());
        setNetwork("Solana");
        setWalletType("Solana");
        setWalletIcon(phantomIcon);
        setWalletName("Phantom");
      }

      else if (type === WALLET_TYPES.TORUS) {
        const { address, provider: torusProvider } = await loginWithWeb3Auth();
        setWalletAddress(address);
        setProvider(torusProvider);
        setSigner(torusProvider.getSigner()); // ✅ important!
        setNetwork("Binance Smart Chain");
        setWalletType("torus");
        setWalletIcon("https://web3auth.io/docs/branding-resources/web3auth-icon.svg");
        setWalletName("Web3Auth");

        await fetchBalances(torusProvider, address);
      }

      else if (type === WALLET_TYPES.WALLETCONNECT) {
        // Initialize WalletConnect Provider
        const wcProvider = new WalletConnectProvider(WALLET_CONNECT_CONFIG);

        // Enable session (triggers QR Code modal)
        await wcProvider.enable();

        // Create ethers provider
        const ethersProvider = createConfiguredProvider(wcProvider);
        const signer = ethersProvider.getSigner();
        const address = await signer.getAddress();
        const network = await ethersProvider.getNetwork();

        setWalletAddress(address);
        setProvider(ethersProvider);
        setSigner(signer);
        setNetwork(networkNames[network.chainId] || `Chain ID: ${network.chainId}`);
        setWalletType("walletconnect");
        setWalletIcon(walletConnectIcon);
        setWalletName("WalletConnect");

        await fetchBalances(ethersProvider, address);
      }

      else if (type === WALLET_TYPES.COINBASE) {
        // Check for Coinbase Wallet
        if (!window.coinbaseWalletExtension && !(window.ethereum && window.ethereum.isCoinbaseWallet)) {
          await promptInstallWallet("Coinbase Wallet");
          return; // Exit early if wallet is not installed
        }

        let coinbaseProvider;
        if (window.coinbaseWalletExtension) {
          coinbaseProvider = createConfiguredProvider(window.coinbaseWalletExtension);
        } else {
          coinbaseProvider = createConfiguredProvider(window.ethereum);
        }

        const accounts = await coinbaseProvider.send("eth_requestAccounts", []);
        const network = await coinbaseProvider.getNetwork();
        const address = accounts[0];

        setWalletAddress(address);
        setProvider(coinbaseProvider);
        setSigner(coinbaseProvider.getSigner());
        setNetwork(networkNames[network.chainId] || `Chain ID: ${network.chainId}`);
        setWalletType("coinbase");
        setWalletIcon(coinbaseIcon);
        setWalletName("Coinbase Wallet");

        await fetchBalances(coinbaseProvider, address);
      }

      else if (type === WALLET_TYPES.RAINBOW) {
        // Check for Rainbow Wallet
        if (!window.ethereum || !window.ethereum.isRainbow) {
          await promptInstallWallet("Rainbow");
          return; // Exit early if wallet is not installed
        }

        const rainbowProvider = createConfiguredProvider(window.ethereum);
        const accounts = await rainbowProvider.send("eth_requestAccounts", []);
        const network = await rainbowProvider.getNetwork();
        const address = accounts[0];

        setWalletAddress(address);
        setProvider(rainbowProvider);
        setSigner(rainbowProvider.getSigner());
        setNetwork(networkNames[network.chainId] || `Chain ID: ${network.chainId}`);
        setWalletType("rainbow");
        setWalletIcon(rainbowIcon);
        setWalletName("Rainbow");

        await fetchBalances(rainbowProvider, address);
      }

      else {
        console.error("❌ [WalletContext] Unsupported wallet type:", type);
        throw new Error("Unsupported wallet type.");
      }

      console.log("🚨 [WalletContext] Connection completed successfully!");
      setIsLoading(false);
    } catch (error) {
      console.error("⚠️ Wallet connect error:", error.message);
      setErrorMessage(error.message || "Failed to connect.");
      setIsLoading(false);
      throw error;
    }
  };

  // Handle MetaMask popup continue
  const handleMetaMaskPopupContinue = async () => {
    setShowMetaMaskPopup(false);
    if (pendingWalletType) {
      await performWalletConnection(pendingWalletType);
      setPendingWalletType(null);
    }
  };

  // Handle MetaMask popup close
  const handleMetaMaskPopupClose = () => {
    setShowMetaMaskPopup(false);
    setPendingWalletType(null);
    setIsLoading(false);
  };

  const disconnectWallet = async () => {
    setWalletAddress(null);
    setProvider(null);
    setSigner(null); // ✅ resetăm signer
    setNetwork(null);
    setWalletType(null);
    setWalletIcon(null);
    setWalletName(null);
    setEthBalance(0);
    setBitsBalance(0);
    setErrorMessage("");

    if (web3authInstance) {
      await web3authInstance.logout();
    }

    // Disconnect WalletConnect if it was used
    if (walletType === WALLET_TYPES.WALLETCONNECT && provider) {
      try {
        const wcProvider = provider.provider;
        if (wcProvider && wcProvider.disconnect) {
          await wcProvider.disconnect();
        }
      } catch (error) {
        console.warn("WalletConnect disconnect error:", error);
      }
    }

    localStorage.clear();
  };

  const fetchBalances = async (provider, address) => {
    try {
      const rawBalance = await provider.getBalance(address);
      setEthBalance(parseFloat(ethers.utils.formatEther(rawBalance)));

      try {
        const bits = await getContractInstance("BITS", provider);
        const rawBits = await bits.balanceOf(address);
        setBitsBalance(parseFloat(ethers.utils.formatUnits(rawBits, 18)));
      } catch (err) {
        console.warn("BITS balance fetch failed:", err.message);
        setBitsBalance(0);
      }
    } catch (err) {
      console.error("Error fetching balances:", err.message);
    }
  };

  useEffect(() => {
    console.log("🚨 [WalletContext] MOUNT - checking saved wallet...");
    const savedAddress = localStorage.getItem("walletAddress");
    const savedType = localStorage.getItem("walletType");
    console.log("🚨 [WalletContext] SAVED DATA:", { savedAddress, savedType });
    console.log("🚨 [WalletContext] window.ethereum available:", !!window.ethereum);
    console.log("🚨 [WalletContext] MetaMask detected:", window.ethereum?.isMetaMask);
    if (savedAddress && savedType) {
      console.log("🚨 [WalletContext] CONNECTING TO SAVED WALLET:", savedType);
      connectWallet(savedType);
    } else {
      console.log("🚨 [WalletContext] NO SAVED WALLET FOUND");
    }
  }, []);

  useEffect(() => {
    if (walletAddress) {
      localStorage.setItem("walletAddress", walletAddress);
      localStorage.setItem("walletType", walletType);
      localStorage.setItem("walletName", walletName);
    }
  }, [walletAddress, walletType, walletName]);

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        provider,
        signer, // ✅ expunem signer
        network,
        walletType,
        walletIcon,
        walletName,
        errorMessage,
        ethBalance,
        bitsBalance,
        connectWallet,
        disconnectWallet,
        connectViaMetamask: () => connectWallet(WALLET_TYPES.EVM),
        connectViaPhantom: () => connectWallet(WALLET_TYPES.SOLANA),
        connectViaWeb3Auth: () => connectWallet(WALLET_TYPES.TORUS),
        connectViaWalletConnect: () => connectWallet(WALLET_TYPES.WALLETCONNECT),
        connectViaCoinbase: () => connectWallet(WALLET_TYPES.COINBASE),
        connectViaRainbow: () => connectWallet(WALLET_TYPES.RAINBOW),
        // MetaMask popup handlers
        handleMetaMaskPopupContinue,
        handleMetaMaskPopupClose,
      }}
    >
      {children}
      <MetaMaskInfoPopup
        isOpen={showMetaMaskPopup}
        onContinue={handleMetaMaskPopupContinue}
        onClose={handleMetaMaskPopupClose}
      />
    </WalletContext.Provider>
  );
};
