import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../../context/WalletContext.jsx', () => ({
  useWallet: () => ({ solanaWalletAddress: '3phiSolWallet111111111111111111111111111111' }),
}));

jest.mock('../../../hooks/DEX/useDEXSettings', () => ({
  useDEXSettings: () => ({ settings: { defaultChartTimeframe: 'W' } }),
}));

jest.mock('../../../sol/context/SolPairContext', () => ({
  useSolPair: () => ({ pair: 'SOL/USDC' }),
}));

jest.mock('../../../sol/SwapPanel.sol', () => ({
  __esModule: true,
  default: ({ assistedDraft }) => (
    <div data-testid="sol-swap-panel">
      {assistedDraft
        ? `Prepared ${assistedDraft.from}->${assistedDraft.to} ${assistedDraft.amount}`
        : 'Manual Jupiter swap panel'}
    </div>
  ),
}));

jest.mock('../../components/common/TradingViewChart', () => ({
  __esModule: true,
  default: () => <div data-testid="sol-chart">Chart</div>,
}));

jest.mock('../../../sol/services/solTradeMarketData', () => ({
  fetchJupiterQuoteDepth: jest.fn(() => new Promise(() => {})),
}));

const SolTradePage = require('../SolTradePage').default;

describe('SolTradePage execution truth', () => {
  it('shows native SOL execution status without BSC auto wording', () => {
    render(<SolTradePage />);

    expect(screen.getByText('Manual spot via Jupiter')).toBeInTheDocument();
    expect(screen.getByText('OTA assisted only')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'SOL OTA Execution Status' })).toBeInTheDocument();
    expect(screen.getByText('Ready with Phantom signature')).toBeInTheDocument();
    expect(screen.getByText('Analysis/proposal only')).toBeInTheDocument();
    expect(screen.getByText('Disabled until delegation exists')).toBeInTheDocument();
    expect(screen.queryByText(/OTA Auto pe BSC/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('sol-swap-panel')).toBeInTheDocument();
  });

  it('prepares an OTA assisted draft into the manual Jupiter swap panel', () => {
    render(<SolTradePage />);

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '0.25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Prepare wallet-signed swap' }));

    expect(screen.getByTestId('sol-swap-panel')).toHaveTextContent('Prepared SOL->USDC 0.25');
    expect(screen.getByText(/explicit Phantom signature/i)).toBeInTheDocument();
  });
});
