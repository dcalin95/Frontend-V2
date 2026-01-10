/**
 * 📊 TradeHeader Component
 * 
 * Header pentru Trade Page cu pair selector și market stats
 * Similar cu Oxium DEX: https://app.oxium.xyz/trade
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Star, Settings } from 'lucide-react';
import MarketStats from '../MarketStats';
import './TradeHeader.css';

const TradeHeader = ({
  tokenIn = null,
  tokenOut = null,
  tokens = [],
  onPairChange = () => {},
  onConnectWallet = () => {},
  walletAddress = null,
  marketData = null
}) => {
  const [showPairSelector, setShowPairSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('trade_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const searchInputRef = useRef(null);

  // Keyboard shortcut: Ctrl+K pentru search
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowPairSelector(true);
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 100);
      }
      if (e.key === 'Escape' && showPairSelector) {
        setShowPairSelector(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showPairSelector]);

  const toggleFavorite = (pair) => {
    const pairKey = `${pair.tokenIn.symbol}/${pair.tokenOut.symbol}`;
    const newFavorites = favorites.includes(pairKey)
      ? favorites.filter(f => f !== pairKey)
      : [...favorites, pairKey];
    setFavorites(newFavorites);
    localStorage.setItem('trade_favorites', JSON.stringify(newFavorites));
  };

  const isFavorite = (pair) => {
    const pairKey = `${pair.tokenIn.symbol}/${pair.tokenOut.symbol}`;
    return favorites.includes(pairKey);
  };

  const filteredTokens = tokens.filter(token => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      token.symbol.toLowerCase().includes(query) ||
      token.name.toLowerCase().includes(query)
    );
  });

  const handlePairSelect = (selectedTokenIn, selectedTokenOut) => {
    onPairChange(selectedTokenIn, selectedTokenOut);
    setShowPairSelector(false);
    setSearchQuery('');
  };

  return (
    <div className="trade-header">
      <div className="trade-header-top">
        {/* Pair Selector */}
        <div className="pair-selector-container">
          <button
            className="pair-selector-btn"
            onClick={() => setShowPairSelector(!showPairSelector)}
          >
            <div className="pair-display">
              {tokenIn && tokenOut ? (
                <>
                  <div className="pair-tokens">
                    {tokenIn.icon && (
                      <img src={tokenIn.icon} alt={tokenIn.symbol} className="token-icon" />
                    )}
                    {tokenOut.icon && (
                      <img src={tokenOut.icon} alt={tokenOut.symbol} className="token-icon" />
                    )}
                  </div>
                  <div className="pair-info">
                    <div className="pair-symbol">
                      {tokenIn.symbol} / {tokenOut.symbol}
                    </div>
                    <div className="pair-name">{tokenIn.symbol}</div>
                  </div>
                </>
              ) : (
                <div className="pair-placeholder">Select Pair</div>
              )}
            </div>
            <div className="pair-search-hint">
              <Search size={14} />
              <span>Ctrl+K</span>
            </div>
          </button>

          {/* Pair Selector Modal */}
          {showPairSelector && (
            <div className="pair-selector-modal">
              <div className="pair-selector-header">
                <div className="search-container">
                  <Search size={16} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search token..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pair-search-input"
                  />
                  {searchQuery && (
                    <button
                      className="clear-search-btn"
                      onClick={() => setSearchQuery('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  className="close-modal-btn"
                  onClick={() => {
                    setShowPairSelector(false);
                    setSearchQuery('');
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="pair-selector-content">
                {/* Favorites */}
                {favorites.length > 0 && (
                  <div className="favorites-section">
                    <div className="section-title">Favorites</div>
                    <div className="pairs-grid">
                      {tokens
                        .filter(token => {
                          const pairKey = `${token.symbol}/${tokenOut?.symbol || 'USDT'}`;
                          return favorites.includes(pairKey);
                        })
                        .map(token => (
                          <div
                            key={token.symbol}
                            className="pair-item favorite"
                            onClick={() => handlePairSelect(token, tokenOut || tokens[1])}
                          >
                            <div className="pair-item-tokens">
                              {token.icon && (
                                <img src={token.icon} alt={token.symbol} className="token-icon-small" />
                              )}
                              {tokenOut?.icon && (
                                <img src={tokenOut.icon} alt={tokenOut.symbol} className="token-icon-small" />
                              )}
                            </div>
                            <div className="pair-item-symbol">
                              {token.symbol}/{tokenOut?.symbol || 'USDT'}
                            </div>
                            <button
                              className="favorite-btn active"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite({ tokenIn: token, tokenOut: tokenOut || tokens[1] });
                              }}
                            >
                              <Star size={14} fill="currentColor" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* All Tokens */}
                <div className="all-tokens-section">
                  <div className="section-title">All Tokens</div>
                  <div className="pairs-list">
                    {filteredTokens.map((token) => (
                      <div
                        key={token.symbol}
                        className="pair-item"
                        onClick={() => handlePairSelect(token, tokenOut || tokens[1])}
                      >
                        <div className="pair-item-tokens">
                          {token.icon && (
                            <img src={token.icon} alt={token.symbol} className="token-icon-small" />
                          )}
                          {tokenOut?.icon && (
                            <img src={tokenOut.icon} alt={tokenOut.symbol} className="token-icon-small" />
                          )}
                        </div>
                        <div className="pair-item-info">
                          <div className="pair-item-symbol">
                            {token.symbol}/{tokenOut?.symbol || 'USDT'}
                          </div>
                          <div className="pair-item-name">{token.name}</div>
                        </div>
                        <button
                          className={`favorite-btn ${isFavorite({ tokenIn: token, tokenOut: tokenOut || tokens[1] }) ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite({ tokenIn: token, tokenOut: tokenOut || tokens[1] });
                          }}
                        >
                          <Star size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Market Stats */}
        {marketData && <MarketStats marketData={marketData} />}

        {/* Actions */}
        <div className="trade-header-actions">
          <button className="header-action-btn" title="Settings">
            <Settings size={18} />
          </button>
          {!walletAddress ? (
            <button className="connect-wallet-btn" onClick={onConnectWallet}>
              Connect Wallet
            </button>
          ) : (
            <div className="wallet-info">
              <div className="wallet-address">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeHeader;

