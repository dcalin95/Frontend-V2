import React from 'react';
import { render, screen } from '@testing-library/react';
import LeveragePositionsTable from '../components/leverage/LeveragePositionsTable';
import { ethers } from 'ethers';

const spotPos = [
  {
    positionId: '1',
    collateralToken: '0x1111111111111111111111111111111111111111',
    borrowedToken: '0x2222222222222222222222222222222222222222',
    collateralAmount: ethers.utils.parseUnits('1', 18).toString(),
    borrowedAmount: ethers.utils.parseUnits('2', 18).toString(),
    leverageRatio: '50000',
    entryPrice: ethers.utils.parseEther('1').toString(),
    liquidationPrice: ethers.utils.parseEther('0.5').toString(),
    isActive: true,
  },
];

describe('LeveragePositionsTable collateral column', () => {
  test('shows Manage when showSpotCollateralUi', () => {
    render(
      <LeveragePositionsTable
        mode="spot"
        positions={spotPos}
        cfdPositions={[]}
        loading={false}
        BPS_DENOMINATOR={10000}
        getTokenDecimals={() => 18}
        onClose={() => {}}
        onCloseCFD={() => {}}
        txPending={false}
        isDemoMode={false}
        liveTradingBlocked={false}
        chainGatePending={false}
        showSpotCollateralUi
        onManageSpotCollateral={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /manage/i })).toBeTruthy();
  });

  test('hides Manage label for demo (dash)', () => {
    render(
      <LeveragePositionsTable
        mode="spot"
        positions={spotPos}
        cfdPositions={[]}
        loading={false}
        BPS_DENOMINATOR={10000}
        getTokenDecimals={() => 18}
        onClose={() => {}}
        onCloseCFD={() => {}}
        txPending={false}
        isDemoMode
        liveTradingBlocked={false}
        chainGatePending={false}
        showSpotCollateralUi={false}
        onManageSpotCollateral={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: /manage/i })).toBeNull();
  });
});
