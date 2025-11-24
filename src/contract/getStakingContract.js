import { ethers } from "ethers";
import stakingABI from "../abi/stakingABI"; // asigură-te că acest path este corect
import { getRobustProvider, executeWithFallback } from "../utils/rpcFallback";

// BSC Mainnet address (CORRECT)
const STAKING_ADDRESS = "0xF1fd04dB28545C5d5d2f2a7709135839B22984de";

/**
 * Get staking contract with RPC fallback support
 * @param {ethers.Signer | ethers.providers.Provider} signerOrProvider
 * @param {boolean} useRobustRPC - Use fallback RPC for read operations
 * @returns {Promise<ethers.Contract>|ethers.Contract} Contract instance
 */
export const getStakingContract = (signerOrProvider, useRobustRPC = false) => {
  if (useRobustRPC) {
    // Return async contract with robust RPC
    return getRobustProvider().then(provider => 
      new ethers.Contract(STAKING_ADDRESS, stakingABI, provider)
    );
  }
  
  // Legacy sync behavior
  return new ethers.Contract(STAKING_ADDRESS, stakingABI, signerOrProvider);
};

/**
 * Execute staking contract call with RPC fallback
 * @param {Function} contractCallFn - Function that takes contract and returns promise
 * @returns {Promise} Result of contract call
 */
export const executeStakingCall = async (contractCallFn) => {
  return executeWithFallback(async (provider) => {
    const contract = new ethers.Contract(STAKING_ADDRESS, stakingABI, provider);
    return await contractCallFn(contract);
  });
};
