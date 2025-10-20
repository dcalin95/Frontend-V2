import { ethers } from "ethers";
const calculateSolanaInvestments = async (walletAddress, nodeContract) => {
  try {
    if (!walletAddress || !nodeContract) {
      console.warn("⚠️ [SolanaInvestments] Adresă sau contract invalid");
      return 0;
    }

    const allPurchases = await nodeContract.getUserPurchases(walletAddress);
    const solanaTxs = allPurchases.filter((p) => p.paymentSource === "SOLANA");

    const totalUSD = solanaTxs.reduce((sum, tx) => {
      return sum + parseFloat(ethers.utils.formatUnits(tx.usdAmount, 18));
    }, 0);

    console.log(`✅ [SolanaInvestments] ${walletAddress} → ${totalUSD.toFixed(2)} USD via SOLANA`);
    return totalUSD;
  } catch (error) {
    console.error("❌ [SolanaInvestments] Eroare:", error);
    return 0;
  }
};

export default calculateSolanaInvestments;
