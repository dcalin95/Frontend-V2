/**
 * Verifică dezactivarea acțiunilor live când rețeaua nu e potrivită (fără integrare wallet).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import LeverageSpotForm from '../components/leverage/LeverageSpotForm';

const tokenOptions = [
  { symbol: 'BNB', address: '0x0000000000000000000000000000000000000000' },
  { symbol: 'USDT', address: '0x1111111111111111111111111111111111111111' },
];

function renderSpot(overrides = {}) {
  const props = {
    collateralToken: tokenOptions[0].address,
    setCollateralToken: () => {},
    borrowedToken: tokenOptions[1].address,
    setBorrowedToken: () => {},
    amount: '1',
    setAmount: () => {},
    leverageBps: 50000,
    setLeverageBps: () => {},
    vaultBalanceFormatted: '10',
    onMax: () => {},
    sameToken: false,
    isConnected: true,
    connectWallet: () => {},
    tokenOptions,
    onOpen: () => {},
    contractReady: true,
    spotAvailable: true,
    txPending: false,
    walletAddress: '0xabc',
    isDemoMode: false,
    liveTradingBlocked: false,
    chainGatePending: false,
    ...overrides,
  };
  return render(<LeverageSpotForm {...props} />);
}

describe('LeverageSpotForm live gate', () => {
  test('Open position enabled when live trading not blocked', () => {
    renderSpot();
    const btn = screen.getByRole('button', { name: /open position$/i });
    expect(btn.disabled).toBe(false);
  });

  test('button shows Switch to BSC when liveTradingBlocked', () => {
    renderSpot({ liveTradingBlocked: true, chainGatePending: false });
    const btn = screen.getByRole('button', { name: /switch to bsc to trade/i });
    expect(btn.disabled).toBe(true);
  });

  test('button shows Checking network when chain pending', () => {
    renderSpot({ liveTradingBlocked: true, chainGatePending: true });
    const btn = screen.getByRole('button', { name: /checking network/i });
    expect(btn.disabled).toBe(true);
  });

  test('demo mode shows Open position (Demo) when not blocked (parent passes liveTradingBlocked false)', () => {
    renderSpot({ isDemoMode: true, liveTradingBlocked: false });
    const btn = screen.getByRole('button', { name: /open position \(demo\)/i });
    expect(btn.disabled).toBe(false);
  });
});
