import {
  getFiatConvertOrderUiVariant,
  getFiatConvertPendingDetailMessage,
  sortFiatConvertOrdersNewestFirst,
  describeUserVaultBnbDepositFeasibility,
} from '../fiatConvertOrderUi';

describe('getFiatConvertOrderUiVariant', () => {
  test('pending + relayer_insufficient_bnb → pending_relayer_low', () => {
    const v = getFiatConvertOrderUiVariant({
      status: 'pending',
      processor_note: 'relayer_insufficient_bnb',
      token_out: 'bnb',
    });
    expect(v.variant).toBe('pending_relayer_low');
  });

  test('pending + relayer_insufficient_usdt / gas → pending_relayer_low', () => {
    expect(
      getFiatConvertOrderUiVariant({
        status: 'pending',
        processor_note: 'relayer_insufficient_usdt',
        token_out: 'usdt',
      }).variant,
    ).toBe('pending_relayer_low');
    expect(
      getFiatConvertOrderUiVariant({
        status: 'pending',
        processor_note: 'relayer_insufficient_gas',
        token_out: 'usdt',
      }).variant,
    ).toBe('pending_relayer_low');
  });

  test('pending normal → pending', () => {
    const v = getFiatConvertOrderUiVariant({ status: 'pending', token_out: 'bnb' });
    expect(v.variant).toBe('pending');
  });

  test('completed / failed', () => {
    expect(getFiatConvertOrderUiVariant({ status: 'completed', token_out: 'bnb' }).variant).toBe('completed');
    expect(getFiatConvertOrderUiVariant({ status: 'failed', token_out: 'bnb' }).variant).toBe('failed');
  });
});

describe('getFiatConvertPendingDetailMessage', () => {
  test('mapare după processor_note și token_out', () => {
    expect(
      getFiatConvertPendingDetailMessage({
        status: 'pending',
        processor_note: 'relayer_insufficient_usdt',
        token_out: 'usdt',
      }),
    ).toMatch(/USDT \(BEP20\)/i);
    expect(
      getFiatConvertPendingDetailMessage({
        status: 'pending',
        processor_note: 'relayer_insufficient_gas',
        token_out: 'usdt',
      }),
    ).toMatch(/gas/i);
    expect(
      getFiatConvertPendingDetailMessage({ status: 'pending', token_out: 'usdt' }),
    ).toMatch(/USDT \(BEP20 on BSC\)/i);
  });
});

describe('sortFiatConvertOrdersNewestFirst', () => {
  test('ordonează după completed_at apoi created_at', () => {
    const a = { id: 1, created_at: '2020-01-01', completed_at: '2020-01-02' };
    const b = { id: 2, created_at: '2020-01-03', completed_at: '2020-01-04' };
    expect(sortFiatConvertOrdersNewestFirst([a, b])[0].id).toBe(2);
  });
});

describe('describeUserVaultBnbDepositFeasibility', () => {
  test('deposit nativ user OK; direct executor → contract nou', () => {
    const d = describeUserVaultBnbDepositFeasibility();
    expect(d.userDepositNativeBnbSupported).toBe(true);
    expect(d.vaultCreditsMsgSenderOnly).toBe(true);
    expect(d.directExecutorToUserVaultFeasible).toBe('needs_contract_change');
  });
});
