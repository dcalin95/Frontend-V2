/**
 * 📈 TradingView Charting Library Component (ca Oxium)
 * 
 * Component pentru TradingView Charting Library (librăria completă):
 * - Chart profesional cu toate funcționalitățile TradingView
 * - Datafeed custom folosind Binance API
 * - Support pentru multiple simboluri și rezoluții
 * 
 * NOTĂ: TradingView Charting Library trebuie descărcată manual de la:
 * https://www.tradingview.com/charting-library/
 * 
 * Instrucțiuni:
 * 1. Descarcă Charting Library de la TradingView
 * 2. Extrage în public/charting_library/
 * 3. Componenta va detecta automat librăria
 * 
 * @module TradingViewChartingLibrary
 */

import React, { useEffect, useRef, useState } from 'react';
import { createBinanceDatafeed } from '../../datafeeds/binanceDatafeed';
import '../../styles/components/tradingview-charting-library.css';

/**
 * TradingViewChartingLibrary Component
 * @param {Object} props
 * @param {string} props.symbol - Trading pair symbol (e.g., 'BTCUSDT', 'ETHUSDT')
 * @param {string} props.interval - Chart interval ('1', '5', '15', '60', 'D', 'W', 'M')
 * @param {string} props.theme - Chart theme ('light' or 'dark')
 * @param {number} props.height - Chart height in pixels (default: 600)
 * @param {string} props.libraryPath - Path to charting_library (default: '/charting_library/')
 */
const TradingViewChartingLibrary = ({
  symbol = 'BTCUSDT',
  interval = 'D',
  theme = 'dark',
  height = 600,
  libraryPath = '/charting_library/'
}) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const datafeedRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Load TradingView Charting Library script
  useEffect(() => {
    // Verifică dacă script-ul este deja încărcat
    if (window.tvWidget) {
      return;
    }

    // TradingView Charting Library se încarcă din index.html sau din public/charting_library/
    // Verificăm dacă există TradingView widget API
    if (!window.TradingView || !window.TradingView.widget) {
      setError('TradingView Charting Library is not loaded. Please download the library from https://www.tradingview.com/charting-library/ and extract it to public/charting_library/');
      return;
    }

    if (!containerRef.current) {
      return;
    }

    // Creează datafeed-ul
    if (!datafeedRef.current) {
      datafeedRef.current = createBinanceDatafeed();
    }

    // Cleanup widget anterior
    if (widgetRef.current) {
      try {
        widgetRef.current.remove();
      } catch (e) {
        console.warn('[TradingViewChartingLibrary] Error removing previous widget:', e);
      }
      widgetRef.current = null;
    }

    try {
      // Creează widget-ul TradingView Charting Library
      // TradingView Charting Library folosește TradingView.widget() cu datafeed
      widgetRef.current = new window.TradingView.widget({
        symbol: symbol,
        datafeed: datafeedRef.current,
        interval: interval,
        container: containerRef.current,
        library_path: libraryPath,
        locale: 'en',
        disabled_features: [
          'use_localstorage_for_settings',
          'volume_force_overlay',
          'create_volume_indicator_by_default'
        ],
        enabled_features: [
          'study_templates',
          'side_toolbar_in_fullscreen_mode'
        ],
        charts_storage_url: 'https://saveload.tradingview.com',
        charts_storage_api_version: '1.1',
        client_id: 'tradingview.com',
        user_id: 'public_user_id',
        fullscreen: false,
        autosize: true,
        studies_overrides: {},
        theme: theme,
        overrides: {
          'paneProperties.background': theme === 'dark' ? '#1a1e26' : '#ffffff',
          'paneProperties.backgroundType': 'solid',
          'mainSeriesProperties.candleStyle.upColor': '#10b981',
          'mainSeriesProperties.candleStyle.downColor': '#ef4444',
          'mainSeriesProperties.candleStyle.borderUpColor': '#10b981',
          'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
          'mainSeriesProperties.candleStyle.wickUpColor': '#10b981',
          'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444'
        },
        loading_screen: {
          backgroundColor: theme === 'dark' ? '#1a1e26' : '#ffffff'
        }
      });

      setIsReady(true);
      setError(null);
    } catch (err) {
      console.error('[TradingViewChartingLibrary] Error creating chart:', err);
      setError(`Error creating chart: ${err.message || err}. Please ensure TradingView Charting Library is installed correctly.`);
      setIsReady(false);
    }

    // Cleanup
    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.warn('[TradingViewChartingLibrary] Error removing widget:', e);
        }
        widgetRef.current = null;
      }
    };
  }, [symbol, interval, theme, libraryPath, height]);

  return (
    <div className="tradingview-charting-library-container">
      {error && (
        <div className="tradingview-charting-library-error">
          <p><strong>Error:</strong> {error}</p>
          <p>
            <strong>Instructions:</strong>
          </p>
          <ol>
            <li>Download TradingView Charting Library from <a href="https://www.tradingview.com/charting-library/" target="_blank" rel="noopener noreferrer">TradingView</a></li>
            <li>Extract the archive to <code>public/charting_library/</code></li>
            <li>Reload the page</li>
          </ol>
        </div>
      )}
      {!error && !isReady && (
        <div className="tradingview-charting-library-loading">
          <p>Loading TradingView Charting Library...</p>
        </div>
      )}
      <div 
        ref={containerRef}
        className="tradingview-charting-library-widget"
        style={{ height: `${height}px`, minHeight: '400px', width: '100%' }}
      />
    </div>
  );
};

export default TradingViewChartingLibrary;