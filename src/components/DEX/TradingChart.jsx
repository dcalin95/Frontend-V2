import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import axios from 'axios';
import { Activity, RefreshCw, BarChart3, Maximize2, Minimize2 } from 'lucide-react';
import SmartTooltip from '../../Presale/components/SmartTooltip';
import './DEX.css';
import './DEX.mobile.css';
import './TradingChart.css';
import './TradingChart.mobile.css';

// Moved outside component to avoid dependency issues
const COIN_GECKO_MAP = {
  'BTC': 'bitcoin',
  'xBTC': 'wrapped-bitcoin',
  'ETH': 'ethereum',
  'WETH': 'weth',
  'SOL': 'solana',
  'bBNB': 'binancecoin',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'BITS': 'bitcoin' 
};

const TIMEFRAME_CONFIG = {
  '1M': { days: 0.2, interval: 'minute' },
  '15M': { days: 1, interval: 'minute' },
  '1H': { days: 7, interval: 'hourly' }, 
  '4H': { days: 30, interval: 'hourly' },
  '1D': { days: 90, interval: 'daily' },
  '1W': { days: 365, interval: 'daily' }
};

const TradingChart = ({ fromToken = 'BTC', toToken = 'bBNB' }) => {
  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const candlestickSeries = useRef(null);
  const volumeSeries = useRef(null);
  
  const [timeframe, setTimeframe] = useState('15M');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isChartReady, setIsChartReady] = useState(false); // New state to track init
  const [stats, setStats] = useState({ high: 0, low: 0, vol: 0 });
  const [tooltip, setTooltip] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const lastCandleRef = useRef(null);
  const intervalRef = useRef(null);

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    // Prevent rapid refetching if not needed, but ensure refetch on token change
    setLoading(true);
    
    // Helper: Generate Mock Data (moved inside to avoid dependency warning)
    const generateMockData = (days, stepSeconds) => {
       const now = Math.floor(Date.now() / 1000);
       const dataPoints = [];
       const steps = Math.floor((days * 24 * 3600) / stepSeconds);
       
       // Dynamic Base Price based on Token
       let price = 65000; // Default BTC
       if (fromToken === 'ETH' || fromToken === 'WETH') price = 3500;
       else if (fromToken === 'SOL') price = 145;
       else if (fromToken === 'bBNB') price = 600;
       else if (fromToken === 'USDT' || fromToken === 'USDC') price = 1;
       else if (fromToken === 'BITS') price = 0.85;
       else if (fromToken === 'STX') price = 2.50;
       
       let trend = 0; 

       for(let i = steps; i > 0; i--) {
           const time = now - (i * stepSeconds);
           let volatility = price * (timeframe === '1M' ? 0.0008 : 0.02); 
           
           // Add some randomness to trend based on token so charts look different
           const randomSeed = (fromToken.charCodeAt(0) + i) % 100;
           trend += ((randomSeed / 50) - 1) * 0.0001; // Slight drift
           
           trend = Math.max(Math.min(trend, 0.01), -0.01);

           let change = (Math.random() - 0.5 + trend) * volatility;
           
           if (timeframe === '1M' && Math.abs(change) < volatility * 0.3) {
               change = (Math.random() > 0.5 ? 1 : -1) * volatility * (0.5 + Math.random()); 
           }

           const open = price;
           const close = price + change;
           
           const highWick = Math.random() * volatility * (timeframe === '1M' ? 1.5 : 0.5);
           const lowWick = Math.random() * volatility * (timeframe === '1M' ? 1.5 : 0.5);

           const high = Math.max(open, close) + highWick;
           const low = Math.min(open, close) - lowWick;
           const volume = Math.random() * 1000000 * (Math.random() > 0.9 ? 5 : 1);
           
           dataPoints.push({ time, open, high, low, close, volume });
           price = close;
       }
       return dataPoints;
    };

    const processMockData = (data) => {
        if (!data || data.length === 0) {
            return;
        }
        
        const candles = data.map(d => ({
            time: d.time, open: d.open, high: d.high, low: d.low, close: d.close
        }));
        const volumes = data.map(d => ({
            time: d.time, value: d.volume, 
            color: d.close >= d.open ? 'rgba(48, 195, 113, 0.5)' : 'rgba(230, 68, 77, 0.5)'
        }));
        
        updateChart(candles, volumes);
        
        // Force fit content with a slight delay to ensure render cycle is complete
        if (chartInstance.current) {
           requestAnimationFrame(() => {
               if (chartInstance.current) {
                  chartInstance.current.timeScale().fitContent();
               }
           });
        }
    };

    const processData = (prices, totalVolumes) => {
        const candles = [];
        const volumes = [];
        
        let groupSize = 1;
        if (timeframe === '1M') groupSize = 1; 
        else if (timeframe === '15M') groupSize = 15; 
        else if (timeframe === '4H') groupSize = 4;
        
        for (let i = 0; i < prices.length; i += groupSize) {
          const chunk = prices.slice(i, i + groupSize);
          if (chunk.length === 0) continue;

          const chunkPrices = chunk.map(p => p[1]);
          const open = chunkPrices[0];
          const close = chunkPrices[chunkPrices.length - 1];
          const high = Math.max(...chunkPrices);
          const low = Math.min(...chunkPrices);
          const time = chunk[0][0] / 1000; 

          const volChunk = totalVolumes.slice(i, i + groupSize);
          const volSum = volChunk.reduce((acc, val) => acc + val[1], 0);
          const vol = volSum / groupSize;

          const color = close >= open ? 'rgba(48, 195, 113, 0.5)' : 'rgba(230, 68, 77, 0.5)';

          candles.push({ time, open, high, low, close });
          volumes.push({ time, value: vol, color });
        }
        updateChart(candles, volumes);
    };
    
    // Toggle între date LIVE (CoinGecko API) și Mock Data
    // ATENȚIE: CoinGecko FREE tier are rate limits (10-50 req/min)
    // Pentru tokeni custom (BITS, STX), folosește fallback la BTC
    const useRealData = false; // true = LIVE API | false = Mock Data pentru demo stabil

    const coinId = COIN_GECKO_MAP[fromToken] || 'bitcoin';
    const config = TIMEFRAME_CONFIG[timeframe];
    
    try {
      let prices, totalVolumes;

      if (useRealData) {
          const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
            { 
              params: { 
                vs_currency: 'usd', 
                days: config.days,
                interval: config.interval === 'minute' ? undefined : config.interval 
              },
              timeout: 2000 // Timeout scurt ca sa nu tinem userul in loading
            }
          );
          prices = response.data.prices;
          totalVolumes = response.data.total_volumes;
      } else {
          // GENERATE UNIQUE MOCK DATA BASED ON TOKEN ID to simulate different charts
          throw new Error("Demo Mode: Using generated data");
      }

      if (!prices || prices.length === 0) throw new Error("No data");

      processData(prices, totalVolumes);

    } catch (error) {
      // console.log("Switching to Mock Data due to:", error.message);
      const step = timeframe === '1M' ? 60 : (timeframe === '15M' ? 900 : 3600);
      const mock = generateMockData(config.days, step);
      processMockData(mock);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromToken, timeframe]); // chartInstance, candlestickSeries, volumeSeries sunt refs și nu trebuie în dependencies

  // Trigger data fetch ONLY when chart is ready and deps change
  useEffect(() => {
    if (isChartReady) {
        fetchData();
    }
  }, [isChartReady, fetchData, fromToken, toToken]); // Explicitly add fromToken/toToken to deps

  const updateChart = (candles, volumes) => {
      if (!candlestickSeries.current || !volumeSeries.current) {
          return;
      }
      
      if (candles.length === 0) {
          return;
      }
      
      candlestickSeries.current.setData(candles);
      volumeSeries.current.setData(volumes);
      
      if (chartInstance.current) {
         chartInstance.current.timeScale().fitContent();
      }
      
      if (candles.length > 0) {
          lastCandleRef.current = { ...candles[candles.length - 1] };
      }

      const lastCandle = candles[candles.length - 1];
      setCurrentPrice(lastCandle.close);
      
      const startPrice = candles[0].open;
      const change = ((lastCandle.close - startPrice) / startPrice) * 100;
      setPriceChange(change);

      const allHigh = Math.max(...candles.map(c => c.high));
      const allLow = Math.min(...candles.map(c => c.low));
      const totalVol = volumes.reduce((acc, v) => acc + v.value, 0); 

      setStats({
        high: allHigh,
        low: allLow,
        vol: totalVol
      });
  };

  // --- RESIZE CHART ON FULLSCREEN CHANGE ---
  useEffect(() => {
      if (!chartInstance.current || !chartContainerRef.current) return;
      
      // Delay pentru a aștepta Portal-ul să facă render
      const resizeTimer = setTimeout(() => {
          let newWidth, newHeight;
          
          if (isFullscreen) {
              newWidth = window.innerWidth;
              newHeight = window.innerHeight - 140;
          } else {
              newWidth = chartContainerRef.current.clientWidth || 800;
              newHeight = chartContainerRef.current.clientHeight || 400;
          }
          
          if (newWidth > 0 && newHeight > 0) {
              chartInstance.current.applyOptions({ 
                  width: newWidth, 
                  height: newHeight 
              });
              chartInstance.current.timeScale().fitContent();
          }
      }, 100);
      
      return () => clearTimeout(resizeTimer);
  }, [isFullscreen]);

  // --- ESC KEY TO EXIT FULLSCREEN ---
  useEffect(() => {
      const handleEscKey = (e) => {
          if (e.key === 'Escape' && isFullscreen) {
              setIsFullscreen(false);
              
              // Cleanup
              document.body.classList.remove('chart-fullscreen-active');
              document.body.style.overflow = '';
              
              const chartSection = document.querySelector('.dex-chart-section');
              const topSplit = document.querySelector('.dex-top-split');
              const tradingArea = document.querySelector('.dex-trading-area');
              const pageContainer = document.querySelector('.dex-page-container');
              
              if (chartSection) chartSection.style.position = '';
              if (topSplit) topSplit.style.position = '';
              if (tradingArea) tradingArea.style.overflow = '';
              if (pageContainer) pageContainer.style.overflow = '';
          }
      };

      window.addEventListener('keydown', handleEscKey);
      return () => window.removeEventListener('keydown', handleEscKey);
  }, [isFullscreen]);
  
  // --- CLEANUP ON UNMOUNT ---
  useEffect(() => {
      return () => {
          document.body.classList.remove('chart-fullscreen-active');
          document.body.style.overflow = '';
          
          const chartSection = document.querySelector('.dex-chart-section');
          const topSplit = document.querySelector('.dex-top-split');
          const tradingArea = document.querySelector('.dex-trading-area');
          const pageContainer = document.querySelector('.dex-page-container');
          
          if (chartSection) chartSection.style.position = '';
          if (topSplit) topSplit.style.position = '';
          if (tradingArea) tradingArea.style.overflow = '';
          if (pageContainer) pageContainer.style.overflow = '';
      };
  }, []);

  // --- LIVE PRICE UPDATE SIMULATION ---
  useEffect(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
          if (!lastCandleRef.current || !candlestickSeries.current) return;

          const lastCandle = lastCandleRef.current;
          const volatility = lastCandle.close * 0.0002; 
          const change = (Math.random() - 0.5) * volatility;
          
          const newClose = lastCandle.close + change;
          const newHigh = Math.max(lastCandle.high, newClose);
          const newLow = Math.min(lastCandle.low, newClose);
          
          const updatedCandle = {
              ...lastCandle,
              close: newClose,
              high: newHigh,
              low: newLow
          };
          
          lastCandleRef.current = updatedCandle;
          candlestickSeries.current.update(updatedCandle);
          setCurrentPrice(newClose);

      }, 500); 

      return () => {
          if (intervalRef.current) clearInterval(intervalRef.current);
      };
  }, [timeframe, loading]);

  // --- CHART INITIALIZATION ---
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartInstance.current) {
        chartInstance.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#556677',
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: 'rgba(48, 195, 113, 0.5)', // XTB Green semi-transparent
          style: 3, 
          labelBackgroundColor: '#30C371',
        },
        horzLine: {
          color: 'rgba(48, 195, 113, 0.5)',
          labelBackgroundColor: '#30C371',
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        scaleMargins: {
            top: 0.1,
            bottom: 0.2,
        }
      },
    });

    const candles = chart.addCandlestickSeries({
      upColor: '#30C371',
      downColor: '#E6444D',
      borderVisible: false,
      wickUpColor: '#30C371',
      wickDownColor: '#E6444D',
    });
    candlestickSeries.current = candles;

    const volumes = chart.addHistogramSeries({
      color: '#26a69a', // Base color, overriden by data
      priceFormat: { type: 'volume' },
      priceScaleId: '', 
    });
    volumes.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeries.current = volumes;
    
    // TOOLTIP LOGIC
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current.clientHeight
      ) {
        setTooltip(null);
      } else {
        const data = param.seriesData.get(candles);
        const vol = param.seriesData.get(volumes);
        if (data) {
          setTooltip({
            o: data.open,
            h: data.high,
            l: data.low,
            c: data.close,
            v: vol ? vol.value : 0
          });
        }
      }
    });

    chartInstance.current = chart;
    setIsChartReady(true); // Mark chart as ready

    // ResizeObserver logic to handle container resizing
    const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
        const newRect = entries[0].contentRect;
        // Only apply options if dimensions are valid
        if (newRect.width > 0 && newRect.height > 0) {
            chart.applyOptions({ width: newRect.width, height: newRect.height });
            chart.timeScale().fitContent();
        }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartInstance.current = null;
    };
  }, []);

  const toggleFullscreen = () => {
      const newFullscreenState = !isFullscreen;
      setIsFullscreen(newFullscreenState);
      
      console.log('🔍 Toggling fullscreen:', newFullscreenState);
      
      // Add/remove class from body AND parent containers to prevent scrolling and manage z-index
      if (newFullscreenState) {
          document.body.classList.add('chart-fullscreen-active');
          document.body.style.overflow = 'hidden';
          
          // Find and modify parent containers directly (fallback for browsers without :has() support)
          const chartSection = document.querySelector('.dex-chart-section');
          const topSplit = document.querySelector('.dex-top-split');
          const tradingArea = document.querySelector('.dex-trading-area');
          const pageContainer = document.querySelector('.dex-page-container');
          
          console.log('📦 Found containers:', {
              chartSection: !!chartSection,
              topSplit: !!topSplit,
              tradingArea: !!tradingArea,
              pageContainer: !!pageContainer
          });
          
          if (chartSection) {
              chartSection.style.position = 'static';
              chartSection.style.zIndex = '999999';
              console.log('✅ Modified chartSection');
          }
          if (topSplit) {
              topSplit.style.position = 'static';
              topSplit.style.zIndex = '999999';
              console.log('✅ Modified topSplit');
          }
          if (tradingArea) {
              tradingArea.style.overflow = 'visible';
              tradingArea.style.zIndex = '999999';
              console.log('✅ Modified tradingArea');
          }
          if (pageContainer) {
              pageContainer.style.overflow = 'visible';
              pageContainer.style.position = 'static';
              console.log('✅ Modified pageContainer');
          }
      } else {
          document.body.classList.remove('chart-fullscreen-active');
          document.body.style.overflow = '';
          
          // Restore parent containers
          const chartSection = document.querySelector('.dex-chart-section');
          const topSplit = document.querySelector('.dex-top-split');
          const tradingArea = document.querySelector('.dex-trading-area');
          const pageContainer = document.querySelector('.dex-page-container');
          
          if (chartSection) chartSection.style.cssText = '';
          if (topSplit) topSplit.style.cssText = '';
          if (tradingArea) tradingArea.style.cssText = '';
          if (pageContainer) pageContainer.style.cssText = '';
          
          console.log('✅ Restored all containers');
      }
      
      // Wait for DOM update and CSS transition
      requestAnimationFrame(() => {
          setTimeout(() => {
              if (chartInstance.current && chartContainerRef.current) {
                  let newWidth, newHeight;
                  
                  if (newFullscreenState) {
                      // Fullscreen - folosește dimensiunile viewport-ului
                      newWidth = window.innerWidth;
                      newHeight = window.innerHeight - 140; // Header + Footer
                  } else {
                      // Normal - folosește dimensiunile containerului
                      newWidth = chartContainerRef.current.clientWidth;
                      newHeight = chartContainerRef.current.clientHeight;
                  }
                  
                  if (newWidth > 0 && newHeight > 0) {
                      chartInstance.current.applyOptions({ 
                          width: newWidth, 
                          height: newHeight 
                      });
                      
                      // Force redraw
                      chartInstance.current.timeScale().fitContent();
                  }
              }
          }, 200);
      });
  };

  const formatPrice = (p) => p ? p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---';
  const formatVol = (v) => {
    if (!v) return '0';
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    return `$${(v / 1e3).toFixed(2)}K`;
  };

  return (
    <div className={`dex-chart-wrapper ${isFullscreen ? 'dex-chart-fullscreen' : ''}`}>
      {isFullscreen && (
        <div className="fullscreen-indicator">
          <span>Fullscreen Mode</span>
          <span className="esc-hint">Press ESC to exit</span>
        </div>
      )}
      <div className="dex-chart-header-modern">
        <div className="dex-token-info">
            <SmartTooltip content={
                `PREDICTIVE MARKET ANALYSIS\n
                Beyond standard charting.\n
                • AI identifies accumulation zones patterns\n
                • Detects 'Whale Movements' before breaks\n
                • Future: Overlay probability heatmaps`
            }>
                <div className="dex-pair-title" style={{cursor: 'help'}}>
                    {fromToken}/{toToken}
                    <span className="dex-badge-perp">PERP</span>
                </div>
            </SmartTooltip>
            <div className="dex-price-display">
                <span className={`current-price ${priceChange >= 0 ? 'text-up' : 'text-down'}`} style={{ fontSize: '1.7rem' }}>
                    ${formatPrice(currentPrice)}
                </span>
                <span className="price-change" style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
            </div>
        </div>

        <div className="dex-stats-row">
            <div className="stat-box">
                <label>24h High</label>
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{formatPrice(stats.high)}</span>
            </div>
            <div className="stat-box">
                <label>24h Low</label>
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{formatPrice(stats.low)}</span>
            </div>
            <div className="stat-box">
                <label>24h Vol</label>
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{formatVol(stats.vol)}</span>
            </div>
        </div>

        <div className="dex-controls">
            <SmartTooltip content={
                `MULTI-TIMEFRAME AI CORRELATION\n
                Cross-referencing trends.\n
                • AI scans monthly trends vs 15m entries\n
                • Filters out market noise automatically\n
                • Suggests optimal entry timeframes`
            }>
                <div className="timeframe-pills">
                    {Object.keys(TIMEFRAME_CONFIG).map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`tf-pill ${timeframe === tf ? 'active' : ''}`}
                    >
                        {tf}
                    </button>
                    ))}
                </div>
            </SmartTooltip>
            
            <button onClick={fetchData} className="refresh-btn" title="Refresh Data">
                <RefreshCw size={16} strokeWidth={2} className={loading ? 'spin' : ''} />
            </button>

            <button onClick={toggleFullscreen} className="refresh-btn" title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen"}>
                {isFullscreen ? <Minimize2 size={16} strokeWidth={2} /> : <Maximize2 size={16} strokeWidth={2} />}
            </button>
        </div>
      </div>

      <div className="dex-chart-body">
        <div ref={chartContainerRef} className="chart-container-div" />
        
        {/* FLOATING TOOLTIP */}
        {tooltip && (
          <div className="dex-chart-tooltip">
             <div className="tooltip-item">
               <span className="tooltip-label">O:</span>
               <span className="tooltip-val">{tooltip.o.toFixed(2)}</span>
             </div>
             <div className="tooltip-item">
               <span className="tooltip-label">H:</span>
               <span className="tooltip-val">{tooltip.h.toFixed(2)}</span>
             </div>
             <div className="tooltip-item">
               <span className="tooltip-label">L:</span>
               <span className="tooltip-val">{tooltip.l.toFixed(2)}</span>
             </div>
             <div className="tooltip-item">
               <span className="tooltip-label">C:</span>
               <span className={`tooltip-val ${tooltip.c >= tooltip.o ? 'up' : 'down'}`}>{tooltip.c.toFixed(2)}</span>
             </div>
             <div className="tooltip-item">
               <span className="tooltip-label">Vol:</span>
               <span className="tooltip-val">{formatVol(tooltip.v)}</span>
             </div>
          </div>
        )}
        
        {loading && (
          <div className="loading-overlay">
             <Activity className="pulse-icon" size={36} strokeWidth={2} />
             <span>SYNCING MARKET DATA...</span>
          </div>
        )}

        <div className="watermark">
           <BarChart3 size={140} strokeWidth={1.5} />
        </div>
      </div>

      <div className="dex-chart-footer">
        <SmartTooltip content={
            `BLOCKCHAIN DATA ORACLE\n
            Real-time verified data stream.\n
            • Aggregates price feeds from Chainlink\n
            • Cross-verified with CEX volume data\n
            • 100% tamper-proof historical records`
        }>
            <span style={{cursor: 'help'}}><span className="text-highlight">BIITS</span> Oracle v3.0 • Demo Data Feed</span>
        </SmartTooltip>
        <div className="status-dot-container">
            <div className={`status-dot ${loading ? 'yellow' : 'green'}`}></div>
            {loading ? 'UPDATING' : 'OPERATIONAL'}
        </div>
      </div>
    </div>
  );
};

export default TradingChart;
