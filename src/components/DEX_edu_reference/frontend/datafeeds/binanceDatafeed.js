/**
 * 📈 Binance Datafeed pentru TradingView Charting Library
 * 
 * Acest datafeed implementează interfața TradingView Datafeed API
 * și folosește Binance API pentru date reale de trading.
 * 
 * TradingView Charting Library Datafeed API Documentation:
 * https://github.com/tradingview/charting_library/wiki/JS-Api
 */

import { getBinanceKlines } from '../../utils/DEX/binanceApi';

/**
 * Mapează interval-urile TradingView la interval-urile Binance
 */
const RESOLUTION_MAP = {
  '1': '1m',
  '3': '3m',
  '5': '5m',
  '15': '15m',
  '30': '30m',
  '60': '1h',
  '120': '2h',
  '240': '4h',
  '360': '6h',
  '480': '8h',
  '720': '12h',
  'D': '1d',
  '1D': '1d',
  '3D': '3d',
  'W': '1w',
  '1W': '1w',
  'M': '1M',
  '1M': '1M'
};

/**
 * Converteste simbolul TradingView la simbol Binance
 * @param {string} symbol - Symbol TradingView (ex: 'BTCUSD', 'BTCUSDT')
 * @returns {string} - Symbol Binance (ex: 'BTCUSDT')
 */
function convertSymbol(symbol) {
  // Dacă simbolul nu se termină cu USDT, adaugă USDT
  if (!symbol.toUpperCase().endsWith('USDT')) {
    return symbol.replace(/USD$/, 'USDT').toUpperCase();
  }
  return symbol.toUpperCase();
}

/**
 * Binance Datafeed pentru TradingView Charting Library
 */
export class BinanceDatafeed {
  constructor(updateFrequency = 10000) {
    this._config = {
      supported_resolutions: ['1', '3', '5', '15', '30', '60', '120', '240', '360', '480', '720', 'D', '1D', '3D', 'W', '1W', 'M', '1M'],
      supports_group_request: false,
      supports_marks: false,
      supports_search: true,
      supports_timescale_marks: false,
      supports_time: true
    };
    this._updateFrequency = updateFrequency;
  }

  /**
   * Implementează onReady callback
   * @param {Function} callback - Callback cu configurația
   */
  onReady(callback) {
    setTimeout(() => {
      callback(this._config);
    }, 0);
  }

  /**
   * Implementează searchSymbols callback
   * @param {string} userInput - Input-ul utilizatorului
   * @param {string} exchange - Exchange (opțional)
   * @param {string} symbolType - Tipul simbolului
   * @param {Function} onResultReadyCallback - Callback cu rezultatele
   */
  searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
    // Lista de simboluri suportate
    const symbols = [
      { symbol: 'BTCUSDT', full_name: 'BINANCE:BTCUSDT', description: 'Bitcoin / Tether', exchange: 'BINANCE', type: 'crypto' },
      { symbol: 'ETHUSDT', full_name: 'BINANCE:ETHUSDT', description: 'Ethereum / Tether', exchange: 'BINANCE', type: 'crypto' },
      { symbol: 'BNBUSDT', full_name: 'BINANCE:BNBUSDT', description: 'Binance Coin / Tether', exchange: 'BINANCE', type: 'crypto' },
      { symbol: 'SOLUSDT', full_name: 'BINANCE:SOLUSDT', description: 'Solana / Tether', exchange: 'BINANCE', type: 'crypto' },
      { symbol: 'ADAUSDT', full_name: 'BINANCE:ADAUSDT', description: 'Cardano / Tether', exchange: 'BINANCE', type: 'crypto' },
      { symbol: 'XRPUSDT', full_name: 'BINANCE:XRPUSDT', description: 'Ripple / Tether', exchange: 'BINANCE', type: 'crypto' },
      { symbol: 'DOGEUSDT', full_name: 'BINANCE:DOGEUSDT', description: 'Dogecoin / Tether', exchange: 'BINANCE', type: 'crypto' },
      { symbol: 'DOTUSDT', full_name: 'BINANCE:DOTUSDT', description: 'Polkadot / Tether', exchange: 'BINANCE', type: 'crypto' },
      { symbol: 'MATICUSDT', full_name: 'BINANCE:MATICUSDT', description: 'Polygon / Tether', exchange: 'BINANCE', type: 'crypto' },
      { symbol: 'LINKUSDT', full_name: 'BINANCE:LINKUSDT', description: 'Chainlink / Tether', exchange: 'BINANCE', type: 'crypto' }
    ];

    const userInputUpper = userInput.toUpperCase();
    const results = symbols.filter(s => 
      s.symbol.includes(userInputUpper) || 
      s.description.toUpperCase().includes(userInputUpper)
    ).slice(0, 10);

