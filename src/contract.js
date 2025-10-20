import { ethers } from 'ethers';
import contractABI from '../src/abi/nodeABI.js';

// DEPRECATED: Use contractMap.js instead
// Updated BSC Testnet Node contract address
const contractAddress = "0x0CaFA9578eE5bf8956Cf28c6a9aF7c16C21C5A46";

export const getContract = async () => {
  if (window.ethereum) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      return contract;
    } catch (error) {
      console.error("Failed to create contract instance:", error);
    }
  } else {
    alert("MetaMask is not installed!");
    return null;
  }
};


