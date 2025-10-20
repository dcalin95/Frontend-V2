// src/utils/getExplorerLink.js
export const getExplorerLink = (hash, token, chain) => {
    if (!hash) return "";
  
    if (hash.startsWith("http")) return hash;
  
    if (token === "SOL") {
      const cluster = chain === "mainnet" ? "" : "?cluster=devnet";
      return `https://solscan.io/tx/${hash}${cluster}`;
    }
  
    const isMainnet = chain === "mainnet";
    let explorerDomain = "";
  
    switch (token) {
      case "BNB":
        explorerDomain = isMainnet ? "bscscan.com" : "testnet.bscscan.com";
        break;
      case "ETH":
        explorerDomain = isMainnet ? "etherscan.io" : "goerli.etherscan.io";
        break;
      case "MATIC":
        explorerDomain = isMainnet ? "polygonscan.com" : "mumbai.polygonscan.com";
        break;
      // Add other chains here as needed
      default:
        explorerDomain = "bscscan.com";
    }
  
    return `https://${explorerDomain}/tx/${hash}`;
  };
  