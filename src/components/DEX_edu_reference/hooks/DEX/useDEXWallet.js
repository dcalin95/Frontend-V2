/**
 * useDEXWallet - Custom Hook for Wallet Connection in DEX
 * 
 * DEX-specialized hook that manages wallet connection
 * with robust error handling and support for multiple wallets (MetaMask, WalletConnect, etc.).
 * Inspired by the Oxium DEX implementation.
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from "../../context/WalletContext.jsx";
import { useConnect } from 'wagmi';
import { prepareForConnection, handleConnectionError } from '../../utils/walletConnectionFix';
import { filterEVMConnectors } from '../../utils/walletFilter.js';

/**
 * Custom hook for wallet connection in DEX.
 * @returns {Object} { walletAddress, isConnected, connectWallet, disconnectWallet, error, isLoading, showModal, setShowModal, availableWallets }
 */
export function useDEXWallet() {
  const { 
    evmWalletAddress,
    isConnected, 
    isEvmConnected,
    connectWallet: connectWalletOriginal, 
    disconnectWallet: disconnectWalletOriginal,
    disconnectEvmWallet,
    showWalletModal,
    setShowWalletModal,
    setRememberWalletEnabled
  } = useWallet();

  const { connectors, connect } = useConnect();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedConnector, setSelectedConnector] = useState(null);

  /**
   * Check if wallets are available (MetaMask, WalletConnect, etc.).
   */
  const checkWalletsAvailable = useCallback(() => {
    if (typeof window === 'undefined') {
      return { available: false, reason: 'no_window', wallets: [] };
    }

    const availableWallets = [];
    const eth = window.ethereum;
    const injectedProviders = eth && Array.isArray(eth.providers) ? eth.providers : (eth ? [eth] : []);

    const hasMetaMask = injectedProviders.some(p => p?.isMetaMask && !p?.isPhantom);
    const hasTrust = injectedProviders.some(p => p?.isTrust && !p?.isPhantom);
    const hasCoinbase = injectedProviders.some(p => p?.isCoinbaseWallet && !p?.isPhantom);

    // Check MetaMask.
    if (hasMetaMask) {
      availableWallets.push({ 
        name: 'MetaMask', 
        type: 'injected', 
        id: 'metamask',
        installed: true 
      });
    }

    // Check Trust Wallet.
    if (hasTrust) {
      availableWallets.push({ 
        name: 'Trust Wallet', 
        type: 'injected', 
        id: 'trust',
        installed: true 
      });
    }

    // Check Coinbase Wallet.
    if (hasCoinbase) {
      availableWallets.push({ 
        name: 'Coinbase Wallet', 
        type: 'injected', 
        id: 'coinbase',
        installed: true 
      });
    }

    // Check WalletConnect if it exists in connectors.
    const walletConnect = connectors?.find(c => 
      c.id === 'walletConnect' || c.name?.toLowerCase().includes('walletconnect')
    );
    if (walletConnect) {
      availableWallets.push({ 
        name: 'WalletConnect', 
        type: 'walletconnect', 
        id: 'walletconnect',
        installed: true,
        connector: walletConnect
      });
    }

    // Check other available connectors, but keep the list strictly EVM.
    filterEVMConnectors(connectors || []).forEach(connector => {
      if (!availableWallets.find(w => w.id === connector.id)) {
        availableWallets.push({
          name: connector.name || 'Unknown Wallet',
          type: connector.type || 'unknown',
          id: connector.id,
          installed: connector.ready || false,
          connector: connector
        });
      }
    });

    if (availableWallets.length === 0) {
      return { 
        available: false, 
        reason: 'no_wallets',
        message: 'No wallet detected. Please install MetaMask, Trust Wallet or another compatible wallet.',
        wallets: []
      };
    }

    return { available: true, wallets: availableWallets };
  }, [connectors]);

  /**
   * Open the wallet selection modal, Oxium-style.
   */
  const openWalletModal = useCallback(() => {
    const checkResult = checkWalletsAvailable();
    if (!checkResult.available) {
      setError(checkResult.message || 'No wallets available');
      // Could open a wallet-install modal here if needed.
      return;
    }
    setShowWalletModal(true);
    setError(null);
  }, [checkWalletsAvailable, setShowWalletModal]);

  /**
   * Connect wallet with a specific connector, used internally or from the modal.
   * UnifiedWalletModal handles the effective connection, but this function can be used
   * for direct connection when a single wallet is available.
   */
  const connectWalletWithConnector = useCallback(async (connector) => {
    if (!connector) {
      setError('Connector not available');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSelectedConnector(connector);

      // Prepare the connection, clearing cache if needed.
      await prepareForConnection();

      // Check whether the connector is ready.
      if (!connector.ready && connector.type === 'injected') {
        if (!window.ethereum) {
          throw new Error(`${connector.name} is not installed. Please install the extension.`);
        }
      }

      // Try connecting with wagmi useConnect.
      try {
        await connect({ connector });
        setShowWalletModal(false);
        setError(null);
        setRetryCount(0);
        setIsLoading(false);
        return true;
      } catch (err) {
        // Handle the error.
        const errorInfo = await handleConnectionError(err);
        
        if (!errorInfo.retry) {
          throw err; // No retry for user rejection.
        }

        // Retry logic (max 2 retries)
        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
          console.log(`[DEX Wallet] Retry ${retryCount + 1}/2: ${errorInfo.reason}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return connectWalletWithConnector(connector);
        }

        throw err;
      }
    } catch (err) {
      console.error('[DEX Wallet] Connection error:', err);
      
      let userMessage = 'Error connecting to wallet';
      
      if (err?.message) {
        const errorMsg = err.message.toLowerCase();
        
        if (errorMsg.includes('user rejected') || errorMsg.includes('user denied')) {
          userMessage = 'Connection was rejected';
          setShowWalletModal(false);
        } else if (errorMsg.includes('already pending')) {
          userMessage = 'A connection request is already pending. Please wait or refresh the page.';
        } else if (errorMsg.includes('timeout')) {
          userMessage = 'Connection expired. Please try again.';
        } else if (errorMsg.includes('not installed')) {
          userMessage = err.message;
        } else {
          userMessage = `Error: ${err.message}`;
        }
      }
      
      setError(userMessage);
      setIsLoading(false);
      return false;
    }
  }, [connect, retryCount, setShowWalletModal]);

  /**
   * Connect wallet: opens modal; chainType = current header chain for Solana hint.
   */
  const connectWallet = useCallback(async (chainType = 'evm') => {
    try {
      setError(null);
      // Prefer direct connection only for EVM when exactly one obvious EVM wallet exists.
      const checkResult = checkWalletsAvailable();
      const wallets = checkResult.wallets || [];
      if (chainType === 'evm' && checkResult.available && wallets.length === 1) {
        const only = wallets[0];
        const connector = only?.connector || connectors?.find(c => c?.id === only?.id || c?.name === only?.name) || null;
        if (connector) {
          return await connectWalletWithConnector(connector);
        }
      }

      // Open unified modal, passing chainType so the Solana hint can be shown when needed.
      if (connectWalletOriginal) {
        connectWalletOriginal(chainType);
      } else {
        openWalletModal();
      }
    } catch (err) {
      console.error('[DEX Wallet] Connect error:', err);
      setError('Error opening connection modal');
    }
  }, [checkWalletsAvailable, connectors, connectWalletWithConnector, openWalletModal, connectWalletOriginal]);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (disconnectEvmWallet) {
        await disconnectEvmWallet();
      } else if (disconnectWalletOriginal) {
        await disconnectWalletOriginal();
      }
      
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('[DEX Wallet] Disconnect error:', err);
      setError('Error disconnecting wallet');
      setIsLoading(false);
      return false;
    }
  }, [disconnectEvmWallet, disconnectWalletOriginal]);

  // Clear error when wallet connects/disconnects.
  // IMPORTANT: Do not automatically enable "remember wallet"; otherwise auto-reconnect can run on reload
  // and TrustWallet may open without a click, especially when multiple injected wallets exist.
  useEffect(() => {
    if (isEvmConnected && evmWalletAddress) {
      setError(null);
      setRetryCount(0);
    }
  }, [isEvmConnected, evmWalletAddress]);

  // Get available wallets
  const availableWallets = checkWalletsAvailable().wallets || [];

  return {
    walletAddress: evmWalletAddress || null,
    isConnected: !!(isEvmConnected && evmWalletAddress),
    connectWallet,
    connectWalletWithConnector,
    disconnectWallet,
    openWalletModal,
    error,
    isLoading,
    retryCount,
    showModal: showWalletModal,
    setShowModal: setShowWalletModal,
    availableWallets,
    connectors
  };
}

export default useDEXWallet;

