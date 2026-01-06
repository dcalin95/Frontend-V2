import React, { useEffect, useMemo, useState } from "react";
import bitsLogo from "../../assets/logo.png";
import "./rewards.css";
import SmartTooltip from "../components/SmartTooltip"; // Import SmartTooltip

const RewardStatsSection = ({ 
  referral, 
  telegram, 
  referralCode, 
  nodeRewardBalance = "0", 
  rewardTiers = [], 
  hybridError = null 
}) => {
  const formatBitsAmount = (amount, decimals = 4) => {
    const num = parseFloat(amount || 0);
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    return num.toFixed(decimals);
  };

  // Live NeuroChain visuals: heartbeat (1 Hz), sync percent (98.4–99.6%), latency (160–200ms)
  const [heartbeatTick, setHeartbeatTick] = useState(false);
  const [syncPercent, setSyncPercent] = useState(99.0);
  const [latencyMs, setLatencyMs] = useState(180);
  const [txPerMin, setTxPerMin] = useState(null);
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartbeatTick((v) => !v);
      const t = Date.now() / 1000;
      const p = 99 + 0.6 * Math.sin(t * 0.6); // 98.4 – 99.6
      setSyncPercent(parseFloat(p.toFixed(1)));
      const l = 180 + 20 * Math.sin(t * 1.2); // ~160–200ms
      setLatencyMs(Math.round(l));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Optional: read Tx/min from a real endpoint when available (read-only)
  // Configure via window.__BITS_ENDPOINTS__.txPerMinute or env-injected global
  useEffect(() => {
    let stop = false;
    const fetchTx = async () => {
      try {
        const url = window.__BITS_ENDPOINTS__?.txPerMinute;
        if (!url) return; // silently skip if not configured
        const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
        if (!res.ok) throw new Error('tx endpoint failed');
        const data = await res.json();
        if (!stop) setTxPerMin(Number(data?.txPerMinute ?? data?.tps ?? 0));
      } catch (e) {
        // ignore errors; UI remains with placeholder
      }
    };
    fetchTx();
    const id = setInterval(fetchTx, 15000);
    return () => { stop = true; clearInterval(id); };
  }, []);

  return (
    <div className="reward-stats-section">
      <h4>📊 AI Rewards Analytics</h4>

      <p>📢 Invite friends and earn $BITS based on their activity on Telegram and Presale!</p>

      <div className="reward-stats-grid">
        {/* 🎯 HYBRID: Node.sol Balance */}
        <SmartTooltip content={`AI Neural Balance\nRecompense acumulate direct pe contractul Node.sol din activitățile rețelei neuronale.\nAceste fonduri sunt verificate și securizate de AI.`}>
        <div className="reward-card hybrid-card">
          <h5>🧠 AI Neural Balance</h5>
          <p><strong>{formatBitsAmount(nodeRewardBalance)}</strong> BITS</p>
          <div className="compact-vertical">
            <span>
              Source: {hybridError ? (
                "⚠️ Traditional"
              ) : (
                <span className="brand-line">
                  <img src={bitsLogo} alt="BITS" className="bits-logo-mini" />
                  <span className="bitsPulseLabel">BitPulse®</span>
                </span>
              )}
            </span>
          </div>
        </div>
        </SmartTooltip>

        <SmartTooltip content={`Referral Reward\nBonusuri câștigate din achizițiile prietenilor invitați.\nValoarea depinde de suma investită de aceștia.`}>
        <div className="reward-card">
          <h5>🏷️ Referral Reward</h5>
          <p><strong>{referral?.reward ?? 0}</strong> BITS</p>
          <div className="compact-vertical">
            <span>Status: {referral?.claimed ? "✅ Claimed" : "⌛ Unclaimed"}</span>
          </div>
          <div className="source-line">
            <span>Source:</span>
            <span className="brand-line" style={{ marginLeft: 6 }}>
              <img src={bitsLogo} alt="BITS" className="bits-logo-mini" />
              <span className="bitsPulseLabel">BitPulse®</span>
            </span>
          </div>
        </div>
        </SmartTooltip>

        <SmartTooltip content={`Telegram Activity\nRecompense pentru activitatea ta în comunitatea Telegram.\nCalculat pe baza timpului și a mesajelor trimise.`}>
        <div className="reward-card">
          <h5>💬 Telegram Activity</h5>
          <p><strong>{telegram?.reward ?? 0}</strong> BITS</p>
          {telegram?.investigationData ? (
            (() => {
              const statusFull = telegram.investigationData.milestoneProgress || '';
              const cut = statusFull.indexOf('(');
              const statusShort = cut > 0 ? statusFull.slice(0, cut).trim() : statusFull;
              return (
                <div className="compact-vertical" aria-label="Telegram metrics">
                  <span>⏱️ Time: {telegram.investigationData.totalHours}h</span>
                  <span>🎯 Status: {statusShort}</span>
                  <span>📊 Expected: {telegram.investigationData.expectedReward} BITS</span>
                </div>
              );
            })()
          ) : (
            <p>Eligible? {telegram?.reward > 0 ? "✅ Yes" : "❌ No"}</p>
          )}
          <div className="source-line">
            <span>Source:</span>
            <span className="brand-line" style={{ marginLeft: 6 }}>
              <img src={bitsLogo} alt="BITS" className="bits-logo-mini" />
              <span className="bitsPulseLabel">BitPulse®</span>
            </span>
          </div>
        </div>
        </SmartTooltip>

        <SmartTooltip content={`AI Invite Code\nCodul tău unic generat de rețeaua neuronală.\nDistribuie-l pentru a câștiga bonusuri suplimentare.`}>
        <div className="reward-card">
          <h5>🚀 AI Invite Code</h5>
          <p>
            {referralCode ? (
              <code style={{ color: referralCode.startsWith('NODE-') ? '#00ff00' : '#ffcc00' }}>
                {referralCode}
              </code>
            ) : (
              <em style={{ color: '#ff6666' }}>❌ Not generated</em>
            )}
          </p>
          <div className="compact-vertical">
            <span>
              {referralCode?.startsWith('NODE-') ? 'Origin: 🧠 AI Neural Generated' : 
               referralCode?.startsWith('CODE-') ? 'Origin: 📋 Standard Generated' : 
               '⚠️ Generate code above'}
            </span>
          </div>
        </div>
        </SmartTooltip>
      </div>

      {/* 🎯 HYBRID: Reward Tiers Display */}
      {rewardTiers.length > 0 && !hybridError && (
        <div className="reward-tiers-summary">
          <h5>🎯 AI Boost Multipliers</h5>
          <div className="tiers-grid">
            {rewardTiers.slice(0, 4).map((tier, index) => (
              <SmartTooltip key={index} content={`Tier ${index + 1} Boost\nPrimești +${tier.percent}% bonus pentru primele ${formatBitsAmount(tier.limit)} BITS acumulate.`}>
              <div className="tier-card">
                <p><strong>{tier.percent}%</strong></p>
                <p>up to {formatBitsAmount(tier.limit)}</p>
              </div>
              </SmartTooltip>
            ))}
          </div>
        </div>
      )}

      {/* 🔧 AI BLOCKCHAIN STATUS - Enhanced (2 cards) */}
      {
        /* Hooks must be top-level: define simulated metrics here */
      }
      {(() => null)()}
      {
        /* Sim data hooks */
      }
      {
        /* eslint-disable react-hooks/rules-of-hooks */
      }
      {
        null
      }
      {
        /* metrics state */
      }
      {
        /* eslint-enable react-hooks/rules-of-hooks */
      }
      {/* AI System Status removed - moved to Education page (/education/ai-system-status) */}
    </div>
  );
};

export default RewardStatsSection;
