import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarketAnalysis from '../MarketAnalysis';

jest.mock('../../../hooks/useOTAAccess', () => ({
  useOTAAccess: () => ({ isPreviewMode: false, can: () => true }),
}));

jest.mock('../../../services/aiTradingApiService.jsx', () => ({
  getOTAQuota: jest.fn(async () => ({ analysesToday: 0, maxAnalysesPerDay: 0, analysesLeft: 999, isExempt: false })),
}));

jest.mock('../../../utils/logger', () => ({
  errorWithPrefix: jest.fn(),
}));

jest.mock('../../../utils/helpers', () => ({
  isOpenAiUnavailableResult: jest.fn(() => false),
  OTA_OPENAI_UNAVAILABLE_MESSAGE: 'OpenAI unavailable.',
}));

jest.mock('../../../utils/otaLlmDisplayLabels', () => ({
  LABEL_LIVE_ANALYSIS: 'Live Analysis',
  LABEL_TECHNICAL_DETAILS: 'Technical details',
  describeAnalysisSourceForUser: jest.fn(() => 'OpenAI'),
  getTechnicalAnalysisSourceRaw: jest.fn(() => 'openai'),
  mapAnalysisSourceToPrimaryLabel: jest.fn(() => 'OpenAI'),
}));

jest.mock('../../common/LoadingSpinner', () => () => <div>Loading…</div>);
jest.mock('../../common/Skeleton', () => () => <div>Skeleton</div>);
jest.mock('../../common/EducationalTooltip', () => () => null);
jest.mock('../../ui', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
jest.mock('../../common/HeaderTokenSelector', () => (props) => (
  <button type="button" aria-label={props.ariaLabel || 'Select token'}>
    {props.selectedToken || 'Token'}
  </button>
));

describe('MarketAnalysis', () => {
  it('renders a separate billing credit card instead of the generic error card', async () => {
    const onAnalyze = jest.fn(async () => {
      const error = new Error('Separate OpenAI credit required. Trial $5.00 · spent $5.00 · available $0.00. Switch to OTA Engine or add more credit to continue.');
      error.code = 'OTA_LLM_BILLING_CREDIT_REQUIRED';
      error.provider = 'OpenAI';
      error.billing = { trialCreditUsd: 5, spentCreditUsd: 5, availableCreditUsd: 0 };
      throw error;
    });

    render(
      <MarketAnalysis
        userId="0x123"
        selectedToken="BTC"
        onTokenChange={jest.fn()}
        onAnalyze={onAnalyze}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Analyze Market/i }));

    expect(await screen.findByText(/Separate OpenAI credit required\./i)).toBeInTheDocument();
    expect(screen.getAllByText(/\$5\.00/i).length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(/Trial \$5\.00 .* spent \$5\.00 .* available \$0\.00/i, { selector: 'p' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Switch to OTA Engine or add more separate provider credit before running OpenAI again\./i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Signal source unavailable/i)).not.toBeInTheDocument();
    });
  });
});
