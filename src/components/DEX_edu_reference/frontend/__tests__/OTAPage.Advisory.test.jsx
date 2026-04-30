/**
 * OTAPage (Advisory mode) – test structură/regresie (randare + link Swap + MarketAnalysis).
 *
 * ATENȚIE: Acest test folosește MOCK-uri (hooks, API, componente). Nu dovedește date reale
 * sau răspunsuri reale de la backend. Validare REALĂ = fără mock, fără date false:
 * scripts/ota-smoke-checklist.md + backend live + flux real. Vezi docs/DATA_POLICY.md.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dex-edu/ota', search: '?mode=advisory' })
}));

jest.mock('../hooks/useOTAMode', () => ({
  useOTAMode: () => ({ currentMode: 'advisory' })
}));

jest.mock('../hooks/useOTAAccess', () => ({
  useOTAAccess: () => ({
    isRegistered: true,
    isLoading: false,
    error: null,
    hasFullAccess: true,
    isPreviewMode: false,
    accessLevel: 'full',
    register: jest.fn(),
    isRegistering: false
  })
}));

jest.mock('../hooks/useContractDeploymentStatus', () => ({
  useContractDeploymentStatus: () => ({ isNotDeployed: false, detailedMessage: null })
}));

jest.mock('../context/DexAuthContext', () => ({
  useDexAuth: () => ({
    walletAddress: '0x1234',
    isAuthenticated: true,
    user: { id: 'u1', walletAddress: '0x1234' }
  })
}));

jest.mock('../services/aiTradingApiService', () => ({
  analyzeMarket: jest.fn(() => Promise.resolve({ signal: 'hold', confidence: 0.5, reasoning: 'Test' })),
  getOTAHealth: jest.fn(() => Promise.resolve({ status: 'ok' }))
}));

jest.mock('../utils/otaOutcomesHelper', () => ({
  loadOutcomesForAnalyze: jest.fn(() => Promise.resolve([])),
  buildAnalyzeOptions: jest.fn(() => ({}))
}));

// Mock OTA components that pull in wagmi/heavy deps
jest.mock('../../ota/OTAAccessControl.jsx', () => ({ __esModule: true, default: () => null }));
jest.mock('../../ota/OTASettingsPanel.jsx', () => ({ __esModule: true, default: () => null }));
jest.mock('../components/common/OTATutorial', () => ({ __esModule: true, default: () => null }));
jest.mock('../components/ai-trading/OTATradingModeHeaderDropdown', () => ({ __esModule: true, default: () => null }));
jest.mock('../components/ai-trading/OTALogo', () => ({ __esModule: true, default: () => null }));

jest.mock('../components/ai-trading/MarketAnalysis', () => {
  const React = require('react');
  const MockMarketAnalysis = ({ onExecuteSwap }) =>
    React.createElement(
      'div',
      { 'data-testid': 'market-analysis' },
      React.createElement('span', null, 'Get AI signal'),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onExecuteSwap && onExecuteSwap('BTC', 'USDT', '0.01') },
        'Execute Recommended Swap'
      )
    );
  return { __esModule: true, default: MockMarketAnalysis };
});

const OTAPage = require('../pages/OTAPage').default;
const { BackendStatusProvider } = require('../context/BackendStatusContext');

function renderOTAPage() {
  return render(
    <MemoryRouter initialEntries={['/dex-edu/ota?mode=advisory']}>
      <BackendStatusProvider>
        <Routes>
          <Route path="/dex-edu/ota" element={<OTAPage />} />
        </Routes>
      </BackendStatusProvider>
    </MemoryRouter>
  );
}

describe('OTAPage Advisory', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('randează OTA cu mod advisory vizibil', async () => {
    renderOTAPage();
    await waitFor(() => {
      expect(screen.getByText(/Live Analysis/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('group', { name: /analysis mode/i })).toBeInTheDocument();
    expect(screen.getAllByText(/OTA Engine/i).length).toBeGreaterThan(0);
  });

  it('conține link către Swap pentru execuție semnal', async () => {
    renderOTAPage();
    await waitFor(() => {
      const links = screen.getAllByRole('link', { name: /Swap/i });
      const swapLink = links.find((l) => l.getAttribute('href') === '/dex-edu/swap');
      expect(swapLink).toBeDefined();
      expect(swapLink).toBeInTheDocument();
    });
  });

  it('randează secțiunea Get AI signal (MarketAnalysis)', async () => {
    renderOTAPage();
    await waitFor(() => {
      expect(screen.getByTestId('market-analysis')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getAllByText('Get AI signal').length).toBeGreaterThan(0);
  });

  it('Execute on Swap apelează navigate cu from, to și amount', async () => {
    renderOTAPage();
    await waitFor(() => {
      expect(screen.getByTestId('market-analysis')).toBeInTheDocument();
    });
    const btn = screen.getByRole('button', { name: /Execute Recommended Swap/i });
    btn.click();
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/\/dex-edu\/swap\?/));
    // Mock MarketAnalysis calls onExecuteSwap('BTC', 'USDT', '0.01')
    expect(mockNavigate.mock.calls[0][0]).toContain('from=BTC');
    expect(mockNavigate.mock.calls[0][0]).toContain('to=USDT');
    expect(mockNavigate.mock.calls[0][0]).toContain('amount=0.01');
  });
});
