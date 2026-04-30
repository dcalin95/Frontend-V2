import { subscribeLeverageActivity, emitLeverageActivity } from '../utils/leverageActivityBus';

describe('leverageActivityBus', () => {
  test('emit delivers to subscriber', () => {
    const seen = [];
    const unsub = subscribeLeverageActivity((e) => seen.push(e));
    emitLeverageActivity({ scope: 'live', kind: 'spot_open', phase: 'confirmed' });
    expect(seen).toHaveLength(1);
    expect(seen[0].kind).toBe('spot_open');
    unsub();
    emitLeverageActivity({ scope: 'live', kind: 'spot_close', phase: 'confirmed' });
    expect(seen).toHaveLength(1);
  });
});
