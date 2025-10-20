// C:\Users\cezar\Desktop\frontend\src\Presale\BoosterSummary\common\getCurrentBitsPrice.js

import { ethers } from "ethers";
import { CONTRACTS } from "../../../contract/contracts";

/**
 * Fetch current BITS price (in USD) from CellManager contract
 * @param {ethers.providers.Provider} provider 
 * @param {string} walletAddress 
 * @returns {Promise<number>} current price in USD (e.g. 0.129)
 */
const getCurrentBitsPrice = async (provider, walletAddress) => {
  try {
    if (!provider || !walletAddress) {
      console.warn("Missing provider or wallet");
      return 0;
    }

    const contract = new ethers.Contract(
      CONTRACTS.CELL_MANAGER.address,
      CONTRACTS.CELL_MANAGER.abi,
      provider
    );

    const rawPrice = await contract.getCurrentBitsPriceUSD(walletAddress); // returns price in millicents
    const price = parseFloat(ethers.utils.formatUnits(rawPrice, 3)); // divide by 1000

    return price;
  } catch (error) {
    console.error("❌ [getCurrentBitsPrice] Failed to fetch price:", error);
    return 0;
  }
};

export default getCurrentBitsPrice;
