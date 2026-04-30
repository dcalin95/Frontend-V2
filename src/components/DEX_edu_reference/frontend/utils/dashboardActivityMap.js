/**
 * Map OTA history API payload → aceleași rânduri ca în RecentActivity (sursă: API).
 * Map execution trades → rânduri cu amount/USD normalizate (fără wei afișat ca „uman”).
 * @module dashboardActivityMap
 */

import { ethers } from 'ethers';
import { getDecimalsForToken, toHumanAmount, formatAmountHuman } from './formatters';

/** Prag USD peste care considerăm valoarea suspectă pentru un singur rând (date corupte / raw greșit). */
export const MAX_DASHBOARD_ACTIVITY_USD = 1e12;

/** Prag uman peste care nu afișăm cantitate (protecție împotriva erorilor de scalare). */
export const MAX_DASHBOARD_HUMAN_AMOUNT = 1e16;

/** Texte afișate în UI (ledger), nu debug. */
export const DASHBOARD_AMOUNT_UNAVAILABLE = 'Amount unavailable';
export const DASHBOARD_VALUE_UNAVAILABLE = 'Value unavailable';

/** Badge discret pentru rânduri exec parțial mapate. */
export const DASHBOARD_BADGE_PARTIAL = 'partial data';
export const DASHBOARD_BADGE_QUOTE_MISSING = 'quote leg missing';

/** Picior quote în USD / stable — folosit pentru valoare monetară, nu pentru înmulțiri cu „price” ambigue. */
const STABLE_USD_SYMBOLS = new Set([
  'USDT',
  'USDC',
  'BUSD',
  'DAI',
  'TUSD',
  'USDP',
  'FDUSD',
  'USDD',
  'VAI',
]);

/** Limite [min, max] USD per 1 unitate pentru sanity când singura sursă e amountHuman * price. */
const IMPLIED_UNIT_USD_BOUNDS = {
  XRP: [0.01, 50],
  BTC: [3000, 800000],
  ETH: [200, 50000],
  BNB: [10, 10000],
  USDT: [0.98, 1.02],
  USDC: [0.98, 1.02],
  BUSD: [0.98, 1.02],
  DAI: [0.98, 1.02],
};

function normalizeSymbol(sym) {
  return (sym == null ? '' : String(sym)).toUpperCase().trim();
}

/**
 * Backend (execution_history) trimite adesea `price = parseFloat(amountOut) / parseFloat(amountIn)` pe cantități brute —
 * este un raport de swap, NU preț USD per unitate. Acest raport NU trebuie înmulțit cu cantitatea umană.
 * @returns {boolean}
 */
export function executionPriceMatchesRawAmountRatio(trade, price) {
  if (price == null || !(price > 0) || !Number.isFinite(price)) return false;
  const ai = trade?.amountIn ?? trade?.amount_in;
  const ao = trade?.amountOut ?? trade?.amount_out ?? trade?.amount;
  if (ai == null || ao == null || ai === '' || ao === '') return false;
  const aiN = parseFloat(String(ai));
  const aoN = parseFloat(String(ao));
  if (!(aiN > 0) || !(aoN > 0) || !Number.isFinite(aiN) || !Number.isFinite(aoN)) return false;
  const ratio = aoN / aiN;
  const rel = Math.abs(price - ratio) / Math.max(Math.abs(price), Math.abs(ratio), 1e-18);
  return rel < 1e-5;
}

/**
 * Valoare USD din piciorul stable (1 USDT ≈ 1 USD) când există amount pe acel token.
 * @returns {number|null}
 */
export function pickStableLegUsdFromTrade(trade) {
  if (!trade || typeof trade !== 'object') return null;
  const ti = normalizeSymbol(trade.tokenIn || trade.token_in);
  const to = normalizeSymbol(trade.tokenOut || trade.token_out);
  if (STABLE_USD_SYMBOLS.has(ti) && trade.amountIn != null && trade.amountIn !== '') {
    const h = tradeAmountFieldToHuman(trade.amountIn, ti);
    if (h != null && Number.isFinite(h) && h >= 0 && h <= MAX_DASHBOARD_ACTIVITY_USD) return h;
  }
  if (STABLE_USD_SYMBOLS.has(to) && trade.amountOut != null && trade.amountOut !== '') {
    const h = tradeAmountFieldToHuman(trade.amountOut, to);
    if (h != null && Number.isFinite(h) && h >= 0 && h <= MAX_DASHBOARD_ACTIVITY_USD) return h;
  }
  return null;
}

