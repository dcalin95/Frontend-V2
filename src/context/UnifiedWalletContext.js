import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount as useEvmAccount, useDisconnect as useEvmDisconnect, useBalance as useEvmBalance, useReadContract, useConnect } from 'wagmi';
import { formatEther } from "viem";
import BitsABI from '../abi/BitsABI.js';
import { isInAppBrowser } from '../utils/walletBrowserDetection';
import { prepareForConnection, handleConnectionError } from '../utils/walletConnectionFix';

const BITS_TOKEN_ADDRESS = "0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe";

const UnifiedWalletContext = createContext();

export const useWallet = () => useContext(UnifiedWalletContext);

export const UnifiedWalletProvider = ({ children }) => {
  // EVM State
  const { address: evmAddress, isConnected: isEvmConnected, connector, chainId } = useEvmAccount();
  const { disconnect: disconnectEvm } = useEvmDisconnect();
  const { connect: connectEvm, connectAsync: connectEvmAsync, connectors, error: connectError } = useConnect();
  
  // 🔧 FIX: Clear pending connection state on mount
  useEffect(() => {
    const clearPendingConnections = async () => {
      try {
        // Clear wagmi cached connector
        if (typeof window !== 'undefined') {
          localStorage.removeItem('wagmi.store');
          localStorage.removeItem('wagmi.wallet');
          localStorage.removeItem('wagmi.connected');
          sessionStorage.removeItem('wagmi.connector');
        }
        
        // Clear MetaMask pending requests
        if (window.ethereum) {
          // Reset any pending MetaMask requests
          if (window.ethereum._metamask) {
            await window.ethereum._metamask.isUnlocked().catch(() => {});
          }
        }
      } catch (error) {
        console.warn("[UnifiedWallet] Error clearing pending connections:", error);
      }
    };
    
    clearPendingConnections();
  }, []);
  
  // 🔧 FIX: Handle connection errors and retry
  useEffect(() => {
    if (connectError) {
      console.error("[UnifiedWallet] Connection error:", connectError);
      
      // Clear error state after 3 seconds
      const timer = setTimeout(() => {
        // Force disconnect to clear state
        disconnectEvm();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [connectError, disconnectEvm]);
  
  // Auto-connect for In-App Browsers (MetaMask, Trust, etc.)
  useEffect(() => {
    if (isInAppBrowser() && !isEvmConnected && !connectError) {
      const injectedConnector = connectors.find((c) => c.id === 'injected');
      if (injectedConnector) {
        console.log("[UnifiedWallet] Auto-connecting to In-App Wallet...");
        if (connectEvmAsync) {
          connectEvmAsync({ connector: injectedConnector }).catch((err) => {
            console.warn("[UnifiedWallet] Auto-connect failed:", err);
          });
        } else {
          connectEvm({ connector: injectedConnector });
        }
      }
    }
  }, [connectors, isEvmConnected, connectEvm, connectError]);
  
  // Fetch Native Balance
  const { data: evmBalanceData, refetch: refetchNativeBalance } = useEvmBalance({ 
    address: evmAddress, 
    chainId: chainId,
    query: {
      enabled: !!evmAddress,
      refetchInterval: 5000,
    }
  });

  // Refetch balance on connection
  useEffect(() => {
    if (isEvmConnected) {
      refetchNativeBalance();
    }
  }, [isEvmConnected, refetchNativeBalance]);

  // BITS Token Balance (EVM)
  const { data: bitsRawBalance } = useReadContract({
    address: BITS_TOKEN_ADDRESS,
    abi: BitsABI,
    functionName: 'balanceOf',
    args: [evmAddress],
    query: {
      enabled: !!evmAddress,
      refetchInterval: 10000
    }
  });

  const [bitsBalance, setBitsBalance] = useState(0);

  useEffect(() => {
    if (bitsRawBalance) {
      const formatted = parseFloat(formatEther(bitsRawBalance)).toFixed(5);
      setBitsBalance(formatted);
    } else {
      setBitsBalance(0);
    }
  }, [bitsRawBalance]);

  // Unified State
  const [showWalletModal, setShowWalletModal] = useState(false);

  // 🔧 FIX: Better balance formatting (5 decimals)
  const getFormattedBalance = (data) => {
    if (!data?.value) return "0.0000";
    try {
      const val = parseFloat(formatEther(data.value));
      if (val === 0) return "0.0000";
      if (val < 0.00001) return "<0.00001";
      return val.toFixed(5); // Show 5 decimals (e.g. 0.00887)
    } catch (e) {
      return "0.0000";
    }
  };

  const nativeBalance = getFormattedBalance(evmBalanceData);

  const nativeSymbol = chainId === 56 ? "BNB" 
      : chainId === 1 ? "ETH" 
      : chainId === 137 ? "MATIC" 
      : chainId === 42161 ? "ETH"
      : chainId === 10 ? "ETH"
      : chainId === 8453 ? "ETH"
      : chainId === 43114 ? "AVAX"
      : evmBalanceData?.symbol || "ETH";

  const walletName = connector?.name || "EVM Wallet";

  // Actions
  const connectWallet = async () => {
    // 🔧 FIX: Prepare connection (clear cache if needed)
    await prepareForConnection();
    setShowWalletModal(true);
  };

  const disconnectWallet = () => {
    disconnectEvm();
  };

  // Get network name
  const getNetworkName = (chainId) => {
    switch(chainId) {
      case 1: return "Ethereum";
      case 56: return "BSC";
      case 137: return "Polygon";
      case 42161: return "Arbitrum";
      case 10: return "Optimism";
      case 8453: return "Base";
      case 43114: return "Avalanche";
      default: return "EVM";
    }
  };

  const value = {
    // Status
    walletType: "EVM",
    isConnected: isEvmConnected,
    walletAddress: evmAddress,
    walletName,
    
    // Balance
    nativeBalance,
    nativeSymbol,
    ethBalance: nativeBalance,
    bitsBalance,
    
    // Network
    network: getNetworkName(chainId),
    chainId,
    
    // Actions
    connectWallet,
    disconnectWallet,
    
    // Modal control
    showWalletModal,
    setShowWalletModal,
    
    // Raw providers
    evmConnector: connector,
  };

  return (
    <UnifiedWalletContext.Provider value={value}>
      {children}
    </UnifiedWalletContext.Provider>
  );
};

export default UnifiedWalletContext;

