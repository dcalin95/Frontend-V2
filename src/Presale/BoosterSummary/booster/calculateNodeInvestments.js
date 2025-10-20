const calculateNodeInvestments = async (walletAddress, nodeContract, additionalRewardContract) => {
  try {
    if (!walletAddress || !nodeContract || !additionalRewardContract) {
      console.error("❌ Wallet sau Contract invalid");
      return { totalInvestment: 0, claimableReward: 0 };
    }

    // ✅ corect - USD total investit
    const totalInvestmentBN = await nodeContract.getUserRewardBalance(walletAddress);
    // ✅ corect - bonusul disponibil
    const claimableRewardBN = await additionalRewardContract.calculateClaimableReward(walletAddress);

    const totalInvestment = parseFloat(ethers.utils.formatUnits(totalInvestmentBN, 18));
    const claimableReward = parseFloat(ethers.utils.formatUnits(claimableRewardBN, 18));

    return { totalInvestment, claimableReward };

  } catch (error) {
    console.error("🔥 [calculateNodeInvestments] Error:", error);
    return { totalInvestment: 0, claimableReward: 0 };
  }
};
