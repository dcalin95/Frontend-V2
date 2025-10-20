import { ethers } from "ethers";
import erc20ABI from '../abi/erc20ABI.js';

const USDRECEIVER_ADDRESS = "0xe74D8E4badd91d8d65225156b0B42a1ADB361A50";

export const getUSDReceiverContract = (signerOrProvider) => {
  return new ethers.Contract(USDRECEIVER_ADDRESS, erc20ABI, signerOrProvider);
};

