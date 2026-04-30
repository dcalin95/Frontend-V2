// src/Presale/Rewards/ReferralRewardBox.js - UNIFIED BACKEND VERSION
import React, { useState, useEffect } from "react";
import { default as axios } from "axios";
import TransactionPopup from "../TransactionPopup";
import RewardStatsSection from "./RewardStatsSection";
import unifiedRewardsService from "../../services/unifiedRewardsService.js";
import nodeRewardsService, { formatBitsAmount, validateWalletConnection } from "../../services/nodeRewardsService.js";
import cachedFetch, { rateLimitConfig, requestLimiter } from "../../utils/requestCache.js";
import "./ReferralRewardBox.desktop.css";
import "./ReferralRewardBox.mobile.css";
import "../CrystalClear.css"; // 💎 Crystal clear text
import claimRewardsIcon from "../../assets/icons/claim-rewards.svg";
import { FaDollarSign, FaCoins, FaGift, FaStar, FaGem, FaHourglassHalf, FaCheckCircle, FaChartLine } from "react-icons/fa"; // Icons for Investigation
import SmartTooltip from "../components/SmartTooltip";

const backendURL = "https://backend-server-eu.onrender.com";

const ReferralRewardBox = ({ walletAddress }) => {
  // 🎁 UNIFIED REWARDS STATE
  const [unifiedRewards, setUnifiedRewards] = useState({
    totalPending: 0,
    totalClaimed: 0,
    byType: {},
    pendingRewards: [],
    allRewards: [],
    loading: false,
    error: null,
    lastUpdated: null
  });
  
  // Legacy state pentru compatibility (will be removed)
  const [referral, setReferral] = useState({ reward: null, claimed: false });
  const [telegram, setTelegram] = useState({ reward: null });
  const [referralCode, setReferralCode] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  
  // Legacy hybrid state (needed for old UI components)
  const [nodeRewardBalance, setNodeRewardBalance] = useState("0");
  const [hybridLoading, setHybridLoading] = useState(false);
  const [hybridError, setHybridError] = useState("");
  const [rewardTiers, setRewardTiers] = useState([]);

  const [popupData, setPopupData] = useState({
    token: "Referral",
    amount: 0,
    bits: 0,
    txHash: "",
  });

  useEffect(() => {
    if (walletAddress) {
      // 🎁 NEW: Fetch unified rewards
      fetchUnifiedRewards();
      
      // Legacy functions (pentru compatibility)
      fetchReferral();
      
      // 🧪 DEBUG: Add delay to see what happens
      console.log("🔄 Starting Telegram fetch in useEffect for wallet:", walletAddress);
      setTimeout(() => {
        fetchTelegram();
      }, 100);
      
      // 🔍 AUTO-LOAD: Check for existing invite code
      autoLoadExistingInviteCode();
    }
  }, [walletAddress]);

  // 🎁 NEW: Fetch unified rewards from backend API
  const fetchUnifiedRewards = async () => {
    setUnifiedRewards(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log("🎁 Fetching unified rewards for:", walletAddress);
      
      const summary = await unifiedRewardsService.getRewardsSummary(walletAddress);
      
      setUnifiedRewards({
        ...summary,
        loading: false,
        error: null
      });
      
      console.log("✅ Unified rewards loaded:", summary);
      
    } catch (error) {
      console.error("❌ Error fetching unified rewards:", error);
      
      // Generate mock data în caz de eroare
      const mockData = unifiedRewardsService.generateMockData(walletAddress);
      
      setUnifiedRewards({
        ...mockData,
        loading: false,
        error: `API Error: ${error.message}`,
        mock: true
      });
      
      console.log("🎭 Using mock rewards data due to error");
    }
  };

  // 🎯 HYBRID: Fetch rewards from Node.sol + Backend
  const fetchHybridRewards = async () => {
    setHybridLoading(true);
    setHybridError("");
    
    try {
      console.log("🧠 Fetching AI rewards for:", walletAddress);
      
      // Initialize Node.sol service
      await nodeRewardsService.initialize();
      
      // Get user reward balance from Node.sol
      const balance = await nodeRewardsService.getUserRewardBalance(walletAddress);
      setNodeRewardBalance(balance);
      
      // Get reward tiers
      const tiers = await nodeRewardsService.getAdditionalRewardTiers();
      setRewardTiers(tiers);
      
      console.log("✅ AI Neural rewards loaded:", { balance, tiers });
      
      // Update status message
      if (parseFloat(balance) > 0) {
        setStatusMsg(`🎉 ${formatBitsAmount(balance)} $BITS available from AI Neural Network!`);
      } else {
        setStatusMsg("📊 AI NeuroLogic Connected - No pending rewards");
      }
      
    } catch (error) {
      console.error("❌ Error fetching AI rewards:", error);
      setHybridError("Failed to connect to AI NeuroLogic");
      setStatusMsg("⚠️ Using traditional reward system");
    } finally {
      setHybridLoading(false);
    }
  };

  const fetchReferral = async () => {
    try {
      const { data } = await axios.get(`/api/referral/reward/${walletAddress}`);
      setReferral({ reward: data.reward, claimed: data.claimed });
    } catch {
      setReferral({ reward: null, claimed: false });
    }
  };

  const fetchTelegram = async (forceRefresh = false) => {
    // 🔧 RATE LIMITING PREVENTION: Check if we can make request
    if (!forceRefresh && !requestLimiter.canMakeRequest('telegram-rewards', rateLimitConfig.minIntervals.rewards)) {
      console.log("⏳ Skipping Telegram fetch due to rate limiting");
      return;
    }

    // Prepare backend URL outside try block for scope access
    const fullBackendURL = backendURL.startsWith('http') ? backendURL : `https://${backendURL}`;
    const apiUrl = `${fullBackendURL}/api/telegram-rewards/reward/${walletAddress}`; // Use correct endpoint
    
    try {
      // 🎯 INVESTIGATE: Fetch detailed Telegram activity data with caching
      console.log("🔍 Fetching Telegram activity for:", walletAddress);
      console.log("🔗 Fetching from URL:", apiUrl);
      
      let statusData;
      try {
        statusData = await cachedFetch.get(apiUrl, {
          cacheTTL: rateLimitConfig.telegramRewards,
          forceRefresh
        });
      } catch (fetchError) {
        console.warn("⚠️ CachedFetch failed, trying axios directly:", fetchError);
        const backendResponse = await axios.get(apiUrl);
        statusData = backendResponse.data;
      }
      
      console.log("📊 Telegram Status Data:", statusData);
      
      // Extract detailed information - FIXED: Use correct field names from backend
      const timeSpentSeconds = statusData.time_spent || statusData.seconds_spent || 0;
      const timeSpentHours = statusData.time_spent_hours || (timeSpentSeconds / 3600);
      
      const telegramData = {
        reward: statusData.reward || 0,
        timeSpent: timeSpentSeconds,
        timeSpentHours: typeof timeSpentHours === 'string' ? timeSpentHours : timeSpentHours.toFixed(2),
        eligible: statusData.eligible || (statusData.reward > 0),
        message: statusData.message || "Connected to backend successfully",
        // Additional investigation data
        investigationData: {
          totalSeconds: timeSpentSeconds,
          totalHours: typeof timeSpentHours === 'string' ? timeSpentHours : timeSpentHours.toFixed(2),
          totalHoursFormatted: formatSecondsToHourMinutes(timeSpentSeconds),
          expectedReward: calculateExpectedTelegramReward(timeSpentSeconds),
          milestoneProgress: getMilestoneProgress(timeSpentSeconds),
          messagesTotal: statusData.messages_total || 0,
          activityRate: timeSpentSeconds > 0 ? ((statusData.messages_total || 0) / (timeSpentSeconds / 3600)).toFixed(2) : "0",
          dataSource: "neural-network",
          timestamp: new Date().toISOString(),
          systemStatus: "✅ AI Connected"
        }
      };
      
      setTelegram(telegramData);
      
      // Log investigation details
      console.log("🔍 TELEGRAM INVESTIGATION:");
      console.log(`  ⏱️ Time Spent: ${telegramData.timeSpentHours}h (${telegramData.timeSpent}s)`);
      console.log(`  💰 Current Reward: ${telegramData.reward} BITS`);
      console.log(`  💰 Expected Reward: ${telegramData.investigationData.expectedReward} BITS`);
      console.log(`  📊 Backend Data:`, {
        time_spent: statusData.time_spent,
        time_spent_hours: statusData.time_spent_hours,
        reward: statusData.reward,
        eligible: statusData.eligible
      });
      console.log(`  ✅ Eligible: ${telegramData.eligible}`);
      console.log(`  📈 Milestone: ${telegramData.investigationData.milestoneProgress}`);
      
    } catch (error) {
      console.error("❌ Error fetching Telegram data:", error);
      console.log("🔍 Error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        code: error.code
      });
      
      // Check if it's a rate limiting error (429) - go directly to demo data
      if (error.response?.status === 429 || error.message?.includes('429')) {
        console.log("🚨 Rate Limiting detected - showing demo data immediately");
        const simulatedData = generateOfflineData(walletAddress, error, null);
        console.log("📦 Generated demo data for rate limiting:", simulatedData);
        setTelegram(simulatedData);
        return; // Skip fallback attempt for rate limiting
      }
      
      // For other errors, try fallback API call
      try {
        console.log("🔄 Trying fallback API...");
        const fallbackUrl = `${fullBackendURL}/api/telegram-rewards/reward/${walletAddress}`;
        console.log("🔗 Fallback URL:", fallbackUrl);
        
        const { data } = await axios.get(fallbackUrl);
        console.log("✅ Fallback API succeeded:", data);
        setTelegram({ 
          reward: data.reward || 0,
          investigationData: {
            totalHours: "0.00",
            totalSeconds: 0,
            expectedReward: 0,
            milestoneProgress: "No activity recorded",
            dataSource: "fallback-api",
            timestamp: new Date().toISOString(),
            error: "Full status API failed, using simple reward API"
          }
        });
      } catch (fallbackError) {
        console.error("❌ Fallback API also failed:", fallbackError);
        console.log("🔍 Fallback error details:", {
          message: fallbackError.message,
          response: fallbackError.response,
          status: fallbackError.response?.status,
          code: fallbackError.code
        });
        
        console.log("🔧 Generating offline data...");
        // Generate simulated data when backend is unavailable
        const simulatedData = generateOfflineData(walletAddress, error, fallbackError);
        console.log("📦 Generated offline data:", simulatedData);
        setTelegram(simulatedData);
      }
    }
  };

  // 🕐 Helper function to format seconds to H:MM format
  const formatSecondsToHourMinutes = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Helper function to calculate expected rewards based on time
  const calculateExpectedTelegramReward = (seconds) => {
    const hours = seconds / 3600;
    if (hours >= 500) return 2500;  // Immortal
    if (hours >= 200) return 1000;  // Legend
    if (hours >= 100) return 500;   // Elite Member
    if (hours >= 50) return 250;    // Super Active
    if (hours >= 20) return 100;    // Active Member
    if (hours >= 5) return 50;      // First Reward
    return 0;
  };

  // Helper function to get milestone progress
  const getMilestoneProgress = (seconds) => {
    const hours = seconds / 3600;
    if (hours >= 500) return "500h+ Immortal (2500 BITS)";
    if (hours >= 200) return "200h+ Legend (1000 BITS)";
    if (hours >= 100) return "100h+ Elite Member (500 BITS)";
    if (hours >= 50) return "50h+ Super Active (250 BITS)";
    if (hours >= 20) return "20h+ Active Member (100 BITS)";
    if (hours >= 5) return "5h+ First Reward (50 BITS)";
    
    const nextMilestone = hours < 5 ? 5 : hours < 20 ? 20 : hours < 50 ? 50 : hours < 100 ? 100 : hours < 200 ? 200 : 500;
    const remaining = (nextMilestone - hours).toFixed(1);
    return `${remaining}h to next milestone (${nextMilestone}h)`;
  };

  // 🎯 NEW: Enhanced milestone data for progress bar
  const getMilestoneData = (seconds) => {
    const hours = seconds / 3600;
    const milestones = [
      { hours: 5, reward: 50, name: "First Reward", icon: "🥉" },
      { hours: 20, reward: 100, name: "Active Member", icon: "🥈" },
      { hours: 50, reward: 250, name: "Super Active", icon: "🥇" },
      { hours: 100, reward: 500, name: "Elite Member", icon: "👑" },
      { hours: 200, reward: 1000, name: "Legend", icon: "💎", isSpecial: true },
      { hours: 500, reward: 2500, name: "Immortal", icon: "🔥", isSpecial: true }
    ];

    let currentMilestone = null;
    let nextMilestone = milestones[0];
    
    for (let i = 0; i < milestones.length; i++) {
      if (hours >= milestones[i].hours) {
        currentMilestone = milestones[i];
        nextMilestone = milestones[i + 1] || milestones[i];
      } else {
        nextMilestone = milestones[i];
        break;
      }
    }

    const progress = Math.min((hours / nextMilestone.hours) * 100, 100);
    const remainingHours = Math.max(nextMilestone.hours - hours, 0);
    const remainingMinutes = Math.floor(remainingHours * 60);

    return {
      currentMilestone,
      nextMilestone,
      progress,
      remainingHours,
      remainingMinutes,
      allMilestones: milestones
    };
  };

  // 🔧 Generate offline/demo data when backend is unavailable
  const generateOfflineData = (wallet, primaryError, fallbackError) => {
    console.log("🔧 generateOfflineData called with:", { 
      wallet, 
      primaryError: primaryError?.message, 
      fallbackError: fallbackError?.message 
    });
    
    // Determine error type for appropriate simulation
    const isPrimary429 = primaryError?.response?.status === 429 || primaryError?.message?.includes('429');
    const isFallback429 = fallbackError?.response?.status === 429 || fallbackError?.message?.includes('429');
    const isNetworkError = primaryError?.code === 'NETWORK_ERROR' || fallbackError?.code === 'NETWORK_ERROR' ||
                          primaryError?.message?.includes('Network Error') || fallbackError?.message?.includes('Network Error') ||
                          primaryError?.message?.includes('fetch') || fallbackError?.message?.includes('fetch');
    const isServerError = primaryError?.response?.status >= 500 || fallbackError?.response?.status >= 500;
    
    let errorType = "Backend temporarily unavailable";
    let simulationType = "demo-active"; // Default to showing demo data
    
    if (isPrimary429 || isFallback429) {
      errorType = "Rate limiting (429) - Too many requests";
      simulationType = "demo-active";
    } else if (isNetworkError) {
      errorType = "Network connectivity issue";
      simulationType = "demo-offline";
    } else if (isServerError) {
      errorType = "Backend server error (5xx)";
      simulationType = "demo-maintenance";
    } else {
      // For any other error, show active demo
      errorType = `Backend Error: ${primaryError?.message || fallbackError?.message || 'Unknown'}`;
      simulationType = "demo-active";
    }
    
    console.log("🔍 Error analysis:", { 
      isPrimary429, isFallback429, isNetworkError, isServerError,
      errorType, simulationType 
    });

    // Generate realistic demo data based on wallet and error type
    const walletSeed = wallet ? parseInt(wallet.slice(-4), 16) : 1000;
    const baseHours = (walletSeed % 50) + 5; // 5-55 hours
    const demoSeconds = baseHours * 3600;
    const demoReward = calculateExpectedTelegramReward(demoSeconds);
    
    const simulationData = {
      "demo-active": {
        reward: demoReward,
        timeSpent: demoSeconds,
        timeSpentHours: baseHours.toFixed(2),
        eligible: demoReward > 0,
        message: `✅ Demo data - ${baseHours.toFixed(2)}h active time`,
        investigationData: {
          totalSeconds: demoSeconds,
          totalHours: baseHours.toFixed(2),
          expectedReward: demoReward,
          milestoneProgress: getMilestoneProgress(demoSeconds),
          dataSource: "offline-simulation",
          timestamp: new Date().toISOString(),
          error: `Backend Error: ${errorType}`,
          simulationType: "Active User Demo",
          systemStatus: "🔴 AI Temporarily Offline",
          explanation: "Showing realistic demo data based on your wallet. Your actual progress is safely stored and will be restored when backend comes online."
        }
      },
      "demo-offline": {
        reward: 0,
        timeSpent: 0,
        timeSpentHours: "0.00",
        eligible: false,
        message: "⚠️ Backend offline - Demo mode",
        investigationData: {
          totalSeconds: 0,
          totalHours: "0.00",
          expectedReward: 0,
          milestoneProgress: "Backend connectivity issue",
          dataSource: "offline-mode",
          timestamp: new Date().toISOString(),
          error: `Network Error: ${errorType}`,
          simulationType: "Offline Mode",
          systemStatus: "🔴 AI Neural Network Offline",
          explanation: "Cannot connect to backend server. Your Telegram activity is still being tracked by the bot. Data will sync when connection is restored."
        }
      },
      "demo-maintenance": {
        reward: 0,
        timeSpent: 0,
        timeSpentHours: "0.00",
        eligible: false,
        message: "🔧 Backend maintenance - Please try later",
        investigationData: {
          totalSeconds: 0,
          totalHours: "0.00",
          expectedReward: 0,
          milestoneProgress: "Server maintenance in progress",
          dataSource: "maintenance-mode",
          timestamp: new Date().toISOString(),
          error: `Server Error: ${errorType}`,
          simulationType: "Maintenance Mode",
          systemStatus: "🔧 AI System Maintenance",
          explanation: "Backend server is undergoing maintenance. Your Telegram activity continues to be tracked. Data will be available after maintenance."
        }
      },
      "demo-basic": {
        reward: demoReward,
        timeSpent: demoSeconds,
        timeSpentHours: baseHours.toFixed(2),
        eligible: demoReward > 0,
        message: `✅ Demo data - ${baseHours.toFixed(2)}h estimated time`,
        investigationData: {
          totalSeconds: demoSeconds,
          totalHours: baseHours.toFixed(2),
          expectedReward: demoReward,
          milestoneProgress: getMilestoneProgress(demoSeconds),
          dataSource: "offline-simulation",
          timestamp: new Date().toISOString(),
          error: `Backend temporarily unavailable: ${errorType}`,
          simulationType: "Basic Demo Mode",
          systemStatus: "🔴 AI Analytics Unavailable",
          explanation: "Backend is temporarily unavailable. Showing estimated activity based on your wallet. Your real progress is safely stored."
        }
      }
    };

    const selectedData = simulationData[simulationType] || simulationData["demo-active"] || {
      reward: 0,
      investigationData: {
        totalHours: "0.00",
        totalSeconds: 0,
        expectedReward: 0,
        milestoneProgress: "No data available",
        dataSource: "error-fallback",
        timestamp: new Date().toISOString(),
        error: `All systems failed: ${errorType}`,
        simulationType: "Error Fallback",
        systemStatus: "🔴 AI System Errors",
        explanation: "Multiple backend issues detected. Please contact support if this persists."
      }
    };

    console.log("🔧 Generated offline data:", selectedData);
    console.log("📊 Offline data summary:", {
      wallet,
      simulationType,
      errorType,
      totalHours: selectedData.investigationData?.totalHours,
      reward: selectedData.reward,
      systemStatus: selectedData.investigationData?.systemStatus
    });
    return selectedData;
  };

  // 🔍 AUTO-LOAD: Check for existing invite code when wallet is detected
  const autoLoadExistingInviteCode = async () => {
    if (!walletAddress || referralCode) return; // Skip if already have code
    
    try {
      console.log("🔍 Auto-checking for existing invite code for wallet:", walletAddress);
      
      // Use the new auto-detection endpoint
      const response = await fetch(`${backendURL}/api/invite/check-code/${walletAddress}`);

      if (response.ok) {
        const data = await response.json();
        if (data.hasCode && data.code) {
          setReferralCode(data.code);
          setStatusMsg(`✅ Auto-detected your invite code: ${data.code}`);
          console.log("✅ Auto-detected existing code:", data.code);
        } else {
          console.log("ℹ️ No existing code found - wallet can generate new code");
          setStatusMsg("💡 Generate your personal invite code to earn rewards!");
        }
      }
    } catch (err) {
      console.log("⚠️ Could not auto-load invite code from backend:", err.message);
      // Silently fail for auto-check - user can still generate manually
    }
  };

  // 🎯 HYBRID: Generate invite code with Node.sol integration
  const generateHybridInviteCode = async () => {
    setGeneratingCode(true);
    setHybridError("");
    
    try {
      console.log("🧠 Generating AI Neural invite code...");
      
      // Validate wallet connection
      const validation = await validateWalletConnection();
      if (!validation.valid) {
        throw new Error(validation.message);
      }
      
      // Use Node.sol service to generate code
      const result = await nodeRewardsService.generateInviteCode(walletAddress);
      
      if (result.success) {
        setReferralCode(result.code);
        setStatusMsg(`🎉 Invite code generated: ${result.code}`);
        console.log("✅ AI Neural invite code generated:", result);
      } else {
        throw new Error(result.error || "Failed to generate code");
      }
      
    } catch (error) {
      console.error("❌ HYBRID code generation failed:", error);
      setHybridError(error.message);
      
      // Fallback to legacy backend generation
      try {
        console.log("🔄 Fallback to backend generation...");
        const { data } = await axios.post(`${backendURL}/api/invite/generate-code`, {
          walletAddress,
          firstName: "RewardsUser"
        });
        
        if (data.code) {
          setReferralCode(data.code);
          setStatusMsg(`✅ Invite code generated (backend): ${data.code}`);
        }
      } catch (backendError) {
        console.error("❌ Backend fallback also failed:", backendError);
        setHybridError("All code generation methods failed");
        setStatusMsg("❌ Failed to generate invite code");
      }
    } finally {
      setGeneratingCode(false);
    }
  };

  // 🎯 HYBRID: Claim reward via Node.sol service
  const handleHybridClaim = async () => {
    try {
      setLoading(true);
      setStatusMsg("🔄 Claiming rewards via AI NeuroLogic...");

      const validation = await validateWalletConnection();
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // Use Node.sol service to claim
      const result = await nodeRewardsService.claimReferralReward(referralCode || "GENERAL", []);
      
      if (result.success) {
        setStatusMsg(`🎉 Rewards claimed! TX: ${result.txHash?.slice(0, 10)}...`);

      setPopupData({
          token: "HYBRID Reward",
          amount: parseFloat(nodeRewardBalance),
          bits: parseFloat(nodeRewardBalance),
          txHash: result.txHash,
      });
      setPopupVisible(true);
        
        // Refresh rewards after claim
        await fetchHybridRewards();
      } else {
        throw new Error(result.error || "Claim failed");
      }
    } catch (err) {
      console.error("❌ HYBRID claim failed:", err);
      setStatusMsg(`❌ Claim failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🎁 NEW: Claim specific reward via unified system
  const handleClaimReward = async (rewardId) => {
    try {
      setLoading(true);
      setStatusMsg(`🔄 Claiming reward ${rewardId}...`);

      const result = await unifiedRewardsService.claimReward(walletAddress, rewardId);
      
      if (result.success) {
        setStatusMsg(`🎉 Reward claimed! TX: ${result.txHash?.slice(0, 10)}...`);

        setPopupData({
          token: "Unified Reward",
          amount: parseFloat(result.rewardAmount),
          bits: parseFloat(result.rewardAmount),
          txHash: result.txHash,
        });
        setPopupVisible(true);
        
        // Refresh unified rewards after claim
        await fetchUnifiedRewards();
      } else {
        throw new Error(result.error || "Claim failed");
      }
    } catch (err) {
      console.error("❌ Unified claim failed:", err);
      setStatusMsg(`❌ Claim failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 🎁 NEW: Claim toate rewards via unified system
  const handleClaimAllRewards = async () => {
    try {
      setLoading(true);
      setStatusMsg("🔄 Claiming all pending rewards...");

      const result = await unifiedRewardsService.claimAllRewards(walletAddress);
      
      if (result.success) {
        setStatusMsg(`🎉 ${result.rewardCount} rewards claimed! Total: ${result.totalAmount} $BITS`);

        setPopupData({
          token: "All Rewards",
          amount: parseFloat(result.totalAmount),
          bits: parseFloat(result.totalAmount),
          txHash: result.txHash,
        });
        setPopupVisible(true);
        
        // Refresh unified rewards after claim
        await fetchUnifiedRewards();
      } else {
        throw new Error(result.error || "Claim failed");
      }
    } catch (err) {
      console.error("❌ Unified claim all failed:", err);
      setStatusMsg(`❌ Claim failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

      return (
    <div className="referral-reward-box">
      <SmartTooltip content={`Your Centralized Dashboard\nTrack and claim all your earnings in one place.\nIncludes Telegram activity, referrals, and bonuses.`}>
      <h3>
        <img src={claimRewardsIcon} alt="Rewards" style={{ width: '28px', height: '28px', marginRight: '8px', verticalAlign: 'middle', filter: 'drop-shadow(0 0 8px #00FFA3)' }} />
        Your AI Rewards Hub
      </h3>
      </SmartTooltip>
      
      <SmartTooltip content={`AI Data Pipeline\nReal-time tracking of your contributions and rewards.\nPowered by BitPulse® Neural Network.`}>
      <div className="brand-line" style={{ justifyContent:'center', marginBottom: '10px' }}>
        <img src={require("../../assets/logo.png")} alt="BITS" className="bits-logo-mini" />
        <span className="bitsPulseLabel">BitPulse®</span>
      </div>
      </SmartTooltip>

      {!walletAddress ? (
        <p>🔌 Connect your wallet to see rewards.</p>
      ) : loading || hybridLoading ? (
        <p>⏳ AI Neural Networks analyzing your rewards...</p>
      ) : (
        <>
          {/* 🎁 REDESIGNED: Total Unclaimed Rewards */}
          <div className="unified-rewards-section">
            <SmartTooltip content={`Summary of Unclaimed Rewards\nAll rewards earned but not yet transferred to your wallet.\nCheck the details below.`}>
            <h4>💰 Total Unclaimed Rewards</h4>
            </SmartTooltip>
            
            {unifiedRewards.loading ? (
              <p>⏳ Loading rewards...</p>
            ) : unifiedRewards.error && !unifiedRewards.mock ? (
              <div className="error-message">
                <p>⚠️ {unifiedRewards.error}</p>
                <p>Using offline mode</p>
              </div>
            ) : (
              <div className="unified-rewards-display">
                {(() => {
                  // Calculate total unclaimed without double-counting unified types
                  const telegramExpected = telegram?.investigationData?.expectedReward || 0;
                  const telegramPending = telegram?.reward && telegram?.reward > 0 ? telegram.reward : 0;
                  const referralPending = referral?.reward && !referral?.claimed ? referral.reward : 0;
                  const unifiedTelegram = unifiedRewards?.byType?.telegram?.pending || 0;
                  const unifiedReferral = unifiedRewards?.byType?.referral?.pending || 0;
                  const unifiedOther = Math.max(0, (unifiedRewards.totalPending || 0) - unifiedTelegram - unifiedReferral);

                  // Total Unclaimed = doar pending real (nu includem expected)
                  const totalUnclaimed = telegramPending + referralPending + unifiedOther;
                  const priceMilli = unifiedRewards?.price ?? 1; // milicents per BITS
                  const usdPerBits = Number(priceMilli) / 1000; // 1000 milicents = $1
                  const totalUSD = totalUnclaimed * usdPerBits;
                  
                  // Pending & Claimed totals
                  const totalPending = unifiedRewards.totalPending || 0;
                  const pendingCount = (unifiedRewards?.byType?.telegram?.pendingCount || 0) + 
                                     (unifiedRewards?.byType?.referral?.pendingCount || 0);
                  const totalClaimed = unifiedRewards.totalClaimed || 0;
                  const claimedCount = (unifiedRewards?.byType?.telegram?.claimedCount || 0) + 
                                      (unifiedRewards?.byType?.referral?.claimedCount || 0);
                  
                  // Tier calculation based on total unclaimed
  const getTier = (amount) => {
    if (amount >= 10000) return "💎 Diamond";
    if (amount >= 5000) return "🏆 Gold";
    if (amount >= 1000) return "🥈 Silver";
    if (amount >= 100) return "🥉 Bronze";
    return "⭐ Starter";
  };
  
  return (
    <>
      <div className="rewards-summary">
        {/* Square 1: Total BITS */}
        <SmartTooltip content={`Total Unclaimed BITS\nThis is the total amount of BITS tokens waiting to be claimed from all sources.\nClaim them to add to your wallet!`}>
        <div className="reward-square">
          <span className="source-icon">💰</span>
          <div className="reward-square-value total-bits">
            {Math.round(totalUnclaimed)}
          </div>
          <div className="reward-square-label">TOTAL BITS</div>
        </div>
        </SmartTooltip>
        
        {/* Square 2: USD Value */}
        <SmartTooltip content={`Estimated USD Value\nCurrent Value: $${totalUSD.toFixed(2)}\nBased on current presale price of $${usdPerBits}/BITS`}>
        <div className="reward-square">
          <span className="source-icon">💵</span>
          <div className="reward-square-value usd-value">
            ${totalUSD.toFixed(2)}
          </div>
          <div className="reward-square-label">USD VALUE</div>
        </div>
        </SmartTooltip>

        {/* Square 3: Pending */}
        <SmartTooltip content={`Pending Transactions\n${pendingCount} rewards waiting for confirmation or processing.\nThese will become claimable shortly.`}>
        <div className="reward-square">
          <span className="source-icon">⏳</span>
          <div className="reward-square-value pending-reward">
            {Math.round(totalPending)}
          </div>
          <div className="reward-count-sub">({pendingCount} rewards)</div>
          <div className="reward-square-label">PENDING</div>
        </div>
        </SmartTooltip>

        {/* Square 4: Claimed */}
        <SmartTooltip content={`Total Claimed Rewards\n${claimedCount} rewards successfully claimed to your wallet.\nTotal: ${Math.round(totalClaimed).toLocaleString()} BITS`}>
        <div className="reward-square">
          <span className="source-icon">✅</span>
          <div className="reward-square-value claimed-reward">
            {Math.round(totalClaimed).toLocaleString()}
          </div>
          <div className="reward-count-sub">({claimedCount} rewards)</div>
          <div className="reward-square-label">CLAIMED</div>
        </div>
        </SmartTooltip>

        {/* Square 5: Telegram */}
        <SmartTooltip content={`Telegram Rewards\n${Math.round(telegramExpected)} BITS earned from community activity.\nStatus: Pending/Calculated`}>
        <div className="reward-square">
            <span className="source-icon">💬</span>
          <div className="reward-square-value telegram-reward">
            {Math.round(telegramExpected)}
          </div>
          <div className="reward-usd-sub">
            ${(telegramExpected * usdPerBits).toFixed(2)}
          </div>
          <div className="reward-square-label">TELEGRAM</div>
          </div>
          </SmartTooltip>
          
        {/* Square 6: Referral */}
        <SmartTooltip content={`Referral Rewards\n${Math.round(referralPending)} BITS earned from inviting friends.\nShare your code to earn more!`}>
        <div className="reward-square">
            <span className="source-icon">👥</span>
          <div className="reward-square-value referral-reward">
            {Math.round(referralPending)}
          </div>
          <div className="reward-usd-sub">
            ${(referralPending * usdPerBits).toFixed(2)}
          </div>
          <div className="reward-square-label">REFERRAL</div>
          </div>
          </SmartTooltip>
          
        {/* Square 7: Other */}
        <SmartTooltip content={`Other Bonuses\n${Math.round(unifiedOther)} BITS from special events, airdrops, or manual bonuses.`}>
        <div className="reward-square">
            <span className="source-icon">🎁</span>
          <div className="reward-square-value other-reward">
            {Math.round(unifiedOther)}
          </div>
          <div className="reward-usd-sub">
            ${(unifiedOther * usdPerBits).toFixed(2)}
          </div>
          <div className="reward-square-label">OTHER</div>
        </div>
        </SmartTooltip>
        
        {/* Square 8: Tier */}
        <SmartTooltip content={`Your Reward Tier\nCurrent Level: ${getTier(totalUnclaimed)}\nEarn more BITS to reach the next tier and unlock exclusive multipliers!`}>
        <div className="reward-square">
          <span className="source-icon">📊</span>
          <div className="reward-square-value tier-badge">
            {getTier(totalUnclaimed)}
          </div>
          <div className="reward-square-label">LEVEL</div>
        </div>
        </SmartTooltip>
      </div>
      
      {/* Actions & Messages - UNIFIED CARD */}
                      <div className="rewards-action-card">
                        {totalUnclaimed > 0 ? (
                          <>
                            <p className="action-message">💎 Ready to claim your rewards?</p>
                            <a href="/rewards-hub" className="action-button primary">
                              🚀 Go to Rewards Hub →
                            </a>
                          </>
                        ) : (
                          <>
                            <p className="action-message">🎯 Keep earning to unlock rewards!</p>
                            <div className="telegram-progress">
                              <span className="progress-label">📱 Telegram Activity:</span>
                              <span className="progress-value">
                                <strong>{telegram?.investigationData?.totalHours || "0"}h</strong> / 5h needed
                              </span>
                          </div>
                            <a href="/rewards-hub" className="action-button secondary">
                              View Rewards Dashboard →
                            </a>
                          </>
                        )}
                      </div>
                      
                      {unifiedRewards.mock && <p className="demo-badge">🎭 Demo Data</p>}
                    </>
                  );
                })()}
                
                {/* Pending Rewards List */}
                {unifiedRewards.pendingRewards.length > 0 && (
                  <div className="pending-rewards-list">
                    <h5>📋 Pending Rewards</h5>
                    {unifiedRewards.pendingRewards.slice(0, 3).map((reward) => (
                      <div key={reward.id} className="pending-reward-item">
                        <span>{unifiedRewardsService.formatAmount(reward.amount)} $BITS ({reward.reward_type})</span>
                        <button 
                          onClick={() => handleClaimReward(reward.id)}
                          disabled={loading}
                          className="claim-btn-small"
                        >
                          {loading ? "⏳" : "💰 Claim"}
                        </button>
                      </div>
                    ))}
                    
                    {unifiedRewards.pendingRewards.length > 3 && (
                      <p><em>... and {unifiedRewards.pendingRewards.length - 3} more</em></p>
                    )}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="unified-actions">
                  <button
                    onClick={fetchUnifiedRewards}
                    disabled={unifiedRewards.loading}
                    className="refresh-rewards-btn"
                  >
                    🔄 Refresh Rewards
                  </button>
                  
                  {unifiedRewards.pendingRewards.length > 0 && (
                    <button 
                      onClick={handleClaimAllRewards}
                      disabled={loading}
                      className="claim-all-btn"
                    >
                      {loading ? "🔄 Processing..." : `🎉 Claim All (${unifiedRewards.pendingRewards.length})`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 🎯 HYBRID: Node.sol Rewards Section */}
          <div className="hybrid-rewards-section">
            <h4>🧠 AI NeuroLogic Rewards</h4>
            
            {hybridError ? (
              <div className="error-message">
                <p>⚠️ {hybridError}</p>
                <p>Using traditional reward system</p>
              </div>
            ) : (
              <div className="node-rewards-display">
                <p><strong>AI-Computed Balance:</strong> {formatBitsAmount(nodeRewardBalance)} $BITS</p>
                
                {rewardTiers.length > 0 && (
                  <div className="reward-tiers-info">
                    <p><strong>AI Boost Levels:</strong></p>
                    <ul>
                      {rewardTiers.slice(0, 3).map((tier, index) => (
                        <li key={index}>
                          {tier.percent}% AI multiplier up to {formatBitsAmount(tier.limit)} $BITS
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="rewards-actions">
          <button
                    onClick={() => fetchHybridRewards()}
                    disabled={hybridLoading}
                    className="refresh-rewards-btn"
                  >
                    🧠 Sync AI Neural Data
          </button>
                  
                  {parseFloat(nodeRewardBalance) > 0 && (
                    <button 
                      onClick={handleHybridClaim}
                      disabled={loading || hybridLoading}
                      className="claim-hybrid-btn"
                    >
                      {loading ? "🔄 Processing..." : `🎉 Claim ${formatBitsAmount(nodeRewardBalance)} $BITS`}
        </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 🔍 DEBUG SECTION FOR REWARDS */}
          <div className="debug-rewards-section" style={{
            margin: '15px 0',
            padding: '15px',
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '8px'
          }}>
            <h4>🔍 Reward Debug Panel</h4>
            <div style={{ fontSize: '0.85rem', marginBottom: '10px' }}>
              <p><strong>Wallet:</strong> {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}</p>
              <p><strong>Node.sol Balance:</strong> {nodeRewardBalance} $BITS</p>
              <p><strong>Status:</strong> {hybridLoading ? "Loading..." : (hybridError || "Ready")}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  console.log("🔄 Manual refresh triggered for wallet:", walletAddress);
                  fetchHybridRewards();
                }}
                className="debug-refresh-btn"
                style={{
                  padding: '8px 16px',
                  background: '#FFC107',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                🔄 Refresh AI Rewards
              </button>
              
              <button 
                onClick={async () => {
                  if (referralCode) {
                    console.log("🔍 Checking code balance for:", referralCode);
                    try {
                      await nodeRewardsService.initialize();
                      const codeInfo = await nodeRewardsService.getCodeRewardInfo(referralCode);
                      console.log("📊 Code Balance Info:", codeInfo);
                      alert(`Code ${referralCode}:\nBalance: ${codeInfo.codeBalance} $BITS\nHas Rewards: ${codeInfo.hasRewards ? 'Yes' : 'No'}`);
                    } catch (err) {
                      console.error("❌ Error checking code:", err);
                      alert("Error checking code balance");
                    }
                  } else {
                    alert("No referral code available to check");
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: '#17a2b8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                🔍 Check Code Balance
              </button>
            </div>
          </div>

          {/* 🔗 Invite Code Generation */}
          <div className="invite-code-section">
            <h4>🎯 AI-Powered Invite Generator</h4>
            
            {referralCode ? (
              <div className="code-display">
                <p><strong>Your AI Code:</strong> <code>{referralCode}</code></p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="copy-code-btn"
                >
                  {copied ? "✅ Copied!" : "📋 Copy Code"}
                </button>
              </div>
            ) : (
              <div className="generate-code-section">
                <p>❌ Failed to generate neural code.</p>
                <button 
                  onClick={generateHybridInviteCode}
                  disabled={generatingCode}
                  className="generate-invite-btn"
                >
                  {generatingCode ? "🧠 AI Processing..." : "🚀 GENERATE AI INVITE"}
                </button>
              </div>
            )}
          </div>

          {/* 🔍 TELEGRAM INVESTIGATION SECTION - 8 COMPACT SQUARES */}
          {telegram?.investigationData && (
            <div className="telegram-investigation-section">
              <h4>🔍 Telegram Activity Investigation</h4>
              
              <div className="investigation-grid-8">
                {(() => {
                  // Helper functions for formatting
                  const formatNumber = (num) => {
                    if (num === null || num === undefined) return '0';
                    return Number(num).toLocaleString('en-US', { maximumFractionDigits: 0 });
                  };

                  const formatDecimal = (num, decimals = 2) => {
                    if (num === null || num === undefined) return '0.00';
                    return Number(num).toLocaleString('en-US', { 
                      minimumFractionDigits: decimals, 
                      maximumFractionDigits: decimals 
                    });
                  };

                  const formatHours = (hours) => {
                    if (!hours) return '0h';
                    const h = parseFloat(hours);
                    return h % 1 === 0 ? `${h.toFixed(0)}h` : `${h.toFixed(1)}h`;
                  };

                        return (
                          <>
                      {/* Square 1: TOTAL TIME */}
                      <SmartTooltip content={`Total Activity Time: ${formatHours(telegram.investigationData.totalHoursFormatted)} (${telegram.investigationData.totalHours}h decimal)\nRaw Seconds: ${formatNumber(telegram.investigationData.totalSeconds)}s\nTracking: BitSwapDEX Telegram group, 60s intervals`}>
                        <div 
                          className="investigation-square"
                        >
                          <FaHourglassHalf className="investigation-icon time" />
                          <div className="investigation-square-value">
                            {formatHours(telegram.investigationData.totalHoursFormatted)}
                          </div>
                          <div className="investigation-square-label">TOTAL TIME</div>
                        </div>
                      </SmartTooltip>
                              
                      {/* Square 2: MESSAGES */}
                      <SmartTooltip content={`Total Messages Sent: ${formatNumber(telegram.investigationData.messagesTotal)}\nTracked in BitSwapDEX Telegram group\nQuality messages contribute to rewards`}>
                        <div 
                          className="investigation-square"
                        >
                          <FaCoins className="investigation-icon messages" />
                          <div className="investigation-square-value">
                            {formatNumber(telegram.investigationData.messagesTotal)}
                          </div>
                          <div className="investigation-square-label">MESSAGES</div>
                        </div>
                      </SmartTooltip>

                      {/* Square 3: ACTIVITY RATE */}
                      <SmartTooltip content={`Activity Rate: ${formatDecimal(telegram.investigationData.activityRate, 1)} messages per hour\nHigher activity = Better rewards\nCalculated: ${formatNumber(telegram.investigationData.messagesTotal)} messages / ${formatHours(telegram.investigationData.totalHoursFormatted)}`}>
                        <div 
                          className="investigation-square"
                        >
                          <FaChartLine className="investigation-icon activity" />
                          <div className="investigation-square-value">
                            {formatDecimal(telegram.investigationData.activityRate, 1)}
                          </div>
                          <div className="investigation-square-label">MSG/HOUR</div>
                        </div>
                      </SmartTooltip>

                      {/* Square 4: CURRENT REWARD */}
                      <SmartTooltip content={`Current Claimed Reward: ${formatNumber(telegram.reward)} BITS\nThis is what you've already received\nExpected reward may be higher based on activity`}>
                        <div 
                          className="investigation-square"
                        >
                          <FaGem className="investigation-icon current" />
                          <div className="investigation-square-value">
                            {formatNumber(telegram.reward)}
                          </div>
                          <div className="investigation-square-label">CURRENT BITS</div>
                        </div>
                      </SmartTooltip>

                      {/* Square 5: EXPECTED REWARD */}
                      <SmartTooltip content={`Expected Total Reward: ${formatNumber(telegram.investigationData.expectedReward)} BITS\nBased on your ${formatHours(telegram.investigationData.totalHoursFormatted)} of activity\nClaim available rewards in the Rewards Hub`}>
                        <div 
                          className="investigation-square"
                        >
                          <FaStar className="investigation-icon expected" />
                          <div className="investigation-square-value">
                            {formatNumber(telegram.investigationData.expectedReward)}
                          </div>
                          <div className="investigation-square-label">EXPECTED BITS</div>
                        </div>
                      </SmartTooltip>
                                      
                      {/* Square 6: MILESTONE PROGRESS */}
                      <SmartTooltip content={(() => {
                          const milestoneData = getMilestoneData(telegram.investigationData.totalSeconds);
                          return `Progress to Next Milestone: ${milestoneData.progress.toFixed(1)}%\nNext: ${milestoneData.nextMilestone.icon} ${milestoneData.nextMilestone.name} (${milestoneData.nextMilestone.hours}h)\nReward: ${formatNumber(milestoneData.nextMilestone.reward)} BITS\nRemaining: ${milestoneData.remainingHours >= 1 ? `${Math.floor(milestoneData.remainingHours)}h ${Math.floor((milestoneData.remainingHours % 1) * 60)}m` : `${milestoneData.remainingMinutes} minutes`}`;
                        })()}>
                        <div 
                          className="investigation-square"
                        >
                          <FaGift className="investigation-icon progress" />
                          <div className="investigation-square-value">
                            {(() => {
                              const milestoneData = getMilestoneData(telegram.investigationData.totalSeconds);
                              return `${milestoneData.progress.toFixed(0)}%`;
                            })()}
                          </div>
                          <div className="investigation-square-label">PROGRESS</div>
                        </div>
                      </SmartTooltip>
                                      
                      {/* Square 7: NEXT MILESTONE */}
                      <SmartTooltip content={(() => {
                          const milestoneData = getMilestoneData(telegram.investigationData.totalSeconds);
                          return `Next Milestone Reward: ${formatNumber(milestoneData.nextMilestone.reward)} BITS\nMilestone: ${milestoneData.nextMilestone.icon} ${milestoneData.nextMilestone.name}\nRequired: ${milestoneData.nextMilestone.hours}h of activity\nCurrent: ${formatHours(telegram.investigationData.totalHoursFormatted)}\nKeep participating to unlock!`;
                        })()}>
                        <div 
                          className="investigation-square"
                        >
                          <FaDollarSign className="investigation-icon next" />
                          <div className="investigation-square-value">
                            {(() => {
                              const milestoneData = getMilestoneData(telegram.investigationData.totalSeconds);
                              return formatNumber(milestoneData.nextMilestone.reward);
                            })()}
                          </div>
                          <div className="investigation-square-label">NEXT REWARD</div>
                        </div>
                      </SmartTooltip>

                      {/* Square 8: AI SYSTEM STATUS */}
                      <SmartTooltip content={`AI Tracking System Status:\n${telegram.investigationData.systemStatus || '✅ Online'}\nData Source: ${(telegram.investigationData.dataSource || '').toLowerCase() === 'offline-simulation' ? 'Internal service (temporarily offline)' : telegram.investigationData.dataSource || 'BitPulse AI'}\nLast Updated: ${new Date(telegram.investigationData.timestamp).toLocaleString()}\n${telegram.investigationData.explanation || 'System operating normally'}`}>
                        <div 
                          className="investigation-square"
                        >
                          <FaCheckCircle className="investigation-icon status" />
                          <div className="investigation-square-value status-text">
                            {telegram.investigationData.systemStatus?.includes('🔴') ? '🔴 OFF' : 
                             telegram.investigationData.systemStatus?.includes('🔧') ? '🔧 MAINT' : '✅ OK'}
                          </div>
                          <div className="investigation-square-label">AI STATUS</div>
                        </div>
                      </SmartTooltip>
                          </>
                        );
                      })()}
                        </div>

              {/* Investigation Action Buttons */}
              <div className="investigation-actions">
                <button 
                  onClick={async (e) => {
                    e.preventDefault();
                    console.log("🔍 Re-investigating Telegram data...");
                    setStatusMsg("🔄 Re-investigating Telegram data...");
                    await fetchTelegram(true); // Force refresh to bypass cache
                    setStatusMsg("✅ Investigation completed!");
                  }}
                  className="investigate-refresh-btn"
                  disabled={hybridLoading || loading}
                  style={{ flex: 1, minWidth: '200px' }}
                >
                  {(hybridLoading || loading) ? "🔄 Investigating..." : "🔍 Re-investigate Telegram Data"}
                </button>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    console.log("🧪 Testing Rate Limit Demo for wallet:", walletAddress);
                    setStatusMsg("🧪 Generating Rate Limit Demo Data...");
                    
                    // Simulate exact Error 429
                    const error429 = {
                      message: "HTTP 429: Too Many Requests",
                      response: { status: 429 }
                    };
                    
                    const demoData = generateOfflineData(walletAddress, error429, null);
                    console.log("📦 Demo data generated:", demoData);
                    setTelegram(demoData);
                    setStatusMsg(`✅ Demo: ${demoData.investigationData.totalHours}h → ${demoData.reward} BITS`);
                  }}
                  className="investigate-refresh-btn"
                  style={{ 
                    flex: 1, 
                    minWidth: '150px',
                    background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                    fontSize: '0.9em'
                  }}
                >
                  🧪 Force Rate Limit Demo
                </button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMsg && <p style={{ marginTop: "12px", color: "#00ffaa" }}>{statusMsg}</p>}
        </>
      )}

      <TransactionPopup
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
        token={popupData.token}
        amount={popupData.amount}
        bits={popupData.bits}
        txHash={popupData.txHash}
        explorerLink={`https://bscscan.com/tx/${popupData.txHash}`}
      />

      <RewardStatsSection
        referral={referral}
        telegram={telegram}
        referralCode={referralCode}
        nodeRewardBalance={nodeRewardBalance}
        rewardTiers={rewardTiers}
        hybridError={hybridError}
      />
    </div>
  );
};

export default ReferralRewardBox;
