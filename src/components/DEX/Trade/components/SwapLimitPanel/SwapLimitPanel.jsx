/**
 * 📊 SwapLimitPanel Component
 * 
 * Swap și Limit order panel
 * Similar cu Oxium DEX
 */

import React, { useState } from 'react';
import SwapPanel from './SwapPanel';
import LimitPanel from './LimitPanel';
import './SwapLimitPanel.css';

const SwapLimitPanel = ({
  tokenIn = null,
  tokenOut = null,
  tokens = [],
  balances = {},
  marketData = null,
  onTokenChange = () => {},
  onSwap = () => {},
  onLimitOrder = () => {},
  walletAddress = null,
  onConnectWallet = () => {}
}) => {
  const [activeTab, setActiveTab] = useState('swap');

  return (
    <div className="swap-limit-panel">
      <div className="panel-tabs">
        <button
          className={`panel-tab ${activeTab === 'swap' ? 'active' : ''}`}
          onClick={() => setActiveTab('swap')}
        >
          Swap
        </button>
        <button
          className={`panel-tab ${activeTab === 'limit' ? 'active' : ''}`}
          onClick={() => setActiveTab('limit')}
        >
          Limit
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'swap' ? (
          <SwapPanel
            tokenIn={tokenIn}
            tokenOut={tokenOut}
            tokens={tokens}
            balances={balances}
            marketData={marketData}
            onTokenChange={onTokenChange}
            onSwap={onSwap}
            walletAddress={walletAddress}
            onConnectWallet={onConnectWallet}
          />
        ) : (
          <LimitPanel
            tokenIn={tokenIn}
            tokenOut={tokenOut}
            tokens={tokens}
            balances={balances}
            onTokenChange={onTokenChange}
            onLimitOrder={onLimitOrder}
            walletAddress={walletAddress}
            onConnectWallet={onConnectWallet}
          />
        )}
      </div>
    </div>
  );
};

export default SwapLimitPanel;

