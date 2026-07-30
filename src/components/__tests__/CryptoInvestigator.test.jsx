import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CryptoInvestigator from '../CryptoInvestigator';

const mockNavigate = jest.fn();

jest.mock('../DEX_edu_reference/frontend/components/ai-trading/InvestigatorWorkspace', () => ({
  __esModule: true,
  default: ({ mode, scopeKey, onBack }) => (
    <button type="button" onClick={onBack}>
      {mode}:{scopeKey}:Back to Futures Ops
    </button>
  ),
}));

describe('CryptoInvestigator', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the standalone workspace and returns to Futures Ops', () => {
    render(<CryptoInvestigator onNavigateBack={mockNavigate} />);

    fireEvent.click(screen.getByRole('button', { name: /Back to Futures Ops/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/#/dex-edu/ota/short-ops?tab=long');
  });
});
