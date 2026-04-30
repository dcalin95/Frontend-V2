/**
 * 📈 MarketStatsCompact - Minimalist Market Stats cu Dropdown
 * 
 * Versiune compactă a MarketStats pentru afișare în header:
 * - Buton cu preț și schimbare 24h
 * - Dropdown cu detalii (High/Low, Volume, Trades)
 * 
 * @module MarketStatsCompact
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { logWithPrefix, errorWithPrefix } from '../../utils/logger';
import '../../styles/components/market-stats-compact.css';

const MarketStatsCompact = ({ selectedToken = 'BTC' }) => {
  const [marketStats, setMarketStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null);

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportPadding = 8;
    const desiredWidth = Math.max(220, rect.width);
    const maxWidth = Math.max(220, window.innerWidth - viewportPadding * 2);
    const width = Math.min(desiredWidth, maxWidth);

    // Align dropdown to button right edge
    let left = rect.right - width;
    let top = rect.bottom + 6;

    left = Math.min(Math.max(left, viewportPadding), window.innerWidth - width - viewportPadding);

    const estimatedHeight = 260;
    if (top + estimatedHeight > window.innerHeight && rect.top - estimatedHeight > viewportPadding) {
      top = rect.top - 6 - estimatedHeight;
    }

    setMenuPos({ top, left, width });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const binanceSymbol = `${selectedToken}USDT`;
        const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`;
        
        const response = await fetch(binanceUrl);
        if (!response.ok) {
          throw new Error(`Binance API error: ${response.status}`);
        }
        
        const ticker = await response.json();
        
        const stats = {
          price: parseFloat(ticker.lastPrice || 0),
          priceChangePercent24h: parseFloat(ticker.priceChangePercent || 0),
          high24h: parseFloat(ticker.highPrice || 0),
          low24h: parseFloat(ticker.lowPrice || 0),
          volume24h: parseFloat(ticker.volume || 0),
          trades24h: parseInt(ticker.count || 0, 10)
        };
        
        setMarketStats(stats);
      } catch (err) {
        errorWithPrefix('MarketStatsCompact', '❌ ERROR:', err);
        setMarketStats(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [selectedToken]);

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

  // Keep portal menu positioned correctly (scroll/resize)
  useEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();

    const onResize = () => updateMenuPosition();
    const onScroll = () => updateMenuPosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [isOpen, updateMenuPosition]);

  const formatPrice = useCallback((price) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(8);
  }, []);

  const formatVolume = useCallback((vol) => {
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
    return vol.toFixed(0);
  }, []);

  const formatNumber = useCallback((num) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  }, []);

  const isPositive = useMemo(() => marketStats?.priceChangePercent24h >= 0, [marketStats?.priceChangePercent24h]);
  const ChangeIcon = useMemo(() => isPositive ? TrendingUp : TrendingDown, [isPositive]);

  if (loading || !marketStats) {
    return (
      <div className="market-stats-compact">
        <span className="market-stats-compact-loading" aria-live="polite">
          Loading…
        </span>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="market-stats-compact">
      <button
        className="market-stats-compact-button"
        ref={buttonRef}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Market statistics"
      >
        <div className="market-stats-compact-price">
          <span className="market-stats-compact-price-value">${formatPrice(marketStats.price)}</span>
          <span className={`market-stats-compact-change ${isPositive ? 'positive' : 'negative'}`}>
            <ChangeIcon size={12} />
            {Math.abs(marketStats.priceChangePercent24h).toFixed(2)}%
          </span>
        </div>
        <ChevronDown size={12} className={`market-stats-compact-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="market-stats-compact-backdrop" onClick={() => setIsOpen(false)} />
          <div
            ref={menuRef}
            className="market-stats-compact-menu"
            style={{
              position: 'fixed',
              top: menuPos?.top ?? 0,
              left: menuPos?.left ?? 0,
              width: menuPos?.width,
              zIndex: 9999
            }}
          >
            <div className="market-stats-compact-menu-header">
              <span className="market-stats-compact-menu-pair">{selectedToken}/USDT</span>
              <span className="market-stats-compact-menu-price">${formatPrice(marketStats.price)}</span>
            </div>
            
            <div className="market-stats-compact-menu-stats">
              <div className="market-stats-compact-menu-item">
                <span className="market-stats-compact-menu-label">24h High</span>
                <span className="market-stats-compact-menu-value">${formatPrice(marketStats.high24h)}</span>
              </div>
              <div className="market-stats-compact-menu-item">
                <span className="market-stats-compact-menu-label">24h Low</span>
                <span className="market-stats-compact-menu-value">${formatPrice(marketStats.low24h)}</span>
              </div>
              <div className="market-stats-compact-menu-item">
                <span className="market-stats-compact-menu-label">24h Volume</span>
                <span className="market-stats-compact-menu-value">${formatVolume(marketStats.volume24h)}</span>
              </div>
              <div className="market-stats-compact-menu-item">
                <span className="market-stats-compact-menu-label">24h Change</span>
                <span className={`market-stats-compact-menu-value ${isPositive ? 'positive' : 'negative'}`}>
                  {isPositive ? '+' : ''}{marketStats.priceChangePercent24h.toFixed(2)}%
                </span>
              </div>
              <div className="market-stats-compact-menu-item">
                <span className="market-stats-compact-menu-label">24h Trades</span>
                <span className="market-stats-compact-menu-value">{formatNumber(marketStats.trades24h)}</span>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default MarketStatsCompact;
