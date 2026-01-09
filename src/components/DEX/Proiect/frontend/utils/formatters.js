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

