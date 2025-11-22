export const isInAppBrowser = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return (
    (!!window.ethereum && (window.ethereum.isMetaMask || window.ethereum.isTrust || window.ethereum.isCoinbaseWallet)) || // Detect injected providers
    /MetaMask|TrustWallet|CoinbaseWallet|Cipher|Wlext|Wallet/i.test(ua) // Detect User Agent
  );
};

