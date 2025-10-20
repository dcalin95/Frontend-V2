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
    console.log("🔍 [calculateTotalInvestedUSD] Fetching purchases for:", walletAddress);
    const purchases = await nodeContract.getUserPurchases(walletAddress);
    
    console.log("📊 [calculateTotalInvestedUSD] Raw purchases data:", purchases);
    console.log("📊 [calculateTotalInvestedUSD] Purchases length:", purchases?.length);

    if (!Array.isArray(purchases) || purchases.length === 0) {
      console.log("⚠️ [calculateTotalInvestedUSD] No purchases found");
      return 0;
    }

    const totalUSD = purchases.reduce((acc, purchase, index) => {
      // Tuple structure: [timestamp, bitsAmount, usdAmount, address, currency]
      // USD amount is at index [2]
      console.log(`📝 [calculateTotalInvestedUSD] Purchase ${index}:`, {
        timestamp: purchase[0]?.toString(),
        bitsAmount: purchase[1]?.toString(),
        usdAmount: purchase[2]?.toString(),
        address: purchase[3],
        currency: purchase[4]
      });
      
      const amount = ethers.BigNumber.from(purchase[2] || 0); // Changed from purchase.usdAmount to purchase[2]
      console.log(`💰 [calculateTotalInvestedUSD] USD amount ${index}:`, ethers.utils.formatUnits(amount, 18));
      
      return acc.add(amount);
    }, ethers.BigNumber.from(0));

    const totalUSDFormatted = parseFloat(ethers.utils.formatUnits(totalUSD, 18));
    console.log("🎯 [calculateTotalInvestedUSD] TOTAL USD:", totalUSDFormatted);
    
    return totalUSDFormatted;
  } catch (err) {
    console.error("❌ [calculateTotalInvestedUSD] Eroare:", err);
    return 0;
  }
};

export default calculateTotalInvestedUSD;
