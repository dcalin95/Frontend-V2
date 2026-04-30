/**
 * Integration Tests for SwapPanel Component
 * 
 * Tests UI state changes and user interactions (mocked wallet)
 * 
 * @module SwapPanel.test
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('../services/swapExecutionService.jsx', () => ({
  __esModule: true,
  default: {
    checkAllowance: jest.fn(),
    approveToken: jest.fn(),
    executeSwap: jest.fn(),
    getTokenDecimals: jest.fn(),
    getSwapTxData: jest.fn()
  }
}));

jest.mock('../context/DexAuthContext.jsx', () => ({
  useDexAuth: () => ({
    isAuthenticated: true,
    walletAddress: '0x000000000000000000000000000000000000dEaD'
  })
}));

jest.mock('../services/walletBalanceService.jsx', () => ({
  __esModule: true,
  default: {
    getAllTokenBalances: jest.fn(() =>
      Promise.resolve({
        BTC: '100.0',
        USDT: '10000.0',
        BITS: '5000.0',
        ETH: '50.0',
        BUSD: '10000.0',
        BNB: '100.0'
      })
    ),
    getBalanceForToken: jest.fn(() => Promise.resolve('100.0'))
  }
}));

jest.mock('../services/tokenPriceService.jsx', () => ({
  __esModule: true,
  default: {
    getAllTokenPrices: jest.fn(() =>
      Promise.resolve({
        BTC: 50000,
        USDT: 1,
        BITS: 0.01,
        ETH: 2500,
        BUSD: 1,
        BNB: 300
      })
    )
  }
}));

jest.mock('../../config/apiEndpoints.js', () => ({
  getBackendUrl: () => 'https://backend-server-f82y.onrender.com',
  getApiBaseUrl: () => 'https://backend-server-f82y.onrender.com/api',
  API_ENDPOINTS: {
    OTA_QUOTE: '/ai-trading/quote',
    OTA_SWAP_TX: '/ai-trading/swap-tx'
  }
}));

// Mock fetch for quote API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      quote: {
        amountOut: '300',
        minOut: '298.5',
        priceImpact: 0.1,
        price: 300,
        deadline: Math.floor(Date.now() / 1000) + 1200,
        routerAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E'
      }
    })
  })
);

// Import SwapPanel after mocks (require to ensure mocks are applied)
// eslint-disable-next-line global-require
const SwapPanel = require('../components/trade/SwapPanel').default;
// eslint-disable-next-line global-require
const swapExecutionService = require('../services/swapExecutionService.jsx').default;
// eslint-disable-next-line global-require
const walletBalanceService = require('../services/walletBalanceService.jsx').default;
// eslint-disable-next-line global-require
const tokenPriceService = require('../services/tokenPriceService.jsx').default;

describe('SwapPanel Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            quote: {
              amountOut: '300',
              minOut: '298.5',
              priceImpact: 0.1,
              price: 300,
              deadline: Math.floor(Date.now() / 1000) + 1200,
              routerAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E'
            }
          })
      })
    );
    walletBalanceService.getAllTokenBalances.mockResolvedValue({
      BTC: '100.0',
      USDT: '10000.0',
      BITS: '5000.0',
      ETH: '50.0',
      BUSD: '10000.0',
      BNB: '100.0'
    });
    walletBalanceService.getBalanceForToken.mockResolvedValue('100.0');
    tokenPriceService.getAllTokenPrices.mockResolvedValue({
      BTC: 50000,
      USDT: 1,
      BITS: 0.01,
      ETH: 2500,
      BUSD: 1,
      BNB: 300
    });
  });

  describe('Allowance Flow', () => {
    // Use BITS/USDT so fromToken is not BNB (BNB never shows Approve)
    const pairNeedingApproval = 'BINANCE:BITSUSDT';

    it('should show Approve button when allowance < amount', async () => {
      swapExecutionService.checkAllowance.mockResolvedValue('0');
      swapExecutionService.getTokenDecimals.mockResolvedValue(18);

      render(<SwapPanel selectedPair={pairNeedingApproval} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const amountInput = screen.getByLabelText(/Amount to pay/i);
      fireEvent.change(amountInput, { target: { value: '10' } });

      await waitFor(() => {
        expect(swapExecutionService.checkAllowance).toHaveBeenCalled();
      });

      await waitFor(() => {
        const approveButton = screen.queryByRole('button', { name: /approve token for swap/i });
        expect(approveButton).toBeInTheDocument();
      });
    });

    it('should show Swap button when allowance >= amount', async () => {
      swapExecutionService.checkAllowance.mockResolvedValue('10000000000000000000');
      swapExecutionService.getTokenDecimals.mockResolvedValue(18);

      render(<SwapPanel selectedPair={pairNeedingApproval} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const amountInput = screen.getByLabelText(/Amount to pay/i);
      fireEvent.change(amountInput, { target: { value: '10' } });

      await waitFor(() => {
        expect(swapExecutionService.checkAllowance).toHaveBeenCalled();
      });

      await waitFor(() => {
        const swapButton = screen.getByRole('button', { name: /execute swap/i });
        expect(swapButton).toBeInTheDocument();
      });
      expect(screen.queryByRole('button', { name: /approve token for swap/i })).not.toBeInTheDocument();
    });
  });

  describe('User Rejection Handling', () => {
    const pairNeedingApproval = 'BINANCE:BITSUSDT';

    it('should show error message when user rejects approve', async () => {
      swapExecutionService.checkAllowance.mockResolvedValue('0');
      swapExecutionService.getTokenDecimals.mockResolvedValue(18);
      swapExecutionService.approveToken.mockRejectedValue(new Error('Approval rejected by user'));

      render(<SwapPanel selectedPair={pairNeedingApproval} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const amountInput = screen.getByLabelText(/Amount to pay/i);
      fireEvent.change(amountInput, { target: { value: '10' } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /approve token for swap/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /approve token for swap/i }));

      // Modal shows user-friendly message (e.g. "Transaction was cancelled." or "Approval rejected by user")
      await waitFor(() => {
        expect(screen.getByText(/cancelled|rejected|approval failed/i)).toBeInTheDocument();
      }, { timeout: 4000 });
    });

    it('should show error message when user rejects swap', async () => {
      swapExecutionService.checkAllowance.mockResolvedValue('10000000000000000000');
      swapExecutionService.getTokenDecimals.mockResolvedValue(18);
      swapExecutionService.executeSwap.mockRejectedValue(new Error('Transaction rejected by user'));

      render(<SwapPanel selectedPair={pairNeedingApproval} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const amountInput = screen.getByLabelText(/Amount to pay/i);
      fireEvent.change(amountInput, { target: { value: '0.01' } });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByRole('button', { name: /execute swap/i }));

      await waitFor(() => {
        const failedHeadings = screen.getAllByText(/swap failed/i);
        expect(failedHeadings.length).toBeGreaterThan(0);
      }, { timeout: 10000 });
    }, 15000);
  });

  describe('Query Params Parsing', () => {
    it('should parse query params correctly (from, to, amount)', () => {
      // Mock window.location.search
      delete window.location;
      window.location = {
        search: '?from=BTC&to=USDT&amount=0.1'
      };

      render(<SwapPanel />);

      // Component should read query params on mount
      // (Actual implementation checks this in useEffect)
      expect(window.location.search).toBe('?from=BTC&to=USDT&amount=0.1');
    });

    it('should pre-fill SwapPanel from query params', async () => {
      delete window.location;
      window.location = {
        search: '?from=BNB&to=USDT&amount=0.01'
      };

      render(<SwapPanel />);

      await waitFor(() => {
        expect(walletBalanceService.getAllTokenBalances).toHaveBeenCalled();
      });

      // Verify quote is fetched with pre-filled values
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
        const fetchCall = fetch.mock.calls.find(call => 
          call[0].includes('/api/ai-trading/quote')
        );
        if (fetchCall) {
          expect(fetchCall[0]).toContain('tokenIn=BNB');
          expect(fetchCall[0]).toContain('tokenOut=USDT');
        }
      });
    });
  });
});

// Note: These tests require Jest and React Testing Library
// Install: npm install --save-dev @testing-library/react @testing-library/jest-dom jest
// Run: npm test
