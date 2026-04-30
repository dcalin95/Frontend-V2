import {
  coerceSignalsArrayFromApiPayload,
  normalizeSignalsListBranchPayload,
} from '../otaSignalsPayloadCoerce';

describe('otaSignalsPayloadCoerce', () => {
  it('coerceSignalsArrayFromApiPayload reads items/rows fallbacks', () => {
    expect(coerceSignalsArrayFromApiPayload({ items: [{ id: 1 }] })).toEqual([{ id: 1 }]);
    expect(coerceSignalsArrayFromApiPayload({ rows: [{ id: 2 }] })).toEqual([{ id: 2 }]);
    expect(coerceSignalsArrayFromApiPayload(null)).toEqual([]);
  });

  it('normalizeSignalsListBranchPayload preserves object and sets signals', () => {
    const n = normalizeSignalsListBranchPayload({ ok: true, items: [{ a: 1 }] });
    expect(n.ok).toBe(true);
    expect(n.signals).toEqual([{ a: 1 }]);
  });
});
