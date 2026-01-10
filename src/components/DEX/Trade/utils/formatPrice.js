/**
 * 💰 Price Formatting Utilities
 */

/**
 * Format price with appropriate decimals
 */
export function formatPrice(price, decimals = 4) {
  if (price === null || price === undefined || isNaN(price)) {
    return '0.00';
  }

  const numPrice = parseFloat(price);
  
  if (numPrice === 0) {
    return '0.00';
  }

  // Auto-detect decimals based on price
  if (numPrice < 0.0001) {
    return numPrice.toFixed(8);
  } else if (numPrice < 1) {
    return numPrice.toFixed(4);
  } else if (numPrice < 100) {
    return numPrice.toFixed(2);
  } else {
    return numPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

/**
 * Format volume with commas
 */
export function formatVolume(volume) {
  if (volume === null || volume === undefined || isNaN(volume)) {
    return '0.00';
  }

  const numVolume = parseFloat(volume);
  
  if (numVolume === 0) {
    return '0.00';
  }

  if (numVolume >= 1000000) {
    return (numVolume / 1000000).toFixed(2) + 'M';
  } else if (numVolume >= 1000) {
    return (numVolume / 1000).toFixed(2) + 'K';
  }

  return numVolume.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format percentage
 */
export function formatPercent(percent, decimals = 2) {
  if (percent === null || percent === undefined || isNaN(percent)) {
    return '0.00%';
  }

  const numPercent = parseFloat(percent);
  return `${numPercent >= 0 ? '+' : ''}${numPercent.toFixed(decimals)}%`;
}

/**
 * Format large numbers with abbreviations
 */
export function formatLargeNumber(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  const numValue = parseFloat(num);
  
  if (numValue >= 1e12) {
    return (numValue / 1e12).toFixed(2) + 'T';
  } else if (numValue >= 1e9) {
    return (numValue / 1e9).toFixed(2) + 'B';
  } else if (numValue >= 1e6) {
    return (numValue / 1e6).toFixed(2) + 'M';
  } else if (numValue >= 1e3) {
    return (numValue / 1e3).toFixed(2) + 'K';
  }

  return numValue.toLocaleString('en-US');
}

