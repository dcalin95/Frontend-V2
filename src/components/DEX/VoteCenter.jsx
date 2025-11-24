import React, { useState } from 'react';
import { ClipboardCheck, FileText, Vote, BarChart2 } from 'lucide-react';
import './DEX.css';
import './VoteCenter.css';

const proposals = [
  {
    id: 1,
    title: 'Enable AI Dynamic Slippage Control',
    description: 'Allow the AI engine to adjust slippage tolerance automatically based on live volatility metrics.',
    status: 'Active',
    progress: 62,
    timeLeft: '2d 14h',
    optionA: 'Yes, use AI Slippage',
    optionB: 'Keep manual control'
  },
  {
    id: 2,
    title: 'Burn 15% of weekly $BITS fees',
    description: 'Adjust the deflationary burn rate from 10% to 15% to increase scarcity.',
    status: 'Queued',
    progress: 0,
    timeLeft: 'Starts in 12h',
    optionA: 'Increase burn to 15%',
    optionB: 'Keep at 10%'
  },
  {
    id: 3,
    title: 'Whitelist new liquidity pair: BITS/ARB',
    description: 'Add support for BITS/ARBITRUM to capture Layer-2 traders.',
    status: 'Completed',
    progress: 100,
    timeLeft: '—',
    result: 'Passed (68% Yes)'
  }
];

const statusClass = (status) => {
  switch (status) {
    case 'Active': return 'vote-status-active';
    case 'Queued': return 'vote-status-queued';
    case 'Completed': return 'vote-status-completed';
    default: return '';
  }
};

const VoteCenter = () => {
  const [selectedProposal, setSelectedProposal] = useState(proposals[0]);

  return (
    <section className="dex-vote-center">
      <header className="dex-section-header">
        <h2 className="section-title">Vote Center</h2>
        <p className="section-subtitle">Shape the future of BitSwapDEX AI. Stake <span className="solana-gradient-text">$BITS</span> to vote.</p>
      </header>

      <div className="vote-layout">
        <aside className="vote-sidebar">
          <h4 className="vote-sidebar-title"><ClipboardCheck size={16}/> Governance Proposals</h4>
          <ul className="vote-proposal-list">
            {proposals.map((proposal) => (
              <li 
                key={proposal.id}
                className={`vote-proposal-item ${selectedProposal.id === proposal.id ? 'active' : ''}`}
                onClick={() => setSelectedProposal(proposal)}
              >
                <div className="proposal-title">{proposal.title}</div>
                <div className={`proposal-status ${statusClass(proposal.status)}`}>{proposal.status}</div>
                <div className="proposal-time">⏱ {proposal.timeLeft}</div>
              </li>
            ))}
          </ul>
        </aside>

        <div className="vote-content">
          <div className="vote-card">
            <div className="vote-card-header">
              <FileText size={18} />
              <div>
                <h3>{selectedProposal.title}</h3>
                <span className={`proposal-status ${statusClass(selectedProposal.status)}`}>{selectedProposal.status}</span>
              </div>
            </div>
            <p className="vote-description">{selectedProposal.description}</p>

            {selectedProposal.status === 'Completed' ? (
              <div className="vote-result">
                <BarChart2 size={18} />
                <span>{selectedProposal.result}</span>
              </div>
            ) : (
              <>
                <div className="vote-progress-bar">
                  <div className="vote-progress" style={{ width: `${selectedProposal.progress}%` }} />
                </div>
                <div className="vote-options">
                  <button className="vote-btn primary">
                    <Vote size={16} /> {selectedProposal.optionA}
                  </button>
                  <button className="vote-btn secondary">
                    {selectedProposal.optionB}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VoteCenter;
