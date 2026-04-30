/**
 * 🔧 Formatters - Data Formatting Utilities
 * 
 * Utility functions pentru formatting data:
 * - Numbers
 * - Dates
 * - Currency
 * - Percentages
 * - Addresses
 * 
 * @module formatters
 */

/**
 * Format number cu decimals
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimals (default: 2)
 * @returns {string} Formatted number
 */
export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  return Number(value).toFixed(decimals);
}

/**
 * Format number cu thousand separators
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimals (default: 2)
 * @returns {string} Formatted number cu commas
 */
export function formatNumberWithCommas(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format currency
 * @param {number} value - Value to format
 * @param {string} currency - Currency symbol (default: '$')
 * @param {number} decimals - Number of decimals (default: 2)
 * @returns {string} Formatted currency
 */
export function formatCurrency(value, currency = '$', decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return `${currency}0.00`;
  }
  return `${currency}${formatNumberWithCommas(value, decimals)}`;
}

/**
 * Format percentage
 * @param {number} value - Value to format (0-1 sau 0-100)
 * @param {number} decimals - Number of decimals (default: 2)
 * @param {boolean} isDecimal - Dacă value e deja în format decimal (0-1) (default: false)
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, decimals = 2, isDecimal = false) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }
  const percentage = isDecimal ? value * 100 : value;
  return `${formatNumber(percentage, decimals)}%`;
}

/**
 * Format date
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format string (default: 'short')
 * @returns {string} Formatted date
 */
export function formatDate(date, format = 'short') {
  if (!date) {
    return '';
  }
  
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const formats = {
    short: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    long: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    datetime: d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    iso: d.toISOString()
  };
  
  return formats[format] || formats.short;
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) {
    return '';
  }
  
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diffMs = now - d;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return formatDate(d, 'short');
  }
}

/**
 * Format wallet address (truncate middle)
 * @param {string} address - Wallet address
 * @param {number} startChars - Number of start characters (default: 6)
 * @param {number} endChars - Number of end characters (default: 4)
 * @returns {string} Truncated address
 */
