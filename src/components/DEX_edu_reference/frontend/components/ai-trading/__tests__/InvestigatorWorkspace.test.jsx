import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvestigatorWorkspace from '../InvestigatorWorkspace';

const mockPostChat = jest.fn();
const mockRunInvestigation = jest.fn();
const mockSaveInvestigationRecord = jest.fn();
const mockUpsertInvestigationHistory = jest.fn();
const mockClearInvestigatorDraftState = jest.fn();
const mockSaveInvestigatorDraft = jest.fn();
const mockStoreInvestigatorDraftState = jest.fn();
const mockExportInvestigationJson = jest.fn();

jest.mock('../../../../../../hooks/useAIChat', () => ({
  useAIChat: () => ({
    postChat: mockPostChat,
    provider: 'openai',
  }),
}));

jest.mock('../../../hooks/useWallet', () => ({
  useWallet: () => ({ walletAddress: '0x1111111111111111111111111111111111111111' }),
}));

jest.mock('../../../context/DexAuthContext', () => ({
  useDexAuth: () => ({
    user: { walletAddress: '0x1111111111111111111111111111111111111111' },
  }),
}));

jest.mock('../../../../config/apiEndpoints', () => ({
  getBackendUrl: () => 'https://backend.example.test',
}));

jest.mock('../../../services/investigatorService', () => ({
  buildExplorerUrl: jest.fn(),
  clearInvestigatorDraftState: (...args) => mockClearInvestigatorDraftState(...args),
  deleteInvestigationRecord: jest.fn(),
  exportInvestigationJson: (...args) => mockExportInvestigationJson(...args),
  fetchAddressInvestigation: jest.fn(),
  loadInvestigationRecord: jest.fn(),
  loadInvestigatorDraft: jest.fn(),
  loadInvestigatorHistory: jest.fn(),
  runInvestigation: (...args) => mockRunInvestigation(...args),
  saveInvestigationRecord: (...args) => mockSaveInvestigationRecord(...args),
  saveInvestigatorDraft: (...args) => mockSaveInvestigatorDraft(...args),
  storeInvestigatorDraftState: (...args) => mockStoreInvestigatorDraftState(...args),
  supportedChainsList: () => ([
    { id: 1, name: 'Ethereum' },
    { id: 56, name: 'BNB Chain' },
    { id: 8453, name: 'Base' },
  ]),
  upsertInvestigationHistory: (...args) => mockUpsertInvestigationHistory(...args),
}));

describe('InvestigatorWorkspace', () => {
  beforeEach(() => {
    mockPostChat.mockReset().mockResolvedValue({ content: 'Grounded answer.' });
    mockRunInvestigation.mockReset().mockResolvedValue({
      id: 'inv-1',
      title: 'Investigation 1',
      subject: {
        kind: 'address',
        input: '0x1111111111111111111111111111111111111111',
        normalized: '0x1111111111111111111111111111111111111111',
        display: '0x1111111111111111111111111111111111111111',
      },
      subjectValue: '0x1111111111111111111111111111111111111111',
      chainId: 56,
      chainName: 'BNB Chain',
      status: 'Completed',
      partial: false,
      overallRisk: 'moderate',
      createdAt: '2026-07-30T00:00:00.000Z',
      updatedAt: '2026-07-30T00:00:00.000Z',
      summary: 'Summary',
      limitations: [],
      notes: [],
      result: {
        overview: {
          entityType: 'Wallet',
          chain: 'BNB Chain',
          nativeBalance: 1.234,
          nativeBalanceSource: 'provider',
          tokenHoldings: [],
          firstSeen: '2026-07-29T00:00:00.000Z',
          lastSeen: '2026-07-30T00:00:00.000Z',
          transactionCount: 2,
          labels: ['whale'],
          verifiedContractStatus: 'Not a contract',
          deployer: '0x2222222222222222222222222222222222222222',
          currentRiskAssessment: 'Moderate',
          executiveSummary: 'Wallet on BNB Chain.',
        },
        findings: [
          {
            id: 'finding-1',
            title: 'Rapid fund movement',
            severity: 'Medium',
            confidence: 'High',
            category: 'flow',
            description: 'Observed repeated outbound transfers.',
            supportingEvidence: ['0xaaa'],
            status: 'Needs Review',
            method: 'deterministic detector',
            detectorVersion: '1.0.0',
            investigatorNotes: 'Auto-generated.',
          },
        ],
        evidence: [
          {
            id: 'evidence-1',
            evidenceType: 'token-transfer',
            chainId: 56,
            transactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            blockNumber: 1,
            logIndex: 0,
            source: 'backend',
            explorerUrl: 'https://bscscan.com/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          },
        ],
        flow: [
          {
            id: 'flow-1',
            sourceEntity: '0x1111111111111111111111111111111111111111',
            destinationEntity: '0x2222222222222222222222222222222222222222',
            asset: 'BNB',
            amount: 2,
            timestamp: '2026-07-30T00:00:00.000Z',
            transactionHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            chainId: 56,
            knownLabel: 'Exchange',
          },
        ],
        timeline: [
          {
            id: 'timeline-1',
            ts: '2026-07-30T00:00:00.000Z',
            type: 'Finding',
            title: 'Rapid fund movement',
            description: 'Observed repeated outbound transfers.',
            severity: 'Medium',
            sourceType: 'heuristic',
          },
        ],
      },
    });
    mockExportInvestigationJson.mockReset().mockReturnValue('{"id":"inv-1"}');
    mockSaveInvestigationRecord.mockReset();
    mockUpsertInvestigationHistory.mockReset().mockReturnValue([]);
    mockClearInvestigatorDraftState.mockReset();
    mockSaveInvestigatorDraft.mockReset();
    mockStoreInvestigatorDraftState.mockReset();
  });

  it('runs an investigation and exposes the saved result plus assistant', async () => {
    render(<InvestigatorWorkspace mode="embedded" scopeKey="test-scope" />);

    fireEvent.change(screen.getByPlaceholderText('0x...'), {
      target: { value: '0x1111111111111111111111111111111111111111' },
    });
    fireEvent.click(screen.getByRole('button', { name: /start investigation/i }));

    await waitFor(() => expect(mockRunInvestigation).toHaveBeenCalledTimes(1));
    expect(mockRunInvestigation).toHaveBeenCalledWith(expect.objectContaining({
      input: '0x1111111111111111111111111111111111111111',
      chainId: 56,
      scopeKey: 'test-scope',
    }));

    expect(await screen.findByText('Investigation overview')).toBeInTheDocument();
    expect(screen.getByText('Wallet')).toBeInTheDocument();
    expect(screen.getAllByText('Rapid fund movement').length).toBeGreaterThan(0);

    fireEvent.change(screen.getAllByPlaceholderText('Manual note...')[0], {
      target: { value: 'Manual hypothesis' },
    });
    fireEvent.change(screen.getByPlaceholderText('What should I look at next?'), {
      target: { value: 'What should I verify next?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /ask assistant/i }));

    await waitFor(() => expect(mockPostChat).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Grounded answer.')).toBeInTheDocument();
  });
});
