import { ethers } from "ethers";
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";

/**
 * Connects to an EVM-compatible wallet (e.g., MetaMask).
 * @returns {Promise<Object>} - Wallet details including address and provider.
 * @throws {Error} - Throws an error if MetaMask is not found.
 */
export const connectEVMWallet = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found! Please install MetaMask to continue.");
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []); // Request account access
    const signer = provider.getSigner();
    return {
      address: await signer.getAddress(),
      provider,
      type: "EVM",
    };
  } catch (error) {
    console.error("Failed to connect to EVM wallet:", error);
    throw new Error("Failed to connect to MetaMask. Please try again.");
  }
};

/**
 * Custom hook for connecting to a Solana wallet.
 * @returns {Object} - Functions and state related to the Solana wallet connection.
 */
export const useSolanaConnection = () => {
  const solanaWallet = useSolanaWallet();

  /**
   * Connects to the Solana wallet.
   * @returns {Object} - Wallet details including address and type.
   * @throws {Error} - Throws an error if the wallet is not connected.
   */
  const connectSolanaWallet = () => {
    if (!solanaWallet.connected) {
      throw new Error("Solana wallet not connected! Please connect your wallet.");
    }

    try {
      return {
        address: solanaWallet.publicKey.toString(),
        type: "Solana",
      };
    } catch (error) {
      console.error("Failed to connect to Solana wallet:", error);
      throw new Error("Failed to retrieve Solana wallet details.");
    }
  };

  return { connectSolanaWallet, solanaWallet };
};

