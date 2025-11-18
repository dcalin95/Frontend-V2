import React, { useContext, useState } from 'react';
import { useBoosterSummary } from '../../Presale/BoosterSummary/useBoosterSummary';
import WalletContext from '../../context/WalletContext';
import Icon from '../../assets/icons/Icon';
import '../Mobile.css';

const BoosterSummaryMobile = () => {
  const { walletAddress, connectWallet } = useContext(WalletContext);
  const { loading, data } = useBoosterSummary();
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatUSD = (value) => {
    if (value === null || isNaN(value)) return "N/A";
    return `$${Number(value).toFixed(2)}`;
  };

  const formatBITS = (value) => {
    if (value === null || isNaN(value)) return "0.00";
    return Number(value).toFixed(2);
  };

  if (!walletAddress) {
    return (
      <div className="mobile-booster-summary">
        <div className="mobile-booster-connect">
          <Icon name="robot" size="xlarge" animate="float" />
          <h3>AI Wallet Connection</h3>
          <p>Connect wallet for AI analytics</p>
          <button onClick={connectWallet} className="mobile-booster-connect-btn">
            <Icon name="wallet" size="small" />
            <span>Connect Wallet</span>
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mobile-booster-summary">
        <div className="mobile-booster-loading">
          <Icon name="loading" size="xlarge" animate="spin" />
          <p>AI Analyzing Portfolio...</p>
        </div>
      </div>
    );
  }

  const totalBitsIncludingBonuses =
    (data.totalBits || 0) +
    (data.referralBonus || 0) +
    (data.telegramBonus || 0) +
    (data.bonusCalculatedLocally || 0);

  const totalInvestmentValueUSD = totalBitsIncludingBonuses * (data.currentPrice || 0);

  return (
    <div className="mobile-booster-summary">
      <div className="mobile-booster-header">
        <Icon name="chart" size="large" animate="pulse" />
        <h3>Portfolio Summary</h3>
      </div>

      {/* Total Value Card */}
      <div className="mobile-booster-total-card">
        <div className="mobile-booster-total-label">Total Portfolio Value</div>
        <div className="mobile-booster-total-value">{formatBITS(totalBitsIncludingBonuses)} $BITS</div>
        <div className="mobile-booster-total-usd">{formatUSD(totalInvestmentValueUSD)}</div>
      </div>

      {/* Accordion Sections */}
      <div className="mobile-booster-accordion">
        {/* Base Investment */}
        <div className="mobile-booster-section">
          <button 
            className="mobile-booster-section-header"
            onClick={() => toggleSection('base')}
          >
            <div className="mobile-booster-section-title">
              <Icon name="crypto" size="small" />
              <span>Base Investment</span>
            </div>
            <Icon 
              name={expandedSection === 'base' ? 'chevron-up' : 'chevron-down'} 
              size="small" 
            />
          </button>
          {expandedSection === 'base' && (
            <div className="mobile-booster-section-content">
              <div className="mobile-booster-row">
                <span>Total $BITS:</span>
                <span className="mobile-booster-value">{formatBITS(data.totalBits)}</span>
              </div>
              <div className="mobile-booster-row">
                <span>Invested:</span>
                <span className="mobile-booster-value">{formatUSD(data.realInvestedUSD)}</span>
              </div>
              <div className="mobile-booster-row">
                <span>Current Price:</span>
                <span className="mobile-booster-value">{formatUSD(data.currentPrice)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bonuses */}
        <div className="mobile-booster-section">
          <button 
            className="mobile-booster-section-header"
            onClick={() => toggleSection('bonuses')}
          >
            <div className="mobile-booster-section-title">
              <Icon name="gift" size="small" />
              <span>Bonuses</span>
            </div>
            <Icon 
              name={expandedSection === 'bonuses' ? 'chevron-up' : 'chevron-down'} 
              size="small" 
            />
          </button>
          {expandedSection === 'bonuses' && (
            <div className="mobile-booster-section-content">
              <div className="mobile-booster-row">
                <span>Referral Bonus:</span>
                <span className="mobile-booster-value">{formatBITS(data.referralBonus)}</span>
              </div>
              <div className="mobile-booster-row">
                <span>Telegram Bonus:</span>
                <span className="mobile-booster-value">{formatBITS(data.telegramBonus)}</span>
              </div>
              <div className="mobile-booster-row">
                <span>Local Bonus:</span>
                <span className="mobile-booster-value">{formatBITS(data.bonusCalculatedLocally)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Stats */}
        <div className="mobile-booster-section">
          <button 
            className="mobile-booster-section-header"
            onClick={() => toggleSection('stats')}
          >
            <div className="mobile-booster-section-title">
              <Icon name="receipt" size="small" />
              <span>Transaction Stats</span>
            </div>
            <Icon 
              name={expandedSection === 'stats' ? 'chevron-up' : 'chevron-down'} 
              size="small" 
            />
          </button>
          {expandedSection === 'stats' && (
            <div className="mobile-booster-section-content">
              <div className="mobile-booster-row">
                <span>Total Transactions:</span>
                <span className="mobile-booster-value">{data.transactionCount || 0}</span>
              </div>
              <div className="mobile-booster-row">
                <span>Average Buy:</span>
                <span className="mobile-booster-value">
                  {formatBITS((data.totalBits || 0) / Math.max(1, data.transactionCount || 1))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoosterSummaryMobile;

