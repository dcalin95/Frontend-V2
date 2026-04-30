/**
 * 🎯 HeaderTokenSelector - SINGLE SOURCE OF TRUTH
 *
 * SSOT pentru selecția token-urilor – același în Header și în Market Analysis (OTA).
 * Dropdown cu logo în buton și logo + symbol pentru fiecare opțiune în listă.
 * BNB este mereu primul în listă. Opțiune „Adaugă token” deschide modalul pentru token custom.
 *
 * @module HeaderTokenSelector
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Plus, AlertTriangle } from 'lucide-react';
import TokenLogo from './TokenLogo';
import { getAllTokens } from '../../services/tokenRegistry';
import AddCustomTokenModal from './AddCustomTokenModal';

const FALLBACK_TOKENS = [
  { symbol: 'BNB', name: 'Binance Coin', displayOrder: 1 },
  { symbol: 'USDT', name: 'Tether USD', displayOrder: 3 },
  { symbol: 'ETH', name: 'Ethereum', displayOrder: 5 }
];

/** Minimal list for Direct Entry when registry returns empty after excluding stablecoins – avoid selector "blocked" on a single token. Include STX. */
const DIRECT_ENTRY_FALLBACK = [
  { symbol: 'BNB', name: 'Binance Coin', displayOrder: 1 },
  { symbol: 'BTC', name: 'Bitcoin', displayOrder: 2 },
  { symbol: 'ETH', name: 'Ethereum', displayOrder: 5 },
  { symbol: 'STX', name: 'Stacks (Binance-Peg)', displayOrder: 25 }
];

/** Lista de tokeni cu BNB mereu primul, apoi restul după displayOrder; nu aruncă dacă tokenRegistry eșuează */
function getTokensWithBNBFirst() {
  try {
    const tokens = getAllTokens();
    if (!Array.isArray(tokens) || tokens.length === 0) return FALLBACK_TOKENS;
    const bnb = tokens.find(t => t.symbol === 'BNB');
    const rest = tokens.filter(t => t.symbol !== 'BNB').sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
    return bnb ? [bnb, ...rest] : [FALLBACK_TOKENS[0], ...tokens];
  } catch (err) {
    console.warn('[HeaderTokenSelector] tokenRegistry failed, using fallback list', err);
    return FALLBACK_TOKENS;
  }
}

/** Symbols shown in "High risk / Volatility" section */
const HIGH_RISK_SYMBOLS = ['DOGE', 'SHIB', 'CAKE'];

/** Stablecoins – exclude from Direct Entry (backend rejects: buy volatile token, not stablecoin) */
const DIRECT_ENTRY_STABLECOINS = ['USDT', 'BUSD', 'USDC'];

function splitTokensByRisk(tokens) {
  const main = tokens.filter(t => !HIGH_RISK_SYMBOLS.includes(t.symbol));
  const highRisk = tokens.filter(t => HIGH_RISK_SYMBOLS.includes(t.symbol))
    .sort((a, b) => HIGH_RISK_SYMBOLS.indexOf(a.symbol) - HIGH_RISK_SYMBOLS.indexOf(b.symbol));
  return { main, highRisk };
}

