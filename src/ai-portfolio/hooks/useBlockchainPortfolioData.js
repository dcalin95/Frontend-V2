import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../contract/contracts";

/**
 * Enhanced hook to collect comprehensive blockchain data for AI Portfolio Analytics
 * Integrates with: CellManager, Node, AdditionalReward, TelegramReward contracts
 */
export default function useBlockchainPortfolioData(walletAddress) {
  const [data, setData] = useState({
    // CellManager data
    currentPrice: null,
    cellId: null,
    cellSupply: null,
    cellSold: null,
    
    // Node.sol data
    totalRaised: null,
    totalBitsSold: null,
    userTransactions: [],
    userTransactionCount: 0,
    
    // AdditionalReward data
    userRewards: null,
    totalRewardsPool: null,
    rewardMultiplier: null,
    
    // TelegramReward data
    telegramRewards: null,
    telegramActivity: null,
    
    // Portfolio analytics
    portfolioValue: 0,
    portfolioPerformance: 0,
    riskScore: 0,
    diversificationScore: 0,
    
    // Meta
    loading: true,
    error: null,
    lastUpdated: null
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Manual refresh function
  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchBlockchainData = async () => {
      console.group("🔗 [useBlockchainPortfolioData] Fetching comprehensive blockchain data");
      
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        const IS_TESTNET = false; // BSC MAINNET
        const rpcUrl = IS_TESTNET
          ? "https://data-seed-prebsc-1-s1.binance.org:8545/"
          : "https://bsc-dataseed1.binance.org";
          
        console.log("🌐 Using RPC:", rpcUrl);
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        
        // Test connection
        const blockNumber = await provider.getBlockNumber();
        console.log("🔗 Connected to block:", blockNumber);

        // Initialize contract instances
        const cellManagerContract = new ethers.Contract(
          CONTRACTS.CELL_MANAGER?.address,
          [
            "function getCurrentOpenCellId() view returns (uint256)",
            "function getCell(uint256) view returns (bool, uint8, uint256, uint256, uint256, uint256)",
            "function getTotalSoldInCell(uint256) view returns (uint256)",
            "function getRemainingSupply(uint256) view returns (uint256)",
            "function getTotalWalletsInCell(uint256) view returns (uint256)"
          ],
          provider
        );

        const nodeContract = new ethers.Contract(
          CONTRACTS.NODE?.address,
          [
            "function getTotalRaised() view returns (uint256)",
            "function getTotalBitsSold() view returns (uint256)",
            "function getUserPurchases(address) view returns (tuple(uint256 timestamp, uint256 usdAmount, uint256 bitsAmount, address paymentToken, string paymentSource)[])",
            "function getUserTransactionCount(address) view returns (uint256)",
            "function getBitsBalance() view returns (uint256)"
          ],
          provider
        );

        const additionalRewardContract = new ethers.Contract(
          CONTRACTS.ADDITIONAL_REWARD?.address,
          [
            "function getUserRewards(address) view returns (uint256)",
            "function getTotalRewardsPool() view returns (uint256)",
            "function getRewardMultiplier(address) view returns (uint256)",
            "function getUserInvestmentAmount(address) view returns (uint256)"
          ],
          provider
        );

        const telegramRewardContract = new ethers.Contract(
          CONTRACTS.TELEGRAM_REWARD?.address,
          [
            "function getUserRewards(address) view returns (uint256)",
            "function getUserActivityScore(address) view returns (uint256)",
            "function getTotalTelegramRewards() view returns (uint256)"
          ],
          provider
        );

        // Parallel data fetching for better performance
        const [
          cellManagerData,
          nodeData,
          additionalRewardData,
          telegramRewardData
        ] = await Promise.allSettled([
          fetchCellManagerData(cellManagerContract),
          fetchNodeData(nodeContract, walletAddress),
          fetchAdditionalRewardData(additionalRewardContract, walletAddress),
          fetchTelegramRewardData(telegramRewardContract, walletAddress)
        ]);

        // Process results
        const processedData = {
          ...data,
          ...processResult(cellManagerData, 'CellManager'),
          ...processResult(nodeData, 'Node'),
          ...processResult(additionalRewardData, 'AdditionalReward'),
          ...processResult(telegramRewardData, 'TelegramReward'),
          loading: false,
          lastUpdated: new Date().toISOString()
        };

        // Calculate portfolio analytics
        const analytics = calculatePortfolioAnalytics(processedData);
        
        setData({
          ...processedData,
          ...analytics
        });

        console.log("✅ [useBlockchainPortfolioData] Data fetch completed:", processedData);

      } catch (error) {
        console.error("❌ [useBlockchainPortfolioData] Error:", error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message || "Failed to fetch blockchain data"
        }));
      } finally {
        console.groupEnd();
      }
    };

    fetchBlockchainData();
  }, [walletAddress, refreshTrigger]);

  return { ...data, refreshData };
}

