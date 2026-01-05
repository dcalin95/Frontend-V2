import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Wallet, AlertCircle } from 'lucide-react';
import SmartTooltip from '../../Presale/components/SmartTooltip';
import bitsLogo from '../../assets/logo.png';
import bnbLogo from '../../assets/icons/bnb.svg';
import './DEX.css';
import './DEX.mobile.css';
import './TradingChart.css';
import './TradingChart.mobile.css';

// TradingView symbol mapping
const TRADINGVIEW_SYMBOL_MAP = {
  'BTC': 'BINANCE:BTCUSDT',
  'BTCB': 'BINANCE:BTCUSDT',
  'xBTC': 'BINANCE:BTCUSDT',
  'ETH': 'BINANCE:ETHUSDT',
  'WETH': 'BINANCE:ETHUSDT',
  'BNB': 'BINANCE:BNBUSDT', // ✅ Native BNB
  'bBNB': 'BINANCE:BNBUSDT', // ✅ Wrapped/Bridge BNB
  'WBNB': 'BINANCE:BNBUSDT', // ✅ Wrapped BNB
  'SOL': 'BINANCE:SOLUSDT',
  'USDT': 'BINANCE:USDTUSDT',
  'USDC': 'BINANCE:USDCUSDT',
  'STX': 'BINANCE:STXUSDT',
  'BITS': 'BINANCE:BTCUSDT' // Fallback to BTC for BITS
};

// Global flag to prevent multiple simultaneous initializations
const widgetInstances = new Map();

