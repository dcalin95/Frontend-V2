/**
 * 🎯 HYBRID REWARDS SERVICE
 * 
 * Conectează frontend-ul direct cu Node.sol smart contract
 * pentru reward management transparent și decentralizat.
 * 
 * HYBRID APPROACH:
 * - Telegram tracking → PostgreSQL (fast performance)
 * - Claims & Display → Node.sol (transparency)
 * - Batch sync → Daily/Weekly automated
 */

import { ethers } from "ethers";
import nodeABI from "../abi/nodeABI.js";
import { CONTRACT_MAP } from "../contract/contractMap";

// 🔧 Configuration
const NODE_CONTRACT_ADDRESS_RAW =
  process.env.REACT_APP_NODE_ADDRESS ||
  process.env.REACT_APP_NODE ||
  CONTRACT_MAP?.NODE?.address ||
  "0xE6536756d73F0771D9a317F49453DE96541C352F";

// IMPORTANT: ethers accepts lowercase addresses; mixed-case with wrong checksum throws.
const NODE_CONTRACT_ADDRESS = String(NODE_CONTRACT_ADDRESS_RAW || "").toLowerCase();

const BITS_TOKEN_ADDRESS_RAW =
  process.env.REACT_APP_BITS_TOKEN ||
  process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS ||
  CONTRACT_MAP?.BITS_TOKEN?.address;

const BITS_TOKEN_ADDRESS = BITS_TOKEN_ADDRESS_RAW ? String(BITS_TOKEN_ADDRESS_RAW).toLowerCase() : BITS_TOKEN_ADDRESS_RAW;

const BSC_MAINNET_RPC = process.env.REACT_APP_RPC_URL || "https://bsc-dataseed1.binance.org";

class NodeRewardsService {
  constructor() {
    this.contract = null;
    this.provider = null;
    this.signer = null;
    this.isConnected = false;
  }

  /**
   * 🔌 Initialize connection to Node.sol contract
   */
  async initialize() {
    try {
      if (window.ethereum) {
        // Use MetaMask provider
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
      } else {
        // Fallback to BSC Mainnet RPC
        this.provider = new ethers.providers.JsonRpcProvider(BSC_MAINNET_RPC);
        console.warn("⚠️ MetaMask not detected, using read-only mode");
      }

      this.contract = new ethers.Contract(
        NODE_CONTRACT_ADDRESS,
        nodeABI,
        this.signer || this.provider
      );

      this.isConnected = true;
      console.log("✅ NodeRewardsService initialized");
      
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize NodeRewardsService:", error);
      return false;
    }
  }

  /**
   * 🎯 Get additional reward tiers from Node.sol
   * @returns {Promise<Array>} Array of reward tiers
   */
  async getAdditionalRewardTiers() {
    try {
      if (!this.contract) await this.initialize();

      const tiers = await this.contract.getAdditionalRewardInfo();
      
      return tiers.map(tier => ({
        limit: parseFloat(ethers.utils.formatUnits(tier.limit, 18)), // USD with 18 decimals
        percent: Number(tier.percent) // Already in percentage format (5, 7, 10, 15)
      }));

    } catch (error) {
      console.error("❌ Error fetching reward tiers:", error);
      return [];
    }
  }

  /**
   * 🏆 Get user's current reward tier
   * @param {string} userAddress - User's wallet address
   * @returns {Promise<Object>} Current tier info
   */
  async getUserRewardTier(userAddress) {
    try {
      if (!this.contract) await this.initialize();

      const userInfo = await this.contract.users(userAddress);
      const totalInvested = parseFloat(ethers.utils.formatEther(userInfo.totalInvested));
      
      const tiers = await this.getAdditionalRewardTiers();
      
      let currentTier = { limit: 0, percent: 0 };
      for (const tier of tiers) {
        if (totalInvested >= tier.limit) {
          currentTier = tier;
        }
      }

      return {
        currentTier,
        totalInvested,
        nextTier: tiers.find(t => t.limit > totalInvested) || null
      };

    } catch (error) {
      console.error("❌ Error getting user reward tier:", error);
      return { currentTier: { limit: 0, percent: 0 }, totalInvested: 0, nextTier: null };
    }
  }

