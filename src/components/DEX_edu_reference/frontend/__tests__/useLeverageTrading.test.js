/**
 * Unit tests for leverage helpers: assetIndexToBytes32, assetIdBytes32ToIndex, parseCFDPosition.
 * Contract uses bytes32 assetId; UI uses index aligned to CFD_SYMBOLS.
 */
import {
  assetIndexToBytes32,
  assetIdBytes32ToIndex,
  parseCFDPosition,
  CFD_TP_SL_ONCHAIN_SUPPORTED,
  toCFDPositionObj,
} from '../utils/leverageUtils';
import { CFD_ASSETS, CFD_SYMBOLS } from '../constants/leverageConstants';

describe('useLeverageTrading (leverage helpers)', () => {
  describe('assetIndexToBytes32', () => {
    test('encodes 0 to 32-byte hex (same as bytes32(uint256(0)))', () => {
      const out = assetIndexToBytes32(0);
      expect(typeof out).toBe('string');
      expect(out).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(out).toBe('0x' + '0'.repeat(64));
    });

    test('encodes sample indices to correct bytes32', () => {
      expect(assetIndexToBytes32(1)).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(assetIndexToBytes32(7)).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(assetIndexToBytes32(11)).toMatch(/^0x[0-9a-fA-F]{64}$/);
    });

    test('round-trip: index -> bytes32 -> index', () => {
      for (let i = 0; i < CFD_SYMBOLS.length; i++) {
        const b32 = assetIndexToBytes32(i);
        expect(assetIdBytes32ToIndex(b32)).toBe(i);
      }
    });
  });

  describe('assetIdBytes32ToIndex', () => {
    test('returns 0 for null/undefined', () => {
      expect(assetIdBytes32ToIndex(null)).toBe(0);
      expect(assetIdBytes32ToIndex(undefined)).toBe(0);
    });

    test('returns number as-is when 0..255', () => {
      expect(assetIdBytes32ToIndex(0)).toBe(0);
      expect(assetIdBytes32ToIndex(5)).toBe(5);
      expect(assetIdBytes32ToIndex(7)).toBe(7);
    });

    test('decodes bytes32 (hex string) from contract to index', () => {
      expect(assetIdBytes32ToIndex(assetIndexToBytes32(0))).toBe(0);
      expect(assetIdBytes32ToIndex(assetIndexToBytes32(3))).toBe(3);
    });

    test('returns 0 for invalid or out-of-range', () => {
      expect(assetIdBytes32ToIndex(NaN)).toBe(0);
      expect(assetIdBytes32ToIndex('not-a-hex')).toBe(0);
    });
  });

  describe('parseCFDPosition', () => {
    test('returns null for empty or missing positionId', () => {
      expect(parseCFDPosition(null)).toBeNull();
      expect(parseCFDPosition({})).toBeNull();
      expect(parseCFDPosition({ positionId: null })).toBeNull();
    });

    test('parses raw with assetId bytes32 and leverageBps', () => {
      const raw = {
        positionId: '42',
        user: '0x1234567890123456789012345678901234567890',
        assetId: assetIndexToBytes32(0),
        settlementToken: '0xUSDT',
        marginAmount: '1000000000000000000',
        leverageBps: '50000',
        isLong: true,
        entryPrice: '97000000000000000000000',
        liquidationPrice: '80000000000000000000000',
        openedAt: '1700000000',
        isActive: true,
      };
      const parsed = parseCFDPosition(raw);
      expect(parsed).not.toBeNull();
      expect(parsed.positionId).toBe('42');
      expect(parsed.asset).toBe(0);
      expect(parsed.assetLabel).toBe(CFD_ASSETS[0].label);
      expect(parsed.leverageBps).toBe('50000');
      expect(parsed.leverageRatio).toBe('50000');
      expect(parsed.isLong).toBe(true);
      expect(parsed.isActive).toBe(true);
      expect(parsed.liquidationPrice).toBe('80000000000000000000000');
      expect(parsed.takeProfitHuman).toBeUndefined();
      expect(parsed.stopLossHuman).toBeUndefined();
      expect(CFD_TP_SL_ONCHAIN_SUPPORTED).toBe(true);
    });

    test('toCFDPositionObj maps V2 tuple array to fields', () => {
      const tuple = [
        1,
        '0xuser',
        assetIndexToBytes32(2),
        '0x1111111111111111111111111111111111111111',
        '1000',
        '50000',
        true,
        '2000000000000000000000',
        1,
        true,
        0,
        0,
      ];
      const o = toCFDPositionObj(tuple);
      expect(o.leverageBps).toBe('50000');
      const parsed = parseCFDPosition(tuple, 'X', 2);
      expect(parsed).not.toBeNull();
      expect(parsed.asset).toBe(2);
    });

    test('parses raw with legacy asset (uint8) and leverageRatio for backward compat', () => {
      const raw = {
        positionId: '1',
        user: '0xabc',
        asset: 2,
        settlementToken: '0xUSDC',
        marginAmount: '500000000000000000',
        leverageRatio: '30000',
        isLong: false,
        entryPrice: '2650000000000000000000',
        openedAt: '1700000001',
        isActive: true,
      };
      const parsed = parseCFDPosition(raw);
      expect(parsed).not.toBeNull();
      expect(parsed.asset).toBe(2);
      expect(parsed.assetLabel).toBe(CFD_ASSETS[2].label);
      expect(parsed.leverageBps).toBe('30000');
      expect(parsed.leverageRatio).toBe('30000');
    });

    test('uses provided assetLabel when given', () => {
      const raw = {
        positionId: '2',
        user: '0xdef',
        assetId: assetIndexToBytes32(5),
        settlementToken: '0x',
        marginAmount: '0',
        leverageBps: '20000',
        isLong: true,
        entryPrice: '0',
        openedAt: '0',
        isActive: true,
      };
      const parsed = parseCFDPosition(raw, 'Custom BNB/USD');
      expect(parsed.assetLabel).toBe('Custom BNB/USD');
    });
  });
});
