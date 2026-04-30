/**
 * Tests for OTA SEI Micro-Profit service (config, min profit, gas estimate, trigger logic, SEI Auto status/set).
 */

import {
  getLocalEnabled,
  setLocalEnabled,
  getStrategyConfig,
  estimateGasCostPerRoundTrip,
  getMinProfitUsd,
  shouldTriggerRoundTrip,
  getSeiAutoStatus,
  setSeiAuto,
  STRATEGY_NAME,
  DEFAULT_STRATEGY_CONFIG,
} from '../services/otaSeiMicroProfitService';

const STORAGE_KEY = 'ota-sei-micro-profit-enabled';
const originalFetch = global.fetch;

function mockSeiMarketFetch({
  seiUsd = 0.2,
  atomUsd = 5,
  returnAmount = '40000',
} = {}) {
  global.fetch = jest.fn((url) => {
    const requestUrl = String(url);
    if (requestUrl.includes('api.coingecko.com')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          'sei-network': { usd: seiUsd },
          cosmos: { usd: atomUsd },
        }),
      });
    }
    if (requestUrl.includes('/cosmwasm/wasm/v1/contract/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: { return_amount: returnAmount },
        }),
      });
    }
    return Promise.reject(new Error(`Unexpected fetch in test: ${requestUrl}`));
  });
}

describe('otaSeiMicroProfitService', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('ota-sei-micro-profit-percent');
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getLocalEnabled / setLocalEnabled', () => {
    it('returns null when not set', () => {
      expect(getLocalEnabled()).toBeNull();
    });
    it('returns true/false after setLocalEnabled', () => {
      setLocalEnabled(true);
      expect(getLocalEnabled()).toBe(true);
      setLocalEnabled(false);
      expect(getLocalEnabled()).toBe(false);
    });
  });

  describe('getMinProfitUsd', () => {
    it('uses minProfitOverGasUsd when set and > 0', () => {
      const cfg = { ...DEFAULT_STRATEGY_CONFIG, minProfitOverGasUsd: 0.001 };
      expect(getMinProfitUsd(cfg, 0.0005)).toBe(0.001);
    });
    it('uses gas * (1 + percent/100) when no minProfitOverGasUsd', () => {
      const cfg = { ...DEFAULT_STRATEGY_CONFIG, minProfitOverGasUsd: undefined, minProfitOverGasPercent: 100 };
      const gas = 0.00049;
      expect(getMinProfitUsd(cfg, gas)).toBeCloseTo(gas * 2, 10);
    });
    it('handles null config with default', () => {
      const gas = 0.0005;
      const out = getMinProfitUsd(null, gas);
      expect(typeof out).toBe('number');
      expect(out).toBeGreaterThan(0);
    });
  });

  describe('getStrategyConfig', () => {
    it('resolves to object with strategyName, pair, enabled', async () => {
      const cfg = await getStrategyConfig();
      expect(cfg).toHaveProperty('strategyName', STRATEGY_NAME);
      expect(cfg.pair).toBeDefined();
      expect(['SEI/ATOM', 'SEI/USDC', 'SEI/USDT']).toContain(cfg.pair);
      expect(typeof cfg.enabled).toBe('boolean');
      expect(cfg).toHaveProperty('minProfitOverGasPercent');
      expect(cfg).toHaveProperty('gasEstimateUsdPerSwap');
    });
  });

  describe('estimateGasCostPerRoundTrip', () => {
    it('resolves to number (2x per swap)', async () => {
      const gas = await estimateGasCostPerRoundTrip();
      expect(typeof gas).toBe('number');
      expect(gas).toBeGreaterThan(0);
      expect(gas).toBeLessThanOrEqual(1);
    });
  });

  describe('shouldTriggerRoundTrip', () => {
    it('returns trigger false when strategy disabled', async () => {
      setLocalEnabled(false);
      const cfg = await getStrategyConfig();
      cfg.enabled = false;
      const result = await shouldTriggerRoundTrip({ spreadPct: 1, notionalUsd: 100, side: 'buy' });
      expect(result.trigger).toBe(false);
      expect(result.reason).toMatch(/disabled/i);
    });
    it('returns trigger false when profit below threshold', async () => {
      setLocalEnabled(true);
      mockSeiMarketFetch();
      const result = await shouldTriggerRoundTrip({ spreadPct: 0, notionalUsd: 0 });
      expect(result.trigger).toBe(false);
    });
    it('returns object with trigger, side, reason', async () => {
      mockSeiMarketFetch();
      const result = await shouldTriggerRoundTrip({});
      expect(result).toHaveProperty('trigger');
      expect(result).toHaveProperty('side');
      expect(result).toHaveProperty('reason');
    });
  });

  describe('getSeiAutoStatus', () => {
    it('returns default shape when userId is missing', async () => {
      const out = await getSeiAutoStatus(null);
      expect(out).toMatchObject({
        enabled: false,
        minProfitOverGasPercent: 100,
        maxAmountPerTrade: '10',
        workerActive: false,
        lastRunAt: null,
        executions24h: 0,
      });
      expect(['SEI/ATOM', 'SEI/USDC', 'SEI/USDT']).toContain(out.preferredPair);
      expect(out.readiness?.legacyApi).toBe(true);
      expect(out.readiness?.autoEnabled).toBe(false);
    });
    it('returns default shape when userId is empty string', async () => {
      const out = await getSeiAutoStatus('');
      expect(out).toMatchObject({
        enabled: false,
        workerActive: false,
      });
      expect(['SEI/ATOM', 'SEI/USDC', 'SEI/USDT']).toContain(out.preferredPair);
    });
  });

  describe('setSeiAuto', () => {
    it('returns { success: false } when userId is missing', async () => {
      const out = await setSeiAuto(null, { enabled: true });
      expect(out).toEqual({ success: false });
    });
    it('returns { success: false } when userId is empty', async () => {
      const out = await setSeiAuto('', {});
      expect(out).toEqual({ success: false });
    });
  });
});

