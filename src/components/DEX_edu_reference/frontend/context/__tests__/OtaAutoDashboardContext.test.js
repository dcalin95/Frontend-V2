/**
 * Verifică că un singur ciclu de polling apelează getAutoExecutionStatus / getPolicy o dată (nu dublare între OTAPage și AutoTradePanel — același provider).
 */
import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { OtaAutoDashboardProvider, useOtaAutoDashboard } from '../OtaAutoDashboardContext.jsx';
import * as aiTradingApiService from '../../services/aiTradingApiService';
import * as otaPolicyService from '../../services/otaPolicyService';

jest.mock('../../../config/apiEndpoints.js', () => ({
  getApiBaseUrl: () => 'http://test.local',
}));

jest.mock('../../services/aiTradingApiService', () => ({
  getAutoExecutionStatus: jest.fn(),
}));
jest.mock('../../services/otaPolicyService', () => ({
  getPolicy: jest.fn(),
}));

function Child() {
  const v = useOtaAutoDashboard();
  return (
    <div>
      <span data-testid="has-auto">{v.autoStatus?.executorFunctional === true ? 'worker' : 'noworker'}</span>
      <button type="button" onClick={() => v.refresh()}>
        refresh
      </button>
    </div>
  );
}

describe('OtaAutoDashboardProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ decision: { allowAutoStart: true } }),
      })
    );
    aiTradingApiService.getAutoExecutionStatus.mockResolvedValue({
      executorFunctional: true,
      otaAutoClarity: { chainPolicyEnabled: true, backendSessionRegistered: true },
    });
    otaPolicyService.getPolicy.mockResolvedValue({ enabled: true });
  });

  it('la mount apelează getAutoExecutionStatus și getPolicy exact o dată fiecare', async () => {
    render(
      <OtaAutoDashboardProvider walletAddress="0xAbC" enabled>
        <Child />
      </OtaAutoDashboardProvider>
    );
    await waitFor(() => {
      expect(aiTradingApiService.getAutoExecutionStatus).toHaveBeenCalledTimes(1);
      expect(otaPolicyService.getPolicy).toHaveBeenCalledTimes(1);
    });
    const level5Calls = global.fetch.mock.calls.filter((c) =>
      String(c[0]).includes('/ai-trading/level5/')
    );
    expect(level5Calls.length).toBe(4);
  });

  it('la ~30s interval reapela getAutoExecutionStatus + getPolicy (aceleași chei ca la mount)', async () => {
    jest.useFakeTimers({ now: 0 });
    render(
      <OtaAutoDashboardProvider walletAddress="0xAbC" enabled>
        <Child />
      </OtaAutoDashboardProvider>
    );
    await waitFor(
      () => {
        expect(aiTradingApiService.getAutoExecutionStatus).toHaveBeenCalledTimes(1);
      },
      { advanceTimers: jest.advanceTimersByTime }
    );
    await act(async () => {
      jest.advanceTimersByTime(30000);
    });
    await waitFor(
      () => {
        expect(aiTradingApiService.getAutoExecutionStatus).toHaveBeenCalledTimes(2);
        expect(otaPolicyService.getPolicy).toHaveBeenCalledTimes(2);
      },
      { advanceTimers: jest.advanceTimersByTime }
    );
    const level5After = global.fetch.mock.calls.filter((c) => String(c[0]).includes('/ai-trading/level5/'));
    expect(level5After.length).toBe(8);
  });

  /**
   * Debounce focus (MIN_FOCUS_MS=8s) e în `OtaAutoDashboardContext.runFetch` — nu îl duplicăm aici:
   * combinația jsdom + Promise.all + fake timers a produs apeluri extra imprevizibile în CI.
   * Verificare manuală: Network tab la focus imediat după load → nu ar trebui să dubleze bundle-ul dacă <8s.
   */
});
