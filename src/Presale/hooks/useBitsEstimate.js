import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../contract/contracts";
import nodeABI from "../../abi/nodeABI";
import { toBitsInteger, logBITSConversion } from "../../utils/bitsUtils";

const useBitsEstimate = ({ amountPay, selectedToken, tokenPriceUSD, walletAddress, pricePerBitsUSD }) => {
  const [bits, setBits] = useState(0);
  const [usdValue, setUsdValue] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [error, setError] = useState(null);
  const [bitsUnitPriceUSD, setBitsUnitPriceUSD] = useState(pricePerBitsUSD || 0.001);

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

      try {
        // 🌟 Stripe fiat checkout - amountPay already converted to USD
        if (selectedToken === "STRIPE") {
          const usdCalculated = parseFloat(amountPay);
          const effectiveBitsPrice = bitsUnitPriceUSD && bitsUnitPriceUSD > 0 ? bitsUnitPriceUSD : 0.001;
          const bitsAmount = usdCalculated / effectiveBitsPrice;

          const bonusPercent = usdCalculated >= 100 ? 10 : usdCalculated >= 50 ? 5 : 0;
          const baseBitsInteger = toBitsInteger(bitsAmount);
          const bonusAmountCalc = toBitsInteger(baseBitsInteger * (bonusPercent / 100));

          console.log(`🎯 [STRIPE FIAT CHECKOUT]`);
          console.log("USD Amount:", usdCalculated);
          console.log("Bits price (USD):", effectiveBitsPrice);
          console.log("Calculated BITS:", bitsAmount);
          console.log("Bonus %:", bonusPercent);

          if (isNaN(baseBitsInteger) || baseBitsInteger <= 0) {
            console.error("❌ Invalid BITS calculation for Stripe");
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
          const usdCalculated = parseFloat(amountPay); // Amount is already in USD for fiat
          const bitsAmount = usdCalculated / 1.00; // FORCED TO EXACTLY $1.00 PER BITS
          
          // Simple bonus calculation for fiat payments
          const bonusPercent = usdCalculated >= 100 ? 10 : usdCalculated >= 50 ? 5 : 0;
          // 🎯 FIX: Contract sends only INTEGER BITS
          const baseBitsInteger = toBitsInteger(bitsAmount);
          const bonusAmountCalc = toBitsInteger(baseBitsInteger * (bonusPercent / 100));
          // finalBits not needed - UI calculates total from baseBits + bonus separately

          console.log(`🎯 [${selectedToken} FIAT - FORCED $1.00]`);
          console.log(`Amount USD:`, amountPay);
          console.log("USD Value:", usdCalculated);
          console.log("FORCED BITS Price: $1.00 (ignoring contract)");
          console.log("BITS Amount:", bitsAmount);
          console.log("Bonus %:", bonusPercent);
          console.log("BASE BITS (no bonus):", baseBitsInteger);
          console.log("UI will show total:", baseBitsInteger + bonusAmountCalc);

          // Validation
          if (isNaN(baseBitsInteger) || baseBitsInteger <= 0) {
            console.error("❌ Invalid BITS calculation for fiat");
            setError("Invalid BITS calculation");
            console.groupEnd();
            return;
          }

          setBits(baseBitsInteger); // BASE BITS ONLY - UI adds bonus separately!
          setUsdValue(usdCalculated);
          setBonus(bonusPercent);
          setBonusAmount(bonusAmountCalc);
          console.groupEnd();
          return;
        }
        
        // 🌟 Special handling for Solana tokens - direct calculation without BSC contracts
        else if (selectedToken === "SOL" || selectedToken === "USDC-Solana") {
          const usdCalculated = parseFloat(amountPay) * tokenPriceUSD;
          const bitsAmount = usdCalculated / 1.00; // FORCED TO EXACTLY $1.00 PER BITS
          
          // Simple bonus calculation for Solana tokens
          const bonusPercent = usdCalculated >= 100 ? 10 : usdCalculated >= 50 ? 5 : 0;
          // 🎯 FIX: Contract sends only INTEGER BITS
          const baseBitsInteger = toBitsInteger(bitsAmount);
          const bonusAmountCalc = toBitsInteger(baseBitsInteger * (bonusPercent / 100));
          // finalBits not needed - UI calculates total from baseBits + bonus separately

          console.log(`🎯 [${selectedToken} - FORCED $1.00]`);
          console.log(`Amount ${selectedToken}:`, amountPay);
          console.log(`${selectedToken} Price USD:`, tokenPriceUSD);
          console.log("USD Value:", usdCalculated);
          console.log("FORCED BITS Price: $1.00 (ignoring contract)");
          console.log("BITS Amount:", bitsAmount);
          console.log("Bonus %:", bonusPercent);
          console.log("BASE BITS (no bonus):", baseBitsInteger);
          console.log("UI will show total:", baseBitsInteger + bonusAmountCalc);

          // Validation
          if (isNaN(baseBitsInteger) || baseBitsInteger <= 0) {
            console.error(`❌ Invalid BITS calculation for ${selectedToken}`);
            setError("Invalid BITS calculation");
            return;
          }

          setUsdValue(usdCalculated);
          setBonus(bonusPercent);
          setBits(baseBitsInteger); // BASE BITS ONLY - UI adds bonus separately! // Already integer
          setBonusAmount(bonusAmountCalc);
          console.groupEnd();
          return;
        }

        // 🔗 BSC/ETH contract-based calculation - Use stable RPC for reads
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

        // 🔥 CRITICAL: Calculate reward deduction (what Node.sol will subtract)
        console.log("🔥 [REWARD DEDUCTION] Calculating what Node.sol will subtract...");
        let rewardRate = 0;
        let actualBitsToReceive = baseBitsInteger;
        
        try {
          const usdInvested = Math.floor(usdCalculated);
          const userAddress = walletAddress || ethers.constants.AddressZero;
          
          console.log("🔥 [REWARD] Calling previewRateFor with:");
          console.log("  - userAddress:", userAddress);
          console.log("  - usdInvested:", usdInvested);
          
          rewardRate = await additionalRewardContract.previewRateFor(userAddress, usdInvested);
          rewardRate = parseFloat(rewardRate.toString());
          
          console.log("🔥 [REWARD] Reward rate from contract:", rewardRate, "%");
          
          const rewardAmount = Math.floor((baseBitsInteger * rewardRate) / 100);
          actualBitsToReceive = baseBitsInteger - rewardAmount;
          
          console.log("🔥 [REWARD] Base BITS:", baseBitsInteger);
          console.log("🔥 [REWARD] Reward deduction:", rewardAmount, "BITS");
          console.log("🔥 [REWARD] ACTUAL BITS to receive:", actualBitsToReceive);
        } catch (rewardErr) {
          console.warn("⚠️ [REWARD] Failed to get reward rate, using 0%:", rewardErr.message);
          actualBitsToReceive = baseBitsInteger;
        }

        let bitsAmount = actualBitsToReceive; // 🔥 ACTUAL BITS after reward deduction!

        // 🎁 BONUS CALCULATION (Simple for now - can be enhanced later)
        console.log("🎁 [BONUS] Calculating bonus (if any)...");
        const bonusPercent = 0; // No bonus for now - can be added later
        const bonusAmountCalc = 0;
        
        console.log("🟡 [FINAL] ACTUAL BITS to receive:", bitsAmount);
        console.log("🟡 [FINAL] USD value:", usdCalculated);
        console.log("🟡 [FINAL] BITS price used: $", realBitsPrice);
        console.log("🟡 [FINAL] Bonus:", bonusPercent, "%");

        setUsdValue(usdCalculated);
        setBonus(bonusPercent);
        setBits(bitsAmount); // 🔥 ACTUAL BITS after reward deduction!
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
          const bitsAmount = usdCalculated / 1.00; // FORCED TO EXACTLY $1.00 PER BITS
          
          // Simple bonus calculation
          const bonusPercent = usdCalculated >= 100 ? 10 : usdCalculated >= 50 ? 5 : 0;
          // 🎯 FIX: Contract sends only INTEGER BITS
          const baseBitsInteger = toBitsInteger(bitsAmount);
          const bonusAmountCalc = toBitsInteger(baseBitsInteger * (bonusPercent / 100));
          // finalBits not needed - UI calculates total from baseBits + bonus separately

          console.log(`🎯 [FALLBACK ${selectedToken} - FORCED $1.00]:`);
          console.log("- Amount:", amountPay);
          console.log("- Token Price USD:", tokenPriceUSD);
          console.log("- USD Value:", usdCalculated);
          console.log("- FORCED BITS Price: $1.00 (ignoring contract)");
          console.log("- BITS Amount:", bitsAmount);
          console.log("- Bonus %:", bonusPercent);
          console.log("- BASE BITS (no bonus):", baseBitsInteger);
          console.log("- UI will show total:", baseBitsInteger + bonusAmountCalc);

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
          setBits(baseBitsInteger); // BASE BITS ONLY - UI adds bonus separately! // Already integer
          setBonusAmount(bonusAmountCalc);
          setError(null); // Clear error since fallback worked
          setBitsUnitPriceUSD(1.0);
          
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
