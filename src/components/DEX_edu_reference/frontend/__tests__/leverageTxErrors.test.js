import { normalizeTxError } from '../utils/leverageTxErrors';

describe('normalizeTxError', () => {
  test('maps 4001 to rejected', () => {
    const r = normalizeTxError({ code: 4001, message: 'ignored' });
    expect(r.kind).toBe('rejected');
    expect(r.userMessage).toMatch(/rejected in wallet/i);
  });

  test('maps ACTION_REJECTED to rejected', () => {
    const r = normalizeTxError({ code: 'ACTION_REJECTED' });
    expect(r.kind).toBe('rejected');
  });

  test('maps user denied message to rejected', () => {
    const r = normalizeTxError({ message: 'User denied transaction signature' });
    expect(r.kind).toBe('rejected');
  });

  test('maps no provider / signer message', () => {
    const r = normalizeTxError({
      message: 'No EVM wallet provider — connect a compatible wallet (e.g. MetaMask) on BSC.',
    });
    expect(r.kind).toBe('no_signer');
    expect(r.userMessage).toMatch(/wallet/i);
  });

  test('maps on-chain revert phrasing', () => {
    const r = normalizeTxError({
      message: 'Transaction failed on-chain (reverted). Check explorer.',
    });
    expect(r.kind).toBe('onchain_fail');
  });

  test('falls through unknown with message', () => {
    const r = normalizeTxError({ message: 'RPC timeout' });
    expect(r.kind).toBe('unknown');
    expect(r.userMessage).toBe('RPC timeout');
  });
});
