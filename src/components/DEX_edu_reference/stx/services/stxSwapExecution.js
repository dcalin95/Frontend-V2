/* eslint-disable */
/**
 * STX swap execution for Trade/Swap UI: OTA quote API + dex-wrapper signing (Alex routing in contract).
 * @module stxSwapExecution
 */

import { STX_TOKENS } from '../stxTokenConfig';
import { getStxSwapEnvReadiness } from '../stxStacksPrincipals';
import { executeSwap } from './stxContractService';
import { fetchStxQuote } from './otaStxMicroProfitService';

/** @param {string} label - ex. "0.5%" */
export function slippageLabelToBps(label) {
  const n = parseFloat(String(label || '').replace(/%/g, '').trim());
  if (!Number.isFinite(n) || n <= 0) return 50;
  return Math.round(n * 100);
}

export function getDecimalsForSymbol(symbol) {
  const t = STX_TOKENS.find((x) => x.symbol === String(symbol || '').toUpperCase());
  return t?.decimals ?? 6;
}

/**
 * @param {string} humanStr
 * @param {string} symbol
 * @returns {{ minimal: string, ok: boolean, error?: string }}
 */
export function humanToMinimalUnits(humanStr, symbol) {
  const dec = getDecimalsForSymbol(symbol);
  const raw = String(humanStr || '').trim().replace(',', '.');
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return { minimal: '0', ok: false, error: 'Enter a valid amount > 0.' };
  }
  try {
    const factor = 10 ** dec;
    const micro = BigInt(Math.floor(n * factor + 1e-9));
    if (micro <= 0n) {
      return { minimal: '0', ok: false, error: 'Amount is too small for the token decimals.' };
    }
    return { minimal: String(micro), ok: true };
  } catch {
    return { minimal: '0', ok: false, error: 'Invalid amount.' };
  }
}

/**
 * @param {object} p
 * @param {string} p.fromSymbol
 * @param {string} p.toSymbol
 * @param {string} p.humanAmount
 * @param {string} p.slippageLabel
 * @param {string} p.userAddress
 * @param {object} [p.stacksProvider]
 * @returns {Promise<{ ok: boolean, txHash?: string, error?: string, quoteSource?: string }>}
 */
export async function runStxAlexSwap(p) {
  const { fromSymbol, toSymbol, humanAmount, slippageLabel, userAddress, stacksProvider } = p || {};
  const from = String(fromSymbol || '').toUpperCase();
  const to = String(toSymbol || '').toUpperCase();
  if (!userAddress) {
    return { ok: false, error: 'Missing STX wallet address.' };
  }
  if (from === to) {
    return { ok: false, error: 'Choose two different tokens.' };
  }

  const { ready, missing } = getStxSwapEnvReadiness(from, to);
  if (!ready) {
    return {
      ok: false,
      error: `On-chain swap unavailable: set ${missing.join(', ')} in env (see docs/STX_FRONTEND_ENV.md).`,
    };
  }

  const { minimal, ok, error } = humanToMinimalUnits(humanAmount, from);
  if (!ok) return { ok: false, error };

  const bps = slippageLabelToBps(slippageLabel);
  const quote = await fetchStxQuote(from, to, minimal, bps);
  const minAmountOut = quote?.minAmountOut ?? '0';
  const quoteSource = quote ? 'api' : 'none';

  if (minAmountOut === '0' || !quote) {
    return {
      ok: false,
      error:
        'Could not get minOut from API (REACT_APP_OTA_API_URL + GET /api/ai-trading/quote?chain=stx). Without a quote, swap is not enabled (slippage protection).',
      quoteSource,
    };
  }

  try {
    const { txHash } = await executeSwap({
      senderAddress: userAddress,
      tokenIn: from,
      tokenOut: to,
      amountIn: minimal,
      minAmountOut,
      stacksProvider,
    });
    return { ok: true, txHash, quoteSource };
  } catch (e) {
    return { ok: false, error: e?.message || String(e), quoteSource };
  }
}
