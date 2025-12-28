import { ethers } from "ethers";
import { CONTRACTS } from "../../contract/contracts";
import { notifyPresaleBuy } from "../../utils/telegramNotify";

const handleUSDCPayment = async (amountPay, tokensReceive, tokenPriceUSD = 1.0) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const contract = new ethers.Contract(
      CONTRACTS.NODE.address,
      CONTRACTS.NODE.abi,
      signer
    );

    const usdcContract = new ethers.Contract(
      CONTRACTS.USDC.address,
      CONTRACTS.USDC.abi,
      signer
    );

    const rewardContract = new ethers.Contract(
      CONTRACTS.ADDITIONAL_REWARD.address,
      CONTRACTS.ADDITIONAL_REWARD.abi,
      signer
    );

    const amountInWei = ethers.utils.parseUnits(amountPay.toString(), CONTRACTS.USDC.decimals);
    const tokensToReceive = ethers.utils.parseUnits(tokensReceive.toString(), 18);

    console.log("🔁 USDC payment started...");
    console.log("→ Approving USDC for Node contract...");

    const approvalTx = await usdcContract.approve(CONTRACTS.NODE.address, amountInWei);
    await approvalTx.wait();

    console.log("→ Executing Node transaction...");
    const tx = await contract.setCellState(
      await signer.getAddress(),
      CONTRACTS.USDC.address,
      amountInWei,
      tokensToReceive,
      "",
      0,
      0
    );

    const receipt = await tx.wait();
    console.log("✅ USDC payment success:", receipt.transactionHash);

    // 📢 TELEGRAM NOTIFICATION
    const walletAddress = await signer.getAddress();
    const bitsFormatted = parseFloat(tokensReceive).toFixed(2);
    const usdInvested = parseFloat(amountPay);
    await notifyPresaleBuy({
      wallet: walletAddress,
      bits: bitsFormatted,
      usd: Math.round(usdInvested),
      network: 'BSC',
      txHash: receipt.transactionHash
    });

    // 🎁 Bonus
    try {
      const bitsFloat = parseFloat(tokensReceive);
      const usdAmount = bitsFloat * tokenPriceUSD;
      const usdInWei = ethers.utils.parseUnits(usdAmount.toFixed(6), 18);

      console.log(`💵 Calling makeInvestment(${usdInWei})`);
      const bonusTx = await rewardContract.makeInvestment(usdInWei);
      await bonusTx.wait();
      console.log("🎁 Bonus investment recorded");
    } catch (bonusErr) {
      console.warn("⚠️ Bonus failed:", bonusErr.message);
    }

    return receipt.transactionHash;
  } catch (err) {
    console.error("❌ USDC Payment Failed:", err);
    throw err;
  }
};

export default handleUSDCPayment;
