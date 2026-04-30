/**
 * Fallback Stooq pentru ETF/acțiuni US când Yahoo nu răspunde (ex. CORS).
 */
jest.mock('../../config/apiEndpoints.js', () => ({
  getBackendUrl: () => 'http://127.0.0.1:65530',
}));

describe('fetchCFDLivePrice — Stooq fallback (US equities)', () => {
  const MSFT_ASSET_ID = 21;

  beforeEach(() => {
    jest.resetModules();
  });

  test('folosește Close din CSV Stooq când Yahoo eșuează', async () => {
    global.fetch = jest.fn((url) => {
      const u = String(url);
      if (u.includes('finance.yahoo.com')) {
        return Promise.resolve({ ok: false, status: 403 });
      }
      if (u.includes('stooq.com')) {
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              'Symbol,Date,Time,Open,High,Low,Close,Volume\nMSFT.US,2026-04-10,22:00:18,372.98,375.64,370.03,370.87,28111128'
            ),
        });
      }
      return Promise.reject(new Error(`unexpected fetch url: ${u}`));
    });

    const { fetchCFDLivePrice } = await import('../services/cfdPriceService');
    const price = await fetchCFDLivePrice(MSFT_ASSET_ID, null);
    expect(price).toBe(370.87);
    expect(global.fetch).toHaveBeenCalled();
    const calls = global.fetch.mock.calls.map((c) => String(c[0]));
    expect(calls.some((x) => x.includes('finance.yahoo.com'))).toBe(true);
    expect(calls.some((x) => x.includes('stooq.com'))).toBe(true);
  });

  test('folosește GET /price/cfd-us-equity pe backend când Stooq direct eșuează', async () => {
    global.fetch = jest.fn((url) => {
      const u = String(url);
      if (u.includes('finance.yahoo.com')) return Promise.resolve({ ok: false, status: 403 });
      if (u.includes('stooq.com')) return Promise.resolve({ ok: false, status: 500 });
      if (u.includes('/api/dex/v1/price/cfd-us-equity') && u.includes('symbol=MSFT')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, price: 401.25, source: 'stooq' }),
        });
      }
      return Promise.reject(new Error(`unexpected fetch url: ${u}`));
    });

    const { fetchCFDLivePrice } = await import('../services/cfdPriceService');
    const price = await fetchCFDLivePrice(MSFT_ASSET_ID, null);
    expect(price).toBe(401.25);
    const calls = global.fetch.mock.calls.map((c) => String(c[0]));
    expect(calls.some((x) => x.includes('/api/dex/v1/price/cfd-us-equity'))).toBe(true);
  });
});
