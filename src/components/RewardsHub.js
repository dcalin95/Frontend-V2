import React, { useState, useEffect, useContext } from "react";
import WalletContext from "../context/WalletContext";
import unifiedRewardsService from "../services/unifiedRewardsService";
import { ethers } from "ethers";
import { CONTRACT_MAP as CONTRACTS } from "../contract/contractMap";
import { toBitsInteger, formatBITS } from "../utils/bitsUtils";
import bitsLogo from "../assets/logo.png";
import usdcLogo from "../assets/usdc-logo.png";
import TokenInline from "./common/TokenInline";
import CosmicRewardBurst from "./common/CosmicRewardBurst";
import RealLeaderboard from "./RealLeaderboard";
import ChampionsLeaderboard from "./ChampionsLeaderboard";
import HistoryLeaderboard from "./HistoryLeaderboard";
import { getBackendUrl } from "../utils/getBackendUrl";
import { toast } from "react-toastify";
import "./RewardsHub.desktop.css";
import "./RewardsHub.mobile.css";

const RewardsHub = () => {
  // signer is still needed for AdditionalReward on-chain actions (claim/stake additional bonus)
  const { signer, walletAddress } = useContext(WalletContext);
  const [rewards, setRewards] = useState({
    totalPending: 0,
    totalClaimed: 0,
    pendingRewards: [],
    loading: true,
    error: null
  });
  const [additionalBonus, setAdditionalBonus] = useState({
    claimable: 0,
    invested: 0,
    rate: '0%',
    loading: true,
    onChainClaimable: 0
  });
  const [claiming, setClaiming] = useState(false);
  const [claimingAdditional, setClaimingAdditional] = useState(false);
  const [stakingAdditional, setStakingAdditional] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [activeTab, setActiveTab] = useState('summary');
  const [showModal, setShowModal] = useState(false);
  const [modalPayload, setModalPayload] = useState(null);
  const saveModalReceipt = () => {
    try {
      const title = String(modalPayload?.title || "Receipt").trim();
      const tx = String(modalPayload?.tx || "").trim();
      const lines = Array.isArray(modalPayload?.lines) ? modalPayload.lines : [];
      const now = new Date();
      const payload = {
        title,
        tx: tx || null,
        bscscan: tx ? `https://bscscan.com/tx/${tx}` : null,
        at: now.toISOString(),
        lines
      };
      const filenameSafe = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "receipt";
      const filename = `bitswap-${filenameSafe}-${now.getTime()}.txt`;
      const text = [
        `Title: ${payload.title}`,
        `Time: ${payload.at}`,
        payload.tx ? `Tx: ${payload.tx}` : null,
        payload.bscscan ? `BscScan: ${payload.bscscan}` : null,
        "",
        "Details:",
        ...lines.map((l) => `- ${l}`)
      ].filter(Boolean).join("\n");

      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("❌ Save failed: " + (e?.message || String(e)));
    }
  };

  const [showRealLeaderboard, setShowRealLeaderboard] = useState(false);
  const [showChampionsLeaderboard, setShowChampionsLeaderboard] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const BACKEND_URL = getBackendUrl();
  const [bitsPriceMillicents, setBitsPriceMillicents] = useState(null);
  const [telegramPayoutCurrency, setTelegramPayoutCurrency] = useState("BITS");
  const [referralPayoutCurrency, setReferralPayoutCurrency] = useState("BITS");
  const [solanaPayoutCurrency, setSolanaPayoutCurrency] = useState("BITS");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState(null);
  const [showBurst, setShowBurst] = useState(false);
  const [burstAmount, setBurstAmount] = useState(0);
  const [burstUsdc, setBurstUsdc] = useState(null);
  const [burstTitle, setBurstTitle] = useState("Reward detected ✨");

  const formatUSD = (v) => {
    const n = Number(v || 0);
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const TokenAmount = ({ value, token, dollar }) => (
    <span className="token-amount">
      <span className="token-amount-value">{value}</span>{" "}
      <TokenInline token={token} dollar={dollar} />
    </span>
  );

  const openWalletBox = () => {
    try {
      window.dispatchEvent(new CustomEvent('openWalletBox'));
    } catch (_) {}
  };

  // (Removed unused leaderboardJitterEnabled state to avoid eslint warning.)

  const fetchBitsPrice = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/presale/current`);
      if (!res.ok) return;
      const data = await res.json();
      const p = Number(data?.price);
      if (Number.isFinite(p) && p > 0) setBitsPriceMillicents(p);
    } catch (_) {}
  };

  // Inline SVGs (same neon accent as sidebar)
  const Icon = ({ name }) => {
    switch (name) {
      case 'telegram':
        return (<svg className="icon-inline" viewBox="0 0 24 24" fill="#00aaff"><path d="M2 12L22 3l-5 18-6-6-5 3 16-13-18 7z"/></svg>);
      case 'wallet':
        return (<svg className="icon-inline" viewBox="0 0 24 24" fill="#00ffc3"><path d="M3 7h16a2 2 0 012 2v6a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2zm0 2v6h16V9H3zm12 3a1 1 0 100 2 1 1 0 000-2z"/></svg>);
      case 'stake':
        return (<svg className="icon-inline" viewBox="0 0 24 24" fill="#00ffc3"><path d="M6 14v6h2v-6H6zm5-4v10h2V10h-2zm5-6v16h2V4h-2z"/></svg>);
      case 'usd':
        return (<svg className="icon-inline" viewBox="0 0 24 24" stroke="#00ffc3" fill="none" strokeWidth="2"><path d="M12 2v20M8 7c0-2 8-2 8 0s-8 2-8 4 8 2 8 4-8 2-8 0"/></svg>);
      case 'calendar':
        return (<svg className="icon-inline" viewBox="0 0 24 24" stroke="#00aaff" fill="none" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>);
      case 'tx':
        return (<svg className="icon-inline" viewBox="0 0 24 24" stroke="#00aaff" fill="none" strokeWidth="2"><path d="M10 13a5 5 0 017-7l2 2M14 11a5 5 0 01-7 7l-2-2"/></svg>);
      default:
        return null;
    }
  };

  // Load rewards data
  useEffect(() => {
    // Always fetch live BITS price for public preview / USDC estimates copy.
    fetchBitsPrice();
    if (walletAddress) {
      loadRewards();
      loadAdditionalBonus();
    }
    // We intentionally trigger on wallet changes only; functions are stable enough for this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  // Sync SOL loyalty rewards (DB-only) once per wallet connection.
  const solanaSyncRef = React.useRef({ wallet: "", at: 0 });
  useEffect(() => {
    if (!walletAddress) return;
    const w = String(walletAddress || "").toLowerCase();
    const now = Date.now();
    if (solanaSyncRef.current.wallet === w && now - solanaSyncRef.current.at < 60_000) return;
    solanaSyncRef.current = { wallet: w, at: now };
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/rewards/register-solana-loyalty`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress })
        });
        const data = await res.json().catch(() => null);
        if (data?.ok && Number(data?.added || 0) > 0) {
          console.log("✅ [RewardsHub] SOL loyalty registered:", data.added);
          await loadRewards();
        }
      } catch (e) {
        console.warn("⚠️ [RewardsHub] SOL loyalty sync failed:", e.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  // Cosmic burst when we detect pending rewards (once per page load).
  useEffect(() => {
    if (!walletAddress) return;
    if (rewards.loading) return;
    if (showBurst) return;

    const tPending = Number(rewards.telegram?.pending || 0);
    const rPending = Number(rewards.unified?.byType?.referral?.pending || 0);
    const total = tPending + rPending;
    if (!(total > 0)) return;

    const topType = tPending >= rPending ? "Telegram Activity" : "Invite / Referral";
    const topAmt = Math.max(tPending, rPending);

    setBurstTitle(`${topType} reward found`);
    setBurstAmount(toBitsInteger(topAmt));
    const est = estimateUsdc(topAmt);
    setBurstUsdc(est != null ? Number(est).toFixed(4) : null);
    setShowBurst(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, rewards.loading, rewards.telegram?.pending, rewards.unified?.byType?.referral?.pending]);

  const loadAdditionalBonus = async () => {
    try {
      console.log("🔄 [RewardsHub] Loading Additional Bonus data...");
      setAdditionalBonus(prev => ({ ...prev, loading: true }));

      const rpcUrl = "https://bsc-dataseed1.binance.org";
      const roProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const additionalRewardRO = new ethers.Contract(CONTRACTS.ADDITIONAL_REWARD.address, CONTRACTS.ADDITIONAL_REWARD.abi, roProvider);
      const nodeRO = new ethers.Contract(CONTRACTS.NODE.address, CONTRACTS.NODE.abi, roProvider);

      // Obțin investițiile din Node.sol (usdAmount este index 1 în struct)
      const purchases = await nodeRO.getUserPurchases(walletAddress);
      let totalUSD = 0;
      if (purchases && purchases.length > 0) {
        const sumUsdBN = purchases.reduce((acc, purchase) => {
          // struct PurchaseRecord { timestamp, usdAmount(1e18), bitsAmount, paymentToken, paymentSource }
          const usdAmountBN = ethers.BigNumber.from(purchase[1] || 0);
          return acc.add(usdAmountBN);
        }, ethers.BigNumber.from(0));
        totalUSD = parseFloat(ethers.utils.formatUnits(sumUsdBN, 18));
      }

      // Obțin claimable reward din AdditionalReward.sol
      const claimableReward = await additionalRewardRO.calculateClaimableReward(walletAddress);
      let claimableBITSFloat = parseFloat(ethers.utils.formatUnits(claimableReward, 18));
      let claimableBITS = toBitsInteger(claimableBITSFloat); // Convert to integer for node.sol

      // Dacă nu e claimable din contract, calculez estimativ
      let rate = "0%";
      if (claimableBITS === 0 && totalUSD > 0) {
        // Aliniază la pragurile din AdditionalReward.sol (100, 250, 500, 1000 USD)
        let estimatedRate = 0;
        if (totalUSD >= 1000) estimatedRate = 10;
        else if (totalUSD >= 500) estimatedRate = 7;
        else if (totalUSD >= 250) estimatedRate = 5;
        else if (totalUSD >= 100) estimatedRate = 3;
        
        if (estimatedRate > 0) {
          rate = `${estimatedRate}%`;
          const bonusUSD = (totalUSD * estimatedRate) / 100;
          claimableBITS = bonusUSD; // Presupun $1 per BITS
        }
      }

      setAdditionalBonus({
        claimable: claimableBITS,
        invested: totalUSD,
        rate: rate,
        loading: false,
        onChainClaimable: Math.max(0, claimableBITSFloat)
      });

      console.log("✅ [RewardsHub] Additional Bonus loaded:", {
        claimable: claimableBITS,
        invested: totalUSD,
        rate: rate
      });

    } catch (error) {
      console.error("❌ [RewardsHub] Error loading additional bonus:", error);
      setAdditionalBonus(prev => ({ ...prev, loading: false }));
    }
  };

  const loadRewards = async () => {
    try {
      console.log("🔄 RewardsHub: Loading rewards for wallet:", walletAddress);
      setRewards(prev => ({ ...prev, loading: true }));
      
      // Get unified rewards
      const unifiedData = await unifiedRewardsService.getRewardsSummary(walletAddress);
      console.log("📋 RewardsHub: Unified rewards data:", unifiedData);
      
      // Get Telegram rewards separately
      let telegramRewards = { pending: 0, claimed: 0 };
      try {
        const telegramResponse = await fetch(`${BACKEND_URL}/api/telegram-rewards/reward/${walletAddress}`);
        if (telegramResponse.ok) {
          const telegramData = await telegramResponse.json();
          console.log("💬 RewardsHub: Telegram rewards data:", telegramData);
          telegramRewards = {
            pending: telegramData.eligible && telegramData.reward > 0 ? telegramData.reward : 0,
            claimed: 0, // Telegram rewards are always pending until claimed
            timeSpent: telegramData.time_spent_hours || 0,
            messages: telegramData.messages_total || 0
          };
        }
      } catch (telegramError) {
        console.warn("⚠️ RewardsHub: Could not fetch Telegram rewards:", telegramError);
      }
      
      // Get Invite/Referral code info
      let inviteRewards = { pending: 0, claimed: 0, hasCode: false };
      try {
        const inviteResponse = await fetch(`${BACKEND_URL}/api/invite/check-code/${walletAddress}`);
        if (inviteResponse.ok) {
          const inviteData = await inviteResponse.json();
          console.log("👥 RewardsHub: Invite data:", inviteData);
          inviteRewards = {
            pending: 0, // Invite rewards come from purchases, not having a code
            claimed: 0,
            hasCode: inviteData.hasCode || false,
            code: inviteData.code || null
          };
        }
      } catch (inviteError) {
        console.warn("⚠️ RewardsHub: Could not fetch invite data:", inviteError);
      }
      
      // Combine all rewards
      const totalPending = (unifiedData.totalPending || 0) + telegramRewards.pending;
      const totalClaimed = (unifiedData.totalClaimed || 0) + telegramRewards.claimed;
      
      // Create combined pending rewards list
      const pendingRewards = [...(unifiedData.pendingRewards || [])];
      if (telegramRewards.pending > 0) {
        pendingRewards.push({
          id: 'telegram-activity',
          reward_type: 'telegram',
          amount: telegramRewards.pending,
          created_at: new Date().toISOString(),
          description: `Telegram Activity: ${telegramRewards.timeSpent}h, ${telegramRewards.messages} messages`
        });
      }
      
      console.log("✅ RewardsHub: Combined rewards calculated:", {
        totalPending,
        totalClaimed,
        pendingCount: pendingRewards.length
      });
      
      setRewards({
        wallet: walletAddress,
        totalPending,
        totalClaimed,
        pendingRewards,
        telegram: telegramRewards,
        invite: inviteRewards,
        unified: unifiedData,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("❌ RewardsHub: Error loading rewards:", error);
      setRewards(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  const parseBackendError = async (res) => {
    const rawText = await res.text().catch(() => "");
    let json;
    try { json = rawText ? JSON.parse(rawText) : {}; } catch (_) { json = null; }
    const msg = json?.error || json?.message || rawText || `HTTP ${res.status}`;
    return { msg, json };
  };

  const estimateUsdc = (bits) => {
    if (!bitsPriceMillicents) return null;
    const priceUsd = Number(bitsPriceMillicents) / 1000;
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;
    const b = Number(bits || 0);
    if (!Number.isFinite(b) || b <= 0) return 0;
    return Math.floor(b * priceUsd * 1e6) / 1e6;
  };

  const openConfirmForTelegram = async () => {
    if (!walletAddress) return;
    setStatusMsg("");
    setConfirmPayload(null);
    setShowConfirm(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/telegram-rewards/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress, payoutCurrency: telegramPayoutCurrency })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        // Fallback mode: some deployments may not have /api/telegram-rewards/quote (404 "API route not found").
        // In that case, allow claim by calling payout directly; backend will enforce caps/processing.
        const isRouteMissing = res.status === 404 || String(msg || "").toLowerCase().includes("api route not found");
        if (isRouteMissing) {
          try {
            const rr = await fetch(`${BACKEND_URL}/api/telegram-rewards/reward/${walletAddress}`);
            const rd = await rr.json().catch(() => null);
            const pendingBits = Math.floor(Number(rd?.reward || 0));
            const lines = [
              `Wallet: ${walletAddress}`,
              `Reward: ${toBitsInteger(pendingBits)} $BITS`,
              telegramPayoutCurrency === "USDC"
                ? `Estimated payout: ${estimateUsdc(pendingBits) ?? 0} USDC (live price at claim)`
                : `Payout: ${toBitsInteger(pendingBits)} $BITS`,
              "Status: Fallback mode (quote endpoint unavailable). Claim will still work; backend validates caps/processing."
            ].filter(Boolean);
            setConfirmPayload({
              ok: true,
              kind: "telegram",
              title: "Confirm Telegram Claim (fallback)",
              lines,
              canPay: pendingBits > 0
            });
            return;
          } catch (e) {
            setConfirmPayload({ ok: false, title: "Telegram Claim (fallback failed)", lines: [e.message], canPay: false });
            return;
          }
        }

        setConfirmPayload({ ok: false, title: "Telegram Claim (pre-check failed)", lines: [msg], canPay: false });
        return;
      }
      const lines = [
        `Wallet: ${walletAddress}`,
        `Reward: ${toBitsInteger(Number(data.pending_bits || 0))} $BITS`,
        telegramPayoutCurrency === "USDC"
          ? `Estimated payout: ${Number(data.payout_usdc || data.payout_usdt || 0)} USDC (rate: $${(Number(data.price_millicents || 0) / 1000).toFixed(6)} / BITS)`
          : `Payout: ${toBitsInteger(Number(data.pending_bits || 0))} $BITS`,
        telegramPayoutCurrency === "USDC"
          ? `USDC cap: ${Number(data.usdc_spent_today || data.usdt_spent_today || 0)} / ${Number(data.usdc_daily_cap || data.usdt_daily_cap || 0)} spent today`
          : null,
        data?.reason ? `Status: ${data.reason}` : "Status: OK"
      ].filter(Boolean);
      setConfirmPayload({
        ok: true,
        kind: "telegram",
        title: "Confirm Telegram Claim",
        lines,
        canPay: !!data.canPay
      });
    } catch (e) {
      setConfirmPayload({ ok: false, title: "Telegram Claim (pre-check error)", lines: [e.message], canPay: false });
    }
  };

  const executeTelegramPayout = async () => {
    if (!walletAddress) return;
    setClaiming(true);
    setStatusMsg(`⏳ Paying Telegram rewards in ${telegramPayoutCurrency}...`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/telegram-rewards/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress, payoutCurrency: telegramPayoutCurrency })
      });
      if (!res.ok) {
        const { msg, json } = await parseBackendError(res);
        if (res.status === 403 && (msg || "").toLowerCase().includes("cap")) {
          setTelegramPayoutCurrency("BITS");
          setStatusMsg(`⚠️ USDC daily cap reached. Switched to BITS — please claim again.`);
        } else {
          setStatusMsg(`❌ Telegram payout failed: ${msg}`);
        }
        console.warn("[RewardsHub] telegram payout failed", res.status, json || msg);
        return;
      }
      const data = await res.json();
      const paidBits = Number(data?.payout_bits || 0);
      const paidUsdc = data?.payout_usdc || data?.payout_usdt;
      setStatusMsg(`✅ Telegram payout sent. Tx: ${(data?.tx_hash || "").slice(0, 10)}…`);
      setModalPayload({
        title: "Telegram Payout Successful",
        lines: [
          `Payout: ${telegramPayoutCurrency === "USDC" ? `${paidUsdc} USDC` : `${toBitsInteger(paidBits)} $BITS`}`,
          telegramPayoutCurrency === "USDC" && data?.price_millicents ? `Rate: $${(Number(data.price_millicents) / 1000).toFixed(6)} per BITS` : null,
          `Tx: ${data?.tx_hash}`
        ].filter(Boolean),
        tx: data?.tx_hash
      });
      setShowModal(true);
      await loadRewards();
    } catch (e) {
      setStatusMsg(`❌ Telegram payout error: ${e.message}`);
    } finally {
      setClaiming(false);
    }
  };

  const openConfirmForReferral = async () => {
    if (!walletAddress) return;
    setStatusMsg("");
    setConfirmPayload(null);
    setShowConfirm(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rewards/quote-referral`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress, payoutCurrency: referralPayoutCurrency })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        setConfirmPayload({ ok: false, title: "Referral Claim (pre-check failed)", lines: [msg], canPay: false });
        return;
      }
      const lines = [
        `Wallet: ${walletAddress}`,
        `Reward: ${toBitsInteger(Number(data.pending_bits || 0))} $BITS`,
        referralPayoutCurrency === "USDC"
          ? `Estimated payout: ${Number(data.payout_usdc || data.payout_usdt || 0)} USDC (rate: $${(Number(data.price_millicents || 0) / 1000).toFixed(6)} / BITS)`
          : `Payout: ${toBitsInteger(Number(data.pending_bits || 0))} $BITS`,
        referralPayoutCurrency === "USDC"
          ? `USDC cap: ${Number(data.usdc_spent_today || data.usdt_spent_today || 0)} / ${Number(data.usdc_daily_cap || data.usdt_daily_cap || 0)} spent today`
          : null,
        data?.reason ? `Status: ${data.reason}` : "Status: OK"
      ].filter(Boolean);
      setConfirmPayload({
        ok: true,
        kind: "referral",
        title: "Confirm Referral Claim",
        lines,
        canPay: !!data.canPay
      });
    } catch (e) {
      setConfirmPayload({ ok: false, title: "Referral Claim (pre-check error)", lines: [e.message], canPay: false });
    }
  };

  const openConfirmForSolana = async () => {
    if (!walletAddress) return;
    setStatusMsg("");
    setConfirmPayload(null);
    setShowConfirm(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rewards/quote-solana-loyalty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress, payoutCurrency: solanaPayoutCurrency })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        setConfirmPayload({ ok: false, title: "SOL Loyalty Claim (pre-check failed)", lines: [msg], canPay: false });
        return;
      }
      const lines = [
        `Wallet: ${walletAddress}`,
        `Reward: ${toBitsInteger(Number(data.pending_bits || 0))} $BITS`,
        solanaPayoutCurrency === "USDC"
          ? `Estimated payout: ${Number(data.payout_usdc || data.payout_usdt || 0)} USDC (rate: $${(Number(data.price_millicents || 0) / 1000).toFixed(6)} / BITS)`
          : `Payout: ${toBitsInteger(Number(data.pending_bits || 0))} $BITS`,
        solanaPayoutCurrency === "USDC"
          ? `USDC cap: ${Number(data.usdc_spent_today || data.usdt_spent_today || 0)} / ${Number(data.usdc_daily_cap || data.usdt_daily_cap || 0)} spent today`
          : null,
        data?.reason ? `Status: ${data.reason}` : "Status: OK"
      ].filter(Boolean);
      setConfirmPayload({
        ok: true,
        kind: "solana_loyalty",
        title: "Confirm SOL Loyalty Claim",
        lines,
        canPay: !!data.canPay
      });
    } catch (e) {
      setConfirmPayload({ ok: false, title: "SOL Loyalty Claim (pre-check error)", lines: [e.message], canPay: false });
    }
  };

  const executeSolanaPayout = async () => {
    if (!walletAddress) return;
    setClaiming(true);
    setStatusMsg(`⏳ Paying SOL loyalty rewards in ${solanaPayoutCurrency}...`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rewards/payout-solana-loyalty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress, payoutCurrency: solanaPayoutCurrency })
      });
      if (!res.ok) {
        const { msg, json } = await parseBackendError(res);
        if (res.status === 403 && (msg || "").toLowerCase().includes("cap")) {
          setSolanaPayoutCurrency("BITS");
          setStatusMsg(`⚠️ USDC daily cap reached. Switched to BITS — please claim again.`);
        } else {
          setStatusMsg(`❌ SOL loyalty payout failed: ${msg}`);
        }
        console.warn("[RewardsHub] solana loyalty payout failed", res.status, json || msg);
        return;
      }
      const data = await res.json();
      const paidBits = Number(data?.payout_bits || 0);
      const paidUsdc = data?.payout_usdc || data?.payout_usdt;
      setStatusMsg(`✅ SOL loyalty payout sent. Tx: ${(data?.tx_hash || "").slice(0, 10)}…`);
      setModalPayload({
        title: "SOL Loyalty Payout Successful",
        lines: [
          `Payout: ${solanaPayoutCurrency === "USDC" ? `${paidUsdc} USDC` : `${toBitsInteger(paidBits)} $BITS`}`,
          solanaPayoutCurrency === "USDC" && data?.price_millicents ? `Rate: $${(Number(data.price_millicents) / 1000).toFixed(6)} per BITS` : null,
          `Tx: ${data?.tx_hash}`
        ].filter(Boolean),
        tx: data?.tx_hash
      });
      setShowModal(true);
      await loadRewards();
    } catch (e) {
      setStatusMsg(`❌ SOL loyalty payout error: ${e.message}`);
    } finally {
      setClaiming(false);
    }
  };

  const executeReferralPayout = async () => {
    if (!walletAddress) return;
    setClaiming(true);
    setStatusMsg(`⏳ Paying referral rewards in ${referralPayoutCurrency}...`);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rewards/payout-referral`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress, payoutCurrency: referralPayoutCurrency })
      });
      if (!res.ok) {
        const { msg, json } = await parseBackendError(res);
        if (res.status === 403 && (msg || "").toLowerCase().includes("cap")) {
          setReferralPayoutCurrency("BITS");
          setStatusMsg(`⚠️ USDC daily cap reached. Switched to BITS — please claim again.`);
        } else {
          setStatusMsg(`❌ Referral payout failed: ${msg}`);
        }
        console.warn("[RewardsHub] referral payout failed", res.status, json || msg);
        return;
      }
      const data = await res.json();
      const paidBits = Number(data?.payout_bits || 0);
      const paidUsdc = data?.payout_usdc || data?.payout_usdt;
      setStatusMsg(`✅ Referral payout sent. Tx: ${(data?.tx_hash || "").slice(0, 10)}…`);
      setModalPayload({
        title: "Referral Payout Successful",
        lines: [
          `Payout: ${referralPayoutCurrency === "USDC" ? `${paidUsdc} USDC` : `${toBitsInteger(paidBits)} $BITS`}`,
          referralPayoutCurrency === "USDC" && data?.price_millicents ? `Rate: $${(Number(data.price_millicents) / 1000).toFixed(6)} per BITS` : null,
          `Tx: ${data?.tx_hash}`
        ].filter(Boolean),
        tx: data?.tx_hash
      });
      setShowModal(true);
      await loadRewards();
    } catch (e) {
      setStatusMsg(`❌ Referral payout error: ${e.message}`);
    } finally {
      setClaiming(false);
    }
  };

  const handleClaimAdditionalBonus = async () => {
    // AdditionalReward still requires signer (user tx). Leave as-is.
    // This feature is separate from Telegram/Invite treasury payouts.
    if (!signer || additionalBonus.claimable <= 0) return;

    setClaimingAdditional(true);
    setStatusMsg("🔄 Claiming Additional Bonus...");

    try {
      if (!additionalBonus.onChainClaimable || additionalBonus.onChainClaimable <= 0) {
        setStatusMsg("❌ No on-chain claimable bonus yet. The displayed amount is an estimate; claim will be enabled when eligible.");
        return;
      }
      const additionalRewardContract = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      const tx = await additionalRewardContract.claimReward();
      console.log("📤 [RewardsHub] Claim transaction sent:", tx.hash);
      
      setStatusMsg("⏳ Transaction submitted, waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("✅ [RewardsHub] Claim transaction confirmed:", receipt);
      
      setStatusMsg("🎉 Additional Bonus claimed successfully!");
      
      // 📢 TELEGRAM NOTIFICATION - Additional Bonus Claim
      const { sendTelegramNotification } = await import('../utils/telegramNotify');
      const claimedAmount = parseFloat(formatBITS(additionalBonus.onChainClaimable)).toFixed(2);
      await sendTelegramNotification({
        type: 'rewards_claim',
        status: 'success',
        network: 'BSC',
        wallet: walletAddress,
        amount: `${claimedAmount} BITS`,
        txHash: receipt.transactionHash,
        details: `Claimed ${claimedAmount} BITS Additional Bonus from Rewards Hub`
      });
      
      // Refresh data
      await loadAdditionalBonus();
      
    } catch (error) {
      console.error("❌ [RewardsHub] Additional Bonus claim error:", error);
      
      if (error.code === 4001) {
        setStatusMsg("❌ Transaction cancelled by user");
      } else if (error.message.includes("insufficient funds")) {
        setStatusMsg("❌ Insufficient BNB for gas fees");
      } else if (error.message.includes("No claimable")) {
        setStatusMsg("❌ No claimable rewards available");
      } else {
        setStatusMsg("❌ Error claiming bonus: " + error.message);
      }
    } finally {
      setClaimingAdditional(false);
      setTimeout(() => setStatusMsg(""), 5000);
    }
  };

  const handleStakeAdditionalBonus = async () => {
    if (!signer || additionalBonus.claimable <= 0) return;

    setStakingAdditional(true);
    setStatusMsg("🔄 Claiming and staking Additional Bonus...");

    try {
      if (!additionalBonus.onChainClaimable || additionalBonus.onChainClaimable <= 0) {
        setStatusMsg("❌ No on-chain claimable bonus yet. The displayed amount is an estimate; staking will be enabled when eligible.");
        return;
      }
      const additionalRewardContract = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      // First claim the additional bonus
      const tx = await additionalRewardContract.claimReward();
      console.log("📤 [RewardsHub] Additional Bonus claim transaction sent:", tx.hash);
      
      setStatusMsg("⏳ Claiming Additional Bonus, waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log("✅ [RewardsHub] Additional Bonus claim confirmed:", receipt);
      
      // 📢 TELEGRAM NOTIFICATION - Additional Bonus Claim (before staking)
      const { sendTelegramNotification } = await import('../utils/telegramNotify');
      const claimedAmount = parseFloat(formatBITS(additionalBonus.onChainClaimable)).toFixed(2);
      await sendTelegramNotification({
        type: 'rewards_claim',
        status: 'success',
        network: 'BSC',
        wallet: walletAddress,
        amount: `${claimedAmount} BITS`,
        txHash: receipt.transactionHash,
        details: `Claimed ${claimedAmount} BITS Additional Bonus - Auto-staking...`
      });
      
      // Then redirect to staking with the claimed amount  
      const claimedAmountInt = toBitsInteger(additionalBonus.claimable);
      setStatusMsg(`✅ Claimed ${claimedAmountInt} $BITS! Redirecting to staking...`);
      
      // Refresh data
      await loadAdditionalBonus();
      
      // Redirect to staking page with pre-filled amount
      setTimeout(() => {
        window.location.href = `/staking?amount=${claimedAmount}&source=additional-bonus`;
      }, 2000);
      
    } catch (error) {
      console.error("❌ [RewardsHub] Additional Bonus stake error:", error);
      
      if (error.code === 4001) {
        setStatusMsg("❌ Transaction cancelled by user");
      } else if (error.message.includes("insufficient funds")) {
        setStatusMsg("❌ Insufficient BNB for gas fees");
      } else if (error.message.includes("No claimable")) {
        setStatusMsg("❌ No claimable rewards available");
      } else {
        setStatusMsg("❌ Error staking bonus: " + error.message);
      }
    } finally {
      setStakingAdditional(false);
      setTimeout(() => setStatusMsg(""), 5000);
    }
  };

  // (removed unused legacy helpers: stake-all flow + inline history renderer)

  return (
    <div className="rewards-hub">
      <CosmicRewardBurst
        open={showBurst}
        onClose={() => setShowBurst(false)}
        amount={burstAmount}
        token="BITS"
        secondaryAmount={burstUsdc}
        secondaryToken="USDC"
        title={burstTitle}
        subtitle="Rewards detected. Open the claim section to send to your wallet (choose BITS or USDC)."
        autoCloseMs={6500}
      />
      <div className="hub-container">
        <div className="hub-header">
          <div className="hub-brand">
            <img className="hub-logo" src={bitsLogo} alt="BITS Logo" />
            <div className="hub-title-wrap">
              <h1 className="hub-title">Rewards Hub</h1>
              <div className="hub-badges">
                <span className="hub-badge hub-badge-usdc" title="A rare presale feature: instant USDC payouts from treasury">
                  <img className="badge-icon" src={usdcLogo} alt="USDC" />
                  USDC payout (new)
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="hub-subtitle">
          {walletAddress
            ? "Claim your rewards directly to wallet or stake them for additional yield"
            : "Preview the active reward programs. Connect wallet only when you want to claim."}
        </p>

        <div className="tabs">
          <button onClick={()=>setActiveTab('summary')} className={`tab-btn ${activeTab==='summary' ? 'active' : ''}`}>📊 Summary</button>
          {walletAddress && (
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="tab-btn"
              title="Open claim history"
            >
              🧾 History
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowChampionsLeaderboard(true)}
            className="tab-btn"
            title="Open Champions Leaderboard"
          >
            🏆 Champions
          </button>
        </div>

        <div style={{display: activeTab==='summary' ? 'block' : 'none'}}>

        {/* Rewards Summary */}
        <div className="rewards-summary-card">
          <h2>💰 Your Rewards Summary</h2>
          
          {!walletAddress ? (
            <div className="public-preview">
              <div className="public-preview-title">✅ Rewards are LIVE</div>
              <div className="public-preview-body">
                Connect wallet to see your personal amounts and claim instantly.
              </div>
              <div className="public-preview-cta">
                <button className="connect-cta-btn" type="button" onClick={openWalletBox}>
                  🔌 Connect Wallet
                </button>
                <div className="connect-cta-hint">
                  No auto-saving wallets. You control connections.
                </div>
              </div>
              <div className="public-preview-grid">
                <div className="public-preview-card">
                  <div className="public-preview-card-title">💬 Telegram Activity Reward</div>
                  <div className="public-preview-card-desc">
                    Earn rewards for activity inside the Telegram group (time + messages).
                  </div>
                </div>
                <div className="public-preview-card">
                  <div className="public-preview-card-title">👥 Invite / Referral Reward</div>
                  <div className="public-preview-card-desc">
                    Earn rewards when people you invite buy BITS.
                  </div>
                </div>
              </div>
            </div>
          ) : rewards.loading ? (
            <div className="loading-state">
              <p>⏳ Loading your rewards...</p>
            </div>
          ) : rewards.error ? (
            <div className="error-state">
              <p>⚠️ Error: {rewards.error}</p>
              <button onClick={loadRewards} className="retry-btn">🔄 Retry</button>
            </div>
          ) : (
            <>
              <div className="summary-stats">
                <div className="stat-card">
                  <h3>💎 Total Pending</h3>
                  <p className="stat-value">{Math.round(rewards.totalPending)} $BITS</p>
                </div>
                <div className="stat-card">
                  <h3>✅ Total Claimed</h3>
                  <p className="stat-value">{Math.round(rewards.totalClaimed)} $BITS</p>
                </div>
                <div className="stat-card">
                  <h3>📋 Pending Count</h3>
                  <p className="stat-value">{rewards.pendingRewards.length} rewards</p>
                </div>
              </div>

              {/* Additional Bonus Section */}
              <div className="additional-bonus-section">
                <h3>🎁 Additional Investment Bonus</h3>
                {additionalBonus.loading ? (
                  <div className="loading-state">
                    <p>⏳ Loading bonus data...</p>
                  </div>
                ) : (
                  <div className="bonus-card">
                    <div className="bonus-stats">
                      <div className="bonus-stat">
                        <span className="bonus-label"><span className="icon icon-wallet"/>Available Bonus</span>
                        <span className="bonus-value">{formatBITS(additionalBonus.claimable)}</span>
                      </div>
                      <div className="bonus-stat">
                        <span className="bonus-label"><span className="icon icon-usd"/>Total Invested</span>
                        <span className="bonus-value">{formatUSD(additionalBonus.invested)}</span>
                      </div>
                      <div className="bonus-stat">
                        <span className="bonus-label"><span className="icon icon-stake"/>Bonus Rate</span>
                        <span className="bonus-value">{additionalBonus.rate}</span>
                      </div>
                    </div>
                    
                    {additionalBonus.claimable > 0 && (
                      <div className="bonus-actions">
                        <button
                          onClick={handleClaimAdditionalBonus}
                          disabled={claimingAdditional || stakingAdditional}
                          className="action-btn claim-btn"
                        >
                          {claimingAdditional ? "⏳ Claiming..." : "💳 Claim to Wallet"}
                          <span className="btn-subtitle">Receive {toBitsInteger(additionalBonus.claimable)} $BITS directly</span>
                        </button>
                        
                        <button
                          onClick={handleStakeAdditionalBonus}
                          disabled={claimingAdditional || stakingAdditional}
                          className="action-btn stake-btn"
                        >
                          {stakingAdditional ? "🔄 Processing..." : "🏦 Claim & Stake"}
                          <span className="btn-subtitle">Auto-stake for additional yield</span>
                        </button>
                      </div>
                    )}
                    
                    <div className="bonus-info">
                      <p>💡 How it works: Bonuses are based on your total USD invested (tracked on-chain).</p>
                      <p>📈 Milestones: $100 → 3%, $250 → 5%, $500 → 7%, $1,000 → 10% of invested USD, paid in $BITS.</p>
                      <p>🔓 A bonus becomes claimable only when you cross a new milestone. You can claim to wallet or stake directly.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Rewards List */}
              <div className="pending-rewards-section">
                <h3><span className="icon icon-calendar"/>Pending Rewards</h3>
                <div className="rewards-list">
                  {rewards.pendingRewards.map((reward) => (
                    <div key={reward.id} className="reward-item">
                      <div className="reward-info">
                        <span className="reward-type">
                          {reward.reward_type === 'telegram' ? '💬' : 
                           reward.reward_type === 'referral' ? '👥' :
                           reward.reward_type === 'solana_loyalty' ? '🟣' : '🎁'} 
                          {reward.reward_type.charAt(0).toUpperCase() + reward.reward_type.slice(1)}
                        </span>
                        <span className="reward-amount">
                          <TokenAmount value={toBitsInteger(reward.amount)} token="BITS" dollar />
                        </span>
                      </div>
                      <div className="reward-date">
                        {new Date(reward.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-section">
                <h3>🚀 Claim your rewards (choose BITS or USDC)</h3>
                <div className="usdc-callout">
                  <div className="usdc-callout-title">
                    <img className="badge-icon" src={usdcLogo} alt="USDC" />
                    USDC payout during presale
                  </div>
                  <div className="usdc-callout-body">
                    <div className="usdc-callout-lead">
                      Choose payout <strong>per reward</strong>:
                      <span className="pill pill-usdc">
                        <img className="pill-icon" src={usdcLogo} alt="USDC" /> USDC
                      </span>
                      <span className="pill pill-bits">
                        <img className="pill-icon" src={bitsLogo} alt="BITS" /> $BITS
                      </span>
                    </div>

                    <ul className="usdc-callout-list">
                      <li><strong>USDC:</strong> paid instantly from treasury, using CellManager live price at claim (fixed snapshot).</li>
                      <li><strong>$BITS:</strong> always available; value can increase over time (not guaranteed).</li>
                      <li><strong>Limits:</strong> USDC depends on daily cap + treasury balance.</li>
                    </ul>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowChampionsLeaderboard(true)}
                    title="Open Champions Leaderboard"
                  >
                    🏆 Champions Leaderboard
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowRealLeaderboard(true)}
                    title="Open the live leaderboard (from backend reward logs)"
                  >
                    📈 View Live Leaderboard
                  </button>
                </div>

                <div className="payout-grid">
                  <div className={`payout-card ${telegramPayoutCurrency === "USDC" ? "payout-card-usdc" : ""}`}>
                    <h4>💬 Telegram Activity Reward</h4>
                    <div className="payout-row">
                      <div className="payout-amount">
                        {walletAddress ? (
                          <TokenAmount value={toBitsInteger(rewards.telegram?.pending || 0)} token="BITS" dollar />
                        ) : (
                          "Connect wallet to see your amount"
                        )}
                      </div>
                      <div className="payout-estimate">
                        {!walletAddress ? (
                          bitsPriceMillicents ? (
                            <span className="live-rate">
                              Live rate: <strong>${(Number(bitsPriceMillicents) / 1000).toFixed(6)}</strong> /{" "}
                              <TokenInline token="BITS" />
                            </span>
                          ) : ""
                        ) : telegramPayoutCurrency === "USDC"
                          ? (estimateUsdc(rewards.telegram?.pending) != null ? (
                              <span className="estimate">
                                ≈ <strong>{estimateUsdc(rewards.telegram?.pending)}</strong> <TokenInline token="USDC" />
                              </span>
                            ) : (
                              <span className="estimate">
                                ≈ <TokenInline token="USDC" /> (loading price...)
                              </span>
                            ))
                          : (bitsPriceMillicents ? `≈ ${formatUSD((Number(bitsPriceMillicents) / 1000) * Number(rewards.telegram?.pending || 0))}` : "")}
                      </div>
                    </div>
                    <div className="payout-controls">
                      <div className="payout-toggle" aria-label="Telegram payout currency">
                        <button
                          type="button"
                          className={`payout-toggle-btn ${telegramPayoutCurrency === "BITS" ? "active" : ""}`}
                          onClick={() => setTelegramPayoutCurrency("BITS")}
                          disabled={!walletAddress}
                          title="Claim in BITS"
                        >
                          <img className="toggle-icon" src={bitsLogo} alt="BITS" />
                          BITS
                        </button>
                        <button
                          type="button"
                          className={`payout-toggle-btn usdc ${telegramPayoutCurrency === "USDC" ? "active" : ""}`}
                          onClick={() => setTelegramPayoutCurrency("USDC")}
                          disabled={!walletAddress}
                          title="Claim in USDC"
                        >
                          <img className="toggle-icon" src={usdcLogo} alt="USDC" />
                          USDC
                        </button>
                      </div>
                      <button
                        className="action-btn claim-btn"
                        disabled={!walletAddress || claiming || (Number(rewards.telegram?.pending || 0) <= 0)}
                        onClick={openConfirmForTelegram}
                      >
                        {!walletAddress ? "Connect wallet to claim" : (claiming ? "⏳ Processing..." : "Claim")}
                      </button>
                    </div>
                    <div className="payout-help">Paid instantly from treasury. USDC is limited daily.</div>
                  </div>

                  <div className={`payout-card ${referralPayoutCurrency === "USDC" ? "payout-card-usdc" : ""}`}>
                    <h4>👥 Invite / Referral Reward</h4>
                    <div className="payout-row">
                      <div className="payout-amount">
                        {walletAddress ? (
                          <TokenAmount value={toBitsInteger(rewards.unified?.byType?.referral?.pending || 0)} token="BITS" dollar />
                        ) : (
                          "Connect wallet to see your amount"
                        )}
                      </div>
                      <div className="payout-estimate">
                        {!walletAddress ? (
                          bitsPriceMillicents ? (
                            <span className="live-rate">
                              Live rate: <strong>${(Number(bitsPriceMillicents) / 1000).toFixed(6)}</strong> /{" "}
                              <TokenInline token="BITS" />
                            </span>
                          ) : ""
                        ) : referralPayoutCurrency === "USDC"
                          ? (estimateUsdc(rewards.unified?.byType?.referral?.pending) != null ? (
                              <span className="estimate">
                                ≈ <strong>{estimateUsdc(rewards.unified?.byType?.referral?.pending)}</strong> <TokenInline token="USDC" />
                              </span>
                            ) : (
                              <span className="estimate">
                                ≈ <TokenInline token="USDC" /> (loading price...)
                              </span>
                            ))
                          : (bitsPriceMillicents ? `≈ ${formatUSD((Number(bitsPriceMillicents) / 1000) * Number(rewards.unified?.byType?.referral?.pending || 0))}` : "")}
                      </div>
                    </div>
                    <div className="payout-controls">
                      <div className="payout-toggle" aria-label="Referral payout currency">
                        <button
                          type="button"
                          className={`payout-toggle-btn ${referralPayoutCurrency === "BITS" ? "active" : ""}`}
                          onClick={() => setReferralPayoutCurrency("BITS")}
                          disabled={!walletAddress}
                          title="Claim in BITS"
                        >
                          <img className="toggle-icon" src={bitsLogo} alt="BITS" />
                          BITS
                        </button>
                        <button
                          type="button"
                          className={`payout-toggle-btn usdc ${referralPayoutCurrency === "USDC" ? "active" : ""}`}
                          onClick={() => setReferralPayoutCurrency("USDC")}
                          disabled={!walletAddress}
                          title="Claim in USDC"
                        >
                          <img className="toggle-icon" src={usdcLogo} alt="USDC" />
                          USDC
                        </button>
                      </div>
                      <button
                        className="action-btn claim-btn"
                        disabled={!walletAddress || claiming || (Number(rewards.unified?.byType?.referral?.pending || 0) <= 0)}
                        onClick={openConfirmForReferral}
                      >
                        {!walletAddress ? "Connect wallet to claim" : (claiming ? "⏳ Processing..." : "Claim")}
                      </button>
                    </div>
                    <div className="payout-help">Referral rewards are earned from invite purchases.</div>
                  </div>

                  <div className={`payout-card ${solanaPayoutCurrency === "USDC" ? "payout-card-usdc" : ""}`}>
                    <h4>🟣 SOL Loyalty Reward</h4>
                    <div className="payout-row">
                      <div className="payout-amount">
                        {walletAddress ? (
                          <TokenAmount value={toBitsInteger(rewards.unified?.byType?.solana_loyalty?.pending || 0)} token="BITS" dollar />
                        ) : (
                          "Connect wallet to see your amount"
                        )}
                      </div>
                      <div className="payout-estimate">
                        {!walletAddress ? (
                          bitsPriceMillicents ? (
                            <span className="live-rate">
                              Live rate: <strong>${(Number(bitsPriceMillicents) / 1000).toFixed(6)}</strong> /{" "}
                              <TokenInline token="BITS" />
                            </span>
                          ) : ""
                        ) : solanaPayoutCurrency === "USDC"
                          ? (estimateUsdc(rewards.unified?.byType?.solana_loyalty?.pending) != null ? (
                              <span className="estimate">
                                ≈ <strong>{estimateUsdc(rewards.unified?.byType?.solana_loyalty?.pending)}</strong> <TokenInline token="USDC" />
                              </span>
                            ) : (
                              <span className="estimate">
                                ≈ <TokenInline token="USDC" /> (loading price...)
                              </span>
                            ))
                          : (bitsPriceMillicents ? `≈ ${formatUSD((Number(bitsPriceMillicents) / 1000) * Number(rewards.unified?.byType?.solana_loyalty?.pending || 0))}` : "")}
                      </div>
                    </div>
                    <div className="payout-controls">
                      <div className="payout-toggle" aria-label="SOL loyalty payout currency">
                        <button
                          type="button"
                          className={`payout-toggle-btn ${solanaPayoutCurrency === "BITS" ? "active" : ""}`}
                          onClick={() => setSolanaPayoutCurrency("BITS")}
                          disabled={!walletAddress}
                          title="Claim in BITS"
                        >
                          <img className="toggle-icon" src={bitsLogo} alt="BITS" />
                          BITS
                        </button>
                        <button
                          type="button"
                          className={`payout-toggle-btn usdc ${solanaPayoutCurrency === "USDC" ? "active" : ""}`}
                          onClick={() => setSolanaPayoutCurrency("USDC")}
                          disabled={!walletAddress}
                          title="Claim in USDC"
                        >
                          <img className="toggle-icon" src={usdcLogo} alt="USDC" />
                          USDC
                        </button>
                      </div>
                      <button
                        className="action-btn claim-btn"
                        disabled={!walletAddress || claiming || (Number(rewards.unified?.byType?.solana_loyalty?.pending || 0) <= 0)}
                        onClick={openConfirmForSolana}
                      >
                        {!walletAddress ? "Connect wallet to claim" : (claiming ? "⏳ Processing..." : "Claim")}
                      </button>
                    </div>
                    <div className="payout-help">SOL loyalty rewards are derived from confirmed SOL buys and paid from treasury.</div>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {statusMsg && (
                <div className="status-message">
                  <p>{statusMsg}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Additional Info */}
        <div className="info-section">
          <h3>ℹ️ How it works</h3>
          <div className="info-grid">
            <div className="info-card">
              <h4>💳 Claim to Wallet</h4>
              <p>Receive your $BITS directly in your connected wallet. Available immediately for trading, transfers, or <strong>you can stake them later</strong> from the <a href="/staking" style={{ color: "#00ffc3" }}>Staking page</a>.</p>
            </div>
            <div className="info-card">
              <h4>🏦 Claim & Stake</h4>
              <p>Automatically stake your claimed rewards to earn additional yield. Higher rewards but with lock-up period. This is the <strong>fastest way to start earning</strong>.</p>
            </div>
            <div className="info-card">
              <h4>🔄 Flexibility</h4>
              <p><strong>Important:</strong> $BITS can always be staked! You can claim now and stake later, or stake other $BITS you already own. <a href="/staking" style={{ color: "#00aaff" }}>Visit Staking →</a></p>
            </div>
          </div>
        </div>
        </div>
      </div>
      {/* History is now a modal (same UX as leaderboards) */}
      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <h3>{modalPayload?.title || 'Info'}</h3>
            <ul>
              {(modalPayload?.lines||[]).map((l,idx)=>(<li key={idx}>{l}</li>))}
            </ul>
            {modalPayload?.tx && (
              <a className="tx-link" href={`https://bscscan.com/tx/${modalPayload.tx}`} target="_blank" rel="noreferrer"><Icon name="tx"/> View on BscScan</a>
            )}
            <div className="modal-actions">
              <button className="action-btn" onClick={saveModalReceipt} disabled={!modalPayload}>
                💾 Save
              </button>
              <button className="action-btn claim-btn" onClick={()=>setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showRealLeaderboard && (
        <div className="modal-overlay" onClick={() => setShowRealLeaderboard(false)}>
          <div className="modal lb-modal" onClick={(e) => e.stopPropagation()}>
            <RealLeaderboard limit={25} />
            <button className="action-btn claim-btn" onClick={() => setShowRealLeaderboard(false)} style={{ marginTop: 12 }}>
              Close
            </button>
          </div>
        </div>
      )}

      {showChampionsLeaderboard && (
        <div className="modal-overlay" onClick={() => setShowChampionsLeaderboard(false)}>
          <div className="modal lb-modal" onClick={(e) => e.stopPropagation()}>
            <ChampionsLeaderboard limit={10} />
            <button className="action-btn claim-btn" onClick={() => setShowChampionsLeaderboard(false)} style={{ marginTop: 12 }}>
              Close
            </button>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal lb-modal" onClick={(e) => e.stopPropagation()}>
            <HistoryLeaderboard
              claimed={(rewards.unified?.allRewards || []).filter(r => r.status === 'claimed')}
              bitsPriceMillicents={bitsPriceMillicents}
            />
            <button className="action-btn claim-btn" onClick={() => setShowHistoryModal(false)} style={{ marginTop: 12 }}>
              Close
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmPayload?.title || "Confirm Claim"}</h3>
            <ul>
              {(confirmPayload?.lines || []).map((l, idx) => (<li key={idx}>{l}</li>))}
            </ul>
            {!confirmPayload ? (
              <div style={{ opacity: 0.8, marginTop: 6 }}>Loading pre-check…</div>
            ) : (
              <div className="confirm-actions">
                <button className="action-btn" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button
                  className="action-btn claim-btn"
                  disabled={!confirmPayload?.canPay || claiming}
                  onClick={async () => {
                    setShowConfirm(false);
                    if (confirmPayload?.kind === "telegram") {
                      await executeTelegramPayout();
                    } else if (confirmPayload?.kind === "referral") {
                      await executeReferralPayout();
                    } else if (confirmPayload?.kind === "solana_loyalty") {
                      await executeSolanaPayout();
                    }
                  }}
                >
                  {confirmPayload?.canPay ? "Confirm & Send" : "Not Ready"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsHub;
