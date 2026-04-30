import LeverageTradingV2ABI, { CFDPositionTupleV2 } from '../LeverageTradingV2ABI';

describe('LeverageTradingV2ABI', () => {
  const names = (frag) => frag.filter((x) => x.type === 'function' || x.type === 'event').map((x) => x.name);

  it('conține funcțiile TP/SL, bankrupt și preview', () => {
    const fn = names(LeverageTradingV2ABI);
    expect(fn).toEqual(expect.arrayContaining([
      'openCFDPositionWithTPSL',
      'setCFDTakeProfitStopLoss',
      'triggerCFDCloseIfTPSL',
      'triggerCFDCloseIfBankrupt',
      'getCFDSettlementPreview',
      'getCFDPosition'
    ]));
  });

  it('tuple CFD V2 are câmpurile takeProfitPrice și stopLossPrice', () => {
    const fields = CFDPositionTupleV2.map((f) => f.name);
    expect(fields).toContain('takeProfitPrice');
    expect(fields).toContain('stopLossPrice');
    expect(fields).toContain('leverageBps');
  });

  it('emit evenimente colateral, spot liquidated, CFD', () => {
    const ev = names(LeverageTradingV2ABI);
    expect(ev).toEqual(expect.arrayContaining([
      'CollateralAdded',
      'CollateralRemoved',
      'SpotPositionLiquidated',
      'CFDTakeProfitStopLossSet',
      'CFDTriggeredClose'
    ]));
  });
});
