/**
 * 🛡️ WALLET FILTER UTILITIES
 * 
 * Complete separation between EVM and Solana:
 * - Phantom = Solana only (never EVM)
 * - MetaMask/Trust/Coinbase = EVM only
 */
const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

/**
 * Detects all injected wallets and categorizes them strictly.
 */
export const detectAllInjectedWallets = () => {
  const wallets = {
    evm: [],
    solana: [],
    conflicts: []
  };

  if (typeof window === 'undefined') return wallets;

  // CRITICAL: Phantom is Solana only, never EVM.
  if (window.solana?.isPhantom || window.phantom?.solana) {
    wallets.solana.push({
      name: 'Phantom',
      id: 'phantom',
      provider: window.solana || window.phantom?.solana,
      isPhantom: true
    });
    
    // WARNING: Phantom also injects window.ethereum, but ignore it completely for EVM.
    if (window.ethereum?.isPhantom) {
      wallets.conflicts.push({
        name: 'Phantom (EVM injection - IGNORED)',
        id: 'phantom-evm',
        provider: window.ethereum,
        issue: 'Phantom injects window.ethereum but is SOLANA-ONLY wallet',
        recommendation: 'Use Phantom ONLY via window.solana for Solana network'
      });
    }
  }

  // Detect REAL EVM wallets (exclude Phantom completely)
  if (window.ethereum && !window.ethereum.isPhantom) {
    // MetaMask
    if (window.ethereum.isMetaMask) {
      wallets.evm.push({
        name: 'MetaMask',
        id: 'metamask',
        provider: window.ethereum,
        isPhantom: false
      });
    }

    // Trust Wallet
    if (window.ethereum.isTrust) {
      wallets.evm.push({
        name: 'Trust Wallet',
        id: 'trust',
        provider: window.ethereum,
        isPhantom: false
      });
    }

    // Coinbase Wallet
    if (window.ethereum.isCoinbaseWallet) {
      wallets.evm.push({
        name: 'Coinbase Wallet',
        id: 'coinbase',
        provider: window.ethereum,
        isPhantom: false
      });
    }

    // Rainbow
    if (window.ethereum.isRainbow) {
      wallets.evm.push({
        name: 'Rainbow',
        id: 'rainbow',
        provider: window.ethereum,
        isPhantom: false
      });
    }
  }

  // Detect other Solana wallets
  if (window.solflare) {
    wallets.solana.push({
      name: 'Solflare',
      id: 'solflare',
      provider: window.solflare
    });
  }

  return wallets;
};

/**
 * Filters Wagmi connectors to completely exclude Phantom.
 * Golden rule: Phantom must never be in the EVM list.
 */
export const filterEVMConnectors = (connectors) => {
  if (!connectors || !Array.isArray(connectors)) {
    return [];
  }

  return connectors.filter(connector => {
    const name = (connector.name || '').toLowerCase();
    const id = (connector.id || '').toLowerCase();
    const uid = (connector.uid || '').toLowerCase();
    
    // 🛑 CRITICAL: BLOCK ALL PHANTOM VARIATIONS
    // Phantom is SOLANA-ONLY, should NEVER appear in EVM list
    const phantomKeywords = ['phantom', 'com.phantom', 'app.phantom', 'io.phantom'];
    const isPhantom = phantomKeywords.some(keyword => 
      name.includes(keyword) || id.includes(keyword) || uid.includes(keyword)
    );
    
    if (isPhantom) {
      if (isDev) console.debug(`🛑 [WalletFilter] BLOCKED Phantom connector: ${connector.name} (ID: ${connector.id})`);
      return false;
    }

    // RULE #2: if this is an "injected" connector and Phantom took over window.ethereum, exclude it.
    if (connector.id === 'injected' && typeof window !== 'undefined') {
      const isPhantom = !!window.ethereum?.isPhantom;
      const isMetaMask = !!window.ethereum?.isMetaMask;
      
      // If window.ethereum says it is Phantom, the "injected" connector is compromised.
      // Block it completely because Wagmi would use it as Phantom.
      if (isPhantom) {
        if (isDev) console.debug(`🛑 [WalletFilter] BLOCKED "injected" connector - window.ethereum is hijacked by Phantom!`);
        return false;
      }
      
      // If no MetaMask/Trust/Coinbase/Binance or other known EVM wallet is present.
      const hasBinance = typeof window.binancew3w?.ethereum !== 'undefined';
      if (isDev && !isMetaMask && !window.ethereum?.isTrust && !window.ethereum?.isCoinbaseWallet && !hasBinance) {
        console.warn(`⚠️ [WalletFilter] "injected" connector detected but no known EVM wallet found in window.ethereum`);
      }
    }

    // RULE #3: EIP-6963 check (multiple providers).
    // If there are multiple providers and this one is Phantom, remove it from the EVM list.
    if (connector.id.toLowerCase().includes('phantom')) {
        if (isDev) console.warn(`🛑 [WalletFilter] BLOCKED explicit Phantom connector from EVM list`);
        return false;
    }

    // RULE #3: final check - allow no connector that could be Phantom.
    if (typeof window !== 'undefined' && connector.id === 'injected') {
      // If the connector is "injected" and window.ethereum is Phantom, exclude it.
      if (window.ethereum?.isPhantom && connector.name?.toLowerCase().includes('phantom')) {
        if (isDev) console.debug(`🛑 [WalletFilter] BLOCKED connector claiming to be Phantom via injected`);
        return false;
      }
    }

    // Connector is allowed
    return true;
  });
};

