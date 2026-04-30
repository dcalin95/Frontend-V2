/**
 * 📊 TradingPairsDropdown - Minimalist Trading Pairs Selector
 * 
 * Versiune minimalistă a TradingPairsList pentru header:
 * - Dropdown cu lista de pairs
 * - Search
 * - Click pentru selectare
 * 
 * @module TradingPairsDropdown
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, TrendingUp, TrendingDown, Star } from 'lucide-react';
import TokenLogo from '../common/TokenLogo';
import { logWithPrefix, errorWithPrefix } from '../../utils/logger';
import useTradingPairsFavorites from '../../hooks/useTradingPairsFavorites';
import '../../styles/components/trading-pairs-dropdown.css';

const TradingPairsDropdown = ({ 
  onPairSelect,
  selectedPair = null,
  className = ''
}) => {
  const [pairs, setPairs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const listRef = useRef(null);
  const highlightedIndexRef = useRef(0);
  const [menuPos, setMenuPos] = useState(null);
  const { favorites, isFavorite, toggleFavorite } = useTradingPairsFavorites();

  highlightedIndexRef.current = highlightedIndex;

  useEffect(() => {
    const loadPairs = async () => {
      try {
        setLoading(true);
        
        const popularTokens = ['BTC', 'ETH', 'BNB', 'CAKE', 'SOL', 'STX', 'MATIC', 'LINK'];
        const symbols = JSON.stringify(popularTokens.map(t => `${t}USDT`));
        const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`;
        
        const response = await fetch(binanceUrl);
        if (!response.ok) {
          throw new Error(`Binance API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        const fetchedPairs = data.map(ticker => {
          const symbol = ticker.symbol.replace('USDT', '');
          return {
            symbol: `${symbol}/USDT`,
            baseToken: symbol,
            quoteToken: 'USDT',
            price: parseFloat(ticker.lastPrice || 0),
            change24h: parseFloat(ticker.priceChangePercent || 0),
            volume24h: parseFloat(ticker.volume || 0)
          };
        });
        
        setPairs(fetchedPairs);
      } catch (err) {
        errorWithPrefix('TradingPairsDropdown', '❌ ERROR:', err);
        setPairs([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadPairs();
    const interval = setInterval(loadPairs, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    const desiredWidth = Math.max(rect.width, 320);
    const viewportPadding = 8;
    const maxWidth = Math.max(240, window.innerWidth - viewportPadding * 2);
    const width = Math.min(desiredWidth, maxWidth);

    // Default: open below button
    let left = rect.left;
    let top = rect.bottom + 6;

    // Clamp horizontally
    left = Math.min(Math.max(left, viewportPadding), window.innerWidth - width - viewportPadding);

    // If it would overflow bottom, open above
    const estimatedHeight = 420; // menu max-height + padding
    if (top + estimatedHeight > window.innerHeight && rect.top - estimatedHeight > viewportPadding) {
      top = rect.top - 6 - estimatedHeight;
    }

    setMenuPos({ top, left, width });
  }, []);

  // Close dropdown on outside click (portal-safe)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const inAnchor = dropdownRef.current && dropdownRef.current.contains(event.target);
      const inMenu = menuRef.current && menuRef.current.contains(event.target);
      if (!inAnchor && !inMenu) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard: ESC to close, Arrow Up/Down to move, Enter to select
  useEffect(() => {
    if (!isOpen) return;
    setHighlightedIndex(0);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (e.target.closest('.trading-pairs-dropdown-search input')) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const firstOpt = listRef.current?.querySelector('[role="option"]');
          if (firstOpt) firstOpt.focus();
        }
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const count = filteredPairs.length;
        if (count === 0) return;
        setHighlightedIndex((i) => (e.key === 'ArrowDown' ? Math.min(i + 1, count - 1) : Math.max(i - 1, 0)));
        return;
      }
      if (e.key === 'Enter' && filteredPairs.length > 0) {
        e.preventDefault();
        const idx = highlightedIndexRef.current;
        const pair = filteredPairs[idx];
        if (pair) handlePairSelect(pair);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredPairs]);

  // Focus the highlighted option when highlightedIndex changes (Arrow keys)
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const options = listRef.current.querySelectorAll('[role="option"]');
    const el = options[highlightedIndex];
    if (el) el.focus();
  }, [isOpen, highlightedIndex]);

  // Keep portal menu positioned correctly (scroll/resize)
  useEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();

    const onResize = () => updateMenuPosition();
    const onScroll = () => updateMenuPosition();

    window.addEventListener('resize', onResize);
    // capture scroll from any scroll container (header is sticky but toolbars can scroll)
    window.addEventListener('scroll', onScroll, true);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [isOpen, updateMenuPosition]);

  // Separe perechile în favorite și non-favorite
  const { favoritePairs, regularPairs } = useMemo(() => {
    const favorite = pairs.filter(pair => isFavorite(pair.symbol));
    const regular = pairs.filter(pair => !isFavorite(pair.symbol));
    return { favoritePairs: favorite, regularPairs: regular };
  }, [pairs, isFavorite]);

  const filteredPairs = useMemo(() => {
    if (!searchQuery) {
      // Fără search: afișează favorite-urile primul, apoi restul
      return [...favoritePairs, ...regularPairs].slice(0, 8);
    }
    
    const query = searchQuery.toLowerCase();
    return pairs.filter(pair => 
      pair.symbol.toLowerCase().includes(query) ||
      pair.baseToken?.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [pairs, searchQuery, favoritePairs, regularPairs]);

  const formatPrice = useCallback((price) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(8);
  }, []);

  const handlePairSelect = (pair) => {
    if (onPairSelect) {
      const binanceSymbol = `BINANCE:${pair.symbol.replace('/', '')}`;
      onPairSelect({ ...pair, binanceSymbol });
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleFavoriteClick = (e, pair) => {
    e.stopPropagation(); // Previne selectarea perechii când se face click pe stea
    toggleFavorite(pair.symbol);
  };

  const currentPair = selectedPair 
    ? pairs.find(p => selectedPair.includes(p.symbol.replace('/', '')))
    : pairs[0];

  const displayPair = currentPair || { symbol: 'BTC/USDT', baseToken: 'BTC', quoteToken: 'USDT' };
  const [displayBase, displayQuote] = displayPair.symbol.split('/');

  return (
    <div ref={dropdownRef} className={`trading-pairs-dropdown ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className="trading-pairs-dropdown-button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Select trading pair"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="trading-pairs-dropdown-pair-logos">
          <TokenLogo symbol={displayBase} size="xs" showBorder />
          <TokenLogo symbol={displayQuote} size="xs" showBorder className="trading-pairs-dropdown-logo-overlap" />
        </div>
        <span className="trading-pairs-dropdown-pair-symbol">{displayPair.symbol}</span>
        <ChevronDown size={14} className={`trading-pairs-dropdown-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="trading-pairs-dropdown-backdrop" onClick={() => setIsOpen(false)} />
          <div
            ref={menuRef}
            className="trading-pairs-dropdown-menu"
            style={{
              position: 'fixed',
              top: menuPos?.top ?? 0,
              left: menuPos?.left ?? 0,
              width: menuPos?.width,
              zIndex: 9999
            }}
          >
            <div className="trading-pairs-dropdown-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search pairs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            
            <div
              ref={listRef}
              className="trading-pairs-dropdown-list"
              role="listbox"
              aria-label="Trading pairs"
            >
              {loading ? (
                <div className="trading-pairs-dropdown-loading">Loading...</div>
              ) : filteredPairs.length > 0 ? (
                filteredPairs.map((pair, index) => {
                  const isPositive = pair.change24h >= 0;
                  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;
                  const [baseToken, quoteToken] = pair.symbol.split('/');
                  const isSelected = selectedPair && selectedPair.includes(pair.symbol.replace('/', ''));

                  return (
                    <button
                      key={pair.symbol}
                      type="button"
                      role="option"
                      aria-selected={index === highlightedIndex || isSelected}
                      tabIndex={index === highlightedIndex ? 0 : -1}
                      className={`trading-pairs-dropdown-item ${isSelected ? 'selected' : ''} ${index === highlightedIndex ? 'highlighted' : ''}`}
                      onClick={() => handlePairSelect(pair)}
                    >
                      <div className="trading-pairs-dropdown-item-pair">
                        <div className="trading-pairs-dropdown-item-logos">
                          <TokenLogo symbol={baseToken} size="xs" showBorder />
                          <TokenLogo symbol={quoteToken} size="xs" showBorder className="trading-pairs-dropdown-logo-overlap" />
                        </div>
                        <span className="trading-pairs-dropdown-item-symbol">{pair.symbol}</span>
                      </div>
                      <div className="trading-pairs-dropdown-item-info">
                        <span className="trading-pairs-dropdown-item-price">{formatPrice(pair.price)}</span>
                        <span className={`trading-pairs-dropdown-item-change ${isPositive ? 'positive' : 'negative'}`}>
                          <ChangeIcon size={12} />
                          {isPositive ? '+' : ''}{pair.change24h?.toFixed(2)}%
                        </span>
                      </div>
                      <button
                        className={`trading-pairs-dropdown-favorite-btn ${isFavorite(pair.symbol) ? 'active' : ''}`}
                        onClick={(e) => handleFavoriteClick(e, pair)}
                        title={isFavorite(pair.symbol) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star size={14} fill={isFavorite(pair.symbol) ? 'currentColor' : 'none'} />
                      </button>
                    </button>
                  );
                })
              ) : (
                <div className="trading-pairs-dropdown-empty">No pairs found</div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default TradingPairsDropdown;
