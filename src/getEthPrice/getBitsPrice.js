// src/getEthPrice/getBitsPrice.js
import { ethers } from "ethers";
import { getContractInstance } from "../contract/getContract";

/**
 * Fetches the current price of BITS in USD from CellManager
 * @returns {Promise<number>} pricePerBitsUSD
 */
export const fetchBitsPrice = async () => {
  try {
    const cellManager = await getContractInstance("CELL_MANAGER");

    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    const wallet = await signer.getAddress();

    const rawPrice = await cellManager.getCurrentOpenCellPrice(wallet); // uint256
    const price = parseFloat(ethers.utils.formatUnits(rawPrice, 18));

    return price;
  } catch (err) {
    console.error("❌ Error in fetchBitsPrice:", err);
    return null;
  }
};

