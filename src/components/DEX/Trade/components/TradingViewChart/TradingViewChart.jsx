/**
 * 📊 TradingViewChart Component
 * 
 * TradingView chart integration pentru Trade Page
 * Similar cu Oxium DEX: https://app.oxium.xyz/trade
 * 
 * Features:
 * - TradingView widget integration
 * - Chart controls (interval, indicators)
 * - Drawing tools
 * - OHLC display
 * - Volume indicator
 */

import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import './TradingViewChart.css';

// TradingView symbol mapping pentru BSC tokens
const TRADINGVIEW_SYMBOL_MAP = {
  'BTC': 'BINANCE:BTCUSDT',
  'BTCB': 'BINANCE:BTCUSDT',
  'ETH': 'BINANCE:ETHUSDT',
  'BNB': 'BINANCE:BNBUSDT',
  'USDT': 'BINANCE:USDTUSDT',
  'USDC': 'BINANCE:USDCUSDT',
  'BITS': 'BINANCE:BTCUSDT' // Fallback
};

const TradingViewChart = ({ 
  tokenIn = 'BTC', 
  tokenOut = 'USDT',
  onFullscreenChange = () => {}
}) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [containerId] = useState(() => `tradingview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // User preferences (saved to localStorage)
  const [userPreferences, setUserPreferences] = useState(() => {
    const saved = localStorage.getItem('trade_chart_preferences');
    const isMobile = window.innerWidth <= 768;
    
    return saved ? JSON.parse(saved) : {
      interval: '240', // 4h default (like Oxium)
      indicators: isMobile ? ['MASimple'] : ['MASimple', 'RSI', 'MACD'],
      theme: 'dark'
    };
  });

  // Get TradingView symbol for the current pair
  const tradingViewSymbol = TRADINGVIEW_SYMBOL_MAP[tokenIn] || 'BINANCE:BTCUSDT';

  useEffect(() => {
    const destroyWidget = () => {
      if (widgetRef.current) {
        try {
          if (widgetRef.current.remove) {
            widgetRef.current.remove();
          }
          widgetRef.current = null;
        } catch (error) {
          console.warn('Widget cleanup warning:', error);
        }
      }
      
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
    };

    const initWidget = () => {
      if (!window.TradingView) {
        console.warn('⚠️ TradingView not loaded yet, retrying...');
        setTimeout(() => {
          if (window.TradingView) {
            initWidget();
          } else {
            console.error('❌ TradingView failed to load after retry');
            setIsLoading(false);
          }
        }, 500);
        return;
      }

      if (!containerRef.current) {
        console.error('❌ Container ref lost during init');
        setIsLoading(false);
        return;
      }

      if (containerRef.current && containerRef.current.querySelector('iframe')) {
        console.log('⚠️ TradingView iframe already exists, skipping init...');
        setIsLoading(false);
        return;
      }

      if (widgetRef.current) {
        console.log('⚠️ Widget reference already exists, skipping init...');
        setIsLoading(false);
        return;
      }

      const container = containerRef.current;
      if (container.offsetHeight === 0 || container.offsetWidth === 0) {
        console.warn('⚠️ Container has no dimensions, waiting...');
        setTimeout(() => {
          if (containerRef.current && containerRef.current.offsetHeight > 0) {
            initWidget();
          } else {
            console.error('❌ Container still has no dimensions');
            setIsLoading(false);
          }
        }, 500);
        return;
      }

      try {
        if (containerRef.current) {
          containerRef.current.id = containerId;
        }

        console.log('🚀 [TradingViewChart] Initializing TradingView widget for:', tradingViewSymbol);

        const isMobile = window.innerWidth <= 768;

        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: tradingViewSymbol,
          interval: userPreferences.interval,
          timezone: 'Etc/UTC',
          theme: userPreferences.theme,
          style: '1', // Candles
          locale: 'en',
          toolbar_bg: '#0a0a0e',
          enable_publishing: false,
          hide_top_toolbar: true,
          hide_legend: isMobile,
          save_image: !isMobile,
          container_id: containerId,
          studies: userPreferences.indicators.map(ind => {
            const indicatorMap = {
              'MASimple': 'MASimple@tv-basicstudies',
              'RSI': 'RSI@tv-basicstudies',
              'MACD': 'MACD@tv-basicstudies',
              'BB': 'BB@tv-basicstudies',
              'EMA': 'MAExp@tv-basicstudies'
            };
            return indicatorMap[ind];
          }).filter(Boolean),
          backgroundColor: '#0a0a0e',
          gridColor: 'rgba(139, 155, 180, 0.1)',
          hide_side_toolbar: false,
          allow_symbol_change: true,
          details: true,
          hotlist: true,
          calendar: false,
          studies_overrides: {
            'volume.volume.color.0': '#E6444D',
            'volume.volume.color.1': '#00FFA3',
            'volume.volume.transparency': 65,
            'RSI.plot.color': '#8b9bb4',
            'RSI.hlines background.color': '#0a0a0e',
            'RSI.Plot.linewidth': 2,
            'MACD.histogram.color': '#00FFA3',
            'MACD.macd.color': '#2962FF',
            'MACD.signal.color': '#FF6D00'
          },
          overrides: {
            'mainSeriesProperties.candleStyle.upColor': '#00FFA3',
            'mainSeriesProperties.candleStyle.downColor': '#FF4757',
            'mainSeriesProperties.candleStyle.drawWick': true,
            'mainSeriesProperties.candleStyle.drawBorder': true,
            'mainSeriesProperties.candleStyle.borderColor': '#378658',
            'mainSeriesProperties.candleStyle.borderUpColor': '#00FFA3',
            'mainSeriesProperties.candleStyle.borderDownColor': '#FF4757',
            'mainSeriesProperties.candleStyle.wickUpColor': '#00FFA3',
            'mainSeriesProperties.candleStyle.wickDownColor': '#FF4757',
            'paneProperties.background': '#0a0a0e',
            'paneProperties.backgroundType': 'solid',
            'paneProperties.vertGridProperties.color': 'rgba(139, 155, 180, 0.12)',
            'paneProperties.horzGridProperties.color': 'rgba(139, 155, 180, 0.12)',
            'paneProperties.vertGridProperties.style': 0,
            'paneProperties.horzGridProperties.style': 0,
            'scalesProperties.textColor': '#FFFFFF',
            'scalesProperties.fontSize': 12,
            'scalesProperties.lineColor': 'rgba(139, 155, 180, 0.3)'
          },
          disabled_features: [
            'use_localstorage_for_settings',
            'header_symbol_search',
            ...(isMobile ? [
              'left_toolbar',
              'header_widget',
              'timeframes_toolbar',
              'go_to_date',
              'display_market_status',
            ] : [])
          ],
          enabled_features: [
            'study_templates',
            ...(isMobile ? [
              'hide_left_toolbar_by_default',
              'chart_crosshair_menu',
              'items_favoriting',
            ] : [
              'side_toolbar_in_fullscreen_mode',
              'header_in_fullscreen_mode',
            ]),
            'create_volume_indicator_by_default',
            'move_logo_to_main_pane'
          ],
          loading_screen: { backgroundColor: '#0a0a0e' },
          favorites: {
            intervals: ['1', '5', '15', '60', '240', 'D', 'W'],
            chartTypes: ['Area', 'Candles', 'Line', 'Bars']
          }
        });

        setIsLoading(false);
        console.log('✅ TradingView widget loaded successfully');
      } catch (error) {
        console.error('❌ TradingView widget initialization failed:', error);
        setIsLoading(false);
      }
    };

    const initializeTradingView = () => {
      setTimeout(() => {
        if (!containerRef.current) {
          console.error('❌ Container ref not available after delay');
          setIsLoading(false);
          return;
        }

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();

        if (container.offsetHeight === 0 && container.offsetWidth === 0 && rect.height === 0 && rect.width === 0) {
          console.warn('⚠️ Container has no dimensions yet, retrying...');
          if (container.style.height === '' || container.style.height === 'auto') {
            container.style.height = '500px';
            container.style.minHeight = '500px';
          }
          if (container.style.width === '' || container.style.width === 'auto') {
            container.style.width = '100%';
          }
          setTimeout(initializeTradingView, 500);
          return;
        }

        if (!window.TradingView) {
          const existingScript = document.querySelector('script[src*="tradingview.com/tv.js"]');
          
          if (existingScript) {
            console.log('📜 TradingView script exists in DOM, waiting for load...');
            let attempts = 0;
            const maxAttempts = 150;
            
            const checkLoaded = setInterval(() => {
              attempts++;
              if (window.TradingView) {
                console.log('✅ TradingView loaded after', attempts * 100, 'ms');
                clearInterval(checkLoaded);
                setTimeout(initWidget, 300);
              } else if (attempts >= maxAttempts) {
                console.error('❌ TradingView script timeout after 15s');
                clearInterval(checkLoaded);
                setIsLoading(false);
              }
            }, 100);
          } else {
            console.log('📜 Loading TradingView script...');
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/tv.js';
            script.async = true;
            script.defer = false;
            script.crossOrigin = 'anonymous';
            
            script.onload = () => {
              console.log('✅ TradingView script loaded successfully');
              let checkCount = 0;
              const checkTradingView = setInterval(() => {
                checkCount++;
                if (window.TradingView && typeof window.TradingView.widget === 'function') {
                  console.log('✅ window.TradingView.widget is available');
                  clearInterval(checkTradingView);
                  setTimeout(initWidget, 300);
                } else if (checkCount > 50) {
                  console.error('❌ window.TradingView not available after 5s');
                  clearInterval(checkTradingView);
                  setIsLoading(false);
                }
              }, 100);
            };
            
            script.onerror = (error) => {
              console.error('❌ Failed to load TradingView script:', error);
              setIsLoading(false);
            };
            
            document.head.appendChild(script);
          }
        } else {
          console.log('✅ TradingView already loaded, initializing widget...');
          setTimeout(initWidget, 300);
        }
      }, 300);
    };

    initializeTradingView();

    return () => {
      console.log('🧹 Cleaning up TradingView widget...');
      destroyWidget();
      if (isFullscreen) {
        document.body.classList.remove('chart-fullscreen-active');
      }
    };
  }, [tradingViewSymbol, containerId, userPreferences, isFullscreen]);

  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    
    if (newFullscreenState) {
      document.body.classList.add('chart-fullscreen-active');
    } else {
      document.body.classList.remove('chart-fullscreen-active');
    }
    
    onFullscreenChange(newFullscreenState);
  };

  const updatePreferences = (newPrefs) => {
    const updated = { ...userPreferences, ...newPrefs };
    setUserPreferences(updated);
    localStorage.setItem('trade_chart_preferences', JSON.stringify(updated));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      if ((e.key === 'f' || e.key === 'F' || e.key === 'F11') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

  return (
    <div className={`trade-chart ${isFullscreen ? 'trade-chart-fullscreen' : ''}`}>
      <div className="trade-chart-header">
        <div className="trade-chart-title">
          <span className="text-highlight">TRADING</span> CHART
          <div className="chart-interval-selector">
            {['1', '5', '15', '60', '240', 'D'].map(tf => (
              <button
                key={tf}
                onClick={() => {
                  updatePreferences({ interval: tf });
                  window.location.reload();
                }}
                className={`interval-btn ${userPreferences.interval === tf ? 'active' : ''}`}
              >
                {tf === 'D' ? '1D' : tf === '240' ? '4h' : `${tf}m`}
              </button>
            ))}
          </div>
        </div>
        
        <div className="trade-chart-actions">
          <button 
            onClick={toggleFullscreen} 
            className={`fullscreen-btn ${isFullscreen ? 'active' : ''}`}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            <span>{isFullscreen ? 'EXIT' : 'Full'}</span>
          </button>
        </div>
      </div>

      <div className="trade-chart-body">
        {isLoading && (
          <div className="chart-loading-overlay">
            <div className="pulse-icon">📊</div>
            <span>LOADING TRADINGVIEW...</span>
          </div>
        )}
        
        <div 
          id={containerId}
          ref={containerRef}
          className="tradingview-container"
        />
      </div>

      <div className="trade-chart-footer">
        <div className="chart-indicators">
          <span>Indicators:</span>
          {userPreferences.indicators.map(ind => (
            <span key={ind} className="indicator-badge">
              {ind}
            </span>
          ))}
        </div>
        
        <span className="chart-powered-by">
          <span className="text-highlight">TradingView</span> Advanced Chart
        </span>
        
        <div className="chart-status">
          <div className={`status-dot ${isLoading ? 'yellow' : 'green'}`}></div>
          {isLoading ? 'LOADING' : 'OPERATIONAL'}
        </div>
      </div>
    </div>
  );
};

export default TradingViewChart;

