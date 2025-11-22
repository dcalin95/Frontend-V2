import React, { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import WalletContext from "../context/WalletContext";

import { useStakingData } from "./useStakingData";
import StakingSummary from "./components/StakingSummary";
import StakingInfoBox from "./components/StakingInfoBox";
import StakeForm from "./components/StakeForm";
import StakingBox from "./components/StakingBox";
import ClaimStakes from "./components/ClaimStakes";
import StakingUSDValue from "./components/StakingUSDValue";
import SmartTooltip from "../Presale/components/SmartTooltip"; // Import SmartTooltip

import "./StakingPage.desktop.css";
import "./StakingPage.mobile.css";

const StakingPage = () => {
  const { signer, walletAddress } = useContext(WalletContext);
  const { stakes } = useStakingData(signer, walletAddress);
  const [searchParams] = useSearchParams();
  const [prefilledAmount, setPrefilledAmount] = useState(null);
  const [rewardsSource, setRewardsSource] = useState(null);

  // Debug stakes
  useEffect(() => {
    console.log("🔍 StakingPage Debug:");
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
        
        <div className="staking-top-row">
          <div className="left-side">
            <div className="ai-container">
              <SmartTooltip content={`Staking Summary\nOverview of your current staking positions and earnings.`}>
                <div><StakingSummary signer={signer} stakes={stakes} /></div>
              </SmartTooltip>
            </div>
            <div className="ai-container">
              <SmartTooltip content={`Staking Information\nDetails about APY rates, lock periods, and rules.`}>
                <div><StakingInfoBox stakes={stakes} /></div>
              </SmartTooltip>
            </div>
            <div className="ai-container">
              <SmartTooltip content={`USD Value Analysis\nCurrent market value of your staked assets in USD.`}>
                <div><StakingUSDValue signer={signer} /></div>
              </SmartTooltip>
            </div>
          </div>
          <div className="right-side">
            <div className="ai-container">
              <SmartTooltip content={`New Stake Form\nLock tokens to earn rewards. Choose your amount and duration.`}>
                <div><StakeForm signer={signer} prefilledAmount={prefilledAmount} rewardsSource={rewardsSource} /></div>
              </SmartTooltip>
            </div>
            <div className="ai-container">
              <SmartTooltip content={`Claim Rewards\nWithdraw your earned interest or matured stakes.`}>
                <div><ClaimStakes signer={signer} /></div>
              </SmartTooltip>
            </div>
          </div>
        </div>
        <div className="staking-bottom">
          <SmartTooltip content={`Active Stakes Portfolio\nDetailed list of all your individual staking contracts.`}>
            <div><StakingBox stakes={stakes} signer={signer} /></div>
          </SmartTooltip>
        </div>
      </main>
    </div>
  );
};

export default StakingPage;
