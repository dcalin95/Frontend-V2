/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FiatConvertPanel from '../FiatConvertPanel';
import * as fiatConvertService from '../../../services/fiatConvertService';
import { BITS_FIAT_BALANCE_REFRESH } from '../../../utils/fiatBalanceEvents';

jest.mock('../../../services/fiatConvertService', () => ({
  ...jest.requireActual('../../../services/fiatConvertService'),
  getConvertQuote: jest.fn(),
  getConvertOrders: jest.fn(),
  createConvertOrder: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), info: jest.fn() },
}));

function renderPanel(orders) {
  fiatConvertService.getConvertOrders.mockResolvedValue({ orders });
  fiatConvertService.getConvertQuote.mockResolvedValue({
    ok: true,
    estimatedOutputFormatted: '0.05',
    inputAmount: 20,
    inputCurrency: 'eur',
    targetToken: 'bnb',
    executionAvailable: true,
    bnbExecution: { notUserVault: true },
  });
  return render(
    <MemoryRouter>
      <FiatConvertPanel
        stripeBalanceEur={100}
        stripeBalanceUsd={0}
        walletAddress="0x1234567890123456789012345678901234567890"
        isConnected
      />
    </MemoryRouter>,
  );
}

describe('FiatConvertPanel post-convert flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('completed BNB → CTA Deposit to UserVault și wording wallet, nu vault credit', async () => {
    renderPanel([
      {
        id: 'o1',
        status: 'completed',
        token_out: 'bnb',
        amount_fiat: 20,
        currency: 'eur',
        amount_out: 0.05,
        created_at: '2026-01-01',
        completed_at: '2026-01-02',
      },
    ]);
    expect(await screen.findByText(/BNB sent to your connected BSC wallet/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Not deposited into UserVault yet/i).length).toBeGreaterThanOrEqual(1);
    const link = screen.getByRole('link', { name: /Deposit BNB to UserVault/i });
    expect(link).toHaveAttribute('href', '/dex-edu/leverage?tab=deposit');
  });

  test('completed USDT only → banner USDT wallet, fără CTA Deposit BNB', async () => {
    renderPanel([
      {
        id: 'u1',
        status: 'completed',
        token_out: 'usdt',
        amount_fiat: 20,
        currency: 'eur',
        amount_out: 18,
      },
    ]);
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /Deposit BNB to UserVault/i })).toBeNull();
      expect(screen.queryByText(/^BNB sent to your connected BSC wallet\.$/i)).toBeNull();
      expect(screen.getByText(/USDT \(BEP20\) sent to your connected BSC wallet/i)).toBeInTheDocument();
      expect(
        screen.getByText(/USDT \(BEP20\) was sent to your connected BSC wallet — not into UserVault/i),
      ).toBeInTheDocument();
    });
  });

  test('pending USDT + relayer_insufficient_gas → copy dedicată', async () => {
    renderPanel([
      {
        id: 'pg1',
        status: 'pending',
        token_out: 'usdt',
        processor_note: 'relayer_insufficient_gas',
        amount_fiat: 20,
        currency: 'eur',
        amount_out: 18,
      },
    ]);
    expect(
      await screen.findByText(/needs more BNB on BSC for gas/i),
    ).toBeInTheDocument();
  });

  test('BITS_FIAT_BALANCE_REFRESH reîncarcă lista de orders', async () => {
    fiatConvertService.getConvertOrders.mockResolvedValue({ orders: [] });
    fiatConvertService.getConvertQuote.mockResolvedValue({
      ok: true,
      estimatedOutputFormatted: '0.05',
      inputAmount: 20,
      inputCurrency: 'eur',
      targetToken: 'bnb',
      executionAvailable: true,
      bnbExecution: { notUserVault: true },
    });
    render(
      <MemoryRouter>
        <FiatConvertPanel
          stripeBalanceEur={100}
          stripeBalanceUsd={0}
          walletAddress="0x1234567890123456789012345678901234567890"
          isConnected
        />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(fiatConvertService.getConvertOrders).toHaveBeenCalledTimes(1);
    });
    fiatConvertService.getConvertOrders.mockResolvedValue({
      orders: [{ id: 'x1', status: 'pending', token_out: 'bnb', amount_fiat: 10, currency: 'eur' }],
    });
    window.dispatchEvent(new CustomEvent(BITS_FIAT_BALANCE_REFRESH));
    await waitFor(() => {
      expect(fiatConvertService.getConvertOrders).toHaveBeenCalledTimes(2);
    });
  });

  test('pending + relayer_insufficient_bnb → copy de coadă / fonduri relayer', async () => {
    renderPanel([
      {
        id: 'p1',
        status: 'pending',
        token_out: 'bnb',
        processor_note: 'relayer_insufficient_bnb',
        amount_fiat: 20,
        currency: 'eur',
        amount_out: 0.05,
      },
    ]);
    expect(
      await screen.findByText(/Waiting to send — the platform wallet needs more BNB/i),
    ).toBeInTheDocument();
  });
});
