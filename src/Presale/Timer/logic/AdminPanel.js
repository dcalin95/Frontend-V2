import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { default as axios } from "axios";
import { ethers } from "ethers";
import { copyWalletAddress } from "../../../utils/copyUtils";
import styles from "./AdminPanel.module.css";
import { toast } from "react-toastify";
import PresaleHistory from "../PresaleHistory";
import RoundEndDisplay from "../RoundEndDisplay";
import useCellManagerData from "../../hooks/useCellManagerData";
import useAdditionalBonus from "../../hooks/useAdditionalBonus";
import { CONTRACTS } from "../../../contract/contracts";
import DOMPurify from 'dompurify'; // 🔒 SECURITY: XSS protection
// NOTE: SolanaRewardsManager is legacy (old endpoints + contract-based). We use Solana Payments (DB + cron verify + manual fulfilment).
import { getBackendUrl } from "../../../utils/getBackendUrl";

const API_URL = getBackendUrl();
// SECURITY: Require ADMIN_PASS in production, no fallback
const ADMIN_PASS = process.env.REACT_APP_ADMIN_PASS;
if (!ADMIN_PASS && process.env.NODE_ENV === 'production') {
  console.error('[SECURITY] REACT_APP_ADMIN_PASS is required in production!');
}

// AdditionalReward tiers (aligned with RewardsHub + backend SOL loyalty tiers)
const SOL_BONUS_TIERS = [
  { threshold: 100, rate: 3 },
  { threshold: 250, rate: 5 },
  { threshold: 500, rate: 7 },
  { threshold: 1000, rate: 10 },
  { threshold: 2500, rate: 15 }
];

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getTierForUsd(totalUsd) {
  const usd = toNum(totalUsd);
  let picked = { threshold: 0, rate: 0 };
  for (const t of SOL_BONUS_TIERS) {
    if (usd >= t.threshold) picked = t;
  }
  return { ...picked, label: `${picked.rate || 0}%` };
}

