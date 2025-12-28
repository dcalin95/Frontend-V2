import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createChart } from 'lightweight-charts';
import BrandLogo from '../components/BrandLogo';
import './CandlestickChart.css';

const CandlestickChart = ({ 
  symbol = 'BTCUSDT',
  defaultTimeframe = '15m',
  height = 450,
  showFullscreen = true,
  showHeader = true,
  autoUpdate = true,
  updateInterval = 30000,
}) => {
  const chartContainerRef = useRef(null);
  const chartWrapperRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [chartHeight, setChartHeight] = useState(height);

  // Timeframe configurations (memoized so effects deps stay stable)
  const timeframes = useMemo(() => ({
    '1m': { interval: '1m', limit: 100, label: '1m' },
    '5m': { interval: '5m', limit: 100, label: '5m' },
    '15m': { interval: '15m', limit: 100, label: '15m' },
    '1h': { interval: '1h', limit: 100, label: '1H' },
    '4h': { interval: '4h', limit: 100, label: '4H' },
    '1d': { interval: '1d', limit: 100, label: '1D' },
  }), []);

  // Fullscreen handlers
  const toggleFullscreen = () => {
    if (!chartWrapperRef.current) return;

    if (!document.fullscreenElement) {
      chartWrapperRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Zoom controls
  const zoomIn = () => {
    setChartHeight(prev => Math.min(prev + 100, 800)); // Max 800px
  };

  const zoomOut = () => {
    setChartHeight(prev => Math.max(prev - 100, 200)); // Min 200px
  };

  const resetZoom = () => {
    setChartHeight(height);
  };

  // Fetch candlestick data from Binance
  const fetchCandlestickData = async (sym, interval, limit) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform Binance klines to lightweight-charts format
      const candlestickData = data.map(candle => ({
        time: candle[0] / 1000, // Convert to seconds
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
      }));
      
      const volumeData = data.map(candle => ({
        time: candle[0] / 1000,
        value: parseFloat(candle[5]),
        color: parseFloat(candle[4]) >= parseFloat(candle[1]) 
          ? 'rgba(38, 166, 154, 0.5)' // Green if close >= open
          : 'rgba(239, 83, 80, 0.5)',  // Red if close < open
      }));
      
      // Calculate current price and change
      if (data.length >= 2) {
        const latestCandle = data[data.length - 1];
        const previousCandle = data[data.length - 2];
        const currentClose = parseFloat(latestCandle[4]);
        const previousClose = parseFloat(previousCandle[4]);
        const change = ((currentClose - previousClose) / previousClose) * 100;
        
        setCurrentPrice(currentClose);
        setPriceChange(change);
      }
      
      setLoading(false);
      return { candlestickData, volumeData };
      
    } catch (err) {
      console.error('Candlestick fetch error:', err);
      setError(err.message);
      setLoading(false);
      return null;
    }
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#848e9c',
      },
      grid: {
        vertLines: { color: 'rgba(43, 49, 57, 0.4)' },
        horzLines: { color: 'rgba(43, 49, 57, 0.4)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        borderColor: '#2b3139',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#2b3139',
      },
      crosshair: {
        mode: 1, // Normal crosshair mode
        vertLine: {
          color: '#758696',
          width: 1,
          style: 3, // Dashed
          labelBackgroundColor: '#2b3139',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2b3139',
        },
      },
    });

    // Add candlestick series - lightweight-charts v5.x uses different API
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: true,
      wickVisible: true,
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Add volume series as histogram
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Set as an overlay
      scaleMargins: {
        top: 0.7, // Position volume at bottom 30%
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [height]);

  // Update chart height when chartHeight changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({ height: chartHeight });
      // Reposition candles beautifully
      chartRef.current.timeScale().fitContent();
    }
  }, [chartHeight]);

  // Fetch and update data when symbol or timeframe changes
  useEffect(() => {
    const updateChartData = async () => {
      if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;

      const config = timeframes[timeframe];
      const data = await fetchCandlestickData(symbol, config.interval, config.limit);
      
      if (data) {
        candlestickSeriesRef.current.setData(data.candlestickData);
        volumeSeriesRef.current.setData(data.volumeData);
        
        // Fit content to show all data
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      }
    };

    updateChartData();

    // Auto-refresh based on prop
    if (autoUpdate) {
      const interval = setInterval(updateChartData, updateInterval);
      return () => clearInterval(interval);
    }
  }, [symbol, timeframe, autoUpdate, updateInterval, timeframes]);

  return (
    <div 
      ref={chartWrapperRef} 
      className={`candlestick-chart-wrapper ${isFullscreen ? 'fullscreen' : ''}`}
    >
      {/* Professional Header (Binance-style) - Optional */}
      {showHeader && (
      <>
      <div className="chart-header-pro">
        {/* Logo BITS + Slogan */}
        <div className="chart-branding">
          <BrandLogo size="sm" />
          <div className="chart-slogan">
            <span className="slogan-main">From Bits to Bitcoin</span>
            <span className="slogan-sub">Powering DeFi Trading</span>
          </div>
        </div>
        
        <div className="chart-actions">
          {loading && (
            <div className="chart-status-inline">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Loading...</span>
            </div>
          )}
          
          {error && (
            <div className="chart-status-inline error">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
            </div>
          )}
          
          {showFullscreen && (
          <button 
            className="fullscreen-btn" 
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
          </button>
          )}
        </div>
      </div>
      
      {/* Price & Stats Bar (Second Row) */}
      <div className="chart-price-bar">
        <div className="price-stats-left">
          <span className="stat-label">Symbol:</span>
          <span className="stat-value">{symbol.replace('USDT', '/USDT')}</span>
          
          {currentPrice && (
            <>
              <div className="stat-divider"></div>
              <span className="stat-label">Price:</span>
              <span className="stat-value price-highlight">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              
              <div className="stat-divider"></div>
              <span className="stat-label">24h Change:</span>
              {priceChange !== null && (
                <span className={`stat-value ${priceChange >= 0 ? 'positive' : 'negative'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              )}
            </>
          )}
        </div>
        
        <div className="price-stats-right">
          <span className="data-source-badge">
            <i className="fas fa-database"></i>
            Binance API
          </span>
        </div>
      </div>
      </>
      )}
      {/* End Header */}

      {/* Timeframe Selector */}
      <div className="timeframe-controls">
        <div className="timeframe-selector">
          {Object.entries(timeframes).map(([key, config]) => (
            <button
              key={key}
              className={`timeframe-btn ${timeframe === key ? 'active' : ''}`}
              onClick={() => setTimeframe(key)}
            >
              {config.label}
            </button>
          ))}
        </div>
        
        <div className="chart-controls-right">
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={zoomOut} title="Zoom Out">
              <i className="fas fa-minus"></i>
            </button>
            <button className="zoom-btn" onClick={resetZoom} title="Reset Zoom">
              <i className="fas fa-undo"></i>
            </button>
            <button className="zoom-btn" onClick={zoomIn} title="Zoom In">
              <i className="fas fa-plus"></i>
            </button>
          </div>
          
          <div className="chart-badge">
            <i className="fas fa-circle" style={{ color: '#26a69a', fontSize: '8px' }}></i>
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="chart-container-pro" />
    </div>
  );
};

export default CandlestickChart;

