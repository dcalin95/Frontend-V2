/**
 * 📈 MarketStats Component - Market Statistics
 * 
 * Component pentru afișarea statisticilor de piață cu DATE REALE:
 * - Price & 24h change (din Binance API)
 * - High/Low 24h (din Binance API)
 * - Volume 24h (din Binance API)
 * - Market data from API only
 * 
 * @module MarketStats
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, Badge } from '../ui';
import LoadingSpinner from '../common/LoadingSpinner';
import { logWithPrefix, warnWithPrefix, errorWithPrefix } from '../../utils/logger';
// NO BACKEND URL - using Binance API directly for REAL prices
import '../../styles/components/market-stats.css';

const MarketStats = React.memo(() => {
  const [marketStats, setMarketStats] = useState(null);
  const [tradingPairs, setTradingPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedToken, setSelectedToken] = useState('BTC');
  const [selectedQuoteToken, setSelectedQuoteToken] = useState('USDT');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // FETCH REAL PRICES FROM BINANCE API DIRECT (like SwapModal)
        // All from Binance API only
        const binanceSymbol = `${selectedToken}USDT`;
        const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`;
        
        logWithPrefix('MarketStats', '✅ Fetching REAL data from Binance API:', binanceSymbol);
        
        const response = await fetch(binanceUrl);
        if (!response.ok) {
          throw new Error(`Binance API error: ${response.status}`);
        }
        
        const ticker = await response.json();
        logWithPrefix('MarketStats', '📊 Binance Ticker:', ticker);
        
        // Transform Binance API response to component format
        // All from Binance API only
        const stats = {
          pair: `${selectedToken}/${selectedQuoteToken}`,
          price: parseFloat(ticker.lastPrice || 0),
          priceChangePercent24h: parseFloat(ticker.priceChangePercent || 0),
          high24h: parseFloat(ticker.highPrice || 0),
          low24h: parseFloat(ticker.lowPrice || 0),
          volume24h: parseFloat(ticker.volume || 0),
          marketCap: 0, // Binance doesn't provide market cap directly
          liquidity: 0, // Binance doesn't provide liquidity directly
          trades24h: parseInt(ticker.count || 0, 10)
        };
        
        logWithPrefix('MarketStats', '✅ Real stats from Binance:', stats);
        setMarketStats(stats);
        
        // For trading pairs, fetch from Binance API directly (batch request)
        const popularTokens = ['BTC', 'ETH', 'BNB']; // BITS not on Binance, handle separately
        const symbols = JSON.stringify(popularTokens.map(t => `${t}USDT`));
        const pairsUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`;
        
        try {
          const pairsResponse = await fetch(pairsUrl);
          if (pairsResponse.ok) {
            const pairsData = await pairsResponse.json();
            const pairs = pairsData.map(ticker => ({
              symbol: `${ticker.symbol.replace('USDT', '')}/USDT`,
              price: parseFloat(ticker.lastPrice || 0),
              change24h: parseFloat(ticker.priceChangePercent || 0)
            }));
            logWithPrefix('MarketStats', '✅ Real pairs from Binance:', pairs);
            setTradingPairs(pairs);
          }
        } catch (err) {
          console.warn('[MarketStats] Failed to fetch pairs from Binance:', err);
          setTradingPairs([]);
        }
      } catch (err) {
        errorWithPrefix('MarketStats', '❌ ERROR:', err);
        // Set error state. Real data from API only.
        setMarketStats(null);
        setTradingPairs([]);
        setError(err?.message || String(err) || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [selectedToken, selectedQuoteToken]);

  const formatNumber = useCallback((num, decimals = 2) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(decimals);
  }, []);

  const isPositive = useMemo(() => marketStats?.priceChangePercent24h >= 0, [marketStats?.priceChangePercent24h]);
  const ChangeIcon = useMemo(() => isPositive ? TrendingUp : TrendingDown, [isPositive]);

  if (loading || !marketStats) {
    return (
      <Card className="market-stats-container" padding="md">
        <LoadingSpinner message="Loading market data" size="medium" />
      </Card>
    );
  }

  return (
    <Card className="market-stats-container" padding="md">
      <Card.Header>
        <Card.Title>Market Stats</Card.Title>
      </Card.Header>

      <Card.Body>
        {/* Main Price Display */}
        <div className="market-stats-main-price">
          <div className="market-stats-pair">{marketStats.pair}</div>
          <div className="market-stats-price-container">
            <span className="market-stats-price">
              ${formatNumber(marketStats.price, 2)}
            </span>
            <Badge variant={isPositive ? 'success' : 'error'} size="md" className="market-stats-change-badge">
              <ChangeIcon size={14} />
              <span>{Math.abs(marketStats.priceChangePercent24h)}%</span>
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="market-stats-grid">
          <div className="market-stats-item">
            <span className="market-stats-label">24h High</span>
            <span className="market-stats-value">${formatNumber(marketStats.high24h, 2)}</span>
          </div>
          <div className="market-stats-item">
            <span className="market-stats-label">24h Low</span>
            <span className="market-stats-value">${formatNumber(marketStats.low24h, 2)}</span>
          </div>
          <div className="market-stats-item">
            <span className="market-stats-label">24h Volume</span>
            <span className="market-stats-value">${formatNumber(marketStats.volume24h, 2)}</span>
          </div>
          <div className="market-stats-item">
            <span className="market-stats-label">Market Cap</span>
            <span className="market-stats-value">${formatNumber(marketStats.marketCap, 2)}</span>
          </div>
          <div className="market-stats-item">
            <span className="market-stats-label">Liquidity</span>
            <span className="market-stats-value">${formatNumber(marketStats.liquidity, 2)}</span>
          </div>
          <div className="market-stats-item">
            <span className="market-stats-label">24h Trades</span>
            <span className="market-stats-value">{formatNumber(marketStats.trades24h, 0)}</span>
          </div>
        </div>

        {/* Trading Pairs List */}
        <div className="market-stats-pairs">
          <div className="market-stats-pairs-header">Popular Pairs</div>
          <div className="market-stats-pairs-list">
            {tradingPairs.map((pair, index) => (
              <div key={index} className="market-stats-pair-item">
                <span className="pair-symbol">{pair.symbol}</span>
                <span className="pair-price">${formatNumber(pair.price, 2)}</span>
                <Badge variant={pair.change24h >= 0 ? 'success' : 'error'} size="sm">
                  {pair.change24h >= 0 ? '+' : ''}{pair.change24h}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </Card.Body>

      <Card.Footer>
        {error ? (
          <span style={{ color: '#ef4444' }}>❌ Error: {error}</span>
        ) : (
          <span style={{ color: '#10b981' }}>✓ Live Market Data</span>
        )}
      </Card.Footer>
    </Card>
  );
});

MarketStats.displayName = 'MarketStats';

export default MarketStats;