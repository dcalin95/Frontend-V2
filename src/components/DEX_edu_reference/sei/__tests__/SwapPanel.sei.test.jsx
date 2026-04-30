/**
 * Tests for SwapPanel.sei.jsx – SEI swap panel (contract executeSwap).
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../context/SeiWalletContext', () => ({
  useSeiWallet: () => ({
    address: 'sei1dan7dtc9mect9807kptfwu8kj3d87qm85jkjsh',
    getOfflineSigner: jest.fn(() => Promise.resolve({})),
  }),
}));

const mockExecuteSwap = jest.fn();
jest.mock('../services/seiContractService', () => ({
  executeSwap: (...args) => mockExecuteSwap(...args),
}));

const SwapPanelSei = require('../SwapPanel.sei').default;

describe('SwapPanel.sei', () => {
  beforeEach(() => {
    mockExecuteSwap.mockReset();
  });

  it('renders From/To inputs and Swap button', () => {
    render(<SwapPanelSei />);
    expect(screen.getByLabelText(/amount from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount to/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /swap/i })).toBeInTheDocument();
  });

  it('Swap button is enabled when amount entered and wallet connected', () => {
    render(<SwapPanelSei />);
    const amountInput = screen.getByLabelText(/amount from/i);
    fireEvent.change(amountInput, { target: { value: '0.1' } });
    const swapBtn = screen.getByRole('button', { name: /swap/i });
    expect(swapBtn).not.toBeDisabled();
  });

  it('calls executeSwap on Swap click and shows tx hash', async () => {
    mockExecuteSwap.mockResolvedValue({ txHash: 'abc123' });
    render(<SwapPanelSei />);
    fireEvent.change(screen.getByLabelText(/amount from/i), { target: { value: '0.1' } });
    fireEvent.click(screen.getByRole('button', { name: /swap/i }));
    await waitFor(() => {
      expect(mockExecuteSwap).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(/abc123/)).toBeInTheDocument();
    });
  });

  it('shows error when executeSwap rejects', async () => {
    mockExecuteSwap.mockRejectedValue(new Error('Contract error'));
    render(<SwapPanelSei />);
    fireEvent.change(screen.getByLabelText(/amount from/i), { target: { value: '0.1' } });
    fireEvent.click(screen.getByRole('button', { name: /swap/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/contract error/i);
    });
  });
});
