import { renderHook, waitFor } from '@testing-library/react';
import { useClosedPositionsProfitUsd } from '../useClosedPositionsProfitUsd';

const mockGetClosedPositionsProfitUsd = jest.fn();
const mockEnsureOtaWalletForApiIfNeeded = jest.fn();
const mockGetOtaWalletAuthToken = jest.fn();
const mockValidateCachedOtaWalletSession = jest.fn();
const mockClearOtaWalletSession = jest.fn();
const mockIsDexWalletSessionActiveForAddress = jest.fn();

jest.mock('../../services/closedPositionsProfitService', () => ({
  getClosedPositionsProfitUsd: (...args) => mockGetClosedPositionsProfitUsd(...args),
}));

jest.mock('../useWallet.jsx', () => ({
  __esModule: true,
  default: () => ({
    signer: {
      getAddress: jest.fn().mockResolvedValue('0x123'),
    },
  }),
}));

jest.mock('../../utils/otaWalletSession', () => ({
  ensureOtaWalletForApiIfNeeded: (...args) => mockEnsureOtaWalletForApiIfNeeded(...args),
  getOtaWalletAuthToken: (...args) => mockGetOtaWalletAuthToken(...args),
  validateCachedOtaWalletSession: (...args) => mockValidateCachedOtaWalletSession(...args),
  clearOtaWalletSession: (...args) => mockClearOtaWalletSession(...args),
  isDexWalletSessionActiveForAddress: (...args) => mockIsDexWalletSessionActiveForAddress(...args),
}));

describe('useClosedPositionsProfitUsd', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClosedPositionsProfitUsd.mockResolvedValue({
      totalProfitUsd: 12.34,
      fromExecutions: 10,
      fromDirectEntry: 2.34,
      executionsDetail: [],
      directEntryDetail: [],
      errors: [],
    });
    mockEnsureOtaWalletForApiIfNeeded.mockResolvedValue(undefined);
    mockGetOtaWalletAuthToken.mockReturnValue(null);
    mockValidateCachedOtaWalletSession.mockResolvedValue(true);
    mockIsDexWalletSessionActiveForAddress.mockResolvedValue(false);
  });

  it('does not auto-open OTA auth when autoEnsureSession is false and no cached token exists', async () => {
    const { result } = renderHook(() =>
      useClosedPositionsProfitUsd('0xabc', { autoEnsureSession: false, refreshIntervalMs: 999999 })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockEnsureOtaWalletForApiIfNeeded).not.toHaveBeenCalled();
    expect(mockGetClosedPositionsProfitUsd).not.toHaveBeenCalled();
    expect(result.current.authRequired).toBe(true);
    expect(result.current.totalProfitUsd).toBe(0);
  });

  it('loads profit with existing OTA session when autoEnsureSession is false', async () => {
    mockGetOtaWalletAuthToken.mockReturnValue('otaw_existing');
    mockValidateCachedOtaWalletSession.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useClosedPositionsProfitUsd('0xabc', { autoEnsureSession: false, refreshIntervalMs: 999999 })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockEnsureOtaWalletForApiIfNeeded).not.toHaveBeenCalled();
    expect(mockGetClosedPositionsProfitUsd).toHaveBeenCalledWith('0xabc', {
      executionLimit: 50,
      closedLimit: 50,
    });
    expect(result.current.authRequired).toBe(false);
    expect(result.current.totalProfitUsd).toBe(12.34);
  });

  it('clears invalid cached OTA session and stays read-only without a new signature request', async () => {
    mockGetOtaWalletAuthToken.mockReturnValue('otaw_stale');
    mockValidateCachedOtaWalletSession.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useClosedPositionsProfitUsd('0xabc', { autoEnsureSession: false, refreshIntervalMs: 999999 })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockClearOtaWalletSession).toHaveBeenCalled();
    expect(mockEnsureOtaWalletForApiIfNeeded).not.toHaveBeenCalled();
    expect(mockGetClosedPositionsProfitUsd).not.toHaveBeenCalled();
    expect(result.current.authRequired).toBe(true);
  });
});
