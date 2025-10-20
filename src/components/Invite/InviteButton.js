import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import "./InviteButton.css";
import nodeRewardsService, { validateWalletConnection } from "../../services/nodeRewardsService.js";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

const InviteButton = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [referrerCode, setReferrerCode] = useState("");

  // 1️⃣ Detectează wallet + cod referral din URL
  useEffect(() => {
    const detectWalletAndReferrer = async () => {
      // Wallet
      if (!window.ethereum) {
        setError("❌ Please install MetaMask to continue.");
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setError("⚠️ No wallet connected.");
        }
      } catch (err) {
        setError("⚠️ Wallet access denied.");
        console.error(err);
      }

      // Referral code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromURL = urlParams.get("ref");
      if (codeFromURL) setReferrerCode(codeFromURL);
    };

    detectWalletAndReferrer();
  }, []);

  // 2️⃣ AUTO-LOAD existing invite code when wallet is detected
  useEffect(() => {
    if (walletAddress && !inviteCode) {
      console.log("🔍 Auto-checking for existing invite code for wallet:", walletAddress);
      checkExistingInviteCode();
    }
  }, [walletAddress]);

  // 🔍 Check if wallet already has an invite code
  const checkExistingInviteCode = async () => {
    if (!walletAddress) return;

    try {
      console.log("🔍 Checking for existing invite code...");
      
      // Use the new auto-detection endpoint
      const response = await fetch(`${BACKEND_URL}/api/invite/check-code/${walletAddress}`);

      const data = await response.json();

      if (response.ok && data.hasCode && data.code) {
        setInviteCode(data.code);
        setMessage(`✅ Auto-detected your invite code: ${data.code}`);
        console.log("✅ Auto-detected existing code:", data.code);
      } else {
        console.log("ℹ️ No existing code found - ready to generate");
        setMessage("💡 Generate your personal invite code to start earning!");
      }
    } catch (err) {
      console.log("⚠️ Could not auto-load invite code, will require manual generation:", err.message);
      // Don't show error to user - just silently fail for auto-check
    }
  };

  // 🎯 HYBRID: Generate code with Node.sol direct integration
  const handleCheckOrGenerateCode = async () => {
    setMessage("");
    setInviteCode("");
    setIsLoading(true);
    setError("");

    if (!walletAddress) {
      setMessage("⚠️ No wallet detected.");
      setIsLoading(false);
      return;
    }

    try {
      // 🔗 METHOD 1: Node.sol Direct Generation (NEW!)
      console.log("🎯 Attempting Node.sol direct generation...");
      
      // Validate wallet connection first
      const validation = await validateWalletConnection();
      if (validation.valid) {
        const result = await nodeRewardsService.generateInviteCode(walletAddress, referrerCode);
        
        if (result.success) {
          setInviteCode(result.code);
          setMessage(`🎉 ${result.message}!`);
          handleConfetti();
          
          console.log("✅ Node.sol direct generation successful:", result);
          return;
        } else {
          console.warn("⚠️ Node.sol generation failed:", result.error);
          // Continue to backend fallback
        }
      }
      
      // 🔄 METHOD 2: Backend fallback
      console.log("🔄 Falling back to backend generation...");
      const response = await fetch(`${BACKEND_URL}/api/invite/generate-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          firstName: "FrontendUser",
          referrerCode: referrerCode || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setInviteCode(data.code);
        if (data.alreadyExists) {
          setMessage("ℹ️ You already have an invite code (from backend).");
        } else {
          setMessage("🎉 Invite code generated (backend fallback)!");
          handleConfetti();
        }
      } else {
        console.error("Backend error:", data);
        throw new Error(data.message || "Backend generation failed");
      }
      
    } catch (err) {
      console.error("All generation methods failed:", err);
      
      // 🚨 METHOD 3: Emergency local generation
      console.log("🚨 Emergency local generation...");
      const emergencyCode = `EMERGENCY-${walletAddress.slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      setInviteCode(emergencyCode);
      setMessage("⚠️ Emergency code generated locally. Limited functionality.");
      setError("Backend unavailable. Code generated locally for testing purposes.");
      
      // Still show confetti for better UX
      handleConfetti();
    } finally {
      setIsLoading(false);
    }
  };

  // 3️⃣ Copiază codul
  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // 4️⃣ Confetti vizual
  const handleConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#00ffff", "#ffcc00", "#ffffff"],
    });
  };

  return (
    <div className="invite-section">
      <div className="invite-button-container">
        <h2 className="invite-title">Your Cosmic Journey Starts Here (HYBRID)</h2>
        <p className="invite-description">
          Invite your friends and earn <span className="highlight">rewards</span>! Together we grow the $BITS universe.
        </p>

        <input
          type="text"
          placeholder="Wallet Address"
          value={walletAddress}
          disabled
          className="wallet-input"
        />

        <button onClick={handleCheckOrGenerateCode} disabled={isLoading || !walletAddress} className="generate-button">
          {isLoading ? "Processing..." : inviteCode ? "🔄 Regenerate Code" : "🚀 Get Invite Code"}
        </button>

        {error && <p className="message error">{error}</p>}
        {message && <p className="message">{message}</p>}

        {inviteCode && (
          <div className="code-section">
            <p className="invite-code">Invite Code: {inviteCode}</p>
            <button onClick={handleCopyCode} className="copy-button">
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
        )}
      </div>

      <div className="invite-card">
        <h2 className="invite-card-title">🚀 Earn Rewards Beyond Limits</h2>
        <p className="invite-card-text">
          <span className="highlight-big">10% from direct invitees</span> and <span className="highlight-big">5% from second-level referrals</span>!
        </p>
        <div className="rewards-container">
          <div className="reward-box" onMouseEnter={handleConfetti}>
            <span className="reward-title">10%</span>
            <p className="reward-desc">Direct Referrals</p>
          </div>
          <div className="reward-box" onMouseEnter={handleConfetti}>
            <span className="reward-title">5%</span>
            <p className="reward-desc">Second-Level Referrals</p>
          </div>
        </div>
        <p className="invite-card-footer">
          Share your code and grow the $BITS galaxy!
        </p>
      </div>
    </div>
  );
};

export default InviteButton;
