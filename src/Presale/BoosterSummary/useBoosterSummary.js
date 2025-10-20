import { useState, useEffect, useContext, useCallback } from "react";
import { ethers } from "ethers";
import WalletContext from "../../context/WalletContext";
import { CONTRACTS } from "../../contract/contracts";

import calculateTotalBits from "./booster/calculateTotalBits";
import calculateReferralBonus from "./booster/calculateReferralBonus";
import calculateTelegramBonus from "./booster/calculateTelegramBonus";
import calculateAdditionalBonus from "./booster/calculateAdditionalBonus";
import calculateTotalInvestedUSD from "./booster/calculateTotalInvestedUSD";
import calculateSolanaInvestments from "./booster/calculateSolanaInvestments";
import calculateInvestedUSDUsingBitsAndPrice from "./booster/calculateInvestedUSDUsingBitsAndPrice";
import getTransactionCount from "./common/getTransactionCount";
import getLastInvestmentDate from "./common/getLastInvestmentDate";
import getCurrentBitsPrice from "./common/getCurrentBitsPrice";
import calculateROI from "./common/calculateROI";
import calculateCurrentInvestmentValue from "./common/calculateCurrentInvestmentValue";
import calculateAveragePurchasePrice from "./booster/calculateAveragePurchasePrice";

export const useBoosterSummary = () => {
  const { walletAddress } = useContext(WalletContext);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalBits: 0,
    investedUSD: 0,
    investedUSDOnSolana: 0,
    referralBonus: 0,
    telegramBonus: 0,
    additionalBonus: 0,
    txCount: 0,
    lastInvestmentDate: null,
    lastPrice: 0,
    currentPrice: 0,
    roiPercent: 0,
    currentInvestmentValue: 0,
    totalUsdFromAdditional: 0,
    bonusCalculatedLocally: 0,
  });

  const fetchData = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const nodeContract = new ethers.Contract(CONTRACTS.NODE.address, CONTRACTS.NODE.abi, provider);
      const referralContract = new ethers.Contract(CONTRACTS.REFERRAL?.address || "", CONTRACTS.REFERRAL?.abi || [], provider);
      const telegramRewardContract = new ethers.Contract(CONTRACTS.TELEGRAM_REWARD.address, CONTRACTS.TELEGRAM_REWARD.abi, provider);
      const additionalRewardContract = new ethers.Contract(CONTRACTS.ADDITIONAL_REWARD.address, CONTRACTS.ADDITIONAL_REWARD.abi, provider);

      const [
        totalBits,
        referralBonus,
        telegramBonus,
        additionalBonus,
        txCount,
        currentPrice,
        averagePriceFromNode,
        investedUSDFromNode,
        rawTotalUsdFromAdditional
      ] = await Promise.all([
        calculateTotalBits(walletAddress, nodeContract),
        calculateReferralBonus(walletAddress, referralContract),
        calculateTelegramBonus(walletAddress, telegramRewardContract),
        calculateAdditionalBonus(walletAddress, additionalRewardContract),
        getTransactionCount(walletAddress, nodeContract),
        getCurrentBitsPrice(provider, walletAddress),
        calculateAveragePurchasePrice(walletAddress, nodeContract),
        calculateTotalInvestedUSD(walletAddress, nodeContract),
        additionalRewardContract.getTotalInvestment(walletAddress)
      ]);

      let totalUsdFromAdditional = 0;

      try {
        const rawStr = rawTotalUsdFromAdditional.toString();

        if (rawStr.length > 12) {
          totalUsdFromAdditional = parseFloat(ethers.utils.formatUnits(rawStr, 18));
        } else {
          totalUsdFromAdditional = parseFloat(rawStr);
        }

        console.log("📊 Parsed totalUsdFromAdditional:", totalUsdFromAdditional);
      } catch (err) {
        console.error("❌ Could not safely parse totalUsdFromAdditional:", err);
      }

      // Bonus logic
      let bonusPercentExtra = 0;
      if (totalUsdFromAdditional >= 2500) bonusPercentExtra = 15;
      else if (totalUsdFromAdditional >= 1000) bonusPercentExtra = 10;
      else if (totalUsdFromAdditional >= 500) bonusPercentExtra = 7;
      else if (totalUsdFromAdditional >= 250) bonusPercentExtra = 5;

      const bonusBitsExtra = (totalBits * bonusPercentExtra) / 100;
      const lastInvestment = await getLastInvestmentDate(walletAddress, nodeContract);

      let investedUSD = investedUSDFromNode || 0;

      if (!investedUSD && totalBits && averagePriceFromNode) {
        investedUSD = await calculateInvestedUSDUsingBitsAndPrice(totalBits, averagePriceFromNode);
      }

      const currentInvestmentValue = calculateCurrentInvestmentValue(totalBits, currentPrice);
      const roiPercent = calculateROI(averagePriceFromNode, currentPrice);

      setData({
        totalBits: totalBits || 0,
        realInvestedUSD: investedUSDFromNode || 0,
        investedUSD,
        investedUSDOnSolana: 0,
        referralBonus: referralBonus || 0,
        telegramBonus: telegramBonus || 0,
        additionalBonus: additionalBonus || 0,
        bonusCalculatedLocally: bonusBitsExtra || 0,
        totalUsdFromAdditional: totalUsdFromAdditional || 0,
        txCount: txCount || 0,
        lastInvestmentDate: lastInvestment?.date || null,
        lastInvestmentUSD: lastInvestment?.usd || 0,
        lastInvestmentSource: lastInvestment?.source || "N/A",
        lastPrice: averagePriceFromNode || 0,
        currentPrice: currentPrice || 0,
        roiPercent,
        currentInvestmentValue,
      });
    } catch (err) {
      console.error("❌ [useBoosterSummary] error:", err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      fetchData();
      window.ethereum?.on("chainChanged", fetchData);
      window.ethereum?.on("accountsChanged", fetchData);
    }

    return () => {
      window.ethereum?.removeListener("chainChanged", fetchData);
      window.ethereum?.removeListener("accountsChanged", fetchData);
    };
  }, [walletAddress, fetchData]);

  return { loading, data, refetchData: fetchData };
};

export default useBoosterSummary;