// Helper functions for data fetching
async function fetchCellManagerData(contract) {
  console.log("📊 Fetching CellManager data...");
  
  try {
    const cellId = await contract.getCurrentOpenCellId();
    const cell = await contract.getCell(cellId);
    const totalSold = await contract.getTotalSoldInCell(cellId);
    const remainingSupply = await contract.getRemainingSupply(cellId);
    const totalWallets = await contract.getTotalWalletsInCell(cellId);

    // Parse cell data: [defined, state, standardPrice, privilegedPrice, sold, supply]
    const [defined, state, standardPriceRaw, privilegedPriceRaw, sold, supply] = cell;
    
    return {
      cellId: cellId.toString(),
      currentPrice: parseFloat((standardPriceRaw / 1000).toFixed(6)), // Convert from millicents
      cellSupply: ethers.utils.formatEther(supply),
      cellSold: ethers.utils.formatEther(sold),
      remainingSupply: ethers.utils.formatEther(remainingSupply),
      totalWallets: totalWallets.toString(),
      cellState: state.toString()
    };
  } catch (error) {
    console.warn("⚠️ CellManager data fetch failed:", error.message);
    return {};
  }
}

async function fetchNodeData(contract, walletAddress) {
  console.log("🏗️ Fetching Node contract data...");
  
  try {
    const [totalRaised, totalBitsSold, bitsBalance] = await Promise.all([
      contract.getTotalRaised(),
      contract.getTotalBitsSold(),
      contract.getBitsBalance()
    ]);

    let userData = {};
    if (walletAddress && ethers.utils.isAddress(walletAddress)) {
      try {
        const [userPurchases, userTxCount] = await Promise.all([
          contract.getUserPurchases(walletAddress),
          contract.getUserTransactionCount(walletAddress)
        ]);

        userData = {
          userTransactions: userPurchases.map(tx => ({
            timestamp: tx.timestamp.toString(),
            usdAmount: ethers.utils.formatEther(tx.usdAmount),
            bitsAmount: ethers.utils.formatEther(tx.bitsAmount),
            paymentToken: tx.paymentToken,
            paymentSource: tx.paymentSource
          })),
          userTransactionCount: userTxCount.toString()
        };
      } catch (userError) {
        console.warn("⚠️ User-specific Node data fetch failed:", userError.message);
      }
    }

    return {
      totalRaised: ethers.utils.formatEther(totalRaised),
      totalBitsSold: ethers.utils.formatEther(totalBitsSold),
      bitsBalance: ethers.utils.formatEther(bitsBalance),
      ...userData
    };
  } catch (error) {
    console.warn("⚠️ Node data fetch failed:", error.message);
    return {};
  }
}