/**
 * Dacă înmulțim amountHuman * price, verificăm că prețul implicit per unitate e plauzibil pentru simbol.
 * @returns {boolean}
 */
export function impliedUnitUsdPassesSanity(amtToken, amountHuman, valueUsd) {
  if (amountHuman == null || !(amountHuman > 0) || valueUsd == null || !Number.isFinite(valueUsd)) return false;
  const unit = valueUsd / amountHuman;
  if (!Number.isFinite(unit) || unit <= 0) return false;
  const sym = normalizeSymbol(amtToken);
  const bounds = IMPLIED_UNIT_USD_BOUNDS[sym];
  if (bounds) {
    const [lo, hi] = bounds;
    return unit >= lo && unit <= hi;
  }
  // Token necunoscut: reject extremele evidente (evită „milioane USD per shitcoin” din greșeală)
  if (unit > 1e7 || unit < 1e-12) return false;
  return true;
}

/**
 * @param {unknown} res - răspuns brut getOTAHistory
 * @returns {Array<object>}
 */
export function mapOtaHistoryToActivityRows(res) {
  const raw =
    (res && (res.history || res.items || res.results || res.data || res.analyses)) || [];
  const arr = Array.isArray(raw) ? raw : [];

  return arr.map((item, idx) => {
    const token = item?.token || item?.symbol || item?.asset || item?.pair || 'N/A';
    const signal =
      item?.signal?.signal ||
      item?.signal ||
      item?.action ||
      item?.recommendation ||
      item?.side ||
      null;
    const confidence =
      item?.signal?.confidence ?? item?.confidence ?? item?.score ?? null;

    const tsRaw = item?.timestamp || item?.createdAt || item?.time || item?.date;
    const ts = typeof tsRaw === 'number' ? tsRaw : tsRaw ? new Date(tsRaw).getTime() : Date.now();

    return {
      id: item?.id || item?._id || `analysis-${idx}-${ts}`,
      type: 'analysis',
      activitySource: 'analysis',
      token,
      amount: 0,
      value: 0,
      status: 'completed',
      timestamp: Number.isFinite(ts) ? ts : Date.now(),
      signal,
      confidence,
    };
  });
}

