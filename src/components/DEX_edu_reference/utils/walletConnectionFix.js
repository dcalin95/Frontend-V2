/**
 * 🔧 WALLET CONNECTION FIX UTILITIES
 * 
 * Rezolvă problema când MetaMask blochează conectarea din cauza unei încercări anterioare eșuate
 */

/**
 * Clear all cached wallet connection data
 */
export const clearWalletCache = () => {
  try {
    // 1. Clear localStorage
    const keysToRemove = [
      'wagmi.store',
      'wagmi.wallet',
      'wagmi.connected',
      'wagmi.recentConnectorId',
      'wagmi.cache',
      'WALLETCONNECT_DEEPLINK_CHOICE',
      'wc@2:client:0.3//session',
      'wc@2:core:0.3//pairing',
      'wc@2:ethereum_provider:/namespaces',
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear all WalletConnect related keys (they start with 'wc@')
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('wc@') || key.startsWith('wagmi')) {
        localStorage.removeItem(key);
      }
    });
    
    // 2. Clear sessionStorage
    const sessionKeysToRemove = [
      'wagmi.connector',
      'wagmi.connecting',
      'wallet_pending_request',
    ];
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    // Clear all session keys starting with 'wagmi' or 'wc@'
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('wc@') || key.startsWith('wagmi')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log("✅ [WalletFix] Cache cleared successfully");
    return true;
  } catch (error) {
    console.error("❌ [WalletFix] Error clearing cache:", error);
    return false;
  }
};

/**
 * Reset MetaMask pending requests
 */
export const resetMetaMaskRequests = async () => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      return false;
    }
    
    // Check if MetaMask is unlocked
    if (window.ethereum._metamask?.isUnlocked) {
      const isUnlocked = await window.ethereum._metamask.isUnlocked();
      console.log("🔓 [WalletFix] MetaMask unlocked:", isUnlocked);
    }
    
    // Force clear any pending requests
    if (window.ethereum.removeAllListeners) {
      window.ethereum.removeAllListeners('connect');
      window.ethereum.removeAllListeners('disconnect');
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }
    
    console.log("✅ [WalletFix] MetaMask requests reset");
    return true;
  } catch (error) {
    console.warn("⚠️ [WalletFix] Could not reset MetaMask:", error);
    return false;
  }
};

/**
 * Force disconnect all wallets
 */
export const forceDisconnectAll = async () => {
  try {
    // Clear cache
    clearWalletCache();
    
    // Reset MetaMask
    await resetMetaMaskRequests();
    
    // Skip disconnect() - not supported by most providers
    // MetaMask and other wallets don't have a disconnect() method
    
    // Clear IndexedDB (WalletConnect uses it)
    if (window.indexedDB) {
      const dbs = await window.indexedDB.databases();
      dbs.forEach(db => {
        if (db.name?.includes('walletconnect') || db.name?.includes('wagmi')) {
          window.indexedDB.deleteDatabase(db.name);
          console.log(`🗑️ [WalletFix] Deleted IndexedDB: ${db.name}`);
        }
      });
    }
    
    console.log("✅ [WalletFix] Force disconnect complete");
    return true;
  } catch (error) {
    console.error("❌ [WalletFix] Error in force disconnect:", error);
    return false;
  }
};

/**
 * Retry connection with fresh state
 */
export const retryConnection = async (connectFunction, maxRetries = 3) => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      console.log(`🔄 [WalletFix] Connection attempt ${attempts + 1}/${maxRetries}`);
      
      // Clear cache before retry
      if (attempts > 0) {
        clearWalletCache();
        await resetMetaMaskRequests();
        
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Try to connect
      await connectFunction();
      
      console.log("✅ [WalletFix] Connection successful!");
      return true;
    } catch (error) {
      attempts++;
      console.warn(`⚠️ [WalletFix] Attempt ${attempts} failed:`, error.message);
      
      if (attempts >= maxRetries) {
        console.error("❌ [WalletFix] All connection attempts failed");
        throw error;
      }
    }
  }
  
  return false;
};

/**
 * Check if there's a pending connection blocking new attempts
 */
export const hasPendingConnection = () => {
  try {
    // Check localStorage for pending state
    const wagmiStore = localStorage.getItem('wagmi.store');
    if (wagmiStore) {
      const parsed = JSON.parse(wagmiStore);
      if (parsed.state?.connections?.pending) {
        return true;
      }
    }
    
    // Check sessionStorage
    const pendingRequest = sessionStorage.getItem('wallet_pending_request');
    if (pendingRequest) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn("[WalletFix] Error checking pending connection:", error);
    return false;
  }
};

/**
 * Auto-fix before connection attempt
 */
export const prepareForConnection = async () => {
  console.log("🔧 [WalletFix] Preparing wallet connection...");

  // 🛡️ Fix Phantom EVM injection hijack (prevents Phantom chooser popup when connecting to MetaMask)
  try {
    const mod = await import('./walletFilter.js');
    if (typeof mod?.forceFixPhantomHijack === 'function') {
      mod.forceFixPhantomHijack();
    }
  } catch (e) {
    // ignore if import fails in some environments
  }
  
  // Check for pending connections
  if (hasPendingConnection()) {
    console.log("⚠️ [WalletFix] Detected pending connection, clearing...");
    await forceDisconnectAll();
  }
  
  // Clear stale cache (older than 1 hour)
  const lastClear = localStorage.getItem('wagmi.lastCacheClear');
  const now = Date.now();
  
  if (!lastClear || (now - parseInt(lastClear)) > 3600000) {
    clearWalletCache();
    localStorage.setItem('wagmi.lastCacheClear', now.toString());
  }
  
  // Reset MetaMask
  await resetMetaMaskRequests();
  
  console.log("✅ [WalletFix] Ready for connection");
};

/**
 * Handle connection error and prepare for retry
 */
export const handleConnectionError = async (error) => {
  console.error("❌ [WalletFix] Connection error:", error);
  
  // Check for specific error types
  const errorMessage = error?.message?.toLowerCase() || '';
  
  // User rejected
  if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
    console.log("👤 [WalletFix] User rejected connection");
    clearWalletCache();
    return { retry: false, reason: 'user_rejected' };
  }
  
  // Already pending
  if (errorMessage.includes('already pending') || errorMessage.includes('request already pending')) {
    console.log("⏳ [WalletFix] Request already pending, clearing...");
    await forceDisconnectAll();
    return { retry: true, reason: 'pending_cleared' };
  }
  
  // Connection timeout
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    console.log("⏱️ [WalletFix] Connection timeout, clearing...");
    clearWalletCache();
    return { retry: true, reason: 'timeout' };
  }
  
  // Generic error - try to recover
  console.log("🔧 [WalletFix] Generic error, attempting recovery...");
  await forceDisconnectAll();
  return { retry: true, reason: 'generic_error' };
};

// Export all utilities
const walletConnectionFix = {
  clearWalletCache,
  resetMetaMaskRequests,
  forceDisconnectAll,
  retryConnection,
  hasPendingConnection,
  prepareForConnection,
  handleConnectionError,
};

export default walletConnectionFix;