async function fetchAdditionalRewardData(contract, walletAddress) {
  console.log("🎁 Fetching AdditionalReward data...");
  
  try {
    const totalRewardsPool = await contract.getTotalRewardsPool();

    let userData = {};
    if (walletAddress && ethers.utils.isAddress(walletAddress)) {
      try {
        const [userRewards, rewardMultiplier, investmentAmount] = await Promise.all([
          contract.getUserRewards(walletAddress),
          contract.getRewardMultiplier(walletAddress),
          contract.getUserInvestmentAmount(walletAddress)
        ]);

        userData = {
          userRewards: ethers.utils.formatEther(userRewards),
          rewardMultiplier: rewardMultiplier.toString(),
          userInvestmentAmount: ethers.utils.formatEther(investmentAmount)
        };
      } catch (userError) {
        console.warn("⚠️ User-specific AdditionalReward data fetch failed:", userError.message);
      }
    }

    return {
      totalRewardsPool: ethers.utils.formatEther(totalRewardsPool),
      ...userData
    };
  } catch (error) {
    console.warn("⚠️ AdditionalReward data fetch failed:", error.message);
    return {};
  }
}

async function fetchTelegramRewardData(contract, walletAddress) {
  console.log("📱 Fetching TelegramReward data...");
  
  try {
    const totalTelegramRewards = await contract.getTotalTelegramRewards();

    let userData = {};
    if (walletAddress && ethers.utils.isAddress(walletAddress)) {
      try {
        const [telegramRewards, activityScore] = await Promise.all([
          contract.getUserRewards(walletAddress),
          contract.getUserActivityScore(walletAddress)
        ]);

        userData = {
          telegramRewards: ethers.utils.formatEther(telegramRewards),
          telegramActivity: activityScore.toString()
        };
      } catch (userError) {
        console.warn("⚠️ User-specific TelegramReward data fetch failed:", userError.message);
      }
    }

    return {
      totalTelegramRewards: ethers.utils.formatEther(totalTelegramRewards),
      ...userData
    };
  } catch (error) {
    console.warn("⚠️ TelegramReward data fetch failed:", error.message);
    return {};
  }
}

// Helper function to process Promise.allSettled results
function processResult(result, contractName) {
  if (result.status === 'fulfilled') {
    console.log(`✅ ${contractName} data:`, result.value);
    return result.value;
  } else {
    console.warn(`⚠️ ${contractName} failed:`, result.reason?.message);
    return {};
  }
}

// Calculate portfolio analytics based on blockchain data
function calculatePortfolioAnalytics(data) {
  console.log("📈 Calculating portfolio analytics...");
  
  try {
    // Portfolio value calculation
    const bitsHolding = parseFloat(data.userTransactions?.reduce((sum, tx) => 
      sum + parseFloat(tx.bitsAmount || 0), 0) || 0);
    const currentPrice = parseFloat(data.currentPrice || 0);
    const portfolioValue = bitsHolding * currentPrice;

    // Performance calculation (simplified)
    const totalInvested = parseFloat(data.userTransactions?.reduce((sum, tx) => 
      sum + parseFloat(tx.usdAmount || 0), 0) || 0);
    const portfolioPerformance = totalInvested > 0 ? 
      ((portfolioValue - totalInvested) / totalInvested) * 100 : 0;

    // Risk score (based on transaction frequency and amounts)
    const txCount = parseInt(data.userTransactionCount || 0);
    const avgTxAmount = totalInvested / Math.max(txCount, 1);
    const riskScore = Math.min(10, Math.max(1, 
      (txCount * 0.5) + (avgTxAmount / 1000) + (Math.abs(portfolioPerformance) / 10)
    ));

    // Diversification score (based on payment methods used)
    const uniqueTokens = new Set(data.userTransactions?.map(tx => tx.paymentToken) || []).size;
    const diversificationScore = Math.min(10, uniqueTokens * 2);

    return {
      portfolioValue: portfolioValue.toFixed(2),
      portfolioPerformance: portfolioPerformance.toFixed(2),
      riskScore: riskScore.toFixed(1),
      diversificationScore: diversificationScore.toFixed(1),
      bitsHolding: bitsHolding.toFixed(2),
      totalInvested: totalInvested.toFixed(2)
    };
  } catch (error) {
    console.warn("⚠️ Portfolio analytics calculation failed:", error.message);
    return {
      portfolioValue: "0.00",
      portfolioPerformance: "0.00",
      riskScore: "0.0",
      diversificationScore: "0.0",
      bitsHolding: "0.00",
      totalInvested: "0.00"
    };
  }
}
