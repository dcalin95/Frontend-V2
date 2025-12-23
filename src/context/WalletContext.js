import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { createWeb3Modal, useWeb3Modal } from "@web3modal/wagmi/react";
import { WagmiProvider, useAccount, useDisconnect, useBalance, useSwitchChain, useReadContract, useWalletClient } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config, projectId } from "./wagmiConfig";
import { formatEther } from "viem";
import { providers } from "ethers";
import BitsABI from '../abi/BitsABI.js';
import { CONTRACT_MAP } from '../contract/contractMap';
import { logDetectedWallets } from '../utils/walletFilter';

// 🔑 Wallet Types Constants
export const WALLET_TYPES = {
  EVM: 'evm',
  METAMASK: 'metamask',
  WALLETCONNECT: 'walletconnect',
  COINBASE: 'coinbase',
  RAINBOW: 'rainbow',
  SOLANA: 'solana',
  PHANTOM: 'phantom'
};

// Adresa Contractului BITS Token (BSC Mainnet)
const BITS_TOKEN_ADDRESS = CONTRACT_MAP.BITS_TOKEN.address;

// 🎨 Web3Modal (AppKit) Initialization - DARK THEME
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#14F195',
    '--w3m-border-radius-master': '12px',
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-z-index': 99999
  }
});

const queryClient = new QueryClient();

// Create context
const WalletContext = createContext();

// Hook to use the context
export const useWallet = () => useContext(WalletContext);

