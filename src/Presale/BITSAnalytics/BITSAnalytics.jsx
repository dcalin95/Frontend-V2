import React, { useContext, useEffect, useState } from "react";
import { useBoosterSummary } from "./useBoosterSummary";
import WalletContext from "../../context/WalletContext";
import { copyWalletAddress } from "../../utils/copyUtils";
import { ethers } from "ethers";
import "./BITSAnalytics.desktop.css";
import "./BITSAnalytics.mobile.css";
import "../CrystalClear.css"; // 💎 Crystal clear text
// AdditionalBonusBox nu mai e necesar - widget-ul e integrat direct
import DashboardHeader from "./components/DashboardHeader";
import { useStakingData } from "../../Staking/useStakingData";
import { executeStakingCall } from "../../contract/getStakingContract";
import { WALLET_TYPES } from "../../context/WalletContext";
import solanaLogo from "../../assets/icons/solana-logo.png";
import telegramLogo from "../../assets/TLogo.png";
import {
  formatUSD,
  formatBITS,
  formatPrice,
  formatROI,
  formatTransactions,
  shortenAddress,
} from "./utils/dataFormatters";
import SmartTooltip from "../components/SmartTooltip";

// --- SVG ICONS COMPONENTS (Gemini 3 King Style) ---
const IconWallet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="gemini-icon"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><line x1="7" y1="15" x2="7.01" y2="15" /><line x1="11" y1="15" x2="13" y2="15" /></svg>
);
const IconStaking = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="gemini-icon"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
);
const IconPortfolio = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="gemini-icon"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
);
const IconBits = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="gemini-icon"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
);
const IconPrice = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="gemini-icon"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const IconTotalValue = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="gemini-icon"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
);
const IconPerformance = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="gemini-icon"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
);
const IconPnL = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="gemini-icon"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
);
const IconTransactions = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="gemini-icon"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
);
const IconReferral = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="gemini-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
);
const IconBonus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="gemini-icon"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
);
const IconSize = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="gemini-icon"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></svg>
);
const IconStatus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="gemini-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);

