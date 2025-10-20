import React, { useEffect, useState, useContext } from "react";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import WalletContext from "../../context/WalletContext";
import { getNodeContract, getAdditionalRewardContract, getActiveNetwork } from "../../contract/contractMap";

// Format BITS
import { formatBITS } from "../../utils/bitsUtils";

// Remove old formatBITS function - use the one from utils

// Format USD
const formatUSD = (value) => {
  try {
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return "$0.00";
  }
};

const AdditionalBonusBox = ({ onClaimed }) => {
  const { walletAddress, signer } = useContext(WalletContext);

  const [reward, setReward] = useState(0); // Claimable bonus (USD) from AdditionalReward
  const [estimatedBonus, setEstimatedBonus] = useState(0); // BITS holdings from Node purchases
  const [usdInvested, setUsdInvested] = useState(0); // Total invested (USD) from AdditionalReward
  const [activeTier, setActiveTier] = useState("0%"); // Current bonus rate from AdditionalReward
  const [loading, setLoading] = useState(false);
  // Next tier is disabled for now to avoid confusion; card shows only current state

  // USD values in contracts are stored with 18 decimals
  const DEFAULT_USD_DECIMALS = 18;

  const determineBonusTier = (usd) => {
    if (usd >= 2500) return 15;
    if (usd >= 1000) return 10;
    if (usd >= 500) return 7;
    if (usd >= 250) return 5;
    return 0;
  };

  const fetchData = async () => {
    if (!walletAddress || !signer) {
      console.log("⚠️ [AdditionalBonusBox] fetchData called without wallet/signer");
      return;
    }

    setLoading(true);
    try {
      console.log("🔍 [AdditionalBonusBox] Fetching data for wallet:", walletAddress);

      // Multi-RPC fallback list (BSC Testnet)
      const net = getActiveNetwork();
      const rpcCandidates = [
        net.rpcUrl,
        "https://data-seed-prebsc-2-s1.binance.org:8545/",
        "https://data-seed-prebsc-1-s2.binance.org:8545/",
        "https://data-seed-prebsc-2-s2.binance.org:8545/",
        "https://rpc.ankr.com/bsc_testnet_chapel"
      ];

      let purchases = [];
      let addRead = null;
      let nodeRead = null;
      let lastError = null;

      for (let i = 0; i < rpcCandidates.length; i++) {
        const url = rpcCandidates[i];
        try {
          const readProvider = new ethers.providers.JsonRpcProvider(url);
          nodeRead = getNodeContract(readProvider);
          addRead = getAdditionalRewardContract(readProvider);
          // quick call to validate provider and contracts
          purchases = await nodeRead.getUserPurchases(walletAddress);
          lastError = null;
          break; // success
        } catch (e) {
          lastError = e;
          const msg = e?.data?.message || e?.message || "";
          const isTrie = msg.toLowerCase().includes("missing trie node");
          const isCall = (e?.code === 'CALL_EXCEPTION');
          console.warn(`⚠️ RPC candidate failed (${url}):`, msg);
          if (!isTrie && !isCall) {
            // non-transient error -> stop trying more endpoints
            break;
          }
          // otherwise, continue to next RPC
        }
      }
      if (lastError && (!nodeRead || !addRead)) {
        throw lastError;
      }

      // Bits holdings from Node purchases
      let bitsEstimated = 0;
      if (purchases && purchases.length > 0) {
        bitsEstimated = purchases.reduce((acc, p) => {
          const bits = Number(ethers.utils.formatUnits(p.bitsAmount || 0, 18));
          return acc + (isNaN(bits) ? 0 : bits);
        }, 0);
      }

      // Use fixed 18 decimals for USD amounts (contract stores USD in 1e18)
      let usdDecimals = DEFAULT_USD_DECIMALS;

      // Node USD values are not used for this card

      // Total invested from AdditionalReward (fallback to Node USD sum)
      let totalInvestUSDWei = null;
      try {
        totalInvestUSDWei = await addRead.getTotalInvestment(walletAddress);
      } catch (e) {
        console.warn("⚠️ getTotalInvestment a eșuat, calculez din Node:", e?.message);
      }

      // Prefer exact on-chain investment history (USD at purchase time)
      let historyUsdTotal = 0;
      let unclaimedUSDFromHistory = 0;
      let claimedUSDFromHistory = 0;
      try {
        const rawHistory = await addRead.getInvestmentHistory(walletAddress);
        if (Array.isArray(rawHistory) && rawHistory.length > 0) {
          rawHistory.forEach((inv) => {
            const amount = Number(ethers.utils.formatUnits(inv.amount || 0, usdDecimals));
            const rate = Number(inv.rate?.toString?.() || 0);
            const bonus = (amount * rate) / 100;
            historyUsdTotal += isNaN(amount) ? 0 : amount;
            if (inv.claimed) claimedUSDFromHistory += bonus; else unclaimedUSDFromHistory += bonus;
          });
        }
      } catch (e) {
        console.warn("⚠️ getInvestmentHistory a eșuat, voi folosi alte surse:", e?.message);
      }

      // Also try totalInvestment
      const totalInvestmentFromAdditional = totalInvestUSDWei ? Number(ethers.utils.formatUnits(totalInvestUSDWei || 0, usdDecimals)) : 0;

      // Choose source for total invested: history > totalInvestment
      const totalUsdInvested = historyUsdTotal > 0
        ? historyUsdTotal
        : (totalInvestmentFromAdditional > 0 ? totalInvestmentFromAdditional : 0);

      // Claimable bonus (safe try/catch)
      let claimableUSD = 0;
      try {
        const claimableWei = await addRead.calculateClaimableReward(walletAddress);
        claimableUSD = Number(ethers.utils.formatUnits(claimableWei || 0, usdDecimals));
      } catch (e) {
        console.warn("⚠️ calculateClaimableReward a eșuat (RPC?), folosesc suma neîncasată din istoric:", e?.message);
        claimableUSD = unclaimedUSDFromHistory || 0;
      }

      // Current rate from contract logic: prefer getRewardRate(amount)
      const amountWei = ethers.utils.parseUnits(String(totalUsdInvested || 0), usdDecimals);
      let tierRate = 0;
      let thresholds = [];
      let rates = [];
      try {
        const rateBN = await addRead.getRewardRate(amountWei);
        tierRate = Number(rateBN?.toString?.() || "0");
      } catch (e1) {
        console.warn("⚠️ getRewardRate a eșuat, încerc previewRateFor:", e1?.message);
        try {
          const previewWei = await addRead.previewRateFor(walletAddress, amountWei);
          tierRate = Number(previewWei?.toString?.() || "0");
        } catch (e2) {
          console.warn("⚠️ previewRateFor a eșuat, încerc constantele THRESHOLD/RATE:", e2?.message);
          try {
            const [t1, t2, t3, t4, r1, r2, r3, r4] = await Promise.all([
              addRead.THRESHOLD_1(),
              addRead.THRESHOLD_2(),
              addRead.THRESHOLD_3(),
              addRead.THRESHOLD_4(),
              addRead.RATE_1(),
              addRead.RATE_2(),
              addRead.RATE_3(),
              addRead.RATE_4(),
            ]);
            thresholds = [t1, t2, t3, t4].map((w) => Number(ethers.utils.formatUnits(w || 0, usdDecimals)));
            rates = [r1, r2, r3, r4].map((w) => Number(w?.toString?.() || "0"));

            let computed = 0;
            for (let i = thresholds.length - 1; i >= 0; i--) {
              if (totalUsdInvested >= thresholds[i]) {
                computed = rates[i];
                break;
              }
            }
            tierRate = computed;
          } catch (e3) {
            console.warn("⚠️ constantele THRESHOLD/RATE au eșuat, folosesc fallback local:", e3?.message);
            tierRate = determineBonusTier(totalUsdInvested);
          }
        }
      }

      // Skip loading additional thresholds for next-tier (disabled in UI)

      // If claimable is not available, use unclaimed from history; else leave as 0
      if (!claimableUSD || Number.isNaN(claimableUSD) || claimableUSD === 0) {
        claimableUSD = (unclaimedUSDFromHistory && unclaimedUSDFromHistory > 0)
          ? unclaimedUSDFromHistory
          : 0;
      }

      console.log("🔍 [AdditionalBonusBox] FINAL REAL VALUES:", {
        totalUsdInvested,
        bitsEstimated,
        tierRate,
        claimableUSD,
        purchasesCount: purchases?.length || 0
      });

      // Apply values
      setReward(claimableUSD);
      setEstimatedBonus(bitsEstimated);
      setUsdInvested(totalUsdInvested);
      setActiveTier(`${tierRate}%`);
    } catch (err) {
      console.error("❌ [AdditionalBonusBox] Error fetching on-chain data:", err);
      console.error("❌ [AdditionalBonusBox] Error details:", {
        message: err.message,
        code: err.code,
        reason: err.reason,
        walletAddress,
        hasSigner: !!signer
      });
      toast.error(`Failed to fetch bonus data: ${err.message}`);
      setReward(0);
      setEstimatedBonus(0);
      setUsdInvested(0);
      setActiveTier("0%");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!walletAddress || !signer) {
      console.log("⚠️ [AdditionalBonusBox] Wallet not connected, skipping fetchData");
      return;
    }

    fetchData();
    let nodeContract;
    let additionalReward;
    try {
      nodeContract = getNodeContract(signer);
      additionalReward = getAdditionalRewardContract(signer);
    } catch (e) {
      return; // cannot subscribe without signer-backed instances
    }

    const handleBitsPurchased = (buyer) => {
      try {
        if (buyer && buyer.toLowerCase() === walletAddress.toLowerCase()) {
          fetchData();
        }
      } catch {}
    };

    const handleInvestmentMade = (user) => {
      try {
        if (user && user.toLowerCase() === walletAddress.toLowerCase()) {
          fetchData();
        }
      } catch {}
    };

    const handleRewardClaimed = (user) => {
      try {
        if (user && user.toLowerCase() === walletAddress.toLowerCase()) {
          fetchData();
        }
      } catch {}
    };

    try { nodeContract.on("BitsPurchased", handleBitsPurchased); } catch {}
    try { additionalReward.on("InvestmentMade", handleInvestmentMade); } catch {}
    try { additionalReward.on("RewardClaimed", handleRewardClaimed); } catch {}

    return () => {
      try { nodeContract.off("BitsPurchased", handleBitsPurchased); } catch {}
      try { additionalReward.off("InvestmentMade", handleInvestmentMade); } catch {}
      try { additionalReward.off("RewardClaimed", handleRewardClaimed); } catch {}
    };
  }, [walletAddress, signer, onClaimed]);

  const handleClaim = async () => {
    if (!walletAddress || !signer) return toast.error("Wallet not connected.");
    if (reward <= 0) return toast.info("No claimable reward.");
    setLoading(true);

    try {
      // No-op: claim handled elsewhere; avoid noisy toasts
      if (onClaimed) onClaimed();
      fetchData();
    } catch (err) {
      toast.error(`Claim failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="widget rewards">
      {/* ICON ca toate widget-urile */}
      <div className="widget-icon">🎁</div>
      
      {/* TITLE ca toate widget-urile */}
      <div className="widget-title">Additional Bonus</div>
      
      {/* VALUE - Bonus Amount (principala valoare din Solidity) */}
      <div className="widget-value">
        {loading ? "Loading..." : formatUSD(reward)}
      </div>
      
      {/* SUBTITLE - Invested amount */}
      <div className="widget-subtitle">
        {loading ? "Loading..." : usdInvested === 0 ? "No investments yet" : `Invested: ${formatUSD(usdInvested)}`}
      </div>

      {/* EXTRA INFO - Bonus Rate */}
      <div className="widget-extra-info">
        <div className="simple-info-text">
          Bonus Rate: {loading ? "Loading..." : activeTier}
        </div>
      </div>
    </div>
  );
};

export default AdditionalBonusBox;