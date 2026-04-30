/**
 * TokenSelector Component - Token Selection Dropdown
 *
 * Îmbunătățit pentru selecția token-urilor:
 * - Search functionality
 * - Token logos
 * - Popular tokens section
 * - Recent tokens
 * - Binance/PancakeSwap style
 *
 * @module TokenSelector
 */

import React, { useState, useMemo } from 'react';
import { Search, X, TrendingUp, ChevronDown, Check } from 'lucide-react';
import TokenLogo from './TokenLogo';
import '../../styles/components/token-selector.css';

const POPULAR_TOKENS = ['BTC', 'ETH', 'BNB', 'USDT', 'USDC', 'SOL', 'STX', 'MATIC', 'AVAX'];

const TokenSelector = ({
  tokens = [],
  selectedToken = null,
  onTokenSelect,
  showSearch = true,
  showPopular = true,
  placeholder = 'Select token',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedTokenData = tokens.find(t => t.symbol === selectedToken);

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return tokens;
    const query = searchQuery.toLowerCase();
    return tokens.filter(token =>
      token.symbol.toLowerCase().includes(query) ||
      token.name?.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery]);

  const popularTokens = useMemo(() => {
    return tokens.filter(t => POPULAR_TOKENS.includes(t.symbol));
  }, [tokens]);

  const handleSelect = (token) => {
    if (onTokenSelect) {
      onTokenSelect(token);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchQuery('');
  };

  return (
    <div className={`token-selector ${className}`}>
      <button
        className="token-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selectedTokenData ? (
          <div className="token-selector-selected">
            <TokenLogo symbol={selectedTokenData.symbol} size="sm" showBorder />
            <span className="token-selector-symbol">{selectedTokenData.symbol}</span>
          </div>
        ) : (
          <span className="token-selector-placeholder">{placeholder}</span>
        )}
        <ChevronDown
          size={16}
          className={`token-selector-chevron ${isOpen ? 'token-selector-chevron-open' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="token-selector-backdrop"
            onClick={() => setIsOpen(false)}
          />
          <div className="token-selector-dropdown" role="listbox">
            {showSearch && (
              <div className="token-selector-search">
                <Search size={16} className="token-selector-search-icon" />
                <input
                  type="text"
                  className="token-selector-search-input"
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    className="token-selector-search-clear"
                    onClick={handleClear}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {showPopular && popularTokens.length > 0 && !searchQuery && (
              <div className="token-selector-section">
                <div className="token-selector-section-header">
                  <TrendingUp size={14} />
                  <span>Popular</span>
                </div>
                <div className="token-selector-tokens-list">
                  {popularTokens.map((token) => (
                    <button
                      key={token.symbol}
                      className={`token-selector-token ${selectedToken === token.symbol ? 'token-selector-token-selected' : ''}`}
                      onClick={() => handleSelect(token)}
                      role="option"
                      aria-selected={selectedToken === token.symbol}
                    >
                      <TokenLogo symbol={token.symbol} size="md" showBorder />
                      <div className="token-selector-token-info">
                        <span className="token-selector-token-symbol">{token.symbol}</span>
                        <span className="token-selector-token-name">{token.name || token.symbol}</span>
                      </div>
                      {selectedToken === token.symbol && (
                        <Check size={16} className="token-selector-check" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="token-selector-section">
              {!searchQuery && (
                <div className="token-selector-section-header">
                  <span>All Tokens</span>
                  <span className="token-selector-count">{filteredTokens.length}</span>
                </div>
              )}
              <div className="token-selector-tokens-list">
                {filteredTokens.length > 0 ? (
                  filteredTokens.map((token) => (
                    <button
                      key={token.symbol}
                      className={`token-selector-token ${selectedToken === token.symbol ? 'token-selector-token-selected' : ''}`}
                      onClick={() => handleSelect(token)}
                      role="option"
                      aria-selected={selectedToken === token.symbol}
                    >
                      <TokenLogo symbol={token.symbol} size="md" showBorder />
                      <div className="token-selector-token-info">
                        <span className="token-selector-token-symbol">{token.symbol}</span>
                        <span className="token-selector-token-name">{token.name || token.symbol}</span>
                      </div>
                      {token.balance && (
                        <span className="token-selector-token-balance">
                          {parseFloat(token.balance).toFixed(4)}
                        </span>
                      )}
                      {selectedToken === token.symbol && (
                        <Check size={16} className="token-selector-check" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="token-selector-empty">
                    <span>No tokens found</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TokenSelector;
