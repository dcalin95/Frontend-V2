/**
 * 🎁 UNIFIED REWARDS SERVICE
 * 
 * Serviciu pentru interacțiunea cu sistemul unificat de rewards
 * Toate rewards (referral, telegram) sunt gestionate prin backend database
 * Cu claim manual prin smart contract
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

class UnifiedRewardsService {
  constructor() {
    this.baseURL = BACKEND_URL;
  }

  /**
   * 📋 Get toate rewards pentru un wallet
   * @param {string} walletAddress - Adresa wallet-ului
   * @returns {Promise<Object>} Rewards data
   */
  async getUserRewards(walletAddress) {
    try {
      const response = await fetch(`${this.baseURL}/api/rewards/${walletAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log("✅ UnifiedRewardsService: getUserRewards success", {
        wallet: walletAddress,
        totalPending: data.totalPending,
        totalClaimed: data.totalClaimed,
        rewardsCount: data.rewards?.length || 0
      });

      return data;
      
    } catch (error) {
      console.error("❌ UnifiedRewardsService: getUserRewards failed", error);
      throw error;
    }
  }

  /**
   * 🎯 Claim specific reward
   * @param {string} walletAddress - Adresa wallet-ului
   * @param {number} rewardId - ID-ul reward-ului de claim
   * @returns {Promise<Object>} Claim result
   */
  async claimReward(walletAddress, rewardId) {
    try {
      const response = await fetch(`${this.baseURL}/api/rewards/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet: walletAddress,
          rewardId: rewardId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      console.log("✅ UnifiedRewardsService: claimReward success", {
        rewardId,
        amount: data.rewardAmount,
        txHash: data.txHash
      });

      return data;
      
    } catch (error) {
      console.error("❌ UnifiedRewardsService: claimReward failed", error);
      throw error;
    }
  }

  /**
   * 🎯 Claim toate pending rewards
   * @param {string} walletAddress - Adresa wallet-ului
   * @returns {Promise<Object>} Claim result
   */
  async claimAllRewards(walletAddress) {
    try {
      const response = await fetch(`${this.baseURL}/api/rewards/claim-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wallet: walletAddress
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      console.log("✅ UnifiedRewardsService: claimAllRewards success", {
        totalAmount: data.totalAmount,
        rewardCount: data.rewardCount,
        txHash: data.txHash
      });

      return data;
      
    } catch (error) {
      console.error("❌ UnifiedRewardsService: claimAllRewards failed", error);
      throw error;
    }
  }

  /**
   * 📊 Get rewards summary pentru afișare
   * @param {string} walletAddress - Adresa wallet-ului
   * @returns {Promise<Object>} Summary data formatted pentru UI
   */
  async getRewardsSummary(walletAddress) {
    try {
      console.log("🔄 UnifiedRewardsService: Getting rewards summary for:", walletAddress);
      const data = await this.getUserRewards(walletAddress);
      console.log("📋 UnifiedRewardsService: Raw rewards data:", data);
      
      // Group rewards by type
      const summaryByType = {};
      data.summary.forEach(item => {
        summaryByType[item.reward_type] = {
          pending: parseFloat(item.pending_amount || 0),
          claimed: parseFloat(item.claimed_amount || 0),
          pendingCount: parseInt(item.pending_count || 0),
          claimedCount: parseInt(item.claimed_count || 0)
        };
      });

      // Get pending rewards for claim buttons
      const pendingRewards = data.rewards.filter(r => r.status === 'pending');
      
      return {
        wallet: walletAddress,
        totalPending: data.totalPending,
        totalClaimed: data.totalClaimed,
        byType: summaryByType,
        pendingRewards,
        allRewards: data.rewards,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error("❌ UnifiedRewardsService: getRewardsSummary failed", error);
      return {
        wallet: walletAddress,
        totalPending: 0,
        totalClaimed: 0,
        byType: {},
        pendingRewards: [],
        allRewards: [],
        error: error.message,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * 🎮 Generate mock data pentru testing
   * @param {string} walletAddress - Adresa wallet-ului
   * @returns {Object} Mock rewards data
   */
  generateMockData(walletAddress) {
    const mockRewards = [
      {
        id: 1,
        user_wallet: walletAddress,
        reward_type: 'referral',
        amount: 125.5,
        status: 'pending',
        referral_code: 'CODE-TEST1',
        created_at: new Date(Date.now() - 24*60*60*1000).toISOString()
      },
      {
        id: 2,
        user_wallet: walletAddress,
        reward_type: 'telegram',
        amount: 50.0,
        status: 'pending',
        referral_code: null,
        created_at: new Date(Date.now() - 12*60*60*1000).toISOString()
      },
      {
        id: 3,
        user_wallet: walletAddress,
        reward_type: 'referral',
        amount: 75.25,
        status: 'claimed',
        referral_code: 'CODE-TEST2',
        created_at: new Date(Date.now() - 48*60*60*1000).toISOString(),
        claimed_at: new Date(Date.now() - 24*60*60*1000).toISOString(),
        tx_hash: '0x1234567890abcdef...'
      }
    ];

    return {
      wallet: walletAddress,
      rewards: mockRewards,
      summary: [
        {
          reward_type: 'referral',
          pending_amount: 125.5,
          claimed_amount: 75.25,
          pending_count: 1,
          claimed_count: 1
        },
        {
          reward_type: 'telegram',
          pending_amount: 50.0,
          claimed_amount: 0,
          pending_count: 1,
          claimed_count: 0
        }
      ],
      totalPending: 175.5,
      totalClaimed: 75.25,
      mock: true
    };
  }

  /**
   * 🔧 Format amount pentru afișare
   * @param {number|string} amount - Amount to format
   * @param {number} decimals - Number of decimals
   * @returns {string} Formatted amount
   */
  formatAmount(amount, decimals = 4) {
    const num = parseFloat(amount);
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    return num.toFixed(decimals);
  }

  /**
   * 📅 Format date pentru afișare
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch (e) {
      return dateString;
    }
  }
}

// Export singleton instance
const unifiedRewardsService = new UnifiedRewardsService();

export default unifiedRewardsService;

// Export helper functions
export const {
  formatAmount,
  formatDate
} = unifiedRewardsService;


