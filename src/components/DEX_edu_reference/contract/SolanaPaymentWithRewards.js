import { ethers } from "ethers";
import erc20ABI from '../abi/erc20ABI.js';

const SOLANAPAYMENTWITHREWARDS_ADDRESS = "0xc683854D407c6310E7Db03f6bc35E0196c9da340";

export const getSolanaPaymentWithRewardsContract = (signerOrProvider) => {
  return new ethers.Contract(SOLANAPAYMENTWITHREWARDS_ADDRESS, erc20ABI, signerOrProvider);
};

