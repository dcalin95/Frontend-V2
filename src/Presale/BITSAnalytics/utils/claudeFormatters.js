/**
 * 🧠 Claude 4 Sonnet Style - Advanced Formatting Utilities
 * Sophisticated number formatting with Wei detection and smart precision
 */

/**
 * Smart Wei detector and converter
 * @param {number|string} value - The value to check and convert
 * @returns {number} - The converted value in standard units
 */
export const smartWeiConverter = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }

  const numericValue = Number(value);
  const valueString = value.toString();

  // Wei detection logic (18+ digits or very large numbers)
  if (valueString.length >= 18 || numericValue > 1e15) {
    return numericValue / 1e18; // Convert Wei to standard units
  }
  
  // Millicents detection (some contracts use this)
  if (valueString.length > 6 && numericValue > 1e6 && numericValue < 1e15) {
    return numericValue / 1000; // Convert millicents to dollars
  }
  
  return numericValue;
};

/**
 * 🎯 Claude 4 Sonnet Style - Enhanced USD Formatter
 * @param {number|string} value - Value to format
 * @param {boolean} enhanced - Whether to use enhanced formatting
 * @returns {string} - Formatted USD string
 */
export const formatUSDClaude = (value, enhanced = false) => {
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
 * 🎯 Claude 4 Sonnet Style - Enhanced BITS Formatter
 * @param {number|string} value - BITS value to format
 * @param {boolean} enhanced - Whether to use enhanced formatting
 * @returns {string} - Formatted BITS string
 */
export const formatBITSClaude = (value, enhanced = false) => {
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
 * 🎯 Claude 4 Sonnet Style - Enhanced Price Formatter
 * @param {number|string} value - Price value to format
 * @param {boolean} enhanced - Whether to use enhanced formatting
 * @returns {string} - Formatted price string
 */
export const formatPriceClaude = (value, enhanced = false) => {
  const convertedValue = smartWeiConverter(value);
  
  if (convertedValue === 0) return "$0.000000";
  
  // Ultra-precise formatting for prices
  if (convertedValue < 0.000001) return "<$0.000001";
  if (convertedValue < 0.01) return `$${convertedValue.toFixed(6)}`;
  if (convertedValue < 1) return `$${convertedValue.toFixed(4)}`;
  
  const formatted = `$${convertedValue.toFixed(6)}`;
  return enhanced ? `📊 ${formatted}` : formatted;
};

/**
 * 🎯 Claude 4 Sonnet Style - ROI Formatter with Neural Analysis
 * @param {number} roiPercent - ROI percentage
 * @returns {object} - ROI data with formatting and analysis
 */
export const formatROIClaude = (roiPercent) => {
  const roi = Number(roiPercent) || 0;
  
  const isPositive = roi >= 0;
  const arrow = isPositive ? "↗️" : "↘️";
  const sign = isPositive ? "+" : "";
  const formatted = `${arrow} ${sign}${roi.toFixed(2)}%`;
  
  // Neural analysis
  let analysis = "Stable";
  let confidence = "Medium";
  
  if (Math.abs(roi) > 50) {
    analysis = isPositive ? "Exceptional Growth" : "Market Correction";
    confidence = "High";
  } else if (Math.abs(roi) > 20) {
    analysis = isPositive ? "Strong Performance" : "Temporary Decline";
    confidence = "High";
  } else if (Math.abs(roi) > 5) {
    analysis = isPositive ? "Positive Trend" : "Minor Adjustment";
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
 * 🎯 Claude 4 Sonnet Style - Transaction Count Formatter
 * @param {number} count - Transaction count
 * @returns {string} - Formatted transaction count
 */
export const formatTransactionsClaude = (count) => {
  const numCount = Number(count) || 0;
  
  if (numCount === 0) return "No interactions";
  if (numCount === 1) return "1 interaction";
  if (numCount < 10) return `${numCount} interactions`;
  if (numCount < 100) return `${numCount} neural ops`;
  
  return `${numCount.toLocaleString()} neural ops`;
};

/**
 * 🎯 Claude 4 Sonnet Style - Timestamp Formatter
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {object} - Formatted timestamp data
 */
export const formatTimestampClaude = (timestamp) => {
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
 * 🎯 Claude 4 Sonnet Style - Address Shortener
 * @param {string} address - Wallet address to shorten
 * @param {number} startChars - Number of characters from start
 * @param {number} endChars - Number of characters from end
 * @returns {string} - Shortened address
 */
export const shortenAddressClaude = (address, startChars = 6, endChars = 4) => {
  if (!address || typeof address !== 'string') return "N/A";
  
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}●●●${address.slice(-endChars)}`;
};

export default {
  formatUSDClaude,
  formatBITSClaude,
  formatPriceClaude,
  formatROIClaude,
  formatTransactionsClaude,
  formatTimestampClaude,
  shortenAddressClaude,
  smartWeiConverter
};


