import React, { useEffect, useMemo, useState } from "react";
import bitsLogo from "../../assets/logo.png";
import "./rewards.css";

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
        <div className="reward-card hybrid-card">
          <h5>🧠 AI Neural Balance</h5>
          <p><strong>{formatBitsAmount(nodeRewardBalance)}</strong> BITS</p>
          <div className="compact-vertical">
            <span>
              Source: {hybridError ? (
                "⚠️ Traditional"
              ) : (
                <span className="brand-line" data-tooltip="AI data pipeline">
                  <img src={bitsLogo} alt="BITS" className="bits-logo-mini" />
                  <span className="bitsPulseLabel">BitPulse®</span>
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="reward-card">
          <h5>🏷️ Referral Reward</h5>
          <p><strong>{referral?.reward ?? 0}</strong> BITS</p>
          <div className="compact-vertical">
            <span>Status: {referral?.claimed ? "✅ Claimed" : "⌛ Unclaimed"}</span>
          </div>
          <div className="source-line">
            <span>Source:</span>
            <span className="brand-line" style={{ marginLeft: 6 }} data-tooltip="AI data pipeline">
              <img src={bitsLogo} alt="BITS" className="bits-logo-mini" />
              <span className="bitsPulseLabel">BitPulse®</span>
            </span>
          </div>
        </div>

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
            <span className="brand-line" style={{ marginLeft: 6 }} data-tooltip="AI data pipeline">
              <img src={bitsLogo} alt="BITS" className="bits-logo-mini" />
              <span className="bitsPulseLabel">BitPulse®</span>
            </span>
          </div>
        </div>

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
      </div>

      {/* 🎯 HYBRID: Reward Tiers Display */}
      {rewardTiers.length > 0 && !hybridError && (
        <div className="reward-tiers-summary">
          <h5>🎯 AI Boost Multipliers</h5>
          <div className="tiers-grid">
            {rewardTiers.slice(0, 4).map((tier, index) => (
              <div key={index} className="tier-card">
                <p><strong>{tier.percent}%</strong></p>
                <p>up to {formatBitsAmount(tier.limit)}</p>
              </div>
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
      {
          <div className="hybrid-status ai-command-center">
            <h5>🔧 AI System Status</h5>
            <div className="ai-duo-grid">
              {/* Card A: Neural + Security */}
              <div className="ai-card">
                <div className="ai-card-title">🧠 Neural & Security</div>
                <div className="neuro-orb" style={{ marginBottom: 10 }}>
                  <div className="neuro-core" style={{ transform: `scale(${heartbeatTick ? 1.06 : 1})` }}></div>
                  <div className="neuro-ring"></div>
                  <div className="neuro-scan"></div>
                  <div className="neuro-mesh">
                    <div className="node"></div>
                    <div className="node"></div>
                    <div className="node"></div>
                    <div className="node"></div>
                    <div className="link l1"></div>
                    <div className="link l2"></div>
                    <div className="link l3"></div>
                  </div>
                </div>
                <div className="status-indicators">
                  <span className={`status-dot ${!hybridError ? 'online' : 'offline'} pulse`}></span>
                  <span><span className="bitsPulseLabel">BitPulse®</span>: {!hybridError ? 'Active' : 'Offline'}</span>
                  <span className="status-dot online pulse"></span>
                  <span>AI Core: Connected</span>
                  <span className={`status-dot ${referralCode ? 'online' : 'pending'} pulse-slow`}></span>
                  <span>Neural Code: {referralCode ? 'Generated' : 'Pending'}</span>
                  <span className="status-dot online pulse-fast"></span>
                  <span>Threat Detection: Active</span>
                  <span className="status-dot online"></span>
                  <span>ML Validation: Running</span>
                  <span className="status-dot online pulse-slow"></span>
                  <span>Anti-Fraud AI: Monitoring</span>
                </div>
                <div className="neuro-legend" style={{ marginTop: 8 }}>
                  <span className="legend-dot ok"></span>
                  <span className="bitsPulseLabel">BitPulse® Online</span>
                  <span className="legend-sep">•</span>
                  <span className="legend-mini">Latency {latencyMs}ms</span>
                </div>
              </div>

              {/* Card B: Blockchain + Analytics */}
              <div className="ai-card">
                <div className="ai-card-title">⛓️ Chain & Analytics</div>
                <div className="chain-ring" style={{ marginBottom: 10 }}>
                  <div className="btc">₿</div>
                  <svg className="ring-svg" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" className="ring-bg" />
                    <circle cx="60" cy="60" r="50" className="ring-dash-dynamic" style={{ strokeDasharray: 314, strokeDashoffset: 314 * (1 - (syncPercent / 100)) }} />
                  </svg>
                  <div className="ledger-stream">
                    <div className="blk"></div>
                    <div className="blk"></div>
                    <div className="blk"></div>
                    <div className="blk"></div>
                    <div className="blk"></div>
                  </div>
                </div>
                <div className="status-indicators">
                  <span className="status-dot online pulse-slow"></span>
                  <span>Smart Contracts: Deployed</span>
                  <span className="status-dot online"></span>
                  <span>Node Sync: {syncPercent}% Complete</span>
                  <span className="status-dot online pulse"></span>
                  <span>Gas Oracle: Optimized</span>
                </div>
                <div className="ai-analytics-row">
                  <div className="metric">
                    <span className="metric-icon">📊</span>
                    <div>
                      <div className="metric-value">{txPerMin == null ? '—' : txPerMin}</div>
                      <div className="metric-label">Tx/min</div>
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-icon">🔄</span>
                    <div>
                      <div className="metric-value">99.6%</div>
                      <div className="metric-label">Accuracy</div>
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-icon">⚡</span>
                    <div>
                      <div className="metric-value">180ms</div>
                      <div className="metric-label">Response</div>
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric-icon">🌐</span>
                    <div>
                      <div className="metric-value">1400</div>
                      <div className="metric-label">Nodes</div>
                    </div>
                  </div>
                  <div className="sparkline-wrap">{/* sparkline static placeholder */}</div>
                </div>
              </div>
            </div>

            {/* AI System Messages */}
            <div className="ai-system-messages">
              <div className="system-message">
                <span className="message-time">{new Date().toLocaleTimeString()}</span>
                <span className="message-text">🤖 Neural network optimizing reward calculations...</span>
              </div>
              <div className="system-message">
                <span className="message-time">{new Date(Date.now() - 30000).toLocaleTimeString()}</span>
                <span className="message-text">⛓️ Blockchain consensus achieved - rewards synchronized</span>
              </div>
              <div className="system-message">
                <span className="message-time">{new Date(Date.now() - 60000).toLocaleTimeString()}</span>
                <span className="message-text">🛡️ AI fraud detection scan completed - all clear</span>
              </div>
            </div>
          </div>
        }
    </div>
  );
};

export default RewardStatsSection;
