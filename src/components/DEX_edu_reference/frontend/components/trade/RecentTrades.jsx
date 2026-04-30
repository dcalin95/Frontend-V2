/**
 * 📊 RecentTrades Component - Recent Trades Display
 * 
 * Component pentru afișarea tranzacțiilor recente cu date reale:
 * - Lista de tranzacții recente (din API)
 * - Price, Amount, Time, Side (Buy/Sell) - din API
 * - Animații pentru tranzacții noi
 * - Auto-refresh (real data din API)
 * 
 * @module RecentTrades
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Real API data only. No prescribed data.
import { getTrades as getTradesApi } from '../../services/dexApiService';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, Badge } from '../ui';
import Skeleton from '../common/Skeleton';
import { errorWithPrefix } from '../../utils/logger';
import '../../styles/components/recent-trades.css';

const RecentTrades = React.memo(() => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [baseToken, setBaseToken] = useState('BITS');
  const [quoteToken, setQuoteToken] = useState('USDT');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getTradesApi({ 
          base_token: baseToken, 
          quote_token: quoteToken, 
          limit: 20 
        });
        
        if (response.success && response.trades) {
          // Transform API trades to component format
          // API returns trades with 'role' field ('buyer' or 'seller')
          const transformedTrades = response.trades.map(trade => ({
            id: trade.id,
            type: trade.role === 'buyer' ? 'buy' : 'sell',
            price: parseFloat(trade.price),
            amount: parseFloat(trade.amount),
            token: trade.base_token || baseToken,
            timestamp: new Date(trade.created_at).getTime(),
            value: parseFloat(trade.total_value),
            status: trade.status
          }));
          setTrades(transformedTrades);
        } else {
          throw new Error('Failed to load trades');
        }
      } catch (err) {
        errorWithPrefix('RecentTrades', '❌ API ERROR:', err);
        // Empty on error. Real data from API only.
        setTrades([]);
        setError(err?.message || String(err) || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [baseToken, quoteToken]);

  const formatNumber = useCallback((num, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  }, []);

  const formatTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }, []);

  if (loading) {
    return (
      <Card className="recent-trades-container" padding="md">
        <Skeleton variant="text" width="40%" height="20px" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="text" width="100%" height="40px" style={{ marginTop: '8px' }} />
        ))}
      </Card>
    );
  }

  return (
    <Card className="recent-trades-container" padding="md">
      <Card.Header>
        <Card.Title>Recent Trades</Card.Title>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Badge variant="default" size="sm">{trades.length}</Badge>
          {error && (
            <Badge variant="warning" size="sm" title={error}>
              Fallback
            </Badge>
          )}
        </div>
      </Card.Header>

      <Card.Body>
        {trades.length === 0 ? (
          <div className="recent-trades-empty">
            <span>No recent trades</span>
          </div>
        ) : (
          <div className="recent-trades-list">
              {trades.map((trade, index) => (
                <div
                  key={trade.id}
                  className={`recent-trades-item recent-trades-item-${trade.type}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  role="row"
                  aria-label={`${trade.type} ${trade.amount} ${trade.token} at $${trade.price}`}
                >
                <div className="recent-trades-side">
                  {trade.type === 'buy' ? (
                    <TrendingUp size={14} className="recent-trades-icon-buy" />
                  ) : (
                    <TrendingDown size={14} className="recent-trades-icon-sell" />
                  )}
                  <span className={`recent-trades-type recent-trades-type-${trade.type}`}>
                    {trade.type.toUpperCase()}
                  </span>
                </div>
                <div className="recent-trades-price">
                  ${formatNumber(trade.price, 2)}
                </div>
                <div className="recent-trades-amount">
                  {formatNumber(trade.amount, 4)} {trade.token}
                </div>
                <div className="recent-trades-time">
                  {formatTime(trade.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
});

RecentTrades.displayName = 'RecentTrades';

export default RecentTrades;
