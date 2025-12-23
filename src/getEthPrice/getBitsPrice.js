// src/getEthPrice/getBitsPrice.js
import { ethers } from "ethers";
import { getContractInstance } from "../contract/getContract";

/**
 * Fetches the current price of BITS in USD from CellManager
 * @returns {Promise<number>} pricePerBitsUSD
 */
export const fetchBitsPrice = async () => {
  try {
    // 🛑 CRITICAL FIX: Use read-only instance (needsSigner = false)
    // This prevents the wallet popup from appearing during price fetch
    const cellManager = await getContractInstance("CELL_MANAGER", false);

    // 🌐 Use a dummy address for the price query to avoid requesting wallet access
    const dummyWallet = "0x0000000000000000000000000000000000000001";

    const rawPrice = await cellManager.getCurrentBitsPriceUSD(dummyWallet); // uint256
    const price = parseFloat(ethers.utils.formatUnits(rawPrice, 18));

    console.log("💰 [fetchBitsPrice] BITS Price from contract:", price);
    return price;
  } catch (err) {
    console.error("❌ Error in fetchBitsPrice:", err);
    // Fallback to a safe default if contract call fails
    return 0.00065; 
  }
};

