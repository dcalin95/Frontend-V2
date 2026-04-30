import { computeOtaHeaderLiveGo } from '../otaAutoHeaderLiveGo';

describe('computeOtaHeaderLiveGo', () => {
  const base = {
    isRegistered: true,
    botAuthorizations: [{ botAddress: '0xBot', effectiveActive: true }],
    executorBotAddress: '0xBot',
    policy: { enabled: true },
    autoExecutionStatus: {
      executorFunctional: true,
      otaAutoClarity: {
        chainPolicyEnabled: true,
        backendSessionRegistered: true,
        safetyBlockedBsc: false,
      },
    },
    guards: {
      level66: { decision: { allowAutoStart: true } },
      level73: { decision: { allowAutoStart: true } },
      level74: { decision: { allowAutoStart: true } },
    },
  };

  it('liveGo când toate condițiile sunt îndeplinite', () => {
    const { liveGo, reasons } = computeOtaHeaderLiveGo(base);
    expect(liveGo).toBe(true);
    expect(reasons).toEqual([]);
  });

  it('chain ON + backend session missing: motiv explicit și liveGo false', () => {
    const { liveGo, reasons } = computeOtaHeaderLiveGo({
      ...base,
      autoExecutionStatus: {
        executorFunctional: true,
        otaAutoClarity: {
          chainPolicyEnabled: true,
          backendSessionRegistered: false,
          safetyBlockedBsc: false,
        },
      },
    });
    expect(liveGo).toBe(true);
    expect(reasons).toContain('chain policy ON but backend session not registered (reload or policy/get)');
  });

  it('backend session ON + chain OFF: motiv explicit', () => {
    const { reasons } = computeOtaHeaderLiveGo({
      ...base,
      autoExecutionStatus: {
        executorFunctional: true,
        otaAutoClarity: {
          chainPolicyEnabled: false,
          backendSessionRegistered: true,
          safetyBlockedBsc: false,
        },
      },
    });
    expect(reasons).toContain('backend session active but chain policy OFF — sync on-chain or stop session');
  });

  it('worker down: executorFunctional false', () => {
    const { liveGo, reasons } = computeOtaHeaderLiveGo({
      ...base,
      autoExecutionStatus: {
        ...base.autoExecutionStatus,
        executorFunctional: false,
      },
    });
    expect(liveGo).toBe(false);
    expect(reasons).toContain('executor worker not running');
  });

  it('nu confundă latest analysis cu decizie executor (semantica separată rămâne în API; header nu folosește analysis_results)', () => {
    const { reasons } = computeOtaHeaderLiveGo(base);
    expect(reasons.some((r) => /analysis/i.test(r))).toBe(false);
  });
});
