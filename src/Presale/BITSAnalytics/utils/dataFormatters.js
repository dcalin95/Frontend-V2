/**
 * Data Formatting Utilities
 * Real portfolio data formatting functions
 */

/**
 * Smart Wei detector and converter
 * @param {number|string} value - The value to check and convert
 * @returns {number} - The converted value in standard units
 */
export const smartWeiConverter = (value) => {
  if (value === null || value === undefined) return 0;

  // BigNumber from ethers
  if (value && value._isBigNumber) {
    try { return Number(require('ethers').ethers.utils.formatUnits(value, 18)); } catch { return 0; }
  }

  // Strings
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const hasDecimal = trimmed.includes('.') || /e|E/.test(trimmed);
    const digitsOnly = /^[0-9]+$/.test(trimmed);
    const asNum = Number(trimmed);
    if (!Number.isFinite(asNum)) return 0;
    // Consider as Wei only for very long integer strings (no decimal point)
    if (!hasDecimal && digitsOnly && trimmed.length >= 19) {
      return asNum / 1e18;
    }
    return asNum;
  }

  // Numbers
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0;
    // Treat as Wei only if it's a large integer without decimals
    if (Number.isInteger(value) && value > 1e15) {
      return value / 1e18;
    }
    return value;
  }

  // Fallback
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

/**
 * USD Formatter
 * @param {number|string} value - Value to format
 * @param {boolean} enhanced - Whether to use enhanced formatting
 * @returns {string} - Formatted USD string
 */
export const formatUSD = (value, enhanced = false) => {
  const convertedValue = smartWeiConverter(value);
  
  if (convertedValue === 0) return "$0.00";
  
  // Dynamic precision based on value size
  if (convertedValue < 0.01) return "$0.00";
  if (convertedValue < 1) return `$${convertedValue.toFixed(4)}`;
  if (convertedValue < 1000) return `$${convertedValue.toFixed(2)}`;
  
  const formatted = convertedValue.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  
  return enhanced ? `💰 $${formatted}` : `$${formatted}`;
};

/**
 * BITS Formatter
 * @param {number|string} value - BITS value to format
 * @param {boolean} enhanced - Whether to use enhanced formatting
 * @returns {string} - Formatted BITS string
 */
export const formatBITS = (value, enhanced = false) => {
  const convertedValue = smartWeiConverter(value);
  
  if (convertedValue === 0) return "0.00 $BITS";
  
  // Dynamic precision for BITS
  if (convertedValue < 0.01) return `${convertedValue.toFixed(6)} $BITS`;
  if (convertedValue < 1000) return `${convertedValue.toFixed(2)} $BITS`;
  
  const formatted = convertedValue.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  
  return enhanced ? `💎 ${formatted} $BITS` : `${formatted} $BITS`;
};

/**
 * Price Formatter
 * @param {number|string} value - Price value to format
 * @param {boolean} enhanced - Whether to use enhanced formatting
 * @returns {string} - Formatted price string
 */
export const formatPrice = (value, enhanced = false) => {
  const convertedValue = smartWeiConverter(value);
  
  if (convertedValue === 0) return "$0.00";
  
  // Smart formatting for prices - cleaner display
  if (convertedValue < 0.000001) return "<$0.000001";
  if (convertedValue < 0.01) return `$${convertedValue.toFixed(6)}`;
  if (convertedValue < 1) return `$${convertedValue.toFixed(4)}`;
  
  // For normal prices (>= $1), show 2 decimal places like $1.00
  const formatted = `$${convertedValue.toFixed(2)}`;
  return enhanced ? `📊 ${formatted}` : formatted;
};

/**
 * ROI Formatter with Performance Analysis
 * @param {number} roiPercent - ROI percentage
 * @returns {object} - ROI data with formatting and analysis
 */
export const formatROI = (roiPercent) => {
  const roi = Number(roiPercent) || 0;
  
  const isPositive = roi >= 0;
  const arrow = isPositive ? "↗️" : "↘️";
  const sign = isPositive ? "+" : "";
  const formatted = `${arrow} ${sign}${roi.toFixed(2)}%`;
  
  // Performance analysis
  let analysis = "Stable";
  let confidence = "Medium";
  
  if (Math.abs(roi) > 50) {
    analysis = isPositive ? "Exceptional Growth" : "Major Correction";
    confidence = "High";
  } else if (Math.abs(roi) > 20) {
    analysis = isPositive ? "Strong Performance" : "Significant Decline";
    confidence = "High";
  } else if (Math.abs(roi) > 5) {
    analysis = isPositive ? "Positive Trend" : "Minor Decline";
    confidence = "Medium";
  }
  
  return {
    formatted,
    raw: roi,
    isPositive,
    arrow,
    analysis,
    confidence,
    color: isPositive ? "#10b981" : "#ef4444"
  };
};

/**
 * Transaction Count Formatter
 * @param {number} count - Transaction count
 * @returns {string} - Formatted transaction count
 */
export const formatTransactions = (count) => {
  const numCount = Number(count) || 0;
  
  if (numCount === 0) return "No transactions";
  if (numCount === 1) return "1 transaction";
  if (numCount < 10) return `${numCount} transactions`;
  if (numCount < 100) return `${numCount} operations`;
  
  return `${numCount.toLocaleString()} operations`;
};

/**
 * Timestamp Formatter
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {object} - Formatted timestamp data
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return { formatted: "No recent activity", relative: "N/A" };
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  let relative = "";
  if (diffMins < 1) relative = "Just now";
  else if (diffMins < 60) relative = `${diffMins}m ago`;
  else if (diffHours < 24) relative = `${diffHours}h ago`;
  else if (diffDays < 7) relative = `${diffDays}d ago`;
  else relative = date.toLocaleDateString();
  
  return {
    formatted: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    relative,
    isRecent: diffDays < 7
  };
};

/**
 * Address Shortener
 * @param {string} address - Wallet address to shorten
 * @param {number} startChars - Number of characters from start
 * @param {number} endChars - Number of characters from end
 * @returns {string} - Shortened address
 */
export const shortenAddress = (address, startChars = 6, endChars = 4) => {
  if (!address || typeof address !== 'string') return "N/A";
  
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}●●●${address.slice(-endChars)}`;
};

export default {
  formatUSD,
  formatBITS,
  formatPrice,
  formatROI,
  formatTransactions,
  formatTimestamp,
  shortenAddress,
  smartWeiConverter
};

