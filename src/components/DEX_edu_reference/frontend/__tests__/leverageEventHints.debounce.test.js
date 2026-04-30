import { createDebouncedRefetchHint } from '../hooks/useLeverageEventHints';

describe('createDebouncedRefetchHint', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test('schedules single run after multiple schedule calls', () => {
    const fn = jest.fn();
    const d = createDebouncedRefetchHint(400, fn);
    d.schedule();
    d.schedule();
    d.schedule();
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(400);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('cancel prevents run', () => {
    const fn = jest.fn();
    const d = createDebouncedRefetchHint(400, fn);
    d.schedule();
    d.cancel();
    jest.advanceTimersByTime(400);
    expect(fn).not.toHaveBeenCalled();
  });
});
