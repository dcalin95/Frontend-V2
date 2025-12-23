import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_MAP } from "../../../contract/contractMap";

/**
 * Hook for fetching current BITS price (in USD) from CellManager contract
 * @param {string} walletAddress 
 * @returns {object} { price, loading, error }
 */
export const useBitsPrice = (walletAddress) => {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPrice() {
      console.log("💰 [useBitsPrice] USING PULA TA'S SOLUTION! 🎯");
      
      try {
        setLoading(true);
        setError(null);

        if (!walletAddress) {
          setPrice(null);
          setLoading(false);
          return;
        }

        // 🎯 EXACT COPY FROM PAYMENTBOX - CREATE OWN PROVIDER!
        const IS_TESTNET = false; // BSC MAINNET
        const provider = new ethers.providers.JsonRpcProvider(
          IS_TESTNET
            ? "https://data-seed-prebsc-1-s1.binance.org:8545/"
            : "https://bsc-dataseed1.binance.org"
        );

        const abi = [
          "function getCurrentBitsPriceUSD() view returns (uint256)",
          "function getCurrentOpenCellId() view returns (uint256)",
          "function getCell(uint256) view returns (bool, uint8, uint256, uint256, uint256, uint256)"
        ];

        const contract = new ethers.Contract(CONTRACT_MAP.CELL_MANAGER.address, abi, provider);

        console.log("💰 [useBitsPrice] Fetching current open cell ID...");
        const cellId = await contract.getCurrentOpenCellId();
        console.log("✅ Open Cell ID:", cellId.toString());
        
        console.log("💰 [useBitsPrice] Getting cell data...");
        const cell = await contract.getCell(cellId);
        console.log("✅ Cell data:", cell);
        
        // Extract price from cell[2] and divide by 1000
        const standardPriceRaw = cell[2];
        let standardPrice = parseFloat((standardPriceRaw / 1000).toFixed(3));
        
        console.log("🚨 [useBitsPrice] Raw price from cell[2]:", standardPriceRaw.toString());
        console.log("🚨 [useBitsPrice] Final price:", standardPrice);
        
        setPrice(standardPrice);
      } catch (err) {
        console.error("❌ [useBitsPrice] Failed to fetch price:", err);
        setError("BITS price unavailable");
        setPrice(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPrice();
  }, [walletAddress]);

  return { price, loading, error };
};

/**
 * Legacy function wrapper for backwards compatibility
 * @param {ethers.providers.Provider} provider 
 * @param {string} walletAddress 
 * @returns {Promise<number>} current price in USD (e.g. 0.129)
 */
const getCurrentBitsPrice = async (provider, walletAddress) => {
  console.log("💰 [getCurrentBitsPrice] COPYING GPT2 CHILD EXACTLY! 🤖");
  console.log("💰 [getCurrentBitsPrice] Wallet:", walletAddress || 'READ-ONLY MODE (no wallet needed)');
  console.log("💰 [getCurrentBitsPrice] CellManager address:", CONTRACT_MAP.CELL_MANAGER.address);

  try {
    // ✅ NO WALLET CHECK - This is a read-only contract call!
    
    // 🎯 EXACT COPY FROM GPT2 CHILD - CREATE OWN PROVIDER!
    console.log("💰 [getCurrentBitsPrice] Creating DIRECT PROVIDER like GPT2 child...");
    const IS_TESTNET = false; // BSC MAINNET

    const directProvider = new ethers.providers.JsonRpcProvider(
      IS_TESTNET
        ? "https://data-seed-prebsc-1-s1.binance.org:8545/"
        : "https://bsc-dataseed1.binance.org"
    );

    // 🎯 EXACT ABI FROM GPT2 CHILD!
    const workingAbi = [
      "function getCurrentBitsPriceUSD() view returns (uint256)",
      "function getCurrentOpenCellId() view returns (uint256)",
      "function getCell(uint256) view returns (bool, uint8, uint256, uint256, uint256, uint256)"
    ];

    const contract = new ethers.Contract(
      CONTRACT_MAP.CELL_MANAGER.address,
      workingAbi,
      directProvider // Using DIRECT provider like GPT2 child!
    );

    console.log("💰 [getCurrentBitsPrice] USING GPT2 CHILD'S METHOD...");

    // 🤖 Method from GPT2 Child: getCurrentOpenCellId + getCell
    try {
      console.log("💰 [getCurrentBitsPrice] Step 1: Get current open cell ID...");
      const cellId = await contract.getCurrentOpenCellId();
      console.log("✅ Open Cell ID:", cellId.toString());
      
      console.log("💰 [getCurrentBitsPrice] Step 2: Get cell data...");
      const cell = await contract.getCell(cellId);
      console.log("✅ Cell data:", cell);
      
      // GPT2 Child's logic: cell[2] is the price, divided by 1000
      const standardPriceRaw = cell[2];
      let standardPrice = parseFloat((standardPriceRaw / 1000).toFixed(3));
      
      console.log("🚨 [GPT2 LOGIC] Raw price from cell[2]:", standardPriceRaw.toString());
      console.log("🚨 [GPT2 LOGIC] Raw price / 1000:", standardPriceRaw / 1000);
      console.log("🚨 [GPT2 LOGIC] Final price:", standardPrice);
      
      if (standardPrice > 0) {
        console.log("✅ [getCurrentBitsPrice] SUCCESS via GPT2 CHILD METHOD:", standardPrice);
        return standardPrice;
      }
    } catch (gpt2Error) {
      console.error("❌ GPT2 Child method failed FULL ERROR:", gpt2Error);
      console.log("❌ GPT2 Child method failed MESSAGE:", gpt2Error.message);
    }

    // 🎯 Let's try different function names that might exist
    console.log("💰 [getCurrentBitsPrice] Trying alternative function names...");
    
    // Try 1: getCurrentCell instead of getCurrentOpenCellId
    try {
      console.log("💰 Trying getCurrentCell...");
      const currentCell = await contract.getCurrentCell();
      console.log("✅ getCurrentCell result:", currentCell.toString());
      
      // If it returns a cell object directly
      if (currentCell && currentCell.length >= 3) {
        const priceRaw = currentCell[2];
        let price = parseFloat((priceRaw / 1000).toFixed(3));
        if (price > 0) {
          console.log("✅ SUCCESS via getCurrentCell:", price);
          return price;
        }
      }
    } catch (altError1) {
      console.log("❌ getCurrentCell failed:", altError1.message);
    }

    // Try 2: Just getCurrentBitsPriceUSD without wallet parameter  
    try {
      console.log("💰 Trying getCurrentBitsPriceUSD without wallet...");
      const rawPrice = await contract.getCurrentBitsPriceUSD();
      console.log("✅ getCurrentBitsPriceUSD result:", rawPrice.toString());
      let price = parseFloat(ethers.utils.formatUnits(rawPrice, 3));
      if (price > 0) {
        console.log("✅ SUCCESS via getCurrentBitsPriceUSD (no wallet):", price);
        return price;
      }
    } catch (altError2) {
      console.log("❌ getCurrentBitsPriceUSD (no wallet) failed:", altError2.message);
    }

    // Fallback: Return 0 - NO FAKE PRICES!
    console.log("⚠️ [getCurrentBitsPrice] GPT2 method failed, NO PRICE AVAILABLE");
    return 0;

  } catch (error) {
    console.error("❌ [getCurrentBitsPrice] CRITICAL ERROR:", error);
    console.log("⚠️ [getCurrentBitsPrice] RETURNING 0 - NO FAKE PRICES!");
    return 0; // NO hardcoded emergency fallback!
  }
};

export default getCurrentBitsPrice;
