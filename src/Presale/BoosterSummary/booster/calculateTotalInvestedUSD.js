import { ethers } from "ethers";

/**
 * Calculează investiția totală în USD din istoricul wallet-ului în Node.sol.
 * @param {string} walletAddress - Adresa utilizatorului
 * @param {Contract} nodeContract - Instanța Node.sol (ethers.Contract)
 * @returns {Promise<number>} - Total investit în USD (float, formatat)
 */
const calculateTotalInvestedUSD = async (walletAddress, nodeContract) => {
  if (!walletAddress || !nodeContract) {
    console.warn("⚠️ Wallet sau Node contract lipsă.");
    return 0;
  }

  try {
    const purchases = await nodeContract.getUserPurchases(walletAddress);

    if (!Array.isArray(purchases) || purchases.length === 0) {
      return 0;
    }

    const totalUSD = purchases.reduce((acc, purchase) => {
      const amount = ethers.BigNumber.from(purchase.usdAmount || 0);
      return acc.add(amount);
    }, ethers.BigNumber.from(0));

    return parseFloat(ethers.utils.formatUnits(totalUSD, 18));
  } catch (err) {
    console.error("❌ [calculateTotalInvestedUSD] Eroare:", err);
    return 0;
  }
};

export default calculateTotalInvestedUSD;
