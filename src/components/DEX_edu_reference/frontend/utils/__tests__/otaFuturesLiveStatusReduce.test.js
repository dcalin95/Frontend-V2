import { reduceOtaFuturesLiveStatus } from '../otaFuturesLiveStatusReduce';

describe('reduceOtaFuturesLiveStatus', () => {
  const prev = { gate: { safeToExecuteLive: true }, x: 1 };
  const fresh = { gate: { safeToExecuteLive: false }, x: 2 };

  it('succes cu date înlocuiește snapshot-ul', () => {
    expect(reduceOtaFuturesLiveStatus(prev, { ok: true, data: fresh })).toEqual(fresh);
  });

  it('succes dar data null păstrează prev', () => {
    expect(reduceOtaFuturesLiveStatus(prev, { ok: true, data: null })).toBe(prev);
  });

  it('succes dar data undefined păstrează prev', () => {
    expect(reduceOtaFuturesLiveStatus(prev, { ok: true, data: undefined })).toBe(prev);
  });

  it('eșec (ok false) păstrează prev', () => {
    expect(reduceOtaFuturesLiveStatus(prev, { ok: false })).toBe(prev);
  });

  it('eșec fără slice complet păstrează prev', () => {
    expect(reduceOtaFuturesLiveStatus(prev, null)).toBe(prev);
    expect(reduceOtaFuturesLiveStatus(prev, undefined)).toBe(prev);
  });

  it('prima încărcare: prev null, succes → data', () => {
    expect(reduceOtaFuturesLiveStatus(null, { ok: true, data: fresh })).toEqual(fresh);
  });

  it('prima încărcare: prev null, eșec → rămâne null', () => {
    expect(reduceOtaFuturesLiveStatus(null, { ok: false })).toBeNull();
  });
});

/** Încercare #1: contract panou — randare cu liveStatus null fără throw (același stil ca în JSX). */
describe('Futures ops live gate optional reads (Încercare #1)', () => {
  it('liveStatus null: gate / adapter / guardrails nu aruncă', () => {
    const liveStatus = null;
    expect(liveStatus?.gate?.safeToExecuteLive).toBeUndefined();
    expect(liveStatus?.adapter?.present).toBeUndefined();
    expect((liveStatus?.guardrails?.reasons || []).join('; ')).toBe('');
  });
});