/**
 * Prioritizes EVM wallets, with MetaMask first.
 * Guarantee: Phantom will never be in this list.
 */
export const prioritizeEVMWallets = (connectors) => {
  const filtered = filterEVMConnectors(connectors);
  
  // Sort: MetaMask first, then others, NEVER Phantom
  return filtered.sort((a, b) => {
    const aName = (a.name || '').toLowerCase();
    const bName = (b.name || '').toLowerCase();
    
    // MetaMask always first
    if (aName.includes('metamask') && !aName.includes('phantom')) return -1;
    if (bName.includes('metamask') && !bName.includes('phantom')) return 1;
    
    // Trust Wallet second
    if (aName.includes('trust')) return -1;
    if (bName.includes('trust')) return 1;
    
    // Coinbase third
    if (aName.includes('coinbase')) return -1;
    if (bName.includes('coinbase')) return 1;
    
    return 0;
  });
};

/**
 * Logs all detected wallets for debugging.
 * Shows the clear separation between EVM and Solana.
 */
export const logDetectedWallets = () => {
  const detected = detectAllInjectedWallets();
  
  if (isDev) {
    console.log('🔍 [WalletFilter] ========== WALLET DETECTION ==========');
    console.log('✅ [EVM Wallets - MetaMask, Trust, Coinbase, Rainbow]:', detected.evm.map(w => w.name));
    console.log('✅ [Solana Wallets - Phantom, Solflare]:', detected.solana.map(w => w.name));
    if (detected.conflicts.length > 0) {
      console.warn('⚠️ [WalletFilter] ========== CONFLICTS DETECTED ==========');
      detected.conflicts.forEach(conflict => {
        console.warn(`  🛑 ${conflict.name}: ${conflict.issue}`);
        console.warn(`     Recommendation: ${conflict.recommendation}`);
      });
    }
    console.log('🔍 [WalletFilter] ========================================');
  }
  
  return detected;
};

/**
 * 🚨 FORCE FIX: Restore window.ethereum to REAL EVM wallet (not Phantom)
 * USAGE: Call before EVERY EVM connection attempt
 */
