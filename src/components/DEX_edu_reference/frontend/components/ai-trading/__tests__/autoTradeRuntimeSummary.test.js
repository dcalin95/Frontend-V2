import { deriveAutoTradeRuntimeSummary } from '../autoTradeRuntimeSummary';

describe('deriveAutoTradeRuntimeSummary', () => {
  it('does not tell a connected wallet user to connect wallet when backend status is missing', () => {
    const summary = deriveAutoTradeRuntimeSummary({
      autoExecutionStatus: null,
      autoStatusError: { status: 504, message: 'timeout' },
      policyEnabled: true,
      walletAddress: '0xabc',
    });

    expect(summary.headline).toMatch(/Auto status API/i);
    expect(summary.summary).toMatch(/Wallet is connected/i);
    expect(summary.summary).not.toMatch(/Connect the wallet/i);
  });

  it('prioritizes a stopped backend loop', () => {
    const summary = deriveAutoTradeRuntimeSummary({
      autoExecutionStatus: {
        enabled: true,
        isRunning: false,
        diagnostic: { userInQueue: true },
      },
      policyEnabled: true,
      walletAddress: '0xabc',
    });

    expect(summary.tone).toBe('danger');
    expect(summary.headline).toMatch(/Monitoring loop is stopped/i);
    expect(summary.cards.find((card) => card.label === 'Auto loop')?.value).toBe('Stopped');
  });

  it('surfaces a missing executor queue registration for the wallet', () => {
    const summary = deriveAutoTradeRuntimeSummary({
      autoExecutionStatus: {
        enabled: true,
        isRunning: true,
        diagnostic: { userInQueue: false },
      },
      policyEnabled: true,
      walletAddress: '0xabc',
    });

    expect(summary.tone).toBe('warning');
    expect(summary.headline).toMatch(/not in the executor queue/i);
    expect(summary.cards.find((card) => card.label === 'Executor queue')?.value).toBe('Missing wallet');
  });

  it('uses policy/get as fallback when auto-status clarity cannot confirm chain policy', () => {
    const summary = deriveAutoTradeRuntimeSummary({
      autoExecutionStatus: {
        enabled: true,
        isRunning: true,
        diagnostic: { userInQueue: true },
        otaAutoClarity: { chainPolicyEnabled: null, safetyBlockedBsc: false },
      },
      policyEnabled: true,
      walletAddress: '0xabc',
    });

    expect(summary.cards.find((card) => card.label === 'Chain policy')?.value).toBe('Enabled (policy/get)');
  });

  it('explains a clear BSC safety gate with source-level detail', () => {
    const summary = deriveAutoTradeRuntimeSummary({
      autoExecutionStatus: {
        enabled: true,
        isRunning: true,
        diagnostic: { userInQueue: true },
        otaAutoClarity: { chainPolicyEnabled: true, safetyBlockedBsc: false },
      },
      policyEnabled: true,
      walletAddress: '0xabc',
    });

    expect(summary.cards.find((card) => card.label === 'Safety gate')?.value).toBe(
      'Clear: BSC stopAll/chain stop not active',
    );
  });

  it('keeps per-token executor decisions out of the global blocker headline', () => {
    const summary = deriveAutoTradeRuntimeSummary({
      autoExecutionStatus: {
        enabled: true,
        isRunning: true,
        diagnostic: { userInQueue: true },
        latestAnalysisSignal: { signal: 'buy', confidence: 0.6 },
        latestExecutorDecision: { token: 'SOL', final_action: 'open_blocked', final_reason: 'no_quote_capital_in_vault_for_open_candidate' },
      },
      policyEnabled: true,
      walletAddress: '0xabc',
    });

    expect(summary.tone).toBe('warning');
    expect(summary.headline).toMatch(/Latest analysis signal/i);
    expect(summary.headline).not.toMatch(/executor block/i);
    expect(summary.cards.find((card) => card.label === 'Latest signal')?.value).toBe('BUY 60%');
    expect(summary.cards.find((card) => card.label === 'Latest recorded executor')?.value).toMatch(/^SOL · open_blocked/);
  });
});
