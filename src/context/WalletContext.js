import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { WagmiProvider, useAccount, useDisconnect, useBalance, useSwitchChain, useReadContract, useWalletClient, useReconnect } from "wagmi";
import { useWallet as useSolanaWalletAdapter } from '@solana/wallet-adapter-react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config, projectId } from "./wagmiConfig";
import { formatEther } from "viem";
import { providers } from "ethers";
import BitsABI from '../abi/BitsABI.js';
import { CONTRACT_MAP } from '../contract/contractMap';
import { logDetectedWallets, detectAllInjectedWallets, forceFixPhantomHijack } from '../utils/walletFilter';
import { Connection, PublicKey } from '@solana/web3.js';

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

const REMEMBER_WALLET_KEY = "bits_remember_wallet"; // "true" | "false"

// Adresa Contractului BITS Token (BSC Mainnet)
const BITS_TOKEN_ADDRESS = CONTRACT_MAP.BITS_TOKEN.address;

// ✅ IMPORTANT (CSP / WalletConnect):
// We intentionally DO NOT initialize Web3Modal/AppKit here.
// Some wallet UIs rely on embedded iframes which can be blocked by CSP.
// We rely on wagmi native connectors + our own modal UI instead.

const queryClient = new QueryClient();

// Create context
const WalletContext = createContext();

// Hook to use the context
export const useWallet = () => useContext(WalletContext);

