import {
  dedupeOtaSignalsForFeed,
  filterSignalsForLongFuturesFeed,
  filterSignalsForShortFuturesFeed,
  mergeTwoOtaSignalLists,
  otaSignalIsLongDirection,
  otaSignalIsShortDirection,
  signalRowBaseToken,
  signalRowIsLongFuturesAnalysis,
  signalRowIsLongPanelFeed,
  signalRowIsLongRelevantShortContext,
  signalRowIsShortFuturesAnalysis,
  signalRowIsShortPanelFeed,
  signalRowIsShortRelevantLongContext,
} from '../otaFuturesSignalContext';

describe('otaFuturesSignalContext — signalRowBaseToken', () => {
  it('reduce symbol pereche ETHUSDT → ETH (allowlist)', () => {
    expect(signalRowBaseToken({ symbol: 'ETHUSDT', tradeContext: 'common' })).toBe('ETH');
    expect(signalRowBaseToken({ symbol: 'BTC-USDT' })).toBe('BTC');
  });

  it('păstrează baza scurtă când nu e suffix quote', () => {
    expect(signalRowBaseToken({ token: 'SOL' })).toBe('SOL');
  });
});

describe('otaFuturesSignalContext — direcție LONG/SHORT', () => {
  it('otaSignalIsLongDirection: open_long, swap, open_buy (buy e filtrat separat din feed SHORT)', () => {
    expect(otaSignalIsLongDirection({ signal: 'buy' })).toBe(false);
    expect(otaSignalIsLongDirection({ signal: 'open_long' })).toBe(true);
    expect(otaSignalIsLongDirection({ signal: 'swap' })).toBe(true);
    expect(otaSignalIsLongDirection({ signal: 'open_buy' })).toBe(true);
    expect(otaSignalIsLongDirection({ signal: 'sell' })).toBe(false);
    expect(otaSignalIsLongDirection({ signal: 'hold' })).toBe(false);
  });

  it('otaSignalIsShortDirection: sell, open_short, close_short*', () => {
    expect(otaSignalIsShortDirection({ signal: 'sell' })).toBe(true);
    expect(otaSignalIsShortDirection({ signal: 'open_short' })).toBe(true);
    expect(otaSignalIsShortDirection({ signal: 'close_short' })).toBe(true);
    expect(otaSignalIsShortDirection({ signal: 'close_short_futures' })).toBe(true);
    expect(otaSignalIsShortDirection({ signal: 'buy' })).toBe(false);
  });
});

describe('otaFuturesSignalContext — feed SHORT', () => {
  it('signalRowIsShortFuturesAnalysis: doar short_live', () => {
    expect(signalRowIsShortFuturesAnalysis({ tradeContext: 'short_live' })).toBe(true);
    expect(signalRowIsShortFuturesAnalysis({ tradeContext: 'common' })).toBe(false);
  });

  it('signalRowIsShortPanelFeed: short_* sau common cu semnal SHORT', () => {
    expect(signalRowIsShortPanelFeed({ tradeContext: 'short_live' })).toBe(true);
    expect(signalRowIsShortPanelFeed({ trade_context: 'common' })).toBe(false);
    expect(signalRowIsShortPanelFeed({ tradeContext: 'common', signal: 'sell' })).toBe(true);
    expect(signalRowIsShortPanelFeed({ tradeContext: 'short_focus' })).toBe(true);
    expect(signalRowIsShortPanelFeed({ tradeContext: 'long_live' })).toBe(false);
  });

  it('signalRowIsShortRelevantLongContext: orice long_* (fără filtru pe semnal)', () => {
    expect(signalRowIsShortRelevantLongContext({ tradeContext: 'long_live', signal: 'sell' })).toBe(true);
    expect(signalRowIsShortRelevantLongContext({ tradeContext: 'long_spot', signal: 'hold' })).toBe(true);
    expect(signalRowIsShortRelevantLongContext({ tradeContext: 'long_focus', signal: 'buy' })).toBe(true);
    expect(signalRowIsShortRelevantLongContext({ tradeContext: 'short_live', signal: 'sell' })).toBe(false);
  });

  it('filterSignalsForShortFuturesFeed: short_* + common cu semnal SHORT; long_* doar cu semnal SHORT (sell/short); exclude long_* buy/hold/swap', () => {
    const out = filterSignalsForShortFuturesFeed([
      { id: 1, tradeContext: 'common', token: 'ETH' },
      { id: 2, tradeContext: 'long_spot', token: 'BTC', signal: 'buy' },
      { id: 3, tradeContext: 'short_live', token: 'SOL' },
      { id: 4, tradeContext: 'long_live', token: 'DOGE', signal: 'sell' },
      { id: 5, tradeContext: 'long_spot', token: 'XRP', signal: 'hold' },
      { id: 6, tradeContext: 'short_focus', token: 'ADA' },
      { id: 7, tradeContext: 'long_focus', token: 'LINK', signal: 'hold' },
      { id: 8, tradeContext: 'long_spot', token: 'PEPE', signal: 'swap' },
      { id: 9, tradeContext: 'common', token: 'ZEC', signal: 'sell' },
      { id: 10, tradeContext: 'short_live', token: 'OP', signal: 'buy' },
      { id: 11, tradeContext: 'short_live', token: 'ATOM', signal: 'close_long' },
    ]);
    expect(out.map((s) => s.id).sort((a, b) => a - b)).toEqual([3, 4, 6, 9, 10]);
  });
});

