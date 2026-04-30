import { deriveSeiAutoReadinessFromApiPayload, seiAutoReadinessHint } from '../utils/seiAutoReadiness';

describe('deriveSeiAutoReadinessFromApiPayload', () => {
  const base = { enabled: false };

  it('legacy API: supported null, executionReady null, legacyApi true', () => {
    const r = deriveSeiAutoReadinessFromApiPayload({ success: true, enabled: false }, base);
    expect(r.supported).toBeNull();
    expect(r.executionReady).toBeNull();
    expect(r.legacyApi).toBe(true);
  });

  it('readiness object: executionReady and blockReason', () => {
    const r = deriveSeiAutoReadinessFromApiPayload(
      {
        readiness: {
          supported: true,
          quoteReady: true,
          strategyReady: true,
          walletReady: true,
          executionReady: false,
          blockReason: 'quote_unavailable',
        },
      },
      { enabled: true }
    );
    expect(r.supported).toBe(true);
    expect(r.executionReady).toBe(false);
    expect(r.blockReason).toBe('quote_unavailable');
    expect(r.legacyApi).toBe(false);
  });

  it('supported false in readiness nested', () => {
    const r = deriveSeiAutoReadinessFromApiPayload(
      { readiness: { supported: false, blockReason: 'unsupported' } },
      { enabled: true }
    );
    expect(r.supported).toBe(false);
    expect(r.executionReady).toBe(false);
    expect(r.blockReason).toBe('unsupported');
  });

  it('seiAutoExecutionSupported false', () => {
    const r = deriveSeiAutoReadinessFromApiPayload(
      { seiAutoExecutionSupported: false, seiAutoBlockReason: 'bot_not_configured' },
      { enabled: false }
    );
    expect(r.supported).toBe(false);
    expect(r.executionReady).toBe(false);
    expect(r.blockReason).toBe('bot_not_configured');
  });

  it('seiAutoExecutionSupported true with explicit executionReady', () => {
    const r = deriveSeiAutoReadinessFromApiPayload(
      {
        seiAutoExecutionSupported: true,
        executionReady: true,
        botWalletConfigured: true,
        quoteReadyForPreferredPair: true,
      },
      { enabled: true }
    );
    expect(r.supported).toBe(true);
    expect(r.executionReady).toBe(true);
    expect(r.quoteReady).toBe(true);
    expect(r.legacyApi).toBe(false);
  });

  it('pair-aware: preferredPairQuoted passed through', () => {
    const r = deriveSeiAutoReadinessFromApiPayload(
      { readiness: { supported: true, executionReady: true, preferredPairQuoted: 'SEI/USDC' } },
      { enabled: true }
    );
    expect(r.preferredPairQuoted).toBe('SEI/USDC');
  });
});

describe('seiAutoReadinessHint', () => {
  it('null for legacy when session off', () => {
    expect(
      seiAutoReadinessHint({
        legacyApi: true,
        autoEnabled: false,
      })
    ).toBeNull();
  });

  it('message when legacy and session on', () => {
    const h = seiAutoReadinessHint({ legacyApi: true, autoEnabled: true });
    expect(h).toMatch(/did not report/i);
  });

  it('unsupported message', () => {
    const h = seiAutoReadinessHint({
      supported: false,
      blockReason: 'unsupported',
      autoEnabled: false,
    });
    expect(h).toMatch(/not available/i);
  });

  it('enabled but not execution ready', () => {
    const h = seiAutoReadinessHint({
      legacyApi: false,
      supported: true,
      autoEnabled: true,
      executionReady: false,
      blockReason: 'worker_inactive',
    });
    expect(h).toMatch(/worker inactive/i);
  });
});