const TradingChart = ({ 
  fromToken = 'BTC', 
  toToken = 'BNB',
  walletAddress = null,
  bitsBalance = '0',
  ethBalance = '0',
  nativeSymbol = 'BNB',
  connectorName = '',
  chainId = null,
  onConnectWallet = () => {},
  onDisconnectWallet = () => {},
  onSwitchNetwork = () => {}
}) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [containerId] = useState(() => `tradingview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // 🎯 NEW: User preferences (saved to localStorage)
  const [userPreferences, setUserPreferences] = useState(() => {
    const saved = localStorage.getItem('tradingview_preferences');
    const isMobile = window.innerWidth <= 768;
    
    return saved ? JSON.parse(saved) : {
      interval: '15',
      // 📱 MOBILE: Only MA, no RSI/MACD to save space
      indicators: isMobile ? ['MASimple'] : ['MASimple', 'RSI', 'MACD'],
      theme: 'dark'
    };
  });

  // Get TradingView symbol for the current token
  const tradingViewSymbol = TRADINGVIEW_SYMBOL_MAP[fromToken] || 'BINANCE:BTCUSDT';

  useEffect(() => {
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
        // SECURITY: Use textContent or removeChild instead of innerHTML
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
      
      // Remove from global registry
      widgetInstances.delete(containerId);
    };

    // Check if TradingView is already loaded
    const initWidget = () => {
      if (!window.TradingView) {
        console.warn('⚠️ TradingView not loaded yet, retrying...');
        // Retry after a short delay
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

      // Ensure container exists and has dimensions
      if (!containerRef.current) {
        console.error('❌ Container ref lost during init');
        setIsLoading(false);
        return;
      }

      // Check if widget already exists in this container
      if (containerRef.current && containerRef.current.querySelector('iframe')) {
        console.log('⚠️ TradingView iframe already exists, skipping init...');
        setIsLoading(false);
        return;
      }

      // Check if widgetRef already has a widget
      if (widgetRef.current) {
        console.log('⚠️ Widget reference already exists, skipping init...');
        setIsLoading(false);
        return;
      }

      // Ensure container has minimum dimensions
      const container = containerRef.current;
      if (container.offsetHeight === 0 || container.offsetWidth === 0) {
        console.warn('⚠️ Container has no dimensions, waiting...', {
          height: container.offsetHeight,
          width: container.offsetWidth
        });
        // Wait for container to have dimensions
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
        // Use the unique container ID
        if (containerRef.current) {
          containerRef.current.id = containerId;
        }

        console.log('🚀 [TradingChart] Initializing TradingView widget for:', tradingViewSymbol, 'in container:', containerId, {
          containerHeight: containerRef.current.offsetHeight,
          containerWidth: containerRef.current.offsetWidth,
          containerId: containerId,
          tradingViewSymbol: tradingViewSymbol,
          interval: userPreferences.interval,
          theme: userPreferences.theme
        });

        // 📱 Detect mobile
        const isMobile = window.innerWidth <= 768;

        console.log('🔵 [TradingChart] Creating widget with config...');
        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: tradingViewSymbol,
          interval: userPreferences.interval, // 🎯 User preference
          timezone: 'Etc/UTC',
          theme: userPreferences.theme, // 🎯 User preference
          style: '1',
          locale: 'en',
          toolbar_bg: '#0a0a0e',
          enable_publishing: false,
          hide_top_toolbar: true,     // ✅ Hide TradingView native top toolbar (both desktop & mobile)
          hide_legend: isMobile,      // 🎯 MOBILE: Hide legend
          save_image: !isMobile,
          container_id: containerId,
          // 🎯 IMPROVED: More indicators based on user preferences
          studies: userPreferences.indicators.map(ind => {
            const indicatorMap = {
              'MASimple': 'MASimple@tv-basicstudies',
              'RSI': 'RSI@tv-basicstudies',
              'MACD': 'MACD@tv-basicstudies',
              'BB': 'BB@tv-basicstudies', // Bollinger Bands
              'EMA': 'MAExp@tv-basicstudies'
            };
            return indicatorMap[ind];
          }).filter(Boolean),
          // UI customization
          backgroundColor: '#0a0a0e',
          gridColor: 'rgba(139, 155, 180, 0.1)', // 🎯 IMPROVED: More visible grid
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
          // 🎯 IMPROVED: Better indicator styling
          studies_overrides: {
            'volume.volume.color.0': '#E6444D',
            'volume.volume.color.1': '#00FFA3',
            'volume.volume.transparency': 65,
            // RSI styling
            'RSI.plot.color': '#8b9bb4',
            'RSI.hlines background.color': '#0a0a0e',
            'RSI.Plot.linewidth': 2,
            // MACD styling
            'MACD.histogram.color': '#00FFA3',
            'MACD.macd.color': '#2962FF',
            'MACD.signal.color': '#FF6D00'
          },
          overrides: {
            // 🎯 IMPROVED: More vibrant and contrasting colors
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
            // 🎯 IMPROVED: More visible grid lines
            'paneProperties.vertGridProperties.color': 'rgba(139, 155, 180, 0.12)',
            'paneProperties.horzGridProperties.color': 'rgba(139, 155, 180, 0.12)',
            'paneProperties.vertGridProperties.style': 0,
            'paneProperties.horzGridProperties.style': 0,
            // 🎯 IMPROVED: Better text contrast
            'scalesProperties.textColor': '#FFFFFF',
            'scalesProperties.fontSize': 12,
            'scalesProperties.lineColor': 'rgba(139, 155, 180, 0.3)'
          },
          disabled_features: [
            'use_localstorage_for_settings',
            'header_symbol_search',
            ...(isMobile ? [
              'left_toolbar', // 🎯 MOBILE: No left toolbar
              'header_widget', // 🎯 MOBILE: No header widget
              'timeframes_toolbar', // 🎯 MOBILE: No timeframes toolbar
              'go_to_date', // 🎯 MOBILE: Remove complexity
              'display_market_status', // 🎯 MOBILE: Save space
            ] : [])
          ],
          enabled_features: [
            'study_templates',
            ...(isMobile ? [
              'hide_left_toolbar_by_default',
              'chart_crosshair_menu', // 🎯 MOBILE: Touch-friendly menu
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

        // Register widget instance globally
        widgetInstances.set(containerId, widgetRef.current);

        setIsLoading(false);
        console.log('✅ TradingView widget loaded successfully for:', tradingViewSymbol, '- Container:', containerId);
      } catch (error) {
        console.error('❌ TradingView widget initialization failed:', error);
        setIsLoading(false);
      }
    };

    // Initialize after ensuring container is ready
    const initializeTradingView = () => {
      console.log('🔵 [TradingChart] Starting initialization...', {
        containerId,
        hasContainerRef: !!containerRef.current,
        containerDimensions: containerRef.current ? {
          height: containerRef.current.offsetHeight,
          width: containerRef.current.offsetWidth,
          clientHeight: containerRef.current.clientHeight,
          clientWidth: containerRef.current.clientWidth
        } : null
      });

      // Use a small delay to ensure container is mounted and has dimensions
      setTimeout(() => {
        if (!containerRef.current) {
          console.error('❌ [TradingChart] Container ref not available after delay');
          setIsLoading(false);
          return;
        }

        // Check if this container already has a widget instance
        if (widgetInstances.has(containerId)) {
          console.log('⚠️ [TradingChart] Widget already registered for container:', containerId);
          setIsLoading(false);
          return;
        }

        // Check if container has dimensions - be more lenient
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        console.log('🔵 [TradingChart] Container dimensions check:', {
          offsetHeight: container.offsetHeight,
          offsetWidth: container.offsetWidth,
          clientHeight: container.clientHeight,
          clientWidth: container.clientWidth,
          rectHeight: rect.height,
          rectWidth: rect.width,
          computedStyle: window.getComputedStyle(container).height,
          computedStyleWidth: window.getComputedStyle(container).width
        });

        // More lenient check - allow if at least one dimension is > 0
        if (container.offsetHeight === 0 && container.offsetWidth === 0 && rect.height === 0 && rect.width === 0) {
          console.warn('⚠️ [TradingChart] Container has no dimensions yet, retrying...', {
            offsetHeight: container.offsetHeight,
            offsetWidth: container.offsetWidth,
            rectHeight: rect.height,
            rectWidth: rect.width
          });
          // Try to force dimensions
          if (container.style.height === '' || container.style.height === 'auto') {
            container.style.height = '400px';
            container.style.minHeight = '400px';
          }
          if (container.style.width === '' || container.style.width === 'auto') {
            container.style.width = '100%';
          }
          setTimeout(initializeTradingView, 500);
          return;
        }

        // Load TradingView script if not already loaded
        if (!window.TradingView) {
          // Check if script is already in DOM (might be loading)
          const existingScript = document.querySelector('script[src*="tradingview.com/tv.js"]');
          
          if (existingScript) {
            // Script exists, wait for it to load
            console.log('📜 [TradingChart] TradingView script exists in DOM, waiting for load...');
            let attempts = 0;
            const maxAttempts = 150; // 15 seconds total
            
            const checkLoaded = setInterval(() => {
              attempts++;
              if (window.TradingView) {
                console.log('✅ [TradingChart] TradingView loaded after', attempts * 100, 'ms');
                clearInterval(checkLoaded);
                setTimeout(initWidget, 300); // Small delay to ensure it's ready
              } else if (attempts >= maxAttempts) {
                console.error('❌ [TradingChart] TradingView script timeout after 15s');
                clearInterval(checkLoaded);
                setIsLoading(false);
              }
            }, 100);
          } else {
            // Script doesn't exist, create and load it
            console.log('📜 [TradingChart] Loading TradingView script from https://s3.tradingview.com/tv.js...');
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/tv.js';
            script.async = true;
            script.defer = false;
            script.crossOrigin = 'anonymous';
            script.integrity = ''; // Remove integrity if it exists
            
            // Add event listeners BEFORE appending
            script.onload = () => {
              console.log('✅ [TradingChart] TradingView script loaded successfully');
              // Wait a bit more to ensure TradingView object is fully initialized
              let checkCount = 0;
              const checkTradingView = setInterval(() => {
                checkCount++;
                if (window.TradingView && typeof window.TradingView.widget === 'function') {
                  console.log('✅ [TradingChart] window.TradingView.widget is available, initializing widget...');
                  clearInterval(checkTradingView);
                  setTimeout(initWidget, 300);
                } else if (checkCount > 50) {
                  console.error('❌ [TradingChart] window.TradingView not available after 5s');
                  clearInterval(checkTradingView);
                  setIsLoading(false);
                }
              }, 100);
            };
            
            script.onerror = (error) => {
              console.error('❌ [TradingChart] Failed to load TradingView script:', error);
              console.error('❌ [TradingChart] Script src:', script.src);
              console.error('❌ [TradingChart] Network error or CORS issue - trying alternative method');
              
              // Try alternative: load via iframe method
              setIsLoading(false);
              
              // Show error message to user
              if (containerRef.current) {
                containerRef.current.innerHTML = `
                  <div style="padding: 20px; text-align: center; color: #ff4757;">
                    <h3>⚠️ TradingView Chart Failed to Load</h3>
                    <p>Please check your internet connection and try refreshing the page.</p>
                    <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #00FFA3; border: none; border-radius: 6px; cursor: pointer;">
                      Refresh Page
                    </button>
                  </div>
                `;
              }
            };
            
            // Set a timeout to detect if script never loads
            const loadTimeout = setTimeout(() => {
              if (!window.TradingView) {
                console.error('❌ [TradingChart] Script load timeout - TradingView still not available');
                setIsLoading(false);
              }
            }, 20000); // 20 seconds timeout
            
            // Clear timeout when script loads
            const originalOnload = script.onload;
            script.onload = () => {
              clearTimeout(loadTimeout);
              originalOnload();
            };
            
            document.head.appendChild(script);
            console.log('📜 [TradingChart] Script element appended to head');
          }
        } else {
          // TradingView already loaded, just init widget
          console.log('✅ [TradingChart] TradingView already loaded, initializing widget...');
          setTimeout(initWidget, 300); // Small delay to ensure container is ready
        }
      }, 300); // Initial delay to ensure DOM is ready
    };

    // Start initialization
    initializeTradingView();

    // Cleanup on unmount or symbol change
    return () => {
      console.log('🧹 Cleaning up TradingView widget...');
      destroyWidget();
      // Remove fullscreen class from body on cleanup
      document.body.classList.remove('chart-fullscreen-active');
    };
  }, [tradingViewSymbol, containerId, userPreferences]);

  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    
    // Add/remove body class to prevent scrolling
    if (newFullscreenState) {
      document.body.classList.add('chart-fullscreen-active');
    } else {
      document.body.classList.remove('chart-fullscreen-active');
    }
  };

  // 🎯 NEW: Save user preferences
  const updatePreferences = (newPrefs) => {
    const updated = { ...userPreferences, ...newPrefs };
    setUserPreferences(updated);
    localStorage.setItem('tradingview_preferences', JSON.stringify(updated));
  };

  // 🎯 NEW: Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // ESC to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      // F11 or F for fullscreen toggle
      if ((e.key === 'f' || e.key === 'F' || e.key === 'F11') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      // 1-5 for quick timeframe change (only if not typing in input)
      if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        const timeframes = { '1': '1', '2': '5', '3': '15', '4': '60', '5': 'D' };
        if (timeframes[e.key]) {
          updatePreferences({ interval: timeframes[e.key] });
          window.location.reload(); // Reload to apply new interval
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, userPreferences]);

  return (
    <div className={`dex-chart ${isFullscreen ? 'dex-chart-fullscreen' : ''}`}>
      <div className="dex-chart-header">
        <div className="dex-chart-title">
          <span className="text-highlight">TRADING</span> CHART
          {/* 🎯 Quick timeframe selector */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: '12px', alignItems: 'center' }}>
            {['1', '5', '15', '60', 'D'].map(tf => (
              <button
                key={tf}
                onClick={() => {
                  updatePreferences({ interval: tf });
                  window.location.reload();
                }}
                className="chart-action-btn"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.7rem',
                  fontFamily: "'Roboto Mono', 'Courier New', monospace",
                  fontWeight: userPreferences.interval === tf ? '700' : '500',
                  color: userPreferences.interval === tf ? '#00FFA3' : 'rgba(255,255,255,0.7)',
                  background: userPreferences.interval === tf ? 'rgba(0, 255, 163, 0.2)' : 'rgba(255,255,255,0.05)',
                  border: userPreferences.interval === tf ? '1px solid #00FFA3' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textShadow: userPreferences.interval === tf ? '0 0 8px rgba(0, 255, 163, 0.5)' : 'none',
                  minWidth: '38px'
                }}
              >
                {tf === 'D' ? '1D' : `${tf}m`}
              </button>
            ))}
          </div>
        </div>
        
        <div className="dex-chart-header-actions">
          {/* 🎯 Wallet Info */}
          {!walletAddress ? (
            <button 
              className="chart-action-btn" 
              onClick={onConnectWallet}
            >
              <Wallet size={14} />
              <span>Connect</span>
            </button>
          ) : (
            <>
              <div className="chart-wallet-balance-pill">
                <img src={bitsLogo} alt="BITS" style={{ width: 14, height: 14 }} />
                <span>{parseFloat(bitsBalance).toFixed(2)} BITS</span>
              </div>
              <div className="chart-wallet-balance-pill">
                <img src={bnbLogo} alt={nativeSymbol} style={{ width: 14, height: 14 }} />
                <span>{parseFloat(ethBalance).toFixed(4)} {nativeSymbol}</span>
              </div>
              <div className="chart-wallet-address-chip">
                <span className="wallet-logo">{connectorName || 'Wallet'}</span>
                <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              </div>
              {chainId && chainId !== 56 && (
                <button 
                  className="chart-action-btn warning" 
                  onClick={() => onSwitchNetwork(56)}
                >
                  Switch to BSC
                </button>
              )}
              {chainId && chainId === 56 && (
                <div className="network-pill">
                  <span className="network-dot green"></span>
                  <span>BSC</span>
                </div>
              )}
              <button 
                className="chart-action-btn" 
                onClick={onDisconnectWallet}
              >
                Disconnect
              </button>
            </>
          )}
          
          {/* 🎯 Fullscreen button - Always visible and prominent */}
          <SmartTooltip content={`${isFullscreen ? 'Exit' : 'Enter'} Fullscreen (Press F or ESC)\n\nKeyboard Shortcuts:\n• F = Fullscreen\n• ESC = Exit Fullscreen\n• 1-5 = Quick Timeframes`}>
            <button 
              onClick={toggleFullscreen} 
              className={`chart-action-btn ${isFullscreen ? 'fullscreen-active' : ''}`}
              style={isFullscreen ? {
                background: 'rgba(255, 71, 87, 0.25)',
                border: '2px solid rgba(255, 71, 87, 0.6)',
                color: '#FF4757',
                fontWeight: '700',
                padding: '10px 16px',
                minWidth: '90px',
                boxShadow: '0 0 20px rgba(255, 71, 87, 0.4)',
                fontSize: '0.85rem'
              } : {}}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={18} />}
              <span style={{ marginLeft: '8px', fontSize: isFullscreen ? '0.85rem' : '0.75rem', fontWeight: isFullscreen ? '700' : '500' }}>
                {isFullscreen ? 'EXIT' : 'Full'}
              </span>
            </button>
          </SmartTooltip>
        </div>
      </div>

      <div className="dex-chart-body" style={{ position: 'relative', height: '100%', margin: 0, padding: 0 }}>
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
            minHeight: '400px',  // ✅ Minimum height for TradingView
            minWidth: '100%',     // ✅ Ensure full width
            margin: 0,
            padding: 0,
            display: 'block',     // ✅ Ensure it's a block element
            position: 'relative',  // ✅ For proper positioning
            backgroundColor: 'transparent', // ✅ Ensure it's visible
            overflow: 'hidden'    // ✅ Prevent overflow
          }} 
        />
      </div>

      <div className="dex-chart-footer">
        {/* 🎯 NEW: Active indicators display */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          fontSize: '0.7rem',
          opacity: 0.8,
          flexWrap: 'wrap'
        }}>
          <span>Indicators:</span>
          {userPreferences.indicators.map(ind => (
            <span 
              key={ind}
              style={{
                background: 'rgba(139, 155, 180, 0.2)',
                padding: '2px 6px',
                borderRadius: '4px',
                color: '#00FFA3'
              }}
            >
              {ind}
            </span>
          ))}
        </div>
        
        <SmartTooltip content={
            `TRADINGVIEW ADVANCED CHART\n
            Professional-grade charting with all features.\n
            • 100+ Technical Indicators (RSI, MACD, BB, etc.)\n
            • Drawing Tools (Trendlines, Fibonacci, etc.)\n
            • Multiple Timeframes (1m to 1W)\n
            • Volume Profile & Order Flow Analysis\n
            • Keyboard Shortcuts: F=Fullscreen, 1-5=Timeframes`
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
