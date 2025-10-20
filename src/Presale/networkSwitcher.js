import { toast } from "react-toastify";
import { getNetworkConfig } from "../../config/config";

const isMainnet = process.env.REACT_APP_ENV === "mainnet";

const NETWORKS = {
  BNB_TEST: {
    chainId: "0x61",
    chainName: "BSC Testnet",
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    blockExplorerUrls: ["https://testnet.bscscan.com"],
  },
  BNB_MAIN: {
    chainId: "0x61", // BSC Testnet
    chainName: "Binance Smart Chain Testnet",
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    blockExplorerUrls: ["https://testnet.bscscan.com"],
  },
  ETH: {
    chainId: "0xaa36a7", // Sepolia
    chainName: "Ethereum Sepolia Testnet",
    rpcUrls: ["https://rpc2.sepolia.org"],
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
  MATIC: {
    chainId: "0x13882", // Polygon Amoy Testnet
    chainName: "Polygon Amoy Testnet",
    rpcUrls: ["https://rpc-amoy.polygon.technology"],
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    blockExplorerUrls: ["https://www.oklink.com/amoy"],
  },
};

const TOKEN_TO_NETWORK = {
  BNB: isMainnet ? "BNB_MAIN" : "BNB_TEST",
  USDT: isMainnet ? "BNB_MAIN" : "BNB_TEST",
  USDC: isMainnet ? "BNB_MAIN" : "BNB_TEST",
  ETH: "ETH",
  SHIB: "ETH",
  MATIC: "MATIC",
};

const isCurrentChain = async (targetChainId) => {
  const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
  return currentChainId.toLowerCase() === targetChainId.toLowerCase();
};

export const switchNetwork = async (selectedToken) => {
  const networkKey = TOKEN_TO_NETWORK[selectedToken];
  const network = NETWORKS[networkKey];

  if (!network) {
    console.warn(`⚠️ No network setup for token: ${selectedToken}`);
    return;
  }

  try {
    const alreadyOnTarget = await isCurrentChain(network.chainId);
    if (alreadyOnTarget) {
      toast.info(`✅ Already on ${network.chainName}`);
      return;
    }

    toast.info(`🔄 Switching to ${network.chainName}...`);
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: network.chainId }],
    });

    toast.success(`✅ Switched to ${network.chainName}`);
  } catch (err) {
    if (err.code === 4902) {
      toast.info(`➕ Adding ${network.chainName} to Metamask...`);
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [network],
        });
        toast.success(`✅ ${network.chainName} added to Metamask`);
      } catch (addErr) {
        console.error("❌ Failed to add network:", addErr.message);
        toast.error("❌ Failed to add network. Please add it manually.");
      }
    } else if (err.code === 4001) {
      toast.warn("⚠️ Network switch cancelled by user.");
    } else {
      console.error("❌ Network switch error:", err.message);
      toast.error(`❌ Failed to switch network: ${err.message}`);
    }
  }
};

