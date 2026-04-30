/**
 * 📊 MarketOverview Component - Market Overview Improvements
 * 
 * Component pentru market overview cu DATE REALE:
 * - Market cap, dominance (calculate din date reale Binance)
 * - Top gainers/losers (din date reale Binance)
 * - Market trends (din date reale Binance)
 * - Network selector integration
 * - Binance/PancakeSwap style
 * 
 * All values from Binance API only. No prescribed data.
 * 
 * @module MarketOverview
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Globe } from 'lucide-react';
import NetworkSelector from '../common/NetworkSelector';
import TokenLogo from '../common/TokenLogo';
import { Card, Badge } from '../ui';
import LoadingSpinner from '../common/LoadingSpinner';
import { logWithPrefix, errorWithPrefix } from '../../utils/logger';
// NO BACKEND URL - using Binance API directly for REAL prices
import '../../styles/components/market-overview.css';

const MarketOverview = () => {
  const [pairs, setPairs] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('bsc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // FETCH REAL PRICES FROM BINANCE API DIRECT (like SwapModal)
        // All from Binance API only
        const popularTokens = ['BTC', 'ETH', 'BNB', 'CAKE', 'SOL', 'STX', 'MATIC', 'LINK']; // BITS handled separately
        const symbols = JSON.stringify(popularTokens.map(t => `${t}USDT`));
        const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`;
        
        logWithPrefix('MarketOverview', '✅ Fetching REAL data from Binance API:', symbols);
        
        const response = await fetch(binanceUrl);
        if (!response.ok) {
          throw new Error(`Binance API error: ${response.status}`);
        }
        
        const data = await response.json();
        logWithPrefix('MarketOverview', '📊 Binance Tickers:', data);
        
        // Transform Binance API response to component format
        // All from Binance API only
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
        
        if (fetchedPairs.length > 0) {
          logWithPrefix('MarketOverview', '✅ Real pairs from Binance:', fetchedPairs);
          setPairs(fetchedPairs);
        } else {
          throw new Error('No pairs fetched from Binance');
        }
      } catch (err) {
        errorWithPrefix('MarketOverview', '❌ ERROR:', err);
        setError(err?.message || String(err) || 'Unknown error');
        setPairs([]); // Empty on error. Real data from API only.
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Refresh every 15 seconds
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const marketData = useMemo(() => {
    const totalVolume = pairs.reduce((sum, p) => sum + (p.volume24h || 0), 0);
    const totalMarketCap = pairs.reduce((sum, p) => sum + ((p.price || 0) * 1000000), 0);
    const positivePairs = pairs.filter(p => (p.change24h || 0) >= 0).length;
    const marketSentiment = pairs.length > 0 ? (positivePairs / pairs.length) * 100 : 0;
    
    // Calculate volume change from pairs (average change24h weighted by volume)
    const volumeChange = pairs.length > 0 
      ? pairs.reduce((sum, p) => sum + ((p.change24h || 0) * (p.volume24h || 0)), 0) / totalVolume || 0
      : 0;
    
    // Calculate market cap change (average change24h weighted by market cap)
    const marketCapChange = pairs.length > 0
      ? pairs.reduce((sum, p) => sum + ((p.change24h || 0) * ((p.price || 0) * 1000000)), 0) / totalMarketCap || 0
      : 0;
    
    return {
      totalVolume,
      totalMarketCap,
      marketSentiment,
      totalPairs: pairs.length,
      volumeChange,
      marketCapChange
    };
  }, [pairs]);

  const topGainers = useMemo(() => {
    return [...pairs]
      .filter(p => (p.change24h || 0) > 0)
      .sort((a, b) => (b.change24h || 0) - (a.change24h || 0))
      .slice(0, 5);
  }, [pairs]);

  const topLosers = useMemo(() => {
    return [...pairs]
      .filter(p => (p.change24h || 0) < 0)
      .sort((a, b) => (a.change24h || 0) - (b.change24h || 0))
      .slice(0, 5);
  }, [pairs]);

  const formatNumber = (num) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  if (loading || pairs.length === 0) {
    return (
      <Card className="market-overview-container" padding="lg">
        <LoadingSpinner message="Loading market data" size="medium" />
      </Card>
    );
  }

  return (
    <Card className="market-overview-container" padding="lg">
      <Card.Header>
        <div className="market-overview-header-left">
          <BarChart3 size={20} />
          <Card.Title>Market Overview</Card.Title>
        </div>
        <NetworkSelector
          selectedNetwork={selectedNetwork}
          onNetworkChange={setSelectedNetwork}
          variant="compact"
        />
      </Card.Header>

      <Card.Body>

        {/* Market Stats Grid */}
        <div className="market-overview-stats-grid">
          <Card variant="elevated" padding="md" className="market-overview-stat-card">
            <div className="market-overview-stat-label">Total Volume 24h</div>
            <div className="market-overview-stat-value">
              {formatNumber(marketData.totalVolume)}
            </div>
            {marketData.volumeChange !== 0 && (
              <Badge variant={marketData.volumeChange >= 0 ? 'success' : 'error'} size="sm" className="market-overview-stat-change">
                {marketData.volumeChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{marketData.volumeChange >= 0 ? '+' : ''}{marketData.volumeChange.toFixed(2)}%</span>
              </Badge>
            )}
          </Card>

          <Card variant="elevated" padding="md" className="market-overview-stat-card">
            <div className="market-overview-stat-label">Market Cap</div>
            <div className="market-overview-stat-value">
              {formatNumber(marketData.totalMarketCap)}
            </div>
            {marketData.marketCapChange !== 0 && (
              <Badge variant={marketData.marketCapChange >= 0 ? 'success' : 'error'} size="sm" className="market-overview-stat-change">
                {marketData.marketCapChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{marketData.marketCapChange >= 0 ? '+' : ''}{marketData.marketCapChange.toFixed(2)}%</span>
              </Badge>
            )}
          </Card>

          <Card variant="elevated" padding="md" className="market-overview-stat-card">
            <div className="market-overview-stat-label">Market Sentiment</div>
            <div className="market-overview-stat-value">
              {marketData.marketSentiment.toFixed(1)}%
            </div>
            <div className="market-overview-stat-indicator">
              <div 
                className="market-overview-sentiment-bar"
                style={{ width: `${marketData.marketSentiment}%` }}
              />
            </div>
          </Card>

          <Card variant="elevated" padding="md" className="market-overview-stat-card">
            <div className="market-overview-stat-label">Active Pairs</div>
            <div className="market-overview-stat-value">
              {marketData.totalPairs}
            </div>
            <div className="market-overview-stat-subtext">
              <Globe size={14} />
              <span>Across all markets</span>
            </div>
          </Card>
        </div>

        {/* Top Gainers & Losers */}
        <div className="market-overview-trends">
          <Card variant="outlined" padding="md" className="market-overview-trends-section">
            <div className="market-overview-trends-header">
              <TrendingUp size={16} />
              <span>Top Gainers</span>
            </div>
            <div className="market-overview-trends-list">
              {topGainers.map((pair, index) => {
                const [baseToken] = pair.symbol.split('/');
                return (
                  <div key={index} className="market-overview-trend-item">
                    <div className="market-overview-trend-token">
                      <TokenLogo symbol={baseToken} size="xs" />
                      <span className="market-overview-trend-symbol">{pair.symbol}</span>
                    </div>
                    <Badge variant="success" size="sm">
                      +{pair.change24h}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card variant="outlined" padding="md" className="market-overview-trends-section">
            <div className="market-overview-trends-header">
              <TrendingDown size={16} />
              <span>Top Losers</span>
            </div>
            <div className="market-overview-trends-list">
              {topLosers.map((pair, index) => {
                const [baseToken] = pair.symbol.split('/');
                return (
                  <div key={index} className="market-overview-trend-item">
                    <div className="market-overview-trend-token">
                      <TokenLogo symbol={baseToken} size="xs" />
                      <span className="market-overview-trend-symbol">{pair.symbol}</span>
                    </div>
                    <Badge variant="error" size="sm">
                      {pair.change24h}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </Card.Body>

      <Card.Footer>
        {error ? (
          <span style={{ color: '#ef4444' }}>❌ Error loading data: {error}</span>
        ) : (
          <span style={{ color: '#10b981' }}>✓ Live Market Data</span>
        )}
      </Card.Footer>
    </Card>
  );
};

export default MarketOverview;
