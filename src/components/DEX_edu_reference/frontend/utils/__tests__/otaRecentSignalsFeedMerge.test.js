import {
  reduceOtaRecentSignalsFeed,
  signalsFetchOptsFromBulkRefresh,
} from '../otaRecentSignalsFeedMerge';

describe('otaRecentSignalsFeedMerge', () => {
  const prev = [{ id: 'a' }];
  const next = [{ id: 'b' }];

  describe('reduceOtaRecentSignalsFeed', () => {
    it('next nevid înlocuiește mereu', () => {
      expect(
        reduceOtaRecentSignalsFeed(prev, next, { forceReplace: false, signalBranchFailures: [] })
      ).toEqual(next);
      expect(
        reduceOtaRecentSignalsFeed(prev, next, { forceReplace: true, signalBranchFailures: [{ ok: false }] })
      ).toEqual(next);
    });

    it('next gol + toate branch-urile OK (fără erori) golește cache-ul — nu păstra rânduri vechi la infinit', () => {
      expect(
        reduceOtaRecentSignalsFeed(prev, [], { forceReplace: false, signalBranchFailures: [] })
      ).toEqual([]);
      expect(
        reduceOtaRecentSignalsFeed(prev, [], { forceReplace: true, signalBranchFailures: [] })
      ).toEqual([]);
    });

    it('next gol + erori branch păstrează prev chiar cu forceReplace true (nu flash complet la eșec GET)', () => {
      const fails = [{ tradeContext: 'short_live', ok: false }];
      expect(
        reduceOtaRecentSignalsFeed(prev, [], { forceReplace: true, signalBranchFailures: fails })
      ).toEqual(prev);
    });

    it('prev gol + next gol rămâne gol', () => {
      expect(
        reduceOtaRecentSignalsFeed([], [], { forceReplace: false, signalBranchFailures: [] })
      ).toEqual([]);
    });

    it('tolerează prev/next non-array ca listă goale', () => {
      expect(
        reduceOtaRecentSignalsFeed(null, [], { forceReplace: false, signalBranchFailures: [] })
      ).toEqual([]);
    });
  });

  describe('signalsFetchOptsFromBulkRefresh', () => {
    it('fără forceSignals nu cere forceReplace', () => {
      expect(signalsFetchOptsFromBulkRefresh()).toEqual({});
      expect(signalsFetchOptsFromBulkRefresh(false)).toEqual({});
    });

    it('forceSignals true mapează la forceReplace', () => {
      expect(signalsFetchOptsFromBulkRefresh(true)).toEqual({ forceReplace: true });
    });
  });
});
