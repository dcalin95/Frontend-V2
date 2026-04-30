import { formatLedgerUsdDisplay } from '../otaBillingUsdDisplay';

describe('formatLedgerUsdDisplay', () => {
  it('formats zero and normal amounts', () => {
    expect(formatLedgerUsdDisplay(0)).toBe('$0.00');
    expect(formatLedgerUsdDisplay(5)).toBe('$5.00');
    expect(formatLedgerUsdDisplay(4.999)).toBe('$5.00');
  });

  it('shows micro-amounts without false zero', () => {
    expect(formatLedgerUsdDisplay(0.004)).toBe('< $0.01');
    expect(formatLedgerUsdDisplay(-0.003)).toBe('> -$0.01');
  });
});