export const forceFixPhantomHijack = () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }
  
  if (isDev) console.log('🔧 [WalletFilter] Checking for Phantom hijack...');
  
  // Check if window.ethereum is hijacked by Phantom
  const isPhantomHijack = window.ethereum.isPhantom && !window.ethereum.isMetaMask && !window.ethereum.isTrust && !window.ethereum.isCoinbaseWallet;
  
  if (!isPhantomHijack) {
    if (isDev) console.log('✅ [WalletFilter] No hijack detected - window.ethereum is clean');
    return false;
  }
  
  if (isDev) console.warn('🛑 [WalletFilter] PHANTOM HIJACK DETECTED! Attempting to restore real EVM wallet...');
  
  // Try to find a real EVM provider in window.ethereum.providers[]
  if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
    if (isDev) console.log(`🔍 [WalletFilter] Found ${window.ethereum.providers.length} providers, searching for EVM wallet...`);
    
    // Priority: MetaMask > Trust > Coinbase > Any non-Phantom
    const metamask = window.ethereum.providers.find(p => p.isMetaMask && !p.isTrust && !p.isPhantom);
    const trust = window.ethereum.providers.find(p => p.isTrust);
    const coinbase = window.ethereum.providers.find(p => p.isCoinbaseWallet);
    const anyEVM = window.ethereum.providers.find(p => !p.isPhantom);
    
    const realWallet = metamask || trust || coinbase || anyEVM;
    
    if (realWallet) {
      if (isDev) {
        console.log('✅ [WalletFilter] Found real EVM wallet, swapping window.ethereum...');
        console.log('✅ [WalletFilter] HIJACK FIXED! window.ethereum restored to:', {
          isMetaMask: window.ethereum.isMetaMask,
          isTrust: window.ethereum.isTrust,
          isCoinbaseWallet: window.ethereum.isCoinbaseWallet,
          isPhantom: window.ethereum.isPhantom
        });
      }
      window.ethereum = realWallet;
      return true;
    } else {
      if (isDev) console.error('❌ [WalletFilter] No real EVM wallet found in providers! Install MetaMask or another EVM wallet.');
      return false;
    }
  } else {
    if (isDev) console.error('❌ [WalletFilter] No providers array found! Only Phantom is installed. Install MetaMask or another EVM wallet.');
    return false;
  }
};

/**
 * ✅ FORCE PICK: Choose a specific injected EVM provider when multiple exist.
 * Why: some wallets (ex: Trust) can become the "default" injected provider and/or set isMetaMask=true.
 * This makes "MetaMask" connects open Trust Wallet unless we explicitly pick the real MetaMask provider.
 *
 * Usage: call right before wagmi connect() or any window.ethereum.request that should hit MetaMask.
 *
 * @param {'metamask'|'trust'|'coinbase'|'binance'} preferred
 * @returns {boolean} true if we changed window.ethereum to the preferred provider
 */
export const forcePickEvmInjectedProvider = (preferred = 'metamask') => {
  if (typeof window === 'undefined' || !window.ethereum) return false;

  const pref = String(preferred || '').toLowerCase();
  const eth = window.ethereum;
  const list = eth.providers && Array.isArray(eth.providers) ? eth.providers : null;

  // Binance Web3 Wallet can be the only wallet (window.binancew3w.ethereum) without providers.
  const binanceStandalone = typeof window !== 'undefined' && window.binancew3w?.ethereum && typeof window.binancew3w.ethereum.request === 'function';
  if (pref.includes('binance') && binanceStandalone) {
    try {
      window.ethereum = window.binancew3w.ethereum;
      return true;
    } catch (_) {
      return false;
    }
  }

  if (!list || list.length === 0) return false;

  // Never pick Phantom's EVM injection.
  const safeList = list.filter(p => p && !p.isPhantom && typeof p.request === 'function');

  // Binance Web3 Wallet: window.binancew3w.ethereum (can be in providers or a separate global).
  const binanceProvider = typeof window !== 'undefined' && window.binancew3w?.ethereum;
  const pickBinance =
    pref.includes('binance') &&
    binanceProvider &&
    typeof binanceProvider.request === 'function'
      ? binanceProvider
      : pref.includes('binance')
        ? safeList.find(p => (p?.provider?.isBinanceWeb3Wallet) || (String(p?.constructor?.name || '').toLowerCase().includes('binance')))
        : null;

  // IMPORTANT: exclude Trust when looking for MetaMask, because Trust may set isMetaMask=true.
  const pickMetaMask = safeList.find(p => !!p.isMetaMask && !p.isTrust && !p.isPhantom);
  const pickTrust = safeList.find(p => !!p.isTrust && !p.isPhantom);
  const pickCoinbase = safeList.find(p => !!p.isCoinbaseWallet && !p.isPhantom);

  const chosen =
    pref.includes('meta')
      ? pickMetaMask
      : pref.includes('trust')
        ? pickTrust
        : pref.includes('coinbase')
          ? pickCoinbase
          : pref.includes('binance')
            ? pickBinance
            : null;

  if (!chosen) return false;

  // Swap window.ethereum reference so downstream code (and some connectors) hit the intended wallet.
  try {
    window.ethereum = chosen;
    return true;
  } catch (_) {
    return false;
  }
};

