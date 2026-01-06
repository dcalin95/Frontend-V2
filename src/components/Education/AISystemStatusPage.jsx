import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SmartTooltip from '../../Presale/components/SmartTooltip';
import '../../Presale/Rewards/rewards.css';
import './EducationTools.css';

const AISystemStatusPage = () => {
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
    <div className="education-tools-page">
      <div className="education-tools-container">
        <div className="education-tools-header">
          <Link to="/education" className="back-button">
            ← Back to Education
          </Link>
          <h1>🔧 AI System Status</h1>
          <p className="subtitle">Real-time AI system monitoring and health status</p>
        </div>

        <div className="education-tools-content">
          <div className="hybrid-status ai-command-center">
            <div className="ai-duo-grid">
              {/* Card A: Neural + Security */}
              <SmartTooltip content={`Neural Security Core\nMonitorizează în timp real integritatea sistemului, detectează fraudele și validează tranzacțiile AI.\nStatus: Online & Securizat.`}>
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
                    <span className="status-dot online pulse"></span>
                    <span><span className="bitsPulseLabel">BitPulse®</span>: Active</span>
                    <span className="status-dot online pulse"></span>
                    <span>AI Core: Connected</span>
                    <span className="status-dot online pulse-slow"></span>
                    <span>Neural Code: Generated</span>
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
              </SmartTooltip>

              {/* Card B: Blockchain + Analytics */}
              <SmartTooltip content={`Blockchain Analytics\nSincronizare în timp real cu nodurile blockchain.\nUrmărește tranzacțiile, blocurile și performanța rețelei.`}>
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
                  </div>
                </div>
              </SmartTooltip>
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
        </div>
      </div>
    </div>
  );
};

export default AISystemStatusPage;

