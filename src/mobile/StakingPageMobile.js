import React, { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import WalletContext from "../context/WalletContext";

import { useStakingData } from "../Staking/useStakingData";
import StakingSummary from "../Staking/components/StakingSummary";
import StakingInfoBox from "../Staking/components/StakingInfoBox";
import StakeForm from "../Staking/components/StakeForm"; // ✅ Use standard responsive component
import ClaimStakes from "../Staking/components/ClaimStakes"; // ✅ Use standard responsive component
import StakingUSDValue from "../Staking/components/StakingUSDValue";

import "./StakingPageMobile.css";

const StakingPageMobile = () => {
  const { signer, walletAddress } = useContext(WalletContext);
  const { stakes } = useStakingData(signer, walletAddress);
  const [searchParams] = useSearchParams();
  const [prefilledAmount, setPrefilledAmount] = useState(null);
  const [rewardsSource, setRewardsSource] = useState(null);

  // Debug stakes
  useEffect(() => {
    console.log("🔍 StakingPageMobile Debug:");
    console.log("- signer:", !!signer);
    console.log("- walletAddress:", walletAddress);
    console.log("- stakes from useStakingData:", stakes);
    console.log("- stakes.length:", stakes?.length);
  }, [signer, walletAddress, stakes]);

  // Check for URL parameters from rewards hub
  useEffect(() => {
    const amount = searchParams.get('amount');
    const source = searchParams.get('source');
    
    if (amount && parseFloat(amount) > 0) {
      setPrefilledAmount(parseFloat(amount));
    }
    
    if (source === 'rewards') {
      setRewardsSource(true);
    }
  }, [searchParams]);

  return (
    <div className="mobile-staking-page-wrapper">
      <div className="staking-layout">
        <main className="staking-main">
          {/* Header */}
          <div className="ai-staking-header">
            <h1 className="ai-staking-title">Staking Hub</h1>
            <p className="ai-staking-subtitle">Secure and Efficient Token Staking</p>
            <div className="brand-line staking-brand" title="AI data pipeline">
              <img src={require("../assets/logo.png")} alt="BITS" className="bits-logo-mini" />
              <span className="bitsPulseLabel">BitPulse®</span>
            </div>
          </div>

          {/* 🎁 Rewards Source Banner */}
          {rewardsSource && prefilledAmount && (
            <div className="ai-container" style={{
              background: "linear-gradient(90deg, rgba(0, 255, 195, 0.2), rgba(0, 170, 255, 0.2))",
              border: "1px solid rgba(0, 255, 195, 0.5)",
              borderRadius: "20px",
              padding: "20px",
              marginBottom: "30px",
              textAlign: "center",
              backdropFilter: "blur(20px)"
            }}>
              <h3 style={{ margin: "0 0 10px 0", color: "rgba(255, 255, 255, 0.9)", fontSize: "1.2rem" }}>
                🎉 Rewards Integration Successful!
              </h3>
              <p style={{ margin: "0", opacity: 0.8, fontSize: "1rem" }}>
                Ready to stake {prefilledAmount.toFixed(4)} $BITS from your rewards!
              </p>
            </div>
          )}
          
          {/* MOBILE LAYOUT - EVERYTHING VERTICAL */}
          <div className="staking-top-row">
            {/* 1. Summary */}
            <div className="ai-container">
              <StakingSummary signer={signer} stakes={stakes} />
            </div>

            {/* 2. Info Box */}
            <div className="ai-container">
              <StakingInfoBox stakes={stakes} />
            </div>

            {/* 3. USD Value */}
            <div className="ai-container">
              <StakingUSDValue signer={signer} />
            </div>

            {/* 4. Stake Form (RESPONSIVE VERSION) */}
            <div className="ai-container">
              <StakeForm signer={signer} prefilledAmount={prefilledAmount} rewardsSource={rewardsSource} />
            </div>

            {/* 5. Claim/Positions (RESPONSIVE VERSION) */}
            <div>
              <ClaimStakes signer={signer} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StakingPageMobile;
