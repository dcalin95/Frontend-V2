import { ethers } from "ethers";
import { CONTRACTS } from "./contracts";
import { pickEvmProvider } from "../utils/evmProviderResolver";

/**
 * Returnează o instanță de contract pe baza unei chei din CONTRACTS.js
 * @param {string} key - cheia contractului (ex: "NODE", "CELL_MANAGER", "USDT")
 * @returns {ethers.Contract} - instanță de contract conectată la wallet
 */
export const getContractInstance = async (key) => {
  const ethereum = pickEvmProvider();
  if (!ethereum) {
    throw new Error("Wallet not detected. Please connect your wallet.");
  }

  const contractInfo = CONTRACTS[key];
  if (!contractInfo || !contractInfo.address || !contractInfo.abi) {
    throw new Error(`Invalid contract config for key "${key}"`);
  }

  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();

  return new ethers.Contract(contractInfo.address, contractInfo.abi, signer);
};
