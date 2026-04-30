import { BITS_FIAT_BALANCE_REFRESH, requestFiatBalanceRefresh } from '../fiatBalanceEvents';

describe('fiatBalanceEvents', () => {
  test('requestFiatBalanceRefresh emite evenimentul documentat', () => {
    const fn = jest.fn();
    window.addEventListener(BITS_FIAT_BALANCE_REFRESH, fn);
    requestFiatBalanceRefresh();
    expect(fn).toHaveBeenCalledTimes(1);
    window.removeEventListener(BITS_FIAT_BALANCE_REFRESH, fn);
  });
});
