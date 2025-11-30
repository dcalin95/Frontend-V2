export const isInAppBrowser = () => {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || navigator.vendor || window.opera;
  
  // 📱 Strictly check for Mobile devices first
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  
  // 🛑 If it's Desktop (Windows, Mac, Linux), it is NOT an in-app browser
  // This prevents auto-connect issues on Desktop with MetaMask/Phantom installed
  if (!isMobile) return false;

  // ✅ Check for specific in-app browser signatures on Mobile
  return (
    (!!window.ethereum && (window.ethereum.isMetaMask || window.ethereum.isTrust || window.ethereum.isCoinbaseWallet)) || // Detect injected providers
    /MetaMask|TrustWallet|CoinbaseWallet|Cipher|Wlext|Wallet/i.test(ua) // Detect User Agent
  );
};