function firstFinite(...candidates) {
  for (const v of candidates) {
    if (v === null || v === undefined || v === '') continue;
    const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(String(v).trim()) : Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function parseTradeTimestamp(trade) {
  const t = trade?.createdAt ?? trade?.created_at ?? trade?.timestamp ?? trade?.time;
  if (t == null) return Date.now();
  if (typeof t === 'number' && Number.isFinite(t)) return t;
  const d = new Date(t);
  return Number.isFinite(d.getTime()) ? d.getTime() : Date.now();
}

/**
 * Convertește câmp amount din trade API la cantitate umană (evită pierdere precizie pentru string-uri întregi wei).
 * @param {string|number|null|undefined} raw
 * @param {string} tokenSymbol
 * @returns {number|null}
 */
export function tradeAmountFieldToHuman(raw, tokenSymbol) {
  const sym = (tokenSymbol || 'USDT').toString().toUpperCase();
  const dec = getDecimalsForToken(sym);

  if (raw === null || raw === undefined || raw === '') return null;

  const s = String(raw).trim();
  if (/^\d+$/.test(s)) {
    try {
      const bn = ethers.BigNumber.from(s);
      if (bn.isZero()) return 0;
      const f = parseFloat(ethers.utils.formatUnits(bn, dec));
      if (Number.isFinite(f) && f >= 0) return f;
    } catch {
      /* fall through */
    }
  }

  return toHumanAmount(typeof raw === 'string' ? parseFloat(s) : Number(raw), sym);
}

/**
 * Preț execuție în quote (USD sau USDT) — trebuie să fie scalar rezonabil, nu wei.
 */
function pickExecutionPrice(trade) {
  const p = firstFinite(
    trade?.price,
    trade?.executionPrice,
    trade?.execution_price,
    trade?.spotPrice,
    trade?.spot_price,
    trade?.entry_price,
    trade?.entryPrice
  );
  if (p == null || p <= 0) return null;
  if (p >= 1e8) return null;
  return p;
}

/**
 * Un singur trade din GET execution/trades → rând activitate dashboard.
 * @param {object} trade
 * @returns {object|null}
 */
export function mapExecutionTradeToDashboardActivity(trade) {
  if (!trade || typeof trade !== 'object') return null;

  const tokenOut = trade.tokenOut || trade.token_out || trade.base_token || trade.symbol;
  const tokenIn = trade.tokenIn || trade.token_in;
  const displayToken = (tokenOut || tokenIn || 'N/A').toString();
  const outSym = (tokenOut || displayToken).toString();
  const inSym = (tokenIn || outSym).toString();

  const humanOutExplicit = firstFinite(
    trade.amountOutHuman,
    trade.amount_out_human,
    trade.amountOutFormatted,
    trade.amount_out_formatted
  );
  const humanInExplicit = firstFinite(
    trade.amountInHuman,
    trade.amount_in_human,
    trade.amountInFormatted
  );

  const rawOut = trade.amountOut ?? trade.amount_out ?? trade.amount;
  const rawIn = trade.amountIn ?? trade.amount_in;

  let amountHuman = humanOutExplicit;
  let amtToken = outSym;

  if (amountHuman == null && rawOut != null && rawOut !== '') {
    amountHuman = tradeAmountFieldToHuman(rawOut, outSym);
  }
  if (amountHuman == null && humanInExplicit != null) {
    amountHuman = humanInExplicit;
    amtToken = inSym;
  }
  if (amountHuman == null && rawIn != null && rawIn !== '') {
    amountHuman = tradeAmountFieldToHuman(rawIn, inSym);
    amtToken = inSym;
  }

  if (amountHuman != null) {
    if (!Number.isFinite(amountHuman) || amountHuman < 0 || amountHuman > MAX_DASHBOARD_HUMAN_AMOUNT) {
      amountHuman = null;
    }
  }

  let amountStatus = 'unavailable';
  let amountLabel = DASHBOARD_AMOUNT_UNAVAILABLE;
  if (amountHuman != null) {
    if (amountHuman === 0) {
      amountStatus = 'ok';
      amountLabel = `0 ${amtToken}`.trim();
    } else {
      const fmt = formatAmountHuman(amountHuman, amtToken, amountHuman >= 1000 ? 2 : 4);
      if (fmt) {
        amountStatus = 'ok';
        amountLabel = `${fmt} ${amtToken}`.trim();
      }
    }
  }

  const explicitUsd = firstFinite(
    trade.valueUsd,
    trade.value_usd,
    trade.totalUsd,
    trade.total_usd,
    trade.notionalUsd,
    trade.notional_usd,
    trade.quoteAmountUsd,
    trade.quote_amount_usd,
    trade.realizedUsd,
    trade.realized_usd,
    trade.usdValue,
    trade.usd_value,
    trade.value_usdt
  );

  let valueUsd = null;
  if (explicitUsd != null && explicitUsd >= 0 && explicitUsd <= MAX_DASHBOARD_ACTIVITY_USD) {
    valueUsd = explicitUsd;
  } else {
    const stableUsd = pickStableLegUsdFromTrade(trade);
    if (stableUsd != null) {
      valueUsd = stableUsd;
    } else if (amountHuman != null && amountHuman <= MAX_DASHBOARD_HUMAN_AMOUNT) {
      const price = pickExecutionPrice(trade);
      const priceIsRawSwapRatio = executionPriceMatchesRawAmountRatio(trade, price);
      if (price != null && !priceIsRawSwapRatio) {
        const v = amountHuman * price;
        if (
          Number.isFinite(v) &&
          v >= 0 &&
          v <= MAX_DASHBOARD_ACTIVITY_USD &&
          impliedUnitUsdPassesSanity(amtToken, amountHuman, v)
        ) {
          valueUsd = v;
        }
      }
    }
  }

  const valueStatus =
    valueUsd != null && Number.isFinite(valueUsd) && valueUsd >= 0 ? 'ok' : 'unavailable';

  let dataBadge = null;
  if (valueStatus === 'unavailable' && amountStatus === 'ok') {
    dataBadge = DASHBOARD_BADGE_QUOTE_MISSING;
  } else if (amountStatus === 'unavailable' && valueStatus === 'ok') {
    dataBadge = DASHBOARD_BADGE_PARTIAL;
  }

  return {
    id: trade.id || trade._id || `trade-${parseTradeTimestamp(trade)}`,
    type: trade.type || 'swap',
    activitySource: 'execution',
    token: displayToken,
    amountLabel,
    amountStatus,
    amountHuman: amountHuman != null && Number.isFinite(amountHuman) ? amountHuman : null,
    valueUsd,
    valueStatus,
    dataBadge,
    status: trade.status || 'pending',
    timestamp: parseTradeTimestamp(trade),
  };
}

/**
 * Rânduri exec fără nicio informație ledger (cantitate + valoare lipsă) sau zero artefact.
 * @param {object} row
 * @returns {boolean}
 */
export function shouldOmitExecutionRowFromLedger(row) {
  if (!row || row.activitySource !== 'execution') return false;
  if (row.amountStatus === 'unavailable' && row.valueStatus === 'unavailable') return true;
  const ah = row.amountHuman;
  if (ah != null && ah === 0 && (row.valueUsd == null || !Number.isFinite(row.valueUsd))) return true;
  return false;
}

/**
 * Scor mai mare = mai potrivit pentru vârful feed-ului (ledger).
 * @param {object} row
 * @returns {number}
 */
export function executionRowLedgerScore(row) {
  if (!row || row.activitySource !== 'execution') return 0;
  let s = 0;
  if (row.valueUsd != null && Number.isFinite(row.valueUsd)) s += 100;
  if (row.amountStatus === 'ok') {
    s += 40;
    if (row.amountHuman != null && row.amountHuman > 0) s += 20;
  }
  if (row.valueStatus === 'unavailable') s -= 15;
  if (row.amountStatus === 'unavailable') s -= 25;
  return s;
}

/**
 * @param {Array<object>} trades
 * @returns {Array<object>}
 */
export function mapExecutionTradesToDashboardActivities(trades) {
  if (!Array.isArray(trades) || trades.length === 0) return [];
  const mapped = trades.map(mapExecutionTradeToDashboardActivity).filter(Boolean);
  return mapped.filter((r) => !shouldOmitExecutionRowFromLedger(r));
}

/** Număr maxim de rânduri afișate în tabelul „Live activity” (dashboard). */
export const DASHBOARD_LIVE_ACTIVITY_MAX_VISIBLE = 12;

/**
 * Feed mixt: întâi execuții/swap-uri (cele mai recente), apoi completare cu semnale OTA.
 * Evită ca un singur merge cronologic + slice să înlocuiască execuțiile cu semnale recente.
 *
 * @param {object} opts
 * @param {Array<object>} [opts.executionRows]
 * @param {Array<object>} [opts.signalRows] — rânduri `type: 'analysis'`
 * @param {number} [opts.maxVisible]
 * @returns {{ rows: Array<object>, stats: object }}
 */
export function buildMixedDashboardLiveActivities({
  executionRows = [],
  signalRows = [],
  maxVisible = DASHBOARD_LIVE_ACTIVITY_MAX_VISIBLE,
} = {}) {
  const exec = [...executionRows]
    .filter(Boolean)
    .map((r) => ({ ...r, activitySource: r.activitySource || 'execution' }))
    .sort((a, b) => {
      const d = executionRowLedgerScore(b) - executionRowLedgerScore(a);
      if (d !== 0) return d;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  const sig = [...signalRows]
    .filter(Boolean)
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((r) => ({ ...r, activitySource: 'analysis' }));

  const rows = [];
  for (const r of exec) {
    if (rows.length >= maxVisible) break;
    rows.push(r);
  }
  for (const r of sig) {
    if (rows.length >= maxVisible) break;
    rows.push(r);
  }

  return {
    rows,
    stats: {
      executionPool: exec.length,
      signalPool: sig.length,
      executionShown: rows.filter((x) => x.activitySource === 'execution').length,
      signalShown: rows.filter((x) => x.activitySource === 'analysis').length,
      maxVisible,
    },
  };
}
