import { ethers } from "ethers";

/**
 * Calculează prețul mediu de achiziție per $BITS.
 * 
 * @param {string} walletAddress - Adresa utilizatorului
 * @param {Contract} nodeContract - Instanță a contractului Node.sol
 * @returns {Promise<number>} - Prețul mediu pe BITS (în USD, float)
 */
const calculateAveragePurchasePrice = async (walletAddress, nodeContract) => {
  if (!walletAddress || !nodeContract) {
    console.warn("⚠️ Wallet sau contract Node invalid.");
    return 0;
  }

  try {
    const purchases = await nodeContract.getUserPurchases(walletAddress);

    if (!Array.isArray(purchases) || purchases.length === 0) {
      return 0;
    }

    let totalUSD = ethers.BigNumber.from(0);
    let totalBITS = ethers.BigNumber.from(0);

    for (const purchase of purchases) {
      const usd = ethers.BigNumber.from(purchase.usdAmount || 0);
      const bits = ethers.BigNumber.from(purchase.bitsAmount || 0);

      totalUSD = totalUSD.add(usd);
      totalBITS = totalBITS.add(bits);
    }

    if (totalBITS.isZero()) return 0;

    const usdFloat = parseFloat(ethers.utils.formatUnits(totalUSD, 18));
    const bitsFloat = parseFloat(ethers.utils.formatUnits(totalBITS, 18));

    const averagePrice = usdFloat / bitsFloat;
    return averagePrice;
  } catch (err) {
    console.error("❌ [calculateAveragePurchasePrice] Eroare:", err);
    return 0;
  }
};

export default calculateAveragePurchasePrice;
