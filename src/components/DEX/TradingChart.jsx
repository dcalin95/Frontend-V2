import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import SmartTooltip from '../../Presale/components/SmartTooltip';
import './DEX.css';
import './DEX.mobile.css';
import './TradingChart.css';
import './TradingChart.mobile.css';

// TradingView symbol mapping
const TRADINGVIEW_SYMBOL_MAP = {
  'BTC': 'BINANCE:BTCUSDT',
  'xBTC': 'BINANCE:BTCUSDT',
  'ETH': 'BINANCE:ETHUSDT',
  'WETH': 'BINANCE:ETHUSDT',
  'bBNB': 'BINANCE:BNBUSDT',
  'BNB': 'BINANCE:BNBUSDT',
  'SOL': 'BINANCE:SOLUSDT',
  'USDT': 'BINANCE:USDTUSDT',
  'USDC': 'BINANCE:USDCUSDT',
  'STX': 'BINANCE:STXUSDT',
  'BITS': 'BINANCE:BTCUSDT' // Fallback to BTC for BITS
};

const TradingChart = ({ fromToken = 'BTC', toToken = 'bBNB' }) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [containerId] = useState(() => `tradingview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Get TradingView symbol for the current token
  const tradingViewSymbol = TRADINGVIEW_SYMBOL_MAP[fromToken] || 'BINANCE:BTCUSDT';

  useEffect(() => {
    if (!containerRef.current) return;

    // Cleanup function to properly destroy widget
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
      
      // Clear container completely
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };

    // Check if TradingView is already loaded
    const initWidget = () => {
      if (!window.TradingView) {
        console.warn('TradingView not loaded yet');
        return;
      }

      // Check if widget already exists in this container
      if (containerRef.current && containerRef.current.querySelector('iframe')) {
        console.log('⚠️ TradingView iframe already exists, skipping init...');
        return;
      }

      // Check if widgetRef already has a widget
      if (widgetRef.current) {
        console.log('⚠️ Widget reference already exists, skipping init...');
        return;
      }

      try {
        // Use the unique container ID
        if (containerRef.current) {
          containerRef.current.id = containerId;
        }

        console.log('🚀 Initializing TradingView widget for:', tradingViewSymbol);

        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: tradingViewSymbol,
          interval: '15',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0a0a0e',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: true,
          container_id: containerId,
          // Advanced features
          studies: [
            'Volume@tv-basicstudies',
            'MASimple@tv-basicstudies'
          ],
          // UI customization
          backgroundColor: '#0a0a0e',
          gridColor: 'rgba(139, 155, 180, 0.06)',
          hide_side_toolbar: false,
          allow_symbol_change: true,
          watchlist: [
            'BINANCE:BTCUSDT',
            'BINANCE:ETHUSDT',
            'BINANCE:BNBUSDT',
            'BINANCE:SOLUSDT',
            'BINANCE:STXUSDT'
          ],
          details: true,
          hotlist: true,
          calendar: false,
          // Chart settings
          studies_overrides: {},
          overrides: {
            'mainSeriesProperties.candleStyle.upColor': '#00FFA3',
            'mainSeriesProperties.candleStyle.downColor': '#E6444D',
            'mainSeriesProperties.candleStyle.drawWick': true,
            'mainSeriesProperties.candleStyle.drawBorder': true,
            'mainSeriesProperties.candleStyle.borderColor': '#378658',
            'mainSeriesProperties.candleStyle.borderUpColor': '#00FFA3',
            'mainSeriesProperties.candleStyle.borderDownColor': '#E6444D',
            'mainSeriesProperties.candleStyle.wickUpColor': '#00FFA3',
            'mainSeriesProperties.candleStyle.wickDownColor': '#E6444D',
            'paneProperties.background': '#0a0a0e',
            'paneProperties.backgroundType': 'solid',
            'paneProperties.vertGridProperties.color': 'rgba(139, 155, 180, 0.06)',
            'paneProperties.horzGridProperties.color': 'rgba(139, 155, 180, 0.06)',
            'scalesProperties.textColor': '#8b9bb4',
            'scalesProperties.lineColor': 'rgba(139, 155, 180, 0.2)'
          },
          disabled_features: [
            'use_localstorage_for_settings',
            'header_symbol_search',
            'header_screenshot'
          ],
          enabled_features: [
            'study_templates',
            'side_toolbar_in_fullscreen_mode',
            'header_in_fullscreen_mode'
          ],
          loading_screen: { backgroundColor: '#0a0a0e' },
          favorites: {
            intervals: ['1', '5', '15', '60', '240', 'D', 'W'],
            chartTypes: ['Area', 'Candles', 'Line', 'Bars']
          }
        });

        setIsLoading(false);
        console.log('✅ TradingView widget loaded successfully for:', tradingViewSymbol);
      } catch (error) {
        console.error('❌ TradingView widget initialization failed:', error);
        setIsLoading(false);
      }
    };

    // Load TradingView script if not already loaded
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = initWidget;
      script.onerror = () => {
        console.error('❌ Failed to load TradingView script');
        setIsLoading(false);
      };
      
      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
      if (!existingScript) {
        document.head.appendChild(script);
      } else {
        initWidget();
      }
    } else {
      // TradingView already loaded, just init widget
      initWidget();
    }

    // Cleanup on unmount or symbol change
    return () => {
      console.log('🧹 Cleaning up TradingView widget...');
      destroyWidget();
    };
  }, [tradingViewSymbol, containerId]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`dex-chart ${isFullscreen ? 'fullscreen-chart' : ''}`}>
      <div className="dex-chart-header">
        <div className="dex-chart-title">
          <span className="text-highlight">TRADING</span> CHART
        </div>
        
        <div className="dex-chart-header-actions">
          <SmartTooltip content={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}>
            <button onClick={toggleFullscreen} className="chart-action-btn">
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </SmartTooltip>
        </div>
      </div>

      <div className="dex-chart-body" style={{ position: 'relative', height: '100%' }}>
        {isLoading && (
          <div className="loading-overlay">
            <div className="pulse-icon">📊</div>
            <span>LOADING TRADINGVIEW...</span>
          </div>
        )}
        
        <div 
          id={containerId}
          ref={containerRef}
          style={{ 
            width: '100%', 
            height: '100%',
            minHeight: '500px'
          }} 
        />
      </div>

      <div className="dex-chart-footer">
        <SmartTooltip content={
            `TRADINGVIEW ADVANCED CHART\n
            Professional-grade charting with all features.\n
            • 100+ Technical Indicators (RSI, MACD, BB, etc.)\n
            • Drawing Tools (Trendlines, Fibonacci, etc.)\n
            • Multiple Timeframes (1m to 1W)\n
            • Volume Profile & Order Flow Analysis`
        }>
            <span style={{cursor: 'help'}}>
              <span className="text-highlight">TradingView</span> Advanced Chart • Powered by $<span className="solana-gradient-text">BITS</span> Protocol
            </span>
        </SmartTooltip>
        <div className="status-dot-container">
            <div className={`status-dot ${isLoading ? 'yellow' : 'green'}`}></div>
            {isLoading ? 'LOADING' : 'OPERATIONAL'}
        </div>
      </div>
    </div>
  );
};

export default TradingChart;
