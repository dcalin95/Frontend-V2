import { resolveWalletBackedApiUserId } from '../resolveWalletBackedApiUserId';

describe('resolveWalletBackedApiUserId', () => {
  it('prefers connected wallet over route id', () => {
    const r = resolveWalletBackedApiUserId({
      connectedWalletAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      fallbackUserId: '507f1f77bcf86cd799439011',
      walletType: 'EVM',
    });
    expect(r.keySource).toBe('wallet');
    expect(r.apiUserId).toMatch(/^0xaaaa/);
  });

  it('does not use mongo id when wallet missing', () => {
    const r = resolveWalletBackedApiUserId({
      connectedWalletAddress: null,
      fallbackUserId: '507f1f77bcf86cd799439011',
      walletType: 'EVM',
    });
    expect(r.keySource).toBe('none');
    expect(r.apiUserId).toBeNull();
  });

  it('uses fallback EVM address when no connected wallet', () => {
    const addr = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const r = resolveWalletBackedApiUserId({
      connectedWalletAddress: '',
      fallbackUserId: addr,
      walletType: 'EVM',
    });
    expect(r.keySource).toBe('fallback_evm');
    expect(r.apiUserId).toBe(addr);
  });
});
