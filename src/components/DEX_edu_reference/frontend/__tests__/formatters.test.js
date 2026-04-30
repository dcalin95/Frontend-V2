/**
 * 🔧 Formatters Test Suite
 * 
 * Unit tests pentru formatters.js:
 * - formatNumber
 * - formatNumberWithCommas
 * - formatCurrency
 * - formatPercentage
 * - formatDate
 * - formatRelativeTime
 * - formatAddress
 * - formatTxHash
 * - formatTokenAmount
 * - formatLargeNumber
 * - formatDuration
 * 
 * @module formatters.test
 */

import {
  formatNumber,
  formatNumberWithCommas,
  formatCurrency,
  formatPercentage,
  formatDate,
  formatRelativeTime,
  formatAddress,
  formatTxHash,
  formatTokenAmount,
  formatLargeNumber,
  formatDuration
} from '../utils/formatters';

describe('Formatters', () => {
  describe('formatNumber', () => {
    test('should format number with default 2 decimals', () => {
      expect(formatNumber(123.456)).toBe('123.46');
      expect(formatNumber(100)).toBe('100.00');
    });

    test('should format number with custom decimals', () => {
      expect(formatNumber(123.456, 4)).toBe('123.4560');
      expect(formatNumber(100, 0)).toBe('100');
    });

    test('should handle null/undefined/NaN', () => {
      expect(formatNumber(null)).toBe('0.00');
      expect(formatNumber(undefined)).toBe('0.00');
      expect(formatNumber(NaN)).toBe('0.00');
    });

    test('should handle string numbers', () => {
      expect(formatNumber('123.456')).toBe('123.46');
      expect(formatNumber('100')).toBe('100.00');
    });
  });

  describe('formatNumberWithCommas', () => {
    test('should format number with thousand separators', () => {
      expect(formatNumberWithCommas(1000)).toBe('1,000.00');
      expect(formatNumberWithCommas(1234567.89)).toBe('1,234,567.89');
    });

    test('should handle null/undefined/NaN', () => {
      expect(formatNumberWithCommas(null)).toBe('0.00');
      expect(formatNumberWithCommas(undefined)).toBe('0.00');
      expect(formatNumberWithCommas(NaN)).toBe('0.00');
    });

    test('should format with custom decimals', () => {
      expect(formatNumberWithCommas(1000, 0)).toBe('1,000');
      expect(formatNumberWithCommas(1234.567, 3)).toBe('1,234.567');
    });
  });

  describe('formatCurrency', () => {
    test('should format currency with default $ symbol', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(123.45)).toBe('$123.45');
    });

    test('should format currency with custom symbol', () => {
      expect(formatCurrency(1000, '€')).toBe('€1,000.00');
      expect(formatCurrency(100, 'BTC')).toBe('BTC100.00');
    });

    test('should handle null/undefined/NaN', () => {
      expect(formatCurrency(null)).toBe('$0.00');
      expect(formatCurrency(undefined)).toBe('$0.00');
      expect(formatCurrency(NaN)).toBe('$0.00');
    });

    test('should format with custom decimals', () => {
      expect(formatCurrency(1000, '$', 0)).toBe('$1,000');
      expect(formatCurrency(123.456, '$', 3)).toBe('$123.456');
    });
  });

  describe('formatPercentage', () => {
    test('should format percentage from 0-100 range', () => {
      expect(formatPercentage(50)).toBe('50.00%');
      expect(formatPercentage(100)).toBe('100.00%');
      expect(formatPercentage(0)).toBe('0.00%');
    });

    test('should format percentage from decimal (0-1) range', () => {
      expect(formatPercentage(0.5, 2, true)).toBe('50.00%');
      expect(formatPercentage(0.75, 2, true)).toBe('75.00%');
      expect(formatPercentage(1, 2, true)).toBe('100.00%');
    });

    test('should format with custom decimals', () => {
      expect(formatPercentage(50.1234, 1)).toBe('50.1%');
      expect(formatPercentage(75.9876, 3)).toBe('75.988%');
    });

    test('should handle null/undefined/NaN', () => {
      expect(formatPercentage(null)).toBe('0.00%');
      expect(formatPercentage(undefined)).toBe('0.00%');
      expect(formatPercentage(NaN)).toBe('0.00%');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T10:30:00');

    test('should format date with short format (default)', () => {
      const formatted = formatDate(testDate);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2024');
    });

    test('should format date with long format', () => {
      const formatted = formatDate(testDate, 'long');
      expect(formatted).toContain('January');
      expect(formatted).toContain('2024');
    });

    test('should format date with datetime format', () => {
      const formatted = formatDate(testDate, 'datetime');
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2024');
    });

    test('should format date with time format', () => {
      const formatted = formatDate(testDate, 'time');
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    test('should format date with iso format', () => {
      const formatted = formatDate(testDate, 'iso');
      expect(formatted).toContain('2024-01-15');
    });

    test('should handle string date', () => {
      const formatted = formatDate('2024-01-15');
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    test('should handle timestamp', () => {
      const timestamp = testDate.getTime();
      const formatted = formatDate(timestamp);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    test('should return empty string for invalid date', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate('invalid')).toBe('');
      expect(formatDate('')).toBe('');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should return "Just now" for recent times', () => {
      const recentDate = new Date('2024-01-15T11:59:30');
      expect(formatRelativeTime(recentDate)).toBe('Just now');
    });

    test('should format minutes ago', () => {
      const date = new Date('2024-01-15T11:45:00');
      expect(formatRelativeTime(date)).toBe('15 minutes ago');
      expect(formatRelativeTime(new Date('2024-01-15T11:59:00'))).toBe('1 minute ago');
    });

    test('should format hours ago', () => {
      const date = new Date('2024-01-15T10:00:00');
      expect(formatRelativeTime(date)).toBe('2 hours ago');
      expect(formatRelativeTime(new Date('2024-01-15T11:00:00'))).toBe('1 hour ago');
    });

    test('should format days ago', () => {
      const date = new Date('2024-01-13T12:00:00');
      expect(formatRelativeTime(date)).toBe('2 days ago');
      expect(formatRelativeTime(new Date('2024-01-14T12:00:00'))).toBe('1 day ago');
    });

    test('should format date for older times', () => {
      const date = new Date('2024-01-01T12:00:00');
      const formatted = formatRelativeTime(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2024');
    });

    test('should return empty string for invalid date', () => {
      expect(formatRelativeTime(null)).toBe('');
      expect(formatRelativeTime(undefined)).toBe('');
      expect(formatRelativeTime('invalid')).toBe('');
    });
  });

  describe('formatAddress', () => {
    const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

    test('should truncate address with default params', () => {
      expect(formatAddress(testAddress)).toBe('0x742d...0bEb');
    });

    test('should truncate address with custom params', () => {
      expect(formatAddress(testAddress, 4, 4)).toBe('0x74...0bEb');
      // formatAddress(10, 6) takes 10 chars from start and 6 chars from end
      expect(formatAddress(testAddress, 10, 6)).toBe('0x742d35Cc...5f0bEb');
    });

    test('should return full address if too short', () => {
      const shortAddress = '0x1234';
      expect(formatAddress(shortAddress)).toBe(shortAddress);
    });

    test('should return empty string for null/undefined', () => {
      expect(formatAddress(null)).toBe('');
      expect(formatAddress(undefined)).toBe('');
      expect(formatAddress('')).toBe('');
    });
  });

  describe('formatTxHash', () => {
    const testTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

    test('should truncate tx hash with default params', () => {
      const formatted = formatTxHash(testTxHash);
      expect(formatted).toContain('...');
      expect(formatted.startsWith('0xabcdef12')).toBe(true);
    });

    test('should truncate tx hash with custom params', () => {
      expect(formatTxHash(testTxHash, 6, 4)).toBe('0xabcd...7890');
      expect(formatTxHash(testTxHash, 20, 12)).toContain('...');
    });

    test('should return full hash if too short', () => {
      const shortHash = '0x1234';
      expect(formatTxHash(shortHash)).toBe(shortHash);
    });

    test('should return empty string for null/undefined', () => {
      expect(formatTxHash(null)).toBe('');
      expect(formatTxHash(undefined)).toBe('');
      expect(formatTxHash('')).toBe('');
    });
  });

  describe('formatTokenAmount', () => {
    test('should format token amount with symbol', () => {
      expect(formatTokenAmount(100.1234, 'BTC')).toBe('100.1234 BTC');
      expect(formatTokenAmount(50, 'ETH')).toBe('50.0000 ETH');
    });

    test('should format token amount without symbol', () => {
      expect(formatTokenAmount(100.1234)).toBe('100.1234');
      expect(formatTokenAmount(50)).toBe('50.0000');
    });

    test('should format with custom decimals', () => {
      expect(formatTokenAmount(100.123456, 'BTC', 2)).toBe('100.12 BTC');
      expect(formatTokenAmount(50, 'ETH', 0)).toBe('50 ETH');
    });

    test('should handle null/undefined/NaN', () => {
      expect(formatTokenAmount(null, 'BTC')).toBe('0.0000 BTC');
      expect(formatTokenAmount(undefined, 'ETH')).toBe('0.0000 ETH');
      expect(formatTokenAmount(NaN)).toBe('0.0000');
    });
  });

  describe('formatLargeNumber', () => {
    test('should format billions', () => {
      expect(formatLargeNumber(1500000000)).toBe('1.50B');
      expect(formatLargeNumber(-2500000000)).toBe('-2.50B');
    });

    test('should format millions', () => {
      expect(formatLargeNumber(1500000)).toBe('1.50M');
      expect(formatLargeNumber(-2500000)).toBe('-2.50M');
    });

    test('should format thousands', () => {
      expect(formatLargeNumber(1500)).toBe('1.50K');
      expect(formatLargeNumber(-2500)).toBe('-2.50K');
    });

    test('should format numbers less than 1000', () => {
      expect(formatLargeNumber(500)).toBe('500.00');
      expect(formatLargeNumber(-100)).toBe('-100.00');
    });

    test('should format with custom decimals', () => {
      // formatLargeNumber(1500, 0): 1500/1000 = 1.5, toFixed(0) = "2"
      expect(formatLargeNumber(1500, 0)).toBe('2K');
      expect(formatLargeNumber(1000, 0)).toBe('1K');
      expect(formatLargeNumber(1500000, 1)).toBe('1.5M');
    });

    test('should handle null/undefined/NaN', () => {
      expect(formatLargeNumber(null)).toBe('0');
      expect(formatLargeNumber(undefined)).toBe('0');
      expect(formatLargeNumber(NaN)).toBe('0');
    });
  });

  describe('formatDuration', () => {
    test('should format duration with hours, minutes, seconds', () => {
      // formatDuration doesn't show seconds when hours are present (per implementation)
      expect(formatDuration(3665)).toBe('1h 1m');
      expect(formatDuration(7325)).toBe('2h 2m');
    });

    test('should format duration with hours and minutes', () => {
      expect(formatDuration(3660)).toBe('1h 1m');
      expect(formatDuration(7200)).toBe('2h');
    });

    test('should format duration with minutes and seconds', () => {
      expect(formatDuration(125)).toBe('2m 5s');
      expect(formatDuration(65)).toBe('1m 5s');
    });

    test('should format duration with seconds only', () => {
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(5)).toBe('5s');
    });

    test('should return "0s" for zero or negative', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(-10)).toBe('0s');
      expect(formatDuration(null)).toBe('0s');
    });

    test('should not show seconds if hours present', () => {
      expect(formatDuration(3600)).toBe('1h');
      expect(formatDuration(3720)).toBe('1h 2m');
    });
  });
});