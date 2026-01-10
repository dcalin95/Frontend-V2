/**
 * 📊 SwapPanel Component
 */

import React, { useState, useEffect } from 'react';
import { ArrowDownUp, Settings } from 'lucide-react';
import TokenSelector from './TokenSelector';
import { formatPrice } from '../../utils/formatPrice';
import './SwapPanel.css';

const SwapPanel = ({
  tokenIn = null,
  tokenOut = null,
  tokens = [],
  balances = {},
  onTokenChange = () => {},
  onSwap = () => {},
  walletAddress = null,
  onConnectWallet = () => {}
}) => {
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(null);
  const [slippage, setSlippage] = useState(0.5);

  // Calculate amount out (mock for now)
  useEffect(() => {
    if (amountIn && tokenIn && tokenOut) {
      // Mock calculation - replace with real quote
      const mockPrice = 1.0; // Replace with real price
      const calculated = parseFloat(amountIn) * mockPrice;
      setAmountOut(calculated.toFixed(6));
    } else {
      setAmountOut('');
    }
  }, [amountIn, tokenIn, tokenOut]);

  const handleSwap = () => {
    if (!walletAddress) {
      onConnectWallet();
      return;
    }

    if (!amountIn || !tokenIn || !tokenOut) {
      return;
    }

    onSwap({
      tokenIn,
      tokenOut,
      amountIn: parseFloat(amountIn),
      amountOut: parseFloat(amountOut),
      slippage
    });
  };

  const handleReverse = () => {
    if (tokenIn && tokenOut) {
      onTokenChange(tokenOut, tokenIn);
      setAmountIn(amountOut);
      setAmountOut(amountIn);
    }
  };

  const balanceIn = tokenIn ? balances[tokenIn.symbol] || '0' : '0';
  const balanceOut = tokenOut ? balances[tokenOut.symbol] || '0' : '0';

  return (
    <div className="swap-panel">
      <div className="swap-input-section">
        <div className="input-label">Pay</div>
        <div className="swap-input-container">
          <input
            type="number"
            className="swap-input"
            placeholder="0.00"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
          />
          <button
            className="token-selector-btn"
            onClick={() => setShowTokenSelector('in')}
          >
            {tokenIn ? (
              <>
                {tokenIn.icon && (
                  <img src={tokenIn.icon} alt={tokenIn.symbol} className="token-icon" />
                )}
                <span>{tokenIn.symbol}</span>
              </>
            ) : (
              <span>Select</span>
            )}
          </button>
        </div>
        <div className="input-footer">
          <span className="usd-value">
            ${tokenIn ? formatPrice(parseFloat(amountIn || 0) * (tokenIn.price || 0)) : '0.00'}
          </span>
          <span className="balance">
            Balance: {formatPrice(balanceIn)} {tokenIn?.symbol || ''}
          </span>
        </div>
      </div>

      <button className="swap-reverse-btn" onClick={handleReverse}>
        <ArrowDownUp size={20} />
      </button>

      <div className="swap-input-section">
        <div className="input-label">Receive</div>
        <div className="swap-input-container">
          <input
            type="number"
            className="swap-input"
            placeholder="0.00"
            value={amountOut}
            readOnly
          />
          <button
            className="token-selector-btn"
            onClick={() => setShowTokenSelector('out')}
          >
            {tokenOut ? (
              <>
                {tokenOut.icon && (
                  <img src={tokenOut.icon} alt={tokenOut.symbol} className="token-icon" />
                )}
                <span>{tokenOut.symbol}</span>
              </>
            ) : (
              <span>Select</span>
            )}
          </button>
        </div>
        <div className="input-footer">
          <span className="usd-value">
            ${tokenOut ? formatPrice(parseFloat(amountOut || 0) * (tokenOut.price || 0)) : '0.00'}
          </span>
          <span className="balance">
            Balance: {formatPrice(balanceOut)} {tokenOut?.symbol || ''}
          </span>
        </div>
      </div>

      {!walletAddress ? (
        <button className="swap-button connect" onClick={onConnectWallet}>
          Connect wallet
        </button>
      ) : (
        <button
          className="swap-button"
          onClick={handleSwap}
          disabled={!amountIn || !tokenIn || !tokenOut}
        >
          Swap
        </button>
      )}

      {showTokenSelector && (
        <TokenSelector
          tokens={tokens}
          onSelect={(token) => {
            if (showTokenSelector === 'in') {
              onTokenChange(token, tokenOut);
            } else {
              onTokenChange(tokenIn, token);
            }
            setShowTokenSelector(null);
          }}
          onClose={() => setShowTokenSelector(null)}
        />
      )}
    </div>
  );
};

export default SwapPanel;

