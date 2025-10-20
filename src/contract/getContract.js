import { ethers } from "ethers";
import { CONTRACTS } from "./contracts";

/**
 * Returnează o instanță de contract pe baza unei chei din CONTRACTS.js
 * @param {string} key - cheia contractului (ex: "NODE", "CELL_MANAGER", "USDT")
 * @returns {ethers.Contract} - instanță de contract conectată la wallet
 */
export const getContractInstance = async (key) => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("🦊 Wallet not detected. Please install MetaMask.");
  }

  const contractInfo = CONTRACTS[key];
  if (!contractInfo || !contractInfo.address || !contractInfo.abi) {
    throw new Error(`🚫 Invalid contract config for key "${key}"`);
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  return new ethers.Contract(contractInfo.address, contractInfo.abi, signer);
};