const BITSAnalytics = () => {
  const walletContextValue = useContext(WalletContext);
  const { walletAddress } = walletContextValue || {};
  const { loading, data } = useBoosterSummary();
  const { stakes: stakingStakes, totalReward: stakingTotalRewardBN } = useStakingData(walletContextValue?.signer, walletAddress);
  
  // ... (LOGICA RĂMÂNE INTACTĂ) ...
  const stakingPendingFromStakingPage = (() => {
    try {
      if (stakingTotalRewardBN && stakingTotalRewardBN._isBigNumber) {
        return parseFloat(ethers.utils.formatUnits(stakingTotalRewardBN, 18));
      }
      if (Array.isArray(stakingStakes) && stakingStakes.length) {
        const { BigNumber } = ethers;
        const total = stakingStakes.reduce((acc, s) => {
          try { return acc.add(s?.reward || BigNumber.from(0)); } catch { return acc; }
        }, BigNumber.from(0));
        return parseFloat(ethers.utils.formatUnits(total, 18));
      }
      return 0;
    } catch { return 0; }
  })();

  const [stakingProfitLive, setStakingProfitLive] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (!walletAddress) return;
        let total = 0;
        try {
          const raw = await executeStakingCall(async (contract) => contract.getTotalCurrentEarnings(walletAddress));
          total = parseFloat(ethers.utils.formatUnits(raw || 0, 18));
        } catch {
          try {
            const stakes = await executeStakingCall(async (contract) => contract.getStakeByUser(walletAddress));
            const infos = await Promise.all(
              stakes.map((_, i) => executeStakingCall((contract) => contract.getStakeCompleteInfo(walletAddress, i)).catch(() => null))
            );
            total = infos.filter(Boolean).reduce((s, info) => {
              const currentRaw = info?.[2] ?? info?.currentEarnings;
              try { return s + parseFloat(ethers.utils.formatUnits(currentRaw || 0, 18)); } catch { return s; }
            }, 0);
          } catch {}
        }
        if (!cancelled) setStakingProfitLive(total || 0);
      } catch {}
    };
    run();
    const t = setInterval(run, 5000);
    return () => { cancelled = true; clearInterval(t); };
  }, [walletAddress]);

  const [stakingProfitPerSecondCalc, setStakingProfitPerSecondCalc] = useState(0);
  useEffect(() => {
    if (!Array.isArray(stakingStakes) || stakingStakes.length === 0) {
      setStakingProfitPerSecondCalc(0);
      return;
    }
    const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      let total = 0;
      try {
        for (const s of stakingStakes) {
          if (!s || s.withdrawn) continue;
          const secondsPassed = Math.max(0, now - (s.startTime?.toNumber?.() ?? 0));
          const aprPercentage = aprPercentFromRaw(s.apr);
          const aprDecimal = aprPercentage / 100;
          const aprPerSecond = aprDecimal / SECONDS_IN_YEAR;
          const stakedAmount = parseFloat(ethers.utils.formatEther(s.locked || 0));
          total += stakedAmount * aprPerSecond * secondsPassed;
        }
      } catch {}
      setStakingProfitPerSecondCalc(total || 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [stakingStakes]);

  const safeData = data || {
    totalBits: 0,
    currentPrice: 0,
    roiPercent: 0,
    realInvestedUSD: 0,
    referralBonus: 0,
    telegramBonus: 0,
    bonusCalculatedLocally: 0,
    txCount: 0,
    hasError: false,
    investedUSDOnSolana: 0,
  };

  // Manual widget expansion effect
  useEffect(() => {
    const handleWidgetClick = (event) => {
      const widget = event.currentTarget;
      if (widget.classList.contains('expanding')) {
        widget.classList.remove('expanding');
        widget.classList.add('returning');
        setTimeout(() => {
          widget.classList.remove('returning');
        }, 600);
      } else {
        widget.classList.add('expanding');
      }
    };
    const widgets = document.querySelectorAll('.widget');
    widgets.forEach(widget => {
      widget.addEventListener('click', handleWidgetClick);
    });
    return () => {
      widgets.forEach(widget => {
        widget.removeEventListener('click', handleWidgetClick);
      });
    };
  }, [data]);

  const walletContextUnavailable = !walletContextValue;
  
  // Numeric conversions & ROI logic (KEPT INTACT)
  const toNumber = (value, decimals = 18) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.\-eE]/g, '');
      if (cleaned.includes('.') || /e/i.test(cleaned)) {
        const parsed = parseFloat(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      const asInt = Number(cleaned);
      if (Number.isFinite(asInt) && decimals > 0) {
        return asInt / Math.pow(10, decimals);
      }
      const parsed = parseFloat(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (value && value._isBigNumber) {
      try { return parseFloat(ethers.utils.formatUnits(value, decimals)); } catch { return 0; }
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const clampBits = (v) => {
    const n = parseFloat(v || '0');
    if (!Number.isFinite(n) || n <= 0) return '0.0000';
    if (n >= 1) return n.toFixed(4).replace(/\.0+$/, '');
    return n.toFixed(4).replace(/\.0+$/, '');
  };

  const aprPercentFromRaw = (raw) => {
    try {
      const n = Number(raw?.toString ? raw.toString() : raw);
      if (!Number.isFinite(n)) return 0;
      if (n > 1e10) {
        return parseFloat(ethers.utils.formatUnits(raw, 16));
      }
      return n / 100;
    } catch (_) {
      return 0;
    }
  };

  // Network Logic
  const [networkInfo, setNetworkInfo] = useState({ name: null, chainId: null });
  const [targetChainId, setTargetChainId] = useState(56);
  const [isSwitchingNet, setIsSwitchingNet] = useState(false);

  const SUPPORTED_NETWORKS = {
    56:  { icon: '🟡', chainId: '0x38',   chainName: 'BSC Mainnet',   nativeCurrency: { name: 'BNB',  symbol: 'BNB',  decimals: 18 }, rpcUrls: ['https://bsc-dataseed.binance.org'],            blockExplorerUrls: ['https://bscscan.com'] },
    30:  { icon: '🟩', chainId: '0x1e',   chainName: 'RSK Mainnet',   nativeCurrency: { name: 'RBTC', symbol: 'RBTC', decimals: 18 }, rpcUrls: ['https://public-node.rsk.co'],                  blockExplorerUrls: ['https://explorer.rsk.co'] },
    1:   { icon: '⬡',  chainId: '0x1',    chainName: 'Ethereum',      nativeCurrency: { name: 'ETH',  symbol: 'ETH',  decimals: 18 }, rpcUrls: ['https://rpc.ankr.com/eth'],                  blockExplorerUrls: ['https://etherscan.io'] },
    137: { icon: '🟣', chainId: '0x89',   chainName: 'Polygon',       nativeCurrency: { name: 'MATIC',symbol: 'MATIC',decimals: 18 }, rpcUrls: ['https://polygon-rpc.com'],                   blockExplorerUrls: ['https://polygonscan.com'] },
    42161:{ icon: '🛡️',chainId: '0xa4b1', chainName: 'Arbitrum One', nativeCurrency: { name: 'ETH',  symbol: 'ETH',  decimals: 18 }, rpcUrls: ['https://arb1.arbitrum.io/rpc'],             blockExplorerUrls: ['https://arbiscan.io'] },
    43114:{ icon: '🔺',chainId: '0xa86a', chainName: 'Avalanche',     nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 }, rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],       blockExplorerUrls: ['https://snowtrace.io'] }
  };

  const getNetworkLabelByChainId = (cid) => {
    const n = SUPPORTED_NETWORKS[Number(cid)];
    if (n) return n.chainName;
    if (Number(cid) === 56) return 'BSC Mainnet';
    return `Chain ${cid}`;
  };

  useEffect(() => {
    const fetchNet = async () => {
      try {
        if (!walletContextValue?.signer) return;
        const net = await walletContextValue.signer.provider.getNetwork();
        setNetworkInfo({ name: getNetworkLabelByChainId(net.chainId), chainId: Number(net.chainId) });
        setTargetChainId(Number(net.chainId) || 56);
      } catch {}
    };
    fetchNet();
    if (typeof window !== 'undefined' && window.ethereum) {
      const onChainChanged = (hexId) => {
        const id = parseInt(hexId, 16);
        setNetworkInfo({ name: getNetworkLabelByChainId(id), chainId: id });
        setTargetChainId(id);
      };
      window.ethereum.on('chainChanged', onChainChanged);
      return () => {
        try { window.ethereum.removeListener('chainChanged', onChainChanged); } catch {}
      };
    }
  }, [walletContextValue?.signer, getNetworkLabelByChainId]);

  const switchNetwork = async (target) => {
    try {
      if (!window?.ethereum) return;
      setIsSwitchingNet(true);
      const hexId = '0x' + Number(target).toString(16);
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
    } catch (err) {
      if (err?.code === 4902) {
        const cfg = SUPPORTED_NETWORKS[Number(target)];
        if (cfg) {
          try {
            await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{
              chainId: cfg.chainId,
              chainName: cfg.chainName,
              nativeCurrency: cfg.nativeCurrency,
              rpcUrls: cfg.rpcUrls,
              blockExplorerUrls: cfg.blockExplorerUrls
            }] });
            const hexId = '0x' + Number(target).toString(16);
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
          } catch {}
        }
      }
    } finally {
      setIsSwitchingNet(false);
    }
  };

  const [rskNativeBalance, setRskNativeBalance] = useState("");
  useEffect(() => {
    const tid = Number(targetChainId);
    if (!walletAddress || !(tid === 30 || tid === 31)) {
      setRskNativeBalance("");
      return;
    }
    const rpc = SUPPORTED_NETWORKS[tid]?.rpcUrls?.[0];
    if (!rpc) { setRskNativeBalance(""); return; }
    try {
      const provider = new ethers.providers.JsonRpcProvider(rpc);
      provider.getBalance(walletAddress).then((bn) => {
        try { setRskNativeBalance(ethers.utils.formatEther(bn)); } catch (_) { setRskNativeBalance(""); }
      }).catch(() => setRskNativeBalance(""));
    } catch (_) {
      setRskNativeBalance("");
    }
  }, [walletAddress, targetChainId]);

  // --- Data Calculations (KEPT INTACT) ---
  const numericTotalBits = toNumber(safeData.totalBits, 18);
  const numericReferralBonus = toNumber(safeData.referralBonus, 18);
  const numericTelegramBonus = toNumber(safeData.telegramBonus, 18);
  const numericLocalBonus = toNumber(safeData.bonusCalculatedLocally, 18);
  const numericPrice = toNumber(safeData.currentPrice, 18);

  const totalBitsWithBonuses =
    (Number.isFinite(numericTotalBits) ? numericTotalBits : 0) +
    (Number.isFinite(numericReferralBonus) ? numericReferralBonus : 0) +
    (Number.isFinite(numericTelegramBonus) ? numericTelegramBonus : 0) +
    (Number.isFinite(numericLocalBonus) ? numericLocalBonus : 0);

  let totalValueUSD =
    Number.isFinite(totalBitsWithBonuses) && Number.isFinite(numericPrice)
      ? totalBitsWithBonuses * numericPrice
      : 0;

  if (totalValueUSD < 0.000001 && numericTotalBits > 0 && numericPrice > 0 && numericPrice < 0.000001) {
    const priceNoScale = toNumber(safeData.currentPrice, 0);
    if (priceNoScale > numericPrice) totalValueUSD = totalBitsWithBonuses * priceNoScale;
  }

  const hookValue = Number(data?.currentInvestmentValue ?? 0);
  const directFallback = (parseFloat(String(safeData.totalBits)) || 0) * (parseFloat(String(safeData.currentPrice)) || 0);
  const finalValueUSD = Math.max(
    0,
    Number.isFinite(hookValue) ? hookValue : 0,
    Number.isFinite(totalValueUSD) ? totalValueUSD : 0,
    Number.isFinite(directFallback) ? directFallback : 0
  );
  
  const bitsForRoi = Number(safeData.totalBits) || 0;
  const priceForRoi = Number(safeData.currentPrice) || 0;
  const rawInvested = Number((safeData.investedUsdFromPurchases ?? safeData.realInvestedUSD ?? safeData.investedUSD ?? 0)) || 0;

  const expectedValue = bitsForRoi * priceForRoi;
  let investedUsdForRoi = rawInvested;
  if (bitsForRoi > 0 && priceForRoi > 0 && rawInvested > expectedValue * 10) {
    const c15 = rawInvested / 1e15;
    const c18 = rawInvested / 1e18;
    const d15 = Math.abs(c15 - expectedValue);
    const d18 = Math.abs(c18 - expectedValue);
    const candidate = d15 <= d18 ? c15 : c18;
    if (candidate > 0 && candidate < rawInvested) investedUsdForRoi = candidate;
  }

  let computedROI = 0;
  if (bitsForRoi > 0 && investedUsdForRoi > 0.01 && priceForRoi > 0) {
    const avgEntry = investedUsdForRoi / bitsForRoi;
    if (avgEntry > 1e-9) {
      computedROI = ((priceForRoi - avgEntry) / avgEntry) * 100;
    }
  }
  if (!Number.isFinite(computedROI) || Math.abs(computedROI) > 10000) {
    computedROI = 0;
  }
  const roiData = formatROI(computedROI);

  const investedUsdPreferred = Number(investedUsdForRoi || 0);
  const currentValueUsdForPnl = (Number(safeData.totalBits) || 0) * (Number(safeData.currentPrice) || 0);
  const profitUsd = currentValueUsdForPnl - investedUsdPreferred;
  const profitDisplay = formatUSD(Math.abs(profitUsd));
  const pnlSign = profitUsd >= 0 ? '+' : '-';

  const holdingsOnlyUSD = (Number(safeData.totalBits) || 0) * (Number(safeData.currentPrice) || 0);
  const holdingsOnlyDisplay = formatUSD(holdingsOnlyUSD);
  const portfolioLevel =
    safeData.totalBits > 1000
      ? "Large Holder"
      : safeData.totalBits > 100
      ? "Medium Holder"
      : "Small Holder";
  const portfolioTierHint = "Tiers: Small ≤ 100 $BITS • Medium 101–1000 $BITS • Large > 1000 $BITS";

  const roiPercentValue = Number(safeData.roiPercent) || 0;
  const totalRewardsPending =
    (Number(safeData.additionalBonus) || 0) +
    (Number(safeData.referralBonus) || 0) +
    (Number(safeData.telegramBonus) || 0);

  let statusLabel = "Stable";
  if (loading) {
    statusLabel = "Syncing…";
  } else if (safeData.hasError) {
    statusLabel = "Error";
  } else if (!walletAddress) {
    statusLabel = "Not Connected";
  } else if ((Number(safeData.totalBits) || 0) <= 0) {
    statusLabel = "No Holdings";
  } else {
    if (roiPercentValue >= 20) statusLabel = "Performing Well";
    else if (roiPercentValue >= 5) statusLabel = "Positive Trend";
    else if (roiPercentValue > -5) statusLabel = "Stable";
    else if (roiPercentValue > -20) statusLabel = "Under Review";
    else statusLabel = "Risk Alert";
  }

  let strategyText = "Strategy";
  if (statusLabel === "Performing Well" || statusLabel === "Positive Trend") {
    strategyText = totalRewardsPending > 0 ? "Hold & Claim rewards" : "Hold & monitor";
  } else if (statusLabel === "Stable") {
    strategyText = "Accumulate on dips";
  } else if (statusLabel === "Under Review") {
    strategyText = "Review entry; consider DCA";
  } else if (statusLabel === "Risk Alert") {
    strategyText = "Reduce exposure / wait";
  } else if (statusLabel === "No Holdings") {
    strategyText = "Start an entry";
  } else if (statusLabel === "Syncing…") {
    strategyText = "Wait to sync";
  } else if (statusLabel === "Error") {
    strategyText = "Retry";
  }

  const formattedUSD = formatUSD(finalValueUSD);
  const displayUSD =
    finalValueUSD > 0 && formattedUSD === "$0.00"
      ? `$
        ${finalValueUSD.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`.replace(/\n\s+/g, '')
      : formattedUSD;

  if (loading && walletAddress) {
    const networkLabel = walletContextValue?.walletType === 'Solana' ? 'Solana Devnet' : 'BSC Mainnet';
    return (
      <div className="ai-analytics-loader">
        <div className="ai-gemini-loader">
          <svg viewBox="0 0 100 100" className="ai-spinner-svg">
             <defs>
               <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" style={{stopColor:'#00FFA3', stopOpacity:1}} />
                 <stop offset="100%" style={{stopColor:'#DC1FFF', stopOpacity:1}} />
               </linearGradient>
             </defs>
             <circle cx="50" cy="50" r="45" stroke="url(#grad1)" strokeWidth="2" fill="none" className="spinner-circle" />
             <circle cx="50" cy="50" r="30" stroke="#00FFA3" strokeWidth="2" fill="none" className="spinner-inner-circle" />
             <path d="M50 20 L50 80 M20 50 L80 50" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          </svg>
          <div className="ai-core-pulse">AI</div>
        </div>
        <div className="loader-title">Initializing BITS Intelligence</div>
        <div className="loader-subtitle">
          Secure sync on {networkLabel}. Neural aggregation active...
        </div>
        <div className="loader-steps">
          <div className="loader-step">Connecting neural wallet<span className="loader-dot"></span></div>
          <div className="loader-step">Analyzing on-chain vectors<span className="loader-dot"></span></div>
          <div className="loader-step">Syncing market data<span className="loader-dot"></span></div>
        </div>
        
        {/* Improved Skeleton Grid */}
        <div className="skeleton-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="sk-icon-pulse"></div>
              <div className="sk-line title"></div>
              <div className="sk-line value"></div>
              <div className="sk-line subtitle"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const hasError = safeData.hasError;
  if (hasError) {
    return <div className="error-text">⚠️ Error loading blockchain data.</div>;
  }

  return (
    <div>
      {walletContextUnavailable && (
        <div className="error-text" style={{ marginBottom: 10 }}>
          ⚠️ Wallet context not available. Please ensure WalletProvider wraps this app.
        </div>
      )}
      <DashboardHeader />
      {!walletAddress && (
        <div className="ai-analytics-loader" style={{ paddingTop: 0, paddingBottom: 12 }}>
          <div className="loader-subtitle">
             Connect wallet to activate BITS AI Portfolio.
          </div>
          <div>
            <button 
              onClick={() => walletContextValue?.connectViaMetamask?.()} 
              style={{
                padding: '10px 18px',
                fontSize: '14px',
                background: 'linear-gradient(135deg, #9333EA, #14F195)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginRight: 10
              }}
            >
              🦊 Connect MetaMask
            </button>
            <button 
              onClick={() => walletContextValue?.connectViaPhantom?.()} 
              style={{
                padding: '10px 18px',
                fontSize: '14px',
                background: 'linear-gradient(135deg, #6B21A8, #7C3AED)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              👻 Connect Phantom
            </button>
          </div>
        </div>
      )}

      {/* Inline Network & Wallet controls */}
      <div className="network-wallet-inline">
        <div className="nw-group">
          <span className="nw-label">Network:</span>
          <select
            className="nw-select"
            value={String(targetChainId)}
            onChange={(e) => setTargetChainId(parseInt(e.target.value))}
          >
            {Object.keys(SUPPORTED_NETWORKS)
              .map((cid) => Number(cid))
              .sort((a, b) => {
                const an = SUPPORTED_NETWORKS[a];
                const bn = SUPPORTED_NETWORKS[b];
                return an.chainName.localeCompare(bn.chainName);
              })
              .map((cid) => (
                <option key={cid} value={cid}>
                  {SUPPORTED_NETWORKS[cid].icon} {SUPPORTED_NETWORKS[cid].chainName}
                </option>
              ))}
          </select>
          <button
            className="nw-btn"
            onClick={() => switchNetwork(targetChainId)}
            disabled={isSwitchingNet || !window?.ethereum}
          >
            Switch
          </button>
          {(Number(targetChainId) === 30 || Number(targetChainId) === 31) && (
            <span className="nw-badge">RSK Beta{rskNativeBalance ? ` • ${parseFloat(rskNativeBalance).toFixed(5)} RBTC` : ''}</span>
          )}
        </div>
        <div className="nw-wallets">
          <button className="nw-wallet-btn" onClick={() => walletContextValue?.connectWallet?.(WALLET_TYPES.EVM)}>🦊 MetaMask</button>
          <button className="nw-wallet-btn" onClick={() => walletContextValue?.connectWallet?.(WALLET_TYPES.WALLETCONNECT)}>🔗 WalletConnect</button>
          <button className="nw-wallet-btn" onClick={() => walletContextValue?.connectWallet?.(WALLET_TYPES.COINBASE)}>🪙 Coinbase</button>
          <button className="nw-wallet-btn" onClick={() => walletContextValue?.connectWallet?.(WALLET_TYPES.SOLANA)}>👻 Phantom</button>
        </div>
      </div>

      <div className="widget-grid">
        {/* Wallet */}
        <SmartTooltip content={`Wallet Connection\nNetwork: ${walletContextValue?.walletType === 'Solana' ? 'Solana' : 'BSC (Binance Smart Chain)'}\nAddress: ${walletAddress ? shortenAddress(walletAddress) : 'Not Connected'}`}>
        <div className="widget holdings">
          <div className="widget-icon"><IconWallet /></div>
          <div className="widget-title">Wallet Address</div>
          <div className="widget-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {walletAddress ? (
              <>
                <a
                  href={walletContextValue?.walletType === 'Solana' 
                    ? `https://solscan.io/account/${walletAddress}?cluster=devnet` 
                    : `https://bscscan.com/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wallet-link"
                >
                  {shortenAddress(walletAddress, 6, 4)} ↗
                </a>
                <button
                  onClick={() => copyWalletAddress(walletAddress)}
                  title="Copy wallet address"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.7rem',
                    padding: '4px 8px',
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
              </>
            ) : (
              "Not Connected"
            )}
          </div>
          <div className="widget-subtitle">{walletContextValue?.walletType === 'Solana' ? 'Solana Devnet' : 'BSC Network'}</div>
        </div>
        </SmartTooltip>

        {/* STAKING PROFIT (Dedicated Live) */}
        <SmartTooltip content={`Live Staking Rewards\nReal-time earnings from your staked BITS.\nAPY is dynamic based on pool participation.`}>
        <div className="widget rewards">
          <div className="widget-icon"><IconStaking /></div>
          <div className="widget-title">Staking Profit (Live)</div>
          <div className="widget-value">
            {(() => {
              const ordered = [
                Number(stakingProfitPerSecondCalc) || 0,
                Number(stakingProfitLive) || 0,
                Number(stakingPendingFromStakingPage) || 0
              ];
              const p = ordered.find((x) => Number.isFinite(x) && x > 0) || 0;
              return <>{clampBits(p)} <span className="unit">$BITS</span></>;
            })()}
          </div>
          <div className="widget-subtitle">
            <a href="/staking" style={{ color: '#14F195', textDecoration: 'none' }}>View Staking →</a>
          </div>
        </div>
        </SmartTooltip>

        {/* BITS Portfolio Value */}
        <SmartTooltip content={`Total Portfolio Value\nCombined value of all your BITS holdings across wallets and staking pools.\nCalculated in real-time USD.`}>
        <div className="widget holdings">
          <div className="widget-icon"><IconPortfolio /></div>
          <div className="widget-title">Portfolio Value</div>
          <div className="widget-value">
            {walletAddress ? 
              (finalValueUSD > 0 ? displayUSD : "$0.00") :
              "Connect Wallet"
            }
          </div>
          <div className="widget-subtitle">
            {walletAddress ? 
              (finalValueUSD > 0 ? "Current Value" : "No Holdings") :
              "Connect to View"
            }
          </div>
        </div>
        </SmartTooltip>

        {/* $BITS Holdings */}
        <SmartTooltip content={`Your BITS Balance\nTokens currently held in your connected wallet.\nDoes not include pending claims or staked tokens.`}>
        <div className="widget holdings">
          <div className="widget-icon"><IconBits /></div>
          <div className="widget-title">$BITS Holdings</div>
          <div className="widget-value">
            {numericTotalBits > 0
              ? <>{numericTotalBits.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })} <span className="unit">$BITS</span></>
              : (walletAddress ? <span className="unit">0 $BITS</span> : "Connect Wallet")}
          </div>
          <div className="widget-subtitle">
            {safeData.totalBits > 0 ? "Current Balance" : 
             walletAddress ? "No $BITS Holdings" : "Connect to View"}
          </div>
        </div>
        </SmartTooltip>

        {/* $BITS Price */}
        <SmartTooltip content={`Current Presale Price\nPrice per 1 BITS token.\nNext Stage Price: Higher (+5-10%)`}>
        <div className="widget market">
          <div className="widget-icon"><IconPrice /></div>
          <div className="widget-title">$BITS Price (Current)</div>
          <div className="widget-value">
            {safeData.currentPrice > 0
              ? formatPrice(safeData.currentPrice)
              : walletAddress 
                ? "Fetching..." 
                : "Connect Wallet"}
          </div>
          <div className="widget-subtitle">
            {safeData.currentPrice > 0 
              ? "BSC Blockchain • CellManager.sol" 
              : walletAddress 
                ? "Connecting to BSC Network..." 
                : "Connect to View Price"}
          </div>
          <div className="widget-extra-info">
            {safeData.currentPrice > 0 && (
              <div className="simple-info-text">
                Exchange listing price expected higher than final presale
              </div>
            )}
          </div>
        </div>
        </SmartTooltip>

        {/* Total Value */}
        <SmartTooltip content={`Holdings Value\nValue of your unstaked BITS tokens only.`}>
        <div className="widget market">
          <div className="widget-icon"><IconTotalValue /></div>
          <div className="widget-title">Total Value</div>
          <div className="widget-value">{holdingsOnlyDisplay}</div>
          <div className="widget-subtitle">Holdings × Price</div>
        </div>
        </SmartTooltip>

        {/* STAKING (New) */}
        <SmartTooltip content={`Active Staking Positions\nDetailed breakdown of your locked tokens earning compound interest.`}>
        <div className="widget rewards" title={(() => {
          const bd = (safeData.stakingBreakdown || []);
          if (!bd.length) return '';
          const lines = bd.map((b, i) => `#${i+1}: ${b.pending?.toFixed?.(4) || b.pending} $BITS pending • ${b.aprPercent?.toFixed?.(2) || b.aprPercent}% APR • ${Math.floor(b.locked || 0).toLocaleString('en-US')} staked`).join('\n');
          return `Staking breakdown:\n${lines}`;
        })()}>
          <div className="widget-icon"><IconStaking /></div>
          <div className="widget-title">Staking</div>
          <div className="widget-value">
            {(safeData.stakingBits || 0) > 0 ? <>{Number(safeData.stakingBits).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })} <span className="unit">$BITS</span></> : <span className="unit">0 $BITS</span>}
          </div>
          <div className="widget-subtitle">
            Profit: {(() => {
              const ordered = [
                Number(stakingProfitPerSecondCalc) || 0,
                Number(stakingProfitLive) || 0,
                Number(stakingPendingFromStakingPage) || 0
              ];
              const p = ordered.find((x) => Number.isFinite(x) && x > 0) || 0;
              return `${clampBits(p)} $BITS`;
            })()}
          </div>
        </div>
        </SmartTooltip>

        {/* Performance */}
        <SmartTooltip content={`Asset Performance\nROI (Return on Investment) based on your entry price vs current price.`}>
        <div className="widget market">
          <div className="widget-icon"><IconPerformance /></div>
          <div className="widget-title">Performance</div>
          <div className="widget-value">
            {`${roiData.arrow} ${roiData.raw.toFixed(1)}%`}
          </div>
          <div className="widget-subtitle">{roiData.analysis}</div>
        </div>
        </SmartTooltip>

        {/* PnL (USD) */}
        <SmartTooltip content={`Profit and Loss\nNet profit or loss in USD value since investment.`}>
        <div className="widget market">
          <div className="widget-icon"><IconPnL /></div>
          <div className="widget-title">PnL (USD)</div>
          <div className="widget-value" style={{ color: profitUsd >= 0 ? '#14F195' : '#ff6b6b' }}>
            {pnlSign}{profitDisplay}
          </div>
          <div className="widget-subtitle">
            Bought: {formatUSD(investedUsdPreferred)} • Now: {formatUSD(currentValueUsdForPnl)}
          </div>
        </div>
        </SmartTooltip>

        {/* Transactions */}
        <SmartTooltip content={`On-Chain Activity\nTotal number of transactions associated with your wallet for this token.`}>
        <div className="widget market">
          <div className="widget-icon"><IconTransactions /></div>
          <div className="widget-title">Transactions</div>
          <div className="widget-value">
            {formatTransactions(safeData.txCount)}
          </div>
          <div className="widget-subtitle">Activity</div>
        </div>
        </SmartTooltip>

        {/* Rewards */}
        <SmartTooltip content={`Referral Earnings\nBonus BITS earned from inviting friends to the presale.`}>
        <div className="widget rewards">
          <div className="widget-icon"><IconReferral /></div>
          <div className="widget-title">Referral Rewards</div>
          <div className="widget-value">
            {formatBITS(safeData.referralBonus).replace(' $BITS', '')} <span className="unit">$BITS</span>
          </div>
          <div className="widget-subtitle">
            {safeData.referralBonus > 0 ? "Ready to Claim" : "No Rewards"}
          </div>
        </div>
        </SmartTooltip>

        <SmartTooltip content={`Community Rewards\nBITS earned from Telegram activity and engagement.`}>
        <div className="widget rewards">
          <div className="widget-icon"><img src={telegramLogo} alt="Telegram" className="widget-icon-img" /></div>
          <div className="widget-title">Telegram Rewards</div>
          <div className="widget-value">
            {(() => {
              const v = Math.floor(toNumber(safeData.telegramBonus, 18));
              return <>{v.toLocaleString('en-US')} <span className="unit">$BITS</span></>;
            })()}
          </div>
          <div className="widget-subtitle">
            {Math.floor(toNumber(safeData.telegramBonus, 18)) > 0 ? (
              <a href="/rewards-hub" style={{ color: '#14F195', textDecoration: 'none' }}>
                Ready to Claim →
              </a>
            ) : "No Rewards"}
          </div>
        </div>
        </SmartTooltip>

        {/* Additional Bonus */}
        <SmartTooltip content={`Special Bonuses\nExtra BITS from promotions, airdrops, or loyalty programs.`}>
        <div className="widget rewards">
          <div className="widget-icon"><IconBonus /></div>
          <div className="widget-title">Additional Bonus</div>
          <div className="widget-value">
            {safeData.additionalBonus > 0 ? (
              <a href="/rewards-hub" style={{ color: '#ffffff', textDecoration: 'none' }}>
                {formatBITS(safeData.additionalBonus).replace(' $BITS', '')} <span className="unit">$BITS</span>
              </a>
            ) : <span className="unit">0.00 $BITS</span>}
          </div>
          <div className="widget-subtitle">
            {safeData.additionalBonus > 0 ? (
              <>
                <div style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#a3e635',
                  marginBottom: 4
                }}>
                  {(() => {
                    const investedPreferred =
                      (safeData.totalUsdFromAdditional && safeData.totalUsdFromAdditional > 0)
                        ? safeData.totalUsdFromAdditional
                        : (safeData.investedUsdFromPurchases && safeData.investedUsdFromPurchases > 0)
                          ? safeData.investedUsdFromPurchases
                          : safeData.realInvestedUSD;
                    return investedPreferred > 0
                      ? `Invested: ${formatUSD(investedPreferred)} • Rate: ${safeData.bonusRate || '0%'}`
                      : "No investments yet";
                  })()}
          </div>
                <div style={{ fontSize: '11px', color: '#7dd3fc', marginBottom: 4 }}>
                  Source: {safeData.additionalBonusSource === 'on-chain' ? 'on-chain' : 'estimated'}
                </div>
                <a href="/rewards-hub" style={{ color: '#14F195', textDecoration: 'none' }}>
                  Ready to Claim →
                </a>
              </>
            ) : "No Rewards"}
            </div>
        </div>
        </SmartTooltip>

        {/* System */}
        <SmartTooltip content={`Solana Integration\nFunds invested directly via the Solana blockchain bridge.`}>
        <div className="widget system">
          <div className="widget-icon"><img src={solanaLogo} alt="Solana" className="widget-icon-img" /></div>
          <div className="widget-title">Solana Investment</div>
          <div className="widget-value">
            {safeData.investedUSDOnSolana > 0
              ? formatUSD(safeData.investedUSDOnSolana)
              : "No Investment"}
          </div>
          <div className="widget-subtitle">SOL Network</div>
        </div>
        </SmartTooltip>

        <SmartTooltip content={`Investor Tier\nClassification based on total holding size.\n${portfolioTierHint}`}>
        <div className="widget system" title={portfolioTierHint}>
          <div className="widget-icon"><IconSize /></div>
          <div className="widget-title">Portfolio Size</div>
          <div className="widget-value">{portfolioLevel}</div>
          <div className="widget-subtitle">
            Total Holdings: {Number(safeData.totalBits || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })} <span className="unit">$BITS</span>
          </div>
        </div>
        </SmartTooltip>

        <SmartTooltip content={`AI Strategy Suggestion\nAutomated recommendation based on your portfolio performance.`}>
        <div className="widget system">
          <div className="widget-icon"><IconStatus /></div>
          <div className="widget-title">Status</div>
          <div className="widget-value">{statusLabel}</div>
          <div className="widget-subtitle">{strategyText}</div>
        </div>
        </SmartTooltip>
      </div>
    </div>
  );
};

export default BITSAnalytics;
