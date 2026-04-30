/**
 * 📊 Closed Positions Profit Service
 *
 * O singură sursă de adevăr: total = sum(executionsDetail.profitUsd) + sum(directEntryDetail.profitUsd).
 * Prioritate GET /performance/profit; fallback construiește detail din trades + closed, astfel total = suma rândurilor (fidel).
 *
 * @module closedPositionsProfitService
 */

import { getProfitSummary as getProfitSummaryFromApi } from './performanceApiService';
import { getTrades } from './executionApiService';
import { getDirectEntryClosedPositions } from './aiTradingApiService';
import { formatOtaSessionUserMessage } from '../utils/otaSessionUserMessage';
import tokenPriceService from './tokenPriceService';

const STABLE_SYMBOLS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'];

/** Prefixe din fallback (profit / executions / closed) — același 401 OTA duplica mesajul în UI. */
const PROFIT_ERR_PREFIX = /^(executions|closed|profit)\s*:\s*/i;

/**
 * O singură intrare per text normalizat (fără prefix sursă), ca utilizatorul să nu vadă de 2–3 ori același mesaj OTA.
 * @param {string[]} errors
 * @returns {string[]}
 */
export function dedupeProfitErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) return [];
  const seen = new Set();
  const out = [];
  for (const raw of errors) {
    const s = String(raw ?? '').trim();
    if (!s) continue;
    const body = s.replace(PROFIT_ERR_PREFIX, '').trim();
    const key = body.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(body);
  }
  return out;
}

function toPnlUsd(raw) {
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return n >= 1e12 ? n / 1e18 : n;
}

/** Un singur rând normalizat pentru execuție: profitUsd și date pentru afișare fidelă. */
function normalizeExecutionRow(t) {
  const p = t.pnl ?? t.pnlUsd ?? t.pnl_usd ?? t.profitUsd ?? t.profit_usd ?? t.realizedPnl ?? t.realized_pnl;
  const profitUsd = toPnlUsd(p);
  const executedAt = t.executedAt ?? t.createdAt ?? t.timestamp ?? null;
  return {
    id: t.id ?? t._id,
    tokenIn: t.tokenIn ?? t.token_in ?? null,
    tokenOut: t.tokenOut ?? t.token_out ?? null,
    profitUsd: profitUsd != null ? profitUsd : null,
    executedAt: executedAt != null ? (executedAt instanceof Date ? executedAt.toISOString() : executedAt) : null
  };
}

/**
 * Profit total din tranzacțiile închise: prioritate GET /performance/profit (contorizare backend), apoi fallback din listă.
 *
 * @param {string} walletAddress - Adresa wallet
 * @param {Object} [opts] - Opțiuni: { executionLimit: 50, closedLimit: 50 }
 * @returns {Promise<{ totalProfitUsd: number, fromExecutions: number, fromDirectEntry: number, errors: string[] }>}
 */
