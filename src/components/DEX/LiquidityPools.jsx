import React, { useContext } from 'react';
import { toast } from 'react-toastify';
import WalletContext from '../../context/WalletContext';
import './DEX.css';
import './LiquidityPools.css';
import bitsLogo from '../../assets/logo.png';
import usdtLogo from '../../assets/icons/tether-usdt-logo.png';

const pools = [
  { id: 1, pair: 'BITS/USDT', apy: '145.2%', tvl: '$12.5M', risk: 'Medium', icon1: bitsLogo, icon2: usdtLogo },
  { id: 2, pair: 'BTC/ETH', apy: '12.4%', tvl: '$450M', risk: 'Low', icon1: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png', icon2: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  { id: 3, pair: 'SOL/USDC', apy: '24.8%', tvl: '$85M', risk: 'Medium', icon1: 'https://cryptologos.cc/logos/solana-sol-logo.png', icon2: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' },
  { id: 4, pair: 'BITS/SOL', apy: '280.5%', tvl: '$5.2M', risk: 'High', icon1: bitsLogo, icon2: 'https://cryptologos.cc/logos/solana-sol-logo.png' }
];

const renderTokenLabel = (token) => {
  const trimmed = token.trim();
  if (trimmed.toUpperCase() === 'BITS') {
    return <span className="solana-gradient-text">{trimmed}</span>;
  }
  return trimmed;
};

const LiquidityPools = ({ layout = 'column' }) => {
  const { walletAddress, connectWallet } = useContext(WalletContext);

  const handleDeposit = (pair) => {
      if (!walletAddress) {
          toast.info('Please connect your wallet first');
          connectWallet();
          return;
      }
      toast.success(`Opening liquidity position for ${pair}...`);
      // Here we would trigger the Router Contract addLiquidity function
  };

  return (
    <section className={`dex-pools-container layout-${layout}`}>
        <header className="dex-section-header">
            <h2 className="section-title">Liquidity Pools</h2>
            <p className="section-subtitle">Provide liquidity & earn AI-optimized fees.</p>
        </header>

        <div className={`dex-pools-grid ${layout}`}
             style={{ display: 'grid', gap: '20px', gridTemplateColumns: layout === 'grid' ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr' }}>
            {pools.map((pool) => {
                const [base, quote] = pool.pair.split('/');
                return (
                <div key={pool.id} className="dex-pool-card">
                    <div className="dex-pool-header">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="dex-pool-icons">
                                <img src={pool.icon1} alt={base} />
                                <img src={pool.icon2} alt={quote} />
                            </div>
                            <span className="dex-pool-name">{renderTokenLabel(base)} / {renderTokenLabel(quote)}</span>
                        </div>
                        <span className={`dex-risk-badge risk-${pool.risk.toLowerCase()}`}>{pool.risk} Risk</span>
                    </div>

                    <div className="dex-pool-stats">
                        <div className="dex-stat-item">
                            <span className="dex-stat-label">APY</span>
                            <span className="dex-stat-val dex-apy-val">{pool.apy}</span>
                        </div>
                        <div className="dex-stat-item">
                            <span className="dex-stat-label">TVL</span>
                            <span className="dex-stat-val">{pool.tvl}</span>
                        </div>
                    </div>

                    <button 
                        className="dex-deposit-btn"
                        onClick={() => handleDeposit(pool.pair)}
                    >
                        {walletAddress ? 'Deposit Liquidity' : 'Connect Wallet'}
                    </button>
                </div>
                );
            })}
        </div>
    </section>
  );
};

export default LiquidityPools;