describe('otaSeiMicroProfitService (getSeiAutoStatus with fetch mock)', () => {
  let getSeiAutoStatusWithFetch;
  let setSeiAutoWithFetch;
  const originalEnv = process.env;

  beforeAll(() => {
    process.env.REACT_APP_OTA_API_URL = 'https://api.test.example.com';
    jest.resetModules();
    const service = require('../services/otaSeiMicroProfitService');
    getSeiAutoStatusWithFetch = service.getSeiAutoStatus;
    setSeiAutoWithFetch = service.setSeiAuto;
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('getSeiAutoStatus parses success response with stopIfCannotEstimate, maxRounds, roundsDone, preferredPair', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          enabled: true,
          minProfitOverGasPercent: 150,
          maxAmountPerTrade: '20',
          preferredPair: 'SEI/USDT',
          workerActive: false,
          lastRunAt: '2026-02-08T12:00:00Z',
          executions24h: 5,
          stopIfCannotEstimate: true,
          maxRounds: 10,
          roundsDone: 3,
        }),
    });
    const out = await getSeiAutoStatusWithFetch('user-1');
    expect(out).toMatchObject({
      enabled: true,
      minProfitOverGasPercent: 150,
      maxAmountPerTrade: '20',
      preferredPair: 'SEI/USDT',
      workerActive: false,
      lastRunAt: '2026-02-08T12:00:00Z',
      executions24h: 5,
      stopIfCannotEstimate: true,
      maxRounds: 10,
      roundsDone: 3,
    });
    expect(out.readiness?.legacyApi).toBe(true);
    expect(out.readiness?.autoEnabled).toBe(true);
  });

  it('getSeiAutoStatus merges readiness from API', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          enabled: true,
          readiness: {
            supported: true,
            executionReady: false,
            blockReason: 'quote_unavailable',
            preferredPairQuoted: 'SEI/USDC',
          },
        }),
    });
    const out = await getSeiAutoStatusWithFetch('user-1');
    expect(out.readiness?.executionReady).toBe(false);
    expect(out.readiness?.blockReason).toBe('quote_unavailable');
    expect(out.readiness?.legacyApi).toBe(false);
  });

  it('getSeiAutoStatus returns default when success is false', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: false }),
    });
    const out = await getSeiAutoStatusWithFetch('user-1');
    expect(out).toMatchObject({
      enabled: false,
      workerActive: false,
    });
  });

  it('setSeiAuto sends resetRounds in body', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    await setSeiAutoWithFetch('user-1', { resetRounds: true });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test.example.com/api/ai-trading/sei/auto/set',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-1', resetRounds: true }),
      })
    );
  });

  it('setSeiAuto sends preferredPair in body', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    await setSeiAutoWithFetch('user-1', { preferredPair: 'SEI/USDT' });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test.example.com/api/ai-trading/sei/auto/set',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ userId: 'user-1', preferredPair: 'SEI/USDT' }),
      })
    );
  });
});

/** Same logic as OtaSeiMicroProfitPanel useMemo for accumulated profit (mirrored for tests). */
function computeAccumulatedProfit(seiHistory) {
  if (!Array.isArray(seiHistory) || seiHistory.length === 0) return 0;
  let sum = 0;
  for (const t of seiHistory) {
    const profitUsd = t.profitUsd != null && Number.isFinite(Number(t.profitUsd)) ? Number(t.profitUsd) : null;
    if (profitUsd != null) {
      sum += profitUsd;
      continue;
    }
    const inVal = t.amountIn != null ? Number(t.amountIn) : null;
    const outVal = t.amountOut != null ? Number(t.amountOut) : null;
    if (inVal != null && outVal != null && Number.isFinite(inVal) && Number.isFinite(outVal)) {
      sum += outVal - inVal;
    }
  }
  return sum;
}

describe('Activity & Profit logic (mirrors panel useMemo)', () => {
  it('returns 0 for empty history', () => {
    expect(computeAccumulatedProfit([])).toBe(0);
    expect(computeAccumulatedProfit(null)).toBe(0);
  });

  it('sums profitUsd when present', () => {
    const history = [
      { profitUsd: 0.5, amountIn: 1, amountOut: 2 },
      { profitUsd: 0.3 },
    ];
    expect(computeAccumulatedProfit(history)).toBeCloseTo(0.8, 10);
  });

  it('falls back to amountOut - amountIn when profitUsd missing', () => {
    const history = [
      { amountIn: 10, amountOut: 10.5 },
      { amountIn: 5, amountOut: 5.2 },
    ];
    expect(computeAccumulatedProfit(history)).toBeCloseTo(0.7, 10);
  });

  it('mixes profitUsd and amountOut-amountIn', () => {
    const history = [
      { profitUsd: 0.1 },
      { amountIn: 1, amountOut: 1.05 },
    ];
    expect(computeAccumulatedProfit(history)).toBeCloseTo(0.15, 10);
  });

  it('ignores non-finite or missing values', () => {
    const history = [
      { profitUsd: 0.5 },
      { amountIn: 1 }, // no amountOut
      { amountOut: 2 }, // no amountIn
      { profitUsd: NaN },
    ];
    expect(computeAccumulatedProfit(history)).toBe(0.5);
  });
});
