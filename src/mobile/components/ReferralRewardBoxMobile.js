import React, { useState } from 'react';
import Icon from '../../assets/icons/Icon';
import '../Mobile.css';

const ReferralRewardBoxMobile = ({ walletAddress }) => {
  const [referralCode, setReferralCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerateCode = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setGenerating(true);
    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
      const response = await fetch(`${backendURL}/api/invite/generate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          firstName: "User"
        })
      });
      
      const data = await response.json();
      if (data.code) {
        setReferralCode(data.code);
      }
    } catch (error) {
      console.error('Error generating code:', error);
      alert('Failed to generate code');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (referralCode && navigator.share) {
      navigator.share({
        title: 'Join BitSwapDEX AI Presale',
        text: `Use my referral code: ${referralCode}`,
        url: window.location.origin + '/presale'
      }).catch(() => {
        handleCopy();
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="mobile-referral-box">
      <div className="mobile-referral-header">
        <Icon name="gift" size="large" animate="float" />
        <h3>Referral Rewards</h3>
      </div>

      {!walletAddress ? (
        <div className="mobile-referral-connect">
          <Icon name="wallet" size="medium" />
          <p>Connect wallet to see rewards</p>
        </div>
      ) : (
        <>
          <div className="mobile-referral-info">
            <Icon name="info" size="small" />
            <p>Invite friends and earn $BITS rewards!</p>
          </div>

          {referralCode ? (
            <div className="mobile-referral-code-display">
              <div className="mobile-code-label">Your Referral Code</div>
              <div className="mobile-code-value">{referralCode}</div>
              <div className="mobile-code-actions">
                <button 
                  className="mobile-code-btn"
                  onClick={handleCopy}
                >
                  <Icon name={copied ? "success" : "copy"} size="small" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
                <button 
                  className="mobile-code-btn"
                  onClick={handleShare}
                >
                  <Icon name="share" size="small" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          ) : (
            <button 
              className="mobile-generate-code-btn"
              onClick={handleGenerateCode}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Icon name="loading" size="small" animate="spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Icon name="plus" size="small" />
                  <span>Generate Code</span>
                </>
              )}
            </button>
          )}

          <a href="/rewards-hub" className="mobile-rewards-link">
            <Icon name="trophy" size="small" />
            <span>View All Rewards</span>
            <Icon name="chevron-right" size="small" />
          </a>
        </>
      )}
    </div>
  );
};

export default ReferralRewardBoxMobile;

