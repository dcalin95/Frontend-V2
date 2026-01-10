/**
 * 📊 TokenSelector Component
 */

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import './TokenSelector.css';

const TokenSelector = ({ tokens = [], onSelect = () => {}, onClose = () => {} }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = tokens.filter(token => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      token.symbol.toLowerCase().includes(query) ||
      token.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="token-selector-overlay" onClick={onClose}>
      <div className="token-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="token-selector-header">
          <h3>Select Token</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="token-selector-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="token-selector-list">
          {filteredTokens.length === 0 ? (
            <div className="empty-tokens">No tokens found</div>
          ) : (
            filteredTokens.map((token) => (
              <div
                key={token.symbol}
                className="token-item"
                onClick={() => onSelect(token)}
              >
                {token.icon && (
                  <img src={token.icon} alt={token.symbol} className="token-icon" />
                )}
                <div className="token-info">
                  <div className="token-symbol">{token.symbol}</div>
                  <div className="token-name">{token.name}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenSelector;

