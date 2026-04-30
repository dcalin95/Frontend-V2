/**
 * useVaultTransactionHistory – backend-first, stale guard, stări parțiale.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useVaultTransactionHistory,
  buildBackendPartialMessage,
  VAULT_HISTORY_BROWSER_PATH_MAX_MS,
} from '../useVaultTransactionHistory';
import { getVaultChainHistory } from '../../services/analyticsApiService';
import {
  clearOtaWalletSession,
  getOtaWalletAuthToken,
  validateCachedOtaWalletSession,
} from '../../utils/otaWalletSession';

jest.mock('../../services/analyticsApiService', () => ({
  getVaultChainHistory: jest.fn(),
}));

jest.mock('../../utils/otaWalletSession', () => ({
  getOtaWalletAuthToken: jest.fn(),
  validateCachedOtaWalletSession: jest.fn(),
  clearOtaWalletSession: jest.fn(),
  ensureOtaWalletForApiIfNeeded: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../useWallet.jsx', () => ({
  __esModule: true,
  default: () => ({ signer: null }),
}));

jest.mock('../../../../../contract/contractMap', () => ({
  CONTRACT_MAP: {
    USER_VAULT: {
      address: '0x0000000000000000000000000000000000000001',
      abi: [
        'event FundsDeposited(address indexed user, address indexed token, uint256 amount, uint256 newBalance)',
        'event FundsWithdrawn(address indexed user, address indexed token, uint256 amount, uint256 newBalance)',
      ],
    },
  },
  getActiveNetwork: () => ({ rpcUrl: 'https://bsc-dataseed1.binance.org' }),
  getUserVaultProxyAddressForHistory: () => '0x0000000000000000000000000000000000000001',
}));

const ADDR_A = '0x1111111111111111111111111111111111111111';
const ADDR_B = '0x2222222222222222222222222222222222222222';

const sampleItem = (txHash) => ({
  type: 'deposit',
  txHash,
  amount: '1000000000000000000',
  decimals: 18,
  symbol: 'USDT',
  token: '0x55d398326f99059fF775485246999027B3197955',
  blockNumber: 42,
  _sort: 42000,
});

describe('buildBackendPartialMessage', () => {
  it('returnează mesaj când truncated', () => {
    const msg = buildBackendPartialMessage({ truncated: true, stopReason: 'request_timeout' });
    expect(msg).toMatch(/incomplet|BscScan/i);
  });

  it('nu sperie userul pentru stop normal recent history', () => {
    const msg = buildBackendPartialMessage({ truncated: false, stopReason: 'recent_history_window_complete' });
    expect(msg).toBeNull();
  });

  it('mesaj pentru syncStatus syncing (lag index vs head)', () => {
    const msg = buildBackendPartialMessage({ syncStatus: 'syncing', stale: false });
    expect(msg).toMatch(/recent|reîmprospătare|Indexul/i);
  });

  it('syncing + recentUserFacingCoverageOk: fără mesaj defensiv (metadata API)', () => {
    const msg = buildBackendPartialMessage({
      syncStatus: 'syncing',
      stale: false,
      recentUserFacingCoverageOk: true,
      recentDiscoveryReady: false,
    });
    expect(msg).toBeNull();
  });

  it('backfill_partial + recentUserFacingCoverageOk: short message about older history', () => {
    const msg = buildBackendPartialMessage({
      syncStatus: 'backfill_partial',
      stale: false,
      recentUserFacingCoverageOk: true,
      recentDiscoveryReady: false,
      recentBridgeCoverageOk: false,
    });
    expect(msg).toMatch(/recent window|indexed/i);
  });

  it('backfill_partial + recentBridgeCoverageOk: firm message only when API confirms', () => {
    const msg = buildBackendPartialMessage({
      syncStatus: 'backfill_partial',
      stale: false,
      recentBridgeCoverageOk: true,
    });
    expect(msg).toMatch(/recent events.*visible/i);
  });

  it('backfill_partial without confirmed recent coverage: cautious message', () => {
    const msg = buildBackendPartialMessage({
      syncStatus: 'backfill_partial',
      stale: false,
      recentBridgeCoverageOk: false,
    });
    expect(msg).toMatch(/refresh|background/i);
    expect(msg).not.toMatch(/should already be visible/i);
  });
});

describe('useVaultTransactionHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getOtaWalletAuthToken.mockReturnValue(null);
    validateCachedOtaWalletSession.mockResolvedValue(true);
  });

  it('nu aplică răspuns vechi după schimbare wallet (stale guard)', async () => {
    let resolveLate;
    const latePromise = new Promise((r) => {
      resolveLate = r;
    });

    getVaultChainHistory
      .mockImplementationOnce(() => latePromise)
      .mockResolvedValueOnce({
        success: true,
        items: [sampleItem('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')],
        source: 'user_vault_events',
        truncated: false,
      });

    const { result, rerender } = renderHook(
      ({ addr }) => useVaultTransactionHistory(addr, { enableBrowserFallback: false }),
      { initialProps: { addr: ADDR_A } }
    );

    await waitFor(() => expect(getVaultChainHistory).toHaveBeenCalledTimes(1));

    rerender({ addr: ADDR_B });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].txHash).toMatch(/0xbbbb/);

    await act(async () => {
      resolveLate({
        success: true,
        items: [sampleItem('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')],
        source: 'user_vault_events',
        truncated: false,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].txHash).toMatch(/0xbbbb/);
  });

  it('backend success cu items autoritative', async () => {
    getVaultChainHistory.mockResolvedValue({
      success: true,
      items: [sampleItem('0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc')],
      source: 'user_vault_events',
      truncated: false,
    });

    const { result } = renderHook(() => useVaultTransactionHistory(ADDR_A, { enableBrowserFallback: false }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(result.current.items[0].txHash).toMatch(/0xcccc/);
  });

  it('afișează avertizare când backend raportează truncated', async () => {
    getVaultChainHistory.mockResolvedValue({
      success: true,
      items: [],
      source: 'user_vault_events',
      truncated: true,
      stopReason: 'request_timeout',
    });

    const { result } = renderHook(() => useVaultTransactionHistory(ADDR_A, { enableBrowserFallback: false }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.warning).toBeTruthy();
    expect(result.current.warning).toMatch(/incomplet|BscScan/i);
  });

  it('eroare backend fără items: nu lasă listă ca succes fals', async () => {
    getVaultChainHistory.mockRejectedValue(new Error('network fail'));

    const { result } = renderHook(() => useVaultTransactionHistory(ADDR_A, { enableBrowserFallback: false }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.items).toHaveLength(0);
  });

  it('isRefreshing true când există items și încă se reîncarcă', async () => {
    getVaultChainHistory.mockResolvedValueOnce({
      success: true,
      items: [sampleItem('0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd')],
      source: 'user_vault_events',
      truncated: false,
    });

    const { result } = renderHook(() => useVaultTransactionHistory(ADDR_A, { enableBrowserFallback: false }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isRefreshing).toBe(false);

    let resolveSlow;
    const slow = new Promise((r) => {
      resolveSlow = r;
    });
    getVaultChainHistory.mockImplementationOnce(() => slow);

    act(() => {
      result.current.refetch({ manual: true });
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.items.length).toBeGreaterThan(0);
    expect(result.current.isRefreshing).toBe(true);

    await act(async () => {
      resolveSlow({
        success: true,
        items: [sampleItem('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')],
        source: 'user_vault_events',
        truncated: false,
      });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isRefreshing).toBe(false);
  });

  it('fallback browser rămâne strict timeboxed (constante export)', () => {
    expect(VAULT_HISTORY_BROWSER_PATH_MAX_MS).toBeLessThanOrEqual(30000);
  });

  it('nu auto-deschide auth OTA când autoEnsureSession este false și nu există token', async () => {
    const { result } = renderHook(() =>
      useVaultTransactionHistory(ADDR_A, { enableBrowserFallback: false, autoEnsureSession: false })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getVaultChainHistory).not.toHaveBeenCalled();
    expect(result.current.authRequired).toBe(true);
    expect(result.current.items).toHaveLength(0);
  });

  it('încarcă istoricul dacă există deja sesiune OTA validă', async () => {
    getOtaWalletAuthToken.mockReturnValue('otaw_existing');
    validateCachedOtaWalletSession.mockResolvedValue(true);
    getVaultChainHistory.mockResolvedValue({
      success: true,
      items: [sampleItem('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
      source: 'user_vault_events',
      truncated: false,
    });

    const { result } = renderHook(() =>
      useVaultTransactionHistory(ADDR_A, { enableBrowserFallback: false, autoEnsureSession: false })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getVaultChainHistory).toHaveBeenCalledWith(ADDR_A);
    expect(result.current.authRequired).toBe(false);
    expect(result.current.items).toHaveLength(1);
  });

  it('șterge tokenul invalid și rămâne în mod read-only fără popup nou', async () => {
    getOtaWalletAuthToken.mockReturnValue('otaw_stale');
    validateCachedOtaWalletSession.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useVaultTransactionHistory(ADDR_A, { enableBrowserFallback: false, autoEnsureSession: false })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(clearOtaWalletSession).toHaveBeenCalled();
    expect(getVaultChainHistory).not.toHaveBeenCalled();
    expect(result.current.authRequired).toBe(true);
  });
});
