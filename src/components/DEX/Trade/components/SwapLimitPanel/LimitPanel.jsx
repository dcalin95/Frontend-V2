/**
 * 📊 LimitPanel Component
 */

import React, { useState } from 'react';
import TokenSelector from './TokenSelector';
import { formatPrice } from '../../utils/formatPrice';
import './LimitPanel.css';

const LimitPanel = ({
  tokenIn = null,
  tokenOut = null,
  tokens = [],
  balances = {},
  onTokenChange = () => {},
  onLimitOrder = () => {},
  walletAddress = null,
  onConnectWallet = () => {}
}) => {
  const [orderType, setOrderType] = useState('buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [expiry, setExpiry] = useState('7'); // days
  const [showTokenSelector, setShowTokenSelector] = useState(null);

  const total = price && amount ? parseFloat(price) * parseFloat(amount) : 0;
  const balance = orderType === 'buy' 
    ? (tokenOut ? balances[tokenOut.symbol] || '0' : '0')
    : (tokenIn ? balances[tokenIn.symbol] || '0' : '0');

  const handlePlaceOrder = () => {
    if (!walletAddress) {
      onConnectWallet();
      return;
    }

    if (!price || !amount || !tokenIn || !tokenOut) {
      return;
    }

    onLimitOrder({
      orderType,
      tokenIn,
      tokenOut,
      price: parseFloat(price),
      amount: parseFloat(amount),
      total,
      expiry: parseInt(expiry)
    });
  };

  return (
    <div className="limit-panel">
      <div className="order-type-selector">
        <button
          className={`order-type-btn ${orderType === 'buy' ? 'active buy' : ''}`}
          onClick={() => setOrderType('buy')}
        >
          Buy
        </button>
        <button
          className={`order-type-btn ${orderType === 'sell' ? 'active sell' : ''}`}
          onClick={() => setOrderType('sell')}
        >
          Sell
        </button>
      </div>

      <div className="limit-input-section">
        <div className="input-label">Price</div>
        <div className="limit-input-container">
          <input
            type="number"
            className="limit-input"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <span className="input-suffix">{tokenOut?.symbol || 'USDT'}</span>
        </div>
      </div>

      <div className="limit-input-section">
        <div className="input-label">Amount</div>
        <div className="limit-input-container">
          <input
            type="number"
            className="limit-input"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            className="token-selector-btn"
            onClick={() => setShowTokenSelector(orderType === 'buy' ? 'out' : 'in')}
          >
            {(orderType === 'buy' ? tokenOut : tokenIn) ? (
              <>
                {(orderType === 'buy' ? tokenOut : tokenIn)?.icon && (
                  <img
                    src={(orderType === 'buy' ? tokenOut : tokenIn).icon}
                    alt={(orderType === 'buy' ? tokenOut : tokenIn).symbol}
                    className="token-icon"
                  />
                )}
                <span>{(orderType === 'buy' ? tokenOut : tokenIn).symbol}</span>
              </>
            ) : (
              <span>Select</span>
            )}
          </button>
        </div>
        <div className="input-footer">
          <span className="balance">
            Balance: {formatPrice(balance)} {(orderType === 'buy' ? tokenOut : tokenIn)?.symbol || ''}
          </span>
        </div>
      </div>

      <div className="limit-input-section">
        <div className="input-label">Total</div>
        <div className="limit-input-container">
          <input
            type="number"
            className="limit-input"
            placeholder="0.00"
            value={total || ''}
            readOnly
          />
          <span className="input-suffix">{tokenOut?.symbol || 'USDT'}</span>
        </div>
      </div>

      <div className="limit-input-section">
        <div className="input-label">Expiry</div>
        <select
          className="expiry-select"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
        >
          <option value="1">1 day</option>
          <option value="3">3 days</option>
          <option value="7">7 days</option>
          <option value="30">30 days</option>
        </select>
      </div>

      {!walletAddress ? (
        <button className="limit-button connect" onClick={onConnectWallet}>
          Connect wallet
        </button>
      ) : (
        <button
          className="limit-button"
          onClick={handlePlaceOrder}
          disabled={!price || !amount || !tokenIn || !tokenOut}
        >
          Place {orderType === 'buy' ? 'Buy' : 'Sell'} Order
        </button>
      )}

      {showTokenSelector && (
        <TokenSelector
          tokens={tokens}
          onSelect={(token) => {
            if (orderType === 'buy') {
              onTokenChange(tokenIn, token);
            } else {
              onTokenChange(token, tokenOut);
            }
            setShowTokenSelector(null);
          }}
          onClose={() => setShowTokenSelector(null)}
        />
      )}
    </div>
  );
};

export default LimitPanel;

