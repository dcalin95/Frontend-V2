/**
 * @jest-environment node
 */

import {
  sortFuturesSymbolKeysForProbeUi,
  pickDefaultAnalyzeTokenFromAllowlist,
  futuresSymbolKeyToBase,
} from '../otaFuturesAnalyzeAllowlistDefault';

describe('otaFuturesAnalyzeAllowlistDefault', () => {
  it('sortFuturesSymbolKeysForProbeUi pune BTC înaintea ADA (nu alfabetic brut)', () => {
    const out = sortFuturesSymbolKeysForProbeUi(['ADAUSDT', 'BTCUSDT', 'ATOMUSDT']);
    expect(out[0]).toBe('BTCUSDT');
    expect(out).toContain('ADAUSDT');
  });

  it('pickDefaultAnalyzeTokenFromAllowlist alege majorul lichid din allowlist', () => {
    expect(pickDefaultAnalyzeTokenFromAllowlist(['ADAUSDT', 'ETHUSDT'])).toBe('ETHUSDT');
    expect(pickDefaultAnalyzeTokenFromAllowlist(['ADA'])).toBe('ADA');
  });

  it('futuresSymbolKeyToBase normalizează sufixe', () => {
    expect(futuresSymbolKeyToBase('BTCUSDT')).toBe('BTC');
    expect(futuresSymbolKeyToBase('ADA')).toBe('ADA');
  });
});
