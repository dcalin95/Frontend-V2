/**
 * 🔗 useWallet Hook
 * 
 * Hook pentru wallet connection și message signing:
 * - Detect wallet provider (MetaMask, Trust Wallet)
 * - Connect wallet
 * - Sign messages (personal_sign)
 * - Handle wallet events
 * 
 * @module useWallet
 */

import { useState, useEffect, useCallback, useRef } from 'react';
// CRITICAL: Import from absolute path to ensure same WalletContext instance 
import { useWallet as useUnifiedWallet } from '../../context/WalletContext.jsx';
import { pickEvmProvider } from '../../utils/evmProviderResolver.js';

const getWalletProvider = () => pickEvmProvider();
const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

/**
 * useWallet Hook
 * 
 * @returns {object} Wallet state and functions
 */
export const useWallet = () => {
  // CRITICAL: Must use same WalletContext as Header - check if available
  const unified = useUnifiedWallet?.() || null;
  
  // Sync only; no console spam (was: debug log WalletContext status)
  const [walletAddress, setWalletAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const latestUnifiedRef = useRef({
    walletAddress: null,
    signer: null,
    isConnected: false,
    walletType: null,
  });

  useEffect(() => {
    latestUnifiedRef.current = {
      walletAddress: unified?.walletAddress || null,
      signer: unified?.signer || null,
      isConnected: !!unified?.isConnected,
      walletType: unified?.walletType || null,
    };
  }, [unified?.walletAddress, unified?.signer, unified?.isConnected, unified?.walletType]);

  // Sync from WalletContext (header icon) when EVM is connected – one source of truth for BSC/Leverage
  useEffect(() => {
    if (unified?.isConnected && unified?.walletAddress && unified?.walletType === 'EVM') {
      setWalletAddress(unified.walletAddress);
      setProvider(unified.signer?.provider || null);
    } else if (!unified?.isConnected || unified?.walletType !== 'EVM') {
      setWalletAddress(null);
      setProvider(null);
    }
    
    // OLD CODE (commented out to prevent auto-connect):
    // const checkConnection = async () => {
    //   const walletProvider = getWalletProvider();
    //   if (!walletProvider) {
    //     return;
    //   }
    //
    //   try {
    //     const accounts = await walletProvider.request({ method: 'eth_accounts' });
    //     if (accounts && accounts.length > 0) {
    //       setWalletAddress(accounts[0]);
    //       setProvider(walletProvider);
    //       try {
    //         localStorage.setItem('dex_last_wallet', accounts[0]);
    //       } catch (e) {
    //         // localStorage might be disabled
    //       }
    //     }
    //   } catch (err) {
    //     console.error('Error checking wallet connection:', err);
    //   }
    // };
    //
    // checkConnection();

    // 🛑 DISABLED: Do NOT listen for account changes automatically
    // Only real connected wallet. No unverified connection.
    // Only listen if user explicitly connected wallet
    // 
    // Listen for account changes (Phase 3: UX Improvements)
    // const handleAccountsChanged = (accounts) => {
    //   if (accounts && accounts.length > 0) {
    //     const newAddress = accounts[0];
    //     setWalletAddress(newAddress);
    //     // Update remembered wallet
    //     try {
    //       localStorage.setItem('dex_last_wallet', newAddress);
    //     } catch (e) {
    //       // localStorage might be disabled
    //     }
    //   } else {
    //     setWalletAddress(null);
    //     setProvider(null);
    //     // Clear remembered wallet
    //     try {
    //       localStorage.removeItem('dex_last_wallet');
    //     } catch (e) {
    //       // localStorage might be disabled
    //     }
    //   }
    //   setError(null);
    // };

    // Listen for disconnect (Phase 3: UX Improvements)
    // const handleDisconnect = () => {
    //   setWalletAddress(null);
    //   setProvider(null);
    //   setError(null);
    //   // Clear remembered wallet
    //   try {
    //     localStorage.removeItem('dex_last_wallet');
    //   } catch (e) {
    //     // localStorage might be disabled
    //   }
    // };

    // Listen for chain changes (Phase 3: UX Improvements)
    // const handleChainChanged = (chainId) => {
    //   // Chain changed - notify user if needed
    //   console.log('Chain changed to:', chainId);
    //   // Optionally: show notification or prompt to switch network
    //   // For now, just log it
    // };

    // 🛑 DISABLED: Do NOT set up event listeners automatically
    // const walletProvider = getWalletProvider();
    // if (walletProvider) {
    //   walletProvider.on('accountsChanged', handleAccountsChanged);
    //   walletProvider.on('disconnect', handleDisconnect);
    //   walletProvider.on('chainChanged', handleChainChanged);
    //
    //   return () => {
    //     walletProvider.removeListener('accountsChanged', handleAccountsChanged);
    //     walletProvider.removeListener('disconnect', handleDisconnect);
    //     walletProvider.removeListener('chainChanged', handleChainChanged);
    //   };
    // }
  }, []);

  /**
   * Connect wallet (Phase 3: UX Improvements - remember last wallet)
   * @param {string} chainType - Optional: 'evm' or 'solana' (ignored, always uses EVM for now)
   */
  const connectWallet = useCallback(async (chainType = 'evm') => {
    setIsConnecting(true);
    setError(null);

    try {
      if (isDev) console.log('[useWallet] connectWallet called, chainType:', chainType);

      if (unified?.connectWallet) {
        if (isDev) console.log('[useWallet] Opening unified wallet modal...');
        unified.connectWallet('evm');

        // Așteptare fără blocare (setTimeout, nu while) – evită „pagina nu răspunde”
        const timeoutMs = 60000;
        return new Promise((resolve, reject) => {
          const start = Date.now();
          const check = () => {
            const snap = latestUnifiedRef.current;
            if (snap.isConnected && snap.walletType === 'EVM' && snap.walletAddress) {
              if (isDev) console.log('[useWallet] Wallet connected via modal:', snap.walletAddress);
              setWalletAddress(snap.walletAddress);
              setProvider(snap.signer?.provider || null);
              setIsConnecting(false);
              resolve(snap.walletAddress);
              return;
            }
            if (Date.now() - start >= timeoutMs) {
              setIsConnecting(false);
              reject(new Error('Wallet connection timed out. Please try again and select MetaMask in the modal.'));
              return;
            }
            setTimeout(check, 300);
          };
          setTimeout(check, 300);
        });
      }

      // Fallback fără WalletContext
      const walletProvider = getWalletProvider();
      if (!walletProvider) {
        throw new Error('No Ethereum wallet found. Please install MetaMask.');
      }
      const accounts = await walletProvider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }
      const connectedAddress = accounts[0];
      setWalletAddress(connectedAddress);
      setProvider(walletProvider);
      return connectedAddress;
    } catch (err) {
      const errorMessage = err.message || 'Failed to connect wallet';
      if (isDev) console.error('[useWallet] Connection error:', errorMessage, err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [unified]);

  /**
   * Sign message using personal_sign
   * @param {string} message - Message to sign
   * @returns {Promise<string>} Signature (0x...)
   */
  const signMessage = useCallback(async (message) => {
    try {
      // Wait for wallet to be properly connected before signing
      let retries = 0;
      const maxRetries = 10; // 5 seconds max wait
      
      while (retries < maxRetries) {
        // Check unified wallet first
        if (unified?.signer && unified?.walletAddress && unified?.isConnected) {
          if (isDev) console.log('[useWallet] Signing with unified wallet:', unified.walletAddress);
          return await unified.signer.signMessage(message);
        }
        
        // Check direct provider
        if (provider && walletAddress) {
          if (isDev) console.log('[useWallet] Signing with direct provider:', walletAddress);
          const signature = await provider.request({
            method: 'personal_sign',
            params: [message, walletAddress],
          });
          return signature;
        }
        
        if (isDev) console.log(`[useWallet] Waiting for wallet connection... (${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }

      // Fallback: UI may show "connected" but React state (unified/provider) not yet synced – try direct provider once
      const directProvider = getWalletProvider();
      if (directProvider) {
        try {
          const accounts = await directProvider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            const addr = accounts[0];
            if (isDev) console.log('[useWallet] Signing with fallback provider:', addr);
            const signature = await directProvider.request({
              method: 'personal_sign',
              params: [message, addr],
            });
            return signature;
          }
        } catch (fallbackErr) {
          if (isDev) console.warn('[useWallet] Fallback sign failed:', fallbackErr?.message);
        }
      }

      throw new Error('Wallet not connected - please connect wallet first');

    } catch (err) {
      if (err.code === 4001) {
        throw new Error('Signature rejected by user');
      }
      throw new Error(err.message || 'Failed to sign message');
    }
  }, [provider, walletAddress, unified?.signer, unified?.walletAddress]);

  /**
   * Disconnect wallet (clear state)
   */
  const disconnect = useCallback(() => {
    if (unified?.disconnectWallet) {
      unified.disconnectWallet();
    }
    setWalletAddress(null);
    setProvider(null);
    setError(null);
  }, [unified?.disconnectWallet]);

  // Prefer WalletContext (header icon) when EVM is connected – same connection for Leverage/BSC and header
  const effectiveAddress =
    unified?.walletType === 'EVM' && unified?.isConnected && unified?.walletAddress
      ? unified.walletAddress
      : walletAddress;
  const effectiveProvider =
    unified?.walletType === 'EVM' && unified?.signer?.provider
      ? unified.signer.provider
      : provider;
  const effectiveConnected =
    !!(unified?.walletType === 'EVM' && unified?.isConnected && unified?.walletAddress) || !!walletAddress;

  return {
    walletAddress: effectiveAddress,
    provider: effectiveProvider,
    signer: unified?.walletType === 'EVM' && unified?.isConnected ? unified.signer : null,
    isConnected: !!effectiveConnected,
    isConnecting,
    error,
    connectWallet,
    signMessage,
    disconnect,
  };
};

export default useWallet;