export async function getClosedPositionsProfitUsd(walletAddress, opts = {}) {
  const executionLimit = opts.executionLimit ?? 50;
  const closedLimit = opts.closedLimit ?? 50;
  const errors = [];
  let fromExecutions = 0;
  let fromDirectEntry = 0;

  if (!walletAddress) {
    return { totalProfitUsd: 0, fromExecutions: 0, fromDirectEntry: 0, executionsDetail: [], directEntryDetail: [], errors: [] };
  }

  try {
    // Prioritate: endpoint contorizare profit (backend extrage + calculează din DB)
    try {
      const summary = await getProfitSummaryFromApi(walletAddress);
      if (!summary.errors?.length) {
        const execDetail = Array.isArray(summary.executionsDetail) ? summary.executionsDetail : [];
        const directDetail = Array.isArray(summary.directEntryDetail) ? summary.directEntryDetail : [];
        const fromExec = execDetail.reduce((s, r) => s + (Number(r.profitUsd) || 0), 0);
        const fromDirect = directDetail.reduce((s, r) => s + (Number(r.profitUsd) || 0), 0);
        return {
          totalProfitUsd: summary.totalProfitUsd ?? (fromExec + fromDirect),
          fromExecutions: summary.fromExecutions ?? fromExec,
          fromDirectEntry: summary.fromDirectEntry ?? fromDirect,
          executionsDetail: execDetail,
          directEntryDetail: directDetail,
          errors: []
        };
      }
      errors.push(...(summary.errors || []));
    } catch (e) {
      errors.push(formatOtaSessionUserMessage(e) || 'profit endpoint failed');
    }

    // Fallback: din execution/trades + direct-entry/closed
    const [tradesRes, closedList] = await Promise.all([
      getTrades(walletAddress, { limit: executionLimit }).catch((e) => {
        errors.push(`executions: ${formatOtaSessionUserMessage(e) || e?.message || 'failed'}`);
        return { trades: [] };
      }),
      getDirectEntryClosedPositions(walletAddress, closedLimit).catch((e) => {
        errors.push(`closed: ${formatOtaSessionUserMessage(e) || e?.message || 'failed'}`);
        return [];
      })
    ]);

    const trades = Array.isArray(tradesRes?.trades) ? tradesRes.trades : [];
    const executionsDetail = trades
      .map(normalizeExecutionRow)
      .filter((r) => r.profitUsd != null || r.tokenIn || r.tokenOut);
    fromExecutions = executionsDetail.reduce((s, r) => s + (Number(r.profitUsd) || 0), 0);

    const arr = Array.isArray(closedList) ? closedList : (closedList?.closed ?? closedList?.positions ?? []);
    const directEntryDetail = [];
    const positionsWithPnlToken = [];
    const tokensNeedingPrice = new Set();
    for (const c of arr) {
      const pnlUsdVal = c.pnlUsd != null ? parseFloat(c.pnlUsd) : (c.pnl_usd != null ? parseFloat(c.pnl_usd) : null);
      if (pnlUsdVal != null && Number.isFinite(pnlUsdVal)) {
        directEntryDetail.push({
          id: c.id,
          token: (c.token || c.baseToken || '').toString().toUpperCase() || null,
          profitUsd: pnlUsdVal,
          closedAt: c.closedAt ?? c.closed_at ?? c.createdAt ?? null
        });
      } else {
        const pnlToken = c.pnl != null ? parseFloat(c.pnl) : null;
        const token = (c.token || c.baseToken || '').toString().toUpperCase();
        if (Number.isFinite(pnlToken) && token && !STABLE_SYMBOLS.includes(token)) {
          tokensNeedingPrice.add(token);
          positionsWithPnlToken.push({ pnl: pnlToken, token, row: c });
        } else if (Number.isFinite(pnlToken) && token && STABLE_SYMBOLS.includes(token)) {
          directEntryDetail.push({
            id: c.id,
            token,
            profitUsd: pnlToken,
            closedAt: c.closedAt ?? c.closed_at ?? c.createdAt ?? null
          });
        }
      }
    }

    if (positionsWithPnlToken.length > 0 && tokensNeedingPrice.size > 0) {
      const symbols = [...tokensNeedingPrice];
      const prices = await tokenPriceService.getAllTokenPrices(symbols).catch(() => ({}));
      for (const { pnl, token, row } of positionsWithPnlToken) {
        const price = prices[token] ?? prices[token?.toUpperCase()] ?? 0;
        const usd = price > 0 ? pnl * price : 0;
        directEntryDetail.push({
          id: row.id,
          token,
          profitUsd: usd,
          closedAt: row.closedAt ?? row.closed_at ?? row.createdAt ?? null
        });
      }
    }

    fromDirectEntry = directEntryDetail.reduce((s, r) => s + (Number(r.profitUsd) || 0), 0);
    const totalProfitUsd = fromExecutions + fromDirectEntry;
    return {
      totalProfitUsd,
      fromExecutions,
      fromDirectEntry,
      executionsDetail,
      directEntryDetail,
      errors: dedupeProfitErrors(errors)
    };
  } catch (e) {
    errors.push(e?.message || 'unknown');
    return {
      totalProfitUsd: 0,
      fromExecutions: 0,
      fromDirectEntry: 0,
      executionsDetail: [],
      directEntryDetail: [],
      errors: dedupeProfitErrors(errors)
    };
  }
}

export default {
  getClosedPositionsProfitUsd,
  dedupeProfitErrors
};
