import {
  readOtaSignalsListCache,
  writeOtaSignalsListCache,
  clearOtaSignalsListCacheForTests,
  OTA_SIGNALS_LIST_CLIENT_CACHE_TTL_MS,
} from '../otaSignalsListClientCache';

describe('otaSignalsListClientCache', () => {
  beforeEach(() => {
    clearOtaSignalsListCacheForTests();
  });

  it('returns null on miss', () => {
    expect(readOtaSignalsListCache('0xabc', { limit: 10, tradeContext: 'common' })).toBeNull();
  });

  it('returns hit within TTL', () => {
    const payload = { signals: [{ id: '1' }], success: true };
    writeOtaSignalsListCache('test-user-cache', { limit: 10, tradeContext: 'common' }, payload);
    const got = readOtaSignalsListCache('test-user-cache', {
      limit: 10,
      tradeContext: 'common',
    });
    expect(got).toEqual(payload);
  });

  it('expires after TTL', () => {
    jest.useFakeTimers();
    const payload = { signals: [], success: true };
    writeOtaSignalsListCache('u1', { limit: 5, tradeContext: 'long_spot' }, payload);
    jest.advanceTimersByTime(OTA_SIGNALS_LIST_CLIENT_CACHE_TTL_MS + 2);
    expect(readOtaSignalsListCache('u1', { limit: 5, tradeContext: 'long_spot' })).toBeNull();
    jest.useRealTimers();
  });
});
