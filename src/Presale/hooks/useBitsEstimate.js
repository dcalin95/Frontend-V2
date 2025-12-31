import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../contract/contracts";
import nodeABI from "../../abi/nodeABI";
import { toBitsInteger, logBITSConversion } from "../../utils/bitsUtils";
import PRESALE_CONFIG from "../../config/presaleConfig";

const useBitsEstimate = ({ amountPay, selectedToken, tokenPriceUSD, walletAddress, pricePerBitsUSD }) => {
  const [bits, setBits] = useState(0);
  const [usdValue, setUsdValue] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [error, setError] = useState(null);
  const [bitsUnitPriceUSD, setBitsUnitPriceUSD] = useState(pricePerBitsUSD || PRESALE_CONFIG.DEFAULT_BITS_PRICE_USD);

  useEffect(() => {
    const estimate = async () => {
      console.group("📊 [useBitsEstimate] Debug Start");
      console.log("🚨 [CRITICAL DEBUG] useBitsEstimate called with:", {
        amountPay,
        selectedToken,
        tokenPriceUSD,
        walletAddress,
        pricePerBitsUSD
      });
      setError(null);

      if (!amountPay || isNaN(amountPay) || amountPay <= 0 || !selectedToken) {
        console.warn("⚠️ Missing or invalid amount/token");
        setBits(0);
        setUsdValue(0);
        setBonus(0);
        setBonusAmount(0);
        console.groupEnd();
        return;
      }

      // 🔥 DEFAULT BITS PRICE (0.00065 USD) - if contract fetch fails or not BSC
      const DEFAULT_BITS_PRICE = 0.00065;
      let effectiveBitsPrice = pricePerBitsUSD || DEFAULT_BITS_PRICE;

      try {
        // 🌟 Stripe fiat checkout - amountPay already converted to USD
        if (selectedToken === "STRIPE") {
          const usdCalculated = parseFloat(amountPay);
          const bitsAmount = usdCalculated / effectiveBitsPrice;

          // Unified Bonus Tiers
          const bonusPercent = usdCalculated >= 500 ? 20 : usdCalculated >= 250 ? 15 : usdCalculated >= 100 ? 10 : usdCalculated >= 50 ? 5 : 0;
          const baseBitsInteger = toBitsInteger(bitsAmount);
          const bonusAmountCalc = toBitsInteger(baseBitsInteger * (bonusPercent / 100));

          console.log(`🎯 [STRIPE FIAT CHECKOUT]`, { usdCalculated, effectiveBitsPrice, bitsAmount, bonusPercent });

          if (isNaN(baseBitsInteger) || baseBitsInteger <= 0) {
            setError("Invalid BITS calculation");
            console.groupEnd();
            return;
          }

          setBits(baseBitsInteger);
          setUsdValue(usdCalculated);
          setBonus(bonusPercent);
          setBonusAmount(bonusAmountCalc);
          setBitsUnitPriceUSD(effectiveBitsPrice);
          console.groupEnd();
          return;
        }

        // 🌟 Special handling for Fiat tokens - treat amount as USD directly
        if (selectedToken === "NOWPAY" || selectedToken === "TRANSAK" || selectedToken === "MOONPAY") {
          const usdCalculated = parseFloat(amountPay);
          const bitsAmount = usdCalculated / effectiveBitsPrice;
          
          const bonusPercent = usdCalculated >= 500 ? 20 : usdCalculated >= 250 ? 15 : usdCalculated >= 100 ? 10 : usdCalculated >= 50 ? 5 : 0;
          const baseBitsInteger = toBitsInteger(bitsAmount);
          const bonusAmountCalc = toBitsInteger(baseBitsInteger * (bonusPercent / 100));

          console.log(`🎯 [${selectedToken} FIAT]`, { usdCalculated, effectiveBitsPrice, bitsAmount, bonusPercent });

          if (isNaN(baseBitsInteger) || baseBitsInteger <= 0) {
            setError("Invalid BITS calculation");
            console.groupEnd();
            return;
          }

          setBits(baseBitsInteger);
          setUsdValue(usdCalculated);
          setBonus(bonusPercent);
          setBonusAmount(bonusAmountCalc);
          setBitsUnitPriceUSD(effectiveBitsPrice);
          console.groupEnd();
          return;
        }
        
        // 🌟 Special handling for Solana tokens
        else if (selectedToken === "SOL" || selectedToken === "USDC-Solana") {
          const usdCalculated = parseFloat(amountPay) * tokenPriceUSD;
          const bitsAmount = usdCalculated / effectiveBitsPrice;
          
          const bonusPercent = usdCalculated >= 500 ? 20 : usdCalculated >= 250 ? 15 : usdCalculated >= 100 ? 10 : usdCalculated >= 50 ? 5 : 0;
          const baseBitsInteger = toBitsInteger(bitsAmount);
          const bonusAmountCalc = toBitsInteger(baseBitsInteger * (bonusPercent / 100));

          console.log(`🎯 [${selectedToken} SOLANA]`, { usdCalculated, effectiveBitsPrice, bitsAmount, bonusPercent });

          if (isNaN(baseBitsInteger) || baseBitsInteger <= 0) {
            setError("Invalid BITS calculation");
            console.groupEnd();
            return;
          }

          setUsdValue(usdCalculated);
          setBonus(bonusPercent);
          setBits(baseBitsInteger);
          setBonusAmount(bonusAmountCalc);
          setBitsUnitPriceUSD(effectiveBitsPrice);
          console.groupEnd();
          return;
        }

        // 🔗 BSC/ETH contract-based calculation
        console.log("🚨 [ROUTE] Taking BSC/ETH contract calculation path");
        console.log("🚨 [INPUT] amountPay:", amountPay);
        console.log("🚨 [INPUT] selectedToken:", selectedToken);
        console.log("🚨 [INPUT] tokenPriceUSD:", tokenPriceUSD);
        console.log("🚨 [INPUT] pricePerBitsUSD:", pricePerBitsUSD);
        const rpcEndpoints = [
          "https://bsc-dataseed1.binance.org",
          "https://bsc-dataseed2.binance.org",
          "https://bsc-dataseed3.binance.org",
          "https://bsc-dataseed4.binance.org",
          "https://bsc-dataseed1.defibit.io",
          "https://bsc-dataseed2.defibit.io"
        ];
        
        let provider = null;
        let rpcError = null;
        
        // Try multiple RPC endpoints for stability
        for (const rpcUrl of rpcEndpoints) {
          try {
            console.log("🌐 [RPC] Trying endpoint:", rpcUrl);
            provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            
            // Test the connection with a simple call
            const blockNumber = await provider.getBlockNumber();
            console.log("✅ [RPC] Successfully connected to:", rpcUrl);
            console.log("✅ [RPC] Block number:", blockNumber);
            break;
          } catch (rpcErr) {
            console.warn("⚠️ [RPC] Failed endpoint:", rpcUrl, rpcErr.message);
            rpcError = rpcErr;
            provider = null;
          }
        }
        
        if (!provider) {
          console.error("❌ [RPC] All endpoints failed, falling back to MetaMask");
          // Fallback to MetaMask if all RPC endpoints fail
          if (window.ethereum) {
            provider = new ethers.providers.Web3Provider(window.ethereum);
          } else {
            throw new Error("No provider available - all RPC endpoints failed and MetaMask not detected");
          }
        }

        const cellManagerAbi = [
          "function getCurrentOpenCellId() view returns (uint256)",
          "function getCurrentOpenCellPrice(address) view returns (uint256)",
          "function checkBNBPrice() view returns (uint256)"
        ];
        
        const additionalRewardAbi = [
          "function previewRateFor(address user, uint256 usdInvested) view returns (uint256)"
        ];

        const cellManager = new ethers.Contract(CONTRACTS.CELL_MANAGER.address, cellManagerAbi, provider);
        const nodeContract = new ethers.Contract(CONTRACTS.NODE.address, nodeABI, provider);
        const additionalRewardContract = new ethers.Contract(CONTRACTS.ADDITIONAL_REWARD.address, additionalRewardAbi, provider);

        console.log("🟡 [CONTRACTS] Cell Manager address:", CONTRACTS.CELL_MANAGER.address);
        console.log("🟡 [CONTRACTS] Node address:", CONTRACTS.NODE.address);
        console.log("🟡 [CONTRACTS] Contracts created successfully");
        console.log("🟡 [CONTRACTS] About to call getCurrentOpenCellId...");
        
        const cellId = await cellManager.getCurrentOpenCellId();
        console.log("🟡 [CONTRACTS] Current cell ID:", cellId.toString());
        
        const amountInWei = ethers.utils.parseEther(amountPay.toString());
        console.log("🟡 [CONTRACTS] Amount in Wei:", amountInWei.toString());

        // 🔥 GET REAL BITS PRICE FROM CELLMANAGER
        console.log("🔥 [PRICE] Getting real BITS price from CellManager...");
        const milicentsPrice = await cellManager.getCurrentOpenCellPrice(walletAddress || ethers.constants.AddressZero);
        const realBitsPrice = parseFloat(milicentsPrice.toString()) / 1000; // milicents to USD
        console.log("🔥 [PRICE] Milicents from contract:", milicentsPrice.toString());
        console.log("🔥 [PRICE] Real BITS price: $", realBitsPrice);
        setBitsUnitPriceUSD(realBitsPrice);

        // 🧮 CALCULATE USD VALUE AND BASE BITS
        const usdCalculated = parseFloat(amountPay) * tokenPriceUSD;
        const baseBitsFloat = usdCalculated / realBitsPrice;
        const baseBitsInteger = Math.floor(baseBitsFloat); // No decimals - contract uses integers
        
        console.log("💰 [CALC] USD value:", usdCalculated);
        console.log("💰 [CALC] Base BITS (float):", baseBitsFloat);
        console.log("💰 [CALC] Base BITS (integer):", baseBitsInteger);

        // 🔥 UNIFIED BONUS CALCULATION
        console.log("🎁 [BONUS] Applying unified bonus tiers...");
        const bonusPercent = usdCalculated >= 500 ? 20 : usdCalculated >= 250 ? 15 : usdCalculated >= 100 ? 10 : usdCalculated >= 50 ? 5 : 0;
        const bonusAmountCalc = Math.floor((baseBitsInteger * bonusPercent) / 100);
        
        // actual bits to receive (base only, UI adds bonus)
        const bitsAmount = baseBitsInteger;

        console.log("🟡 [FINAL] BASE BITS to receive:", bitsAmount);
        console.log("🟡 [FINAL] USD value:", usdCalculated);
        console.log("🟡 [FINAL] BITS price used: $", realBitsPrice);
        console.log("🟡 [FINAL] Bonus:", bonusPercent, "%", `(${bonusAmountCalc} BITS)`);

        setUsdValue(usdCalculated);
        setBonus(bonusPercent);
        setBits(bitsAmount); 
        setBonusAmount(bonusAmountCalc);
      } catch (err) {
        console.error("❌ [useBitsEstimate] BLOCKCHAIN ERROR Details:");
        console.error("- Error message:", err.message || err);
        console.error("- Error code:", err.code);
        console.error("- Error data:", err.data);
        console.error("- Full error object:", err);
        console.error("- Stack trace:", err.stack);
        console.error("- selectedToken was:", selectedToken);
        console.error("- amountPay was:", amountPay);
        console.error("- Contract addresses:");
        console.error("  - CELL_MANAGER:", CONTRACTS?.CELL_MANAGER?.address);
        console.error("  - NODE:", CONTRACTS?.NODE?.address);
        
        console.warn("🔄 [FALLBACK] Blockchain failed, using fallback calculation...");
        
        // 🚨 FALLBACK CALCULATION - Simple USD-based calculation
        try {
          const usdCalculated = parseFloat(amountPay) * tokenPriceUSD;
          const bitsAmount = usdCalculated / effectiveBitsPrice;
          
          // Simple bonus calculation
          const bonusPercent = usdCalculated >= 500 ? 20 : usdCalculated >= 250 ? 15 : usdCalculated >= 100 ? 10 : usdCalculated >= 50 ? 5 : 0;
          const baseBitsInteger = toBitsInteger(bitsAmount);
          const bonusAmountCalc = toBitsInteger(baseBitsInteger * (bonusPercent / 100));

          console.log(`🎯 [FALLBACK ${selectedToken}]:`, { usdCalculated, bitsAmount, bonusPercent });

          if (isNaN(baseBitsInteger) || baseBitsInteger <= 0) {
            console.error("❌ Fallback calculation also failed");
            setError("Failed to calculate BITS");
            setBits(0);
            setUsdValue(0);
            setBonus(0);
            setBonusAmount(0);
            return;
          }

          setUsdValue(usdCalculated);
          setBonus(bonusPercent);
          setBits(baseBitsInteger); 
          setBonusAmount(bonusAmountCalc);
          setError(null); // Clear error since fallback worked
          setBitsUnitPriceUSD(effectiveBitsPrice);
          
          console.log("✅ [FALLBACK] Calculation successful");
        } catch (fallbackErr) {
          console.error("❌ [FALLBACK] Even fallback failed:", fallbackErr);
          setError(err.message || "Failed to calculate BITS");
          setBits(0);
          setUsdValue(0);
          setBonus(0);
          setBonusAmount(0);
        }
      }

      console.groupEnd();
    };

    estimate();
  }, [amountPay, selectedToken, tokenPriceUSD, walletAddress, pricePerBitsUSD]);

  return { bits, usdValue, bonus, bonusAmount, error, bitsUnitPriceUSD };
};

export default useBitsEstimate;
