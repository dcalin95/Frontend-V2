import { createRefetchGeneration } from '../utils/leverageRefetchSequence';

describe('createRefetchGeneration', () => {
  test('only latest id wins', () => {
    const g = createRefetchGeneration();
    const a = g.bump();
    const b = g.bump();
    expect(g.isLatest(a)).toBe(false);
    expect(g.isLatest(b)).toBe(true);
    expect(g.get()).toBe(b);
  });

  test('bump increments', () => {
    const g = createRefetchGeneration();
    expect(g.bump()).toBe(1);
    expect(g.bump()).toBe(2);
  });
});
