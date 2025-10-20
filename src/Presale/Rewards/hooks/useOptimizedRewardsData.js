/**
 * 🎁 OPTIMIZED REWARDS DATA HOOK
 * 
 * Centralizează și optimizează obținerea datelor pentru AI Rewards Hub
 * Elimină duplicatele și îmbunătățește performanța
 */

import { useState, useEffect, useCallback, useRef } from "react";
import unifiedRewardsService from "../../../services/unifiedRewardsService";
import nodeRewardsService from "../../../services/nodeRewardsService";
import axios from "axios";

// Cache și rate limiting
const CACHE_DURATION = 30000; // 30 secunde
const RATE_LIMIT_DELAY = 2000; // 2 secunde între requests
const MAX_RETRIES = 3;

class RewardsDataCache {
  constructor() {
    this.cache = new Map();
    this.lastFetch = new Map();
  }

  isValid(key) {
    const lastFetch = this.lastFetch.get(key);
    return lastFetch && (Date.now() - lastFetch) < CACHE_DURATION;
  }

  get(key) {
    if (this.isValid(key)) {
      return this.cache.get(key);
    }
    return null;
  }

  set(key, data) {
    this.cache.set(key, data);
    this.lastFetch.set(key, Date.now());
  }

  canFetch(key) {
    const lastFetch = this.lastFetch.get(key);
    return !lastFetch || (Date.now() - lastFetch) > RATE_LIMIT_DELAY;
  }

  clear(key) {
    if (key) {
      this.cache.delete(key);
      this.lastFetch.delete(key);
    } else {
      this.cache.clear();
      this.lastFetch.clear();
    }
  }
}

const rewardsCache = new RewardsDataCache();

