import { ethers } from "ethers";
import erc20ABI from '../abi/erc20ABI.js';

const TOKENRECEIVER_ADDRESS = "0xeB84453C4c473052e4184A2b5c450Bce946Ffba8";

export const getTokenReceiverContract = (signerOrProvider) => {
  return new ethers.Contract(TOKENRECEIVER_ADDRESS, erc20ABI, signerOrProvider);
};

