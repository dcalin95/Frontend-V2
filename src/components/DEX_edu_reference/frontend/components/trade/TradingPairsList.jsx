/**
 * 📊 TradingPairsList Component - Trading Pairs List
 * 
 * Component pentru afișarea listei de trading pairs:
 * - Trading pairs cu TokenLogo
 * - Price, change, volume
 * - Search și filter
 * - Binance/PancakeSwap style
 * 
 * @module TradingPairsList
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import TokenLogo from '../common/TokenLogo';
import { Card, Input, Table, Badge, Button } from '../ui';
import { logWithPrefix, errorWithPrefix } from '../../utils/logger';
// NO BACKEND URL - using Binance API directly for REAL prices
import '../../styles/components/trading-pairs-list.css';

const TradingPairsList = ({ 
  onPairSelect,
  selectedPair = null,
  className = ''
}) => {
  const [pairs, setPairs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('volume'); // volume, price, change
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPairs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // FETCH REAL PRICES FROM BINANCE API DIRECT (like SwapModal)
        // All from Binance API only
        const popularTokens = ['BTC', 'ETH', 'BNB', 'CAKE', 'SOL', 'STX', 'MATIC', 'LINK']; // BITS handled separately
        const symbols = JSON.stringify(popularTokens.map(t => `${t}USDT`));
        const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`;
        
        logWithPrefix('TradingPairsList', '✅ Fetching REAL data from Binance API:', symbols);
        
        const response = await fetch(binanceUrl);
        if (!response.ok) {
          throw new Error(`Binance API error: ${response.status}`);
        }
        
        const data = await response.json();
        logWithPrefix('TradingPairsList', '📊 Binance Tickers:', data);
        
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
            volume24h: parseFloat(ticker.volume || 0),
            volume24hFormatted: null
          };
        });
        
        if (fetchedPairs.length > 0) {
          logWithPrefix('TradingPairsList', '✅ Real pairs from Binance:', fetchedPairs);
          setPairs(fetchedPairs);
        } else {
          throw new Error('No pairs fetched from Binance');
        }
      } catch (err) {
        errorWithPrefix('TradingPairsList', '❌ ERROR:', err);
        // Empty on error. Real data from API only.
        setPairs([]);
        setError(err?.message || String(err) || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    loadPairs();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadPairs, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredAndSortedPairs = useMemo(() => {
    let filtered = pairs;
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = pairs.filter(pair => 
        pair.symbol.toLowerCase().includes(query) ||
        pair.baseToken?.toLowerCase().includes(query) ||
        pair.quoteToken?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'volume':
          aValue = a.volume24h || 0;
          bValue = b.volume24h || 0;
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'change':
          aValue = a.change24h || 0;
          bValue = b.change24h || 0;
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    return sorted;
  }, [pairs, searchQuery, sortBy, sortOrder]);

  const handleSort = useCallback((newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  const formatNumber = useCallback((num) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  }, []);

  const formatPrice = useCallback((price) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(8);
  }, []);

  return (
    <Card className={`trading-pairs-list ${className}`} padding="md">
      <Card.Header>
        <Card.Title>Trading Pairs</Card.Title>
        <Input
          type="text"
          placeholder="Search pairs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search size={16} />}
          iconPosition="left"
          size="sm"
          className="trading-pairs-list-search"
        />
      </Card.Header>

      <Card.Body>
        <div className="trading-pairs-list-table-wrapper">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Pair</Table.Head>
                <Table.Head align="right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('price')}
                    className={`trading-pairs-list-col-sortable ${sortBy === 'price' ? 'trading-pairs-list-col-active' : ''}`}
                  >
                    <span>Price</span>
                    {sortBy === 'price' && (
                      <span className="trading-pairs-list-sort-indicator">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </Button>
                </Table.Head>
                <Table.Head align="right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('change')}
                    className={`trading-pairs-list-col-sortable ${sortBy === 'change' ? 'trading-pairs-list-col-active' : ''}`}
                  >
                    <span>24h Change</span>
                    {sortBy === 'change' && (
                      <span className="trading-pairs-list-sort-indicator">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </Button>
                </Table.Head>
                <Table.Head align="right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('volume')}
                    className={`trading-pairs-list-col-sortable ${sortBy === 'volume' ? 'trading-pairs-list-col-active' : ''}`}
                  >
                    <span>24h Volume</span>
                    {sortBy === 'volume' && (
                      <span className="trading-pairs-list-sort-indicator">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </Button>
                </Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredAndSortedPairs.length > 0 ? (
                filteredAndSortedPairs.map((pair, index) => {
                  const isPositive = pair.change24h >= 0;
                  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;
                  const [baseToken, quoteToken] = pair.symbol.split('/');
                  const isSelected = selectedPair === pair.symbol;
                  
                  return (
                    <Table.Row
                      key={index}
                      onClick={() => onPairSelect && onPairSelect(pair)}
                      className={`trading-pairs-list-item ${isSelected ? 'trading-pairs-list-item-selected' : ''}`}
                    >
                      <Table.Cell>
                        <div className="trading-pairs-list-col-pair">
                          <div className="trading-pairs-list-pair-logos">
                            <TokenLogo symbol={baseToken} size="sm" showBorder />
                            <TokenLogo symbol={quoteToken} size="sm" showBorder className="trading-pairs-list-pair-logo-overlap" />
                          </div>
                          <div className="trading-pairs-list-pair-info">
                            <span className="trading-pairs-list-pair-symbol">{pair.symbol}</span>
                            <span className="trading-pairs-list-pair-tokens">{baseToken}/{quoteToken}</span>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <span className="trading-pairs-list-price">
                          {formatPrice(pair.price)}
                        </span>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <Badge variant={isPositive ? 'success' : 'error'} size="sm" className="trading-pairs-list-change-badge">
                          <ChangeIcon size={12} />
                          <span>{isPositive ? '+' : ''}{pair.change24h}%</span>
                        </Badge>
                      </Table.Cell>
                      <Table.Cell align="right">
                        <span className="trading-pairs-list-volume">
                          {pair.volume24hFormatted || formatNumber(pair.volume24h)}
                        </span>
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              ) : (
                <Table.Row>
                  <Table.Cell colSpan={4} align="center" className="trading-pairs-list-empty">
                    No pairs found
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TradingPairsList;
