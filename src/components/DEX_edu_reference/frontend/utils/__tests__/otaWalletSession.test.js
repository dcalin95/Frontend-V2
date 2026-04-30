/**
 * @jest-environment jsdom
 */
import * as apiEndpoints from '../../../config/apiEndpoints.js';
import { getAuthStatus } from '../../services/authApiService';
import {
  clearOtaWalletSession,
  ensureEvmOtaWalletSession,
  ensureOtaWalletForApiIfNeeded,
  isDexWalletSessionActiveForAddress,
  validateCachedOtaWalletSession,
  setOtaWalletAuthToken,
  getOtaWalletAuthToken,
  OTA_SESSION_REFRESH_EVENT,
  waitForOtaWalletSessionRefresh,
} from '../otaWalletSession';

jest.mock('../../services/authApiService', () => ({
  getAuthStatus: jest.fn(),
}));

describe('otaWalletSession', () => {
  let getApiBaseUrlSpy;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearOtaWalletSession();
    jest.clearAllMocks();
    global.fetch = jest.fn();
    getAuthStatus.mockResolvedValue({ authenticated: false, success: false });
    getApiBaseUrlSpy = jest.spyOn(apiEndpoints, 'getApiBaseUrl').mockReturnValue('https://api.example.com/api');
  });

  afterEach(() => {
    getApiBaseUrlSpy.mockRestore();
  });

  it('validateCachedOtaWalletSession returnează false fără token', async () => {
    expect(await validateCachedOtaWalletSession()).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('validateCachedOtaWalletSession returnează true când GET session răspunde ok', async () => {
    setOtaWalletAuthToken('otaw_abc', '0x1111111111111111111111111111111111111111');
    global.fetch.mockResolvedValueOnce({ ok: true, status: 200 });
    const ok = await validateCachedOtaWalletSession();
    expect(ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/ai-trading/auth/evm/session',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer otaw_abc' },
      }),
    );
  });

  it('validateCachedOtaWalletSession returnează false la 200 dacă wallet din sesiune nu coincide cu așteptatul', async () => {
    setOtaWalletAuthToken('otaw_abc', '0x1111111111111111111111111111111111111111');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ walletAddress: '0x2222222222222222222222222222222222222222' }),
    });
    const ok = await validateCachedOtaWalletSession('0x1111111111111111111111111111111111111111');
    expect(ok).toBe(false);
  });

  it('validateCachedOtaWalletSession returnează false la 401 după reîncercări', async () => {
    setOtaWalletAuthToken('otaw_dead', '0x2222222222222222222222222222222222222222');
    global.fetch.mockResolvedValue({ ok: false, status: 401 });
    expect(await validateCachedOtaWalletSession()).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('validateCachedOtaWalletSession reușește dacă un retry primește 200 după 401', async () => {
    setOtaWalletAuthToken('otaw_retry', '0x3333333333333333333333333333333333333333');
    global.fetch
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const ok = await validateCachedOtaWalletSession();
    expect(ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('validateCachedOtaWalletSession folosește cache scurt după succes (fără al doilea fetch imediat)', async () => {
    setOtaWalletAuthToken('otaw_cached_probe', '0x4444444444444444444444444444444444444444');
    global.fetch.mockResolvedValueOnce({ ok: true, status: 200 });
    await validateCachedOtaWalletSession();
    await validateCachedOtaWalletSession();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('migrează tokenul vechi din sessionStorage în localStorage pentru a evita semnături repetate pe tab nou', () => {
    sessionStorage.setItem('bits_ota_wallet_session_token_v1', 'otaw_session_only');
    sessionStorage.setItem('bits_ota_wallet_session_addr_v1', '0x1212121212121212121212121212121212121212');

    expect(getOtaWalletAuthToken()).toBe('otaw_session_only');
    expect(localStorage.getItem('bits_ota_wallet_session_token_v1')).toBe('otaw_session_only');
    expect(sessionStorage.getItem('bits_ota_wallet_session_token_v1')).toBeNull();
  });

  it('validateCachedOtaWalletSession returnează null la 500 ca să nu forțeze re-auth inutil', async () => {
    setOtaWalletAuthToken('otaw_maybe_valid', '0x2323232323232323232323232323232323232323');
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    expect(await validateCachedOtaWalletSession()).toBeNull();
  });

  it('ensureEvmOtaWalletSession păstrează tokenul existent când probe-ul de sesiune e neconcludent', async () => {
    const signer = {
      getAddress: jest.fn().mockResolvedValue('0x2424242424242424242424242424242424242424'),
      signMessage: jest.fn().mockResolvedValue('0xshould_not_be_used'),
    };
    setOtaWalletAuthToken('otaw_cached', '0x2424242424242424242424242424242424242424');
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const token = await ensureEvmOtaWalletSession(signer);

    expect(token).toBe('otaw_cached');
    expect(signer.signMessage).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('ensureEvmOtaWalletSession nu cere semnătură când lipsea ADDR_KEY dar tokenul e valid pentru același wallet', async () => {
    localStorage.setItem('bits_ota_wallet_session_token_v1', 'otaw_ok');
    const addr = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const signer = {
      getAddress: jest.fn().mockResolvedValue(addr),
      signMessage: jest.fn(),
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        walletAddress: addr,
      }),
    });

    const token = await ensureEvmOtaWalletSession(signer);

    expect(token).toBe('otaw_ok');
    expect(signer.signMessage).not.toHaveBeenCalled();
    expect(localStorage.getItem('bits_ota_wallet_session_addr_v1')).toBe(String(addr).toLowerCase());
  });

  it('waitForOtaWalletSessionRefresh se rezolvă când apare token (polling)', async () => {
    const p = waitForOtaWalletSessionRefresh(3000);
    setTimeout(() => {
      setOtaWalletAuthToken('otaw_new', '0x3333333333333333333333333333333333333333');
    }, 50);
    await expect(p).resolves.toBeUndefined();
  });

  it('waitForOtaWalletSessionRefresh se rezolvă la evenimentul OTA_SESSION_REFRESH_EVENT', async () => {
    const p = waitForOtaWalletSessionRefresh(3000);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(OTA_SESSION_REFRESH_EVENT));
      setOtaWalletAuthToken('otaw_evt', '0x4444444444444444444444444444444444444444');
    }, 20);
    await expect(p).resolves.toBeUndefined();
  });

  it('ensureEvmOtaWalletSession cu skipIfDexSessionAligned păstrează tokenul valid (nu șterge la fiecare apel)', async () => {
    const addr = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const signer = {
      getAddress: jest.fn().mockResolvedValue(addr),
      signMessage: jest.fn(),
    };
    setOtaWalletAuthToken('otaw_dex_aligned', addr);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, walletAddress: addr }),
    });
    const out = await ensureEvmOtaWalletSession(signer, { skipIfDexSessionAligned: true });
    expect(out).toBeNull();
    expect(signer.signMessage).not.toHaveBeenCalled();
    expect(localStorage.getItem('bits_ota_wallet_session_token_v1')).toBe('otaw_dex_aligned');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('clearOtaWalletSession șterge cheile', () => {
    setOtaWalletAuthToken('otaw_x', '0x5555555555555555555555555555555555555555');
    clearOtaWalletSession();
    expect(localStorage.getItem('bits_ota_wallet_session_token_v1')).toBeNull();
  });

  it('ensureEvmOtaWalletSession dedupează apelurile paralele și cere o singură semnătură', async () => {
    const signer = {
      getAddress: jest.fn().mockResolvedValue('0x6666666666666666666666666666666666666666'),
      signMessage: jest.fn().mockResolvedValue('0xsigned'),
    };
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          challengeId: 'challenge-1',
          message: 'Bits OTA wallet authentication',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'otaw_new' }),
      });

    const [tokenA, tokenB] = await Promise.all([
      ensureEvmOtaWalletSession(signer),
      ensureEvmOtaWalletSession(signer),
    ]);

    expect(tokenA).toBe('otaw_new');
    expect(tokenB).toBe('otaw_new');
    expect(signer.signMessage).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('bits_ota_wallet_session_token_v1')).toBe('otaw_new');
  });

  it('isDexWalletSessionActiveForAddress e true când associatedWalletAddress coincide', async () => {
    const addr = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    getAuthStatus.mockResolvedValueOnce({
      success: true,
      user: { associatedWalletAddress: addr },
    });
    await expect(isDexWalletSessionActiveForAddress(addr)).resolves.toBe(true);
  });

  it('isDexWalletSessionActiveForAddress e true când walletAddress e la rădăcină', async () => {
    const addr = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    getAuthStatus.mockResolvedValueOnce({
      authenticated: true,
      walletAddress: addr,
    });
    await expect(isDexWalletSessionActiveForAddress(addr)).resolves.toBe(true);
  });

  it('isDexWalletSessionActiveForAddress e false fără autentificare', async () => {
    getAuthStatus.mockResolvedValueOnce({ user: { walletAddress: '0xcccccccccccccccccccccccccccccccccccccccc' } });
    await expect(isDexWalletSessionActiveForAddress('0xdddddddddddddddddddddddddddddddddddddddd')).resolves.toBe(false);
  });

  it('ensureEvmOtaWalletSession așteaptă sesiunea altui tab când există lock activ pe aceeași adresă', async () => {
    const signer = {
      getAddress: jest.fn().mockResolvedValue('0x7777777777777777777777777777777777777777'),
      signMessage: jest.fn().mockResolvedValue('0xshould_not_be_used'),
    };
    localStorage.setItem(
      'bits_ota_wallet_session_lock_v1',
      JSON.stringify({
        owner: 'other-tab',
        address: '0x7777777777777777777777777777777777777777',
        expiresAt: Date.now() + 60000,
      }),
    );

    global.fetch.mockImplementation(async (url) => {
      if (String(url).includes('/auth/evm/session')) {
        return { ok: true, status: 200 };
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    setTimeout(() => {
      setOtaWalletAuthToken('otaw_from_other_tab', '0x7777777777777777777777777777777777777777');
      window.dispatchEvent(new CustomEvent(OTA_SESSION_REFRESH_EVENT));
    }, 20);

    const token = await ensureEvmOtaWalletSession(signer);

    expect(token).toBe('otaw_from_other_tab');
    expect(signer.signMessage).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('ensureOtaWalletForApiIfNeeded nu cere semnătură când sesiunea OTA e validă pentru wallet', async () => {
    const addr = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    setOtaWalletAuthToken('otaw_ok', addr);
    global.fetch.mockResolvedValueOnce({ ok: true, status: 200 });
    const signer = {
      getAddress: jest.fn().mockResolvedValue(addr),
      signMessage: jest.fn(),
    };
    await ensureOtaWalletForApiIfNeeded(signer, addr);
    expect(signer.signMessage).not.toHaveBeenCalled();
  });

  it('ensureOtaWalletForApiIfNeeded cere challenge+semnătură când sesiunea DEX e activă dar lipsește otaw', async () => {
    const addr = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
    getAuthStatus.mockResolvedValue({ authenticated: true, success: true, walletAddress: addr });
    const signer = {
      getAddress: jest.fn().mockResolvedValue(addr),
      signMessage: jest.fn().mockResolvedValue('0xsig'),
    };
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'sign me', challengeId: 'ch1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'otaw_new' }),
      });
    await ensureOtaWalletForApiIfNeeded(signer, addr);
    expect(signer.signMessage).toHaveBeenCalledWith('sign me');
    expect(global.fetch).toHaveBeenCalled();
  });
});
