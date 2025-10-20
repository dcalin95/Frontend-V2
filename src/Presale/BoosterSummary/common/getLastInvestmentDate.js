import { ethers } from "ethers";

const getLastInvestmentDate = async (walletAddress, nodeContract) => {
  try {
    const purchases = await nodeContract.getUserPurchases(walletAddress);
    if (!purchases || purchases.length === 0) {
      console.log("ℹ️ No purchases found.");
      return null;
    }

    const last = purchases[purchases.length - 1];

    const timestamp = ethers.BigNumber.from(last.timestamp).toNumber();
    const usd = parseFloat(ethers.utils.formatUnits(last.usdAmount, 18));
    const source = last.paymentSource;

    console.log("📦 Last purchase:", { timestamp, usd, source });

    return {
      date: new Date(timestamp * 1000),
      usd: usd,
      source: source,
    };
  } catch (err) {
    console.error("❌ [getLastInvestmentDate] Error:", err.message);
    return null;
  }
};

export default getLastInvestmentDate;
