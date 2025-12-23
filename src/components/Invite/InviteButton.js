import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import "./InviteButton.css";
import { getBackendUrl } from "../../utils/getBackendUrl";

const BACKEND_URL = getBackendUrl();

const InviteButton = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [referrerCode, setReferrerCode] = useState("");
  const [friendCodeStatus, setFriendCodeStatus] = useState(null); // { ok: true|false|null, msg: string }

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("❌ Please install MetaMask to continue.");
      return;
    }
    try {
      setError("");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      } else {
        setError("⚠️ No wallet connected.");
      }
    } catch (err) {
      console.error(err);
      if (err?.code === 4001) return; // user rejected
      setError("⚠️ Wallet access denied.");
    }
  };

  // 1️⃣ Detectează wallet + cod referral din URL
  useEffect(() => {
    const detectWalletAndReferrer = async () => {
      // Wallet
      if (!window.ethereum) {
        setError("❌ Please install MetaMask to continue.");
        return;
      }

      try {
        // 🛑 CRITICAL: do NOT prompt on mount. Silent check only.
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          // Don't show scary error; user can connect manually.
          setError("");
        }
      } catch (err) {
        console.error(err);
        // Silent failure on mount
      }

      // Referral code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromURL = urlParams.get("ref");
      if (codeFromURL) setReferrerCode(codeFromURL);
    };

    detectWalletAndReferrer();
  }, []);

  // 🔍 Check if wallet already has an invite code
  const checkExistingInviteCode = useCallback(async () => {
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
  }, [walletAddress]);

  // 2️⃣ AUTO-LOAD existing invite code when wallet is detected
  useEffect(() => {
    if (walletAddress && !inviteCode) {
      console.log("🔍 Auto-checking for existing invite code for wallet:", walletAddress);
      checkExistingInviteCode();
    }
  }, [walletAddress, inviteCode, checkExistingInviteCode]);

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
      const response = await fetch(`${BACKEND_URL}/api/invite/generate-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          firstName: "User",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setInviteCode(data.code);
        if (data.alreadyExists) {
          setMessage("ℹ️ You already have an invite code (from backend).");
        } else {
          setMessage("🎉 Invite code generated!");
          handleConfetti();
        }
      } else {
        console.error("Backend error:", data);
        throw new Error(data.message || "Backend generation failed");
      }
      
    } catch (err) {
      console.error("Invite code generation failed:", err);
      setError(err.message || "Failed to generate invite code.");
      setMessage("❌ Could not generate invite code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFriendCode = async () => {
    if (!walletAddress) {
      setFriendCodeStatus({ ok: false, msg: "Connect wallet first." });
      return;
    }
    const code = String(referrerCode || "").trim();
    if (!code) {
      setFriendCodeStatus({ ok: false, msg: "Enter a friend code." });
      return;
    }
    setFriendCodeStatus({ ok: null, msg: "Applying..." });
    try {
      const res = await fetch(`${BACKEND_URL}/api/invite/use-friend-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, friendCode: code })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        setFriendCodeStatus({ ok: false, msg: data?.message || "Failed to apply code." });
        return;
      }
      setFriendCodeStatus({ ok: true, msg: data?.message || "Friend code applied!" });
    } catch (e) {
      setFriendCodeStatus({ ok: false, msg: e.message });
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
        <h2 className="invite-title">Your Invite Code</h2>
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

        {!walletAddress && (
          <button onClick={connectWallet} disabled={isLoading} className="generate-button">
            🔗 Connect Wallet
          </button>
        )}

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

      <div className="invite-card invite-card-small">
        <h2 className="invite-card-title">🤝 Use a Friend's Code</h2>
        <p className="invite-card-text">
          If someone invited you, paste their code here <span className="highlight">before buying</span>.
        </p>
        <div className="friend-code-row">
          <input
            type="text"
            className="wallet-input"
            placeholder="Friend code (e.g. CODE-ABC123)"
            value={referrerCode}
            onChange={(e) => setReferrerCode(e.target.value)}
          />
          <button onClick={applyFriendCode} disabled={!walletAddress || isLoading} className="generate-button">
            Apply
          </button>
        </div>
        {friendCodeStatus?.msg && (
          <p className={`message ${friendCodeStatus.ok === false ? "error" : ""}`}>
            {friendCodeStatus.msg}
          </p>
        )}
      </div>
    </div>
  );
};

export default InviteButton;