const HeaderTokenSelector = ({
  selectedToken,
  onTokenChange,
  className = '',
  ariaLabel = 'Select token',
  disabled = false,
  excludeStablecoins = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [tokensVersion, setTokensVersion] = useState(0);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const lastToggleRef = useRef(0);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, minWidth: 0 });

  const availableTokens = useMemo(() => getTokensWithBNBFirst(), [tokensVersion]);
  const filteredTokens = useMemo(
    () => (excludeStablecoins ? availableTokens.filter(t => !DIRECT_ENTRY_STABLECOINS.includes(t.symbol)) : availableTokens),
    [availableTokens, excludeStablecoins]
  );
  const tokensForDisplay = useMemo(() => {
    if (!excludeStablecoins) return availableTokens;
    if (filteredTokens.length >= 2) return filteredTokens;
    return DIRECT_ENTRY_FALLBACK;
  }, [excludeStablecoins, availableTokens, filteredTokens]);
  const { main: mainTokens, highRisk: highRiskTokens } = useMemo(
    () => splitTokensByRisk(excludeStablecoins ? tokensForDisplay : availableTokens),
    [excludeStablecoins ? tokensForDisplay : availableTokens]
  );
  const symbols = (excludeStablecoins ? tokensForDisplay : availableTokens).map(t => t.symbol);
  // Păstrăm selecția userului dacă tokenul e în listă SAU în registry (evită revert la BNB când listă filtrată exclude temporar tokenul)
  const validToken = selectedToken && (symbols.includes(selectedToken) || availableTokens.some((t) => t.symbol === selectedToken))
    ? selectedToken
    : (symbols[0] ?? 'BNB');

  useEffect(() => {
    if (excludeStablecoins && selectedToken && DIRECT_ENTRY_STABLECOINS.includes(selectedToken) && symbols[0]) {
      onTokenChange(symbols[0]);
    }
  }, [excludeStablecoins, selectedToken, symbols, onTokenChange]);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: rect.width
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const close = (e) => {
      const inside = wrapperRef.current?.contains(e.target) || dropdownRef.current?.contains(e.target);
      if (!inside) setIsOpen(false);
    };
    // Amânare suplimentară ca click-ul care a deschis să nu închidă imediat (mai ales în portal/header)
    const t = setTimeout(() => document.addEventListener('mousedown', close), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', close);
    };
  }, [isOpen]);

  const handleSelect = (symbol) => {
    if (!symbol) return;
    onTokenChange(symbol);
    setIsOpen(false);
  };

  /** Pe opțiuni: aplică selecția la mousedown ca să nu fie anulată de handler-ul de închidere (portal/outside click). */
  const handleOptionMouseDown = (e, symbol) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelect(symbol);
  };

  const handleWrapperInteraction = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    if (now - lastToggleRef.current < 150) return;
    lastToggleRef.current = now;
    setIsOpen((prev) => !prev);
  };

  const openAddTokenModal = () => {
    setIsOpen(false);
    setShowAddTokenModal(true);
  };

  const handleAddTokenClose = (success, addedSymbol) => {
    setShowAddTokenModal(false);
    if (success) {
      setTokensVersion((v) => v + 1);
      if (addedSymbol) onTokenChange(addedSymbol);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`header-token-selector-wrapper ${isOpen ? 'header-token-selector-open' : ''} ${disabled ? 'header-token-selector-disabled' : ''} ${className}`}
      role="combobox"
      aria-expanded={isOpen}
      aria-controls="header-token-selector-listbox"
      aria-haspopup="listbox"
      onMouseDown={handleWrapperInteraction}
      onClick={handleWrapperInteraction}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        type="button"
        className="header-token-selector-button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => e.preventDefault()}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="header-token-selector-listbox"
        title={disabled ? 'Analysis in progress' : `Select token - current: ${validToken}`}
      >
        <TokenLogo symbol={validToken} size="30" showBorder className="header-token-logo" />
        <span className="header-token-selector-symbol">{validToken}</span>
        <ChevronDown
          size={16}
          className={`header-token-selector-chevron ${isOpen ? 'header-token-selector-chevron-open' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          id="header-token-selector-listbox"
          className="header-token-selector-dropdown header-token-selector-dropdown-portaled"
          role="listbox"
          style={{
            position: 'fixed',
            top: dropdownStyle.top,
            left: dropdownStyle.left,
            minWidth: dropdownStyle.minWidth,
            zIndex: 10000
          }}
        >
          <div className="header-token-selector-list">
            {mainTokens.length > 0 && (
              <>
                <div className="header-token-selector-section-header" role="presentation">Main</div>
                {mainTokens.map((token) => (
                  <button
                    key={token.symbol}
                    type="button"
                    className={`header-token-selector-option ${validToken === token.symbol ? 'header-token-selector-option-selected' : ''}`}
                    onMouseDown={(e) => handleOptionMouseDown(e, token.symbol)}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSelect(token.symbol); }}
                    role="option"
                    aria-selected={validToken === token.symbol}
                  >
                    <TokenLogo symbol={token.symbol} size="30" showBorder className="header-token-option-logo" />
                    <span className="header-token-selector-option-symbol">{token.symbol}</span>
                    {token.name && token.name !== token.symbol && (
                      <span className="header-token-selector-option-name">{token.name}</span>
                    )}
                  </button>
                ))}
              </>
            )}
            {highRiskTokens.length > 0 && (
              <>
                <div className="header-token-selector-section-header header-token-selector-section-header--risk" role="presentation">
                  <AlertTriangle size={12} aria-hidden />
                  <span>High risk / Volatility</span>
                </div>
                {highRiskTokens.map((token) => (
                  <button
                    key={token.symbol}
                    type="button"
                    className={`header-token-selector-option ${validToken === token.symbol ? 'header-token-selector-option-selected' : ''}`}
                    onMouseDown={(e) => handleOptionMouseDown(e, token.symbol)}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSelect(token.symbol); }}
                    role="option"
                    aria-selected={validToken === token.symbol}
                  >
                    <TokenLogo symbol={token.symbol} size="30" showBorder className="header-token-option-logo" />
                    <span className="header-token-selector-option-symbol">{token.symbol}</span>
                    {token.name && token.name !== token.symbol && (
                      <span className="header-token-selector-option-name">{token.name}</span>
                    )}
                  </button>
                ))}
              </>
            )}
            <div className="header-token-selector-add-row">
              <button
                type="button"
                className="header-token-selector-add-btn"
                onClick={openAddTokenModal}
                aria-label="Add custom token"
              >
                <Plus size={16} aria-hidden="true" />
                <span>Add token</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <AddCustomTokenModal
        isOpen={showAddTokenModal}
        onClose={() => handleAddTokenClose(false)}
        onSuccess={(addedSymbol) => handleAddTokenClose(true, addedSymbol)}
      />
    </div>
  );
};

export default HeaderTokenSelector;
