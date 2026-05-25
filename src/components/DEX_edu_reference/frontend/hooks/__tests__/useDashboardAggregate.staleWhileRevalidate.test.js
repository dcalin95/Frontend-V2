/**
 * Stale-while-revalidate: primul load folosește skeleton state; poll-ul nu golește bundle-ul.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useDashboardAggregate } from '../useDashboardAggregate';

jest.mock('../../services/executionApiService', () => ({
  getTrades: jest.fn(),
}));
jest.mock('../../services/performanceApiService', () => ({
  getMetrics: jest.fn(),
  getProfitSummary: jest.fn(),
}));
jest.mock('../../services/signalApiService', () => ({
  getSignals: jest.fn(),
  getSignalPerformance: jest.fn(),
}));
jest.mock('../../services/aiTradingApiService', () => ({
  getOTAHistory: jest.fn(),
  getOTAStats: jest.fn(),
  getAutoExecutionStatus: jest.fn(),
  getOTAQuota: jest.fn(),
  getLastSignal: jest.fn(),
  getOTAHealth: jest.fn(),
}));
jest.mock('../../services/otaShortOpsService', () => ({
  getLiveStatus: jest.fn(),
  getOpenShorts: jest.fn(),
}));
jest.mock('../../services/analyticsApiService', () => ({
  getOpenPositionsAnalytics: jest.fn(),
  getVaultBalanceComparison: jest.fn(),
  getPortfolioSummary: jest.fn(),
}));
jest.mock('../../services/leverageDemoApiService', () => ({
  getDemoStatus: jest.fn(),
  getDemoAccount: jest.fn(),
}));
jest.mock('../../utils/dashboardPipelineDebug', () => ({
  logDashboardPipeline: jest.fn(),
}));

import { getTrades } from '../../services/executionApiService';
import { getSignals } from '../../services/signalApiService';
import { getLastSignal, getOTAHistory } from '../../services/aiTradingApiService';
import { getMetrics } from '../../services/performanceApiService';
import { getLiveStatus, getOpenShorts } from '../../services/otaShortOpsService';
import { getOpenPositionsAnalytics } from '../../services/analyticsApiService';
import { getDemoStatus } from '../../services/leverageDemoApiService';

const defaultTrades = { trades: [{ id: 't1', tokenOut: 'USDT' }], total: 1 };
const emptySignals = { signals: [] };

function mockAllOk(tradesRes = defaultTrades) {
  getTrades.mockResolvedValue(tradesRes);
  getSignals.mockResolvedValue(emptySignals);
  getOTAHistory.mockResolvedValue({});
  getMetrics.mockResolvedValue(null);
  require('../../services/performanceApiService').getProfitSummary.mockResolvedValue(null);
  require('../../services/signalApiService').getSignalPerformance.mockResolvedValue(null);
  require('../../services/aiTradingApiService').getOTAStats.mockResolvedValue(null);
  require('../../services/aiTradingApiService').getAutoExecutionStatus.mockResolvedValue(null);
  require('../../services/aiTradingApiService').getOTAQuota.mockResolvedValue(null);
  require('../../services/aiTradingApiService').getLastSignal.mockResolvedValue({ lastSignal: null });
  require('../../services/aiTradingApiService').getOTAHealth.mockResolvedValue({ ok: true });
  getLiveStatus.mockResolvedValue(null);
  getOpenShorts.mockResolvedValue(null);
  getOpenPositionsAnalytics.mockResolvedValue(null);
  require('../../services/analyticsApiService').getVaultBalanceComparison.mockResolvedValue(null);
  getDemoStatus.mockResolvedValue(null);
  require('../../services/leverageDemoApiService').getDemoAccount.mockResolvedValue(null);
  require('../../services/analyticsApiService').getPortfolioSummary.mockResolvedValue(null);
}

describe('useDashboardAggregate stale-while-revalidate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAllOk();
  });

  it('first load sets isInitialLoading then false with data', async () => {
    const { result } = renderHook(() =>
      useDashboardAggregate(null, { walletAddress: '0x1234567890123456789012345678901234567890', walletType: 'EVM' })
    );

    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.isInitialLoading).toBe(false);
    });

    expect(result.current.trades).toHaveLength(1);
    expect(result.current.trades[0].id).toBe('t1');
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.lastUpdatedAt).toEqual(expect.any(Number));
  });

  it('background refresh keeps prior trades until new payload arrives', async () => {
    const { result } = renderHook(() =>
      useDashboardAggregate(null, { walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', walletType: 'EVM' })
    );

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.trades[0].id).toBe('t1');

    let resolveSecond;
    const slowSecond = new Promise((res) => {
      resolveSecond = res;
    });
    getTrades.mockImplementationOnce(() => slowSecond);

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.isRefreshing).toBe(true));
    expect(result.current.trades[0].id).toBe('t1');

    await act(async () => {
      resolveSecond({
        trades: [{ id: 't2', tokenOut: 'ETH' }],
        total: 1,
      });
    });

    await waitFor(() => expect(result.current.isRefreshing).toBe(false));
    expect(result.current.trades[0].id).toBe('t2');
  });

  it('loading alias matches isInitialLoading only (not tied to poll)', async () => {
    const { result } = renderHook(() =>
      useDashboardAggregate(null, { walletAddress: '0x1111111111111111111111111111111111111111', walletType: 'EVM' })
    );

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.loading).toBe(false);

    let resolveSlow;
    const p = new Promise((res) => {
      resolveSlow = res;
    });
    getTrades.mockImplementationOnce(() => p);

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.isRefreshing).toBe(true));
    expect(result.current.loading).toBe(false);
    expect(result.current.isInitialLoading).toBe(false);

    await act(async () => {
      resolveSlow(defaultTrades);
    });
    await waitFor(() => expect(result.current.isRefreshing).toBe(false));
  });

  it('derives latest signal from the signals feed before stale last-signal fallback', async () => {
    getSignals.mockResolvedValue({
      signals: [
        { id: 'older', token: 'XRP', signal: 'open_short', createdAt: '2026-05-25T04:29:20.000Z' },
        { id: 'newer', token: 'SOL', signal: 'sell', createdAt: '2026-05-25T04:29:28.954Z' },
      ],
    });
    getLastSignal.mockResolvedValue({
      lastSignal: { token: 'XRP', side: 'buy', executedAt: '2026-05-25T04:29:10.000Z' },
    });

    const { result } = renderHook(() =>
      useDashboardAggregate(null, { walletAddress: '0x2222222222222222222222222222222222222222', walletType: 'EVM' })
    );

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));

    expect(result.current.lastSignal).toMatchObject({
      token: 'SOL',
      side: 'sell',
      signal: 'sell',
    });
  });
});
