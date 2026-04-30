import {
  parseCfdAssetQueryParam,
  getRawCfdInstrumentQuery,
  normalizeCfdAssetId,
  getCfdDomainIdForAssetId,
  CFD_SYMBOLS,
} from '../constants/leverageConstants';

function mockParams(obj) {
  const sp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v != null) sp.set(k, v);
  });
  return sp;
}

describe('getRawCfdInstrumentQuery', () => {
  test('preferă cfd față de ctd', () => {
    const sp = mockParams({ cfd: '2', ctd: '3' });
    expect(getRawCfdInstrumentQuery(sp)).toBe('2');
  });

  test('folosește ctd dacă lipsește cfd', () => {
    const sp = mockParams({ ctd: '3' });
    expect(getRawCfdInstrumentQuery(sp)).toBe('3');
  });
});

describe('parseCfdAssetQueryParam', () => {
  test('null/empty → null', () => {
    expect(parseCfdAssetQueryParam(null)).toBe(null);
    expect(parseCfdAssetQueryParam('')).toBe(null);
    expect(parseCfdAssetQueryParam('   ')).toBe(null);
  });

  test('numeric index range', () => {
    expect(parseCfdAssetQueryParam('0')).toBe(0);
    expect(parseCfdAssetQueryParam('7')).toBe(7);
    expect(parseCfdAssetQueryParam('3')).toBe(3);
    expect(parseCfdAssetQueryParam('11')).toBe(11);
    expect(parseCfdAssetQueryParam('8')).toBe(8);
    expect(parseCfdAssetQueryParam('14')).toBe(14);
    expect(parseCfdAssetQueryParam('26')).toBe(26);
  });

  test('invalid number → null', () => {
    expect(parseCfdAssetQueryParam(String(CFD_SYMBOLS.length))).toBe(null);
    expect(parseCfdAssetQueryParam('-1')).toBe(null);
    expect(parseCfdAssetQueryParam('3.5')).toBe(null);
  });

  test('symbols', () => {
    expect(parseCfdAssetQueryParam('BTC')).toBe(0);
    expect(parseCfdAssetQueryParam('xau')).toBe(2);
    expect(parseCfdAssetQueryParam('SOL')).toBe(7);
    expect(parseCfdAssetQueryParam('XRP')).toBe(8);
    expect(parseCfdAssetQueryParam('DOGE')).toBe(9);
    expect(parseCfdAssetQueryParam('EURUSD')).toBe(CFD_SYMBOLS.indexOf('EURUSD'));
    expect(parseCfdAssetQueryParam('EUR/USD')).toBe(CFD_SYMBOLS.indexOf('EURUSD'));
    expect(parseCfdAssetQueryParam('SP500')).toBe(CFD_SYMBOLS.indexOf('SPY'));
    expect(parseCfdAssetQueryParam('US100')).toBe(CFD_SYMBOLS.indexOf('QQQ'));
    expect(parseCfdAssetQueryParam('NOPE')).toBe(null);
  });
});

describe('normalizeCfdAssetId', () => {
  test('păstrează forex și equity (nu mai clampa la 7 = SOL)', () => {
    expect(normalizeCfdAssetId(14)).toBe(CFD_SYMBOLS.indexOf('EURUSD'));
    expect(normalizeCfdAssetId(26)).toBe(26);
  });
  test('clamp la interval 0…MAX', () => {
    expect(normalizeCfdAssetId(-3)).toBe(0);
    expect(normalizeCfdAssetId(999)).toBe(CFD_SYMBOLS.length - 1);
  });
});

describe('getCfdDomainIdForAssetId', () => {
  test('mapează corect domeniul', () => {
    expect(getCfdDomainIdForAssetId(14)).toBe('forex');
    expect(getCfdDomainIdForAssetId(7)).toBe('crypto');
    expect(getCfdDomainIdForAssetId(2)).toBe('commodities');
    expect(getCfdDomainIdForAssetId(12)).toBe('indices');
    expect(getCfdDomainIdForAssetId(22)).toBe('equities');
  });
});
