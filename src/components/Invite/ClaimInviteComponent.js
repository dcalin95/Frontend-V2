import React, { useState, useEffect } from "react";
import "./ClaimInviteComponent.css";
import nodeRewardsService, { formatBitsAmount, validateWalletConnection } from "../../services/nodeRewardsService.js";
import { CONTRACT_MAP } from "../../contract/contractMap";
import TokenInline from "../common/TokenInline";
import CosmicRewardBurst from "../common/CosmicRewardBurst";
import { getBackendUrl } from "../../utils/getBackendUrl";

const TOKEN_CONTRACT_ADDRESS =
  process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS ||
  process.env.REACT_APP_BITS_TOKEN ||
  CONTRACT_MAP?.BITS_TOKEN?.address;

const ClaimInviteComponent = () => {
  const [referralCode, setReferralCode] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [rewardInfo, setRewardInfo] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [burstAmount, setBurstAmount] = useState(0);
  const [burstUsdt, setBurstUsdt] = useState(null);
  const [bitsPriceMillicents, setBitsPriceMillicents] = useState(null);

  useEffect(() => {
    const fetchBitsPrice = async () => {
      try {
        const BACKEND_URL = getBackendUrl();
        const res = await fetch(`${BACKEND_URL}/api/presale/current`);
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const p = Number(data?.price);
        if (Number.isFinite(p) && p > 0) setBitsPriceMillicents(p);
      } catch (_) {}
    };
    fetchBitsPrice();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setMessage("❌ Please install MetaMask to claim your reward.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setMessage("");
      } else {
        setMessage("⚠️ Please connect your wallet.");
      }
    } catch (err) {
      if (err?.code === 4001) return; // user rejected
      console.error("Wallet Error:", err);
      setMessage("❌ Wallet access denied.");
    }
  };

  // 1️⃣ Detectare automată a wallet-ului conectat
  useEffect(() => {
    const detectWallet = async () => {
      if (!window.ethereum) return;

      try {
        // 🛑 CRITICAL: do NOT prompt on mount. Silent check only.
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setMessage("");
        } else {
          setMessage("");
        }
      } catch (err) {
        console.error("Wallet Error:", err);
        // Silent failure on mount
      }
    };

    detectWallet();
  }, []);

  // 🔎 Check code directly from Node.sol
  const handleCheckCode = async () => {
    setLoading(true);
    setMessage("");
    setRewardInfo(null);

    if (!referralCode.trim()) {
      setMessage("⚠️ Please enter a referral code.");
      setLoading(false);
      return;
    }

    if (!walletAddress) {
      setMessage("⚠️ Wallet not connected.");
      setLoading(false);
      return;
    }

    try {
      await nodeRewardsService.initialize();
      const codeInfo = await nodeRewardsService.getCodeRewardInfo(referralCode, TOKEN_CONTRACT_ADDRESS);
      
      if (!codeInfo?.success) {
        setMessage(`❌ ${codeInfo?.error || "Failed to read from Node.sol"}`);
        return;
      }

      if (codeInfo.hasRewards) {
        const bitsDisplay = formatBitsAmount(codeInfo.codeBalance);
        const bitsNum = Number(bitsDisplay || 0);
        const priceUsd = bitsPriceMillicents ? (Number(bitsPriceMillicents) / 1000) : null;
        const estUsdt = (priceUsd && Number.isFinite(priceUsd) && priceUsd > 0)
          ? (Math.floor(bitsNum * priceUsd * 1e6) / 1e6)
          : null;

        setRewardInfo({
          codeBalance: bitsDisplay,
          firstReferralRate: codeInfo.firstReferralRate,
          secondReferralRate: codeInfo.secondReferralRate
        });
        setMessage("✅ Rewards found on-chain for this code.");
        setBurstAmount(bitsDisplay);
        setBurstUsdt(estUsdt != null ? Number(estUsdt).toFixed(4) : null);
        setShowBurst(true);
      } else {
        setMessage("❌ No on-chain rewards available for this code.");
      }
    } catch (error) {
      console.error("❌ Error checking code from Node.sol:", error);
      setMessage("❌ Could not check reward. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Claim via Node.sol (MetaMask tx)
  const handleClaim = async () => {
    setClaiming(true);
    setMessage("");

    try {
      // Validate wallet connection
      const validation = await validateWalletConnection();
      if (!validation.valid) {
        setMessage(`⚠️ ${validation.message}`);
        setClaiming(false);
        return;
      }

      const result = await nodeRewardsService.claimReferralReward(referralCode, [TOKEN_CONTRACT_ADDRESS]);
      if (!result?.success) {
        setMessage(`❌ ${result?.error || "Failed to claim"}`);
        return;
      }

      setMessage(`🎉 Claimed successfully! (TX: ${String(result.txHash || "").slice(0, 10)}...)`);
      setRewardInfo(null);
      setReferralCode("");
    } catch (error) {
      console.error("❌ Claim Error:", error);
      setMessage("❌ Failed to claim reward. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="claim-invite-container">
      <CosmicRewardBurst
        open={showBurst}
        onClose={() => setShowBurst(false)}
        amount={burstAmount}
        token="BITS"
        title="Invite reward detected"
        secondaryAmount={burstUsdt}
        secondaryToken="USDT"
        subtitle="On-chain reward detected. Claim now, or use Rewards Hub to claim in USDC."
        autoCloseMs={6500}
      />
      <h2>🎁 Claim Invite Reward (Node.sol)</h2>
      <div className="invite-claim-usdc-callout">
        <div className="invite-claim-usdc-title">
          Want to claim in{" "}
          <span className="invite-claim-usdc-badge">
            <TokenInline token="USDC" size={14} />
          </span>
          ?
        </div>
        <div className="invite-claim-usdc-text">
          Open <strong>Rewards Hub</strong> to claim Invite + Telegram rewards in{" "}
          <strong><TokenInline token="BITS" /></strong> or <strong><TokenInline token="USDC" /></strong>.
        </div>
        <a className="invite-claim-usdc-link" href="/#/rewards-hub">
          Open Rewards Hub →
        </a>
      </div>

      {!walletAddress && (
        <button onClick={connectWallet} className="claim-button">
          🔗 Connect Wallet
        </button>
      )}

      <input
        type="text"
        placeholder="Enter referral code"
        value={referralCode}
        onChange={(e) => setReferralCode(e.target.value)}
        className="input-field"
      />

      <button onClick={handleCheckCode} className="claim-button" disabled={loading}>
        {loading ? "Checking..." : "Check Code"}
      </button>

      {message && (
        <p className={`message ${(message.startsWith("✅") || message.startsWith("🎉")) ? "success" : "error"}`}>
          {message}
        </p>
      )}

      {rewardInfo && (
        <div className="reward-info">
          <p>
            Code balance:{" "}
            <strong>
              {rewardInfo.codeBalance} <TokenInline token="BITS" dollar />
            </strong>
            {typeof rewardInfo.firstReferralRate === "number" ? (
              <> • Rates: <strong>{rewardInfo.firstReferralRate}%</strong> / <strong>{rewardInfo.secondReferralRate}%</strong></>
            ) : null}
          </p>
          <button onClick={handleClaim} className="claim-button" disabled={claiming}>
            {claiming ? "Claiming..." : "Claim Now"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ClaimInviteComponent;
