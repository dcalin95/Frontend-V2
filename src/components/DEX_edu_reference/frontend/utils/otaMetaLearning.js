/**
 * Fire-and-forget Meta Controller record-outcome după închideri din AutoTradePanel,
 * ca să alimenteze Bandit + greutăți (vezi docs/OTA_META_CONTROLLER_REFERENCE.md).
 * Nu aruncă în UI; erorile sunt înghițite (backend poate fi indisponibil).
 */

import { recordOutcome } from '../services/otaMetaControllerService';

/**
 * @param {object|null|undefined} closeRes - răspuns POST direct-entry/close
 * @param {object} [opts]
 * @param {string} [opts.strategy] - override strategy name pentru bandit (ex. din analiză)
 */
export function fireAndForgetMetaRecordOutcomeFromDirectEntryClose(closeRes, opts = {}) {
  const pnlRaw =
    closeRes?.pnlUsd ??
    closeRes?.pnl_usd ??
    closeRes?.pnl ??
    closeRes?.realizedPnl ??
    closeRes?.realized_pnl ??
    null;
  const pnl = pnlRaw != null && Number.isFinite(Number(pnlRaw)) ? Number(pnlRaw) : 0;
  const ts =
    closeRes?.closedAt ??
    closeRes?.executedAt ??
    closeRes?.timestamp ??
    new Date().toISOString();
  const timestamp = typeof ts === 'string' ? ts : new Date(ts).toISOString();
  const strategy =
    (typeof opts.strategy === 'string' && opts.strategy.trim()) ||
    (typeof closeRes?.strategy === 'string' && closeRes.strategy.trim()) ||
    (typeof closeRes?.signalStrategy === 'string' && closeRes.signalStrategy.trim()) ||
    'manual';

  const payload = {
    tradeResult: {
      pnl,
      strategy,
      timestamp,
    },
    context: {
      pnl,
      timestamp,
      source: 'auto_trade_panel',
      flow: 'direct_entry_close',
      reconciled: !!(closeRes?.reconciled === true || closeRes?.reason === 'zero_vault_balance_reconciled'),
    },
  };

  return recordOutcome(payload).catch(() => {});
}
