// src/Presale/BoosterSummary/common/getTransactionCount.js
import { ethers } from "ethers";

const getTransactionCount = async (walletAddress, nodeContract) => {
  try {
    const count = await nodeContract.getUserTransactionCount(walletAddress);
    return ethers.BigNumber.from(count).toNumber();
  } catch (err) {
    console.error("❌ [getTransactionCount - Node] Error:", err.message);
    return 0;
  }
};

export default getTransactionCount;
