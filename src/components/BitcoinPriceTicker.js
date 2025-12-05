import React, { useState, useEffect, useCallback, useRef } from 'react';
import './BitcoinPriceTicker.css';
import './BitcoinPriceTicker.mobile.css';

/**
 * 🪙 Bitcoin Live Price Ticker - Gemini AI Style
 * 
 * Refactored for clear visibility (no overlap) and AI aesthetic.
 * Features:
 * - Vertical layout: Logo Top -> Price -> Stats
 * - Gemini Color Palette (Deep Blue, Cyan, Sparkles)
 * - Real-time data
 */
const BitcoinPriceTicker = () => {
  const [price, setPrice] = useState(null);
  const [prevPrice, setPrevPrice] = useState(null);
  const [change24h, setChange24h] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const lastFetchTime = useRef(Date.now());

  // 🛠️ Debug Mount
  useEffect(() => {
    console.log("🚀 [BitcoinPriceTicker] Gemini Refactor MOUNTED");
  }, []);

  // 🎯 Fetch Bitcoin Price (memoized)
  const fetchBitcoinPrice = useCallback(async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch Bitcoin price');
      }

      const data = await response.json();
      const currentPrice = data.bitcoin.usd;
      const change = data.bitcoin.usd_24h_change;

      setPrevPrice(price); 
      setPrice(currentPrice);
      setChange24h(change);
      setIsLoading(false);
      setError(null);
      lastFetchTime.current = Date.now();
      setSecondsSinceUpdate(0);

    } catch (err) {
      console.error('❌ [BitcoinPriceTicker] Error:', err);
      setError('Failed to fetch price');
      setIsLoading(false);
    }
  }, [price]);

  // 🔄 Fetch price every 30 seconds
  useEffect(() => {
    fetchBitcoinPrice();
    const interval = setInterval(fetchBitcoinPrice, 30000);
    return () => clearInterval(interval);
  }, [fetchBitcoinPrice]);

  // ⏱️ Update seconds counter
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSinceUpdate(Math.floor((Date.now() - lastFetchTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = useCallback((value) => {
    if (!value) return '---';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const formatChange = useCallback((value) => {
    if (!value) return '+0.00%';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }, []);

  const isPositive = change24h >= 0;
  const isPriceUp = prevPrice && price > prevPrice;
  const isPriceDown = prevPrice && price < prevPrice;

  if (error) {
    return (
      <div className="btc-gemini-wrapper">
        <div className="btc-gemini-card error">
          <div className="btc-error-content">
            <span className="btc-error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={fetchBitcoinPrice} className="btc-retry-btn">Retry Connection</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="btc-gemini-wrapper">
      <div className={`btc-gemini-card ${isLoading ? 'loading' : ''}`}>
        
        {/* Gemini Gradient Orb Background */}
        <div className="gemini-bg-glow"></div>

        {/* 🌌 Gemini Sparkles (Decorations) */}
        <svg className="gemini-sparkle sparkle-tl" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
        <svg className="gemini-sparkle sparkle-br" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>

        {/* Header Row */}
        <div className="gemini-header">
          <div className="gemini-badge">
            <span className="gemini-badge-dot"></span>
            AI Live Price
          </div>
          <div className="gemini-timer">
            ⟳ {secondsSinceUpdate}s
          </div>
        </div>

        {/* 🪙 Main Content - No Overlap */}
        <div className="gemini-content">
          
          {/* Floating Logo Container */}
          <div className="gemini-logo-container">
            <div className="gemini-logo-ring"></div>
            <span className="gemini-logo-text">₿</span>
          </div>

          {/* Price Section */}
          <div className="gemini-price-section">
            <div className="gemini-label">Bitcoin (BTC)</div>
            
            <div className={`gemini-price-display ${isPriceUp ? 'flash-green' : ''} ${isPriceDown ? 'flash-red' : ''}`}>
              {isLoading ? (
                <span className="gemini-loading-text">Analyzing...</span>
              ) : (
                formatPrice(price)
              )}
            </div>

            {/* Change Pill */}
            <div className={`gemini-change-pill ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '↗' : '↘'} {formatChange(change24h)} (24h)
            </div>
          </div>

        </div>

        {/* Footer Analysis */}
        <div className="gemini-footer">
          <div className="gemini-ai-insight">
             <span className="gemini-spark-icon">✨</span>
             {isPositive ? "Market Sentiment: Bullish" : "Market Sentiment: Bearish"}
          </div>
          <div className="gemini-source">CoinGecko API</div>
        </div>

      </div>
    </div>
  );
};

export default BitcoinPriceTicker;
