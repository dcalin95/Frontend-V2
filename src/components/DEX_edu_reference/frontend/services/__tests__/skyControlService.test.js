import {
  buildSkyControlWalletExportParams,
  fetchSkyControlSummary,
  requestSkyControl,
} from '../skyControlService';

describe('Sky Control runtime API contract', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
    jest.restoreAllMocks();
  });

  it('uses the DEX runtime backend instead of the unrelated frontend origin', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    });

    await expect(requestSkyControl('/health')).resolves.toEqual({ ok: true });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://backend-server-eu.onrender.com/api/sky-control/health',
      expect.objectContaining({ credentials: 'include', method: 'GET' }),
    );
  });

  it('keeps the provider summary usable when optional schema diagnostics fail', async () => {
    global.fetch.mockImplementation((url) => Promise.resolve({
      ok: !String(url).includes('/schema'),
      status: String(url).includes('/schema') ? 503 : 200,
      json: () => Promise.resolve(String(url).includes('/schema')
        ? { error: 'query_failed' }
        : { ok: true, route: url }),
    }));

    await expect(fetchSkyControlSummary()).resolves.toMatchObject({
      health: { ok: true },
      overview: { ok: true },
      schema: null,
    });
  });
});

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
