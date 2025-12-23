/**
 * 🛡️ WALLET FILTER UTILITIES
 * 
 * SEPARARE COMPLETĂ între EVM și Solana:
 * - Phantom = DOAR Solana (NICIODATĂ EVM)
 * - MetaMask/Trust/Coinbase = DOAR EVM
 */

/**
 * Detectează toate wallet-urile injectate și le categorizează STRICT
 */
export const detectAllInjectedWallets = () => {
  const wallets = {
    evm: [],
    solana: [],
    conflicts: []
  };

  if (typeof window === 'undefined') return wallets;

  // 🛑 CRITICAL: Phantom este DOAR Solana, NICIODATĂ EVM
  if (window.solana?.isPhantom || window.phantom?.solana) {
    wallets.solana.push({
      name: 'Phantom',
      id: 'phantom',
      provider: window.solana || window.phantom?.solana,
      isPhantom: true
    });
    
    // ⚠️ WARNING: Phantom injectează și window.ethereum, dar îl IGNORĂM complet pentru EVM
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
 * Filtrează connectorii Wagmi pentru a EXCLUDE COMPLET Phantom
 * 🛑 REGULA DE AUR: Phantom = NICIODATĂ în lista EVM
 */
export const filterEVMConnectors = (connectors) => {
  if (!connectors || !Array.isArray(connectors)) {
    return [];
  }

  return connectors.filter(connector => {
    const name = (connector.name || '').toLowerCase();
    const id = (connector.id || '').toLowerCase();
    
    // 🛑 RULE #1: EXCLUDE orice conține "phantom" în nume sau ID
    if (name.includes('phantom') || id.includes('phantom')) {
      console.warn(`🛑 [WalletFilter] BLOCKED Phantom connector: ${connector.name} (ID: ${connector.id}) - Phantom is SOLANA ONLY`);
      return false;
    }

    // 🛑 RULE #2: Dacă este "injected" connector și Phantom a preluat window.ethereum, EXCLUDE
    if (connector.id === 'injected' && typeof window !== 'undefined') {
      const isPhantom = !!window.ethereum?.isPhantom;
      const isMetaMask = !!window.ethereum?.isMetaMask;
      
      // Dacă window.ethereum zice că e Phantom, connector-ul "injected" este COMPROMIS.
      // Îl blocăm complet pentru că Wagmi îl va folosi pe post de Phantom.
      if (isPhantom) {
        console.warn(`🛑 [WalletFilter] BLOCKED "injected" connector - window.ethereum is hijacked by Phantom!`);
        return false;
      }
      
      // Dacă nu avem MetaMask sau alt wallet EVM real, dar avem connector injected, e suspect
      if (!isMetaMask && !window.ethereum?.isTrust && !window.ethereum?.isCoinbaseWallet) {
        console.warn(`⚠️ [WalletFilter] "injected" connector detected but no known EVM wallet found in window.ethereum`);
      }
    }

    // 🛑 RULE #3: Verificare EIP-6963 (Multiple providers)
    // Dacă avem multiple providers și acesta este cel de Phantom, îl eliminăm din lista EVM
    if (connector.id.toLowerCase().includes('phantom')) {
        console.warn(`🛑 [WalletFilter] BLOCKED explicit Phantom connector from EVM list`);
        return false;
    }

    // 🛑 RULE #3: Verificare finală - nu permite niciun connector care ar putea fi Phantom
    if (typeof window !== 'undefined' && connector.id === 'injected') {
      // Dacă connector-ul este "injected" și window.ethereum este Phantom, EXCLUDE
      if (window.ethereum?.isPhantom && connector.name?.toLowerCase().includes('phantom')) {
        console.warn(`🛑 [WalletFilter] BLOCKED connector claiming to be Phantom via injected`);
        return false;
      }
    }

    console.log(`✅ [WalletFilter] ALLOWED EVM connector: ${connector.name} (ID: ${connector.id})`);
    return true;
  });
};

/**
 * Prioritează wallet-urile EVM (MetaMask are prioritate)
 * 🛑 GARANȚIE: Phantom nu va fi niciodată în această listă
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
 * Loghează toate wallet-urile detectate pentru debugging
 * 🎯 Arată separarea CLARĂ între EVM și Solana
 */
export const logDetectedWallets = () => {
  const detected = detectAllInjectedWallets();
  
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
  
  return detected;
};


