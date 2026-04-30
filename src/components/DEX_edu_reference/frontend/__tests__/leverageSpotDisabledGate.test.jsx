/**
 * Spot leverage UI gate: produsul poate dezactiva spot (fără ILendingPool compatibil);
 * CFD rămâne disponibil.
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import LeverageSpotForm from '../components/leverage/LeverageSpotForm';
import LeverageCFDForm from '../components/leverage/LeverageCFDForm';
import { SPOT_LEVERAGE_UI_DISABLED, SPOT_LEVERAGE_DISABLED_NOTICE } from '../constants/leverageConstants';

const tokenOptions = [
  { symbol: 'BNB', address: '0x0000000000000000000000000000000000000000' },
  { symbol: 'USDT', address: '0x1111111111111111111111111111111111111111' },
];

const marginOptions = [{ symbol: 'USDT', address: '0x1111111111111111111111111111111111111111' }];

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
    spotUiDisabled: false,
    ...overrides,
  };
  return render(<LeverageSpotForm {...props} />);
}

function renderCfd(overrides = {}) {
  const props = {
    settlementToken: marginOptions[0].address,
    setSettlementToken: () => {},
    assetId: 0,
    setAssetId: () => {},
    amount: '100',
    setAmount: () => {},
    leverageBps: 50000,
    setLeverageBps: () => {},
    isLong: true,
    setIsLong: () => {},
    vaultBalanceFormatted: '1000',
    onMax: () => {},
    isConnected: true,
    connectWallet: () => {},
    marginOptions,
    onOpen: () => {},
    contractReady: true,
    txPending: false,
    walletAddress: '0xabc',
    isDemoMode: true,
    liveTradingBlocked: false,
    chainGatePending: false,
    ...overrides,
  };
  return render(<LeverageCFDForm {...props} />);
}

describe('leverage spot disabled gate', () => {
  test('SPOT_LEVERAGE_UI_DISABLED is true (product gate)', () => {
    expect(SPOT_LEVERAGE_UI_DISABLED).toBe(true);
  });

  test('SPOT_LEVERAGE_DISABLED_NOTICE mentions ILendingPool / CFD', () => {
    expect(SPOT_LEVERAGE_DISABLED_NOTICE).toMatch(/ILendingPool/i);
    expect(SPOT_LEVERAGE_DISABLED_NOTICE).toMatch(/CFD/i);
  });

  test('spotUiDisabled shows status banner and disables open button', () => {
    renderSpot({ spotUiDisabled: true, isDemoMode: true });
    expect(screen.getByRole('status')).toHaveTextContent(/ILendingPool/i);
    const btn = screen.getByRole('button', { name: /spot temporarily unavailable/i });
    expect(btn).toBeDisabled();
  });

  test('CFD form still allows Open Long (Demo) when not blocked', () => {
    renderCfd();
    const btn = screen.getByRole('button', { name: /open long \(demo\)/i });
    expect(btn).not.toBeDisabled();
  });
});
