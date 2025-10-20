import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./ClaimInviteComponent.css";
import nodeRewardsService, { formatBitsAmount, validateWalletConnection } from "../../services/nodeRewardsService.js";

const FULL_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
const API_ROOT = FULL_BACKEND_URL.replace("/api/invite", "");

const NODE_CONTRACT_ADDRESS = process.env.REACT_APP_NODE_CONTRACT_ADDRESS || process.env.REACT_APP_NODE;
const TOKEN_CONTRACT_ADDRESS = process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS || process.env.REACT_APP_BITS_TOKEN;

const ClaimInviteComponent = () => {
  const [referralCode, setReferralCode] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [rewardInfo, setRewardInfo] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // 1️⃣ Detectare automată a wallet-ului conectat
  useEffect(() => {
    const detectWallet = async () => {
      if (!window.ethereum) {
        setMessage("❌ Please install MetaMask to claim your reward.");
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setMessage("⚠️ Please connect your wallet.");
        }
      } catch (err) {
        console.error("Wallet Error:", err);
        setMessage("❌ Wallet access denied.");
      }
    };

    detectWallet();
  }, []);

  // 🎯 HYBRID: Check code directly from Node.sol
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
      // 🔗 Read directly from Node.sol contract
      await nodeRewardsService.initialize();
      const codeInfo = await nodeRewardsService.getCodeRewardInfo(referralCode);
      
      if (codeInfo.hasRewards) {
        // Calculate reward (assuming 10% as in old backend)
        const rewardAmount = parseFloat(codeInfo.codeBalance) * 0.10;
        
        setRewardInfo({
          rewardPercentage: 10,
          amountPurchased: formatBitsAmount(codeInfo.codeBalance),
          rewardAmount: formatBitsAmount(rewardAmount.toString()),
          firstReferralRate: codeInfo.firstReferralRate,
          secondReferralRate: codeInfo.secondReferralRate
        });
        setMessage("✅ Reward available from blockchain!");
      } else {
        setMessage("❌ No rewards available for this referral code.");
      }
    } catch (error) {
      console.error("❌ Error checking code from Node.sol:", error);
      
      // 🔄 Fallback to backend API if Node.sol fails
      try {
        console.log("🔄 Fallback to backend API...");
        const response = await fetch(`${API_ROOT}/api/claim/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode, wallet: walletAddress }),
        });

        const result = await response.json();

        if (response.ok) {
          setRewardInfo(result);
          setMessage("✅ Reward available (via backend)!");
        } else {
          setMessage(`❌ ${result.message}`);
        }
      } catch (backendError) {
        console.error("❌ Backend also failed:", backendError);
        setMessage("❌ Could not check reward. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🎯 HYBRID: Claim directly via Node.sol service
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

      // 🔗 Use Node.sol service for claiming
      const result = await nodeRewardsService.claimReferralReward(
        referralCode, 
        [TOKEN_CONTRACT_ADDRESS]
      );

      if (result.success) {
        setMessage(`🎉 ${result.message} (TX: ${result.txHash?.slice(0, 10)}...)`);
        setRewardInfo(null);
        setReferralCode("");
      } else {
        // 🔄 Fallback to backend API if Node.sol fails
        console.log("🔄 Fallback to backend claim...");
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();
        const deadline = Math.floor(Date.now() / 1000) + 3600;

        const domain = {
          name: "Node",
          version: "1",
          chainId: 97,
          verifyingContract: NODE_CONTRACT_ADDRESS,
        };

        const types = {
          Claim: [
            { name: "tokens", type: "address[]" },
            { name: "code", type: "string" },
            { name: "user", type: "address" },
            { name: "deadline", type: "uint256" },
          ],
        };

        const value = {
          tokens: [TOKEN_CONTRACT_ADDRESS],
          code: referralCode,
          user: userAddress,
          deadline,
        };

        const signature = await signer._signTypedData(domain, types, value);
        const { r, s, v } = ethers.utils.splitSignature(signature);

        const claimResponse = await fetch(`${API_ROOT}/api/claim/claim`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referralCode,
            signature: { r, s, v },
          }),
        });

        const claimResult = await claimResponse.json();

        if (claimResponse.ok) {
          setMessage("🎉 Reward claimed successfully (via backend)!");
          setRewardInfo(null);
          setReferralCode("");
        } else {
          setMessage(`❌ ${claimResult.message || result.message}`);
        }
      }
    } catch (error) {
      console.error("❌ Claim Error:", error);
      setMessage("❌ Failed to claim reward. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="claim-invite-container">
      <h2>🎁 Claim Your Invite Reward (HYBRID)</h2>

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

      {message && <p className="message">{message}</p>}

      {rewardInfo && (
        <div className="reward-info">
          <p>
            You have <strong>{rewardInfo.rewardPercentage}%</strong> to claim from{" "}
            <strong>{rewardInfo.amountPurchased} $BITS</strong>, which is{" "}
            <strong>{rewardInfo.rewardAmount} $BITS</strong>.
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
