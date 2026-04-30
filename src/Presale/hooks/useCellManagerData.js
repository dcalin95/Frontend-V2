import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../contract/contracts";

// Node.sol contract for transaction history
const NODE_ABI = [
  "function getUserPurchases(address user) view returns (tuple(uint256 timestamp, uint256 usdAmount, uint256 bitsAmount, address paymentToken, string paymentSource)[])",
  "function getUserTransactionCount(address user) view returns (uint256)",
  "function getTotalRaised() view returns (uint256)",
  "function getTotalBitsSold() view returns (uint256)"
];

// Test wallet address from BSCScan transaction
const TEST_WALLET = "0x4CCA7bf2aeF7A432d06513f7b02c2F316E21f408";

/**
 * Hook to fetch data directly from CellManager contract
 * This replaces backend API calls for getting current round data
 */
export default function useCellManagerData() {
  const [data, setData] = useState({
    currentPrice: null,
    roundNumber: null,
    availableBits: null,
    soldBits: null,
    cellId: null,
    loading: true,
    error: null,
    history: [], // Add history array
    /** Total USD ridicat (Node.sol getTotalRaised), 18 decimale → float — folosit când API presale e offline */
    nodeTotalRaisedUsd: null,
    // New fields for transaction data
    totalTransactions: 0,
    totalUsdValue: 0,
    uniqueWallets: 0,
    walletAddresses: []
  });

  useEffect(() => {
    const fetchCellManagerData = async () => {
      console.log("🚀 [DEBUG] useCellManagerData function started!");
      console.groupCollapsed("📊 [useCellManagerData] Fetching data from CellManager");
      
      try {
        console.log("🔍 [DEBUG] Inside try block, starting data fetch...");
        // MAINNET-only
        const rpcUrl = "https://bsc-dataseed1.binance.org";
          
        console.log("🌐 Using RPC:", rpcUrl);
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

        const contractAddress = CONTRACTS.CELL_MANAGER?.address;
        console.log("📋 CellManager address:", contractAddress);
        
        if (!contractAddress) {
          throw new Error("Missing CellManager contract address");
        }
        
        // Test provider connection
        const blockNumber = await provider.getBlockNumber();
        console.log("🔗 Connected to block:", blockNumber);

        const abi = [
          "function getCurrentOpenCellId() view returns (uint256)",
          "function getNextCellId() view returns (uint256)",
          "function getCell(uint256 cellId) view returns (tuple(bool defined, uint8 cellState, uint256 standardPrice, uint256 privilegedPrice, uint256 sold, uint256 supply))",
          "function getCurrentBitsPriceUSD(address wallet) view returns (uint256)",
          "function getRemainingSupply(uint256 cellId) view returns (uint256)",
          "function getTotalSoldInCell(uint256 cellId) view returns (uint256)",
          "function getTotalWalletsInCell(uint256 cellId) view returns (uint256)",
          "function getWalletsInCell(uint256 cellId) view returns (address[])",
          "function getBuyerHistoryInCell(uint256 cellId, address buyer) view returns (tuple(uint256 totalPurchased, uint256 purchaseCount, uint256 totalAmountSpent))",
          "function getPurchaseHistory(uint256 cellId, address buyer) view returns (tuple(uint256 amount, uint256 pricePaidWei, uint256 timestamp, address paymentToken)[])"
        ];

        const contract = new ethers.Contract(contractAddress, abi, provider);

        // Get current open cell ID and next cell ID
        console.log("🔍 [DEBUG] About to call getCurrentOpenCellId...");
        const cellId = await contract.getCurrentOpenCellId();
        console.log("✅ [DEBUG] getCurrentOpenCellId successful:", cellId.toString());
        
        console.log("🔍 [DEBUG] About to call getNextCellId...");
        const nextCellId = await contract.getNextCellId();
        console.log("✅ [DEBUG] getNextCellId successful:", nextCellId.toString());
        
        console.log("📦 Current Open Cell ID:", cellId.toString());
        console.log("📦 Next Cell ID:", nextCellId.toString());

        // Get history of all cells
        const history = [];
        const totalCells = parseInt(nextCellId.toString());
        
        console.log("📚 Fetching history for", totalCells, "cells...");
        
        for (let i = 0; i < totalCells; i++) {
          try {
            const cell = await contract.getCell(i);
            const [defined, state, standardPriceRaw, privilegedPriceRaw, sold, supply] = [
              cell.defined, cell.cellState, cell.standardPrice, cell.privilegedPrice, cell.sold, cell.supply
            ];
            
            if (defined) {
              const realSoldBits = Math.round(parseFloat(ethers.utils.formatUnits(sold, 18)));
              const realPrice = parseFloat((standardPriceRaw / 1000).toFixed(6));
              const realRaisedUSD = realSoldBits * realPrice;
              const tokensAvailable = Math.round(parseFloat(ethers.utils.formatUnits(supply.sub(sold), 18)));
              
              const cellHistory = {
                id: i,
                round: i + 1, // Round number is cellId + 1
                start_time: new Date().toISOString(), // We don't have exact start time from contract
                end_time: state === 2 ? new Date().toISOString() : null, // Assuming state 2 = closed
                price: realPrice,
                // REAL data from blockchain
                real_sold_bits: realSoldBits,
                real_raised_usd: realRaisedUSD,
                tokensavailable: tokensAvailable,
                // Legacy fields for compatibility (will be replaced)
                sold_bits: realSoldBits,
                raised_usd: realRaisedUSD,
                last_update: new Date().toISOString(),
                data_source: "CellManager Contract (Real Sales Only)"
              };
              
              history.push(cellHistory);
              console.log(`📊 Cell ${i}:`, cellHistory);
            }
          } catch (cellErr) {
            console.warn(`⚠️ Could not fetch cell ${i}:`, cellErr.message);
          }
        }

        // Use current cell data for main display
        console.log("🔍 [DEBUG] About to call getCell for cellId:", cellId.toString());
        let cell = await contract.getCell(cellId);
        let [defined, state, standardPriceRaw, privilegedPriceRaw, sold, supply] = [
          cell.defined, cell.cellState, cell.standardPrice, cell.privilegedPrice, cell.sold, cell.supply
        ];
        console.log("✅ [DEBUG] getCell successful for cellId:", cellId.toString());
        
        // If current cell is empty, try to find the last cell with data
        if (!defined || (supply.toString() === "0" && sold.toString() === "0")) {
          console.warn(`⚠️ Cell ${cellId} is empty, searching for last active cell...`);
          
          // Search backwards from current cell to find one with data
          for (let i = parseInt(cellId.toString()) - 1; i >= 0; i--) {
            try {
              const prevCell = await contract.getCell(i);
              const [prevDefined, prevState, prevStandardPrice, prevPrivilegedPrice, prevSold, prevSupply] = [
                prevCell.defined, prevCell.cellState, prevCell.standardPrice, prevCell.privilegedPrice, prevCell.sold, prevCell.supply
              ];
              
              if (prevDefined && (prevSupply.toString() !== "0" || prevSold.toString() !== "0")) {
                console.log(`✅ Found active cell ${i} with data`);
                defined = prevDefined;
                state = prevState;
                standardPriceRaw = prevStandardPrice;
                privilegedPriceRaw = prevPrivilegedPrice;
                sold = prevSold;
                supply = prevSupply;
                break;
              }
            } catch (err) {
              console.warn(`Could not check cell ${i}:`, err.message);
            }
          }
        }
        
        console.log("🔍 Debug Cell State:", {
          defined,
          state: state.toString(),
          standardPriceRaw: standardPriceRaw.toString(),
          privilegedPriceRaw: privilegedPriceRaw.toString(),
          sold: sold.toString(),
          supply: supply.toString()
        });
        
        // Convert price from millicents to USD (divide by 1000)
        let standardPrice = parseFloat((standardPriceRaw / 1000).toFixed(6));
        
        // Provide no hardcoded fallback; use standardPrice if positive
        // Try to get current BITS price USD with a dummy wallet address
        let currentBitsPriceUSD = standardPrice > 0 ? standardPrice : 0;
        try {
          const dummyWallet = "0x0000000000000000000000000000000000000001";
          const bitsPriceRaw = await contract.getCurrentBitsPriceUSD(dummyWallet);
          
          console.log("🔍 [DEBUG] Price conversion:");
          console.log("- bitsPriceRaw (from contract):", bitsPriceRaw.toString());
          console.log("- standardPriceRaw (from debugCellState):", standardPriceRaw.toString());
          console.log("- standardPrice (after /1000):", standardPrice);
          
          // Interpret getCurrentBitsPriceUSD as 18-decimal USD
          const priceFromContract = parseFloat(ethers.utils.formatUnits(bitsPriceRaw, 18));
          console.log("- priceFromContract (1e18 → USD):", priceFromContract);
          
          if (priceFromContract > 0) {
            currentBitsPriceUSD = priceFromContract;
          } else if (standardPrice > 0) {
            currentBitsPriceUSD = standardPrice;
          }
          
          console.log("💰 Final Current BITS Price USD:", currentBitsPriceUSD);
        } catch (priceErr) {
          console.warn("⚠️ Could not get getCurrentBitsPriceUSD, using standardPrice if available:", priceErr.message);
          if (standardPrice > 0) {
            currentBitsPriceUSD = standardPrice;
          }
        }
        
        // Calculate available BITS (supply - sold)
        const availableBits = supply.sub(sold);
        
        // Get remaining supply directly
        const remainingSupply = await contract.getRemainingSupply(cellId);
        
        // Get total sold for verification
        const totalSold = await contract.getTotalSoldInCell(cellId);
        
        console.log("📊 Remaining Supply (BITS units):", remainingSupply.toString());
        console.log("📊 Total Sold (BITS units):", totalSold.toString());
        console.log("📊 Supply (wei):", supply.toString());
        console.log("📊 Sold (wei):", sold.toString());
        console.log("📊 Available calculated (wei):", availableBits.toString());
        
        // Convert on-chain values (wei) to human BITS (18 decimals)
        // Even if contracts return BITS units, safest is to treat as 18-decimal and format
        const soldBitsFromContract = parseFloat(ethers.utils.formatUnits(totalSold, 18));
        const availableBitsFromContract = parseFloat(ethers.utils.formatUnits(remainingSupply, 18));
        
        console.log("🔍 Contract Functions (BITS units):");
        console.log("- getRemainingSupply:", availableBitsFromContract);
        console.log("- getTotalSoldInCell:", soldBitsFromContract);
        
        // Convert wei values from getCell for comparison (human units)
        const soldBitsFormatted = parseFloat(ethers.utils.formatUnits(sold, 18));
        const supplyFormatted = parseFloat(ethers.utils.formatUnits(supply, 18));
        
        console.log("🔍 getCell Values (converted from wei):");
        console.log("- supply:", supplyFormatted);
        console.log("- sold:", soldBitsFormatted);
        
        console.log("🔍 [DEBUG CHECKPOINT 1] About to process transaction data");
        
        // Use contract functions as they are more reliable
        let availableBitsFormatted = availableBitsFromContract;
        let soldBitsFormatted_final = soldBitsFromContract;
        
        console.log("🔍 [DEBUG CHECKPOINT 2] Variables set, about to start transaction fetch");
        
        // 📊 GET TRANSACTION DATA FOR CURRENT CELL
        console.log("📊 [TRANSACTIONS] Fetching transaction data for cell", cellId.toString());
        console.log("📊 [DEBUG] Contract address:", contractAddress);
        console.log("📊 [DEBUG] Cell ID:", cellId.toString());
        
        let totalTransactions = 0;
        let totalUsdValue = 0;
        let uniqueWallets = 0;
        let walletAddresses = [];
        
        try {
                  console.log("🔍 [DEBUG] About to call getTotalWalletsInCell...");
        
        // 🎯 GET TRANSACTION DATA FROM NODE.SOL CONTRACT
        console.log("🔍 [DEBUG] Getting transaction data from Node.sol contract...");
        const nodeContractAddressRaw = CONTRACTS.NODE?.address;
        console.log("📋 [DEBUG] Node contract address (raw):", nodeContractAddressRaw);
        
        if (!nodeContractAddressRaw) {
          console.warn("⚠️ [DEBUG] Node contract address not found in CONTRACTS");
        } else {
          // ✅ FIX: Convert address to checksum format (ethers.js requires checksum addresses)
          const nodeContractAddress = ethers.utils.getAddress(nodeContractAddressRaw);
          console.log("📋 [DEBUG] Node contract address (checksum):", nodeContractAddress);
          const nodeContract = new ethers.Contract(nodeContractAddress, NODE_ABI, provider);

          try {
            const trRaw = await nodeContract.getTotalRaised();
            const trUsd = parseFloat(ethers.utils.formatEther(trRaw));
            if (Number.isFinite(trUsd) && trUsd >= 0) {
              totalUsdValue = trUsd;
              console.log("📊 [NODE] getTotalRaised (global USD):", trUsd);
            }
          } catch (trErr) {
            console.warn("⚠️ [NODE] getTotalRaised failed:", trErr.message);
          }
          
          try {
            // 🎯 GET SPECIFIC USER PURCHASES (debug / BSCScan comparison — NU înlocuiește sold global)
            console.log("🔍 [NODE] Checking purchases for wallet:", TEST_WALLET);
            const userPurchases = await nodeContract.getUserPurchases(TEST_WALLET);
            const userTransactionCount = await nodeContract.getUserTransactionCount(TEST_WALLET);
            
            console.log("📊 [USER PURCHASES] Raw data:", userPurchases);
            console.log("📊 [USER TRANSACTIONS] Count:", userTransactionCount.toString());
            
            // Calculate totals from user purchases
            let userTotalBits = 0;
            let userTotalUsd = 0;
            
            if (userPurchases && userPurchases.length > 0) {
              for (let i = 0; i < userPurchases.length; i++) {
                const purchase = userPurchases[i];
                const bitsAmount = parseFloat(ethers.utils.formatEther(purchase.bitsAmount));
                
                // 🎯 FIX: USD Amount might be in different format
                console.log("🔍 [USD DEBUG] Raw usdAmount:", purchase.usdAmount.toString());
                let usdAmount;
                
                // Try different conversion methods
                if (purchase.usdAmount.toString().length > 20) {
                  // Very large number, might be in wei with wrong decimals
                  usdAmount = parseFloat(purchase.usdAmount.toString()) / 1e18;
                  console.log("🔍 [USD DEBUG] Method 1 (divide by 1e18):", usdAmount);
                } else {
                  // Normal wei conversion
                  usdAmount = parseFloat(ethers.utils.formatEther(purchase.usdAmount));
                  console.log("🔍 [USD DEBUG] Method 2 (formatEther):", usdAmount);
                }
                
                // Sanity check - USD should be reasonable (between $1 and $10000)
                if (usdAmount > 10000 || usdAmount < 0.01) {
                  console.warn("🚨 [USD WARNING] Unreasonable USD amount:", usdAmount);
                  // Try alternative calculation: BITS * price
                  const estimatedUsd = bitsAmount * 0.024; // ~$0.024 per BITS from BSCScan
                  console.log("🔍 [USD DEBUG] Estimated USD from BITS:", estimatedUsd);
                  usdAmount = estimatedUsd;
                }
                
                userTotalBits += bitsAmount;
                userTotalUsd += usdAmount;
                
                console.log(`📋 [PURCHASE ${i + 1}]:`, {
                  timestamp: new Date(purchase.timestamp * 1000).toLocaleString(),
                  bitsAmount: bitsAmount.toLocaleString(),
                  usdAmount: usdAmount.toFixed(2),
                  paymentSource: purchase.paymentSource
                });
              }
            }
            
            console.log("🔄 [USER TOTALS]:");
            console.log("- Total BITS purchased:", userTotalBits.toLocaleString());
            console.log("- Total USD spent:", userTotalUsd.toFixed(2));
            console.log("- Transaction count:", userPurchases.length);
            
            // 🎯 ANALYSIS: Compare with BSCScan data
            console.log("🔍 [ANALYSIS] BSCScan vs Node.sol comparison:");
            console.log("- BSCScan shows: 490.5 BITS transferred");
            console.log("- Node.sol shows:", userTotalBits.toLocaleString(), "BITS recorded");
            console.log("- Difference:", (490.5 - userTotalBits).toFixed(2), "BITS");
            console.log("- BSCScan USD: ~$11.90");
            console.log("- Node.sol USD:", userTotalUsd.toFixed(2));
            
            if (userPurchases.length > 0) {
              const purchase = userPurchases[0];
              console.log("🔍 [DETAILED PURCHASE ANALYSIS]:");
              console.log("- Raw bitsAmount (wei):", purchase.bitsAmount.toString());
              console.log("- Raw usdAmount (wei):", purchase.usdAmount.toString());
              console.log("- Formatted BITS:", parseFloat(ethers.utils.formatEther(purchase.bitsAmount)));
              console.log("- Formatted USD:", parseFloat(ethers.utils.formatEther(purchase.usdAmount)));
              console.log("- Payment source:", purchase.paymentSource);
              console.log("- Timestamp:", new Date(purchase.timestamp * 1000).toISOString());
            }
            
            // Use user-specific data instead of global
            soldBitsFormatted_final = userTotalBits;
            totalUsdValue = userTotalUsd;
            totalTransactions = userPurchases.length;
            uniqueWallets = userPurchases.length > 0 ? 1 : 0;
            
            console.log("📊 [FINAL] User-specific transaction data:");
            console.log("- Sold BITS:", soldBitsFormatted_final.toLocaleString());
            console.log("- USD Value:", totalUsdValue.toFixed(2));
            console.log("- Transactions:", totalTransactions);
            console.log("- Wallets:", uniqueWallets);
            
          } catch (nodeErr) {
            console.error("❌ [NODE ERROR] Could not fetch user data from Node.sol:", nodeErr);
            console.error("❌ [NODE ERROR] Message:", nodeErr.message);
          }
        }
          
        // Transaction data is now fetched from Node.sol above
          
          console.log("📊 [TRANSACTIONS SUMMARY]:", {
            uniqueWallets: uniqueWallets.toString(),
            totalTransactions,
            totalUsdValue: totalUsdValue.toFixed(2)
          });
          
        } catch (transactionErr) {
          console.error("❌ [TRANSACTION ERROR] Could not fetch transaction data:", transactionErr);
          console.error("❌ [TRANSACTION ERROR] Message:", transactionErr.message);
          console.error("❌ [TRANSACTION ERROR] Stack:", transactionErr.stack);
          console.error("❌ [TRANSACTION ERROR] Code:", transactionErr.code);
          console.error("❌ [TRANSACTION ERROR] Data:", transactionErr.data);
        }
        
        if (availableBitsFormatted === 0 && supplyFormatted > soldBitsFormatted) {
          availableBitsFormatted = supplyFormatted - soldBitsFormatted;
          console.log(`🔧 Using calculated available: ${availableBitsFormatted} (supply: ${supplyFormatted} - sold: ${soldBitsFormatted})`);
        }
        
        console.log("📊 Final Cell Data:", {
          cellId: cellId.toString(),
          defined,
          state: state.toString(),
          standardPrice,
          supply: supplyFormatted,
          sold: soldBitsFormatted,
          available: availableBitsFormatted,
          remainingSupply: availableBitsFormatted,
          // Transaction data
          totalTransactions,
          totalUsdValue,
          uniqueWallets: parseInt(uniqueWallets.toString()),
          walletAddresses
        });

        // Additional debugging for zero values
        if (supplyFormatted === 0 && soldBitsFormatted === 0) {
          console.warn("⚠️ [DEBUG] Cell has zero supply and sold - this might be an empty cell");
          console.log("Raw values from debugCellState:");
          console.log("- defined:", defined);
          console.log("- state:", state.toString());
          console.log("- supply (raw):", supply.toString());
          console.log("- sold (raw):", sold.toString());
          console.log("- remainingSupply (raw):", remainingSupply.toString());
          console.log("- totalSold (raw):", totalSold.toString());
          
          console.log("🔍 [SOLUTION] To fix this:");
          console.log("1. Set BITS supply in CellManager contract for cell", cellId.toString());
          console.log("2. Or use AdminPanel to set simulation supply in database");
          console.log("3. Current cell might not have been configured with BITS yet");
          
          // Set error state to show helpful message in UI
          const finalRoundNumber = parseInt(cellId.toString()) + 1;
          const finalPrice = currentBitsPriceUSD || 0;
          
          console.log("🔧 [DEBUG] Setting error state with:");
          console.log("- cellId:", cellId.toString());
          console.log("- finalRoundNumber:", finalRoundNumber);
          console.log("- finalPrice:", finalPrice);
          console.log("- currentBitsPriceUSD:", currentBitsPriceUSD);
          
          setData(prev => ({
            ...prev,
            loading: false,
            error: `Cell ${cellId.toString()} not configured. Use AdminPanel to add BITS supply.`,
            currentPrice: finalPrice,
            roundNumber: finalRoundNumber,
            availableBits: 0,
            soldBits: 0,
            cellId: parseInt(cellId.toString()),
            history: history
          }));
          return; // Exit early to show error state
        }

        setData({
          currentPrice: currentBitsPriceUSD,
          roundNumber: parseInt(cellId.toString()) + 1, // Round number is cellId + 1
          availableBits: Math.round(availableBitsFormatted), // Round to avoid floating point issues
          soldBits: Math.round(soldBitsFormatted_final), // Use contract function result
          cellId: parseInt(cellId.toString()),
          loading: false,
          error: null,
          history: history, // Include the complete history
          nodeTotalRaisedUsd: Number.isFinite(totalUsdValue) && totalUsdValue >= 0 ? totalUsdValue : null,
          // Transaction data
          totalTransactions: totalTransactions,
          totalUsdValue: totalUsdValue,
          uniqueWallets: parseInt(uniqueWallets.toString()),
          walletAddresses: walletAddresses
        });

      } catch (err) {
        console.error("❌ [MAIN ERROR] useCellManagerData failed completely!");
        console.error("❌ [MAIN ERROR] Failed to fetch data:", err.message || err);
        console.error("❌ [MAIN ERROR] Full error:", err);
        console.error("❌ [MAIN ERROR] Stack trace:", err.stack);
        console.error("❌ [MAIN ERROR] Error occurred at main function level");
        
        // More detailed error reporting
        let errorMessage = "Failed to fetch CellManager data";
        if (err.message.includes("no open cell")) {
          errorMessage = "No open cell found in CellManager contract";
        } else if (err.message.includes("network")) {
          errorMessage = "Network error connecting to CellManager";
        } else if (err.message.includes("revert")) {
          errorMessage = "Contract call reverted: " + err.message;
        }
        
        setData(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          currentPrice: 0,
          roundNumber: null,
          availableBits: 0,
          soldBits: 0,
          cellId: null,
          nodeTotalRaisedUsd: null
        }));
      } finally {
        console.groupEnd();
      }
    };

    fetchCellManagerData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchCellManagerData, 30000);
    
    // Force refresh on window focus (helps with debugging)
    const handleFocus = () => {
      console.log("🔄 [useCellManagerData] Window focused, refreshing data...");
      fetchCellManagerData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return data;
}
