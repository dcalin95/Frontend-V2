import { stickySignalsPanelDisplay } from '../otaStickySignalsPanelDisplay';

describe('stickySignalsPanelDisplay (Încercare #2)', () => {
  const userKey = '0xabc';

  it('returnează forPanel când e nenul', () => {
    const fresh = [{ id: 1 }];
    expect(
      stickySignalsPanelDisplay(fresh, {
        pollBusy: true,
        userKey,
        lastSlice: [{ id: 0 }],
        lastUserKey: userKey,
      })
    ).toEqual(fresh);
  });

  it('returnează lastSlice când forPanel e gol, pollBusy și userKey se potrivesc', () => {
    const last = [{ id: 'sticky' }];
    expect(
      stickySignalsPanelDisplay([], {
        pollBusy: true,
        userKey,
        lastSlice: last,
        lastUserKey: userKey,
      })
    ).toEqual(last);
  });

  it('nu folosește lastSlice dacă pollBusy e false (fără guard pipeline)', () => {
    expect(
      stickySignalsPanelDisplay([], {
        pollBusy: false,
        userKey,
        lastSlice: [{ id: 1 }],
        lastUserKey: userKey,
      })
    ).toEqual([]);
  });

  it('folosește lastSlice cu emptyPipelineFlashGuard când pollBusy e false', () => {
    const last = [{ id: 'pipe' }];
    expect(
      stickySignalsPanelDisplay([], {
        pollBusy: false,
        emptyPipelineFlashGuard: true,
        userKey,
        lastSlice: last,
        lastUserKey: userKey,
      })
    ).toEqual(last);
  });

  it('folosește lastSlice cu layoutHold chiar dacă pollBusy e false', () => {
    const last = [{ id: 'hold' }];
    expect(
      stickySignalsPanelDisplay([], {
        pollBusy: false,
        layoutHold: true,
        userKey,
        lastSlice: last,
        lastUserKey: userKey,
      })
    ).toEqual(last);
  });

  it('nu folosește lastSlice dacă userKey nu se potrivește', () => {
    expect(
      stickySignalsPanelDisplay([], {
        pollBusy: true,
        userKey,
        lastSlice: [{ id: 1 }],
        lastUserKey: '0xother',
      })
    ).toEqual([]);
  });

  it('normalizare: non-array forPanel devine []', () => {
    expect(
      stickySignalsPanelDisplay(null, {
        pollBusy: true,
        userKey,
        lastSlice: [{ id: 1 }],
        lastUserKey: userKey,
      })
    ).toEqual([{ id: 1 }]);
  });
});
