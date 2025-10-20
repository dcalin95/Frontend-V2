import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { toast } from 'react-toastify';
import WalletContext from '../context/WalletContext';
import './BITSTradingSimulator.css';
import './CompactStyles.css';
import './ChartPlaceholder.css';

const BITSTradingSimulator = () => {
  // Wallet context pentru teste practice
  const { walletAddress, connectWallet, disconnectWallet } = useContext(WalletContext);
  
  // Component mounted ref - more reliable than state
  const isMountedRef = useRef(true);
  
  // Portfolio state - persistent în localStorage
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem('bits_trading_portfolio');
    console.log('Loading portfolio from localStorage:', saved);
    return saved ? JSON.parse(saved) : {
      bitsBalance: 10000, // Starting with 10,000 BITS
      holdings: {}, // { symbol: { amount, avgPrice, totalCost } }
      totalValue: 10000,
      totalPnL: 0,
      trades: [], // Trade history
      lastUpdated: Date.now()
    };
  });

  // Initialize component mounted state
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Market data state
  const [marketData, setMarketData] = useState({});
  const [marketDataError, setMarketDataError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [orderType, setOrderType] = useState('market');
  const [orderSide, setOrderSide] = useState('buy');
  const [orderAmount, setOrderAmount] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  // TEMPORARILY DISABLED - const [chartWidget, setChartWidget] = useState(null);

  // Available trading pairs (top cryptocurrencies)
  const tradingPairs = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT',
    'LINKUSDT', 'LTCUSDT', 'BCHUSDT', 'XLMUSDT', 'UNIUSDT',
    'SOLUSDT', 'AVAXUSDT', 'MATICUSDT', 'ATOMUSDT', 'FILUSDT'
  ];

  // Fallback market data in case API fails
  const fallbackMarketData = {
    'BTCUSDT': { symbol: 'BTCUSDT', price: 114277.51, change24h: 0.89, volume24h: 1000000, high24h: 115000, low24h: 113000, lastUpdate: Date.now() },
    'ETHUSDT': { symbol: 'ETHUSDT', price: 3456.78, change24h: 1.23, volume24h: 800000, high24h: 3500, low24h: 3400, lastUpdate: Date.now() },
    'BNBUSDT': { symbol: 'BNBUSDT', price: 678.90, change24h: -0.45, volume24h: 600000, high24h: 680, low24h: 675, lastUpdate: Date.now() },
    'ADAUSDT': { symbol: 'ADAUSDT', price: 0.45, change24h: 2.10, volume24h: 400000, high24h: 0.46, low24h: 0.44, lastUpdate: Date.now() },
    'DOTUSDT': { symbol: 'DOTUSDT', price: 7.89, change24h: 1.56, volume24h: 300000, high24h: 8.00, low24h: 7.80, lastUpdate: Date.now() }
  };

  // Fetch real-time prices from Binance API with retry logic
  const fetchMarketData = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) setLoading(true);
      setMarketDataError(null);
      
      // Fetch 24hr ticker statistics for all pairs
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BitSwapDEX-TradingSimulator/1.0'
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Filter and format data for our trading pairs
      const formattedData = {};
      data.forEach(ticker => {
        if (tradingPairs.includes(ticker.symbol)) {
          formattedData[ticker.symbol] = {
            symbol: ticker.symbol,
            price: parseFloat(ticker.lastPrice),
            change24h: parseFloat(ticker.priceChangePercent),
            volume24h: parseFloat(ticker.volume),
            high24h: parseFloat(ticker.highPrice),
            low24h: parseFloat(ticker.lowPrice),
            lastUpdate: Date.now()
          };
        }
      });
      
      // Verify we got data for at least some pairs
      if (Object.keys(formattedData).length === 0) {
        throw new Error('No valid trading pair data received');
      }
      
      setMarketData(formattedData);
      setRetryCount(0); // Reset retry count on success
      
      // Update price history for charts
      setPriceHistory(prev => {
        const updated = { ...prev };
        Object.keys(formattedData).forEach(symbol => {
          if (!updated[symbol]) updated[symbol] = [];
          updated[symbol].push({
            time: Date.now(),
            price: formattedData[symbol].price
          });
          // Keep only last 100 points
          if (updated[symbol].length > 100) {
            updated[symbol] = updated[symbol].slice(-100);
          }
        });
        return updated;
      });
      
    } catch (error) {
      console.error('Error fetching market data:', error);
      
      // If this is a retry and we still fail, use fallback data
      if (isRetry || retryCount >= 2) {
        console.log('Using fallback market data due to API failure');
        setMarketData(fallbackMarketData);
        setMarketDataError('Using fallback data - API temporarily unavailable');
        
        // Show a less aggressive error message
        if (!isRetry) {
          toast.info('Market data temporarily unavailable - using fallback prices');
        }
      } else {
        // Increment retry count and try again
        setRetryCount(prev => prev + 1);
        setMarketDataError(`API Error: ${error.message}`);
        
        // Retry after a delay
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchMarketData(true);
          }
        }, 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      if (!isRetry) setLoading(false);
    }
  }, [retryCount]);

  // Calculate portfolio value based on current prices
  const calculatePortfolioValue = useCallback(() => {
    let totalValue = portfolio.bitsBalance;
    let totalPnL = 0;
    
    Object.entries(portfolio.holdings).forEach(([symbol, holding]) => {
      const currentPrice = marketData[symbol]?.price || 0;
      const currentValue = holding.amount * currentPrice;
      const costBasis = holding.totalCost;
      
      totalValue += currentValue;
      totalPnL += (currentValue - costBasis);
    });
    
    return { totalValue, totalPnL };
  }, [portfolio, marketData]);

  // Execute trade
  const executeTrade = () => {
    if (!selectedPair || !orderAmount || (orderType === 'limit' && !orderPrice)) {
      toast.error('Please fill all required fields');
      return;
    }

    const amount = parseFloat(orderAmount);
    const currentPrice = marketData[selectedPair]?.price || 0;
    const price = orderType === 'market' ? currentPrice : parseFloat(orderPrice);
    
    if (!price || !amount) {
      toast.error('Invalid amount or price');
      return;
    }

    const totalCost = amount * price;
    const symbol = selectedPair;

    if (orderSide === 'buy') {
      // Check if user has enough BITS
      if (totalCost > portfolio.bitsBalance) {
        toast.error('Insufficient BITS balance');
        return;
      }

      // Execute buy order
      const newPortfolio = { ...portfolio };
      newPortfolio.bitsBalance -= totalCost;
      
      if (!newPortfolio.holdings[symbol]) {
        newPortfolio.holdings[symbol] = {
          amount: 0,
          avgPrice: 0,
          totalCost: 0
        };
      }
      
      const existingHolding = newPortfolio.holdings[symbol];
      const newTotalAmount = existingHolding.amount + amount;
      const newTotalCost = existingHolding.totalCost + totalCost;
      
      newPortfolio.holdings[symbol] = {
        amount: newTotalAmount,
        avgPrice: newTotalCost / newTotalAmount,
        totalCost: newTotalCost
      };

      // Add to trade history
      newPortfolio.trades.unshift({
        id: Date.now(),
        symbol,
        side: 'buy',
        amount,
        price,
        total: totalCost,
        timestamp: Date.now(),
        type: orderType
      });

      setPortfolio(newPortfolio);
      console.log('Portfolio updated after BUY:', newPortfolio);
      toast.success(`Bought ${amount} ${symbol.replace('USDT', '')} for ${totalCost.toFixed(2)} BITS`);
      
    } else {
      // Sell order
      const holding = portfolio.holdings[symbol];
      if (!holding || holding.amount < amount) {
        toast.error('Insufficient holdings to sell');
        return;
      }

      const newPortfolio = { ...portfolio };
      const saleValue = amount * price;
      
      newPortfolio.bitsBalance += saleValue;
      newPortfolio.holdings[symbol].amount -= amount;
      newPortfolio.holdings[symbol].totalCost -= (amount * newPortfolio.holdings[symbol].avgPrice);
      
      // Remove holding if amount becomes 0
      if (newPortfolio.holdings[symbol].amount <= 0) {
        delete newPortfolio.holdings[symbol];
      }

      // Add to trade history
      newPortfolio.trades.unshift({
        id: Date.now(),
        symbol,
        side: 'sell',
        amount,
        price,
        total: saleValue,
        timestamp: Date.now(),
        type: orderType
      });

      setPortfolio(newPortfolio);
      console.log('Portfolio updated after SELL:', newPortfolio);
      toast.success(`Sold ${amount} ${symbol.replace('USDT', '')} for ${saleValue.toFixed(2)} BITS`);
    }

    // Clear form
    setOrderAmount('');
    setOrderPrice('');
  };

  // Reset portfolio
  const resetPortfolio = () => {
    if (window.confirm('Are you sure you want to reset your portfolio? This action cannot be undone.')) {
      const resetPortfolio = {
        bitsBalance: 10000,
        holdings: {},
        totalValue: 10000,
        totalPnL: 0,
        trades: [],
        lastUpdated: Date.now()
      };
      setPortfolio(resetPortfolio);
      localStorage.setItem('bits_trading_portfolio', JSON.stringify(resetPortfolio));
      toast.success('Portfolio reset successfully');
    }
  };

  // Save portfolio to localStorage whenever it changes
  useEffect(() => {
    const updatedPortfolio = {
      ...portfolio,
      lastUpdated: Date.now()
    };
    console.log('Saving portfolio to localStorage:', updatedPortfolio);
    localStorage.setItem('bits_trading_portfolio', JSON.stringify(updatedPortfolio));
  }, [portfolio]);

  // TEMPORARILY DISABLED - Initialize TradingView Chart
  /*
  const initTradingViewChart = useCallback(() => {
    if (typeof window !== 'undefined' && window.TradingView && isMountedRef.current) {
      try {
        // Clean up existing widget if it exists
        if (chartWidget && typeof chartWidget.remove === 'function') {
          try {
            chartWidget.remove();
          } catch (error) {
            console.log('Existing chart cleanup error:', error);
          }
        }
        
        const widget = new window.TradingView.widget({
          width: '100%',
          height: 400,
          symbol: `BINANCE:${selectedPair}`,
          interval: '15',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#1e2329',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: true,
          save_image: false,
          container_id: 'tradingview-chart',
          studies: ['RSI', 'MACD'],
          overrides: {
            'paneProperties.background': '#1e2329',
            'paneProperties.vertGridProperties.color': '#2b3139',
            'paneProperties.horzGridProperties.color': '#2b3139',
            'symbolWatermarkProperties.transparency': 90,
            'scalesProperties.textColor': '#848e9c',
          }
        });
        
        if (isMountedRef.current) {
          setChartWidget(widget);
        }
      } catch (error) {
        console.error('TradingView chart initialization error:', error);
      }
    }
  }, [selectedPair, chartWidget]);
  */

  // TEMPORARILY DISABLED - Load TradingView script and initialize chart
  /*
  useEffect(() => {
    isMountedRef.current = true;
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      setTimeout(initTradingViewChart, 100);
    };
    document.head.appendChild(script);

    return () => {
      // Script cleanup only - chart cleanup handled by dedicated effect
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []); // Remove isMounted dependency to prevent circular updates
  */

  // TEMPORARILY DISABLED - Update chart when selected pair changes
  /*
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    if (chartWidget && typeof chartWidget.setSymbol === 'function') {
      try {
        chartWidget.setSymbol(`BINANCE:${selectedPair}`, '15');
      } catch (error) {
        console.log('Chart symbol update error:', error);
        // Re-initialize if widget has issues
        if (isMountedRef.current) {
          setTimeout(initTradingViewChart, 500);
        }
      }
    } else {
      // Re-initialize if widget doesn't exist
      if (isMountedRef.current) {
        setTimeout(initTradingViewChart, 500);
      }
    }
  }, [selectedPair, initTradingViewChart, chartWidget]);
  */

  // Fetch market data on component mount and periodically
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    let interval;
    try {
      // Initial fetch
      fetchMarketData();
      
      // Set up interval for updates - reduced frequency to prevent API overload
      interval = setInterval(() => {
        if (isMountedRef.current && !marketDataError) {
          // Only fetch if we don't have an error
          fetchMarketData();
        }
      }, 30000); // Update every 30 seconds instead of 5 seconds
    } catch (error) {
      console.error('Market data fetch error:', error);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchMarketData, marketDataError]);

  // TEMPORARILY DISABLED - Component cleanup effect
  /*
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Clean up TradingView widget
      if (chartWidget && typeof chartWidget.remove === 'function') {
        try {
          chartWidget.remove();
        } catch (error) {
          console.log('Final chart cleanup error:', error);
        }
      }
    };
  }, [chartWidget]);
  */

  // Calculate current portfolio value
  const { totalValue, totalPnL } = calculatePortfolioValue();
  const pnlPercentage = ((totalValue - 10000) / 10000) * 100;

  return (
    <div className="bits-trading-simulator">
      {/* Header */}
      <div className="trading-header">
        <div className="header-left">
          <h1>
            <i className="fas fa-rocket"></i>
            $BITS Pre-Exchange Training Platform
            <span className="beta-badge">PRE-LAUNCH</span>
          </h1>
          <p>
            Prepare for $BITS Exchange Listing • Practice Trading • Master Strategies
            <span className="live-indicator">
              <i className="fas fa-circle"></i>
              LIVE DATA
            </span>
          </p>
          <div className="launch-info">
            <i className="fas fa-info-circle"></i>
            Training platform for upcoming $BITS exchange listings. Master trading before mainnet launch!
          </div>
        </div>
        <div className="header-right">
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-label">Mode</span>
              <span className="stat-value">
                {walletAddress ? 'Practice Mode' : 'Training Mode'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">API Status</span>
              <span className={`stat-value ${marketDataError ? 'error' : 'success'}`}>
                {loading ? 'Updating...' : 
                 marketDataError ? 'Fallback Data' : 'Live Data'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Last Update</span>
              <span className="stat-value">
                {Object.keys(marketData).length > 0 ? 
                  new Date().toLocaleTimeString() : 
                  'Loading...'
                }
              </span>
            </div>
            <div className="stat-item">
              <button 
                className="refresh-btn" 
                onClick={() => fetchMarketData()}
                disabled={loading}
                title="Refresh market data"
              >
                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
                {loading ? 'Updating...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          <div className="header-actions">
            {!walletAddress ? (
              <button className="wallet-btn connect" onClick={connectWallet}>
                <i className="fas fa-wallet"></i>
                Connect Wallet for Practice
              </button>
            ) : (
              <div className="wallet-connected">
                <div className="wallet-info">
                  <i className="fas fa-check-circle"></i>
                  <span className="wallet-address">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
                <button className="wallet-btn disconnect" onClick={disconnectWallet}>
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            )}
            
            <button className="reset-btn" onClick={resetPortfolio}>
              <i className="fas fa-redo"></i>
              Reset Portfolio
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Practice Banner */}
      {walletAddress && (
        <div className="practice-banner">
          <div className="banner-content">
            <div className="banner-left">
              <i className="fas fa-graduation-cap"></i>
              <div className="banner-text">
                <h3>Practice Mode Active</h3>
                <p>Wallet connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</p>
              </div>
            </div>
            <div className="banner-right">
              <div className="practice-features">
                <span className="feature-tag">
                  <i className="fas fa-shield-alt"></i>
                  Safe Training
                </span>
                <span className="feature-tag">
                  <i className="fas fa-chart-line"></i>
                  Real Data
                </span>
                <span className="feature-tag">
                  <i className="fas fa-rocket"></i>
                  Pre-Launch Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Status Banner */}
      {marketDataError && (
        <div className="api-status-banner">
          <div className="banner-content">
            <div className="banner-left">
              <i className="fas fa-exclamation-triangle"></i>
              <div className="banner-text">
                <h3>API Temporarily Unavailable</h3>
                <p>Using fallback market data for uninterrupted trading practice</p>
              </div>
            </div>
            <div className="banner-right">
              <button 
                className="retry-btn" 
                onClick={() => fetchMarketData()}
                disabled={loading}
              >
                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
                {loading ? 'Retrying...' : 'Retry API'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Summary */}
      <div className="portfolio-summary">
        <div className="portfolio-card">
          <div className="portfolio-item">
            <span className="label">Available BITS</span>
            <span className="value">{portfolio.bitsBalance.toFixed(2)}</span>
          </div>
          <div className="portfolio-item">
            <span className="label">Total Portfolio Value</span>
            <span className="value">{totalValue.toFixed(2)} BITS</span>
          </div>
          <div className="portfolio-item">
            <span className="label">Total P&L</span>
            <span className={`value ${totalPnL >= 0 ? 'profit' : 'loss'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} BITS ({pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="trading-container">
        {/* Main Trading Area */}
        <div className="trading-main">
          {/* Chart and Market Data */}
          <div className="chart-section">
            <div className="chart-header">
              <div className="chart-title">
                <h2>
                  <i className="fas fa-chart-candlestick"></i>
                  {selectedPair?.replace('USDT', '/USDT')} Chart
                </h2>
                <div className="data-source">
                  <i className="fas fa-database"></i>
                  Data: Binance API • Real-time
                </div>
              </div>
              {marketData[selectedPair] && (
                <div className="price-info">
                  <span className="current-price">${marketData[selectedPair].price.toLocaleString()}</span>
                  <span className={`price-change ${marketData[selectedPair].change24h >= 0 ? 'positive' : 'negative'}`}>
                    {marketData[selectedPair].change24h >= 0 ? '+' : ''}{marketData[selectedPair].change24h.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            
            {/* Temporary Chart Placeholder */}
            <div className="chart-container">
              <div className="chart-placeholder">
                <div className="chart-header">
                  <h3>📈 {selectedPair.replace('USDT', '/USDT')} Chart</h3>
                  <div className="price-info">
                    {marketData[selectedPair] && (
                      <>
                        <span className="current-price">
                          ${marketData[selectedPair].price.toLocaleString()}
                        </span>
                        <span className={`price-change ${marketData[selectedPair].change24h >= 0 ? 'positive' : 'negative'}`}>
                          {marketData[selectedPair].change24h >= 0 ? '+' : ''}
                          {marketData[selectedPair].change24h.toFixed(2)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="chart-placeholder-content">
                  <div className="chart-message">
                    <i className="fas fa-chart-area"></i>
                    <h4>Chart Temporarily Disabled</h4>
                    <p>Professional charts will be restored soon</p>
                    <div className="data-source">Data: Binance API • Real-time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Market Overview Compact */}
          <div className="market-overview-compact">
            <div className="market-header-compact">
              <h3>
                <i className="fas fa-list"></i>
                Market Overview
                <span className="data-badge">Live Data</span>
              </h3>
              <div className="market-search-compact">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-compact"
                />
              </div>
            </div>
            
            <div className="market-grid-compact">
              {(() => {
                const filteredPairs = tradingPairs.filter(symbol => 
                  symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  symbol.replace('USDT', '').toLowerCase().includes(searchTerm.toLowerCase())
                );

                return filteredPairs.slice(0, 10).map(symbol => {
                  const data = marketData[symbol];
                  if (!data) return null;
                  
                  return (
                    <div 
                      key={symbol}
                      className={`market-item ${selectedPair === symbol ? 'selected' : ''}`}
                      onClick={() => setSelectedPair(symbol)}
                    >
                      <div className="symbol-info">
                        <span className="symbol">{symbol.replace('USDT', '')}</span>
                        <span className="price">${data.price.toLocaleString()}</span>
                      </div>
                      <span className={`change ${data.change24h >= 0 ? 'positive' : 'negative'}`}>
                        {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}%
                      </span>
                    </div>
                  );
                }).filter(Boolean); // Remove null values
              })()}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="trading-sidebar">
          {/* Trading Panel */}
          <div className="trading-panel">
            <h3>
              <i className="fas fa-exchange-alt"></i>
              Trade {selectedPair?.replace('USDT', '/USDT')}
            </h3>
          
          {marketData[selectedPair] && (
            <div className="price-display">
              <div className="current-price">
                <span className="label">Current Price:</span>
                <span className="price">${marketData[selectedPair].price.toLocaleString()}</span>
              </div>
              <div className="price-change">
                <span className={`change ${marketData[selectedPair].change24h >= 0 ? 'positive' : 'negative'}`}>
                  {marketData[selectedPair].change24h >= 0 ? '+' : ''}{marketData[selectedPair].change24h.toFixed(2)}% (24h)
                </span>
              </div>
            </div>
          )}

          <div className="order-form">
            {/* Order Type & Side */}
            <div className="order-controls">
              <div className="order-type">
                <button 
                  className={`type-btn ${orderType === 'market' ? 'active' : ''}`}
                  onClick={() => setOrderType('market')}
                >
                  Market
                </button>
                <button 
                  className={`type-btn ${orderType === 'limit' ? 'active' : ''}`}
                  onClick={() => setOrderType('limit')}
                >
                  Limit
                </button>
              </div>
              <div className="order-side">
                <button 
                  className={`side-btn buy ${orderSide === 'buy' ? 'active' : ''}`}
                  onClick={() => setOrderSide('buy')}
                >
                  Buy
                </button>
                <button 
                  className={`side-btn sell ${orderSide === 'sell' ? 'active' : ''}`}
                  onClick={() => setOrderSide('sell')}
                >
                  Sell
                </button>
              </div>
            </div>

            {/* Order Inputs */}
            <div className="order-inputs">
              {orderType === 'limit' && (
                <div className="input-group">
                  <label>Price (USDT)</label>
                  <input
                    type="number"
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              )}
              
              <div className="input-group">
                <label>Amount ({selectedPair?.replace('USDT', '')})</label>
                <input
                  type="number"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.001"
                />
              </div>

              {marketData[selectedPair] && (
                <div className="order-summary">
                  <div className="summary-row">
                    <span>Total Cost:</span>
                    <span>
                      {(parseFloat(orderAmount || 0) * (orderType === 'market' 
                        ? marketData[selectedPair].price 
                        : parseFloat(orderPrice || 0))).toFixed(2)} BITS
                    </span>
                  </div>
                </div>
              )}

              <button 
                className={`execute-btn ${orderSide}`}
                onClick={executeTrade}
                disabled={loading || !orderAmount}
              >
                {orderSide === 'buy' ? 'Buy' : 'Sell'} {selectedPair?.replace('USDT', '')}
              </button>
            </div>
          </div>

          {/* Holdings Compact */}
          <div className="holdings-section-compact">
            <h2>
              <i className="fas fa-wallet"></i>
              Current Holdings
            </h2>
            
            {Object.keys(portfolio.holdings).length === 0 ? (
              <div className="empty-holdings">
                <i className="fas fa-inbox"></i>
                <p>No holdings yet. Start trading to build your portfolio!</p>
              </div>
            ) : (
              <div className="holdings-grid">
                {Object.entries(portfolio.holdings).map(([symbol, holding]) => {
                  const currentPrice = marketData[symbol]?.price || 0;
                  const currentValue = holding.amount * currentPrice;
                  const pnl = currentValue - holding.totalCost;
                  const pnlPercentage = ((currentValue - holding.totalCost) / holding.totalCost) * 100;
                  
                  return (
                    <div key={symbol} className="holding-card">
                      <div className="holding-header">
                        <span className="symbol">{symbol.replace('USDT', '')}</span>
                        <span className={`pnl ${pnl >= 0 ? 'profit' : 'loss'}`}>
                          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} BITS
                        </span>
                      </div>
                      <div className="holding-details">
                        <div className="detail-row">
                          <span>Amount:</span>
                          <span>{holding.amount.toFixed(6)}</span>
                        </div>
                        <div className="detail-row">
                          <span>Avg Price:</span>
                          <span>${holding.avgPrice.toFixed(2)}</span>
                        </div>
                        <div className="detail-row">
                          <span>Current Price:</span>
                          <span>${currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="detail-row">
                          <span>Value:</span>
                          <span>{currentValue.toFixed(2)} BITS</span>
                        </div>
                        <div className="detail-row">
                          <span>P&L %:</span>
                          <span className={pnl >= 0 ? 'profit' : 'loss'}>
                            {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trade History Compact */}
          <div className="history-section-compact">
            <h3>
              <i className="fas fa-history"></i>
              Recent Trades
            </h3>
            
            {portfolio.trades.length === 0 ? (
              <div className="empty-history">
                <i className="fas fa-chart-bar"></i>
                <p>No trades yet</p>
              </div>
            ) : (
              <div className="trades-list-compact">
                {portfolio.trades.slice(0, 5).map(trade => (
                  <div key={trade.id} className="trade-item">
                    <div className="trade-info">
                      <span className="trade-symbol">{trade.symbol.replace('USDT', '')}</span>
                      <span className={`trade-side ${trade.side}`}>{trade.side.toUpperCase()}</span>
                    </div>
                    <div className="trade-details">
                      <span className="trade-amount">{trade.amount.toFixed(4)}</span>
                      <span className="trade-total">{trade.total.toFixed(2)} BITS</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default BITSTradingSimulator;
