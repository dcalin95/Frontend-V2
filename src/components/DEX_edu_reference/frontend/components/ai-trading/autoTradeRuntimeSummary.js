function toPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `${Math.round(n * 100)}%`;
}

function humanizeReason(value) {
  if (!value) return 'unknown';
  const raw = String(value).trim();
  const lower = raw.toLowerCase();
  if (lower.includes('adaptive_bad_regime')) return 'adaptive guard: bad trading regime';
  if (lower.includes('loss_streak')) return 'loss streak cooldown active';
  if (lower.includes('low_confidence')) return 'confidence below open threshold';
  if (lower.includes('trade_gate')) return 'trade gate blocked the open path';
  if (lower.includes('safety')) return 'runtime safety gate blocked execution';
  return raw.replace(/_/g, ' ');
}

export function formatAdaptiveGuard(guard) {
  if (!guard?.blocked) return null;
  const parts = ['adaptive guard: bad trading regime'];
  if (Number.isFinite(Number(guard.winRatePct))) parts.push(`win-rate ${Number(guard.winRatePct).toFixed(1)}%`);
  if (Number.isFinite(Number(guard.lossStreak))) parts.push(`loss streak ${Number(guard.lossStreak)}`);
  if (Number.isFinite(Number(guard.drawdownUsd))) parts.push(`drawdown $${Number(guard.drawdownUsd).toFixed(2)}`);
  return parts.join(' - ');
}

export function deriveAutoTradeRuntimeSummary({
  autoExecutionStatus,
  autoStatusError,
  policyEnabled,
  walletAddress,
}) {
  if (!autoExecutionStatus) {
    const hasWallet = Boolean(walletAddress);
    const errorStatus = autoStatusError?.status || autoStatusError?.code || null;
    const errorMessage =
      typeof autoStatusError?.message === 'string' && autoStatusError.message.trim()
        ? autoStatusError.message.trim()
        : null;

    return {
      tone: 'warning',
      headline: autoStatusError ? 'Auto status API did not return data' : 'Server status not loaded yet',
      summary: hasWallet
        ? `Wallet is connected, but the backend auto-status payload is not loaded${errorStatus ? ` (${errorStatus})` : ''}${errorMessage ? `: ${errorMessage}` : '.'}`
        : 'Connect the wallet to load backend-confirmed Auto status.',
      cards: [],
    };
  }

  const diagnostic = autoExecutionStatus?.diagnostic || null;
  const clarity = autoExecutionStatus?.otaAutoClarity || null;
  const latestAnalysisSignal = autoExecutionStatus?.latestAnalysisSignal || null;
  const latestExecutorDecision = autoExecutionStatus?.latestExecutorDecision || null;
  const latestExecutionResult = autoExecutionStatus?.latestExecutionResult || null;
  const workerDisabled = autoExecutionStatus.enabled === false;
  const loopNotRunning = autoExecutionStatus.enabled === true && autoExecutionStatus.isRunning === false;
  const userNotInQueue = Boolean(policyEnabled && walletAddress && diagnostic?.userInQueue === false);
  const safetyRaw = clarity?.safetyBlockedBsc;
  const safetyBlocked = safetyRaw === true;
  const safetyGateValue =
    safetyRaw === true
      ? 'Blocked: BSC runtime safety stop is active'
      : safetyRaw === false
        ? 'Clear: BSC stopAll/chain stop not active'
        : 'Unknown: runtime safety check did not return data';
  const chainPolicyEnabled = clarity?.chainPolicyEnabled;
  const chainPolicyValue =
    chainPolicyEnabled === true
      ? 'Enabled'
      : chainPolicyEnabled === false
        ? 'Disabled'
        : policyEnabled === true
          ? 'Enabled (policy/get)'
          : policyEnabled === false
            ? 'Disabled (policy/get)'
            : 'Unknown';
  const signalLabel = latestAnalysisSignal?.signal
    ? String(latestAnalysisSignal.signal).toUpperCase()
    : 'none';
  const signalConfidence = toPercent(latestAnalysisSignal?.confidence);
  const latestSignalValue = signalConfidence ? `${signalLabel} ${signalConfidence}` : signalLabel;
  const adaptiveGuardText = formatAdaptiveGuard(latestAnalysisSignal?.adaptiveGuard);
  const latestDecisionValue = latestExecutorDecision?.final_action
    ? `${latestExecutorDecision?.token ? `${String(latestExecutorDecision.token).toUpperCase()} · ` : ''}${String(latestExecutorDecision.final_action)}${
        latestExecutorDecision?.final_reason ? ` · ${humanizeReason(latestExecutorDecision.final_reason)}` : ''
      }`
    : 'none';
  const latestExecutionValue = latestExecutionResult?.action_family
    ? `${String(latestExecutionResult.action_family)}${latestExecutionResult?.status ? ` · ${latestExecutionResult.status}` : ''}`
    : 'none';

  let tone = 'success';
  let headline = 'Server sees no confirmed auto-open blocker';
  let summary =
    'Auto runtime, queue, and safety all look available. If no opens happen, the latest signal is likely informational rather than promotable.';

  if (workerDisabled) {
    tone = 'danger';
    headline = 'Auto worker is disabled on the server';
    summary = 'OTA_AUTO_EXECUTION_ENABLED is off, so the backend will not run the monitoring loop or open anything new.';
  } else if (loopNotRunning) {
    tone = 'danger';
    headline = 'Monitoring loop is stopped on the backend';
    summary = 'Auto is enabled, but the executor loop is not running. No market scans or new opens can happen until the worker starts again.';
  } else if (safetyBlocked) {
    tone = 'danger';
    headline = 'Runtime safety is blocking BSC execution';
    summary = 'The worker is alive, but the live execution safety gate is active on BSC, so new opens are blocked.';
  } else if (userNotInQueue) {
    tone = 'warning';
    headline = 'This wallet is not in the executor queue';
    summary = 'The server worker is alive, but this wallet is not currently registered in the active auto queue, so it is not being scanned for opens.';
  } else if (adaptiveGuardText) {
    tone = 'danger';
    headline = `Open blocked: ${adaptiveGuardText}`;
    summary = 'The worker is running, but adaptive protection converted the latest open signal to HOLD because recent real outcomes are losing. This is a server-confirmed trading block, not a missing UI refresh.';
  } else if (latestAnalysisSignal?.signal) {
    tone = 'warning';
    headline = `Latest analysis signal: ${latestSignalValue}`;
    summary = 'The worker is scanning. Per-token executor decisions below are telemetry, not a global OTA blocker unless a runtime/queue/safety card says so.';
  }

  return {
    tone,
    headline,
    summary,
    cards: [
      {
        label: 'Auto loop',
        value: workerDisabled ? 'Disabled' : loopNotRunning ? 'Stopped' : 'Running',
      },
      {
        label: 'Executor queue',
        value: policyEnabled && walletAddress ? (diagnostic?.userInQueue === false ? 'Missing wallet' : 'Wallet queued') : 'N/A',
      },
      {
        label: 'Chain policy',
        value: chainPolicyValue,
      },
      {
        label: 'Safety gate',
        value: safetyGateValue,
      },
      {
        label: 'Latest signal',
        value: adaptiveGuardText ? `${latestSignalValue} - ${adaptiveGuardText}` : latestSignalValue,
      },
      {
        label: 'Latest recorded executor',
        value: latestDecisionValue,
      },
      {
        label: 'Latest execution',
        value: latestExecutionValue,
      },
    ],
  };
}