// Internal component linking Wagmi to your app
const InnerWalletProvider = ({ children }) => {
  const { address, isConnected, connector, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  
  // 🟣 Solana Wallet Adapter hooks
  const { 
    publicKey: solanaPublicKey, 
    connected: isSolanaConnected, 
    wallet: selectedSolanaWallet,
    disconnect: disconnectSolana
  } = useSolanaWalletAdapter();

  const { data: balanceData, isError, isLoading } = useBalance({ 
    address,
    watch: true, // Watch for changes
  });
  const { switchChain } = useSwitchChain();
  const { reconnect } = useReconnect();
  const connectIntentRef = useRef({ at: 0 });
  const CONNECT_INTENT_WINDOW_MS = 120000;
  const CONNECT_INTENT_KEY = 'wallet_connect_intent_at';
  const didRestoreSessionRef = useRef(false);

  // 🔄 NO AUTO-RECONNECT ON MOUNT
  // Removed aggressive auto-reconnect to prevent MetaMask errors on refresh.
  // Wagmi will handle reconnection naturally if wagmi.store exists in localStorage.

  const markConnectIntent = useCallback(() => {
    const at = Date.now();
    connectIntentRef.current.at = at;
    try {
      sessionStorage.setItem(CONNECT_INTENT_KEY, String(at));
    } catch (e) {
      // ignore storage issues
    }
    return at;
  }, []);

  // 🎨 Modal Control State
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [rememberWallet, setRememberWallet] = useState(() => {
    try {
      // default OFF unless explicitly set to "true"
      return localStorage.getItem(REMEMBER_WALLET_KEY) === "true";
    } catch (_) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(REMEMBER_WALLET_KEY, rememberWallet ? "true" : "false");
    } catch (_) {}
  }, [rememberWallet]);

  // ✅ Session restore (user-controlled)
  // If Remember Wallet is ON and wagmi has a stored connector, try a single silent reconnect on mount.
  // This should NOT open popups; it only restores when the wallet already authorized the site.
  useEffect(() => {
    if (!rememberWallet) return;
    if (didRestoreSessionRef.current) return;
    didRestoreSessionRef.current = true;

    let hasStoredState = false;
    try {
      hasStoredState =
        !!localStorage.getItem('wagmi.store') ||
        !!localStorage.getItem('wagmi.recentConnectorId') ||
        !!sessionStorage.getItem('wagmi.connector');
    } catch (_) {
      hasStoredState = false;
    }
    if (!hasStoredState) return;

    // Delay a bit to allow injected providers to initialize (important on refresh)
    setTimeout(() => {
      reconnect().catch(() => {});
    }, 250);
  }, [rememberWallet, reconnect]);

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
  const safeDisconnect = useCallback(async (shouldReload = true) => {
    try {
      console.log("🔌 [WalletContext] Starting complete disconnect...");
      const hasEvm = isConnected && address;
      const hasSol = isSolanaConnected && solanaPublicKey;
      if (!hasEvm && !hasSol) {
        console.log("ℹ️ [WalletContext] No wallet connected. Skip reload.");
        return;
      }
      
      // 1. Disconnect EVM wallet (Wagmi)
      try {
        await disconnect();
        console.log("✅ [WalletContext] EVM wallet disconnected");
      } catch (e) {
        console.warn("[WalletContext] EVM disconnect error:", e);
      }
      
      // 2. Disconnect Solana wallet (if connected) - FORCE DISCONNECT
      try {
        if (typeof disconnectSolana === 'function') {
          await disconnectSolana().catch(() => {});
          console.log("✅ [WalletContext] Solana adapter disconnected");
        }
        
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
        localStorage.removeItem('wagmi.recentConnectorId');
        sessionStorage.removeItem('wagmi.connector');
        console.log("✅ [WalletContext] All connection states cleared");
      } catch (e) {
        console.warn("[WalletContext] State clear error:", e);
      }
      
      console.log("✅ [WalletContext] Complete disconnect finished");
      
      // Reload page to ensure clean state (ONLY if explicitly requested - default true for manual disconnect)
      if (shouldReload) {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (e) {
        console.warn("[WalletContext] Disconnect failed suppressed:", e);
    }
  }, [disconnect, disconnectSolana, isConnected, address, isSolanaConnected, solanaPublicKey]);

  const setRememberWalletEnabled = useCallback(async (enabled) => {
    const next = !!enabled;
    // Write immediately so a fast refresh doesn't lose the toggle state.
    try {
      localStorage.setItem(REMEMBER_WALLET_KEY, next ? "true" : "false");
    } catch (_) {}
    setRememberWallet(next);
    if (!next) {
      // Turning OFF persistence should immediately behave like manual-connect-only.
      // Call disconnect directly instead of using safeDisconnect to avoid circular dependency
      await disconnect();
      await disconnectSolana();
      try {
        localStorage.removeItem('wagmi.recentConnectorId');
        localStorage.removeItem('wagmi.store');
        localStorage.removeItem('wagmi.connected');
      } catch (_) {}
    }
  }, [disconnect, disconnectSolana]);

  // Error logging for BITS balance (only errors, not spam)
  useEffect(() => {
    if (bitsError && address) {
      console.error("❌ [WalletContext] BITS Read Error:", bitsError);
    }
  }, [bitsError, address]);
  
  // Compatibility states for legacy code
  const [walletAddress, setWalletAddress] = useState(null);
  const [ethBalance, setEthBalance] = useState("0");
  const [solanaBalance, setSolanaBalance] = useState("0");
  const [nativeSymbol, setNativeSymbol] = useState("ETH"); // Simbol dinamic (BNB, ETH)
  const [bitsBalance, setBitsBalance] = useState(0); // Placeholder for now
  const [walletType, setWalletType] = useState(null);
  const [network, setNetwork] = useState(null);
  const [walletIcon, setWalletIcon] = useState(null);
  const [walletName, setWalletName] = useState(null);

  // 🟣 Solana Balance Fetcher (SOL & USDC) - ULTRA AGGRESSIVE
  useEffect(() => {
    let cancelled = false;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    
    const fetchSolanaBalances = async () => {
      // 🚀 TRY MULTIPLE SOURCES: adapter OR direct window.solana
        const directPk = typeof window !== 'undefined' ? (window.phantom?.solana?.publicKey || window.solana?.publicKey) : null;
        const adapterPk = solanaPublicKey;
      const currentPk = adapterPk || directPk;
      
      const isConnectedViaAdapter = isSolanaConnected && adapterPk;
      const isConnectedViaDirect = typeof window !== 'undefined' && window.solana?.isConnected && directPk;
      const isAnyConnected = isConnectedViaAdapter || isConnectedViaDirect;
      
      console.log("🔍 [SolanaBalance] Check:", {
        adapterConnected: isSolanaConnected,
        adapterPk: adapterPk?.toBase58() || 'null',
        directConnected: isConnectedViaDirect,
        directPk: directPk?.toBase58?.() || directPk?.toString() || 'null',
        finalPk: currentPk?.toBase58?.() || currentPk?.toString() || 'null'
      });
      
      if (!isAnyConnected || !currentPk) {
        console.warn("⚠️ [SolanaBalance] NOT CONNECTED - skipping fetch");
          return;
        }

      try {
        const addrStr = currentPk.toBase58 ? currentPk.toBase58() : currentPk.toString();
        console.log("🟣 [SolanaBalance] Fetching balance for:", addrStr);
        
        // 🚀 MAINNET RPCs with Helius API key (premium, reliable)
        const rpcs = [
          "https://mainnet.helius-rpc.com/?api-key=e09cf31a-1745-4314-847f-0999aa459705", // Helius (primary)
          "https://solana-mainnet.g.alchemy.com/v2/rc1AaZiEAYjKj4SOP3tuP",               // Alchemy (fallback)
          "https://api.mainnet-beta.solana.com",                                         // Official Solana (fallback)
          "https://rpc.ankr.com/solana"                                                  // Ankr (fallback)
        ];
        
        const pubKey = new PublicKey(addrStr);
        
        for (let i = 0; i < rpcs.length && !cancelled; i++) {
          const rpc = rpcs[i];
          try {
            console.log(`🟣 [SolanaBalance] Trying RPC ${i + 1}/${rpcs.length}: ${rpc}`);
            
            const connection = new Connection(rpc, "confirmed");
            const solBalancePromise = connection.getBalance(pubKey);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 8000)
            );
            
            const solVal = await Promise.race([solBalancePromise, timeoutPromise]);
            const solBalance = solVal / 1e9;
            
            console.log(`✅ [SolanaBalance] SUCCESS: SOL=${solBalance.toFixed(4)}`);
            
            if (!cancelled) {
              updateInternalBalances(solBalance, 0);
              retryCount = 0;
            }
            return;
            
          } catch (e) {
            console.warn(`⚠️ [SolanaBalance] RPC ${rpc} failed:`, e.message);
          }
        }
        
        // If all methods failed
        if (!cancelled) {
          retryCount++;
          if (retryCount >= MAX_RETRIES) {
            console.error("❌ [SolanaBalance] All methods failed after max retries");
            retryCount = 0;
          }
        }
        
      } catch (err) {
        console.error("❌ [SolanaBalance] CRITICAL ERROR:", err);
      }
    };

    const updateInternalBalances = (sol, usdc) => {
      if (cancelled) return;
      
      setSolanaBalance(sol.toFixed(4));
      
      // Show USDC if user has USDC and very little SOL
      if (usdc > 0 && sol < 0.01) {
        setEthBalance(usdc.toFixed(2));
        setNativeSymbol("USDC");
      } else {
        setEthBalance(sol.toFixed(4));
        setNativeSymbol("SOL");
      }
      
      setWalletType("SOLANA");
    };

    // Initial fetch (immediate) - CHECK BOTH SOURCES
    const directPk = typeof window !== 'undefined' ? (window.phantom?.solana?.publicKey || window.solana?.publicKey) : null;
    const isConnectedViaDirect = typeof window !== 'undefined' && window.solana?.isConnected && directPk;
    
    if ((isSolanaConnected && solanaPublicKey) || isConnectedViaDirect) {
      console.log("🚀 [SolanaBalance] Initial fetch triggered");
      fetchSolanaBalances();
    }
    
    // Periodic refresh (every 10 seconds)
    const id = setInterval(() => {
      const directPkInterval = typeof window !== 'undefined' ? (window.phantom?.solana?.publicKey || window.solana?.publicKey) : null;
      const isConnectedViaDirectInterval = typeof window !== 'undefined' && window.solana?.isConnected && directPkInterval;
      
      if ((isSolanaConnected && solanaPublicKey) || isConnectedViaDirectInterval) {
    fetchSolanaBalances();
      }
    }, 10000);
    
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isSolanaConnected, solanaPublicKey, selectedSolanaWallet]); // Added selectedSolanaWallet to trigger on wallet change

  // 🔄 Automatic sync: Wagmi/Solana -> Local State (IMPROVED)
  useEffect(() => {
    const now = Date.now();
    const intentAt =
      Number(connectIntentRef.current.at || 0) ||
      Number(sessionStorage.getItem(CONNECT_INTENT_KEY) || 0);
    const userInitiated = Number.isFinite(intentAt) && intentAt > 0 && (now - intentAt) <= CONNECT_INTENT_WINDOW_MS;

    console.log("🔄 [WalletContext] Syncing state...", {
      isConnectedEVM: isConnected,
      addressEVM: address,
      isSolanaConnected,
      solanaPublicKey: solanaPublicKey?.toBase58() || 'NULL',
      selectedSolanaWallet: selectedSolanaWallet?.adapter?.name || 'NULL',
      userInitiated,
      rememberWallet
    });

    // 🎯 PRIORITY 1: SOLANA CONNECTION (Check this first to avoid EVM hijack/disconnect)
    // 🎯 PRIORITY LOGIC: EVM takes precedence over Solana
    const evmActive = isConnected && address;
    const solanaActive = isSolanaConnected && solanaPublicKey;
    
    // 🔥 IF BOTH CONNECTED: Disconnect Solana (EVM priority)
    if (evmActive && solanaActive) {
      console.warn("⚠️ [WalletContext] Both EVM and Solana connected! Prioritizing EVM, disconnecting Solana...");
      
      // Force disconnect Solana immediately
      (async () => {
        try {
          await disconnectSolana();
          console.log("✅ [WalletContext] Solana disconnected successfully");
        } catch (e) {
          console.warn("⚠️ [WalletContext] Solana disconnect error:", e);
        }
        
        // Also clear Solana state manually
        if (typeof window !== 'undefined' && window.solana) {
          try {
            await window.solana.disconnect();
          } catch (_) {}
        }
      })();
      
      // Clear Solana-related state immediately
      setSolanaBalance("0");
      setNativeSymbol("BNB"); // Reset to EVM default
      // Continue to EVM setup below
    }

    // 🎯 PRIORITY 1: EVM CONNECTION (highest priority)
    if (isConnected && address) {
      // 🛡️ SECURITY: If remember wallet is OFF and this wasn't a fresh user click, disconnect.
      if (!rememberWallet && !userInitiated) {
        console.warn("🛑 [WalletContext] EVM Auto-connect blocked (Remember wallet is OFF).");
        
        // Only disconnect if it's NOT a Phantom-EVM hijack situation we're already handling
        const isPhantomEVM = connector?.name?.toLowerCase().includes('phantom');
        if (!isPhantomEVM) {
          safeDisconnect(false); // Don't reload on auto-disconnect
          return;
        }
      }

      // 🛑 CRITICAL: Check for Phantom hijack on EVM side (SYNCHRONOUS check first)
      if (connector?.name?.toLowerCase().includes('phantom')) {
        console.warn("⚠️ [WalletContext] Phantom detected as EVM connector. This should not happen!");
        // Don't disconnect immediately - let user use it if they want
      }

      // Async check for Phantom hijack
      (async () => {
        try {
          const provider = await connector?.getProvider?.();
          if (provider?.isPhantom && !provider?.isMetaMask && !provider?.isTrust) {
            console.warn("⚠️ [WalletContext] Phantom EVM provider detected. Consider using Solana mode instead.");
            // Don't auto-disconnect - user might intentionally use Phantom for EVM
          }
        } catch (_) {
          // Ignore errors in provider detection
        }
      })();
      
      console.log("✅ [WalletContext] Detected EVM connection:", address);
      setWalletAddress(address);
      setWalletType("EVM"); // Always set to "EVM" for all EVM wallets
      setWalletName(connector?.name || "Wallet");
      
      if (userInitiated) {
        sessionStorage.setItem('wallet_just_connected', 'true');
        connectIntentRef.current.at = 0;
        sessionStorage.removeItem(CONNECT_INTENT_KEY);
      }
      
      // Set wallet icon based on connector
      if (connector?.name?.toLowerCase().includes("metamask")) {
        setWalletIcon("https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg");
      } else if (connector?.name?.toLowerCase().includes("walletconnect")) {
        setWalletIcon("https://docs.walletconnect.com/img/walletconnect-logo.png");
      } else if (connector?.name?.toLowerCase().includes("coinbase")) {
        setWalletIcon("https://www.coinbase.com/img/favicon/favicon-32x32.png");
      } else if (connector?.name?.toLowerCase().includes("trust")) {
        setWalletIcon("https://trustwallet.com/assets/images/favicon.png");
      } else {
        setWalletIcon(null);
      }

      // Set network name based on chainId
      if (chainId === 56) {
        setNetwork("Binance Smart Chain");
      } else if (chainId === 1) {
        setNetwork("Ethereum");
      } else if (chainId === 137) {
        setNetwork("Polygon");
      } else if (chainId === 42161) {
        setNetwork("Arbitrum");
      } else if (chainId === 10) {
        setNetwork("Optimism");
      } else if (chainId === 8453) {
        setNetwork("Base");
      } else if (chainId === 43114) {
        setNetwork("Avalanche");
      } else {
        setNetwork(`Chain ID: ${chainId}`);
      }
      return;
    }
    
    // 🎯 PRIORITY 2: SOLANA CONNECTION (only if EVM is NOT connected)
    if (isSolanaConnected && solanaPublicKey) {
      const addr = solanaPublicKey.toBase58();
      console.log("✅ [WalletContext] Detected Solana connection:", addr);
      
      setWalletAddress(addr);
      setWalletType("SOLANA");
      setWalletName(selectedSolanaWallet?.adapter?.name || "Phantom");
      setWalletIcon(selectedSolanaWallet?.adapter?.icon || null);
      setNetwork("Solana Mainnet");
      setNativeSymbol("SOL");

      if (userInitiated) {
        sessionStorage.setItem('wallet_just_connected', 'true');
        connectIntentRef.current.at = 0;
        sessionStorage.removeItem(CONNECT_INTENT_KEY);
      }
      return;
    }

    // 🎯 PRIORITY 3: DISCONNECTED (Only if both are false)
    if (!isConnected && !isSolanaConnected) {
      console.log("🔌 [WalletContext] No connection detected - clearing state");
      setWalletAddress(null);
      setWalletType(null);
      setWalletName(null);
      setWalletIcon(null);
      setNetwork(null);
      setEthBalance("0");
      setSolanaBalance("0");
      setNativeSymbol("ETH");
    }
  }, [isConnected, address, connector, chainId, isSolanaConnected, solanaPublicKey, selectedSolanaWallet, disconnect, rememberWallet]);

  // Balance Sync (Native Token - BNB/ETH)
  useEffect(() => {
    // 🛑 CRITICAL: If we are on Solana, DO NOT let Wagmi (EVM) overwrite the balance!
    if (isSolanaConnected || walletType === "Solana") {
      return;
    }

    if (balanceData?.formatted) {
        const val = parseFloat(balanceData.formatted);
        setEthBalance(isNaN(val) ? "0.0000" : val.toFixed(4));
        setNativeSymbol(balanceData.symbol);
    }
  }, [balanceData, isSolanaConnected, walletType]);

  // Balance Sync (BITS Token)
  useEffect(() => {
    if (bitsRawBalance) {
      const formattedBits = parseFloat(formatEther(bitsRawBalance)).toFixed(2);
      setBitsBalance(formattedBits);
    } else {
      setBitsBalance(0);
    }
  }, [bitsRawBalance]);

  // 🚀 SIMPLE FUNCTION: Opens Correct Modal Based on Chain Type
  // @param {string} selectedChain - EXPLICIT chain: "evm" or "solana"
  const connectWallet = async (selectedChain = "evm") => {
    try {
      // 🎯 SIMPLE: Check if Solana or EVM
      const isSolana = selectedChain === "solana";
      if (isSolana) {
        setShowWalletModal(true);
        return;
      }

      // Dacă deja e conectat pe EVM, nu deschide din nou modalul
      if (isConnected && address) {
        return;
      }
      
      // 🛑 STEP 1: FIX PHANTOM HIJACK (if present)
      forceFixPhantomHijack();
      
      // 🛑 STEP 2: CLEAR ALL PENDING REQUESTS
      try {
        sessionStorage.removeItem('wallet_pending_request');
        sessionStorage.removeItem('wagmi.connector');
        
        if (window.ethereum) {
          try {
            await window.ethereum.request({ 
              method: 'wallet_requestPermissions',
              params: [{ eth_accounts: {} }]
            }).catch(() => {});
          } catch (e) {
            // Ignore - just clearing
          }
        }
      } catch (clearErr) {
        console.warn('⚠️ [WalletContext] Error clearing pending requests:', clearErr);
      }
      
      // 🎯 DETECT AND SET PREFERRED EVM PROVIDER
      if (window.ethereum) {
        const detected = detectAllInjectedWallets();
        const evmList = detected.evm || [];
        const preferred =
          evmList.find(w => w.name?.toLowerCase().includes('metamask')) ||
          evmList.find(w => w.name?.toLowerCase().includes('trust')) ||
          evmList.find(w => w.name?.toLowerCase().includes('coinbase')) ||
          evmList[0];

        if (preferred?.provider) {
          window.ethereum = preferred.provider;
        } else if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
          const metamaskProvider = window.ethereum.providers.find(p => p.isMetaMask && !p.isPhantom);
          const trustProvider = window.ethereum.providers.find(p => p.isTrust);
          const coinbaseProvider = window.ethereum.providers.find(p => p.isCoinbaseWallet);
          
          if (metamaskProvider) {
            window.ethereum = metamaskProvider;
          } else if (trustProvider) {
            window.ethereum = trustProvider;
          } else if (coinbaseProvider) {
            window.ethereum = coinbaseProvider;
          }
        } else if (window.ethereum.isPhantom && !window.ethereum.isMetaMask) {
          console.warn('🛑 [WalletContext] Phantom EVM hijack detected. Install MetaMask or disable Phantom EVM Support.');
        }
      }
      
      // Record explicit user intent so any resulting connection is allowed
      markConnectIntent();
      // ✅ Open our own unified modal (non-iframe) instead of Web3Modal/AppKit
      setShowWalletModal(true);
    } catch (err) {
      console.error("❌ [WalletContext] Failed to open wallet modal:", err);
    }
  };

  // Expose simple helpers to window for UI components (Copilot, etc.)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.openUnifiedWalletModal = () => setShowWalletModal(true);
      window.disconnectWallet = safeDisconnect;
      window.connectWalletPreferred = connectWallet;
    }
    // ✅ No dependencies - only set once on mount to avoid infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // NOTE: We intentionally do NOT disconnect on mount anymore.
  // The connected wallet should persist across refresh/restart until the user disconnects manually.

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
        rememberWallet,

        // Functions
        connectWallet,
        markConnectIntent,
        disconnectWallet: safeDisconnect, // ✅ Use safe wrapper
        hardReset, // 🧨 Nuclear option for stuck connections
        setRememberWalletEnabled,
        
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
    </WalletContext.Provider>
  );
};

export const WalletProvider = ({ children }) => {
  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <InnerWalletProvider>
          {children}
        </InnerWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default WalletContext;

