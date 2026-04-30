import {
  filterAgentTraceEventsForFuturesLane,
  inferAgentTraceRunLane,
  segmentAgentTraceEventsIntoRuns,
} from '../otaAgentTraceLane';

describe('otaAgentTraceLane', () => {
  it('segmentAgentTraceEventsIntoRuns: run_started începe segment nou', () => {
    const ev = [
      { type: 'x', ts: 1 },
      { type: 'run_started', ts: 2 },
      { type: 'finish', ts: 3, signal: 'buy' },
      { type: 'run_started', ts: 4 },
      { type: 'finish', ts: 5, signal: 'sell' },
    ];
    const runs = segmentAgentTraceEventsIntoRuns(ev);
    expect(runs).toHaveLength(3);
    expect(runs[0].map((e) => e.type)).toEqual(['x']);
    expect(runs[1].map((e) => e.type)).toEqual(['run_started', 'finish']);
    expect(runs[2].map((e) => e.type)).toEqual(['run_started', 'finish']);
  });

  it('inferAgentTraceRunLane: tradeContext short_live', () => {
    expect(
      inferAgentTraceRunLane([
        { type: 'run_started', tradeContext: 'short_live' },
        { type: 'finish', signal: 'hold' },
      ])
    ).toBe('short');
  });

  it('inferAgentTraceRunLane: finish buy → long', () => {
    expect(inferAgentTraceRunLane([{ type: 'run_started' }, { type: 'finish', signal: 'buy' }])).toBe(
      'long'
    );
  });

  it('inferAgentTraceRunLane: decision open_long_futures + signal hold (agent map) → long', () => {
    expect(
      inferAgentTraceRunLane([
        { type: 'run_started' },
        { type: 'finish', signal: 'hold', decision: 'open_long_futures' },
      ])
    ).toBe('long');
  });

  it('inferAgentTraceRunLane: finish sell → short', () => {
    expect(inferAgentTraceRunLane([{ type: 'finish', signal: 'sell' }])).toBe('short');
  });

  it('inferAgentTraceRunLane: două finish în același run — contează ultimul (hold final → null)', () => {
    expect(
      inferAgentTraceRunLane([
        { type: 'run_started', ts: 1 },
        { type: 'finish', ts: 2, signal: 'sell', decision: 'open_sell' },
        { type: 'finish', ts: 3, signal: 'hold', decision: 'hold' },
      ])
    ).toBe(null);
  });

  it('inferAgentTraceRunLane: două finish — ultimul semnal direcțional câștigă', () => {
    expect(
      inferAgentTraceRunLane([
        { type: 'run_started' },
        { type: 'finish', signal: 'hold', decision: 'hold' },
        { type: 'finish', signal: 'buy', decision: 'open_buy' },
      ])
    ).toBe('long');
  });

  it('filterAgentTraceEventsForFuturesLane: păstrează run-ul potrivit + exclude lane opus', () => {
    const ev = [
      { type: 'run_started', ts: 1 },
      { type: 'finish', ts: 2, signal: 'buy' },
      { type: 'run_started', ts: 3 },
      { type: 'finish', ts: 4, signal: 'sell' },
    ];
    const longOnly = filterAgentTraceEventsForFuturesLane(ev, 'long');
    expect(longOnly.map((e) => e.signal).filter(Boolean)).toEqual(['buy']);
    const shortOnly = filterAgentTraceEventsForFuturesLane(ev, 'short');
    expect(shortOnly.map((e) => e.signal).filter(Boolean)).toEqual(['sell']);
  });

  it('filterAgentTraceEventsForFuturesLane: hold fără lane dedus → vizibil pe SHORT și LONG', () => {
    const ev = [
      { type: 'run_started', ts: 1 },
      { type: 'finish', ts: 2, signal: 'hold', decision: 'hold' },
      { type: 'run_started', ts: 3 },
      { type: 'finish', ts: 4, signal: 'sell' },
    ];
    const longF = filterAgentTraceEventsForFuturesLane(ev, 'long');
    const shortF = filterAgentTraceEventsForFuturesLane(ev, 'short');
    expect(longF.map((e) => e.signal).filter(Boolean)).toEqual(['hold']);
    expect(shortF.map((e) => e.signal).filter(Boolean)).toEqual(['hold', 'sell']);
  });

  it('inferAgentTraceRunLane: long_spot pe tradeContext → long', () => {
    expect(
      inferAgentTraceRunLane([{ type: 'run_started', tradeContext: 'long_spot' }, { type: 'finish', signal: 'hold' }])
    ).toBe('long');
  });

  it('separare trace: două run-uri LONG — ambele în filtrul long, niciunul în short', () => {
    const ev = [
      { type: 'run_started', ts: 1 },
      { type: 'finish', ts: 2, signal: 'buy' },
      { type: 'run_started', ts: 3 },
      { type: 'finish', ts: 4, signal: 'open_long_futures' },
    ];
    const longF = filterAgentTraceEventsForFuturesLane(ev, 'long');
    const shortF = filterAgentTraceEventsForFuturesLane(ev, 'short');
    expect(longF.length).toBe(4);
    expect(shortF.length).toBe(0);
  });

  it('futuresLane invalid: returnează copie a listei (fără filtrare pe lane)', () => {
    const ev = [{ type: 'finish', signal: 'buy' }];
    const out = filterAgentTraceEventsForFuturesLane(ev, 'mixed');
    expect(out).toEqual(ev);
    expect(out).not.toBe(ev);
  });

  it('input non-array: nu aruncă', () => {
    expect(filterAgentTraceEventsForFuturesLane(null, 'long')).toEqual([]);
  });
});
