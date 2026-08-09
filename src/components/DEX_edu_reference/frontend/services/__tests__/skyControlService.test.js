import { buildSkyControlWalletExportParams } from '../skyControlService';

describe('Wallet Intelligence export request contract', () => {
  it('preserves the raw selected identifier and requires a chain for wallet and transaction cases', () => {
    expect(buildSkyControlWalletExportParams({ entity_type: 'WALLET', entity_id: '0xAbCd', chain: 'BSC' })).toEqual({ case_type: 'WALLET', case_id: '0xAbCd', chain: 'bsc' });
    expect(buildSkyControlWalletExportParams({ entity_type: 'TRANSACTION', entity_id: '0xTx', chain: 'ethereum' })).toEqual({ case_type: 'TRANSACTION', case_id: '0xTx', chain: 'ethereum' });
    expect(() => buildSkyControlWalletExportParams({ entity_type: 'WALLET', entity_id: '0xAbCd' })).toThrow('wallet_case_chain_required');
    expect(() => buildSkyControlWalletExportParams({ entity_type: 'TRANSACTION', entity_id: '0xTx' })).toThrow('wallet_case_chain_required');
  });

  it('uses canonical non-chain case types and scopes every CSV type to the selected case', () => {
    ['PAYMENT_REFERENCE', 'PAYMENT', 'ORDER', 'USER', 'ADMIN'].forEach((case_type) => expect(buildSkyControlWalletExportParams({ entity_type: case_type, entity_id: 'raw-case-id' })).toEqual({ case_type, case_id: 'raw-case-id' }));
    ['transactions', 'money_flow', 'wallet_history', 'counterparties'].forEach((type) => expect(buildSkyControlWalletExportParams({ entity_type: 'PAYMENT', entity_id: 'raw-case-id' }, type)).toEqual({ case_type: 'PAYMENT', case_id: 'raw-case-id', type }));
  });
});
