// src/Presale/hooks/useCalculateSolanaBITS.js
import { useEffect } from "react";
import { toBitsInteger, logBITSConversion } from "../../utils/bitsUtils";

const calculateBonus = (usd) => {
  if (usd >= 2500) return 15;
  if (usd >= 1000) return 10;
  if (usd >= 500) return 7;
  if (usd >= 250) return 5;
  return 0;
};

const useCalculateSolanaBITS = ({
  selectedToken,
  amountPay,
  walletAddress,
  tokenPrices,
  setTokensReceive,
  setBonusPercent,
  updateProgress,
  fetchBitsPrice,
}) => {
  useEffect(() => {
    const calculate = async () => {
      if (
        selectedToken !== "SOL" ||
        !walletAddress ||
        !amountPay ||
        isNaN(Number(amountPay)) ||
        Number(amountPay) <= 0
      ) {
        setTokensReceive(0);
        setBonusPercent(0);
        updateProgress(0);
        return;
      }

      try {
        const solPrice = tokenPrices?.SOL?.price;
        const bitsPriceUSD = await fetchBitsPrice(walletAddress);

        if (!solPrice || !bitsPriceUSD || solPrice <= 0 || bitsPriceUSD <= 0) {
          console.warn("⚠️ Missing SOL price or bitsPriceUSD");
          return;
        }

        const usdAmount = parseFloat(amountPay) * solPrice;
        const baseBits = usdAmount / bitsPriceUSD;
        const bonus = calculateBonus(usdAmount);
        const totalBitsFloat = baseBits * (1 + bonus / 100);
        
        // Convert to integer BITS for node.sol compatibility
        const totalBitsInteger = toBitsInteger(totalBitsFloat);

        console.log(`🧮 [SOL→BITS] ${amountPay} SOL × $${solPrice} = $${usdAmount}`);
        console.log(`🎯 bits @ $${bitsPriceUSD}: ${baseBits.toFixed(3)} + ${bonus}% = ${totalBitsFloat.toFixed(3)} BITS`);
        logBITSConversion(totalBitsFloat, "SOL calculation");

        setTokensReceive(totalBitsInteger); // Use integer value
        setBonusPercent(bonus);
        updateProgress(usdAmount);
      } catch (err) {
        console.error("❌ Error calculating BITS from SOL:", err);
        setTokensReceive(0);
        setBonusPercent(0);
        updateProgress(0);
      }
    };

    calculate();
  }, [selectedToken, amountPay, walletAddress, tokenPrices, fetchBitsPrice, updateProgress]);
};

export default useCalculateSolanaBITS;