export default function useOptimizedRewardsData(walletAddress) {
  // Consolidated state
  const [rewardsData, setRewardsData] = useState({
    // Unified data
    totalPending: 0,
    totalClaimed: 0,
    totalUnclaimed: 0,
    
    // Breakdown by source
    telegram: {
      pending: 0,
      timeSpent: 0,
      messages: 0,
      eligible: false,
      investigationData: null,
      loading: false,
      error: null
    },
    
    referral: {
      pending: 0,
      claimed: 0,
      code: null,
      loading: false,
      error: null
    },
    
    nodeRewards: {
      balance: 0,
      tiers: [],
      loading: false,
      error: null
    },
    
    unified: {
      pendingRewards: [],
      byType: {},
      loading: false,
      error: null
    },
    
    // Meta
    loading: false,
    error: null,
    lastUpdated: null,
    refreshing: false
  });

  const abortControllerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);

  // Optimized fetch function with retry logic
  const fetchWithRetry = useCallback(async (fetchFn, retries = MAX_RETRIES) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fetchFn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }, []);

  // Fetch Telegram data with optimization
  const fetchTelegramData = useCallback(async (forceRefresh = false) => {
    if (!walletAddress) return null;
    
    const cacheKey = `telegram_${walletAddress}`;
    
    if (!forceRefresh) {
      const cached = rewardsCache.get(cacheKey);
      if (cached) {
        console.log("📱 Using cached Telegram data");
        return cached;
      }
      
      if (!rewardsCache.canFetch(cacheKey)) {
        console.log("⏳ Rate limiting Telegram fetch");
        return null;
      }
    }

    return fetchWithRetry(async () => {
      console.log("📱 Fetching fresh Telegram data for:", walletAddress);
      
      const backendURL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
      const response = await axios.get(`${backendURL}/api/telegram-rewards/reward/${walletAddress}`, {
        timeout: 10000,
        signal: abortControllerRef.current?.signal
      });

      const data = response.data;
      const timeSpentSeconds = data.time_spent || 0;
      const timeSpentHours = data.time_spent_hours || (timeSpentSeconds / 3600);
      
      const processedData = {
        pending: data.reward || 0,
        timeSpent: timeSpentSeconds,
        timeSpentHours: typeof timeSpentHours === 'string' ? timeSpentHours : timeSpentHours.toFixed(2),
        messages: data.messages_total || 0,
        eligible: data.eligible || (data.reward > 0),
        investigationData: {
          totalSeconds: timeSpentSeconds,
          totalHours: typeof timeSpentHours === 'string' ? timeSpentHours : timeSpentHours.toFixed(2),
          messagesTotal: data.messages_total || 0,
          activityRate: timeSpentSeconds > 0 ? ((data.messages_total || 0) / (timeSpentSeconds / 3600)).toFixed(2) : "0",
          dataSource: "neural-network",
          timestamp: new Date().toISOString(),
          systemStatus: "✅ AI Connected"
        },
        loading: false,
        error: null
      };

      rewardsCache.set(cacheKey, processedData);
      return processedData;
    });
  }, [walletAddress, fetchWithRetry]);

  // Fetch Referral data with optimization
  const fetchReferralData = useCallback(async (forceRefresh = false) => {
    if (!walletAddress) return null;
    
    const cacheKey = `referral_${walletAddress}`;
    
    if (!forceRefresh) {
      const cached = rewardsCache.get(cacheKey);
      if (cached) {
        console.log("👥 Using cached Referral data");
        return cached;
      }
    }

    return fetchWithRetry(async () => {
      console.log("👥 Fetching fresh Referral data for:", walletAddress);
      
      const response = await axios.get(`/api/referral/reward/${walletAddress}`, {
        timeout: 8000,
        signal: abortControllerRef.current?.signal
      });

      const processedData = {
        pending: response.data.reward && !response.data.claimed ? response.data.reward : 0,
        claimed: response.data.claimed || false,
        code: response.data.code || null,
        loading: false,
        error: null
      };

      rewardsCache.set(cacheKey, processedData);
      return processedData;
    });
  }, [walletAddress, fetchWithRetry]);

  // Fetch Node.sol rewards with optimization
  const fetchNodeRewards = useCallback(async (forceRefresh = false) => {
    if (!walletAddress) return null;
    
    const cacheKey = `node_${walletAddress}`;
    
    if (!forceRefresh) {
      const cached = rewardsCache.get(cacheKey);
      if (cached) {
        console.log("🧠 Using cached Node rewards data");
        return cached;
      }
    }

    return fetchWithRetry(async () => {
      console.log("🧠 Fetching fresh Node rewards for:", walletAddress);
      
      await nodeRewardsService.initialize();
      const balance = await nodeRewardsService.getUserRewardBalance(walletAddress);
      const tiers = await nodeRewardsService.getRewardTiers();

      const processedData = {
        balance: parseFloat(balance) || 0,
        tiers: tiers || [],
        loading: false,
        error: null
      };

      rewardsCache.set(cacheKey, processedData);
      return processedData;
    });
  }, [walletAddress, fetchWithRetry]);

  // Fetch Unified rewards with optimization
  const fetchUnifiedRewards = useCallback(async (forceRefresh = false) => {
    if (!walletAddress) return null;
    
    const cacheKey = `unified_${walletAddress}`;
    
    if (!forceRefresh) {
      const cached = rewardsCache.get(cacheKey);
      if (cached) {
        console.log("🎁 Using cached Unified rewards data");
        return cached;
      }
    }

    return fetchWithRetry(async () => {
      console.log("🎁 Fetching fresh Unified rewards for:", walletAddress);
      
      const summary = await unifiedRewardsService.getRewardsSummary(walletAddress);

      const processedData = {
        pendingRewards: summary.pendingRewards || [],
        byType: summary.byType || {},
        totalPending: summary.totalPending || 0,
        totalClaimed: summary.totalClaimed || 0,
        loading: false,
        error: null
      };

      rewardsCache.set(cacheKey, processedData);
      return processedData;
    });
  }, [walletAddress, fetchWithRetry]);

  // Consolidated fetch function
  const fetchAllRewardsData = useCallback(async (forceRefresh = false) => {
    if (!walletAddress) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setRewardsData(prev => ({ 
      ...prev, 
      loading: true, 
      refreshing: forceRefresh,
      error: null 
    }));

    try {
      console.group("🎁 [OptimizedRewards] Fetching all rewards data");
      console.log("Wallet:", walletAddress);
      console.log("Force refresh:", forceRefresh);

      // Fetch all data in parallel for better performance
      const [telegramData, referralData, nodeData, unifiedData] = await Promise.allSettled([
        fetchTelegramData(forceRefresh),
        fetchReferralData(forceRefresh),
        fetchNodeRewards(forceRefresh),
        fetchUnifiedRewards(forceRefresh)
      ]);

      // Process results
      const telegram = telegramData.status === 'fulfilled' ? telegramData.value : {
        pending: 0, timeSpent: 0, messages: 0, eligible: false,
        loading: false, error: telegramData.reason?.message || "Failed to fetch"
      };

      const referral = referralData.status === 'fulfilled' ? referralData.value : {
        pending: 0, claimed: false, code: null,
        loading: false, error: referralData.reason?.message || "Failed to fetch"
      };

      const nodeRewards = nodeData.status === 'fulfilled' ? nodeData.value : {
        balance: 0, tiers: [],
        loading: false, error: nodeData.reason?.message || "Failed to fetch"
      };

      const unified = unifiedData.status === 'fulfilled' ? unifiedData.value : {
        pendingRewards: [], byType: {}, totalPending: 0, totalClaimed: 0,
        loading: false, error: unifiedData.reason?.message || "Failed to fetch"
      };

      // Calculate totals (avoid duplicates)
      const telegramPending = telegram?.pending || 0;
      const referralPending = referral?.pending || 0;
      const nodePending = nodeRewards?.balance || 0;
      const unifiedPending = unified?.totalPending || 0;
      
      // Total unclaimed (prioritize specific sources over unified to avoid duplicates)
      const totalUnclaimed = telegramPending + referralPending + nodePending;
      const totalClaimed = (referral?.claimed ? referral.pending : 0) + (unified?.totalClaimed || 0);

      setRewardsData({
        totalPending: totalUnclaimed,
        totalClaimed: totalClaimed,
        totalUnclaimed: totalUnclaimed,
        telegram: telegram || {},
        referral: referral || {},
        nodeRewards: nodeRewards || {},
        unified: unified || {},
        loading: false,
        refreshing: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });

      console.log("✅ [OptimizedRewards] All data fetched successfully");
      console.log("Total unclaimed:", totalUnclaimed);
      console.groupEnd();

    } catch (error) {
      console.error("❌ [OptimizedRewards] Error fetching rewards:", error);
      setRewardsData(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: error.message || "Failed to fetch rewards data"
      }));
      console.groupEnd();
    }
  }, [walletAddress, fetchTelegramData, fetchReferralData, fetchNodeRewards, fetchUnifiedRewards]);

  // Manual refresh function
  const refreshRewards = useCallback((clearCache = false) => {
    if (clearCache) {
      rewardsCache.clear();
    }
    fetchAllRewardsData(true);
  }, [fetchAllRewardsData]);

  // Auto-fetch on wallet change
  useEffect(() => {
    if (walletAddress) {
      // Clear timeout if exists
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Debounce fetch to avoid rapid calls
      fetchTimeoutRef.current = setTimeout(() => {
        fetchAllRewardsData(false);
      }, 300);
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [walletAddress, fetchAllRewardsData]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!walletAddress) return;

    const interval = setInterval(() => {
      console.log("🔄 [OptimizedRewards] Auto-refresh triggered");
      fetchAllRewardsData(false); // Use cache if still valid
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [walletAddress, fetchAllRewardsData]);

  return {
    ...rewardsData,
    refreshRewards,
    clearCache: () => rewardsCache.clear()
  };
}
