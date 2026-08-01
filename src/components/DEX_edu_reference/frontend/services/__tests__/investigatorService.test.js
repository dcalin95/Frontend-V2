import {
  assertNonSyntheticInvestigatorPayload,
  createInvestigationCase,
  deleteInvestigationRecord,
  exportInvestigationJson,
  loadInvestigationRecord,
  loadInvestigatorDraft,
  loadInvestigatorHistory,
  saveInvestigationRecord,
  saveInvestigatorDraft,
  supportedChainsList,
  upsertInvestigationHistory,
} from '../investigatorService';
import { setOtaWalletAuthToken } from '../../utils/otaWalletSession';

jest.mock('../../../../../config/runtimeConfig', () => ({
  loadRuntimeConfig: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../../../config/apiEndpoints', () => ({
  getBackendUrl: () => 'https://backend.example.test',
}));

describe('investigatorService provider integrity', () => {
  it('rejects synthetic backend payloads and identifies the missing credential', () => {
    expect(() => assertNonSyntheticInvestigatorPayload({
      demoMode: true,
      transfers: [{ txHash: 'synthetic' }],
    })).toThrow('Moralis provider');

    try {
      assertNonSyntheticInvestigatorPayload({ demoMode: true });
    } catch (error) {
      expect(error).toMatchObject({
        code: 'INVESTIGATOR_PROVIDER_NOT_CONFIGURED',
        missingEnvironmentVariable: 'MORALIS_API_KEY',
      });
    }
  });

  it('accepts live and empty provider payloads', () => {
    expect(assertNonSyntheticInvestigatorPayload({ demoMode: false, transfers: [] }))
      .toEqual({ demoMode: false, transfers: [] });
  });
});

describe('investigatorService OTA authentication', () => {
  beforeEach(() => {
    setOtaWalletAuthToken(
      'otaw_investigator_test',
      '0x1111111111111111111111111111111111111111',
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ investigation: { id: 'case-1' } }),
    });
  });

  afterEach(() => {
    setOtaWalletAuthToken(null);
    jest.restoreAllMocks();
  });

  it('sends the OTA wallet token when creating an investigation case', async () => {
    await createInvestigationCase({
      title: 'Case',
      subjects: [{ identifier: '0x1111111111111111111111111111111111111111', chainId: 56 }],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://backend.example.test/api/investigator/cases',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer otaw_investigator_test',
        }),
      }),
    );
  });
});

describe('investigatorService persistence helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores and restores drafts, history, and records', () => {
    const scopeKey = 'scope-a';
    const investigation = {
      id: 'inv-1',
      title: 'Investigation 1',
      subjectValue: '0x1234567890123456789012345678901234567890',
      chainId: 56,
      chainName: 'BNB Chain',
      status: 'Completed',
      overallRisk: 'moderate',
      partial: false,
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
      result: { findings: [{ id: 'finding-1' }] },
    };

    expect(supportedChainsList()).toHaveLength(3);

    saveInvestigatorDraft(scopeKey, { query: '0xabc', chainId: 56, objective: 'test', depth: 'bounded' });
    expect(loadInvestigatorDraft(scopeKey)).toMatchObject({ query: '0xabc', chainId: 56 });

    saveInvestigationRecord(scopeKey, investigation);
    expect(loadInvestigationRecord(scopeKey, 'inv-1')).toMatchObject({ id: 'inv-1', status: 'Completed' });

    const history = upsertInvestigationHistory(scopeKey, investigation);
    expect(history[0]).toMatchObject({
      id: 'inv-1',
      title: 'Investigation 1',
      findingCount: 1,
      partial: false,
    });
    expect(loadInvestigatorHistory(scopeKey)).toHaveLength(1);

    const exported = JSON.parse(exportInvestigationJson(investigation));
    expect(exported.id).toBe('inv-1');

    deleteInvestigationRecord(scopeKey, 'inv-1');
    expect(loadInvestigationRecord(scopeKey, 'inv-1')).toBeNull();
  });
});
