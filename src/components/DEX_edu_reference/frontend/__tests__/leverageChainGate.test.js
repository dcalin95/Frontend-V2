import { buildLeverageChainGate } from '../utils/leverageChainGate';

describe('buildLeverageChainGate', () => {
  const expectedId = 56;
  const expectedName = 'BSC Mainnet';

  test('wrong chain when connected and id differs', () => {
    const g = buildLeverageChainGate(true, 1, expectedId, expectedName);
    expect(g.isWrongChain).toBe(true);
    expect(g.chainPending).toBe(false);
    expect(g.chainReadFailed).toBe(false);
    expect(g.connectedChainId).toBe(1);
  });

  test('correct chain: not wrong', () => {
    const g = buildLeverageChainGate(true, 56, expectedId, expectedName);
    expect(g.isWrongChain).toBe(false);
    expect(g.chainPending).toBe(false);
  });

  test('pending when connected and chain undefined', () => {
    const g = buildLeverageChainGate(true, undefined, expectedId, expectedName);
    expect(g.chainPending).toBe(true);
    expect(g.isWrongChain).toBe(false);
  });

  test('read failed when connected and null', () => {
    const g = buildLeverageChainGate(true, null, expectedId, expectedName);
    expect(g.chainReadFailed).toBe(true);
    expect(g.isWrongChain).toBe(false);
  });

  test('not connected: no wrong / pending / failed', () => {
    const g = buildLeverageChainGate(false, 1, expectedId, expectedName);
    expect(g.isWrongChain).toBe(false);
    expect(g.chainPending).toBe(false);
    expect(g.chainReadFailed).toBe(false);
  });
});