describe('otaFuturesSignalContext — feed LONG', () => {
  it('signalRowIsLongFuturesAnalysis: doar long_spot / long_live', () => {
    expect(signalRowIsLongFuturesAnalysis({ tradeContext: 'long_spot' })).toBe(true);
    expect(signalRowIsLongFuturesAnalysis({ tradeContext: 'long_live' })).toBe(true);
    expect(signalRowIsLongFuturesAnalysis({ trade_context: 'common' })).toBe(false);
  });

  it('signalRowIsLongPanelFeed: doar long_* (fără common în feed)', () => {
    expect(signalRowIsLongPanelFeed({ tradeContext: 'long_spot' })).toBe(true);
    expect(signalRowIsLongPanelFeed({ tradeContext: 'long_live' })).toBe(true);
    expect(signalRowIsLongPanelFeed({ tradeContext: 'long_focus' })).toBe(true);
    expect(signalRowIsLongPanelFeed({ trade_context: 'common' })).toBe(false);
    expect(signalRowIsLongPanelFeed({ tradeContext: 'short_live' })).toBe(false);
  });

  it('signalRowIsLongRelevantShortContext: buy/open_long/open_long_futures/swap/hold pe short_*', () => {
    expect(signalRowIsLongRelevantShortContext({ tradeContext: 'short_live', signal: 'buy' })).toBe(true);
    expect(signalRowIsLongRelevantShortContext({ tradeContext: 'short_focus', signal: 'open_long' })).toBe(true);
    expect(signalRowIsLongRelevantShortContext({ tradeContext: 'short_live', signal: 'open_long_futures' })).toBe(true);
    expect(signalRowIsLongRelevantShortContext({ tradeContext: 'short_live', signal: 'swap' })).toBe(true);
    expect(signalRowIsLongRelevantShortContext({ tradeContext: 'short_live', signal: 'hold' })).toBe(true);
    expect(signalRowIsLongRelevantShortContext({ tradeContext: 'short_live', signal: 'sell' })).toBe(false);
    expect(signalRowIsLongRelevantShortContext({ tradeContext: 'long_spot', signal: 'buy' })).toBe(false);
  });

  it('filterSignalsForLongFuturesFeed: long_* + common + short_* informativ (buy/hold); exclude open_short/close_short* și sell', () => {
    const out = filterSignalsForLongFuturesFeed([
      { id: 1, tradeContext: 'common', token: 'ETH' },
      { id: 2, tradeContext: 'short_live', token: 'BTC', signal: 'sell' },
      { id: 3, tradeContext: 'long_spot', token: 'SOL' },
      { id: 4, tradeContext: 'short_focus', token: 'DOGE', signal: 'buy' },
      { id: 5, tradeContext: 'short_live', token: 'XRP', signal: 'hold' },
      { id: 6, tradeContext: 'long_spot', token: 'AVAX', signal: 'sell' },
      { id: 7, tradeContext: 'common', token: 'ZEC', signal: 'sell' },
      { id: 8, tradeContext: 'common', token: 'AAVE', signal: 'buy' },
      { id: 9, tradeContext: 'long_spot', token: 'CRV', signal: 'open_short' },
      { id: 10, tradeContext: 'long_live', token: 'MKR', signal: 'buy' },
    ]);
    expect(out.map((s) => s.id).sort((a, b) => a - b)).toEqual([3, 4, 5, 8, 10]);
  });
});

