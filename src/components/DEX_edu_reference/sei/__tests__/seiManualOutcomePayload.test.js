import { buildSeiRoundTripManualOutcomePayload } from '../utils/seiManualOutcomePayload';

describe('buildSeiRoundTripManualOutcomePayload', () => {
  it('pair tracks effectivePair when selection changes', () => {
    const a = buildSeiRoundTripManualOutcomePayload({
      userId: 'u1',
      effectivePair: 'SEI/USDC',
      base: 'SEI',
      quote: 'USDC',
      amountSei: '2',
      txHash: '0xabc',
    });
    expect(a.pair).toBe('SEI/USDC');

    const b = buildSeiRoundTripManualOutcomePayload({
      userId: 'u1',
      effectivePair: 'SEI/USDT',
      base: 'SEI',
      quote: 'USDT',
      amountSei: '1',
      txHash: '0xdef',
    });
    expect(b.pair).toBe('SEI/USDT');
  });

  it('normalizes sei-usdc style to SEI/USDC', () => {
    const p = buildSeiRoundTripManualOutcomePayload({
      userId: 'u',
      effectivePair: 'sei-usdc',
      base: 'SEI',
      quote: 'USDC',
      amountSei: '1',
      txHash: '0x1',
    });
    expect(p.pair).toBe('SEI/USDC');
    expect(p.outcomeBase).toBe('SEI');
    expect(p.outcomeQuote).toBe('USDC');
  });

  it('omits pair when pair not in allowlist', () => {
    const p = buildSeiRoundTripManualOutcomePayload({
      userId: 'u',
      effectivePair: 'SEI/FAKE',
      base: 'SEI',
      quote: 'FAKE',
      amountSei: '1',
      txHash: '0x1',
    });
    expect(p.pair).toBeUndefined();
    expect(p.outcomeBase).toBe('SEI');
    expect(p.outcomeQuote).toBe('FAKE');
  });
});