export function formatAddress(address, startChars = 6, endChars = 4) {
  if (!address || address.length < startChars + endChars) {
    return address || '';
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format transaction hash
 * @param {string} txHash - Transaction hash
 * @param {number} startChars - Number of start characters (default: 10)
 * @param {number} endChars - Number of end characters (default: 8)
 * @returns {string} Truncated transaction hash
 */
export function formatTxHash(txHash, startChars = 10, endChars = 8) {
  if (!txHash || txHash.length < startChars + endChars) {
    return txHash || '';
  }
  return `${txHash.slice(0, startChars)}...${txHash.slice(-endChars)}`;
}

/**
 * Standard decimals per token symbol (on-chain wei/satoshi → human).
 * Used when API sends raw amounts instead of human.
 */
const TOKEN_DECIMALS = {
  USDT: 18, USDC: 18, BUSD: 18, DAI: 18,
  BNB: 18, WBNB: 18, ETH: 18, WETH: 18,
  BTC: 18, WBTC: 18, BTCB: 18, // BSC wrapped BTC 18
  LINK: 18, CAKE: 18, MATIC: 18, UNI: 18, AAVE: 18,
  DOGE: 8, SOL: 9,
  XRP: 18,
};

export function getDecimalsForToken(symbol) {
  if (!symbol || typeof symbol !== 'string') return 18;
  const s = symbol.toUpperCase().trim();
  return TOKEN_DECIMALS[s] ?? 18;
}

/** Peste acest prag considerăm că amount e în raw (wei). Niciun balance real nu e >= 1e9 token. */
const RAW_AMOUNT_THRESHOLD = 1e9;

/** SOL (9 decimals): raw >= 1e9; dar uneori API trimite 49.7e6 (format greșit). Prag 1e6: orice >= 1e6 e suspect pentru SOL. */
const SOL_RAW_THRESHOLD = 1e6;

/**
 * Convert raw amount (wei/satoshi) to human for PnL/math. API poate trimite raw; dacă value >= prag, tratăm ca raw.
 * @param {number|string|null} value - amount from API (human or raw)
 * @param {string} tokenSymbol - e.g. 'BTC', 'LINK', 'SOL', 'DOGE', 'BNB'
 * @returns {number|null} human amount or null
 */
export function toHumanAmount(value, tokenSymbol) {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (!Number.isFinite(num)) return null;
  const decimals = getDecimalsForToken(tokenSymbol);
  const threshold = (tokenSymbol || '').toUpperCase() === 'SOL' ? SOL_RAW_THRESHOLD : RAW_AMOUNT_THRESHOLD;
  if (num >= threshold) {
    const div = (tokenSymbol || '').toUpperCase() === 'SOL' && num >= 1e6 && num < 1e9
      ? 1e6
      : Math.pow(10, decimals);
    return num / div;
  }
  return num;
}

/**
 * Format amount for display: if value looks like raw wei (very large), convert to human using token decimals.
 * @param {number|string|null|undefined} value - amountInHuman, amountOutHuman, or amountInRaw/amountOutRaw from API
 * @param {string} tokenSymbol - e.g. 'USDT', 'BTC'
 * @param {number} displayDecimals - decimals in output (default 4)
 * @returns {string} Human-readable amount (number only; caller adds symbol)
 */
export function formatAmountHuman(value, tokenSymbol, displayDecimals = 4) {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (!Number.isFinite(num)) return '';
  const decimals = getDecimalsForToken(tokenSymbol);
  const threshold = (tokenSymbol || '').toUpperCase() === 'SOL' ? SOL_RAW_THRESHOLD : RAW_AMOUNT_THRESHOLD;
  const isLikelyRaw = num >= threshold;
  const div = (tokenSymbol || '').toUpperCase() === 'SOL' && num >= 1e6 && num < 1e9 ? 1e6 : Math.pow(10, decimals);
  const human = isLikelyRaw ? num / div : num;
  if (!Number.isFinite(human) || human < 0) return '';
  const formatted = human >= 1000 ? human.toLocaleString(undefined, { maximumFractionDigits: displayDecimals, minimumFractionDigits: 0 })
    : human.toFixed(displayDecimals);
  return formatted.replace(/(\.\d*?)0+$/, (_, d) => d === '.' ? '' : d) || '0';
}

/**
 * Format token amount
 * @param {number|string} amount - Token amount
 * @param {string} symbol - Token symbol (default: '')
 * @param {number} decimals - Number of decimals (default: 4)
 * @returns {string} Formatted token amount
 */
export function formatTokenAmount(amount, symbol = '', decimals = 4) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `0.0000 ${symbol}`.trim();
  }
  const formatted = formatNumber(amount, decimals);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Format price for display (decimals by magnitude). Sub-cent token prices (e.g. SHIB)
 * need >4 fractional digits or they round to 0 — not a column-width issue.
 * @param {number|null|undefined} value - price
 * @param {number} [maxDecimals=4] - max decimals (floors raised for tiny prices)
 * @returns {string} human-readable price
 */
export function formatPriceHuman(value, maxDecimals = 4) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs === 0) return '0';
  let decimals;
  if (abs >= 1000) decimals = 2;
  else if (abs >= 1) decimals = 4;
  else if (abs >= 0.01) decimals = 4;
  else if (abs >= 1e-6) decimals = Math.min(12, Math.max(8, maxDecimals));
  else decimals = Math.min(18, Math.max(10, maxDecimals));
  const formatted = value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimals });
  return formatted;
}

/**
 * Format PnL USD for display (2 decimals, compact for large values).
 * @param {number|null|undefined} value - PnL in USD
 * @param {number} [decimals=2]
 * @returns {string} e.g. "+1.23 USD" or "-0.08 USD"
 */
export function formatPnlUsdHuman(value, decimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e9) return (value >= 0 ? '+' : '') + formatLargeNumber(value, decimals) + ' USD';
  if (abs >= 1e6) return (value >= 0 ? '+' : '') + formatLargeNumber(value, decimals) + ' USD';
  if (abs >= 1e3) return (value >= 0 ? '+' : '') + formatNumber(value, decimals) + ' USD';
  return (value >= 0 ? '+' : '') + formatNumber(value, decimals) + ' USD';
}

/**
 * Format large number (e.g., 1.2M, 3.4K)
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimals (default: 2)
 * @returns {string} Formatted large number
 */
export function formatLargeNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1e9) {
    return `${sign}${formatNumber(absValue / 1e9, decimals)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}${formatNumber(absValue / 1e6, decimals)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}${formatNumber(absValue / 1e3, decimals)}K`;
  } else {
    return `${sign}${formatNumber(absValue, decimals)}`;
  }
}

/**
 * Format duration (e.g., "2h 30m")
 * @param {number} seconds - Duration în seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) {
    return '0s';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && hours === 0) parts.push(`${secs}s`);
  
  return parts.join(' ') || '0s';
}

