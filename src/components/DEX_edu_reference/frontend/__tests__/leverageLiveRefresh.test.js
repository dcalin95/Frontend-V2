import { LIVE_POSITIONS_POLL_MS } from '../constants/leverageLiveRefresh';
import { CFD_TP_SL_ONCHAIN_SUPPORTED } from '../utils/leverageUtils';

describe('leverage live refresh policy', () => {
  test('poll interval is moderate (not sub-second)', () => {
    expect(LIVE_POSITIONS_POLL_MS).toBeGreaterThanOrEqual(15000);
    expect(LIVE_POSITIONS_POLL_MS).toBeLessThanOrEqual(120000);
  });

  test('LeverageTradingV2 exposes TP/SL fields; execution still needs keeper/user tx', () => {
    expect(CFD_TP_SL_ONCHAIN_SUPPORTED).toBe(true);
  });
});