describe('otaFuturesSignalContext — separare SHORT vs LONG (contract Futures Ops)', () => {
  it('feed SHORT vs LONG: fără suprapunere pentru semnale strict SHORT; buy/hold pe short_* pot apărea în ambele (motor)', () => {
    const mixed = [
      { id: 's1', tradeContext: 'short_live', token: 'A', signal: 'sell' },
      { id: 's2', tradeContext: 'short_focus', token: 'B', signal: 'open_short' },
      { id: 'l1', tradeContext: 'long_spot', token: 'C', signal: 'buy' },
      { id: 'l2', tradeContext: 'long_focus', token: 'D', signal: 'hold' },
      { id: 'c1', tradeContext: 'common', token: 'E', signal: 'sell' },
      { id: 'x1', tradeContext: 'long_spot', token: 'F', signal: 'open_short' },
      { id: 'bear', tradeContext: 'long_spot', token: 'G', signal: 'sell' },
      { id: 'dual', tradeContext: 'short_live', token: 'H', signal: 'buy', analysisSource: 'motor_ota' },
    ];
    const shortFeed = filterSignalsForShortFuturesFeed(mixed);
    const longFeed = filterSignalsForLongFuturesFeed(mixed);
    const shortIds = new Set(shortFeed.map((s) => s.id));
    const longIds = new Set(longFeed.map((s) => s.id));
    for (const id of shortIds) {
      if (id === 'dual') continue;
      expect(longIds.has(id)).toBe(false);
    }
    expect(shortIds.has('s1')).toBe(true);
    expect(shortIds.has('s2')).toBe(true);
    expect(shortIds.has('bear')).toBe(true);
    expect(longIds.has('l1')).toBe(true);
    expect(longIds.has('l2')).toBe(true);
    expect(longIds.has('dual')).toBe(true);
    expect(shortIds.has('dual')).toBe(true);
    expect(longIds.has('bear')).toBe(false);
    expect(shortIds.has('c1')).toBe(true);
    expect(longIds.has('c1')).toBe(false);
    expect(longIds.has('x1')).toBe(false);
    expect(shortIds.has('x1')).toBe(true);
  });

  it('SHORT: pe short_* lasă buy (motor informativ); exclus open_long, swap, open_buy, close_long*', () => {
    const out = filterSignalsForShortFuturesFeed([
      { id: 1, tradeContext: 'short_live', signal: 'buy' },
      { id: 2, tradeContext: 'short_focus', signal: 'open_long' },
      { id: 3, tradeContext: 'short_live', signal: 'swap' },
      { id: 4, tradeContext: 'short_live', signal: 'close_long_futures' },
      { id: 5, tradeContext: 'short_live', signal: 'open_long_futures' },
      { id: 6, tradeContext: 'short_focus', signal: 'open_buy' },
    ]);
    expect(out.map((s) => s.id)).toEqual([1]);
  });

  it('LONG: exclus semnale SHORT pe lane long (open_short, close_short*)', () => {
    const out = filterSignalsForLongFuturesFeed([
      { id: 'a', tradeContext: 'long_spot', signal: 'open_short' },
      { id: 'b', tradeContext: 'long_live', signal: 'close_short' },
      { id: 'c', tradeContext: 'long_focus', signal: 'close_short_futures' },
      { id: 'ok', tradeContext: 'long_spot', signal: 'buy' },
    ]);
    expect(out.map((s) => s.id)).toEqual(['ok']);
  });

  it('LONG: short_live + buy (ex. OTA Motor) intră în feed — nu doar long_*', () => {
    const out = filterSignalsForLongFuturesFeed([
      { id: 'm1', tradeContext: 'short_live', token: 'XRP', signal: 'buy', analysisSource: 'motor_ota' },
      { id: 'm2', tradeContext: 'short_live', token: 'ETH', signal: 'sell' },
      { id: 'm3', tradeContext: 'short_focus', token: 'SOL', signal: 'open_long_futures' },
    ]);
    expect(out.map((s) => s.id).sort()).toEqual(['m1', 'm3']);
  });

  it('alias trade_context (snake_case) echivalent cu tradeContext', () => {
    const shortRow = filterSignalsForShortFuturesFeed([
      { id: 1, trade_context: 'short_live', signal: 'sell' },
    ]);
    expect(shortRow).toHaveLength(1);
    const longRow = filterSignalsForLongFuturesFeed([{ id: 2, trade_context: 'long_spot', signal: 'buy' }]);
    expect(longRow).toHaveLength(1);
  });

  it('common + buy: intră în feed SHORT dacă există hint analyzeRequestTradeContext=short_live (persist lane)', () => {
    const out = filterSignalsForShortFuturesFeed([
      { id: 'h1', tradeContext: 'common', signal: 'buy', analyzeRequestTradeContext: 'short_live', token: 'BTC' },
    ]);
    expect(out.map((s) => s.id)).toEqual(['h1']);
  });

  it('semnal din câmp action când lipsește signal', () => {
    expect(
      filterSignalsForShortFuturesFeed([
        { id: 'a1', tradeContext: 'short_focus', action: 'sell', token: 'ETH' },
      ]).map((s) => s.id)
    ).toEqual(['a1']);
  });

  it('GET short_live cu rând common+buy pe DB: _otaSignalsQueryBranch păstrează rândul în feed SHORT', () => {
    const out = filterSignalsForShortFuturesFeed([
      {
        id: 'q1',
        tradeContext: 'common',
        signal: 'buy',
        token: 'ADA',
        _otaSignalsQueryBranch: 'short_live',
      },
    ]);
    expect(out.map((s) => s.id)).toEqual(['q1']);
  });

  it('GET long_spot cu rând common+buy pe DB: _otaSignalsQueryBranch păstrează rândul în feed LONG', () => {
    const out = filterSignalsForLongFuturesFeed([
      {
        id: 'L1',
        tradeContext: 'common',
        signal: 'buy',
        token: 'XRP',
        _otaSignalsQueryBranch: 'long_spot',
      },
    ]);
    expect(out.map((s) => s.id)).toEqual(['L1']);
  });

  it('branch API common + buy intră în feed LONG (executor persistă adesea pe common)', () => {
    const out = filterSignalsForLongFuturesFeed([
      {
        id: 'C1',
        tradeContext: 'common',
        signal: 'buy',
        token: 'BTC',
        _otaSignalsQueryBranch: 'common',
      },
    ]);
    expect(out.map((s) => s.id)).toEqual(['C1']);
  });

  it('flux tip panouri: după merge două branch-uri API, filtrul păstrează doar lane-ul potrivit', () => {
    const merged = mergeTwoOtaSignalLists(
      [
        {
          id: 10,
          tradeContext: 'short_live',
          signal: 'sell',
          created_at: '2026-01-10T12:00:00.000Z',
        },
      ],
      [
        {
          id: 20,
          tradeContext: 'long_spot',
          signal: 'buy',
          created_at: '2026-01-10T11:00:00.000Z',
        },
      ]
    );
    expect(filterSignalsForShortFuturesFeed(merged).map((s) => s.id)).toEqual([10]);
    expect(filterSignalsForLongFuturesFeed(merged).map((s) => s.id)).toEqual([20]);
  });

  it('input null/undefined: filtre returnează []', () => {
    expect(filterSignalsForShortFuturesFeed(null)).toEqual([]);
    expect(filterSignalsForLongFuturesFeed(undefined)).toEqual([]);
  });
});

