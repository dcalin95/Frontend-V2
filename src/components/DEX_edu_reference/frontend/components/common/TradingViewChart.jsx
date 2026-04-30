/**
 * 📈 TradingViewChart Component - TradingView Advanced Chart Widget
 * 
 * Component pentru TradingView Advanced Chart:
 * - Chart real-time din TradingView
 * - Support pentru multiple tokens (BTC, ETH, BNB, etc.)
 * - Configurabil (symbol, interval, theme)
 * 
 * @module TradingViewChart
 */

import React, { useEffect, useRef, useState } from 'react';
import '../../styles/components/tradingview-chart.css';

/**
 * TradingViewChart Component
 * @param {Object} props
 * @param {string} props.symbol - Trading pair symbol (e.g., 'BINANCE:BTCUSDT', 'BINANCE:ETHUSDT')
 * @param {string} props.interval - Chart interval ('1', '5', '15', '60', 'D', 'W', 'M')
 * @param {string} props.theme - Chart theme ('light' or 'dark')
 * @param {number} props.height - Chart height in pixels (default: 500)
 * @param {boolean} props.autosize - Auto resize chart (default: true)
 */
const TradingViewChart = ({ 
  symbol = 'BINANCE:BTCUSDT',
  interval = 'D',
  theme = 'dark',
  height = 500,
  autosize = true
}) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [widgetInitialized, setWidgetInitialized] = useState(false);

  useEffect(() => {
    // Check if TradingView script is already loaded
    if (window.TradingView) {
      setScriptLoaded(true);
      return;
    }

    // Load TradingView script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('[TradingViewChart] Failed to load TradingView script');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts before script loads
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !window.TradingView || !containerRef.current) {
      return;
    }

    // Wait for container to be fully rendered with proper dimensions
    const initWidget = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const parent = container.parentElement;

      // SSOT înălțime: zona flex `.trade-pane-chart-area` (părintele wrapperului), nu doar
      // `.tradingview-chart-container` — altfel clientHeight e 0 sau prea mic → fallback 360px și „gol” negru sub chart.
      const getContainerHeight = () => {
        if (autosize) {
          const chartArea = container.closest('.trade-pane-chart-area');
          if (chartArea) {
            const h = chartArea.clientHeight || chartArea.offsetHeight || 0;
            if (h > 0) return h;
          }
          if (parent) {
            const h = parent.clientHeight || parent.offsetHeight || 0;
            if (h > 0) return h;
          }
        }
        return height;
      };

      let containerHeight = getContainerHeight();

      if (containerHeight < 120) {
        setTimeout(initWidget, 200);
        return;
      }

      // Clean up previous widget
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          // Widget might already be removed
        }
        widgetRef.current = null;
      }

      // Create container ID if it doesn't exist
      if (!container.id) {
        container.id = `tradingview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      container.style.height = `${containerHeight}px`;
      container.style.width = '100%';
      container.style.minHeight = '0';
      container.style.display = 'block';
      container.style.position = 'relative';

      requestAnimationFrame(() => {
        if (!containerRef.current) return;

        const finalHeight = getContainerHeight();
        const finalContainerHeight = finalHeight;

        container.style.height = `${finalContainerHeight}px`;
        container.style.width = '100%';
        container.style.minHeight = '0';
        container.style.display = 'block';
        container.style.position = 'relative';
        container.style.visibility = 'visible';

        // Create new TradingView widget
        try {
          widgetRef.current = new window.TradingView.widget({
            autosize: false, // Disable autosize to have explicit control
            symbol: symbol,
            interval: interval,
            timezone: 'Etc/UTC',
            theme: theme,
            style: '1', // Candlestick style
            locale: 'en',
            toolbar_bg: theme === 'dark' ? '#0f1419' : '#ffffff',
            enable_publishing: false,
            allow_symbol_change: true,
            hide_top_toolbar: false,
            hide_legend: !!(symbol && /CAKE|SHIB|BONK/i.test(symbol)), // Hide for tokens where TradingView quote snapshot often fails
            save_image: true,
            container_id: container.id,
            // Disable automatic volume indicator to prevent duplicate "Vol - BTC 1"
            disabled_features: [
              'create_volume_indicator_by_default'
            ],
            studies: [
              'Volume@tv-basicstudies',
              'RSI@tv-basicstudies'
            ],
            height: finalContainerHeight,
            width: '100%',
            // Override colors for better visibility
            overrides: {
              'paneProperties.background': theme === 'dark' ? '#0f1419' : '#ffffff',
              'paneProperties.backgroundType': 'solid',
              'paneProperties.vertGridProperties.color': theme === 'dark' ? '#1a1e26' : '#e0e0e0',
              'paneProperties.horzGridProperties.color': theme === 'dark' ? '#1a1e26' : '#e0e0e0',
              'scalesProperties.textColor': theme === 'dark' ? '#8a929e' : '#333333',
              'mainSeriesProperties.candleStyle.upColor': '#10b981',
              'mainSeriesProperties.candleStyle.downColor': '#ef4444',
              'mainSeriesProperties.candleStyle.borderUpColor': '#10b981',
              'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
              'mainSeriesProperties.candleStyle.wickUpColor': '#10b981',
              'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444'
            },
            loading_screen: {
              backgroundColor: theme === 'dark' ? '#0f1419' : '#ffffff'
            }
          });
          
          // Mark widget as initialized after a short delay to ensure it's rendered
          setTimeout(() => {
            setWidgetInitialized(true);
          }, 500);
        } catch (error) {
          console.error('[TradingViewChart] Error creating widget:', error);
          setWidgetInitialized(true); // Set anyway to hide loading
        }
      });
    };

    // Use requestAnimationFrame for better timing
    const initWithDelay = () => {
      requestAnimationFrame(() => {
        setTimeout(initWidget, 100);
      });
    };

    initWithDelay();

    // Cleanup function
    return () => {
      setWidgetInitialized(false);
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          // Widget might already be removed
        }
        widgetRef.current = null;
      }
    };
  }, [scriptLoaded, symbol, interval, theme, height, autosize]);

  // Handle resize for autosize using ResizeObserver for better performance
  useEffect(() => {
    if (!autosize || !containerRef.current) return;

    let resizeTimeout;
    const container = containerRef.current;
    const parent = container.parentElement;
    const chartArea = container.closest('.trade-pane-chart-area');

    if (!parent) return;

    const measureHostHeight = () => {
      if (chartArea) {
        const h = chartArea.clientHeight || chartArea.offsetHeight || 0;
        if (h > 0) return h;
      }
      return parent.clientHeight || parent.offsetHeight || 0;
    };

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!containerRef.current || !containerRef.current.parentElement) return;

        const el = containerRef.current;
        const newHeightRaw = measureHostHeight();
        const newHeight = newHeightRaw > 0 ? newHeightRaw : height;

        if (newHeight >= 120 && newHeight !== parseInt(el.style.height, 10)) {
          el.style.height = `${newHeight}px`;
          if (widgetRef.current && typeof widgetRef.current.resize === 'function') {
            try { widgetRef.current.resize(newHeight, el.offsetWidth); } catch (_) {}
          }
        }
      }, 150);
    };

    let resizeObserver;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      const roTarget = chartArea || parent;
      resizeObserver.observe(roTarget);
    } else {
      window.addEventListener('resize', handleResize);
    }

    setTimeout(handleResize, 300);

    return () => {
      clearTimeout(resizeTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [autosize, scriptLoaded, height]);

  return (
    <div className="tradingview-chart-container" style={{ height: autosize ? '100%' : `${height}px`, minHeight: 0 }}>
      <div 
        ref={containerRef} 
        className="tradingview-chart"
        style={{ 
          height: '100%',
          minHeight: 0,
          width: '100%',
          position: 'relative',
          display: 'block'
        }}
      />
      {(!scriptLoaded || !widgetInitialized) && (
        <div className="tradingview-chart-loading">
          <p>Loading TradingView chart...</p>
        </div>
      )}
    </div>
  );
};

export default TradingViewChart;
