import LeverageTradingABI from '../../../../abi/LeverageTradingABI.js';

describe('LeverageTradingABI events', () => {
  const events = LeverageTradingABI.filter((x) => x.type === 'event').map((x) => x.name);

  test('includes spot and CFD events for filters', () => {
    expect(events).toEqual(
      expect.arrayContaining(['PositionOpened', 'PositionClosed', 'CFDPositionOpened', 'CFDPositionClosed']),
    );
  });

  test('LeverageTradingV2 emits colateral și TP/SL', () => {
    expect(events).toEqual(
      expect.arrayContaining(['CollateralAdded', 'CollateralRemoved', 'CFDTakeProfitStopLossSet', 'CFDTriggeredClose']),
    );
  });
});
