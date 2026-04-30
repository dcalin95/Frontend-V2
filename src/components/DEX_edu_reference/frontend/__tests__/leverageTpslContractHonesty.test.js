import { CFD_TP_SL_ONCHAIN_SUPPORTED } from '../utils/leverageUtils';
import LeverageTradingABI from '../../../../abi/LeverageTradingABI.js';

describe('TP/SL on-chain honesty', () => {
  test('CFD_TP_SL_ONCHAIN_SUPPORTED is true (LeverageTradingV2)', () => {
    expect(CFD_TP_SL_ONCHAIN_SUPPORTED).toBe(true);
  });

  test('ABI include TP/SL și trigger close', () => {
    const fns = LeverageTradingABI.filter((x) => x.type === 'function').map((x) => x.name).join(' ');
    expect(/openCFDPositionWithTPSL|setCFDTakeProfitStopLoss|triggerCFDCloseIfTPSL/i.test(fns)).toBe(true);
  });
});
