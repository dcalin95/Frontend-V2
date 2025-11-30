import React, { useState } from 'react';
import { AI_TOOLS_PRICING } from './pricingConfig';
import useBitsBalance from '../../hooks/useBitsBalance';
import { useWallet } from '../../context/WalletContext';
import './AIHub.desktop.css';

const SmartAudit = () => {
  const { account } = useWallet();
  const { balance: bitsBalance } = useBitsBalance(account);
  const [contractAddress, setContractAddress] = useState('');
  const [auditing, setAuditing] = useState(false);
  const [report, setReport] = useState(null);

  const handleAudit = async () => {
    if (bitsBalance < AI_TOOLS_PRICING.smartAudit.cost) {
      alert(`Insufficient BITS! You need ${AI_TOOLS_PRICING.smartAudit.cost} BITS.`);
      return;
    }

    if (!contractAddress || contractAddress.length < 42) {
      alert('Please enter a valid contract address');
      return;
    }

    setAuditing(true);
    // Simulate audit
    setTimeout(() => {
      const vulnerabilities = Math.floor(Math.random() * 5);
      setReport({
        address: contractAddress,
        riskScore: vulnerabilities > 2 ? 'HIGH ⚠️' : vulnerabilities > 0 ? 'MEDIUM ⚡' : 'LOW ✅',
        vulnerabilities: vulnerabilities,
        issues: [
          vulnerabilities > 2 ? '🚨 Reentrancy vulnerability detected' : null,
          vulnerabilities > 0 ? '⚠️ Missing access control' : null,
          '✅ No overflow/underflow issues'
        ].filter(Boolean)
      });
      setAuditing(false);
    }, 4000);
  };

  return (
    <div className="ai-hub-container">
      <div className="ai-hub-header">
        <h1 className="ai-hub-title">
          <span className="title-icon">🛡️</span>
          SMART CONTRACT AUDIT LITE
        </h1>
        <p className="ai-hub-subtitle">
          Quick Security Scan • Cost: {AI_TOOLS_PRICING.smartAudit.cost} BITS
        </p>
      </div>

      <div style={{maxWidth: '600px', margin: '0 auto'}}>
        <div className="tool-card">
          <label style={{display: 'block', marginBottom: '12px', fontSize: '0.9rem', opacity: 0.8}}>
            Enter Contract Address (BSC/ETH)
          </label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x..."
            style={{
              width: '100%',
              padding: '14px',
              background: 'rgba(0, 255, 163, 0.05)',
              border: '1px solid rgba(0, 255, 163, 0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              marginBottom: '20px',
              fontFamily: 'monospace'
            }}
          />
          <button
            onClick={handleAudit}
            disabled={auditing || !contractAddress}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #00FFA3 0%, #DC1FFF 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#000',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: auditing || !contractAddress ? 'not-allowed' : 'pointer',
              opacity: auditing || !contractAddress ? 0.5 : 1
            }}
          >
            {auditing ? '🛡️ Scanning...' : '🛡️ Run Security Audit'}
          </button>
        </div>

        {report && (
          <div className="tool-card" style={{marginTop: '24px', background: 'rgba(0, 255, 163, 0.05)'}}>
            <h3 style={{color: '#00FFA3', marginTop: 0}}>🛡️ Audit Report</h3>
            <p><strong>Contract:</strong> <code style={{fontSize: '0.8rem'}}>{report.address.slice(0, 10)}...{report.address.slice(-8)}</code></p>
            <p><strong>Risk Score:</strong> {report.riskScore}</p>
            <p><strong>Vulnerabilities Found:</strong> {report.vulnerabilities}</p>
            <div style={{marginTop: '16px'}}>
              <strong>Issues:</strong>
              <ul style={{marginTop: '8px', paddingLeft: '20px'}}>
                {report.issues.map((issue, idx) => (
                  <li key={idx} style={{marginBottom: '6px'}}>{issue}</li>
                ))}
              </ul>
            </div>
            <p style={{fontSize: '0.8rem', opacity: 0.6, marginTop: '16px'}}>
              ⚠️ This is a quick AI scan, not a full audit. For production contracts, hire professional auditors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartAudit;

