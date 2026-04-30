/**
 * SEI Auto execution readiness — normalized from GET /api/ai-trading/sei/auto/status.
 * Backward-compatible: legacy responses without readiness → legacyApi + executionReady null (do not claim live execution).
 */

const BLOCK_REASONS = new Set([
  'unsupported',
  'manual_only_mode',
  'quote_unavailable',
  'stale_quote',
  'missing_strategy',
  'worker_inactive',
  'bot_not_configured',
  'pair_not_supported',
  null,
]);

function sanitizeBlockReason(v) {
  if (v == null || v === '') return null;
  const s = String(v);
  return BLOCK_REASONS.has(s) ? s : 'unsupported';
}

/**
 * @param {object} data - raw JSON from sei/auto/status
 * @param {{ enabled: boolean }} normalizedStatus - already-normalized flags from getSeiAutoStatus
 * @returns {{
 *   supported: boolean | null,
 *   quoteReady: boolean | null,
 *   strategyReady: boolean | null,
 *   walletReady: boolean | null,
 *   autoEnabled: boolean,
 *   executionReady: boolean | null,
 *   blockReason: string | null,
 *   preferredPairQuoted: string | null,
 *   legacyApi: boolean
 * }}
 */
export function deriveSeiAutoReadinessFromApiPayload(data, normalizedStatus) {
  const autoEnabled = !!normalizedStatus?.enabled;

  if (data && data.mode === 'manual_only') {
    return {
      supported: false,
      quoteReady: null,
      strategyReady: true,
      walletReady: null,
      autoEnabled: false,
      executionReady: false,
      blockReason: 'manual_only_mode',
      preferredPairQuoted: null,
      legacyApi: false,
    };
  }

  const r = data && typeof data.readiness === 'object' && data.readiness !== null ? data.readiness : null;
  if (r) {
    const supported = r.supported !== false;
    return {
      supported,
      quoteReady: typeof r.quoteReady === 'boolean' ? r.quoteReady : null,
      strategyReady: typeof r.strategyReady === 'boolean' ? r.strategyReady : true,
      walletReady: typeof r.walletReady === 'boolean' ? r.walletReady : null,
      autoEnabled,
      executionReady: supported ? (typeof r.executionReady === 'boolean' ? r.executionReady : null) : false,
      blockReason: supported ? sanitizeBlockReason(r.blockReason) : (sanitizeBlockReason(r.blockReason) || 'unsupported'),
      preferredPairQuoted: typeof r.preferredPairQuoted === 'string' ? r.preferredPairQuoted : null,
      legacyApi: false,
    };
  }

  if (data && data.seiAutoExecutionSupported === false) {
    return {
      supported: false,
      quoteReady: false,
      strategyReady: true,
      walletReady: false,
      autoEnabled,
      executionReady: false,
      blockReason: sanitizeBlockReason(data.seiAutoBlockReason) || 'unsupported',
      preferredPairQuoted: null,
      legacyApi: false,
    };
  }

  if (data && data.seiAutoExecutionSupported === true) {
    const wr = data.botWalletConfigured;
    return {
      supported: true,
      quoteReady: typeof data.quoteReadyForPreferredPair === 'boolean' ? data.quoteReadyForPreferredPair : null,
      strategyReady: true,
      walletReady: wr === true ? true : wr === false ? false : null,
      autoEnabled,
      executionReady: typeof data.executionReady === 'boolean' ? data.executionReady : null,
      blockReason: sanitizeBlockReason(data.seiAutoBlockReason),
      preferredPairQuoted: typeof data.preferredPairQuoted === 'string' ? data.preferredPairQuoted : null,
      legacyApi: false,
    };
  }

  return {
    supported: null,
    quoteReady: null,
    strategyReady: true,
    walletReady: null,
    autoEnabled,
    executionReady: null,
    blockReason: null,
    preferredPairQuoted: null,
    legacyApi: true,
  };
}

export function seiAutoReadinessHint(readiness) {
  if (!readiness) return null;
  if (readiness.legacyApi) {
    if (!readiness.autoEnabled) return null;
    return 'Server did not report SEI auto execution readiness. Session is on; live runs still depend on backend worker and bot configuration — not guaranteed from this API alone.';
  }
  if (readiness.supported === false) {
    const br = readiness.blockReason || 'unsupported';
    if (br === 'manual_only_mode') {
      return 'SEI auto is disabled (manual-only on server). On-demand quotes and manual round-trip still work.';
    }
    return `SEI auto execution not available on server (${br}). Session preference may still be stored.`;
  }
  if (readiness.autoEnabled && readiness.executionReady === false && readiness.blockReason) {
    return `Session enabled but not execution-ready: ${readiness.blockReason.replace(/_/g, ' ')}.`;
  }
  if (readiness.autoEnabled && readiness.executionReady === false && !readiness.blockReason) {
    return 'Session enabled; server reports execution not ready (check worker, bot keys, quote).';
  }
  return null;
}
