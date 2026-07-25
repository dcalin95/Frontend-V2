/**
 * @jest-environment jsdom
 */
jest.mock('../../../config/runtimeConfig.js', () => ({
  ...jest.requireActual('../../../config/runtimeConfig.js'),
  loadRuntimeConfig: jest.fn(async () => ({})),
}));

import * as apiEndpoints from '../../../config/apiEndpoints.js';
import * as otaWalletSession from '../otaWalletSession';
import { otaApiRequest, __resetOtaWalletClearNotifyThrottleForTests } from '../otaApiClient';

describe('otaApiRequest — retry după 401 OTA wallet', () => {
  let getApiSpy;
  let backendSpy;
  let waitSpy;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    __resetOtaWalletClearNotifyThrottleForTests();
    jest.clearAllMocks();
    getApiSpy = jest.spyOn(apiEndpoints, 'getApiBaseUrl').mockReturnValue('https://api.example.com/api');
    backendSpy = jest.spyOn(apiEndpoints, 'getBackendUrl').mockReturnValue('https://api.example.com');
    waitSpy = jest.spyOn(otaWalletSession, 'waitForOtaWalletSessionRefresh').mockImplementation(async () => {
      otaWalletSession.setOtaWalletAuthToken('otaw_after_refresh', '0x6666666666666666666666666666666666666666');
    });
  });

  afterEach(() => {
    getApiSpy.mockRestore();
    backendSpy.mockRestore();
    waitSpy.mockRestore();
  });

  it('pe GET cu OTA_WALLET_TOKEN_INVALID: nu retriggerează MetaMask din poll și nu reîncearcă automat', async () => {
    otaWalletSession.setOtaWalletAuthToken('otaw_stale', '0x7777777777777777777777777777777777777777');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          code: 'OTA_WALLET_TOKEN_INVALID',
          error: 'Invalid',
        }),
      }),
    );

    await expect(
      otaApiRequest('/ai-trading/analytics/closed-profit-usd', { method: 'GET' }),
    ).rejects.toThrow();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(waitSpy).not.toHaveBeenCalled();
  });

  it('pe POST cu OTA_WALLET_TOKEN_INVALID: șterge sesiunea, așteaptă refresh și reîncearcă o dată cu succes', async () => {
    otaWalletSession.setOtaWalletAuthToken('otaw_stale', '0x7777777777777777777777777777777777777777');

    let call = 0;
    global.fetch = jest.fn(() => {
      call += 1;
      if (call === 1) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({
            success: false,
            code: 'OTA_WALLET_TOKEN_INVALID',
            error: 'Invalid',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, profitUsd: 1 }),
      });
    });

    const data = await otaApiRequest('/ai-trading/analytics/closed-profit-usd', { method: 'POST', body: '{}' });
    expect(data.ok).toBe(true);
    expect(data.profitUsd).toBe(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(waitSpy).toHaveBeenCalled();
  });

  it('pe GET cu reauth explicit: curăță Bearer-ul vechi și reîncearcă prin cookie/session fără MetaMask', async () => {
    otaWalletSession.setOtaWalletAuthToken('otaw_stale', '0x7777777777777777777777777777777777777777');

    let call = 0;
    global.fetch = jest.fn(() => {
      call += 1;
      if (call === 1) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({
            success: false,
            code: 'OTA_WALLET_IDENTITY_MISMATCH',
            error: 'Mismatch',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });
    });

    const data = await otaApiRequest('/ai-trading/analytics/closed-profit-usd', {
      method: 'GET',
      allowOtaWalletReauthOnGet401: true,
    });
    expect(data.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(waitSpy).not.toHaveBeenCalled();
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer otaw_stale');
    expect(global.fetch.mock.calls[1][1].headers.Authorization).toBeUndefined();
  });

  it('pe GET cu token lipsă/invalid explicit: așteaptă refresh OTA, apoi reîncearcă cu Bearer nou', async () => {
    otaWalletSession.clearOtaWalletSession();

    let call = 0;
    global.fetch = jest.fn(() => {
      call += 1;
      if (call === 1) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({
            success: false,
            code: 'OTA_WALLET_AUTH_REQUIRED',
            error: 'Missing',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });
    });

    const data = await otaApiRequest('/ai-trading/signals?userId=0x6666666666666666666666666666666666666666', {
      method: 'GET',
      allowOtaWalletReauthOnGet401: true,
    });
    expect(data.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(waitSpy).toHaveBeenCalled();
    expect(global.fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer otaw_after_refresh');
  });

  it('nu intră în retry pe rute /auth/evm/session', async () => {
    otaWalletSession.clearOtaWalletSession();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({ code: 'OTA_WALLET_TOKEN_INVALID' }),
      }),
    );

    await expect(
      otaApiRequest('/ai-trading/auth/evm/session', { method: 'GET' }),
    ).rejects.toThrow();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(waitSpy).not.toHaveBeenCalled();
  });

  it('cu suppressOtaWalletSessionClearOn401: nu șterge sesiunea și nu așteaptă refresh la 401', async () => {
    otaWalletSession.setOtaWalletAuthToken('otaw_stale', '0x7777777777777777777777777777777777777777');
    const clearSpy = jest.spyOn(otaWalletSession, 'clearOtaWalletSession');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          code: 'OTA_WALLET_TOKEN_INVALID',
          error: 'Invalid',
        }),
      }),
    );

    await expect(
      otaApiRequest('/ai-trading/policy/get', {
        method: 'GET',
        suppressOtaWalletSessionClearOn401: true,
      }),
    ).rejects.toThrow();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(waitSpy).not.toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('la al doilea 401 OTA imediat pe POST: nu repetă lanțul clear+wait (cooldown 2 min)', async () => {
    otaWalletSession.setOtaWalletAuthToken('otaw_stale', '0x7777777777777777777777777777777777777777');
    let call = 0;
    global.fetch = jest.fn(() => {
      call += 1;
      return Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          code: 'OTA_WALLET_TOKEN_INVALID',
          error: 'Invalid',
        }),
      });
    });

    await expect(otaApiRequest('/ai-trading/foo', { method: 'POST', body: '{}' })).rejects.toThrow();
    await expect(otaApiRequest('/ai-trading/bar', { method: 'POST', body: '{}' })).rejects.toThrow();
    expect(waitSpy).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('cu omitOtaWalletBearer: nu trimite Authorization chiar dacă există token în sessionStorage', async () => {
    otaWalletSession.setOtaWalletAuthToken('otaw_xyz', '0x8888888888888888888888888888888888888888');
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      }),
    );

    await otaApiRequest('/ai-trading/policy/get', { method: 'GET', omitOtaWalletBearer: true });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.stringMatching(/^Bearer /),
        }),
      }),
    );
  });

  it('atașează responseBody și billing pe error pentru 402 billing required', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 402,
        json: async () => ({
          success: false,
          code: 'OTA_LLM_BILLING_CREDIT_REQUIRED',
          error: 'Separate OpenAI credit required.',
          billing: { trialCreditUsd: 5, spentCreditUsd: 5, availableCreditUsd: 0 },
        }),
      }),
    );

    await expect(otaApiRequest('/ai-trading/analyze', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      code: 'OTA_LLM_BILLING_CREDIT_REQUIRED',
      billing: expect.objectContaining({ availableCreditUsd: 0 }),
      responseBody: expect.objectContaining({
        error: 'Separate OpenAI credit required.',
      }),
    });
  });
});
