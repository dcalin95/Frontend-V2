/**
 * SSOT RPC Sei EVM: primul fallback trebuie să fie nodul verificat pentru citiri MgvReader (vezi orderBookService).
 */
import { CLOB_SEI_RPC_FALLBACKS } from '../config';

describe('clob-sei RPC config', () => {
  it('first public fallback is evm-rpc.sei-apis.com (MgvReader eth_call)', () => {
    expect(CLOB_SEI_RPC_FALLBACKS[0]).toBe('https://evm-rpc.sei-apis.com');
  });
});
