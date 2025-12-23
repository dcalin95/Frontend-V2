// src/Presale/hooks/useBNBRequiredForBits.js
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../contract/contracts";

const useBNBRequiredForBits = (bitsDesired, walletAddress) => {
  const [bnbRequired, setBnbRequired] = useState(0);
  const [usdValue, setUsdValue] = useState(0);
  const [bonusPercent, setBonusPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEstimation = async () => {
      setLoading(true);
      setError(null);

      try {
        if (
          !bitsDesired ||
          isNaN(bitsDesired) ||
          bitsDesired <= 0 ||
          !walletAddress
        ) {
          setBnbRequired(0);
          setUsdValue(0);
          setBonusPercent(0);
          return;
        }

        // 🛑 CRITICAL FIX: DO NOT use window.ethereum for estimation
        // Use a public RPC provider to avoid Phantom/MetaMask popup
        const rpcUrl = "https://bsc-dataseed1.binance.org"; // BSC Mainnet
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

        const cellManagerAbi = [
          "function getCurrentOpenCellId() view returns (uint256)",
          "function getCurrentOpenCellPrice(address wallet) view returns (uint256)",
          "function getPriceForAmount(uint256 cellId, uint256 amount) view returns (uint256)"
        ];
        const cellManager = new ethers.Contract(
          CONTRACTS.CELL_MANAGER.address,
          cellManagerAbi,
          provider
        );

        const cellId = await cellManager.getCurrentOpenCellId();

        // 🧾 Prețul total în BNB (wei)
        const priceInWei = await cellManager.getPriceForAmount(
          cellId,
          ethers.utils.parseUnits(bitsDesired.toString(), 18)
        );

        // Use a dummy address if walletAddress is not available, but since it's a view call, dummy is fine
        const dummyWallet = walletAddress || "0x0000000000000000000000000000000000000001";
        const bitsPriceRaw = await cellManager.getCurrentOpenCellPrice(dummyWallet); // USD * 1000
        let bitsPriceUSD = parseFloat(bitsPriceRaw.toString()) / 1000;
        
        // 🎯 FIX: Force $1.00 BITS price if contract returns wrong value
        if (bitsPriceUSD < 0.50) {
          console.log("🚨 [useBNBRequiredForBits] Contract returned too low BITS price:", bitsPriceUSD, "→ Forcing $1.00");
          bitsPriceUSD = 1.00;
        }

        const usdTotal = bitsDesired * bitsPriceUSD;

        // 🔥 Bonus logic
        const bonus =
          usdTotal >= 2500 ? 15 :
          usdTotal >= 1000 ? 10 :
          usdTotal >= 500 ? 7 :
          usdTotal >= 250 ? 5 : 0;

        const adjustedBits = bitsDesired / (1 + bonus / 100); // eliminăm bonusul
        const usdPay = adjustedBits * bitsPriceUSD;

        const bnbAmount = parseFloat(ethers.utils.formatEther(priceInWei));

        setBnbRequired(bnbAmount);
        setUsdValue(parseFloat(usdPay.toFixed(2)));
        setBonusPercent(bonus);
      } catch (err) {
        console.error("❌ [useBNBRequiredForBits] error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEstimation();
  }, [bitsDesired, walletAddress]);

  return {
    bnbRequired,
    usdValue,
    bonusPercent,
    loading,
    error
  };
};

export default useBNBRequiredForBits;
