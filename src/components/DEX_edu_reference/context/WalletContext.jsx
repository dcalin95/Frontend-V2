/**
 * WalletContext - Unified Wallet Management
 * Supports both EVM (Ethereum, BSC, Polygon, etc.) and Solana networks
 * Optimized in Sonnet style: clean, efficient, well-structured
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { WagmiProvider, useAccount, useDisconnect, useBalance, useSwitchChain, useReadContract, useWalletClient, useReconnect } from "wagmi";
import { useWallet as useSolanaWalletAdapter } from '@solana/wallet-adapter-react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWallet as useGlobalWallet } from "../../../context/WalletContext";
import { config } from "./wagmiConfig";
import { formatEther } from "viem";
import { providers } from "ethers";
import BitsABI from '../abi/BitsABI.js';
import { CONTRACT_MAP } from '../contract/contractMap';
import { forceFixPhantomHijack } from '../utils/walletFilter';
import { Connection, PublicKey } from '@solana/web3.js';
import { associateWallet } from '../utils/backend';

// ============================================================================
// Constants
// ============================================================================

export const WALLET_TYPES = {
  EVM: 'evm',
  SOLANA: 'solana',
};

const STORAGE_KEYS = {
  REMEMBER_WALLET: 'bits_remember_wallet',
  CONNECT_INTENT: 'wallet_connect_intent_at',
};

const BITS_TOKEN_ADDRESS = CONTRACT_MAP.BITS_TOKEN.address;
const CONNECT_INTENT_WINDOW_MS = 120000; // 2 minutes
const SOLANA_RPC_ENDPOINTS = [
  "https://mainnet.helius-rpc.com/?api-key=e09cf31a-1745-4314-847f-0999aa459705",
  "https://solana-mainnet.g.alchemy.com/v2/rc1AaZiEAYjKj4SOP3tuP",
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana"
];

const queryClient = new QueryClient();
const WalletContext = createContext();
const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
const EMPTY_WALLET_CONTEXT = Object.freeze({
  walletAddress: null,
  evmWalletAddress: null,
  solanaWalletAddress: null,
  isConnected: false,
  isEvmConnected: false,
  isSolanaConnected: false,
  walletType: null,
  signer: null,
  showWalletModal: false,
});

// ============================================================================
// Hook
// ============================================================================

export const useWallet = () => {
  const localWallet = useContext(WalletContext);
  const globalWallet = useGlobalWallet();
  return localWallet || globalWallet || EMPTY_WALLET_CONTEXT;
};

// ============================================================================
// Helper Functions
// ============================================================================

const clientToSigner = (client) => {
  if (!client?.account || !client?.chain || !client?.transport) return null;
  try {
    const { account, chain, transport } = client;
    const network = {
      chainId: chain.id,
      name: chain.name,
      ensAddress: chain.contracts?.ensRegistry?.address,
    };
    const provider = new providers.Web3Provider(transport, network);
    return provider.getSigner(account.address);
  } catch (err) {
    // Some wallet extensions (e.g. inpage.js) throw "args.method must be a non-empty string"
    // when the transport sends a malformed RPC request; avoid unhandled rejection and app break.
    if (isDev) console.warn("[WalletContext] clientToSigner failed (wallet/transport):", err?.message || err);
    return null;
  }
};

const getNetworkName = (chainId) => {
  const networks = {
    56: 'Binance Smart Chain',
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
    8453: 'Base',
    43114: 'Avalanche',
  };
  return networks[chainId] || `Chain ID: ${chainId}`;
};

const clearSolanaStorage = () => {
  Object.keys(localStorage).forEach(key => {
    if (key.toLowerCase().includes('solana') || key.toLowerCase().includes('phantom')) {
      localStorage.removeItem(key);
    }
  });
};

// ============================================================================
// Main Provider Component
// ============================================================================

const InnerWalletProvider = ({ children }) => {
  // Wagmi hooks
  const { address, isConnected, connector, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  // watch: false + refetchInterval 30s reduces load; watch: true requests every block and slowed Firefox.
  const { data: balanceData } = useBalance({ address, watch: false, refetchInterval: 30000 });
  const { switchChain } = useSwitchChain();
  const { reconnect } = useReconnect();
  const { data: walletClient } = useWalletClient({ chainId });
  
  // Solana hooks
  const { 
    publicKey: solanaPublicKey, 
    connected: isSolanaConnected, 
    wallet: selectedSolanaWallet,
    disconnect: disconnectSolana
  } = useSolanaWalletAdapter();

  // BITS token balance
  const { data: bitsRawBalance } = useReadContract({
    address: BITS_TOKEN_ADDRESS,
    abi: BitsABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
      refetchInterval: 15000
    }
  });

  // Refs
  const connectIntentRef = useRef({ at: 0 });
  const didRestoreSessionRef = useRef(false);

  // State: single source of truth for modal visibility, error, loading, and chain at open.
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletModalError, setWalletModalError] = useState(null);
  const [walletModalOpenChain, setWalletModalOpenChain] = useState(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [rememberWallet, setRememberWallet] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.REMEMBER_WALLET) === "true";
    } catch {
      return false;
    }
  });
  
  const [walletAddress, setWalletAddress] = useState(null);
  const [evmWalletAddress, setEvmWalletAddress] = useState(null);
  const [solanaWalletAddress, setSolanaWalletAddress] = useState(null);
  const [solanaWalletName, setSolanaWalletName] = useState(null);
  const [solanaWalletIcon, setSolanaWalletIcon] = useState(null);
  const [ethBalance, setEthBalance] = useState("0");
  const [solanaBalance, setSolanaBalance] = useState("0");
  const [nativeSymbol, setNativeSymbol] = useState("ETH");
  const [bitsBalance, setBitsBalance] = useState(0);
  const [walletType, setWalletType] = useState(null);
  const [network, setNetwork] = useState(null);
  const [walletIcon, setWalletIcon] = useState(null);
  const [walletName, setWalletName] = useState(null);

  // Memoized signer (guarded: clientToSigner can return null on transport/extension errors)
  const signer = useMemo(() => {
    if (!walletClient) return null;
    const s = clientToSigner(walletClient);
    return s ?? null;
  }, [walletClient]);

  // ============================================================================
  // Core Functions
  // ============================================================================

  const markConnectIntent = useCallback(() => {
    const at = Date.now();
    connectIntentRef.current.at = at;
    try {
      sessionStorage.setItem(STORAGE_KEYS.CONNECT_INTENT, String(at));
    } catch {}
    return at;
  }, []);

  const safeDisconnect = useCallback(async (shouldReload = true) => {
    try {
      const hasEvm = isConnected && address;
      const hasSol = isSolanaConnected && solanaPublicKey;
      
      if (!hasEvm && !hasSol) return;

      // Disconnect EVM
      if (hasEvm) {
        await disconnect().catch(() => {});
      }

      // Disconnect Solana
      if (hasSol) {
        await disconnectSolana().catch(() => {});
        
        if (window.solana?.isPhantom && window.solana.isConnected) {
          await window.solana.disconnect().catch(() => {});
        }
        
        clearSolanaStorage();
      }

      // Clear wagmi storage
      ['wagmi.connected', 'wagmi.store', 'wagmi.recentConnectorId'].forEach(key => {
        localStorage.removeItem(key);
      });
      sessionStorage.removeItem('wagmi.connector');

      if (shouldReload) {
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (e) {
      if (isDev) console.warn("[WalletContext] Disconnect error:", e);
    }
  }, [disconnect, disconnectSolana, isConnected, address, isSolanaConnected, solanaPublicKey]);

  const disconnectEvmWallet = useCallback(async () => {
    try {
      if (!isConnected && !address) return;

      await disconnect().catch(() => {});

      ['wagmi.connected', 'wagmi.store', 'wagmi.recentConnectorId'].forEach(key => {
        localStorage.removeItem(key);
      });
      sessionStorage.removeItem('wagmi.connector');

      setEvmWalletAddress(null);
      setEthBalance("0");

      if (isSolanaConnected && solanaPublicKey) {
        const addr = solanaPublicKey.toBase58();
        setWalletAddress(addr);
        setWalletType("SOLANA");
        setWalletName(selectedSolanaWallet?.adapter?.name || "Phantom");
        setWalletIcon(selectedSolanaWallet?.adapter?.icon || null);
        setNetwork("Solana Mainnet");
        setNativeSymbol("SOL");
      } else {
        setWalletAddress(null);
        setWalletType(null);
        setWalletName(null);
        setWalletIcon(null);
        setNetwork(null);
        setNativeSymbol("ETH");
      }
    } catch (e) {
      if (isDev) console.warn("[WalletContext] EVM disconnect error:", e);
    }
  }, [address, disconnect, isConnected, isSolanaConnected, selectedSolanaWallet, solanaPublicKey]);

  const disconnectSolanaWallet = useCallback(async () => {
    try {
      if (!isSolanaConnected && !solanaPublicKey) return;
      await disconnectSolana().catch(() => {});

      if (window.solana?.isPhantom && window.solana.isConnected) {
        await window.solana.disconnect().catch(() => {});
      }

      clearSolanaStorage();
      setSolanaWalletAddress(null);
      setSolanaWalletName(null);
      setSolanaWalletIcon(null);
      setSolanaBalance("0");

      if (!isConnected || !address) {
        setWalletAddress(null);
        setWalletType(null);
        setWalletName(null);
        setWalletIcon(null);
        setNetwork(null);
        setEthBalance("0");
        setNativeSymbol("ETH");
      }
    } catch (e) {
      if (isDev) console.warn("[WalletContext] Solana disconnect error:", e);
    }
  }, [address, disconnectSolana, isConnected, isSolanaConnected, solanaPublicKey]);

  const connectWallet = useCallback(async (selectedChain = "evm") => {
    try {
      const isSolana = selectedChain === "solana";
      setWalletModalOpenChain(selectedChain || 'evm');

      if (isSolana) {
        setWalletModalError(null);
        setShowWalletModal(true);
        return;
      }

      // Always open the modal on "Connect wallet" click, including account switching; no early return
      // so the /dex-edu/account button stays functional.
      forceFixPhantomHijack();
      
      // Clear pending requests and any previous modal error
      try {
        sessionStorage.removeItem('wallet_pending_request');
        sessionStorage.removeItem('wagmi.connector');
      } catch {}
      setWalletModalError(null);
      markConnectIntent();
      setShowWalletModal(true);
    } catch (err) {
      if (isDev) console.error("[WalletContext] Connect error:", err);
    }
  }, [isConnected, address, markConnectIntent]);

  const setRememberWalletEnabled = useCallback(async (enabled) => {
    const next = !!enabled;
    try {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_WALLET, next ? "true" : "false");
    } catch {}
    
    setRememberWallet(next);
    
    if (!next) {
      await disconnect().catch(() => {});
      await disconnectSolana().catch(() => {});
      ['wagmi.recentConnectorId', 'wagmi.store', 'wagmi.connected'].forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }, [disconnect, disconnectSolana]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Persist remember wallet setting
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_WALLET, rememberWallet ? "true" : "false");
    } catch {}
  }, [rememberWallet]);

  // Session restore - ONLY if remember wallet is ON
  useEffect(() => {
    if (!rememberWallet || didRestoreSessionRef.current) return;
    didRestoreSessionRef.current = true;

    // 🛑 Safety: never auto-reconnect unless user explicitly tried to connect recently.
    // This prevents wallets (ex: Trust) from popping up "by themselves" on page load.
    let intentAt = 0;
    try {
      intentAt = Number(sessionStorage.getItem(STORAGE_KEYS.CONNECT_INTENT) || "0") || 0;
    } catch {}
    const now = Date.now();
    const hasFreshIntent = intentAt > 0 && now - intentAt <= CONNECT_INTENT_WINDOW_MS;
    if (!hasFreshIntent) {
      // No recent user click → do not reconnect.
      return;
    }

    const hasStoredState = ['wagmi.store', 'wagmi.recentConnectorId'].some(key => {
      try {
        return !!localStorage.getItem(key);
      } catch {
        return false;
      }
    });

    if (hasStoredState) {
      if (isDev) console.log('[WalletContext] Restoring session...');
      setTimeout(() => reconnect().catch(() => {}), 250);
    }
  }, [rememberWallet, reconnect]);

  // Sync EVM/Solana state - SIMPLIFIED AND FIXED
  useEffect(() => {
    const evmActive = isConnected && address;
    const solanaActive = isSolanaConnected && solanaPublicKey;

    // Handle EVM connection - ALWAYS SYNC, NO BLOCKING
    if (evmActive) {
      setEvmWalletAddress(address);
      setWalletAddress(address);
      setWalletType("EVM");
      setWalletName(connector?.name || "Wallet");
      setNetwork(getNetworkName(chainId));
      
      // Associate wallet with user in backend (skipped when not logged in)
      associateWallet(address, 'EVM')
        .then((res) => { if (isDev && !res?.skipped) console.log('[WalletContext] Wallet associated with user'); })
        .catch(err => { if (isDev) console.warn('[WalletContext] Failed to associate wallet:', err); });
      
      // Close modal on successful connection; clear modal state
      setShowWalletModal(false);
      setWalletModalError(null);
      setIsConnectingWallet(false);
      
      // Clear connect intent
      connectIntentRef.current.at = 0;
      sessionStorage.removeItem(STORAGE_KEYS.CONNECT_INTENT);
    } else {
      setEvmWalletAddress(null);
    }

    // Handle Solana connection
    if (solanaActive) {
      if (isDev) console.log('[WalletContext] Solana connected:', solanaPublicKey.toBase58());
      const addr = solanaPublicKey.toBase58();
      setSolanaWalletAddress(addr);
      setSolanaWalletName(selectedSolanaWallet?.adapter?.name || "Phantom");
      setSolanaWalletIcon(selectedSolanaWallet?.adapter?.icon || null);

      if (!evmActive) {
        setWalletAddress(addr);
        setWalletType("SOLANA");
        setWalletName(selectedSolanaWallet?.adapter?.name || "Phantom");
        setWalletIcon(selectedSolanaWallet?.adapter?.icon || null);
        setNetwork("Solana Mainnet");
        setNativeSymbol("SOL");
      }

      // Associate wallet with user in backend (skipped when not logged in)
      associateWallet(addr, 'SOLANA')
        .then((res) => { if (isDev && !res?.skipped) console.log('[WalletContext] Solana wallet associated with user'); })
        .catch(err => { if (isDev) console.warn('[WalletContext] Failed to associate Solana wallet:', err); });

      // Close modal on successful connection
      setShowWalletModal(false);
      
      // Clear connect intent
      connectIntentRef.current.at = 0;
      sessionStorage.removeItem(STORAGE_KEYS.CONNECT_INTENT);
    } else {
      setSolanaWalletAddress(null);
      setSolanaWalletName(null);
      setSolanaWalletIcon(null);
      setSolanaBalance("0");
    }

    // No connection
    if (!evmActive && !solanaActive) {
      setWalletAddress(null);
      setWalletType(null);
      setWalletName(null);
      setWalletIcon(null);
      setNetwork(null);
      setEthBalance("0");
      setSolanaBalance("0");
      setNativeSymbol("ETH");
    }
  }, [isConnected, address, connector, chainId, isSolanaConnected, solanaPublicKey, selectedSolanaWallet]);

  // Sync EVM balance
  useEffect(() => {
    if (!isConnected || !address) {
      setEthBalance("0");
      return;
    }
    
    if (balanceData?.formatted) {
      const val = parseFloat(balanceData.formatted);
      setEthBalance(isNaN(val) ? "0.0000" : val.toFixed(4));
      setNativeSymbol(balanceData.symbol);
    }
  }, [balanceData, isConnected, address]);

  // Sync BITS balance
  useEffect(() => {
    if (bitsRawBalance) {
      const formattedBits = parseFloat(formatEther(bitsRawBalance)).toFixed(2);
      setBitsBalance(formattedBits);
    } else {
      setBitsBalance(0);
    }
  }, [bitsRawBalance]);

  // Fetch Solana balance
  useEffect(() => {
    if (!isSolanaConnected || !solanaPublicKey) return;

    let cancelled = false;

    const fetchBalance = async () => {
      if (cancelled) return;

      try {
        const pubKey = new PublicKey(solanaPublicKey.toBase58());

        for (const rpc of SOLANA_RPC_ENDPOINTS) {
          if (cancelled) break;

          try {
            const connection = new Connection(rpc, "confirmed");
            const balance = await Promise.race([
              connection.getBalance(pubKey),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
            ]);

            if (!cancelled) {
              const solBalance = (balance / 1e9).toFixed(4);
              setSolanaBalance(solBalance);
              if (!isConnected || !address) {
                setEthBalance(solBalance);
                setNativeSymbol("SOL");
                setWalletType("SOLANA");
              }
            }
            return;
          } catch (e) {
            console.warn(`[Solana] RPC ${rpc} failed:`, e.message);
          }
        }
      } catch (err) {
        console.error("[Solana] Balance fetch error:", err);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isSolanaConnected, solanaPublicKey, isConnected, address]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value = {
    // Properties
    walletAddress,
    evmWalletAddress,
    solanaWalletAddress,
    isConnected: !!(isConnected || isSolanaConnected),
    isEvmConnected: !!(isConnected && address),
    isSolanaConnected: !!(isSolanaConnected && solanaPublicKey),
    ethBalance,
    solanaBalance,
    nativeSymbol,
    bitsBalance,
    walletType,
    walletName,
    walletIcon,
    solanaWalletName,
    solanaWalletIcon,
    network,
    chainId,
    provider: signer?.provider || null,
    signer,
    connector,
    rememberWallet,
    showWalletModal,
    walletModalError,
    walletModalOpenChain,
    setWalletModalError,
    isConnectingWallet,
    setIsConnectingWallet,

    // Functions
    connectWallet,
    disconnectWallet: safeDisconnect,
    disconnectEvmWallet,
    disconnectSolanaWallet,
    setRememberWalletEnabled,
    setShowWalletModal,
    markConnectIntent,
    switchChain,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// ============================================================================
// Main Export
// ============================================================================

export const WalletProvider = ({ children }) => {
  return (
    // 🛑 Never auto-reconnect on mount (prevents Phantom/other wallets prompting on page load).
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <InnerWalletProvider>{children}</InnerWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default WalletContext;
