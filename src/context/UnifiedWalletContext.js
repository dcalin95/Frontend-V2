import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount as useEvmAccount, useDisconnect as useEvmDisconnect, useBalance as useEvmBalance } from 'wagmi';
import { useWallet as useSolanaWalletAdapter, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const UnifiedWalletContext = createContext();

export const useWallet = () => useContext(UnifiedWalletContext);

export const UnifiedWalletProvider = ({ children }) => {
  // EVM State
  const { address: evmAddress, isConnected: isEvmConnected, connector, chainId } = useEvmAccount();
  const { disconnect: disconnectEvm } = useEvmDisconnect();
  const { data: evmBalanceData } = useEvmBalance({ address: evmAddress, watch: true });

  // Solana State
  const { publicKey, connected: isSolanaConnected, disconnect: disconnectSolana, wallet: solanaWallet } = useSolanaWalletAdapter();
  const { connection } = useConnection();
  const [solanaBalance, setSolanaBalance] = useState(0);

  // Unified State
  const [walletType, setWalletType] = useState(null); // "EVM" | "SOLANA" | null
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Determine active wallet type
  useEffect(() => {
    if (isEvmConnected && !isSolanaConnected) {
      setWalletType("EVM");
    } else if (isSolanaConnected && !isEvmConnected) {
      setWalletType("SOLANA");
    } else if (!isEvmConnected && !isSolanaConnected) {
      setWalletType(null);
    }
  }, [isEvmConnected, isSolanaConnected]);

  // Fetch Solana balance
  useEffect(() => {
    if (publicKey && connection) {
      const fetchSolanaBalance = async () => {
        try {
          const balance = await connection.getBalance(publicKey);
          setSolanaBalance((balance / LAMPORTS_PER_SOL).toFixed(4));
        } catch (error) {
          console.error("Error fetching Solana balance:", error);
          setSolanaBalance(0);
        }
      };
      fetchSolanaBalance();

      // Refresh every 10 seconds
      const interval = setInterval(fetchSolanaBalance, 10000);
      return () => clearInterval(interval);
    } else {
      setSolanaBalance(0);
    }
  }, [publicKey, connection]);

  // Unified getters
  const walletAddress = walletType === "EVM" 
    ? evmAddress 
    : walletType === "SOLANA" 
    ? publicKey?.toString() 
    : null;

  const isConnected = isEvmConnected || isSolanaConnected;

  const nativeBalance = walletType === "EVM"
    ? evmBalanceData?.formatted || "0.0000"
    : walletType === "SOLANA"
    ? solanaBalance
    : "0.0000";

  const nativeSymbol = walletType === "EVM"
    ? (chainId === 56 ? "BNB" 
      : chainId === 1 ? "ETH" 
      : chainId === 137 ? "MATIC" 
      : chainId === 42161 ? "ETH" // Arbitrum
      : chainId === 10 ? "ETH" // Optimism
      : chainId === 8453 ? "ETH" // Base
      : chainId === 43114 ? "AVAX" // Avalanche
      : "Native")
    : "SOL";

  const walletName = walletType === "EVM"
    ? connector?.name || "EVM Wallet"
    : walletType === "SOLANA"
    ? solanaWallet?.adapter?.name || "Solana Wallet"
    : null;

  // Unified actions
  const connectWallet = () => {
    setShowWalletModal(true);
  };

  const disconnectWallet = () => {
    if (walletType === "EVM") {
      disconnectEvm();
    } else if (walletType === "SOLANA") {
      disconnectSolana();
    }
    setWalletType(null);
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
    walletType,
    isConnected,
    walletAddress,
    walletName,
    
    // Balance
    nativeBalance,
    nativeSymbol,
    ethBalance: walletType === "EVM" ? nativeBalance : "0.0000", // Legacy compatibility
    bitsBalance: 0, // TODO: Implement BITS balance for both chains
    
    // Network
    network: walletType === "EVM" 
      ? getNetworkName(chainId)
      : "Solana",
    chainId: walletType === "EVM" ? chainId : null,
    
    // Actions
    connectWallet,
    disconnectWallet,
    
    // Modal control
    showWalletModal,
    setShowWalletModal,
    
    // Raw providers (for advanced usage)
    evmConnector: connector,
    solanaPublicKey: publicKey,
    solanaConnection: connection,
  };

  return (
    <UnifiedWalletContext.Provider value={value}>
      {children}
    </UnifiedWalletContext.Provider>
  );
};

export default UnifiedWalletContext;