  /**
   * 💰 Get user's claimable rewards
   * @param {string} userAddress - User's wallet address
   * @returns {Promise<Object>} Claimable rewards info
   */
  async getClaimableRewards(userAddress) {
    try {
      if (!this.contract) await this.initialize();

      const rewards = await this.contract.getClaimableRewards(userAddress);
      
      return {
        amount: parseFloat(ethers.utils.formatEther(rewards)),
        formatted: parseFloat(ethers.utils.formatEther(rewards)).toFixed(4)
      };

    } catch (error) {
      console.error("❌ Error getting claimable rewards:", error);
      return { amount: 0, formatted: "0.0000" };
    }
  }

  /**
   * 🎯 Claim rewards from Node.sol
   * @param {string} userAddress - User's wallet address
   * @returns {Promise<Object>} Transaction result
   */
  async claimRewards(userAddress) {
    try {
      if (!this.signer) {
        throw new Error("Wallet not connected");
      }

      const tx = await this.contract.claimRewards();
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.transactionHash,
        message: "Rewards claimed successfully!"
      };

    } catch (error) {
      console.error("❌ Error claiming rewards:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 📊 Get referral statistics
   * @param {string} userAddress - User's wallet address
   * @returns {Promise<Object>} Referral stats
   */
  async getReferralStats(userAddress) {
    try {
      if (!this.contract) await this.initialize();

      const userInfo = await this.contract.users(userAddress);
      
      return {
        totalReferrals: Number(userInfo.referralCount),
        totalEarned: parseFloat(ethers.utils.formatEther(userInfo.totalReferralRewards)),
        activeReferrals: Number(userInfo.activeReferrals) || 0
      };

    } catch (error) {
      console.error("❌ Error getting referral stats:", error);
      return { totalReferrals: 0, totalEarned: 0, activeReferrals: 0 };
    }
  }

  /**
   * 🔍 Check if invite code exists in contract
   * @param {string} code - Invite code to check
   * @returns {Promise<Object>} Code existence and details
   */
  async checkInviteCodeExists(code) {
    try {
      if (!this.contract) await this.initialize();

      // Try to get code rates (if they exist, code is registered)
      const [firstRate, secondRate] = await this.contract.getRefCodeRates(code);
      
      const exists = firstRate.gt(0) || secondRate.gt(0);

      return {
        success: true,
        exists,
        code,
        rates: exists ? {
          first: Number(firstRate),
          second: Number(secondRate)
        } : null
      };

    } catch (error) {
      console.error("❌ Error checking invite code:", error);
      return {
        success: false,
        exists: false,
        error: error.message
      };
    }
  }

  /**
   * 🔎 Get referral-code reward info from Node.sol (read-only)
   * @param {string} code - Referral code
   * @param {string} tokenAddress - Token address (defaults to BITS)
   */
  async getCodeRewardInfo(code, tokenAddress = BITS_TOKEN_ADDRESS) {
    try {
      if (!code || typeof code !== "string") throw new Error("Referral code required");
      if (!this.contract) await this.initialize();
      if (!tokenAddress) throw new Error("BITS token address is missing");

      const [balWei, rates] = await Promise.all([
        this.contract.codeBalanceOf(tokenAddress, code),
        this.contract.getRefCodeRates(code)
      ]);

      const codeBalance = Number(ethers.utils.formatUnits(balWei || 0, 18));
      const firstReferralRate = Number(rates?.[0] || 0);
      const secondReferralRate = Number(rates?.[1] || 0);

      return {
        success: true,
        code,
        hasRewards: Number.isFinite(codeBalance) && codeBalance > 0,
        codeBalance,
        firstReferralRate,
        secondReferralRate
      };
    } catch (error) {
      console.error("❌ Error getting code reward info:", error);
      return { success: false, error: error.message, hasRewards: false, codeBalance: 0 };
    }
  }

  /**
   * ✅ Claim referral-code rewards via Node.sol (user signs tx in MetaMask)
   * @param {string} referralCode
   * @param {string[]} tokenAddresses
   */
  async claimReferralReward(referralCode, tokenAddresses = [BITS_TOKEN_ADDRESS]) {
    try {
      if (!this.signer) throw new Error("Wallet not connected");
      if (!referralCode || typeof referralCode !== "string") throw new Error("Referral code required");
      if (!Array.isArray(tokenAddresses) || tokenAddresses.length === 0) throw new Error("Token list required");

      // Ensure contract is signer-connected
      if (!this.contract) await this.initialize();

      const user = await this.signer.getAddress();
      const net = await this.provider.getNetwork();
      const chainId = Number(net?.chainId || 0);
      if (!Number.isFinite(chainId) || chainId <= 0) throw new Error("Cannot detect chainId");

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const domain = {
        name: "Node",
        version: "1",
        chainId,
        verifyingContract: NODE_CONTRACT_ADDRESS
      };

      const types = {
        Claim: [
          { name: "tokens", type: "address[]" },
          { name: "code", type: "string" },
          { name: "user", type: "address" },
          { name: "deadline", type: "uint256" }
        ]
      };

      const value = {
        tokens: tokenAddresses,
        code: referralCode,
        user,
        deadline
      };

      const signature = await this.signer._signTypedData(domain, types, value);
      const { r, s, v } = ethers.utils.splitSignature(signature);

      const tx = await this.contract.claimRefCode(tokenAddresses, referralCode, deadline, v, r, s);
      const receipt = await tx.wait();

      return { success: true, txHash: receipt.transactionHash, message: "Referral reward claimed successfully!" };
    } catch (error) {
      console.error("❌ Error claiming referral reward:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔗 Get connected wallet address
   * @returns {Promise<string|null>} Wallet address or null
   */
  async getConnectedWallet() {
    try {
      if (!this.signer) return null;
      return await this.signer.getAddress();
    } catch (error) {
      console.error("❌ Error getting connected wallet:", error);
      return null;
    }
  }

  /**
   * 🎯 Generate and register invite code for user
   * @param {string} userAddress - User's wallet address
   * @param {string} referrerCode - Optional referrer code
   * @returns {Promise<Object>} Generated code and registration result
   */
  async generateInviteCode(userAddress, referrerCode = null) {
    try {
      if (!userAddress) {
        throw new Error("User address required");
      }

      // Generate deterministic code based on user address
      const code = userAddress.slice(-8).toUpperCase();
      
      // Register the code (mock implementation)
      const result = {
        success: true,
        code: code,
        userAddress: userAddress,
        referrerCode: referrerCode,
        timestamp: new Date().toISOString()
      };

      console.log("✅ Generated invite code:", result);
      return result;

    } catch (error) {
      console.error("❌ Error generating invite code:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 🌐 Get contract info for debugging
   * @returns {Object} Contract connection info
   */
  getContractInfo() {
    return {
      contractAddress: NODE_CONTRACT_ADDRESS,
      bitsTokenAddress: BITS_TOKEN_ADDRESS,
      isConnected: this.isConnected,
      hasWallet: !!this.signer,
      provider: this.provider ? "Connected" : "Not connected"
    };
  }
}

// 🎯 Export singleton instance
const nodeRewardsService = new NodeRewardsService();

export default nodeRewardsService;

/**
 * 🎨 Format BITS amount for display
 * @param {string|number} amount - Amount to format
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted amount
 */
export const formatBitsAmount = (amount, decimals = 4) => {
  const num = parseFloat(amount);
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  return num.toFixed(decimals);
};

/**
 * Check if wallet is connected and on correct network
 */
export const validateWalletConnection = async () => {
  try {
    if (!window.ethereum) {
      return { 
        valid: false, 
        message: "MetaMask not detected. Please install MetaMask." 
      };
    }

    const accounts = await window.ethereum.request({ 
      method: 'eth_accounts' 
    });
    
    if (accounts.length === 0) {
      return { 
        valid: false, 
        message: "Please connect your wallet" 
      };
    }

    const network = await window.ethereum.request({ 
      method: 'eth_chainId' 
    });
    
    const desiredChainId = Number(process.env.REACT_APP_CHAIN_ID || 56);
    const desiredHex = "0x" + desiredChainId.toString(16);

    if (network !== desiredHex) {
      return { 
        valid: false, 
        message: `Please switch to BSC (Chain ID: ${desiredChainId})` 
      };
    }

    return { 
      valid: true, 
      address: accounts[0],
      chainId: network
    };
  } catch (error) {
    return { 
      valid: false, 
      message: "Wallet connection error: " + error.message 
    };
  }
};

/**
 * 📱 React Hook for using Node Rewards Service
 * 
 * Note: Import React in the component that uses this hook
 */
export const useNodeRewards = () => {
  // This will be used in React components that import React
  // Components should import: import React, { useState, useEffect } from "react";
  
  return {
    service: nodeRewardsService,
    contractInfo: nodeRewardsService.getContractInfo()
  };
};