    setTimeout(() => {
      onResultReadyCallback(results);
    }, 0);
  }

  /**
   * Implementează resolveSymbol callback
   * @param {string} symbolName - Numele simbolului
   * @param {Function} onSymbolResolvedCallback - Callback cu informațiile simbolului
   * @param {Function} onResolveErrorCallback - Callback pentru erori
   */
  resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
    const binanceSymbol = convertSymbol(symbolName);
    
    const symbolInfo = {
      name: binanceSymbol,
      ticker: binanceSymbol,
      description: `${binanceSymbol.replace('USDT', '')} / USDT`,
      type: 'crypto',
      session: '24x7',
      timezone: 'Etc/UTC',
      exchange: 'BINANCE',
      minmov: 1,
      pricescale: 100,
      has_intraday: true,
      has_weekly_and_monthly: true,
      supported_resolutions: this._config.supported_resolutions,
      volume_precision: 2,
      data_status: 'streaming'
    };

    setTimeout(() => {
      onSymbolResolvedCallback(symbolInfo);
    }, 0);
  }

  /**
   * Implementează getBars callback
   * @param {Object} symbolInfo - Informații despre simbol
   * @param {string} resolution - Rezoluția (ex: '1', '5', '15', '60', 'D')
   * @param {number} periodParams - Parametrii perioadei ({ from, to, firstDataRequest })
   * @param {Function} onHistoryCallback - Callback cu datele istorice
   * @param {Function} onErrorCallback - Callback pentru erori
   */
  async getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
    try {
      const { from, to, firstDataRequest } = periodParams;
      const binanceSymbol = convertSymbol(symbolInfo.name || symbolInfo.ticker);
      const binanceInterval = RESOLUTION_MAP[resolution] || '1d';
      
      // Calculează numărul de bare necesare
      const diff = to - from;
      let limit = 500; // Default limit pentru Binance
      
      // Ajustează limit-ul în funcție de rezoluție și perioadă
      if (resolution === '1' || resolution === '3' || resolution === '5') {
        // Pentru rezoluții mici, calculează limit-ul mai precis
        const minutes = diff / 60;
        limit = Math.min(Math.ceil(minutes / parseInt(resolution)), 1000);
      } else if (resolution === '15' || resolution === '30') {
        const hours = diff / 3600;
        limit = Math.min(Math.ceil(hours * (60 / parseInt(resolution))), 1000);
      } else if (resolution === '60' || resolution === '120' || resolution === '240') {
        const hours = diff / 3600;
        limit = Math.min(Math.ceil(hours / (parseInt(resolution) / 60)), 1000);
      } else if (resolution === 'D' || resolution === '1D') {
        const days = diff / 86400;
        limit = Math.min(Math.ceil(days), 1000);
      }

      // Obține datele de la Binance
      const klines = await getBinanceKlines(binanceSymbol, binanceInterval, limit);

      if (!klines || klines.length === 0) {
        onHistoryCallback([], { noData: true });
        return;
      }

      // Convertește datele Binance la formatul TradingView
      // TradingView așteaptă timestamp-uri în secunde (nu milisecunde)
      const bars = klines
        .filter(kline => {
          const timestampSeconds = Math.floor(kline.timestamp / 1000);
          return timestampSeconds >= from && timestampSeconds <= to;
        })
        .map(kline => ({
          time: Math.floor(kline.timestamp / 1000), // TradingView așteaptă timestamp în secunde
          open: kline.open,
          high: kline.high,
          low: kline.low,
          close: kline.close,
          volume: kline.volume
        }));

      // Verifică dacă există mai multe date disponibile
      const meta = {
        noData: bars.length === 0,
        nextTime: bars.length > 0 ? bars[bars.length - 1].time + 1 : null
      };

      onHistoryCallback(bars, meta);
    } catch (error) {
      console.error('[BinanceDatafeed] Error getting bars:', error);
      onErrorCallback(error);
    }
  }

  /**
   * Implementează subscribeBars callback (pentru real-time updates)
   * @param {Object} symbolInfo - Informații despre simbol
   * @param {string} resolution - Rezoluția
   * @param {Function} onTick - Callback pentru update-uri
   * @param {string} subscriberUID - UID-ul subscriber-ului
   * @param {Function} onResetCacheNeededCallback - Callback pentru reset cache
   */
  subscribeBars(symbolInfo, resolution, onTick, subscriberUID, onResetCacheNeededCallback) {
    // Pentru MVP, nu implementăm WebSocket real-time updates
    // Pot fi adăugate ulterior folosind Binance WebSocket Stream
    // Pentru moment, chart-ul va folosi doar date istorice
    console.log('[BinanceDatafeed] subscribeBars called (not implemented for MVP)');
  }

  /**
   * Implementează unsubscribeBars callback
   * @param {string} subscriberUID - UID-ul subscriber-ului
   */
  unsubscribeBars(subscriberUID) {
    console.log('[BinanceDatafeed] unsubscribeBars called');
  }
}

/**
 * Factory function pentru a crea o instanță de BinanceDatafeed
 */
export function createBinanceDatafeed() {
  return new BinanceDatafeed();
}