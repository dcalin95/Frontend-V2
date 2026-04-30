import {
  buildLongHighConfidenceNoOpenEvidence,
  buildShortHighConfidenceNoOpenEvidence,
  findOpenPositionForSymbolKeys,
  otaSymbolKeysForMatch,
} from '../otaLongSignalNoOpenEvidence';

describe('otaLongSignalNoOpenEvidence', () => {
  const baseSig = {
    token: 'ADA',
    signal: 'buy',
    confidence: 0.71,
    created_at: '2026-04-09T10:00:00.000Z',
  };

  it('otaSymbolKeysForMatch acoperă USDT', () => {
    expect(otaSymbolKeysForMatch('ADA').sort()).toEqual(['ADA', 'ADAUSDT'].sort());
  });

  it('nu afișează când confidence sub prag', () => {
    const r = buildLongHighConfidenceNoOpenEvidence({
      sig: baseSig,
      symKey: 'ADA',
      confidence: 0.5,
      openMin: 0.65,
      longOpenThresholdApplies: true,
      openForSym: null,
      liveStatus: { gate: { safeToExecuteLive: true } },
      positions: [],
      executorDecisions: [],
      rejections: [],
      longFeedTokenBlocks: [],
      longFeedSuspendSymbols: new Set(),
      rejectionMatchUserId: 'u1',
      executorMatchUserId: 'u1',
    });
    expect(r.show).toBe(false);
  });

  it('include respingere când există rând în fereastră', () => {
    const r = buildLongHighConfidenceNoOpenEvidence({
      sig: baseSig,
      symKey: 'ADA',
      confidence: 0.71,
      openMin: 0.65,
      longOpenThresholdApplies: true,
      openForSym: null,
      liveStatus: { gate: { safeToExecuteLive: true }, config: {} },
      positions: [],
      executorDecisions: [],
      rejections: [
        {
          user_id: 'u1',
          symbol: 'ADAUSDT',
          reason_code: 'MIN_CONF_POLICY',
          reason_detail: 'minConfidenceToOpen=0.72',
          created_at: '2026-04-09T10:05:00.000Z',
        },
      ],
      longFeedTokenBlocks: [],
      longFeedSuspendSymbols: new Set(),
      rejectionMatchUserId: 'u1',
      executorMatchUserId: 'u1',
    });
    expect(r.show).toBe(true);
    const rej = r.lines.find((l) => l.id === 'rejection');
    expect(rej).toBeTruthy();
    expect(rej.body).toContain('MIN_CONF_POLICY');
    expect(rej.body).toContain('0.72');
  });

  it('live gate OFF adaugă linie cu reasonIfBlocked', () => {
    const r = buildLongHighConfidenceNoOpenEvidence({
      sig: baseSig,
      symKey: 'ADA',
      confidence: 0.71,
      openMin: 0.65,
      longOpenThresholdApplies: true,
      openForSym: null,
      liveStatus: {
        gate: { safeToExecuteLive: false, reasonIfBlocked: 'vault_balance_unreadable' },
        config: {},
      },
      positions: [],
      executorDecisions: [],
      rejections: [],
      longFeedTokenBlocks: [],
      longFeedSuspendSymbols: new Set(),
      rejectionMatchUserId: 'u1',
      executorMatchUserId: 'u1',
    });
    const g = r.lines.find((l) => l.id === 'live-gate');
    expect(g.body).toContain('vault_balance_unreadable');
  });

  it('findOpenPositionForSymbolKeys potrivește ADA cu ADAUSDT', () => {
    const p = findOpenPositionForSymbolKeys(
      [{ symbol: 'ADAUSDT', status: 'open', notional_usd: 10, leverage: 5 }],
      'ADA'
    );
    expect(p).toBeTruthy();
    expect(p.symbol).toBe('ADAUSDT');
  });

  it('nu listează respingere doar în afara ferestrei (evită confuzie sub chenarul conf. ≥ prag)', () => {
    const r = buildLongHighConfidenceNoOpenEvidence({
      sig: {
        token: 'LINK',
        signal: 'buy',
        confidence: 0.7,
        created_at: '2026-04-09T17:48:52.000Z',
      },
      symKey: 'LINK',
      confidence: 0.7,
      openMin: 0.65,
      longOpenThresholdApplies: true,
      openForSym: null,
      liveStatus: { gate: { safeToExecuteLive: true }, config: {} },
      positions: [],
      executorDecisions: [],
      rejections: [
        {
          user_id: 'u1',
          symbol: 'LINKUSDT',
          reason_code: 'OLD_POLICY',
          reason_detail: 'înainte de această analiză',
          created_at: '2026-04-09T09:00:00.000Z',
        },
      ],
      longFeedTokenBlocks: [],
      longFeedSuspendSymbols: new Set(),
      rejectionMatchUserId: 'u1',
      executorMatchUserId: 'u1',
    });
    expect(r.show).toBe(true);
    expect(r.lines.find((l) => l.id === 'rejection-outside-correlation-window')).toBeFalsy();
    const nr = r.lines.find((l) => l.id === 'no-rows');
    expect(nr).toBeTruthy();
    expect(nr.body).not.toContain('OLD_POLICY');
  });

  it('titlu no-rows nu mai spune „Nicio dovadă” generic', () => {
    const r = buildLongHighConfidenceNoOpenEvidence({
      sig: baseSig,
      symKey: 'ADA',
      confidence: 0.71,
      openMin: 0.65,
      longOpenThresholdApplies: true,
      openForSym: null,
      liveStatus: { gate: { safeToExecuteLive: true }, config: {} },
      positions: [],
      executorDecisions: [],
      rejections: [],
      longFeedTokenBlocks: [],
      longFeedSuspendSymbols: new Set(),
      rejectionMatchUserId: 'u1',
      executorMatchUserId: 'u1',
    });
    const nr = r.lines.find((l) => l.id === 'no-rows');
    expect(nr).toBeTruthy();
    expect(nr.title).toContain('executor log');
    expect(nr.body).toContain('does not mean');
  });

  it('SHORT: include respingere cu același model', () => {
    const r = buildShortHighConfidenceNoOpenEvidence({
      sig: {
        token: 'SOL',
        signal: 'sell',
        confidence: 0.72,
        created_at: '2026-04-09T10:00:00.000Z',
      },
      symKey: 'SOL',
      confidence: 0.72,
      openMin: 0.65,
      shortOpenThresholdApplies: true,
      openForSym: null,
      liveStatus: { gate: { safeToExecuteLive: true }, config: {} },
      positions: [],
      executorDecisions: [],
      rejections: [
        {
          user_id: 'u1',
          symbol: 'SOL',
          reason_code: 'SHORT_VENUE',
          reason_detail: 'min notional',
          created_at: '2026-04-09T10:04:00.000Z',
        },
      ],
      shortFeedTokenBlocks: [],
      shortFeedSuspendSymbols: new Set(),
      rejectionMatchUserId: 'u1',
      executorMatchUserId: 'u1',
    });
    expect(r.show).toBe(true);
    expect(r.boxLead).toContain('SHORT');
    const rej = r.lines.find((l) => l.id === 'rejection');
    expect(rej.citation).toContain('short/rejections');
  });
});
