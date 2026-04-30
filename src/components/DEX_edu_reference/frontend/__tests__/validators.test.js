/**
 * ✅ Validators Test Suite
 * 
 * Unit tests pentru validators.js:
 * - Email validation
 * - Address validation
 * - Number validation
 * - Required field validation
 * - Percentage validation
 * - URL validation
 * - Transaction hash validation
 * - Strategy config validation
 * - Trade params validation
 * 
 * @module validators.test
 */

import {
  isValidEmail,
  isValidAddress,
  isValidNumber,
  isRequired,
  isValidPercentage,
  isValidPercentageDecimal,
  isValidPositiveNumber,
  isValidUrl,
  isValidTxHash,
  validateStrategyConfig,
  validateTradeParams
} from '../utils/validators';

describe('Validators', () => {
  describe('isValidEmail', () => {
    test('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    test('should return false for invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
    });
  });

  describe('isValidAddress', () => {
    test('should return true for valid Ethereum/BSC addresses', () => {
      // isValidAddress uses case-insensitive regex [a-fA-F0-9], so both cases work
      // Note: Address must have exactly 40 hex characters after 0x
      // Valid addresses: 42 chars total (0x + 40 hex)
      expect(isValidAddress('0x0000000000000000000000000000000000000000')).toBe(true);
      expect(isValidAddress('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')).toBe(true);
      expect(isValidAddress('0xabcdef1234567890abcdef1234567890abcdef12')).toBe(true);
      expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      // Valid lowercase address (40 hex chars)
      expect(isValidAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb0')).toBe(true);
    });

    test('should return false for invalid addresses', () => {
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bE')).toBe(false); // too short
      expect(isValidAddress('742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(false); // no 0x
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbg')).toBe(false); // invalid char
      expect(isValidAddress('')).toBe(false);
      expect(isValidAddress(null)).toBe(false);
    });
  });

  describe('isValidNumber', () => {
    test('should return true for valid numbers', () => {
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(100)).toBe(true);
      expect(isValidNumber(-50)).toBe(true);
      expect(isValidNumber('100')).toBe(true);
      expect(isValidNumber('0')).toBe(true);
    });

    test('should validate min/max constraints', () => {
      expect(isValidNumber(50, 0, 100)).toBe(true);
      expect(isValidNumber(0, 0, 100)).toBe(true);
      expect(isValidNumber(100, 0, 100)).toBe(true);
      expect(isValidNumber(-1, 0, 100)).toBe(false);
      expect(isValidNumber(101, 0, 100)).toBe(false);
    });

    test('should return false for invalid numbers', () => {
      expect(isValidNumber('abc')).toBe(false);
      expect(isValidNumber(null)).toBe(false);
      expect(isValidNumber(undefined)).toBe(false);
      expect(isValidNumber('')).toBe(false);
    });
  });

  describe('isRequired', () => {
    test('should return true for non-empty values', () => {
      expect(isRequired('text')).toBe(true);
      expect(isRequired(0)).toBe(true);
      expect(isRequired(false)).toBe(true);
      expect(isRequired([])).toBe(false); // empty array
      expect(isRequired([1, 2, 3])).toBe(true);
      expect(isRequired({ key: 'value' })).toBe(true);
    });

    test('should return false for empty values', () => {
      expect(isRequired('')).toBe(false);
      expect(isRequired('   ')).toBe(false); // whitespace only
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
      expect(isRequired([])).toBe(false);
      expect(isRequired({})).toBe(false);
    });
  });

  describe('isValidPercentage', () => {
    test('should return true for valid percentages (0-100)', () => {
      expect(isValidPercentage(0)).toBe(true);
      expect(isValidPercentage(50)).toBe(true);
      expect(isValidPercentage(100)).toBe(true);
      expect(isValidPercentage('50')).toBe(true);
    });

    test('should return false for invalid percentages', () => {
      expect(isValidPercentage(-1)).toBe(false);
      expect(isValidPercentage(101)).toBe(false);
      expect(isValidPercentage('abc')).toBe(false);
    });
  });

  describe('isValidPercentageDecimal', () => {
    test('should return true for valid decimal percentages (0-1)', () => {
      expect(isValidPercentageDecimal(0)).toBe(true);
      expect(isValidPercentageDecimal(0.5)).toBe(true);
      expect(isValidPercentageDecimal(1)).toBe(true);
      expect(isValidPercentageDecimal('0.5')).toBe(true);
    });

    test('should return false for invalid decimal percentages', () => {
      expect(isValidPercentageDecimal(-0.1)).toBe(false);
      expect(isValidPercentageDecimal(1.1)).toBe(false);
    });
  });

  describe('isValidPositiveNumber', () => {
    test('should return true for positive numbers', () => {
      expect(isValidPositiveNumber(0)).toBe(true);
      expect(isValidPositiveNumber(1)).toBe(true);
      expect(isValidPositiveNumber(100)).toBe(true);
      expect(isValidPositiveNumber('100')).toBe(true);
    });

    test('should return false for negative numbers', () => {
      expect(isValidPositiveNumber(-1)).toBe(false);
      expect(isValidPositiveNumber(-100)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    test('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
      expect(isValidUrl('https://subdomain.example.com:8080/path?query=value')).toBe(true);
    });

    test('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl(null)).toBe(false);
    });
  });

  describe('isValidTxHash', () => {
    test('should return true for valid transaction hashes', () => {
      expect(isValidTxHash('0x' + 'a'.repeat(64))).toBe(true);
      expect(isValidTxHash('0x' + '1'.repeat(64))).toBe(true);
      expect(isValidTxHash('0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890')).toBe(true);
    });

    test('should return false for invalid transaction hashes', () => {
      expect(isValidTxHash('0x' + 'a'.repeat(63))).toBe(false); // too short
      expect(isValidTxHash('a'.repeat(64))).toBe(false); // no 0x
      expect(isValidTxHash('')).toBe(false);
      expect(isValidTxHash(null)).toBe(false);
    });
  });

  describe('validateStrategyConfig', () => {
    test('should return valid for correct config', () => {
      const config = {
        riskLimits: {
          maxPercentPerTrade: 5,
          dailyLossLimit: 10,
          maxDrawdown: 20
        }
      };
      const result = validateStrategyConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return errors for invalid config', () => {
      const config = {
        riskLimits: {
          maxPercentPerTrade: 150, // invalid (> 100)
          dailyLossLimit: -10, // invalid (< 0)
          maxDrawdown: 200 // invalid (> 100)
        }
      };
      const result = validateStrategyConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should return error for missing config', () => {
      const result = validateStrategyConfig(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Strategy config is required');
    });
  });

  describe('validateTradeParams', () => {
    test('should return valid for correct params', () => {
      const params = {
        tokenIn: 'BNB',
        tokenOut: 'USDT',
        amountIn: 100,
        amountOutMin: 90
      };
      const result = validateTradeParams(params);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return errors for missing required fields', () => {
      const params = {
        tokenOut: 'USDT',
        amountIn: 100
      };
      const result = validateTradeParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Token In is required');
    });

    test('should return errors for invalid amounts', () => {
      const params = {
        tokenIn: 'BNB',
        tokenOut: 'USDT',
        amountIn: -100 // invalid
      };
      const result = validateTradeParams(params);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Amount In must be a positive number');
    });

    test('should return error for missing params', () => {
      const result = validateTradeParams(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Trade parameters are required');
    });
  });
});
