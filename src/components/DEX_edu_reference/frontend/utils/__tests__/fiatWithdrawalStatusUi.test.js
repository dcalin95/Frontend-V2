import { formatFiatWithdrawalStatusLabel, fiatWithdrawalDetailLine } from '../fiatWithdrawalStatusUi';

describe('fiatWithdrawalStatusUi', () => {
  test('formatFiatWithdrawalStatusLabel', () => {
    expect(formatFiatWithdrawalStatusLabel('queued')).toContain('Queued');
    expect(formatFiatWithdrawalStatusLabel('failed')).toContain('Failed');
  });

  test('fiatWithdrawalDetailLine', () => {
    expect(fiatWithdrawalDetailLine({ failure_reason: 'x' })).toBe('x');
    expect(fiatWithdrawalDetailLine({ processor_note: 'n' })).toBe('n');
  });
});
