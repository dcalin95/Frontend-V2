import React, { useContext, useEffect, useState } from "react";
import WalletContext from "../../context/WalletContext";
import { useStakingData } from "../../Staking/useStakingData";
import StakingSummary from "../../Staking/components/StakingSummary";
import StakingInfoBox from "../../Staking/components/StakingInfoBox";
import StakeFormMobile from "./StakeFormMobile";
import StakingBox from "../../Staking/components/StakingBox";
import ClaimStakesMobile from "./ClaimStakesMobile";
import StakingUSDValue from "../../Staking/components/StakingUSDValue";
import "../StakingPageMobile.css";

const StakingMobile = () => {
  const { signer, walletAddress } = useContext(WalletContext);
  const { stakes } = useStakingData(signer, walletAddress);

  // Container style consistent across all mobile components
  const containerStyle = {
    width: '100%',
    padding: '20px',
    background: 'transparent',
    border: '1px solid rgba(20, 241, 149, 0.3)',
    borderRadius: '16px',
    marginBottom: '15px',
    position: 'relative',
    overflow: 'hidden'
  };

  const glowStyle = {
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: 'radial-gradient(circle, rgba(20,241,149,0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0
  };

  return (
    <div className="mobile-staking-page-wrapper" style={{paddingTop: 0, minHeight: 'auto'}}>
      <div className="staking-layout" style={{width: '100%'}}>
        <main className="staking-main" style={{padding: 0, gap: 0}}>
          
          {/* MOBILE LAYOUT - VERTICAL STACK */}
          <div className="staking-top-row" style={{display: 'flex', flexDirection: 'column', width: '100%', margin: '0 auto'}}>
            
            {/* 1. Summary - Analytics */}
            <div className="ai-container" style={containerStyle}>
              <div style={glowStyle} />
              <div style={{position: 'relative', zIndex: 1}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14f195" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  <h3 style={{margin: 0, fontSize: '16px', color: '#fff'}}>Analytics</h3>
                </div>
                <StakingSummary signer={signer} stakes={stakes} />
              </div>
            </div>

            {/* 2. Info Box - APR & TVL */}
            <div className="ai-container" style={containerStyle}>
              <div style={glowStyle} />
              <div style={{position: 'relative', zIndex: 1}}>
                 <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14f195" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  <h3 style={{margin: 0, fontSize: '16px', color: '#fff'}}>Pool Stats</h3>
                </div>
                <StakingInfoBox stakes={stakes} />
              </div>
            </div>

            {/* 3. USD Value - Personal Balance */}
            <div className="ai-container" style={containerStyle}>
              <div style={glowStyle} />
              <div style={{position: 'relative', zIndex: 1}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14f195" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                  <h3 style={{margin: 0, fontSize: '16px', color: '#fff'}}>Your Balance</h3>
                </div>
                <StakingUSDValue signer={signer} />
              </div>
            </div>

            {/* 4. Stake Form (MOBILE VERSION) */}
            <div className="ai-container" style={{
                ...containerStyle, 
                border: '1px solid rgba(153, 69, 255, 0.5)', // Purple border for action area
                background: 'linear-gradient(180deg, rgba(153, 69, 255, 0.05) 0%, transparent 100%)'
            }}>
              <div style={{position: 'relative', zIndex: 1}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d946ef" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                  <h3 style={{margin: 0, fontSize: '16px', color: '#fff'}}>New Stake</h3>
                </div>
                <StakeFormMobile signer={signer} />
              </div>
            </div>

            {/* 5. Claim/Positions */}
            <div>
              <ClaimStakesMobile signer={signer} />
            </div>
          </div>

          {/* Bottom section - History */}
          <div className="staking-bottom" style={{width: '100%', marginTop: '0'}}>
             <div className="ai-container" style={containerStyle}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14f195" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <h3 style={{margin: 0, fontSize: '16px', color: '#fff'}}>History</h3>
                </div>
                <StakingBox stakes={stakes} signer={signer} />
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StakingMobile;
