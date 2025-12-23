import { ethers } from "ethers";
import { CONTRACTS } from "./contracts";

/**
 * Returnează o instanță de contract pe baza unei chei din CONTRACTS.js
 * @param {string} key - cheia contractului (ex: "NODE", "CELL_MANAGER", "USDT")
 * @param {boolean} needsSigner - dacă este TRUE, va cere permisiune de la wallet (popup)
 * @returns {ethers.Contract} - instanță de contract
 */
export const getContractInstance = async (key, needsSigner = false) => {
  const contractInfo = CONTRACTS[key];
  if (!contractInfo || !contractInfo.address || !contractInfo.abi) {
    throw new Error(`🚫 Invalid contract config for key "${key}"`);
  }

  // 🌐 Pentru citire (read-only), folosim un provider public (fără popup)
  if (!needsSigner) {
    const rpcUrl = "https://bsc-dataseed1.binance.org"; // BSC Mainnet
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    return new ethers.Contract(contractInfo.address, contractInfo.abi, provider);
  }

  // 🔐 Pentru tranzacții, avem nevoie de wallet
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("🦊 Wallet not detected. Please install MetaMask.");
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  return new ethers.Contract(contractInfo.address, contractInfo.abi, signer);
};
