/**
 * Mapare token UI → simbol Binance USD-M linear (perpetual).
 * SSOT pentru fapi public: klines, openInterest, ticker/24hr, premiumIndex.
 *
 * Aliniat cu preset Allowlist (AutoTradeAllowlistTab) unde există perp USDT-M pe Binance;
 * exclude USDT/BUSD (quote, nu bază perp). Verifică pe https://fapi.binance.com înainte de a adăuga simboluri noi.
 */

export const OTA_BINANCE_FUTURES_VENUE = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  BNB: 'BNBUSDT',
  SOL: 'SOLUSDT',
  DOGE: 'DOGEUSDT',
  XRP: 'XRPUSDT',
  ADA: 'ADAUSDT',
  LINK: 'LINKUSDT',
  AVAX: 'AVAXUSDT',
  MATIC: 'MATICUSDT',
  STX: 'STXUSDT',
  SHIB: '1000SHIBUSDT',
  DOT: 'DOTUSDT',
  CAKE: 'CAKEUSDT',
};

export function toBinanceFuturesVenue(base) {
  return OTA_BINANCE_FUTURES_VENUE[String(base || '').toUpperCase()] || null;
}
