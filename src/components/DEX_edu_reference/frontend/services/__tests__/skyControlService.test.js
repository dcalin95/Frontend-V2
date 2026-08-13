import { buildSkyControlWalletExportParams, controlSkyControlBot, fetchSkyControlSummary, requestSkyControl } from '../skyControlService';

jest.mock('../../../../../config/apiEndpoints', () => ({
  getBackendUrl: () => 'https://backend.example.test',
}));
jest.mock('../../../config/runtimeConfig', () => ({
  getBackendUrl: () => 'https://backend-server-eu.onrender.com',
}));

const jsonResponse = (status, payload) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(payload),
});

describe('Sky Control summary request contract', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('uses the DEX runtime backend instead of an unproven same-origin production API route', async () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = new URL('https://bits-ai.io/#/dex-edu/sky-control');
    global.fetch.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await expect(requestSkyControl('/health')).resolves.toEqual({ ok: true });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://backend-server-eu.onrender.com/api/sky-control/health',
      expect.objectContaining({ credentials: 'include' }),
    );
    delete window.location;
    window.location = originalLocation;
  });

  it('keeps the provider connected when schema diagnostics are unavailable', async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse(200, { database: 'connected' }))
      .mockResolvedValueOnce(jsonResponse(200, { quick: { status: 'available' } }))
      .mockResolvedValueOnce(jsonResponse(503, { error: 'schema_diagnostics_unavailable' }))
      .mockResolvedValueOnce(jsonResponse(200, { provider: { status: 'NOT_CONFIGURED' } }));

    await expect(fetchSkyControlSummary()).resolves.toEqual({
      health: { database: 'connected' },
      overview: { quick: { status: 'available' } },
      schema: null,
      runtime: { provider: { status: 'NOT_CONFIGURED' } },
    });
  });

  it('keeps health visible when overview is temporarily unavailable', async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse(200, { database: 'connected' }))
      .mockResolvedValueOnce(jsonResponse(503, { error: 'sky_control_query_failed' }))
      .mockResolvedValueOnce(jsonResponse(404, { error: 'schema_diagnostics_unavailable' }))
      .mockResolvedValueOnce(jsonResponse(503, { error: 'QMC_RUNTIME_UNAVAILABLE' }));

    await expect(fetchSkyControlSummary()).resolves.toEqual({
      health: { database: 'connected' },
      overview: null,
      schema: null,
      runtime: null,
    });
  });

  it('preserves auth status when all primary summary sources reject as unauthorized', async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse(401, { error: 'not_authenticated' }))
      .mockResolvedValueOnce(jsonResponse(403, { error: 'not_authorized' }))
      .mockResolvedValueOnce(jsonResponse(404, { error: 'schema_diagnostics_unavailable' }))
      .mockResolvedValueOnce(jsonResponse(403, { error: 'not_authorized' }));

    await expect(fetchSkyControlSummary()).rejects.toMatchObject({ status: 401 });
  });

  it('posts bounded bot runtime controls through the DEX runtime Sky Control API', async () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = new URL('https://bits-ai.io/#/dex-edu/sky-control?tab=bot-fleet');
    global.fetch.mockResolvedValueOnce(jsonResponse(200, { status: 'ACCEPTED', action: 'restart' }));

    await expect(controlSkyControlBot(' 7 ', 'restart')).resolves.toMatchObject({ status: 'ACCEPTED' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://backend-server-eu.onrender.com/api/sky-control/runtime/bots/7/restart',
      expect.objectContaining({ method: 'POST', credentials: 'include', body: '{}' }),
    );
    delete window.location;
    window.location = originalLocation;
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