describe('otaFuturesSignalContext — merge/dedupe feed', () => {
  it('mergeTwoOtaSignalLists dedupe după id și sortează desc după timp', () => {
    const a = [{ id: 1, token: 'A', created_at: '2026-01-02T00:00:00Z', signal: 'hold' }];
    const b = [
      { id: 1, token: 'A', created_at: '2026-01-01T00:00:00Z', signal: 'hold' },
      { id: 2, token: 'B', created_at: '2026-01-03T00:00:00Z', signal: 'sell' },
    ];
    const out = mergeTwoOtaSignalLists(a, b);
    expect(out.map((s) => s.id)).toEqual([2, 1]);
  });

  it('dedupeOtaSignalsForFeed reduce duplicate pe (token, sec, semnal, conf, reasoning prefix)', () => {
    const sigs = [
      { token: 'ETH', created_at: '2026-01-01T12:00:00.000Z', signal: 'hold', confidence: 0.5, reasoning: 'x' },
      { token: 'ETH', created_at: '2026-01-01T12:00:00.500Z', signal: 'hold', confidence: 0.5, reasoning: 'x' },
      { token: 'BTC', created_at: '2026-01-01T12:00:00.000Z', signal: 'hold', confidence: 0.5, reasoning: 'y' },
    ];
    const out = dedupeOtaSignalsForFeed(sigs);
    expect(out).toHaveLength(2);
  });
});
