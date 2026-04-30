import {
  formatGeneratCronometruRo,
  formatGeneratedRelativeEn,
  pickAnalysisEventEpochMs,
  pickAnalysisInstant,
  pickSignalRecencyEpochMs,
} from '../otaAnalysisTimestamps';

describe('otaAnalysisTimestamps - generation = created_at only', () => {
  const oldCreated = '2026-01-15T10:00:00.000Z';
  const newerOther = '2026-01-15T14:00:00.000Z';

  it('pickAnalysisEventEpochMs ignores newer analyzed_at / timestamp / updated_at', () => {
    const sig = {
      created_at: oldCreated,
      analyzed_at: newerOther,
      timestamp: newerOther,
      updated_at: newerOther,
    };
    expect(pickAnalysisEventEpochMs(sig)).toBe(new Date(oldCreated).getTime());
  });

  it('pickAnalysisEventEpochMs uses createdAt when created_at is missing', () => {
    const sig = { createdAt: oldCreated };
    expect(pickAnalysisEventEpochMs(sig)).toBe(new Date(oldCreated).getTime());
  });

  it('pickAnalysisInstant is null without created_at / createdAt', () => {
    expect(pickAnalysisInstant({ analyzed_at: oldCreated })).toBeNull();
    expect(pickAnalysisInstant({ timestamp: oldCreated })).toBeNull();
  });

  it('pickSignalRecencyEpochMs still takes the maximum (legacy), different from generation', () => {
    const sig = {
      created_at: oldCreated,
      updated_at: newerOther,
    };
    expect(pickSignalRecencyEpochMs(sig)).toBe(new Date(newerOther).getTime());
    expect(pickAnalysisEventEpochMs(sig)).toBe(new Date(oldCreated).getTime());
  });
});

describe('formatGeneratCronometruRo', () => {
  const gen = new Date(Date.UTC(2026, 3, 9, 12, 0, 0));

  it('seconds and minutes', () => {
    expect(formatGeneratCronometruRo(gen, gen.getTime() + 45 * 1000)).toBe('Generated 45 seconds ago');
    expect(formatGeneratCronometruRo(gen, gen.getTime() + 2 * 60 * 1000)).toBe('Generated 2 minutes ago');
    expect(formatGeneratCronometruRo(gen, gen.getTime() + 60 * 1000)).toBe('Generated 1 minute ago');
  });

  it('hours (e.g. 99 hours)', () => {
    const now = gen.getTime() + 99 * 60 * 60 * 1000;
    expect(formatGeneratCronometruRo(gen, now)).toBe('Generated 99 hours ago');
  });

  it('hours and minutes under cap', () => {
    const now = gen.getTime() + (3 * 60 + 25) * 60 * 1000;
    expect(formatGeneratCronometruRo(gen, now)).toBe('Generated 3 hours and 25 minutes ago');
  });
});

describe('formatGeneratedRelativeEn (DEX)', () => {
  const gen = new Date(Date.UTC(2026, 3, 9, 12, 0, 0));

  it('seconds and minutes', () => {
    expect(formatGeneratedRelativeEn(gen, gen.getTime() + 45 * 1000)).toBe('Generated 45 seconds ago');
    expect(formatGeneratedRelativeEn(gen, gen.getTime() + 2 * 60 * 1000)).toBe('Generated 2 minutes ago');
    expect(formatGeneratedRelativeEn(gen, gen.getTime() + 60 * 1000)).toBe('Generated 1 minute ago');
  });

  it('hours (e.g. 99 hours)', () => {
    const now = gen.getTime() + 99 * 60 * 60 * 1000;
    expect(formatGeneratedRelativeEn(gen, now)).toBe('Generated 99 hours ago');
  });

  it('hours and minutes under cap', () => {
    const now = gen.getTime() + (3 * 60 + 25) * 60 * 1000;
    expect(formatGeneratedRelativeEn(gen, now)).toBe('Generated 3 hours and 25 minutes ago');
  });
});
