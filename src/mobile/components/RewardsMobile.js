import React, { useState, useEffect, useContext } from "react";
import WalletContext from "../../context/WalletContext";
import unifiedRewardsService from "../../services/unifiedRewardsService";
import { toast } from "react-toastify";

const RewardsMobile = ({ walletAddress }) => {
  const { signer } = useContext(WalletContext);
  const [loading, setLoading] = useState(true);
  const [rewardsData, setRewardsData] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      fetchRewards();
    } else {
        setLoading(false);
    }
  }, [walletAddress]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const data = await unifiedRewardsService.getRewardsSummary(walletAddress);
      setRewardsData(data);
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAll = async () => {
    if (!walletAddress || !rewardsData?.totalPending) return;
    
    try {
      setClaiming(true);
      await unifiedRewardsService.claimAllRewards(walletAddress);
      toast.success("Rewards claimed successfully!");
      await fetchRewards(); // Refresh
    } catch (error) {
      console.error("Claim failed:", error);
      toast.error("Claim failed. See console.");
    } finally {
      setClaiming(false);
    }
  };

  const handleCopy = () => {
    const link = `https://bitswapdex.ai/ref/${walletAddress || ''}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.info("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Render loading state
  if (loading && !rewardsData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#14f195' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 15px', borderTopColor: '#14f195' }}></div>
        <p>Analyzing Reward Streams...</p>
      </div>
    );
  }

  const totalPending = rewardsData?.totalPending || 0;
  const totalClaimed = rewardsData?.totalClaimed || 0;
  const referralPending = rewardsData?.byType?.referral?.pending || 0;
  const telegramPending = rewardsData?.byType?.telegram?.pending || 0;

  return (
    <>
      {/* Header */}
      <div className="mobile-payment-option" style={{
        borderColor: 'rgba(20, 241, 149, 0.5)', 
        background: 'rgba(20, 241, 149, 0.05)', 
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '24px' }}>🎁</span>
        <h2 className="mobile-payment-title" style={{
          margin: 0, 
          fontSize: '20px', 
          fontWeight: 'bold', 
          background: 'linear-gradient(90deg, #14f195, #9945ff)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent'
        }}>
          Rewards Center
        </h2>
      </div>

      {/* Main Stats Card - Total Pending */}
      <div className="mobile-payment-option" style={{
        marginBottom: '15px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(20, 241, 149, 0.05) 0%, transparent 100%)',
        border: '1px solid rgba(20, 241, 149, 0.3)'
      }}>
        <div style={{ fontSize: '14px', color: '#a5b4fc', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Total Claimable
        </div>
        <div style={{ 
          fontSize: '36px', 
          fontWeight: 'bold', 
          color: '#fff',
          textShadow: '0 0 20px rgba(20, 241, 149, 0.5)'
        }}>
          {totalPending.toFixed(2)} <span style={{ fontSize: '18px', color: '#14f195' }}>$BITS</span>
        </div>
        
        {totalPending > 0 ? (
          <button 
            onClick={handleClaimAll}
            disabled={claiming}
            style={{
              marginTop: '20px',
              width: '100%',
              padding: '15px',
              background: 'linear-gradient(90deg, #14f195, #00C2FF)',
              border: 'none',
              borderRadius: '12px',
              color: '#000',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: claiming ? 'not-allowed' : 'pointer',
              opacity: claiming ? 0.7 : 1,
              boxShadow: '0 0 15px rgba(20, 241, 149, 0.4)'
            }}
          >
            {claiming ? "Processing..." : "CLAIM ALL REWARDS"}
          </button>
        ) : (
          <div style={{ marginTop: '15px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            No rewards available to claim yet.
          </div>
        )}
      </div>

      {/* Stats Grid - 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
        
        {/* Referral Box */}
        <div className="mobile-payment-option" style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}>
          <span style={{ fontSize: '24px', marginBottom: '5px' }}>👥</span>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Referral</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
            {referralPending.toFixed(0)} <span style={{ fontSize: '10px', color: '#14f195' }}>$BITS</span>
          </div>
        </div>

        {/* Telegram Box */}
        <div className="mobile-payment-option" style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}>
          <span style={{ fontSize: '24px', marginBottom: '5px' }}>✈️</span>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Telegram</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
            {telegramPending.toFixed(0)} <span style={{ fontSize: '10px', color: '#14f195' }}>$BITS</span>
          </div>
        </div>

        {/* Bonus Box */}
        <div className="mobile-payment-option" style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}>
          <span style={{ fontSize: '24px', marginBottom: '5px' }}>⚡</span>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Bonus</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
            0 <span style={{ fontSize: '10px', color: '#14f195' }}>$BITS</span>
          </div>
        </div>

        {/* Total Claimed Box */}
        <div className="mobile-payment-option" style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px', borderColor: 'rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '24px', marginBottom: '5px' }}>✅</span>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Claimed</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)' }}>
            {totalClaimed.toFixed(0)}
          </div>
        </div>

      </div>

      {/* Referral Link Copy (REFACTORED) */}
      <div className="mobile-payment-option" style={{ padding: '20px', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
        <label style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px', display: 'block' }}>Your Invite Link</label>
        
        <div style={{ 
            display: 'flex', 
            width: '100%', 
            background: 'rgba(0,0,0,0.3)', 
            borderRadius: '12px', 
            border: '1px solid rgba(20, 241, 149, 0.3)',
            overflow: 'hidden'
        }}>
            <input 
                type="text" 
                readOnly 
                value={`https://bitswapdex.ai/ref/${walletAddress || 'connect-wallet'}`}
                style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    padding: '12px 15px',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'monospace',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                }}
            />
            <button 
                onClick={handleCopy}
                style={{ 
                    background: copied ? '#14f195' : 'rgba(20, 241, 149, 0.1)', 
                    borderLeft: '1px solid rgba(20, 241, 149, 0.3)',
                    borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                    color: copied ? '#000' : '#14f195', 
                    padding: '0 20px', 
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
            >
                {copied ? 'COPIED!' : 'COPY'}
            </button>
        </div>
        <div style={{fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '5px'}}>
            Share this link to earn 5% from referrals!
        </div>
      </div>
    </>
  );
};

export default RewardsMobile;