function fmt(n, digits = 2) {
  const x = toNum(n);
  return x.toLocaleString(undefined, { maximumFractionDigits: digits });
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [autoSimRunning, setAutoSimRunning] = useState(false);
  const [manualUsd, setManualUsd] = useState("");
  const [manualBits, setManualBits] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // New state for tabs
  
  // Round management states  
  const [supplyInput, setSupplyInput] = useState("");
  const [presaleInfo, setPresaleInfo] = useState(null);
  const [showRoundEndStats, setShowRoundEndStats] = useState(false);
  const [roundEndData, setRoundEndData] = useState(null);

  // ===== Treasury / USDC payouts admin =====
  const [treasuryAddress, setTreasuryAddress] = useState("");
  const [treasuryBalances, setTreasuryBalances] = useState(null);
  const [usdcSpent, setUsdcSpent] = useState(null);
  const [usdcCap, setUsdcCap] = useState(null);
  const [newUsdcCap, setNewUsdcCap] = useState("");
  const [recentPayouts, setRecentPayouts] = useState([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [showTreasuryGuide, setShowTreasuryGuide] = useState(false);
  const [panelPreset, setPanelPreset] = useState("normal"); // normal | half | large
  const [panelResizable, setPanelResizable] = useState(true);
  const treasuryToastGateRef = useRef({ at: 0 });

  // ===== Solana payments monitor (auto-fulfilment) =====
  const [solanaPayments, setSolanaPayments] = useState([]);
  const [solanaPaymentsLoading, setSolanaPaymentsLoading] = useState(false);
  const [solanaDestination, setSolanaDestination] = useState("");
  const [solanaTreasury, setSolanaTreasury] = useState("");
  const [solanaDbInfo, setSolanaDbInfo] = useState(null);
  const [solanaStatusFilter, setSolanaStatusFilter] = useState("all"); // all | pending | confirmed | failed
  const [solanaSearch, setSolanaSearch] = useState(""); // wallet or signature
  const [solanaMarkingSig, setSolanaMarkingSig] = useState(null);
  const [solanaApiStatus, setSolanaApiStatus] = useState({ ok: null, msg: "" }); // ok: true|false|null
  const [solanaLastFetchAt, setSolanaLastFetchAt] = useState(null);
  const [solanaDebugOpen, setSolanaDebugOpen] = useState(false);
  const [solanaSelectedEvmWallet, setSolanaSelectedEvmWallet] = useState("");
  const [solanaLastRawResponse, setSolanaLastRawResponse] = useState(null);
  const [solanaLoyaltyCurrency, setSolanaLoyaltyCurrency] = useState("BITS"); // BITS | USDC
  const [solanaLoyaltyLast, setSolanaLoyaltyLast] = useState(null);
  
  // ===== NEW: Missing transactions alert =====
  const [solanaMissingCount, setSolanaMissingCount] = useState(0);
  const [solanaMissingList, setSolanaMissingList] = useState([]);
  const [solanaSyncing, setSolanaSyncing] = useState(false);
  const [solanaCheckingMissing, setSolanaCheckingMissing] = useState(false);

  // ===== Leaderboard demo (marketing) =====
  const [leaderboardDemoRows, setLeaderboardDemoRows] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardSaving, setLeaderboardSaving] = useState(false);
  const [leaderboardJitterEnabled, setLeaderboardJitterEnabled] = useState(true);
  
  // ===== Email Sender (Newsletter Management) =====
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [emailRecipients, setEmailRecipients] = useState([]);
  const [emailSending, setEmailSending] = useState(false);
  const [emailTemplateType, setEmailTemplateType] = useState('custom'); // custom | ai
  const [emailAIContent, setEmailAIContent] = useState('');
  const [emailPreview, setEmailPreview] = useState('');
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  
  // Get data directly from CellManager contract
  const cellManagerData = useCellManagerData();


  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken === ADMIN_PASS) {
      setIsAuthorized(true);
      fetchSimulationStatus();
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchSimulationStatus();
      fetchPresaleState();
      fetchTreasuryInfo();
      fetchLeaderboardDemo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized]);

  // Load Solana payments only when the user opens the tab (prevents 404/toast spam)
  useEffect(() => {
    if (!isAuthorized) return;
    
    if (activeTab === "email-sender" && newsletterSubscribers.length === 0) {
      // Auto-load newsletter subscribers when opening email-sender tab
      setNewsletterLoading(true);
      axios.get(`${API_URL}/api/email/admin/newsletter/subscribers`, {
        params: { password: ADMIN_PASS, activeOnly: 'true' }
      })
      .then(response => {
        setNewsletterSubscribers(response.data.subscribers || []);
      })
      .catch(err => {
        console.error('❌ Failed to load newsletter subscribers:', err);
      })
      .finally(() => {
        setNewsletterLoading(false);
      });
    }
    
    if (activeTab === "solana-payments") {
      fetchSolanaPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthorized]);

  // Auto-pick an EVM wallet from SOL rows for on-chain AdditionalReward debug
  useEffect(() => {
    if (solanaSelectedEvmWallet) return;
    const w = (solanaPayments || [])
      .map((r) => String(r?.evm_wallet || r?.evmWallet || "").trim())
      .find((x) => x && x.startsWith("0x") && x.length >= 10);
    if (w) setSolanaSelectedEvmWallet(w);
  }, [solanaPayments, solanaSelectedEvmWallet]);

  const additionalBonus = useAdditionalBonus(solanaSelectedEvmWallet);

  const fetchLeaderboardDemo = async () => {
    setLeaderboardLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/leaderboard/demo`);
      if (res.data?.ok) {
        setLeaderboardDemoRows(res.data.rows || []);
        if (typeof res.data.jitterEnabled === "boolean") {
          setLeaderboardJitterEnabled(res.data.jitterEnabled);
        }
      }
    } catch (e) {
      console.warn("⚠️ Leaderboard demo fetch failed:", e.message);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const saveLeaderboardDemo = async () => {
    setLeaderboardSaving(true);
    try {
      const res = await axios.post(`${API_URL}/api/leaderboard/admin/demo`, {
        password: ADMIN_PASS,
        rows: leaderboardDemoRows
      });
      if (res.data?.ok) {
        setLeaderboardDemoRows(res.data.rows || []);
        toast.success("✅ Leaderboard saved");
      } else {
        toast.error("❌ Failed to save leaderboard");
      }
    } catch (e) {
      toast.error("❌ Failed to save leaderboard: " + (e.response?.data?.error || e.message));
    } finally {
      setLeaderboardSaving(false);
    }
  };

  const resetLeaderboardDemo = async () => {
    const ok = window.confirm("Reset leaderboard demo to default 5 rows?");
    if (!ok) return;
    setLeaderboardSaving(true);
    try {
      const res = await axios.post(`${API_URL}/api/leaderboard/admin/reset`, { password: ADMIN_PASS });
      if (res.data?.ok) {
        setLeaderboardDemoRows(res.data.rows || []);
        toast.success("✅ Leaderboard reset");
      } else {
        toast.error("❌ Failed to reset leaderboard");
      }
    } catch (e) {
      toast.error("❌ Failed to reset leaderboard: " + (e.response?.data?.error || e.message));
    } finally {
      setLeaderboardSaving(false);
    }
  };

  const saveLeaderboardJitter = async (enabled) => {
    setLeaderboardSaving(true);
    try {
      const res = await axios.post(`${API_URL}/api/leaderboard/admin/jitter`, { password: ADMIN_PASS, enabled });
      if (res.data?.ok) {
        setLeaderboardJitterEnabled(!!res.data.jitterEnabled);
        toast.success(`✅ Daily variation: ${res.data.jitterEnabled ? "ON" : "OFF"}`);
      } else {
        toast.error("❌ Failed to update daily variation");
      }
    } catch (e) {
      toast.error("❌ Failed to update daily variation: " + (e.response?.data?.error || e.message));
    } finally {
      setLeaderboardSaving(false);
    }
  };

  const updateLeaderboardRow = (idx, patch) => {
    setLeaderboardDemoRows((prev) => {
      const rows = Array.isArray(prev) ? [...prev] : [];
      const row = rows[idx] || {};
      rows[idx] = { ...row, ...patch };
      return rows;
    });
  };

  const fetchSolanaPayments = async () => {
    setSolanaPaymentsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/solana/admin/payments`, { password: ADMIN_PASS, limit: 100 });
      if (res.data?.ok) {
        setSolanaPayments(res.data.rows || []);
        setSolanaDestination(res.data.destination || "");
        setSolanaTreasury(res.data.treasury || "");
        setSolanaLastFetchAt(Date.now());
        setSolanaLastRawResponse(res.data);
        setSolanaApiStatus({ ok: true, msg: "" });
        setSolanaDbInfo(null);
        
        // Auto-check for missing transactions
        checkMissingTransactions();
      } else {
        setSolanaLastFetchAt(Date.now());
        setSolanaLastRawResponse(res.data);
        setSolanaApiStatus({ ok: false, msg: "Solana payments API returned ok=false." });
        toast.error("❌ Failed to load Solana payments");
      }
    } catch (e) {
      const apiErr = e.response?.data?.error || e.response?.data?.message || e.message || "unknown";
      setSolanaLastFetchAt(Date.now());
      setSolanaLastRawResponse({
        ok: false,
        error: String(apiErr),
        status: e.response?.status || null
      });
      const isNotFound =
        e.response?.status === 404 ||
        String(apiErr).toLowerCase().includes("api route not found") ||
        String(apiErr).toLowerCase().includes("not found");

      if (isNotFound) {
        // Don't toast-loop; show inline message in the tab instead.
        setSolanaApiStatus({
          ok: false,
          msg: `Solana payments endpoint not found on backend (${API_URL}). If you want this feature, deploy backend routes /api/solana/admin/*.`,
        });
      } else {
        setSolanaApiStatus({ ok: false, msg: String(apiErr) });
        toast.error("❌ Failed to load Solana payments: " + apiErr);
      }
    } finally {
      setSolanaPaymentsLoading(false);
    }
  };
  
  // ===== NEW: Check for missing transactions =====
  const checkMissingTransactions = async () => {
    setSolanaCheckingMissing(true);
    try {
      const res = await axios.post(`${API_URL}/api/solana/admin/check-missing`, { 
        password: ADMIN_PASS 
      });
      
      if (res.data?.ok) {
        setSolanaMissingCount(res.data.missing_count || 0);
        setSolanaMissingList(res.data.missing_transactions || []);
        
        if (res.data.missing_count > 0) {
          console.log(`⚠️ [Admin] Found ${res.data.missing_count} missing Solana transaction(s)`);
        }
      }
    } catch (e) {
      console.error("❌ [Admin] Failed to check missing transactions:", e);
    }
    setSolanaCheckingMissing(false);
  };
  
  // ===== NEW: Sync missing transactions =====
  const syncMissingTransactions = async () => {
    if (solanaSyncing) return;
    
    setSolanaSyncing(true);
    try {
      toast.info("🔄 Sincronizare în curs... (poate dura 10-30 secunde)");
      
      const res = await axios.post(`${API_URL}/api/solana/admin/sync-missing`, { 
        password: ADMIN_PASS 
      });
      
      if (res.data?.ok) {
        const saved = res.data.saved || 0;
        if (saved > 0) {
          toast.success(`✅ ${saved} tranzacție/tranzacții sincronizate!`);
          await fetchSolanaPayments(); // Refresh list
        } else {
          toast.info("ℹ️ Nu au fost găsite tranzacții noi");
        }
        setSolanaMissingCount(0);
        setSolanaMissingList([]);
      } else {
        toast.error("❌ Sincronizare eșuată");
      }
    } catch (e) {
      const errMsg = e.response?.data?.error || e.message;
      toast.error("❌ Sincronizare eșuată: " + errMsg);
    }
    setSolanaSyncing(false);
  };

  const fetchSolanaDbInfo = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/solana/admin/db-info`, { password: ADMIN_PASS });
      if (res.data?.ok) {
        setSolanaDbInfo(res.data);
        toast.success("✅ Loaded DB diagnostics");
      } else {
        toast.error("❌ DB diagnostics failed");
      }
    } catch (e) {
      toast.error("❌ DB diagnostics failed: " + (e.response?.data?.error || e.message));
    }
  };

  const markSolanaFulfilled = async (transactionId) => {
    const id = parseInt(transactionId, 10);
    if (!id || isNaN(id)) return;
    const txh = window.prompt("Paste BSC tx hash (0x...) after you sent BITS from MetaMask:", "");
    const txHashOnChain = String(txh || "").trim();
    if (!txHashOnChain) return;

    setSolanaMarkingSig(id);
    try {
      const res = await axios.post(`${API_URL}/api/solana/admin/mark-fulfilled`, { password: ADMIN_PASS, transactionId: id, txHashOnChain });
      if (res.data?.ok) {
        toast.success("✅ Marked as fulfilled");
        await fetchSolanaPayments();
      } else {
        toast.error("❌ Mark failed");
      }
    } catch (e) {
      toast.error("❌ Mark failed: " + (e.response?.data?.error || e.message));
    } finally {
      setSolanaMarkingSig(null);
    }
  };

  const fetchTreasuryInfo = async () => {
    try {
      const results = await Promise.allSettled([
        axios.get(`${API_URL}/api/rewards/treasury-address`),
        axios.get(`${API_URL}/api/rewards/usdc-spent-today`),
        axios.post(`${API_URL}/api/rewards/admin/treasury-status`, { password: ADMIN_PASS }),
        axios.post(`${API_URL}/api/rewards/admin/payouts/recent`, { password: ADMIN_PASS, limit: 50 })
      ]);

      const addrRes = results[0].status === "fulfilled" ? results[0].value : null;
      const spentRes = results[1].status === "fulfilled" ? results[1].value : null;
      const treasRes = results[2].status === "fulfilled" ? results[2].value : null;
      const payoutsRes = results[3].status === "fulfilled" ? results[3].value : null;

      // Always set address if we can (even if admin endpoints fail)
      if (addrRes?.data?.ok && addrRes.data?.address) {
        setTreasuryAddress(addrRes.data.address);
      } else if (addrRes?.data?.ok === false) {
        setTreasuryAddress("");
        toast.error("❌ Treasury address error: " + (addrRes.data?.error || "unknown"));
      } else if (!addrRes && results[0].status === "rejected") {
        toast.error("❌ Treasury address fetch failed: " + (results[0].reason?.response?.data?.error || results[0].reason?.message || "unknown"));
      }

      if (spentRes?.data?.ok) {
        setUsdcSpent(spentRes.data.spent);
        setUsdcCap(spentRes.data.cap);
        setNewUsdcCap(String(spentRes.data.cap ?? ""));
      }

      if (treasRes?.data?.ok) {
        setTreasuryBalances(treasRes.data.balances);
      } else if (results[2].status === "rejected") {
        const err = results[2].reason?.response?.data?.error || results[2].reason?.message || "Not authorized";
        const now = Date.now();
        if (now - (treasuryToastGateRef.current.at || 0) > 15000) {
          treasuryToastGateRef.current.at = now;
          toast.error("❌ Treasury balances (admin) failed: " + err);
        }
      }

      if (payoutsRes?.data?.ok) {
        setRecentPayouts(payoutsRes.data.rows || []);
      } else if (results[3].status === "rejected") {
        const err = results[3].reason?.response?.data?.error || results[3].reason?.message || "Not authorized";
        toast.error("❌ Recent payouts (admin) failed: " + err);
      }
    } catch (e) {
      console.warn("⚠️ Treasury info fetch failed:", e.message);
      toast.error("❌ Treasury info fetch failed: " + (e.response?.data?.error || e.message));
    }
  };

  const refreshPayouts = async () => {
    setLoadingPayouts(true);
    try {
      const results = await Promise.allSettled([
        axios.get(`${API_URL}/api/rewards/usdc-spent-today`),
        axios.post(`${API_URL}/api/rewards/admin/treasury-status`, { password: ADMIN_PASS }),
        axios.post(`${API_URL}/api/rewards/admin/payouts/recent`, { password: ADMIN_PASS, limit: 50 })
      ]);

      const spentRes = results[0].status === "fulfilled" ? results[0].value : null;
      const treasRes = results[1].status === "fulfilled" ? results[1].value : null;
      const payoutsRes = results[2].status === "fulfilled" ? results[2].value : null;

      if (spentRes?.data?.ok) {
        setUsdcSpent(spentRes.data.spent);
        setUsdcCap(spentRes.data.cap);
      }
      if (treasRes?.data?.ok) setTreasuryBalances(treasRes.data.balances);
      if (payoutsRes?.data?.ok) setRecentPayouts(payoutsRes.data.rows || []);

      if (results[1].status === "rejected") {
        toast.error("❌ Treasury balances (admin) failed: " + (results[1].reason?.response?.data?.error || results[1].reason?.message));
      }
      if (results[2].status === "rejected") {
        toast.error("❌ Recent payouts (admin) failed: " + (results[2].reason?.response?.data?.error || results[2].reason?.message));
      }
    } catch (e) {
      toast.error("❌ Failed to refresh payouts: " + (e.response?.data?.error || e.message));
    } finally {
      setLoadingPayouts(false);
    }
  };

  const handleSetUsdcCap = async () => {
    const n = Number(newUsdcCap);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("⚠️ Enter a valid cap > 0");
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/rewards/usdc-cap`, { password: ADMIN_PASS, cap: n });
      if (res.data?.ok) {
        toast.success(`✅ USDC cap updated: ${n} / day`);
        setUsdcCap(n);
      } else {
        toast.error("❌ Failed to set cap");
      }
    } catch (e) {
      toast.error("❌ Failed to set cap: " + (e.response?.data?.error || e.message));
    }
  };

  const handleLogin = () => {
    const input = prompt("🔐 Enter Admin Password:");
    const normalized = (input || "").trim();
    if (normalized === ADMIN_PASS) {
      setIsAuthorized(true);
      localStorage.setItem("admin_token", normalized);
      toast.success("✅ Autentificare reușită");
    } else {
      alert("❌ Wrong password!");
    }
  };
  const handleManualSimulation = async () => {
  const usd = parseFloat(manualUsd);
  const bits = parseInt(manualBits);

      if (isNaN(usd) || isNaN(bits) || usd <= 0 || bits <= 0) {
      toast.error("⚠️ Enter valid values for USD and BITS.");
      return;
    }

    // Check if enough BITS are available in current round
    if (!presaleInfo) {
      toast.error("❌ No active presale round!");
      return;
    }

    const availableBits = (presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0);
    if (bits > availableBits) {
      toast.error(`❌ Not enough BITS available! Available: ${availableBits.toLocaleString()} BITS`);
      return;
    }

    if (availableBits <= 0) {
      toast.error("❌ No BITS available in current round!");
      return;
    }

  try {
   const res = await axios.post(`${API_URL}/api/manual-simulation/manual`, {
  password: ADMIN_PASS,
  usd,
  bits
});

          toast.success(res.data.message || "✅ Sale simulated successfully.");
      setManualUsd("");
      setManualBits("");
      fetchPresaleState(); // Refresh presale state after simulation
    } catch (err) {
      console.error("❌ Manual simulation error:", err.message);
      toast.error("❌ Manual simulation error: " + (err.response?.data?.message || err.message));
  }
};


  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthorized(false);
    toast.info("🛑 Logged out successfully.");
  };

  const getPanelStyle = () => {
    if (panelPreset === "half") {
      return {
        width: '50%',
        maxWidth: '900px',
      };
    }
    if (panelPreset === "large") {
      return {
        width: '90%',
        maxWidth: '1200px',
      };
    }
    return {}; // normal (CSS default)
  };

  // Fetch current presale state
  const fetchPresaleState = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/presale/current`);
      setPresaleInfo(response.data);
      console.log("📊 Current presale state:", response.data);
      console.log("🔍 [DATABASE DEBUG] tokensAvailable:", response.data?.tokensAvailable);
      console.log("🔍 [DATABASE DEBUG] sold:", response.data?.sold);
      console.log("🔍 [DATABASE DEBUG] totalSupply:", response.data?.totalSupply);
      console.log("🔍 [DATABASE DEBUG] price:", response.data?.price);
      console.log("🔍 [DATABASE DEBUG] round:", response.data?.round);
      console.log("🔍 [CALCULATION DEBUG] Should be:", (response.data?.totalSupply || 0) - (response.data?.sold || 0));
      
      // Check if round has ended (14 days = 1,209,600 seconds)
      const now = Math.floor(Date.now() / 1000);
      const roundDuration = 14 * 24 * 60 * 60; // 14 days in seconds
      const roundEndTime = response.data?.startTime + roundDuration;
      
      if (now >= roundEndTime && !showRoundEndStats) {
        // Round has ended, prepare stats
        const endStats = {
          roundNumber: response.data?.roundNumber || 1,
          totalSold: response.data?.sold || 0,
          totalRaised: response.data?.totalRaised || 0,
          duration: roundDuration,
          startTime: response.data?.startTime,
          endTime: roundEndTime,
          averagePrice: (response.data?.totalRaised || 0) / (response.data?.sold || 1),
          participantCount: Math.floor((response.data?.sold || 0) / 1000), // Estimate
          topSale: {
            amount: Math.floor((response.data?.sold || 0) * 0.1),
            value: Math.floor((response.data?.totalRaised || 0) * 0.1)
          }
        };
        setRoundEndData(endStats);
        setShowRoundEndStats(true);
      }
      
      // Check AutoSim blocking conditions
      if (!response.data) {
        console.log("🚨 [AUTOSIM BLOCK] No presale state data!");
      } else if (response.data.tokensAvailable <= 0) {
        console.log("🚨 [AUTOSIM BLOCK] tokensAvailable <= 0:", response.data.tokensAvailable);
      } else if (response.data.price <= 0) {
        console.log("🚨 [AUTOSIM BLOCK] price <= 0:", response.data.price);
      } else {
        console.log("✅ [AUTOSIM OK] All conditions met for AutoSim!");
      }
    } catch (err) {
      console.warn("⚠️ Could not fetch presale state:", err.message);
      setPresaleInfo(null);
    }
  };

  // Add new cell to CellManager
  const handleAddCell = async () => {
    const supply = parseInt(supplyInput);
    
    if (isNaN(supply) || supply <= 0) {
      toast.error("❌ Please enter valid BITS supply");
      return;
    }

    if (!cellManagerData.currentPrice || cellManagerData.currentPrice <= 0) {
      toast.error("❌ Cannot read price from CellManager. Using fallback price $0.055");
      console.warn("⚠️ Using fallback price because cellManagerData.currentPrice is:", cellManagerData.currentPrice);
      // Don't return - continue with fallback price
    }

    try {
      // Use fallback price if currentPrice is invalid
      const fallbackPrice = 0.055;
      const priceToUse = (cellManagerData.currentPrice && cellManagerData.currentPrice > 0) 
        ? cellManagerData.currentPrice 
        : fallbackPrice;
      
      console.log("🔍 [DEBUG] Price calculation:");
      console.log("- cellManagerData.currentPrice:", cellManagerData.currentPrice);
      console.log("- priceToUse:", priceToUse);
      
      // Price is already in correct format (e.g., 0.055), convert to millicents
      const standardPrice = Math.round(priceToUse * 1000);
      const privilegedPrice = Math.round(standardPrice * 0.9); // 10% discount
      const supplyWei = ethers.utils.parseUnits(supply.toString(), 18);
      
      console.log("🔍 [DEBUG] AddCell values:");
      console.log("- currentPrice:", cellManagerData.currentPrice);
      console.log("- priceToUse:", priceToUse);
      console.log("- standardPrice (millicents):", standardPrice);
      console.log("- privilegedPrice (millicents):", privilegedPrice);
      console.log("- supply:", supply);
      console.log("- supplyWei:", supplyWei.toString());

      // Get CellManager contract
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const cellManagerContract = new ethers.Contract(
        CONTRACTS.CELL_MANAGER.address,
        [
          "function addCell(uint256 standardPrice, uint256 privilegedPrice, uint256 supply) external"
        ],
        signer
      );

      toast.info("⏳ Adding new cell to CellManager...");
      
      const tx = await cellManagerContract.addCell(standardPrice, privilegedPrice, supplyWei);
      await tx.wait();

      toast.success(`✅ Cell added successfully! Supply: ${supply.toLocaleString()} BITS`);
      setSupplyInput("");
      
      // Refresh CellManager data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error("❌ Error adding cell:", err);
      toast.error("❌ Error adding cell: " + (err.message || "Unknown error"));
    }
  };

  // Set supply for current round (using CellManager data)
  const handleSetSupply = async () => {
    const tokensAvailable = parseInt(supplyInput);

    if (isNaN(tokensAvailable) || tokensAvailable <= 0) {
      toast.error("❌ Please enter valid BITS supply");
      return;
    }

    if (!cellManagerData.roundNumber || !cellManagerData.currentPrice) {
      toast.error("❌ Cannot read round data from CellManager");
      return;
    }

    // Use data from CellManager
    const round = cellManagerData.roundNumber;
    const price = Math.round(cellManagerData.currentPrice * 1000); // Convert to cents

    try {
      const response = await axios.post(`${API_URL}/api/presale/start-round`, {
        password: ADMIN_PASS,
        round,
        price,
        tokensAvailable
      });

      toast.success(response.data.message || `✅ Supply set for Round ${round}!`);
      setSupplyInput("");
      
      // 🔄 Force refresh both states
      await fetchPresaleState(); // Refresh AdminPanel data
      setTimeout(() => {
        fetchPresaleState(); // Double refresh to ensure update
      }, 1000);
    } catch (err) {
      console.error("❌ Error setting supply:", err);
      toast.error("❌ Error setting supply: " + (err.response?.data?.error || err.message));
    }
  };

  // End current round
  const handleEndRound = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/presale/end-round`, {
        password: ADMIN_PASS
      });

      toast.success(response.data.message || "✅ Round ended successfully!");
      fetchPresaleState(); // Refresh state
    } catch (err) {
      console.error("❌ Error ending round:", err);
      toast.error("❌ Error ending round: " + (err.response?.data?.error || err.message));
    }
  };

  // Reset tokens to 0
  const handleResetTokens = async () => {
    if (!window.confirm("🔥 Are you sure you want to reset tokensavailable to 0? This will remove all BITS from database!")) {
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/presale/reset-tokens`, {
        password: ADMIN_PASS
      });

      toast.success(response.data.message || "✅ Tokens reset to 0!");
      fetchPresaleState(); // Refresh state
    } catch (err) {
      console.error("❌ Error resetting tokens:", err);
      toast.error("❌ Error resetting tokens: " + (err.response?.data?.error || err.message));
    }
  };

  // Reset presale data - PRODUCTION SAFETY
  // NOTE: kept for emergency use; may not be wired in UI in some builds.
  // eslint-disable-next-line no-unused-vars
  const handleResetPresale = async () => {
    // 🚨 TRIPLE CONFIRMATION FOR PRODUCTION SAFETY
    const firstConfirm = window.confirm("🚨 DANGER: Reset ALL presale data?\n\nThis will DELETE:\n- All sales data\n- All round history\n- All user transactions\n- Timer will restart\n\nThis CANNOT be undone!\n\nAre you absolutely sure?");
    if (!firstConfirm) return;
    
    const secondConfirm = window.confirm("🚨 FINAL WARNING!\n\nYou are about to PERMANENTLY DELETE all presale data!\n\nThis action is IRREVERSIBLE and will:\n- Lose all user trust\n- Delete all sales history\n- Reset everything to zero\n\nType 'DELETE ALL DATA' in the next prompt to confirm.");
    if (!secondConfirm) return;
    
    const finalConfirmation = prompt("🚨 Type exactly: DELETE ALL DATA");
    if (finalConfirmation !== "DELETE ALL DATA") {
      toast.error("❌ Reset cancelled - incorrect confirmation text");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/presale/reset`, {
        password: ADMIN_PASS
      });

      toast.success(response.data.message || "✅ Presale data reset successfully!");
      fetchPresaleState(); // Refresh state
    } catch (err) {
      console.error("❌ Error resetting presale:", err);
      toast.error("❌ Error resetting presale: " + (err.response?.data?.error || err.message));
    }
  };

  // Start new round after current round ends
  const handleStartNewRound = async () => {
    if (!cellManagerData.roundNumber || cellManagerData.roundNumber <= 0) {
      toast.error("❌ Please configure a new cell in CellManager first!");
      return;
    }

    const newSupply = prompt("🎯 Enter BITS supply for the new round:", "20000000");
    if (!newSupply || isNaN(newSupply) || parseInt(newSupply) <= 0) {
      toast.error("❌ Invalid supply amount");
      return;
    }

    const duration = prompt("⏱️ Enter round duration in days (14-30):", "30");
    if (!duration || isNaN(duration) || parseInt(duration) < 14 || parseInt(duration) > 30) {
      toast.error("❌ Duration must be between 14 and 30 days");
      return;
    }

    try {
      const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
      
      await axios.post(`${API_URL}/api/presale/start-round`, {
        password: ADMIN_PASS,
        roundNumber: cellManagerData.roundNumber,
        price: cellManagerData.currentPrice, // Already in USD
        totalSupply: parseInt(newSupply),
        duration: parseInt(duration),
        startTime: now
      });

      toast.success(`🎉 Round ${cellManagerData.roundNumber} started with ${duration} days duration!`);
      setShowRoundEndStats(false);
      setRoundEndData(null);
      fetchPresaleState();
    } catch (err) {
      console.error("❌ Error starting new round:", err);
      toast.error("❌ Error starting new round: " + (err.response?.data?.error || err.message));
    }
  };

  const exportToTelegram = async () => {
    try {
      let history = [];
      
      // First try to get data from CellManager
      if (cellManagerData && !cellManagerData.loading && cellManagerData.history && cellManagerData.history.length > 0) {
        console.log("📊 Using CellManager history for export:", cellManagerData.history);
        history = cellManagerData.history;
      } else {
        // Fallback to backend API
        console.log("🔍 Fetching history from backend:", `${API_URL}/api/presale/history`);
        const res = await axios.get(`${API_URL}/api/presale/history`);
        console.log("📊 Backend history response:", res.data);
        
        history = Array.isArray(res.data) ? res.data : [];
        
        if (history.length === 0 && cellManagerData && !cellManagerData.loading) {
          // Create minimal fallback from current cell data
          history = [{
            round: cellManagerData.roundNumber || 1,
            start_time: new Date().toISOString(),
            end_time: null,
            price: cellManagerData.currentPrice || 0,
            sold_bits: cellManagerData.soldBits || 0,
            tokensavailable: cellManagerData.availableBits || 0,
            raised_usd: (cellManagerData.soldBits || 0) * (cellManagerData.currentPrice || 0),
            last_update: new Date().toISOString()
          }];
          console.log("📊 Using current CellManager data as fallback:", history);
        }
      }
      
            let message = "📊 *BITS Presale Round History - Real vs Simulated*\n\n";
      message += "```\n";
      message += "Round | Price    | Real Sold | Sim Sold | Total Sold | Real Raised | Sim Raised | Total Raised | Source\n";
      message += "------|----------|-----------|----------|------------|-------------|------------|--------------|--------\n";

      history.forEach(round => {
        const price = `$${parseFloat(round.price || 0).toFixed(4)}`;
        const realSold = `${(Math.round(round.real_sold_bits || 0) / 1000).toFixed(0)}K`;
        const simSold = `${(Math.round(round.simulated_sold_bits || 0) / 1000).toFixed(0)}K`;
        const totalSold = `${(Math.round(round.total_sold_bits || 0) / 1000).toFixed(0)}K`;
        const realRaised = `$${(Math.round(round.real_raised_usd || 0) / 1000).toFixed(0)}K`;
        const simRaised = `$${(Math.round(round.simulated_raised_usd || 0) / 1000).toFixed(0)}K`;
        const totalRaised = `$${(Math.round(round.total_raised_usd || 0) / 1000).toFixed(0)}K`;
        const source = (round.data_source || 'Unknown').substring(0, 8);
        
        message += `${String(round.round || 'N/A').padEnd(5)} | ${price.padEnd(8)} | ${realSold.padEnd(9)} | ${simSold.padEnd(8)} | ${totalSold.padEnd(10)} | ${realRaised.padEnd(11)} | ${simRaised.padEnd(10)} | ${totalRaised.padEnd(12)} | ${source}\n`;
      });
      
      message += "```\n\n";
      message += `Generated: ${new Date().toLocaleString()}`;
      
      // Determine data source
      let dataSource = "No data";
      if (cellManagerData?.history?.length > 0) {
        dataSource = "CellManager Contract";
      } else if (history.length > 0) {
        dataSource = "Backend API";
      }
      message += `\nData source: ${dataSource}`;
      
      // Copy to clipboard first
      await navigator.clipboard.writeText(message);
      
      // Then open Telegram channel
      window.open('https://t.me/BitSwapDEX_AI', '_blank');
      
      // Show instructions to user
      toast.success("📱 Message copied to clipboard! Telegram channel opened - paste with Ctrl+V", {
        autoClose: 5000
      });
      
    } catch (err) {
      console.error("Export error:", err);
      toast.error("❌ Export failed: " + err.message);
    }
  };

  const exportToFile = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/presale/history`);
      const history = Array.isArray(res.data) ? res.data : [];
      
      // Create CSV content
      let csvContent = "Round,Start,End,Price,Sold BITS,Available BITS,Raised USD,Last Update\n";
      
      history.forEach(round => {
        const start = round.start_time ? new Date(round.start_time).toLocaleDateString() : 'N/A';
        const end = round.end_time ? new Date(round.end_time).toLocaleDateString() : 'N/A';
        const price = parseFloat(round.price || 0).toFixed(6);
        const sold = Math.round(round.sold_bits || 0);
        const available = Math.round(round.tokensavailable || 0);
        const raised = Math.round(round.raised_usd || 0);
        const updated = round.last_update ? new Date(round.last_update).toLocaleDateString() : 'N/A';
        
        csvContent += `${round.round || 'N/A'},${start},${end},$${price},${sold},${available},$${raised},${updated}\n`;
      });
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `presale_history_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("💾 History exported as CSV file!");
      
    } catch (err) {
      console.error("Export error:", err);
      toast.error("❌ Export failed");
    }
  };

  const fetchSimulationStatus = async () => {
    try {
      console.log("🔍 [DEBUG] Checking AutoSim status:", `${API_URL}/api/admin/status`);
      const res = await axios.get(`${API_URL}/api/admin/status`);
      console.log("📊 [DEBUG] Status response:", res.data);
      console.log("🔍 [DEBUG] Setting autoSimRunning to:", res.data.running);
      setAutoSimRunning(res.data.running);
    } catch (err) {
      console.error("❌ Eroare la status autosimulare:", err.message);
    }
  };

  const handleStartAutoSim = async () => {
    try {
      console.log("🔍 [DEBUG] Starting AutoSim - presaleInfo:", presaleInfo);
      console.log("🔍 [DEBUG] API URL:", `${API_URL}/api/admin/start`);
      console.log("🔍 [DEBUG] ADMIN_PASS:", ADMIN_PASS ? "Present" : "Missing");
      
      const res = await axios.post(`${API_URL}/api/admin/start`, {
        password: ADMIN_PASS,
      });
      
      console.log("✅ [DEBUG] AutoSim API response:", res.data);
      
      // VERIFICARE REALĂ - dacă backend-ul MINTE!
      if (res.data && res.data.message && res.data.message.includes("pornit")) {
        toast.success("⏳ Backend says started... verifying...");
        
        // Verifică imediat dacă chiar pornește
        setTimeout(async () => {
          await fetchSimulationStatus();
          
          // Verifică din nou după 3 secunde
          setTimeout(async () => {
            const statusCheck = await axios.get(`${API_URL}/api/admin/status`);
            console.log("🔍 [VERIFICATION] Status after 3 seconds:", statusCheck.data);
            
            if (!statusCheck.data.running) {
              toast.error("❌ BACKEND MINTE! Spune că a pornit dar nu pornește!");
              console.error("🚨 [BACKEND LIES] Backend returned success but simulation is NOT running!");
            } else {
              toast.success("✅ AutoSim verified as running!");
            }
          }, 3000);
        }, 1000);
      } else {
        toast.success(res.data.message || "✅ AutoSim started!");
      }
      
    } catch (err) {
      console.error("❌ [DEBUG] AutoSim error:", err);
      console.error("❌ [DEBUG] Error response:", err.response?.data);
      toast.error("❌ Error starting AutoSim: " + (err.response?.data?.message || err.message));
    }
  };

  const handleStopAutoSim = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/stop`, {
        password: ADMIN_PASS,
      });
      toast.success(res.data.message || "🛑 AutoSim stopped!");
      await fetchSimulationStatus();
    } catch (err) {
      console.error("❌ Stop auto:", err.message);
      toast.error("❌ Error stopping AutoSim.");
    }
  };



  return (
    <>
    <div className={styles["admin-page"]}>
      {!isAuthorized ? (
        <div className={styles["admin-panel"]} style={getPanelStyle()}>
          <div
            className={styles["status-badge"]}
            title="Admin auth status"
            style={{ background: "#f00" }}
          />
          <div style={{ textAlign: "center", paddingTop: "10px" }}>
            <h2 style={{ margin: "6px 0 10px", fontSize: "18px" }}>Admin Panel</h2>
            <p style={{ margin: "0 0 12px", opacity: 0.85 }}>
              Autentificare necesară pentru acces.
            </p>
            <button onClick={handleLogin} className={styles["login-btn"]}>
              🔐 Login
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`${styles["admin-panel"]} ${panelResizable ? styles["resizable"] : ""}`}
          style={getPanelStyle()}
        >
          <div
            className={styles["status-badge"]}
            title="Admin auth status"
            style={{ background: "#0f0" }}
          />
          <div className={styles["panel-controls"]}>
            <button
              type="button"
              className={styles["panel-control-btn"]}
              onClick={() => setPanelPreset((p) => (p === "normal" ? "half" : p === "half" ? "large" : "normal"))}
              title="Toggle size: normal → 50% → large"
            >
              ↔ Resize
            </button>
            <button
              type="button"
              className={styles["panel-control-btn"]}
              onClick={() => setPanelResizable((v) => !v)}
              title="Enable/disable manual resize by dragging the corner"
            >
              {panelResizable ? "🖐 Manual: ON" : "🖐 Manual: OFF"}
            </button>
          </div>
          <button onClick={handleLogout} className={styles["logout-btn"]}>
            🛑 Logout
          </button>

          {/* Tab Navigation */}
          <div className={styles["tab-navigation"]} style={{
            display: 'flex',
            gap: '10px',
            margin: '20px 0',
            borderBottom: '1px solid #555',
            paddingBottom: '10px'
          }}>
            <button 
              onClick={() => setActiveTab("overview")}
              className={activeTab === "overview" ? styles["tab-active"] : styles["tab-inactive"]}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                background: activeTab === "overview" ? '#14F195' : '#444',
                color: activeTab === "overview" ? '#000' : '#fff',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '12px'
              }}
            >
              📊 Overview
            </button>
            <button 
              onClick={() => setActiveTab("treasury")}
              className={activeTab === "treasury" ? styles["tab-active"] : styles["tab-inactive"]}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                background: activeTab === "treasury" ? '#14F195' : '#444',
                color: activeTab === "treasury" ? '#000' : '#fff',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '12px'
              }}
            >
              💳 USDC Payouts
            </button>
            {/* 🟣 Solana Rewards (legacy) removed */}
            <button 
              onClick={() => setActiveTab("solana-payments")}
              className={activeTab === "solana-payments" ? styles["tab-active"] : styles["tab-inactive"]}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                background: activeTab === "solana-payments" ? '#14F195' : '#444',
                color: activeTab === "solana-payments" ? '#000' : '#fff',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '12px'
              }}
            >
              🧾 Solana Payments
            </button>
            <button 
              onClick={() => setActiveTab("leaderboard")}
              className={activeTab === "leaderboard" ? styles["tab-active"] : styles["tab-inactive"]}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                background: activeTab === "leaderboard" ? '#14F195' : '#444',
                color: activeTab === "leaderboard" ? '#000' : '#fff',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '12px'
              }}
            >
              🏆 Leaderboard
            </button>
            <button 
              onClick={() => setActiveTab("email-sender")}
              className={activeTab === "email-sender" ? styles["tab-active"] : styles["tab-inactive"]}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                background: activeTab === "email-sender" ? '#14F195' : '#444',
                color: activeTab === "email-sender" ? '#000' : '#fff',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '12px'
              }}
            >
              📧 Email Sender
            </button>
          </div>

          <>
          {activeTab === "overview" && (
            <>
              <div style={{ 
                background: '#2a2a2a', 
                border: '1px solid #555', 
                borderRadius: '4px', 
                padding: '10px', 
                margin: '10px 0',
                fontSize: '12px',
                color: '#cccccc',
                textAlign: 'left'
              }}>
                ℹ️ <strong>Data Sources:</strong><br/>
                • <span style={{color: '#00ff88'}}>Real Sales</span>: Blockchain transactions via CellManager.sol<br/>
                • <span style={{color: '#ffaa00'}}>Simulated Sales</span>: Backend testing data (AdminPanel simulations)<br/>
                • <span style={{color: '#00d4ff'}}>Total</span>: Combined real + simulated for complete overview
              </div>



          {/* ROUND MANAGEMENT */}
          <div className={styles["section"]}>
            <h3>🎯 Set BITS Supply for Current Round</h3>
            
            {/* CellManager Data (Read-Only) */}
            <div style={{ 
              background: '#1a3a1a', 
              border: '1px solid #00ff88',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '12px',
              fontSize: '13px',
              color: '#cccccc'
            }}>
              <div style={{ color: '#00ff88', marginBottom: '8px' }}>
                <strong>📊 From CellManager (Blockchain):</strong>
              </div>
              <div><strong>Round Number:</strong> {cellManagerData.loading ? "⏳ Loading..." : (cellManagerData.roundNumber || 'N/A')}</div>
              <div><strong>Current Price:</strong> {cellManagerData.loading ? "⏳ Loading..." : `$${(cellManagerData.currentPrice || 0).toFixed(6)}`}</div>
              <div><strong>Real BITS Available:</strong> {
                cellManagerData.loading ? "⏳ Loading..." : 
                (cellManagerData.availableBits || 0) === 0 ? 
                  <span style={{color: '#ff6b35'}}>0 BITS (⚠️ Cell not configured)</span> :
                  `${(cellManagerData.availableBits || 0).toLocaleString()} BITS`
              }</div>
              <div><strong>Sold:</strong> {cellManagerData.loading ? "⏳ Loading..." : `${(cellManagerData.soldBits || 0).toLocaleString()} BITS`}</div>
              <div><strong>USD Value:</strong> {cellManagerData.loading ? "⏳ Loading..." : `$${(cellManagerData.totalUsdValue || 0).toFixed(2)}`}</div>
              <div><strong>Transactions:</strong> {cellManagerData.loading ? "⏳ Loading..." : (cellManagerData.totalTransactions || 0)}</div>
              <div><strong>Unique Wallets:</strong> {cellManagerData.loading ? "⏳ Loading..." : (cellManagerData.uniqueWallets || 0)}</div>
              {!cellManagerData.loading && (cellManagerData.availableBits || 0) === 0 && (
                <div style={{ fontSize: '11px', color: '#ff6b35', marginTop: '4px' }}>
                  💡 Cell {cellManagerData.cellId} needs BITS supply set in CellManager contract
                  <br />
                  <strong>Use "Add Cell to CellManager" button below to configure it</strong>
                </div>
              )}
            </div>

            {/* Database Data (Editable) */}
            {presaleInfo && (
              <div style={{ 
                background: '#2a2a1a', 
                border: '1px solid #ffaa00',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '12px',
                fontSize: '13px',
                color: '#cccccc'
              }}>
                <div style={{ color: '#ffaa00', marginBottom: '8px' }}>
                  <strong>💾 From Database (Simulations):</strong>
                </div>
                <div><strong>Simulation Supply:</strong> {(presaleInfo.totalSupply || 0).toLocaleString()} BITS</div>
                <div><strong>Simulated Sold:</strong> {(presaleInfo.sold || 0).toLocaleString()} BITS</div>
                <div><strong>Simulation Available:</strong> {Math.max(0, (presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0)).toLocaleString()} BITS</div>
              </div>
            )}

            <input
              type="number"
              placeholder="BITS Supply for Simulations (e.g., 20000000)"
              value={supplyInput}
              onChange={(e) => setSupplyInput(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                borderRadius: '4px',
                border: '1px solid #555',
                background: '#1a1a1a',
                color: '#fff',
                fontSize: '12px'
              }}
            />
            
            {/* Always show Database Supply button */}
            <button 
              onClick={handleSetSupply}
              disabled={!supplyInput || cellManagerData.loading}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: 'none',
                background: cellManagerData.loading ? '#666' : '#00aa00',
                color: '#fff',
                cursor: cellManagerData.loading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}
            >
              {cellManagerData.loading ? "⏳ Loading CellManager..." : "💾 Set BITS Supply for Database Simulation"}
            </button>

            {/* Reset Tokens to 0 button */}
            <button 
              onClick={handleResetTokens}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: 'none',
                background: '#ff4444',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}
            >
              🔥 Reset Tokens to 0
            </button>
            
            {/* Optional: Add Cell to CellManager button (for blockchain) */}
            {!cellManagerData.loading && (cellManagerData.availableBits || 0) === 0 && (
              <button 
                onClick={handleAddCell}
                disabled={!supplyInput}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: !supplyInput ? '#666' : '#ff6600',
                  color: '#fff',
                  cursor: !supplyInput ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}
              >
                🏗️ Add Cell to CellManager (Blockchain)
              </button>
            )}
            
            {/* Info text */}
            <div style={{ fontSize: '10px', color: '#888', textAlign: 'center', marginTop: '4px' }}>
              {!cellManagerData.loading && (cellManagerData.availableBits || 0) === 0 ? 
                "This will create a new cell in CellManager with the specified BITS supply" :
                "This will set simulation supply in database (CellManager already configured)"
              }
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className={styles["section"]}>
            <h3>⚡ Quick Actions</h3>
            
            <button 
              onClick={handleEndRound}
              disabled={!presaleInfo}
              className={styles.button}
              style={{ background: '#ff6b35' }}
            >
              ⏹️ End Current Round
            </button>
            
            
            {/* New Round Button - Only show when CellManager is configured */}
            {cellManagerData && !cellManagerData.loading && cellManagerData.roundNumber > 0 && (
              <button 
                onClick={handleStartNewRound}
                className={styles.button}
                style={{ background: '#28a745' }}
              >
                🚀 Start New Round {cellManagerData.roundNumber}
              </button>
            )}
          </div>

          <div className={styles["section"]}>
            <h3>🤖 Auto Simulation</h3>
            
            {/* BITS Availability Status */}
            <div style={{ 
              background: '#2a2a2a', 
              border: '1px solid #555',
              borderRadius: '6px',
              padding: '8px',
              marginBottom: '12px',
              fontSize: '13px',
              color: '#cccccc'
            }}>
              <strong>Available BITS:</strong> {
                presaleInfo 
                  ? `${((presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0)).toLocaleString()} BITS`
                  : "No active round"
              }
              {presaleInfo && ((presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0)) <= 0 && (
                <div style={{ color: '#cccccc', marginTop: '4px' }}>
                  ⚠️ AutoSim cannot start without available BITS
                </div>
              )}
            </div>

            <button 
              onClick={handleStartAutoSim}
              disabled={autoSimRunning}
              style={{
                opacity: autoSimRunning ? 0.5 : 1,
                cursor: autoSimRunning ? 'not-allowed' : 'pointer'
              }}
            >
              ▶️ Start AutoSim
            </button>
            
            <button 
              onClick={handleStopAutoSim}
              disabled={!autoSimRunning}
              style={{
                background: '#ffa500',
                opacity: !autoSimRunning ? 0.5 : 1,
                cursor: !autoSimRunning ? 'not-allowed' : 'pointer'
              }}
            >
              ⏸️ Pause Simulation
            </button>

            
            {/* Info message when all tokens are sold */}
            {presaleInfo && presaleInfo.sold >= presaleInfo.totalSupply && presaleInfo.totalSupply > 0 && (
              <div style={{
                background: '#2a1a1a',
                border: '1px solid #ff6b35',
                borderRadius: '4px',
                padding: '8px',
                marginTop: '8px',
                fontSize: '12px',
                color: '#ff6b35',
                textAlign: 'center'
              }}>
                ℹ️ All tokens sold - round complete! AutoSim will not perform new sales.
              </div>
            )}
            <button onClick={handleStopAutoSim} disabled={!autoSimRunning}>
              ⏹️ Stop AutoSim
            </button>
            
            <p style={{ fontSize: "14px", marginTop: "8px" }}>
              Status: {autoSimRunning ? "🟢 Active" : "🔴 Inactive"}
            </p>
          </div>
<div className={styles["section"]}>
  <h3>💰 Manual Simulation</h3>
  
  {/* BITS Availability Info */}
      <div style={{ 
      background: '#2a2a2a', 
      border: '1px solid #555',
      borderRadius: '6px',
      padding: '8px',
      marginBottom: '12px',
      fontSize: '13px',
      color: '#cccccc'
    }}>
      <strong>Available BITS:</strong> {
        presaleInfo 
          ? `${Math.max(0, (presaleInfo.totalSupply || 20000000) - (presaleInfo.sold || 0)).toLocaleString()} BITS`
          : "No active round"
      }
    </div>

 <input
  type="number"
  placeholder="Simulate USD"
  value={manualUsd}
  onChange={(e) => setManualUsd(e.target.value)}
/>
<input
  type="number"
    placeholder={`Simulate BITS (max: ${presaleInfo ? ((presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0)).toLocaleString() : '0'})`}
  value={manualBits}
  onChange={(e) => setManualBits(e.target.value)}
    max={presaleInfo ? (presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0) : 0}
  />

  <button 
    onClick={handleManualSimulation}
    disabled={!presaleInfo || ((presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0)) <= 0}
    style={{
      opacity: (!presaleInfo || ((presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0)) <= 0) ? 0.5 : 1,
      cursor: (!presaleInfo || ((presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0)) <= 0) ? 'not-allowed' : 'pointer'
    }}
  >
    ➕ Simulate Sale
  </button>
</div>

            <div className={styles["info-section"]}>
            <h3>📊 Current State (from CellManager)</h3>
            {cellManagerData.loading ? (
              <p>⏳ Loading data from CellManager...</p>
            ) : cellManagerData.error ? (
              <p style={{ color: 'red' }}>❌ {cellManagerData.error}</p>
            ) : (
              <>
                <p>Cell ID: {cellManagerData.cellId}</p>
                <p>Round: {cellManagerData.roundNumber}</p>
                <p>Price: ${cellManagerData.currentPrice?.toFixed(6) || 'N/A'}</p>
                <p>Available: {cellManagerData.availableBits?.toLocaleString() || 'N/A'} BITS</p>
                <p>Sold: {cellManagerData.soldBits?.toLocaleString() || 'N/A'} BITS</p>
              </>
            )}
            </div>
          <div className={styles["section"]}>
            <h3>📜 Round History</h3>
            <button 
              onClick={() => setShowHistoryModal(true)}
              style={{
                background: '#00d4ff',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '12px'
              }}
            >
              📊 View Round History
            </button>
          </div>

          {/* Smart Staking Quick Access */}
          <div className={styles["section"]} style={{ marginTop: '15px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 51, 102, 0.1)',
              border: '1px solid rgba(255, 51, 102, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>🚀</span>
                <div>
                  <div style={{ 
                    color: '#ff3366', 
                    fontSize: '13px', 
                    fontWeight: 'bold',
                    marginBottom: '2px'
                  }}>
                    Smart Staking
                  </div>
                  <div style={{ 
                    color: '#ccc', 
                    fontSize: '11px'
                  }}>
                    Pre-authorize NFT purchases
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  navigate('/smart-staking');
                  toast.success('🚀 Navigating to Smart Staking...', {
                    position: "top-right",
                    autoClose: 2000
                  });
                }}
                style={{
                  background: 'linear-gradient(135deg, #ff3366, #ff1a4d)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  boxShadow: '0 2px 6px rgba(255, 51, 102, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(255, 51, 102, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(255, 51, 102, 0.3)';
                }}
              >
                Open 🎯
              </button>
            </div>
          </div>

            </>
          )}

          {/* Solana Rewards (legacy) removed */}

          {activeTab === "solana-payments" && (
            <>
              <div className={styles["section"]}>
                <h3>🧾 Solana Payments (Manual fulfilment)</h3>
                {solanaApiStatus.ok === false && solanaApiStatus.msg ? (
                  <div style={{
                    marginTop: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255, 165, 0, 0.35)',
                    background: 'rgba(255, 165, 0, 0.08)',
                    color: '#ffd7a3',
                    fontSize: 12,
                    lineHeight: 1.4
                  }}>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>⚠️ Solana API not available</div>
                    <div>{solanaApiStatus.msg}</div>
                    <div style={{ marginTop: 6, opacity: 0.9 }}>
                      You can still use your manual flow once backend exposes Solana payments from DB.
                    </div>
                  </div>
                ) : null}
                <div style={{ fontSize: '12px', color: '#ccc', lineHeight: 1.5 }}>
                  <div><strong>Backend:</strong> <span style={{ wordBreak: 'break-all' }}>{API_URL}</span></div>
                  <div><strong>Destination (Solana):</strong> <span style={{ wordBreak: 'break-all' }}>{solanaDestination || '—'}</span></div>
                  <div><strong>Treasury (BSC):</strong> <span style={{ wordBreak: 'break-all' }}>{solanaTreasury || '—'}</span></div>
                  <div><strong>Last refresh:</strong> <span>{solanaLastFetchAt ? new Date(solanaLastFetchAt).toLocaleString() : '—'}</span></div>
                  <div style={{ marginTop: 6, opacity: 0.9 }}>
                    This table shows: <strong>Solana signature → cron verifies SOL transfer → you send BITS manually → paste BSC tx hash (Mark fulfilled)</strong>.
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a
                      href={`${API_URL}/api/transactions/debug/solana`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#7dd3fc' }}
                      title="Raw Solana transactions from DB (debug endpoint)"
                    >
                      Open /api/transactions/debug/solana
                    </a>
                    <a
                      href={`${API_URL}/api/rewards/treasury-address`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#a7f3d0' }}
                      title="Quick sanity check (GET endpoint) that backend responds"
                    >
                      Backend health (treasury-address)
                    </a>
                  </div>
                </div>
                <button 
                  onClick={fetchSolanaPayments} 
                  disabled={solanaPaymentsLoading} 
                  style={{ 
                    marginTop: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  {solanaPaymentsLoading ? "⏳ Refreshing..." : "🔄 Refresh"}
                </button>
                
                {/* ===== NEW: Missing Transactions Alert ===== */}
                {solanaMissingCount > 0 && (
                  <div style={{
                    marginTop: 15,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '2px solid rgba(255, 69, 58, 0.6)',
                    background: 'rgba(255, 69, 58, 0.15)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>⚠️</span>
                      <div>
                        <div style={{ fontSize: 16, marginBottom: 4 }}>
                          {solanaMissingCount} tranzacție{solanaMissingCount > 1 ? 'ii' : ''} Solana neverificat{solanaMissingCount > 1 ? 'e' : 'ă'}!
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 'normal' }}>
                          Tranzacții SUCCESS pe blockchain care lipsesc din baza de date
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={syncMissingTransactions}
                      disabled={solanaSyncing}
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        cursor: solanaSyncing ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.2s ease',
                        opacity: solanaSyncing ? 0.6 : 1
                      }}
                      onMouseOver={(e) => {
                        if (!solanaSyncing) {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.6)';
                        }
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                      }}
                    >
                      {solanaSyncing ? '⏳ Sincronizare...' : '✅ Sincronizează Acum'}
                    </button>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => setSolanaDebugOpen((v) => !v)}
                  style={{ 
                    marginTop: '8px', 
                    marginLeft: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  {solanaDebugOpen ? "🧪 Hide debug" : "🧪 Show debug"}
                </button>
                <button 
                  onClick={fetchSolanaDbInfo} 
                  style={{ 
                    marginTop: '8px', 
                    marginLeft: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  🧩 DB diagnostics
                </button>
                {solanaDebugOpen && (
                  <div style={{
                    marginTop: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(125, 211, 252, 0.25)',
                    background: 'rgba(125, 211, 252, 0.06)',
                    color: '#dbeafe',
                    fontSize: 12,
                    lineHeight: 1.45
                  }}>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>🧪 Solana Payments Debug</div>
                    <div style={{
                      marginTop: 8,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid rgba(255, 215, 0, 0.22)',
                      background: 'rgba(255, 215, 0, 0.06)',
                      color: '#ffd7a3'
                    }}>
                      <div style={{ fontWeight: 900, marginBottom: 4 }}>🚫 Anti double-pay rule</div>
                      <div style={{ opacity: 0.95 }}>
                        Pentru plățile SOL, <strong>trimite exact valoarea “Send now”</strong> din tabel (nu “BITS”).
                        Diferența “reserved” rămâne claimabilă în <strong>Rewards Hub → SOL Loyalty Reward</strong>.
                        <div style={{ marginTop: 4, opacity: 0.9 }}>
                          Backend-ul validează acum tx hash-ul de pe BSC și <strong>refuză Mark fulfilled</strong> dacă suma trimisă nu corespunde (previne plata dublă).
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div><strong>Rows:</strong> {(solanaPayments || []).length}</div>
                      <div><strong>API ok:</strong> {String(solanaApiStatus.ok)}</div>
                      {solanaApiStatus.msg ? <div><strong>API msg:</strong> {solanaApiStatus.msg}</div> : null}
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const txt = JSON.stringify(solanaLastRawResponse ?? { ok: solanaApiStatus.ok, msg: solanaApiStatus.msg }, null, 2);
                            await navigator.clipboard.writeText(txt);
                            toast.success("✅ Copied Solana API response JSON");
                          } catch (e) {
                            toast.error("❌ Copy failed: " + (e.message || String(e)));
                          }
                        }}
                        style={{ padding: '6px 10px', borderRadius: 10 }}
                      >
                        📋 Copy API JSON
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const txt = JSON.stringify(solanaPayments || [], null, 2);
                            await navigator.clipboard.writeText(txt);
                            toast.success("✅ Copied rows JSON");
                          } catch (e) {
                            toast.error("❌ Copy failed: " + (e.message || String(e)));
                          }
                        }}
                        style={{ padding: '6px 10px', borderRadius: 10 }}
                      >
                        📋 Copy rows JSON
                      </button>
                    </div>

                    <div style={{ marginTop: 10, opacity: 0.95 }}>
                      <div style={{ fontWeight: 900, marginBottom: 4 }}>On-chain AdditionalReward (read-only)</div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <label style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <strong>EVM wallet:</strong>
                          <select
                            value={solanaSelectedEvmWallet}
                            onChange={(e) => setSolanaSelectedEvmWallet(e.target.value)}
                            style={{ minWidth: 320 }}
                          >
                            <option value="">— select wallet —</option>
                            {Array.from(new Set((solanaPayments || [])
                              .map(r => String(r?.evm_wallet || r?.evmWallet || '').trim())
                              .filter(x => x && x.startsWith('0x'))))
                              .map((w) => (
                                <option key={w} value={w}>{w}</option>
                              ))}
                          </select>
                        </label>
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <div><strong>Total invested (contract):</strong> ${fmt(additionalBonus.totalInvested, 2)}</div>
                        <div><strong>Tier:</strong> {additionalBonus.tier ? `${additionalBonus.tier.rate}%` : '—'}</div>
                        <div><strong>Estimated bonus (contract history):</strong> ${fmt(additionalBonus.totalEstimatedBonus, 2)}</div>
                        <div><strong>Claimable:</strong> ${fmt(additionalBonus.claimableBonus, 2)}</div>
                        <div><strong>Claimed:</strong> ${fmt(additionalBonus.claimedBonus, 2)}</div>
                      </div>
                      {additionalBonus.nextTier?.threshold ? (
                        <div style={{ marginTop: 6, opacity: 0.9 }}>
                          Next tier: <strong>{additionalBonus.nextTier.rate}%</strong> at ${fmt(additionalBonus.nextTier.threshold, 2)} (remaining ${fmt(additionalBonus.nextTier.remaining, 2)})
                        </div>
                      ) : null}
                      <div style={{ marginTop: 6, opacity: 0.85 }}>
                        Note: acest panel citește contractul AdditionalReward pe BSC public RPC. Dacă backend-ul nu a înregistrat investițiile, valorile pot fi 0.
                      </div>
                    </div>

                    <div style={{ marginTop: 14, opacity: 0.98 }}>
                      <div style={{ fontWeight: 900, marginBottom: 6 }}>🟣 SOL Loyalty (DB rewards) — Admin quick actions</div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <strong>Payout:</strong>
                          <select
                            value={solanaLoyaltyCurrency}
                            onChange={(e) => setSolanaLoyaltyCurrency(e.target.value)}
                          >
                            <option value="BITS">BITS</option>
                            <option value="USDC">USDC</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          disabled={!solanaSelectedEvmWallet}
                          onClick={async () => {
                            try {
                              const res = await axios.post(`${API_URL}/api/rewards/register-solana-loyalty`, { wallet: solanaSelectedEvmWallet });
                              setSolanaLoyaltyLast(res.data);
                              if (res.data?.ok) toast.success(`✅ SOL loyalty synced: +${res.data.added || 0} BITS`);
                              else toast.error(`❌ Sync failed`);
                            } catch (e) {
                              toast.error("❌ Sync failed: " + (e.response?.data?.error || e.message));
                            }
                          }}
                          style={{ padding: '6px 10px', borderRadius: 10 }}
                          title="Computes SOL loyalty from confirmed SOL transactions and registers delta into unified rewards DB"
                        >
                          🔄 Sync SOL loyalty
                        </button>
                        <button
                          type="button"
                          disabled={!solanaSelectedEvmWallet}
                          onClick={async () => {
                            try {
                              const res = await axios.post(`${API_URL}/api/rewards/quote-solana-loyalty`, {
                                wallet: solanaSelectedEvmWallet,
                                payoutCurrency: solanaLoyaltyCurrency
                              });
                              setSolanaLoyaltyLast(res.data);
                              if (res.data?.ok) toast.success(`✅ Quote OK (canPay=${String(res.data.canPay)})`);
                              else toast.error(`❌ Quote failed`);
                            } catch (e) {
                              toast.error("❌ Quote failed: " + (e.response?.data?.error || e.message));
                            }
                          }}
                          style={{ padding: '6px 10px', borderRadius: 10 }}
                          title="Pre-check: shows pending amount and whether treasury can pay"
                        >
                          🧾 Quote
                        </button>
                        <button
                          type="button"
                          disabled={!solanaSelectedEvmWallet}
                          onClick={async () => {
                            const ok = window.confirm(`Pay SOL loyalty to ${solanaSelectedEvmWallet} in ${solanaLoyaltyCurrency}?`);
                            if (!ok) return;
                            try {
                              const res = await axios.post(`${API_URL}/api/rewards/payout-solana-loyalty`, {
                                wallet: solanaSelectedEvmWallet,
                                payoutCurrency: solanaLoyaltyCurrency
                              });
                              setSolanaLoyaltyLast(res.data);
                              if (res.data?.ok) toast.success(`✅ Paid. Tx: ${(res.data.tx_hash || '').slice(0, 10)}…`);
                              else toast.error(`❌ Payout failed`);
                            } catch (e) {
                              toast.error("❌ Payout failed: " + (e.response?.data?.error || e.message));
                            }
                          }}
                          style={{ padding: '6px 10px', borderRadius: 10 }}
                          title="Executes treasury payout for pending SOL loyalty rewards (BITS or USDC)"
                        >
                          💸 Pay now
                        </button>
                      </div>
                      {solanaLoyaltyLast ? (
                        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                          <div><strong>Last response:</strong> {JSON.stringify(solanaLoyaltyLast)}</div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
                {solanaDbInfo?.ok && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>
                    <div><strong>DB:</strong> {solanaDbInfo.db?.host || "—"} / {solanaDbInfo.db?.name || "—"}</div>
                    <div style={{ opacity: 0.9 }}>
                      <strong>Counts:</strong>{" "}
                      {(solanaDbInfo.countsByNetwork || []).map((x) => `${x.network || "∅"}=${x.count}`).join(", ") || "—"}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles["section"]}>
                <h3>📄 Recent Solana Payments</h3>
                {(() => {
                  const rows = solanaPayments || [];
                  const pendingCount = rows.filter(r => String(r.status || '').toLowerCase() === 'pending' && !r.tx_hash_on_chain).length;
                  const failedCount = rows.filter(r => String(r.status || '').toLowerCase() === 'failed' && !r.tx_hash_on_chain).length;
                  if (pendingCount === 0 && failedCount === 0) return null;
                  return (
                    <div style={{
                      marginTop: 8,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(255, 165, 0, 0.25)',
                      background: 'rgba(255, 165, 0, 0.08)',
                      color: '#ffd7a3',
                      fontSize: 12,
                      display: 'flex',
                      gap: 12,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div><strong>Pending:</strong> {pendingCount}</div>
                        <div><strong>Failed:</strong> {failedCount}</div>
                        <div style={{ opacity: 0.9 }}>Cron verifies SOL on-chain; you fulfil BITS manually and then mark tx hash.</div>
                      </div>
                    </div>
                  );
                })()}
                <div style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  marginTop: 8
                }}>
                  <label style={{ fontSize: 12, color: '#ccc' }}>
                    <strong>Status:</strong>{" "}
                    <select
                      value={solanaStatusFilter}
                      onChange={(e) => setSolanaStatusFilter(e.target.value)}
                      style={{ marginLeft: 6 }}
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </label>
                  <label style={{ fontSize: 12, color: '#ccc', flex: '1 1 280px' }}>
                    <strong>Search:</strong>{" "}
                    <input
                      value={solanaSearch}
                      onChange={(e) => setSolanaSearch(e.target.value)}
                      placeholder="wallet 0x… or signature…"
                      style={{ marginLeft: 6, width: 'min(520px, 100%)' }}
                    />
                  </label>
                </div>
                <div style={{
                  marginTop: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 0.8fr 1fr 0.7fr 0.8fr 0.8fr 0.9fr 0.9fr 1.6fr',
                    gap: 8,
                    padding: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.04)'
                  }}>
                    <div>Time</div>
                    <div>Status</div>
                    <div>Buyer (BSC)</div>
                    <div>SOL</div>
                    <div>USD</div>
                    <div>Tier</div>
                    <div>Send now</div>
                    <div>BITS</div>
                    <div>Links / Actions</div>
                  </div>

                  <div style={{ maxHeight: 520, overflow: 'auto' }}>
                    {(() => {
                      const rawRows = Array.isArray(solanaPayments) ? solanaPayments : [];

                      // Decorate rows with cumulative USD tier/rate (estimate) based on DB `usd_invested` (SOL only).
                      // IMPORTANT: This is an estimate; the contract may store per-investment rates.
                      const byTimeAsc = [...rawRows].sort((a, b) => {
                        const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
                        const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
                        return ta - tb;
                      });
                      let cumUsd = 0;
                      const decoratedAsc = byTimeAsc.map((tx) => {
                        const usd = toNum(tx.usd_invested ?? tx.usdInvested);
                        cumUsd += usd;
                        const tier = getTierForUsd(cumUsd);
                        const estBonusUsd = usd > 0 ? (usd * (tier.rate || 0)) / 100 : 0;
                        const solAmount = toNum(tx.amount);
                        const impliedSolPrice = solAmount > 0 ? (usd / solAmount) : 0;
                        return {
                          ...tx,
                          __dbg_usd: usd,
                          __dbg_cumUsd: cumUsd,
                          __dbg_tierRate: tier.rate || 0,
                          __dbg_tierLabel: tier.label,
                          __dbg_estBonusUsd: estBonusUsd,
                          __dbg_impliedSolPrice: impliedSolPrice
                        };
                      });

                      const rows = decoratedAsc.sort((a, b) => {
                        const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
                        const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
                        return tb - ta;
                      });

                      const filtered = rows
                        .filter((tx) => {
                          const st = String(tx.status || "").toLowerCase();
                          if (solanaStatusFilter !== "all" && st !== solanaStatusFilter) return false;
                          const q = solanaSearch.trim().toLowerCase();
                          if (!q) return true;
                          const w = String((tx.evm_wallet || tx.evmWallet || tx.wallet_address) || "").toLowerCase();
                          const solFrom = String(tx.wallet_address || "").toLowerCase();
                          const sig = String((tx.tx_signature || tx.signature) || "").toLowerCase();
                          return w.includes(q) || sig.includes(q) || solFrom.includes(q);
                        })
                        .slice(0, 200);

                      return (
                        <>
                          {filtered.map((tx) => {
                            const buyer = String((tx.evm_wallet || tx.evmWallet || tx.wallet_address) || "");
                            const solFrom = String(tx.wallet_address || "");
                            const shortW = buyer ? `${buyer.slice(0, 6)}...${buyer.slice(-4)}` : "—";
                            const sig = String((tx.tx_signature || tx.signature) || "");
                            const shortSig = sig ? `${sig.slice(0, 8)}...${sig.slice(-6)}` : "—";
                            const evm = String(tx.tx_hash_on_chain || "");
                            const shortEvm = evm ? `${evm.slice(0, 8)}...${evm.slice(-6)}` : "—";
                            const status = String(tx.status || "").toLowerCase();
                            const statusColor = status === "confirmed" ? "#00ff88" : status === "failed" ? "#ff3366" : "#ffaa00";
                            const createdAt = tx.created_at ? new Date(tx.created_at).toLocaleString() : "—";
                            const solAmount = toNum(tx.amount);
                            const bits = toNum(tx.bits_received);
                            const usd = toNum(tx.__dbg_usd);
                            const tierLabel = String(tx.__dbg_tierLabel || "0%");
                            const estBonusUsd = toNum(tx.__dbg_estBonusUsd);
                            const impliedSol = toNum(tx.__dbg_impliedSolPrice);
                            const canMark = status === "confirmed" && !evm && !!sig;

                            return (
                              <div
                                key={tx.id || sig || `${buyer}-${createdAt}`}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 0.8fr 1fr 0.7fr 0.8fr 0.8fr 0.9fr 0.9fr 1.6fr",
                                  gap: 8,
                                  padding: "10px",
                                  fontSize: "11px",
                                  borderTop: "1px solid rgba(255,255,255,0.06)"
                                }}
                              >
                                <div>{createdAt}</div>
                                <div style={{ color: statusColor, fontWeight: 800 }}>{tx.status || "pending"}</div>
                                <div 
                                  title={`Buyer: ${buyer}\nSOL From: ${solFrom}`}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                  <span>{shortW}</span>
                                  {buyer && (
                                    <button
                                      onClick={() => copyWalletAddress(buyer, (msg) => toast.success(msg || "Copied!"))}
                                      title="Copy wallet address"
                                      style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '3px',
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        fontSize: '10px',
                                        padding: '2px 6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                      }}
                                    >
                                      📋
                                    </button>
                                  )}
                                </div>
                                <div>{Number.isFinite(solAmount) ? solAmount.toFixed(4) : "—"}</div>
                                <div title={impliedSol > 0 ? `Implied SOL price: $${fmt(impliedSol, 2)} (usd_invested / SOL)` : ""}>
                                  {usd > 0 ? `$${fmt(usd, 2)}` : "—"}
                                  {impliedSol > 0 ? <div style={{ opacity: 0.75 }}>SOL≈${fmt(impliedSol, 0)}</div> : null}
                                </div>
                                <div title={`Tier based on cumulative SOL USD (DB estimate): ${fmt(tx.__dbg_cumUsd, 2)} USD`}>
                                  <div style={{ fontWeight: 900 }}>{tierLabel}</div>
                                  {estBonusUsd > 0 ? <div style={{ opacity: 0.8 }}>res {fmt(estBonusUsd, 2)} BITS</div> : <div style={{ opacity: 0.55 }}>—</div>}
                                </div>
                                {(() => {
                                  // BNB flow effectively subtracts "investment bonus" from immediate receive.
                                  // For SOL manual fulfilment, we show suggested "send now" so you don't double-pay:
                                  // sendNow ≈ (baseUSD - reserved) + promoBonusBits.
                                  const promo = toNum(tx.bonus_bits);
                                  const base = usd > 0 ? Math.floor(usd) : 0;
                                  const reserved = estBonusUsd > 0 ? Math.floor(estBonusUsd) : 0; // 1 USD = 1 BITS
                                  const sendNow = base > 0 ? Math.max(0, base - reserved) + promo : (bits > 0 ? Math.max(0, Math.floor(bits) - reserved) : 0);
                                  return (
                                    <div title={`base=${base} promo=${promo} reserved=${reserved} (1 USD = 1 BITS reserved)`}>
                                      {sendNow > 0 ? sendNow.toLocaleString() : "—"}
                                      {promo > 0 ? <div style={{ opacity: 0.75 }}>promo {promo}</div> : null}
                                    </div>
                                  );
                                })()}
                                <div title={`Total recorded (bits_received). This may include promo bonus.`}>
                                  {Number.isFinite(bits) && bits > 0 ? Math.floor(bits).toLocaleString() : "—"}
                                </div>
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                  {sig ? (
                                    <a
                                      href={`https://solscan.io/tx/${sig}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      title={sig}
                                      style={{ color: "#7dd3fc" }}
                                    >
                                      Solscan ({shortSig})
                                    </a>
                                  ) : (
                                    <span style={{ opacity: 0.6 }}>Solscan —</span>
                                  )}
                                  {evm ? (
                                    <a
                                      href={`https://bscscan.com/tx/${evm}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      title={evm}
                                      style={{ color: "#facc15" }}
                                    >
                                      BscScan ({shortEvm})
                                    </a>
                                  ) : (
                                    <span style={{ opacity: 0.6 }}>BscScan —</span>
                                  )}
                                  {canMark && (
                                    <button
                                      type="button"
                                      onClick={() => markSolanaFulfilled(tx.id)}
                                      disabled={solanaMarkingSig === tx.id}
                                      style={{
                                        padding: "4px 10px",
                                        borderRadius: 6,
                                        border: "1px solid rgba(0, 255, 163, 0.4)",
                                        background: solanaMarkingSig === tx.id ? "rgba(0,0,0,0.4)" : "rgba(0, 255, 163, 0.15)",
                                        color: "#fff",
                                        cursor: solanaMarkingSig === tx.id ? "not-allowed" : "pointer",
                                        fontSize: "11px",
                                        fontWeight: "600",
                                        transition: "all 0.2s ease"
                                      }}
                                      title="After you manually send BITS, paste the BSC tx hash to link it here"
                                    >
                                      {solanaMarkingSig === tx.id ? "⏳ Marking…" : "✅ Mark fulfilled"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {rawRows.length === 0 && (
                            <div style={{ padding: 12, fontSize: 12, color: "#aaa" }}>
                              No Solana payments found yet.
                            </div>
                          )}
                        </>
                      );
                    })()}

                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "leaderboard" && (
            <>
              <div className={styles["section"]}>
                <h3>🏆 Leaderboard (Demo / Marketing)</h3>
                <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.5 }}>
                  This leaderboard is <strong>demo</strong> for marketing (5 rows). You can edit it manually here.
                  RewardsHub will display it publicly (even without wallet connected).
                </div>
                <div style={{
                  marginTop: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 215, 0, 0.22)',
                  background: 'rgba(255, 215, 0, 0.06)',
                  color: '#ffd7a3',
                  fontSize: 12,
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <strong>Daily variation (jitter):</strong>{" "}
                    <span style={{ fontWeight: 900 }}>{leaderboardJitterEnabled ? "ON" : "OFF"}</span>
                    <div style={{ opacity: 0.9, marginTop: 4 }}>
                      When ON, RewardsHub shows a small ±2.5% daily variation for “alive” marketing effect.
                    </div>
                  </div>
                  <button
                    onClick={() => saveLeaderboardJitter(!leaderboardJitterEnabled)}
                    disabled={leaderboardSaving || leaderboardLoading}
                    style={{
                      background: leaderboardJitterEnabled ? 'rgba(255, 51, 102, 0.22)' : 'rgba(0, 255, 163, 0.18)',
                      border: '1px solid rgba(255,255,255,0.16)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      color: '#fff',
                      fontWeight: 900
                    }}
                    title="Toggle daily variation on RewardsHub"
                  >
                    {leaderboardSaving ? "⏳ Updating..." : (leaderboardJitterEnabled ? "Turn OFF" : "Turn ON")}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                  <button onClick={fetchLeaderboardDemo} disabled={leaderboardLoading || leaderboardSaving}>
                    {leaderboardLoading ? "⏳ Loading..." : "🔄 Refresh"}
                  </button>
                  <button onClick={saveLeaderboardDemo} disabled={leaderboardLoading || leaderboardSaving}>
                    {leaderboardSaving ? "⏳ Saving..." : "💾 Save"}
                  </button>
                  <button onClick={resetLeaderboardDemo} disabled={leaderboardLoading || leaderboardSaving}>
                    ♻️ Reset default
                  </button>
                </div>
              </div>

              <div className={styles["section"]}>
                <h3>✍️ Edit Rows</h3>
                <div style={{
                  marginTop: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 1fr 1fr 1fr',
                    gap: 8,
                    padding: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.04)'
                  }}>
                    <div>Rank</div>
                    <div>Name</div>
                    <div>Wallet (masked)</div>
                    <div>Reward (BITS)</div>
                    <div>Source</div>
                  </div>

                  {(leaderboardDemoRows || []).slice(0, 10).map((r, idx) => (
                    <div key={idx} style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 1fr 1fr 1fr',
                      gap: 8,
                      padding: '10px',
                      borderTop: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      <input
                        type="number"
                        value={r.rank ?? (idx + 1)}
                        onChange={(e) => updateLeaderboardRow(idx, { rank: Number(e.target.value) })}
                        style={{ width: '100%' }}
                      />
                      <input
                        value={r.name || ''}
                        onChange={(e) => updateLeaderboardRow(idx, { name: e.target.value })}
                        placeholder="Nova"
                        style={{ width: '100%' }}
                      />
                      <input
                        value={r.wallet || ''}
                        onChange={(e) => updateLeaderboardRow(idx, { wallet: e.target.value })}
                        placeholder="0xABCD…1234"
                        style={{ width: '100%' }}
                      />
                      <input
                        type="number"
                        value={r.rewardBits ?? 0}
                        onChange={(e) => updateLeaderboardRow(idx, { rewardBits: Number(e.target.value) })}
                        placeholder="12000"
                        style={{ width: '100%' }}
                      />
                      <input
                        value={r.source || ''}
                        onChange={(e) => updateLeaderboardRow(idx, { source: e.target.value })}
                        placeholder="Telegram + Referral"
                        style={{ width: '100%' }}
                      />
                    </div>
                  ))}

                  {(leaderboardDemoRows || []).length === 0 && (
                    <div style={{ padding: 12, fontSize: 12, color: '#aaa' }}>
                      No rows yet. Press “Reset default” to generate 5 demo rows.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "treasury" && (
            <>
              {/* Quick checklist + warnings */}
              <div className={styles["section"]}>
                <h3>✅ Quick Top-up Checklist</h3>
                <div style={{ marginTop: 8, fontSize: 11, color: '#aaa', lineHeight: 1.4 }}>
                  <div><strong>Backend API:</strong> <span style={{ wordBreak: 'break-all' }}>{API_URL}</span></div>
                  <button
                    onClick={() => window.open(`${API_URL}/api/rewards/treasury-address`, "_blank")}
                    style={{ marginTop: 6 }}
                    title="Open the treasury endpoint to verify which backend is used"
                  >
                    🔎 Test Treasury Endpoint
                  </button>
                </div>
                <button
                  onClick={() => setShowTreasuryGuide(true)}
                  style={{ marginTop: 6 }}
                >
                  📘 Open Treasury Guide (How to manage everything)
                </button>
                <div style={{ fontSize: '12px', color: '#ccc', lineHeight: 1.5 }}>
                  <div><strong>1)</strong> Send <strong>USDC (BEP-20 on BSC Mainnet)</strong> to the treasury address.</div>
                  <div><strong>2)</strong> Send <strong>BNB</strong> for gas (required for every payout tx).</div>
                  <div style={{ marginTop: 8, opacity: 0.9 }}>
                    <div><strong>Recommended minimums (safe):</strong></div>
                    <div>• BNB: <strong>0.01</strong> (gas buffer)</div>
                    <div>• USDC: at least <strong>{usdcCap != null ? Number(usdcCap).toFixed(2) : '30.00'}</strong> to cover today's cap</div>
                  </div>
                </div>

                {treasuryBalances && (
                  (() => {
                    const bnb = Number(treasuryBalances.bnb || 0);
                    const usdc = Number(treasuryBalances.usdc || 0);
                    const spent = Number(usdcSpent || 0);
                    const cap = Number(usdcCap || 30);
                    const remaining = Math.max(0, cap - spent);

                    const bnbLow = bnb < 0.003;
                    const bnbWarn = bnb < 0.01;
                    const usdcLow = usdc < Math.max(1, remaining);

                    if (!bnbLow && !bnbWarn && !usdcLow) return null;
                    return (
                      <div style={{
                        marginTop: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(255, 165, 0, 0.35)',
                        background: 'rgba(255, 165, 0, 0.08)',
                        color: '#ffd7a3',
                        fontSize: '12px'
                      }}>
                        <div style={{ fontWeight: 800, marginBottom: 6 }}>⚠️ Treasury Warnings</div>
                        {bnbLow && (<div>• <strong>BNB is very low</strong> ({bnb.toFixed(4)}). Payouts may fail due to gas.</div>)}
                        {!bnbLow && bnbWarn && (<div>• <strong>BNB is low</strong> ({bnb.toFixed(4)}). Recommended ≥ 0.01 BNB.</div>)}
                        {usdcLow && (<div>• <strong>USDC may be insufficient</strong> ({usdc.toFixed(4)}). Remaining cap today ≈ {remaining.toFixed(4)} USDC.</div>)}
                        <div style={{ marginTop: 6, opacity: 0.9 }}>
                          Tip: top up treasury and press <strong>Refresh</strong>.
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              <div className={styles["section"]}>
                <h3>🏦 Treasury Wallet (Top-up USDC/BNB)</h3>
                <div style={{ fontSize: '12px', color: '#ccc', lineHeight: 1.4 }}>
                  <div><strong>Address:</strong> <span style={{ wordBreak: 'break-all' }}>{treasuryAddress || '—'}</span></div>
                  <div style={{ marginTop: 6 }}>
                    <button
                      onClick={() => {
                        if (!treasuryAddress) return;
                        navigator.clipboard.writeText(treasuryAddress);
                        toast.success("✅ Treasury address copied");
                      }}
                      style={{ marginTop: 6 }}
                    >
                      📋 Copy Address
                    </button>
                    <button
                      onClick={() => {
                        if (!treasuryAddress) return;
                        window.open(`https://bscscan.com/address/${treasuryAddress}`, "_blank");
                      }}
                      style={{ marginTop: 6 }}
                    >
                      🔎 View on BscScan
                    </button>
                  </div>
                  <div style={{ marginTop: 10, opacity: 0.9 }}>
                    <div>✅ Top up this address with:</div>
                    <div>• <strong>USDC (BEP-20 on BSC Mainnet)</strong> — used for payouts</div>
                    <div style={{ marginLeft: 20, fontSize: '11px', color: '#aaa', marginTop: 4 }}>
                      USDC Contract: <code style={{ background: '#333', padding: '2px 6px', borderRadius: 3 }}>0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d');
                          toast.success("✅ USDC address copied");
                        }}
                        style={{ marginLeft: 8, fontSize: '10px', padding: '2px 6px' }}
                      >
                        📋
                      </button>
                      <button
                        onClick={() => window.open('https://bscscan.com/token/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', '_blank')}
                        style={{ marginLeft: 4, fontSize: '10px', padding: '2px 6px' }}
                      >
                        🔎
                      </button>
                    </div>
                    <div>• <strong>BNB</strong> — gas for transfers</div>
                  </div>
                </div>
              </div>

              <div className={styles["section"]}>
                <h3>📊 Treasury Balances</h3>
                <div style={{ fontSize: '12px', color: '#ccc' }}>
                  <div><strong>BNB:</strong> {treasuryBalances ? Number(treasuryBalances.bnb || 0).toFixed(4) : '—'}</div>
                  <div><strong>USDC:</strong> {treasuryBalances ? Number(treasuryBalances.usdc || 0).toFixed(4) : '—'}</div>
                  <div><strong>BITS:</strong> {treasuryBalances ? Number(treasuryBalances.bits || 0).toFixed(2) : '—'}</div>
                </div>
                <button onClick={refreshPayouts} disabled={loadingPayouts}>
                  {loadingPayouts ? "⏳ Refreshing..." : "🔄 Refresh"}
                </button>
              </div>

              <div className={styles["section"]}>
                <h3>🚦 USDC Daily Cap</h3>
                <div style={{ fontSize: '12px', color: '#ccc' }}>
                  <div><strong>Spent today:</strong> {usdcSpent != null ? `${Number(usdcSpent).toFixed(4)} USDC` : '—'}</div>
                  <div><strong>Cap:</strong> {usdcCap != null ? `${Number(usdcCap).toFixed(2)} USDC/day` : '—'}</div>
                  <div><strong>Remaining:</strong> {(usdcSpent != null && usdcCap != null) ? `${Math.max(0, Number(usdcCap) - Number(usdcSpent)).toFixed(4)} USDC` : '—'}</div>
                </div>
                <input
                  type="number"
                  placeholder="Set new cap (e.g. 30, 100)"
                  value={newUsdcCap}
                  onChange={(e) => setNewUsdcCap(e.target.value)}
                />
                <button onClick={handleSetUsdcCap}>
                  ✅ Update Cap
                </button>
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: 6 }}>
                  Cap is enforced globally (Telegram + Referral). If cap is reached, UI auto-switches to BITS.
                </div>
              </div>

              <div className={styles["section"]}>
                <h3>🧾 Recent Payouts (Treasury)</h3>
                <button onClick={refreshPayouts} disabled={loadingPayouts}>
                  {loadingPayouts ? "⏳ Refreshing..." : "🔄 Refresh Payouts"}
                </button>
                <div style={{
                  marginTop: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 0.9fr 0.9fr 1.2fr',
                    gap: 8,
                    padding: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.04)'
                  }}>
                    <div>Type</div>
                    <div>Wallet</div>
                    <div>Currency</div>
                    <div>Amount</div>
                    <div>Tx</div>
                  </div>
                  {(recentPayouts || []).slice(0, 50).map((p) => {
                    const w = String(p.wallet || '');
                    const shortW = w ? `${w.slice(0, 6)}...${w.slice(-4)}` : '—';
                    const tx = p.tx_hash || '';
                    const txShort = tx ? `${tx.slice(0, 10)}...` : '—';
                    const cur = String(p.payout_currency || '').toUpperCase();
                    const amt = cur === 'USDC' ? p.payout_usdc : p.payout_bits;
                    return (
                      <div key={p.id} style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 0.9fr 0.9fr 1.2fr',
                        gap: 8,
                        padding: '10px',
                        fontSize: '11px',
                        borderTop: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        <div>{p.reward_type}</div>
                        <div title={w} style={{ wordBreak: 'break-all' }}>{shortW}</div>
                        <div>{cur || '—'}</div>
                        <div>{amt != null ? Number(amt).toFixed(cur === 'USDC' ? 4 : 0) : '—'}</div>
                        <div>
                          {tx ? (
                            <a
                              href={`https://bscscan.com/tx/${tx}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#00d4ff', textDecoration: 'none' }}
                            >
                              {txShort}
                            </a>
                          ) : '—'}
                        </div>
                      </div>
                    );
                  })}
                  {(!recentPayouts || recentPayouts.length === 0) && (
                    <div style={{ padding: '10px', fontSize: '12px', opacity: 0.8 }}>
                      No treasury payouts yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Treasury Guide Modal */}
      {showTreasuryGuide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10001
        }}
        onClick={() => setShowTreasuryGuide(false)}
        >
          <div
            style={{
              background: '#10131a',
              border: '1px solid rgba(0, 255, 163, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              width: 'min(92vw, 720px)',
              maxHeight: '85vh',
              overflowY: 'auto',
              color: '#e6f5ff',
              boxShadow: '0 8px 32px rgba(0, 255, 163, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 style={{ margin: 0, color: '#00ffc3', fontSize: '16px' }}>📘 Treasury Guide (USDC/BITS Rewards)</h2>
              <button
                onClick={() => setShowTreasuryGuide(false)}
                style={{
                  background: '#ff4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ marginTop: 12, fontSize: '12px', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 800, color: '#14F195' }}>1) Where to send funds</div>
                <div>Send funds to this <strong>Treasury Address</strong> (derived from <code>BACKEND_PRIVATE_KEY</code>):</div>
                <div style={{ marginTop: 6, padding: '8px 10px', border: '1px dashed rgba(255,255,255,0.18)', borderRadius: 10, wordBreak: 'break-all' }}>
                  {treasuryAddress || '—'}
                </div>
                <div style={{ marginTop: 6, opacity: 0.95 }}>
                  <div>✅ Network: <strong>BSC Mainnet</strong></div>
                  <div>✅ Token: <strong>USDC (BEP-20)</strong> for USDC payouts</div>
                  <div style={{ marginLeft: 20, fontSize: '11px', color: '#aaa', marginTop: 4 }}>
                    Contract Address: <code style={{ background: '#333', padding: '2px 6px', borderRadius: 3 }}>0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d');
                        toast.success("✅ USDC address copied");
                      }}
                      style={{ marginLeft: 8, fontSize: '10px', padding: '2px 6px' }}
                    >
                      📋
                    </button>
                    <button
                      onClick={() => window.open('https://bscscan.com/token/0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', '_blank')}
                      style={{ marginLeft: 4, fontSize: '10px', padding: '2px 6px' }}
                    >
                      🔎
                    </button>
                  </div>
                  <div>✅ Also send: <strong>BNB</strong> (gas for every transfer)</div>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 800, color: '#14F195' }}>2) Recommended top-up amounts</div>
                <div>For smooth payouts:</div>
                <div>• BNB: <strong>0.01</strong> (gas buffer)</div>
                <div>• USDC: <strong>cap/day × 2</strong> (safe buffer)</div>
                <div style={{ opacity: 0.9, marginTop: 6 }}>
                  Example: cap = {usdcCap != null ? Number(usdcCap).toFixed(2) : '30.00'} → top-up {usdcCap != null ? (Number(usdcCap) * 2).toFixed(2) : '60.00'} USDC + 0.01 BNB
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 800, color: '#14F195' }}>3) How “automatic claim” works</div>
                <div>User goes to <strong>Rewards Hub</strong> and chooses payout currency:</div>
                <div>• Telegram Activity Reward → Claim in <strong>BITS</strong> or <strong>USDC</strong></div>
                <div>• Invite/Referral Reward → Claim in <strong>BITS</strong> or <strong>USDC</strong></div>
                <div style={{ marginTop: 6 }}>
                  Backend then:
                  <div>• Calculates pending reward server-side</div>
                  <div>• For USDC: converts using live price from <code>/api/presale/current</code> (CellManager)</div>
                  <div>• Sends tokens from treasury: <strong>USDC.transfer()</strong> or <strong>BITS.transfer()</strong></div>
                  <div>• Writes tx + snapshot into DB and updates claimed counters</div>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 800, color: '#14F195' }}>4) How to increase the 30 USDC/day cap</div>
                <div>In this tab:</div>
                <div>• Change "USDC Daily Cap" and press <strong>Update Cap</strong></div>
                <div>Cap is global (Telegram + Referral combined).</div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 800, color: '#14F195' }}>5) How to monitor payouts</div>
                <div>Use:</div>
                <div>• <strong>Treasury Balances</strong> (BNB/USDC/BITS)</div>
                <div>• <strong>Spent today / Remaining</strong></div>
                <div>• <strong>Recent Payouts</strong> (tx links to BscScan)</div>
              </div>

              <div style={{ marginBottom: 0 }}>
                <div style={{ fontWeight: 800, color: '#ffcc66' }}>Troubleshooting</div>
                <div>• If USDC cap reached, UI auto-switches to BITS.</div>
                <div>• If transfers fail: usually <strong>BNB too low</strong> or <strong>USDC insufficient</strong> in treasury.</div>
                <div>• Always top up on <strong>BSC Mainnet</strong> (wrong network = funds won’t be usable here).</div>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Email Sender Tab */}
          {activeTab === "email-sender" && (
        <div className={styles["section"]} style={{ padding: '25px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Section */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              paddingBottom: '18px',
              marginBottom: '5px',
              borderBottom: '2px solid rgba(0, 255, 163, 0.4)'
            }}>
              <h3 style={{ margin: 0, color: '#00FFA3', fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>📧 Email Sender</h3>
              <button
                onClick={async () => {
                  setNewsletterLoading(true);
                  try {
                    const response = await axios.get(`${API_URL}/api/email/admin/newsletter/subscribers`, {
                      params: { password: ADMIN_PASS, activeOnly: 'true' }
                    });
                    setNewsletterSubscribers(response.data.subscribers || []);
                    toast.success(`✅ Loaded ${response.data.count || 0} newsletter subscribers`);
                  } catch (err) {
                    console.error('❌ Failed to load newsletter subscribers:', err);
                    toast.error('❌ Failed to load newsletter subscribers: ' + (err.response?.data?.error || err.message));
                  } finally {
                    setNewsletterLoading(false);
                  }
                }}
                disabled={newsletterLoading}
                style={{
                  padding: '10px 20px',
                  background: newsletterLoading ? '#555' : 'linear-gradient(135deg, #00FFA3, #DC1FFF)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: newsletterLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  boxShadow: '0 4px 15px rgba(0, 255, 163, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                {newsletterLoading ? '⏳ Loading...' : `📋 Load Subscribers (${newsletterSubscribers.length})`}
              </button>
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
              {/* Left Column: Newsletter Subscribers */}
              <div style={{
                background: 'rgba(0, 255, 163, 0.05)',
                border: '1px solid rgba(0, 255, 163, 0.3)',
                borderRadius: '12px',
                padding: '15px',
                maxHeight: '600px',
                overflowY: 'auto'
              }}>
                <h4 style={{ margin: '0 0 18px 0', color: '#00FFA3', fontSize: '18px', fontWeight: '600', letterSpacing: '-0.3px' }}>
                  📬 Newsletter Subscribers
                </h4>
                
                {newsletterSubscribers.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#888', 
                    padding: '40px 20px',
                    fontSize: '14px'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
                    <div>No subscribers loaded yet.</div>
                    <div style={{ marginTop: '5px', fontSize: '12px' }}>
                      Click "Load Subscribers" to fetch the list.
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ 
                      marginBottom: '10px', 
                      padding: '8px 12px',
                      background: 'rgba(0, 255, 163, 0.1)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#00FFA3',
                      fontWeight: 'bold'
                    }}>
                      Total: {newsletterSubscribers.length} subscriber(s)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {newsletterSubscribers.map((sub, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            padding: '12px', 
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 255, 163, 0.1)';
                            e.currentTarget.style.borderColor = '#00FFA3';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          }}
                          onClick={() => {
                            if (!emailRecipients.includes(sub.email)) {
                              setEmailRecipients([...emailRecipients, sub.email]);
                              toast.success(`✅ Added ${sub.email} to recipients`);
                            }
                          }}
                        >
                          <div style={{ 
                            color: '#fff', 
                            fontWeight: '600',
                            fontSize: '13px',
                            marginBottom: '4px',
                            wordBreak: 'break-all'
                          }}>
                            {sub.email}
                          </div>
                          <div style={{ 
                            color: '#888', 
                            fontSize: '11px',
                            display: 'flex',
                            gap: '12px'
                          }}>
                            <span>📅 {new Date(sub.subscribed_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}</span>
                            {sub.email_count > 0 && (
                              <span>📧 {sub.email_count} sent</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {newsletterSubscribers.length > 0 && (
                      <button
                        onClick={() => {
                          setEmailRecipients(newsletterSubscribers.map(s => s.email));
                          toast.success(`✅ Added all ${newsletterSubscribers.length} subscribers to recipients`);
                        }}
                        style={{
                          marginTop: '15px',
                          width: '100%',
                          padding: '10px',
                          background: 'linear-gradient(135deg, #00FFA3, #DC1FFF)',
                          color: '#000',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          boxShadow: '0 4px 15px rgba(0, 255, 163, 0.3)'
                        }}
                      >
                        ➕ Add All to Recipients
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Right Column: Compose Email */}
              <div style={{
                background: 'rgba(220, 31, 255, 0.05)',
                border: '1px solid rgba(220, 31, 255, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#DC1FFF', fontSize: '18px', fontWeight: '600', letterSpacing: '-0.3px' }}>
                  ✉️ Compose Email
                </h4>
                
                  {/* Template Type & Quick Actions */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '220px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '13px', fontWeight: '600' }}>
                        📝 Template Type:
                      </label>
                      <select
                        value={emailTemplateType}
                        onChange={(e) => {
                          setEmailTemplateType(e.target.value);
                          if (e.target.value === 'custom') {
                            setEmailAIContent('');
                          } else {
                            setEmailContent('');
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: '#1a1a1a',
                          color: '#fff',
                          border: '2px solid #555',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'border-color 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#00FFA3'}
                        onBlur={(e) => e.target.style.borderColor = '#555'}
                      >
                        <option value="custom">📄 Custom HTML</option>
                        <option value="ai">🤖 AI Template</option>
                      </select>
                    </div>
                    <div style={{ flex: '1', minWidth: '220px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '13px', fontWeight: '600' }}>
                        ⚡ Quick Actions:
                      </label>
                      <button
                        onClick={async () => {
                          try {
                            console.log('[ADMIN PANEL] Loading PresalePage HTML...');
                            console.log('[ADMIN PANEL] API URL:', `${API_URL}/api/email/admin/generate-presale-html`);
                            console.log('[ADMIN PANEL] Password:', ADMIN_PASS ? '***' : 'MISSING');
                            
                            const response = await axios.get(`${API_URL}/api/email/admin/generate-presale-html`, {
                              params: { password: ADMIN_PASS }
                            });
                            
                            console.log('[ADMIN PANEL] Response received:', {
                              status: response.status,
                              hasData: !!response.data,
                              success: response.data?.success,
                              hasHtml: !!response.data?.html,
                              htmlLength: response.data?.html?.length,
                              hasPresaleData: !!response.data?.data
                            });
                            
                            if (response.data && response.data.success && response.data.html) {
                              setEmailContent(response.data.html);
                              const roundNumber = response.data.data?.roundNumber || 1;
                              const price = response.data.data?.price || 0.001;
                              setEmailSubject(`🚀 BitSwapDEX AI Presale - Round ${roundNumber} - Join Now!`);
                              setEmailTemplateType('custom');
                              toast.success(`✅ PresalePage HTML loaded! Round ${roundNumber}, Price: $${price.toFixed(6)}`);
                              console.log('[ADMIN PANEL] ✅ PresalePage HTML loaded successfully');
                            } else {
                              console.error('[ADMIN PANEL] ❌ Invalid response format:', response.data);
                              toast.error('❌ Invalid response format from server');
                            }
                          } catch (err) {
                            console.error('❌ [ADMIN PANEL] Failed to load PresalePage HTML:', err);
                            console.error('❌ [ADMIN PANEL] Error response:', err.response?.data);
                            console.error('❌ [ADMIN PANEL] Error status:', err.response?.status);
                            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
                            toast.error('❌ Failed to load PresalePage HTML: ' + errorMessage);
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'linear-gradient(135deg, #DC1FFF, #00FFA3)',
                          color: '#000',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          boxShadow: '0 4px 15px rgba(220, 31, 255, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(220, 31, 255, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(220, 31, 255, 0.3)';
                        }}
                      >
                        📄 Load PresalePage HTML
                      </button>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '13px', fontWeight: '600' }}>
                      📌 Subject: <span style={{ color: emailSubject ? '#00FFA3' : '#ff4444', marginLeft: '4px' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Enter email subject..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#1a1a1a',
                        color: '#fff',
                        border: `2px solid ${emailSubject ? '#00FFA3' : '#555'}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#00FFA3'}
                      onBlur={(e) => e.target.style.borderColor = emailSubject ? '#00FFA3' : '#555'}
                    />
                  </div>

                  {/* Recipients */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '13px', fontWeight: '600' }}>
                      📧 Recipients: <span style={{ color: emailRecipients.length > 0 ? '#00FFA3' : '#ff4444', marginLeft: '4px' }}>*</span>
                      {emailRecipients.length > 0 && (
                        <span style={{ 
                          marginLeft: '10px', 
                          color: '#00FFA3', 
                          fontSize: '12px',
                          fontWeight: 'normal'
                        }}>
                          ({emailRecipients.length} recipient{emailRecipients.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </label>
                    <textarea
                      value={emailRecipients.join(', ')}
                      onChange={(e) => setEmailRecipients(e.target.value.split(',').map(e => e.trim()).filter(Boolean))}
                      placeholder="email1@example.com, email2@example.com&#10;Or click on subscribers from the left panel to add them"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#1a1a1a',
                        color: '#fff',
                        border: `2px solid ${emailRecipients.length > 0 ? '#00FFA3' : '#555'}`,
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        resize: 'vertical',
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#00FFA3'}
                      onBlur={(e) => e.target.style.borderColor = emailRecipients.length > 0 ? '#00FFA3' : '#555'}
                    />
                    {emailRecipients.length > 0 && (
                      <div style={{ 
                        marginTop: '8px', 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '6px' 
                      }}>
                        {emailRecipients.map((email, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(0, 255, 163, 0.2)',
                              border: '1px solid #00FFA3',
                              borderRadius: '20px',
                              fontSize: '12px',
                              color: '#00FFA3',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <span>{email}</span>
                            <button
                              onClick={() => {
                                setEmailRecipients(emailRecipients.filter((_, i) => i !== idx));
                                toast.success(`✅ Removed ${email}`);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ff4444',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '0',
                                width: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                transition: 'background 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Content based on template type */}
                  <div>
                    {emailTemplateType === 'ai' ? (
                      <>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '13px', fontWeight: '600' }}>
                          🤖 AI Content: <span style={{ color: emailAIContent ? '#00FFA3' : '#ff4444', marginLeft: '4px' }}>*</span>
                          <span style={{ 
                            marginLeft: '10px', 
                            color: '#888', 
                            fontSize: '11px',
                            fontWeight: 'normal'
                          }}>
                            (Plain text - will be wrapped in professional template)
                          </span>
                        </label>
                        <textarea
                          value={emailAIContent}
                          onChange={(e) => setEmailAIContent(e.target.value)}
                          placeholder="Enter your email content here...&#10;&#10;This will be wrapped in a professional AI template with header and footer."
                          rows={12}
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: '#1a1a1a',
                            color: '#fff',
                            border: `2px solid ${emailAIContent ? '#00FFA3' : '#555'}`,
                            borderRadius: '8px',
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            resize: 'vertical',
                            lineHeight: '1.6',
                            transition: 'border-color 0.3s ease'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#00FFA3'}
                          onBlur={(e) => e.target.style.borderColor = emailAIContent ? '#00FFA3' : '#555'}
                        />
                      </>
                    ) : (
                      <>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '13px', fontWeight: '600' }}>
                          📄 HTML Content: <span style={{ color: emailContent ? '#00FFA3' : '#ff4444', marginLeft: '4px' }}>*</span>
                          <span style={{ 
                            marginLeft: '10px', 
                            color: '#888', 
                            fontSize: '11px',
                            fontWeight: 'normal'
                          }}>
                            (Full HTML - will be sent as-is)
                          </span>
                        </label>
                        <textarea
                          value={emailContent}
                          onChange={(e) => setEmailContent(e.target.value)}
                          placeholder="Enter HTML content here...&#10;&#10;Or use 'Load PresalePage HTML' button above to load live presale data."
                          rows={15}
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: '#1a1a1a',
                            color: '#fff',
                            border: `2px solid ${emailContent ? '#00FFA3' : '#555'}`,
                            borderRadius: '8px',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            resize: 'vertical',
                            transition: 'border-color 0.3s ease'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#00FFA3'}
                          onBlur={(e) => e.target.style.borderColor = emailContent ? '#00FFA3' : '#555'}
                        />
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    marginTop: '8px',
                    paddingTop: '18px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.12)'
                  }}>
                    <button
                      onClick={() => {
                        if (emailTemplateType === 'ai') {
                          // Generate preview for AI template
                          const preview = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
    .email-container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: linear-gradient(135deg, #00FFA3 0%, #DC1FFF 100%); padding: 30px; text-align: center; }
    .content { padding: 40px; }
    .ai-content { background: linear-gradient(135deg, rgba(0, 255, 163, 0.1) 0%, rgba(220, 31, 255, 0.1) 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #00FFA3; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 style="color: #000; margin: 0;">🚀 BITS AI</h1>
      <div style="color: #000; margin-top: 5px;">Revolutionary Cryptocurrency Platform</div>
    </div>
    <div class="content">
      <div class="ai-content">
        <h2 style="color: #00FFA3; margin-top: 0;">🤖 AI-Powered Content</h2>
        ${emailAIContent.replace(/\n/g, '<br>')}
      </div>
    </div>
  </div>
</body>
</html>`;
                          setEmailPreview(preview);
                        } else {
                          setEmailPreview(emailContent);
                        }
                        setShowEmailPreview(true);
                      }}
                      disabled={!emailSubject || (!emailContent && !emailAIContent)}
                      style={{
                        flex: 1,
                        padding: '6px 14px',
                        background: !emailSubject || (!emailContent && !emailAIContent) 
                          ? '#444' 
                          : 'linear-gradient(135deg, #555, #777)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: !emailSubject || (!emailContent && !emailAIContent) ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '12px',
                        transition: 'all 0.3s ease',
                        opacity: !emailSubject || (!emailContent && !emailAIContent) ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!(!emailSubject || (!emailContent && !emailAIContent))) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      👁️ Preview Email
                    </button>
                    
                    <button
                      onClick={async () => {
                        if (!emailSubject || (!emailContent && !emailAIContent) || emailRecipients.length === 0) {
                          toast.error('❌ Please fill all required fields: Subject, Content, and Recipients');
                          return;
                        }

                        setEmailSending(true);
                        try {
                          console.log('[ADMIN PANEL] Sending email request:', {
                            recipients: emailRecipients,
                            subject: emailSubject,
                            templateType: emailTemplateType,
                            hasContent: !!emailContent,
                            hasAIContent: !!emailAIContent
                          });

                          const requestData = {
                            password: ADMIN_PASS,
                            to: emailRecipients,
                            subject: emailSubject,
                            htmlContent: emailTemplateType === 'ai' ? null : emailContent,
                            templateType: emailTemplateType,
                            aiContent: emailTemplateType === 'ai' ? emailAIContent : null
                          };

                          console.log('[ADMIN PANEL] Request data:', {
                            ...requestData,
                            password: '***',
                            aiContent: requestData.aiContent ? requestData.aiContent.substring(0, 50) + '...' : null
                          });

                          const response = await axios.post(`${API_URL}/api/email/admin/send`, requestData);

                          console.log('[ADMIN PANEL] Response received:', response.data);

                          toast.success(`✅ Email sent to ${response.data.sent} recipient(s)`);
                          if (response.data.failed > 0) {
                            toast.warning(`⚠️ ${response.data.failed} email(s) failed`);
                            if (response.data.results) {
                              response.data.results.forEach(result => {
                                if (!result.success) {
                                  console.error(`[ADMIN PANEL] Failed for ${result.email}:`, result.error);
                                }
                              });
                            }
                          }

                          // Clear form
                          setEmailSubject('');
                          setEmailContent('');
                          setEmailAIContent('');
                          setEmailRecipients([]);
                        } catch (err) {
                          console.error('❌ [ADMIN PANEL] Failed to send email:', err);
                          console.error('❌ [ADMIN PANEL] Error response:', err.response?.data);
                          console.error('❌ [ADMIN PANEL] Error status:', err.response?.status);
                          const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message;
                          toast.error('❌ Failed to send email: ' + errorMessage);
                        } finally {
                          setEmailSending(false);
                        }
                }}
                disabled={emailSending || !emailSubject || (!emailContent && !emailAIContent) || emailRecipients.length === 0}
                style={{
                  padding: '6px 14px',
                  background: emailSending ? '#666' : '#14F195',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: emailSending ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '12px'
                }}
              >
                {emailSending ? '⏳ Sending...' : '📤 Send Email'}
              </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Round End Statistics Display */}
          {showRoundEndStats && roundEndData && (
            <RoundEndDisplay 
              roundData={roundEndData}
              onStartNewRound={handleStartNewRound}
            />
          )}
          </>
        </div>
      )}
    </div>

    {/* History Modal - Outside AdminPanel container */}
    {showHistoryModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
      }}>
        <div style={{
          background: '#1a1a1a',
          border: '2px solid #00d4ff',
          borderRadius: '12px',
          padding: '20px',
          width: '95vw',
          height: '90vh',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header with close and export buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
            paddingRight: '40px'
          }}>
            <h2 style={{ color: '#00d4ff', margin: 0 }}>📜 Round History</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => exportToTelegram()}
                style={{
                  background: '#0088cc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                📱 Export to Telegram
              </button>
              <button 
                onClick={() => exportToFile()}
                style={{
                  background: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                💾 Save as File
              </button>
            </div>
          </div>

          <button 
            onClick={() => setShowHistoryModal(false)}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: '#ff4444',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              zIndex: 10000
            }}
          >
            ✕
          </button>

          {/* Content area */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <PresaleHistory />
          </div>
        </div>
      </div>
    )}

    {/* Email Preview Modal - Outside AdminPanel container */}
    {showEmailPreview && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        padding: '20px'
      }}>
        <div style={{
          background: '#1a1a1a',
          border: '2px solid #14F195',
          borderRadius: '12px',
          padding: '20px',
          maxWidth: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <button
            onClick={() => setShowEmailPreview(false)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              padding: '6px 12px',
              background: '#ff4444',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '12px',
              zIndex: 10001
            }}
          >
            ✕ Close
          </button>
          <div 
            style={{
              marginTop: '10px',
              width: '100%',
              maxWidth: '100%',
              overflow: 'auto',
              boxSizing: 'border-box'
            }}
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(emailPreview, {
                ALLOWED_TAGS: ['p', 'div', 'span', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
                ALLOW_DATA_ATTR: false,
                ALLOW_UNKNOWN_PROTOCOLS: false
              })
            }}
          />
        </div>
      </div>
    )}
    </>
  );
};

export default AdminPanel;