// Internal component linking Wagmi to your app
const InnerWalletProvider = ({ children }) => {
  const { address, isConnected, connector, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balanceData, isError, isLoading } = useBalance({ 
    address,
    watch: true, // Watch for changes
  });
  const { switchChain } = useSwitchChain();
  const { open } = useWeb3Modal();

  // 🎨 Modal Control State
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Debug logs
  console.log("🔍 [Wallet Debug] Address:", address);
  console.log("🔍 [Wallet Debug] Chain ID:", chainId);
  console.log("🔍 [Wallet Debug] IsConnected:", isConnected);
  console.log("🔍 [Wallet Debug] Connector:", connector?.name);
  console.log("🔍 [Wallet Debug] Balance Loading:", isLoading);
  console.log("🔍 [Wallet Debug] Balance Error:", isError);

  // Reading BITS Token Balance (Wagmi v2)
  const { data: bitsRawBalance, error: bitsError } = useReadContract({
    address: BITS_TOKEN_ADDRESS,
    abi: BitsABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
      refetchInterval: 15000
    }
  });

  // 🚀 Hook to convert WalletClient to Ethers Signer
  function clientToSigner(client) {
    if (!client || !client.account || !client.chain || !client.transport) {
      console.warn("⚠️ [clientToSigner] Invalid client:", client);
      return null;
    }
    const { account, chain, transport } = client;
    const network = {
      chainId: chain.id,
      name: chain.name,
      ensAddress: chain.contracts?.ensRegistry?.address,
    };
    const provider = new providers.Web3Provider(transport, network);
    const signer = provider.getSigner(account.address);
    return signer;
  }

  // 🚀 Use Wallet Client to generate Signer
  const { data: walletClient } = useWalletClient({ chainId });

  const signer = useMemo(() => {
    if (!walletClient) return null;
    return clientToSigner(walletClient);
  }, [walletClient]);

  // Safe Disconnect Wrapper (defined early to be used in useEffect)
  // Disconnects BOTH EVM and Solana wallets completely
  const safeDisconnect = useCallback(async () => {
    try {
      console.log("🔌 [WalletContext] Starting complete disconnect...");
      
      // 1. Disconnect EVM wallet (Wagmi)
      try {
        await disconnect();
        console.log("✅ [WalletContext] EVM wallet disconnected");
      } catch (e) {
        console.warn("[WalletContext] EVM disconnect error:", e);
      }
      
      // 2. Disconnect Solana wallet (if connected) - FORCE DISCONNECT
      try {
        // Try to disconnect via window.solana if available (Phantom)
        if (typeof window !== 'undefined' && window.solana) {
          try {
            if (window.solana.isPhantom && window.solana.isConnected) {
              await window.solana.disconnect();
              console.log("✅ [WalletContext] Phantom wallet disconnected via window.solana");
            }
          } catch (solanaErr) {
            console.warn("[WalletContext] Phantom disconnect error:", solanaErr);
          }
        }
        
        // Also try window.phantom if it exists
        if (typeof window !== 'undefined' && window.phantom?.solana) {
          try {
            if (window.phantom.solana.isConnected) {
              await window.phantom.solana.disconnect();
              console.log("✅ [WalletContext] Phantom wallet disconnected via window.phantom");
            }
          } catch (phantomErr) {
            console.warn("[WalletContext] Phantom (window.phantom) disconnect error:", phantomErr);
          }
        }
        
        // Clear ALL Solana-related localStorage keys
        Object.keys(localStorage).forEach(key => {
          if (key.toLowerCase().includes('solana') || key.toLowerCase().includes('phantom')) {
            localStorage.removeItem(key);
            console.log(`🗑️ [WalletContext] Removed localStorage key: ${key}`);
          }
        });
      } catch (e) {
        console.warn("[WalletContext] Solana disconnect error:", e);
      }
      
      // 3. Clear all connection states
      try {
        localStorage.removeItem('wagmi.connected');
        localStorage.removeItem('wagmi.store');
        sessionStorage.removeItem('wagmi.connector');
        console.log("✅ [WalletContext] All connection states cleared");
      } catch (e) {
        console.warn("[WalletContext] State clear error:", e);
      }
      
      console.log("✅ [WalletContext] Complete disconnect finished");
    } catch (e) {
        console.warn("[WalletContext] Disconnect failed suppressed:", e);
    }
  }, [disconnect]);

  // Debug logs for BITS balance
  useEffect(() => {
    if (address) {
       console.log("🔍 [WalletContext] Reading BITS from:", BITS_TOKEN_ADDRESS);
       console.log("🔍 [WalletContext] User address:", address);
       console.log("🔍 [WalletContext] Raw BITS data:", bitsRawBalance);
       if (bitsError) console.error("❌ [WalletContext] BITS Read Error:", bitsError);
    }
  }, [bitsRawBalance, bitsError, address]);
  
  // Compatibility states for legacy code
  const [walletAddress, setWalletAddress] = useState(null);
  const [ethBalance, setEthBalance] = useState("0");
  const [nativeSymbol, setNativeSymbol] = useState("ETH"); // Simbol dinamic (BNB, ETH)
  const [bitsBalance, setBitsBalance] = useState(0); // Placeholder for now
  const [walletType, setWalletType] = useState(null);
  const [network, setNetwork] = useState(null);
  const [walletIcon, setWalletIcon] = useState(null);
  const [walletName, setWalletName] = useState(null);

  // Automatic sync: Wagmi -> Local State
  useEffect(() => {
    // Log detected wallets on mount for debugging
    if (!isConnected && !address) {
      logDetectedWallets();
    }
    
    if (isConnected && address) {
      // 🛑 CRITICAL: Filter out Phantom from EVM connections ONLY
      // Phantom injects window.ethereum but it's a Solana wallet, not EVM
      // Only check this for EVM connections (Wagmi), not for Solana connections
      if (connector?.id === 'injected' && window.ethereum?.isPhantom) {
        // Check if this is actually an EVM connection attempt (not Solana)
        // Phantom should only be used via window.solana for Solana, not window.ethereum for EVM
        console.warn("⚠️ [ModernWallet] Phantom detected as EVM connector - this is wrong, disconnecting");
        console.warn("💡 [ModernWallet] Use Phantom via Solana network, not EVM");
        console.warn("💡 [ModernWallet] This should not happen if walletFilter is working correctly");
        safeDisconnect();
        return;
      }
      
      console.log("✅ [ModernWallet] Connected:", address);
      console.log("✅ [ModernWallet] Chain ID:", chainId);
      console.log("✅ [ModernWallet] Connector:", connector?.name);
      setWalletAddress(address);
      setWalletType(connector?.name || "WalletConnect");
      setWalletName(connector?.name || "Wallet");
      
      // Mark that we just connected (for auto-opening wallet box)
      sessionStorage.setItem('wallet_just_connected', 'true');
      
      // Set icon (simple fallback)
      if (connector?.name?.toLowerCase().includes("metamask")) {
        setWalletIcon("https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg");
      } else if (connector?.name?.toLowerCase().includes("walletconnect")) {
        setWalletIcon("https://docs.walletconnect.com/img/walletconnect-logo.png");
      } else {
        setWalletIcon(null);
      }

      // Set network (simplified - no auto-switch here to avoid errors)
      if (chainId === 56) {
        setNetwork("Binance Smart Chain");
      } else if (chainId === 1) {
        setNetwork("Ethereum");
      } else {
        setNetwork(`Chain ID: ${chainId}`);
      }

    } else {
      setWalletAddress(null);
      setWalletType(null);
      setWalletName(null);
      setNetwork(null);
      setEthBalance("0");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, connector, chainId, safeDisconnect]);

  // Balance Sync (Native Token - BNB/ETH)
  useEffect(() => {
    console.log("🔍 [Balance Debug] balanceData object:", balanceData);
    if (balanceData) {
      console.log("💰 [Balance Debug] Formatted:", balanceData.formatted);
      console.log("💰 [Balance Debug] Symbol:", balanceData.symbol);
      console.log("💰 [Balance Debug] Value (raw):", balanceData.value);
      if (balanceData.formatted) {
        const val = parseFloat(balanceData.formatted);
        console.log("✅ [Balance Debug] Parsed float:", val);
        setEthBalance(isNaN(val) ? "0.0000" : val.toFixed(4));
        setNativeSymbol(balanceData.symbol);
      } else {
        console.warn("⚠️ [Balance Debug] formatted is undefined/null");
      }
    } else {
      console.warn("⚠️ [Balance Debug] balanceData is null/undefined");
    }
  }, [balanceData]);

  // Balance Sync (BITS Token)
  useEffect(() => {
    if (bitsRawBalance) {
      const formattedBits = parseFloat(formatEther(bitsRawBalance)).toFixed(2);
      setBitsBalance(formattedBits);
    } else {
      setBitsBalance(0);
    }
  }, [bitsRawBalance]);

  // 🚀 Magic Function: Opens AppKit Modal
  // Replaces all legacy connection functions
  const connectWallet = async () => {
    try {
      await open();
    } catch (err) {
      console.error("Failed to open Web3Modal", err);
    }
  };

  // Compatibility functions (mapped to connectWallet)
  const connectViaMetamask = connectWallet;
  const connectViaPhantom = connectWallet;
  const connectViaWeb3Auth = connectWallet;
  const connectViaWalletConnect = connectWallet;
  const connectViaCoinbase = connectWallet;
  const connectViaRainbow = connectWallet;

  // 🧨 HARD RESET (Nuclear Option for stuck connections) - COMPLETE DISCONNECT
  const hardReset = async () => {
    console.warn("🧨 [WalletContext] EXECUTING HARD RESET - COMPLETE DISCONNECT...");
    
    // 1. Disconnect EVM
    await safeDisconnect();
    
    // 2. Force disconnect Solana/Phantom COMPLETELY
    if (typeof window !== 'undefined') {
      // Disconnect Phantom directly via window.solana
      if (window.solana?.isPhantom) {
        try {
          if (window.solana.isConnected) {
            await window.solana.disconnect();
            console.log("✅ [HardReset] Phantom disconnected via window.solana");
          }
        } catch (e) {
          console.warn("[HardReset] Phantom (window.solana) disconnect error:", e);
        }
      }
      
      // Disconnect Phantom via window.phantom
      if (window.phantom?.solana) {
        try {
          if (window.phantom.solana.isConnected) {
            await window.phantom.solana.disconnect();
            console.log("✅ [HardReset] Phantom disconnected via window.phantom");
          }
        } catch (e) {
          console.warn("[HardReset] Phantom (window.phantom) disconnect error:", e);
        }
      }
      
      // 3. Clear ALL storage - NO RESTORE (complete clean)
      localStorage.clear();
      sessionStorage.clear();
      
      // 4. Clear IndexedDB for Solana/Phantom
      if (window.indexedDB) {
        try {
          const dbs = await window.indexedDB.databases();
          dbs.forEach(db => {
            if (db.name?.toLowerCase().includes('solana') || 
                db.name?.toLowerCase().includes('phantom') ||
                db.name?.toLowerCase().includes('wallet')) {
              window.indexedDB.deleteDatabase(db.name);
              console.log(`🗑️ [HardReset] Deleted IndexedDB: ${db.name}`);
            }
          });
        } catch (e) {
          console.warn("[HardReset] IndexedDB clear error:", e);
        }
      }
      
      // 5. Reload page to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  // 🔧 Prevent auto-connect on mount - clear stale connections
  useEffect(() => {
    const preventAutoConnect = async () => {
      try {
        console.log('🔍 [WalletContext] Initializing with clean state...');
        
        // 🛑 CRITICAL: Always disconnect on mount to prevent any auto-connect
        // This ensures the site is 100% disconnected until user clicks "Connect"
        if (isConnected) {
          console.log('🧹 [WalletContext] Disconnecting auto-connected wallet on mount');
          await disconnect();
        }
        
        // Clear all session/local flags
        localStorage.removeItem('wagmi.recentConnectorId');
        localStorage.removeItem('wagmi.store');
        localStorage.removeItem('wagmi.connected');
        sessionStorage.removeItem('wagmi.connector');
        sessionStorage.removeItem('wallet_just_connected');
        
        console.log('✅ [WalletContext] Fresh state ready');
      } catch (error) {
        console.warn('[WalletContext] Error ensuring clean state:', error);
      }
    };
    
    preventAutoConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONLY once on mount

  return (
    <WalletContext.Provider
      value={{
        // Properties
        walletAddress,
        isConnected,
        ethBalance,
        nativeSymbol, // Exportăm simbolul
        bitsBalance,
        walletType,
        walletName,
        walletIcon,
        network,
        chainId, // ✅ Expose chainId for network detection
        provider: signer?.provider || null, // ✅ Expose ethers provider, not connector
        signer, // Adapter for ethers.js signer
        connector, // ✅ Expose connector separately (read-only)

        // Functions
        connectWallet,
        disconnectWallet: safeDisconnect, // ✅ Use safe wrapper
        hardReset, // 🧨 Nuclear option for stuck connections
        
        // Legacy Functions (Mapped)
        connectViaMetamask,
        connectViaPhantom,
        connectViaWeb3Auth,
        connectViaWalletConnect,
        connectViaCoinbase,
        connectViaRainbow,

        // New Utility Functions
        switchNetwork: (id) => switchChain({ chainId: id }),

        // Modal Control
        showWalletModal,
        setShowWalletModal
      }}
    >
      {children}
      {/* Hidden button to trigger programmatic modal open */}
      <div style={{ display: 'none' }}>
        <w3m-button />
      </div>
    </WalletContext.Provider>
  );
};

export const WalletProvider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <InnerWalletProvider>
          {children}
        </InnerWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default WalletContext;
