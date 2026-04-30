import { ethers } from "ethers";
import erc20ABI from '../abi/erc20ABI.js';

const ETHRECEIVER_ADDRESS = "0x950a2cDADceB2df2f0336c3511bE5F57f81a8523";

export const getETHReceiverContract = (signerOrProvider) => {
  return new ethers.Contract(ETHRECEIVER_ADDRESS, erc20ABI, signerOrProvider);
};

