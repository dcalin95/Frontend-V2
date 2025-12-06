// 🔍 Wallet Detection & Installation Utilities
// Detectează ce wallet-uri sunt instalate și oferă link-uri de instalare

export const detectInstalledWallets = () => {
  const installed = {
    metamask: false,
    trustWallet: false,
    coinbase: false,
    rainbow: false,
    phantom: false,
    any: false
  };

  if (typeof window === 'undefined') return installed;

  // MetaMask
  if (window.ethereum?.isMetaMask) {
    installed.metamask = true;
    installed.any = true;
  }

  // Trust Wallet
  if (window.ethereum?.isTrust) {
    installed.trustWallet = true;
    installed.any = true;
  }

  // Coinbase Wallet
  if (window.ethereum?.isCoinbaseWallet || window.coinbaseWalletExtension) {
    installed.coinbase = true;
    installed.any = true;
  }

  // Rainbow
  if (window.ethereum?.isRainbow) {
    installed.rainbow = true;
    installed.any = true;
  }

  // Phantom (Solana)
  if (window.phantom?.solana || window.solana?.isPhantom) {
    installed.phantom = true;
    installed.any = true;
  }

  // Generic ethereum provider (could be any wallet)
  if (window.ethereum && !installed.any) {
    installed.any = true;
  }

  return installed;
};

// 🔍 Detectează dacă suntem în in-app browser
export const detectInAppBrowser = () => {
  if (typeof window === 'undefined') return { isInApp: false };

  const ua = navigator.userAgent.toLowerCase();
  
  // 🛑 FIX CRITIC: Pe Desktop (Windows/Mac/Linux), NU suntem în In-App Browser
  // Chiar dacă avem MetaMask Extension, asta nu înseamnă In-App Browser UI (Bottom Sheet)
  const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  
  if (!isMobileDevice) {
    return { 
        isInApp: false, 
        detectedBrowser: 'desktop-browser',
        isMetaMask: false, isTrust: false, isCoinbase: false, isPhantom: false
    };
  }
  
  const browsers = {
    isMetaMask: window.ethereum?.isMetaMask || ua.includes('metamask'),
    isTrust: window.ethereum?.isTrust || ua.includes('trust'),
    isCoinbase: window.ethereum?.isCoinbaseWallet || ua.includes('coinbase'),
    isPhantom: window.phantom?.solana || ua.includes('phantom'),
    isFacebook: ua.includes('fbav') || ua.includes('fban'),
    isInstagram: ua.includes('instagram'),
    isTwitter: ua.includes('twitter'),
    isTelegram: ua.includes('telegram'),
    isGenericWebView: ua.includes('wv') || 
                      (ua.includes('iphone') && !ua.includes('safari')) ||
                      (ua.includes('ipad') && !ua.includes('safari'))
  };

  const isInApp = Object.values(browsers).some(v => v);

  return {
    isInApp,
    ...browsers,
    detectedBrowser: Object.keys(browsers).find(key => browsers[key]) || 'unknown'
  };
};

// 📱 Detectează dacă suntem pe mobil
export const detectMobile = () => {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768 ||
         ('ontouchstart' in window) ||
         (navigator.maxTouchPoints > 0);
};

// 🔗 Install Links pentru fiecare wallet
export const WALLET_INSTALL_LINKS = {
  metamask: {
    desktop: 'https://metamask.io/download/',
    ios: 'https://apps.apple.com/app/metamask/id1438144202',
    android: 'https://play.google.com/store/apps/details?id=io.metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Most popular Ethereum wallet'
  },
  trustWallet: {
    desktop: 'https://trustwallet.com/download',
    ios: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409',
    android: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
    name: 'Trust Wallet',
    icon: '🛡️',
    description: 'Multi-chain wallet by Binance'
  },
  coinbase: {
    desktop: 'https://www.coinbase.com/wallet/downloads',
    ios: 'https://apps.apple.com/app/coinbase-wallet/id1278383455',
    android: 'https://play.google.com/store/apps/details?id=org.toshi',
    name: 'Coinbase Wallet',
    icon: '🪙',
    description: 'Secure wallet by Coinbase'
  },
  rainbow: {
    desktop: 'https://rainbow.me/download',
    ios: 'https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021',
    android: 'https://play.google.com/store/apps/details?id=me.rainbow',
    name: 'Rainbow',
    icon: '🌈',
    description: 'Beautiful Ethereum wallet'
  },
  phantom: {
    desktop: 'https://phantom.app/download',
    ios: 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977',
    android: 'https://play.google.com/store/apps/details?id=app.phantom',
    name: 'Phantom',
    icon: '👻',
    description: 'Best Solana wallet'
  }
};

// 📲 Generează link-ul corect în funcție de platform
export const getInstallLink = (walletName) => {
  const wallet = WALLET_INSTALL_LINKS[walletName];
  if (!wallet) return null;

  const isMobile = detectMobile();
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isMobile) {
    if (isIOS) return wallet.ios;
    if (isAndroid) return wallet.android;
  }
  
  return wallet.desktop;
};

// 🎯 Recomandare wallet bazat pe context
export const getRecommendedWallet = () => {
  const installed = detectInstalledWallets();
  const { isInApp, detectedBrowser } = detectInAppBrowser();
  const isMobile = detectMobile();

  // Dacă suntem în in-app browser, recomandăm wallet-ul respectiv
  if (isInApp) {
    if (detectedBrowser === 'isMetaMask') return 'metamask';
    if (detectedBrowser === 'isTrust') return 'trustWallet';
    if (detectedBrowser === 'isCoinbase') return 'coinbase';
    if (detectedBrowser === 'isPhantom') return 'phantom';
  }

  // Dacă avem un wallet instalat, recomandăm primul găsit
  if (installed.metamask) return 'metamask';
  if (installed.trustWallet) return 'trustWallet';
  if (installed.coinbase) return 'coinbase';
  if (installed.rainbow) return 'rainbow';
  if (installed.phantom) return 'phantom';

  // Recomandare default pe platform
  if (isMobile) return 'trustWallet'; // Trust Wallet e popular pe mobil
  return 'metamask'; // MetaMask e standard pe desktop
};

