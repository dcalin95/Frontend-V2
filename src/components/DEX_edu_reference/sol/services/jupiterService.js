/**
 * jupiterService.js – Integrare Jupiter Swap API pentru Solana.
 * Quote (GET) + Swap transaction (POST); semnarea și trimiterea se fac în UI cu wallet adapter.
 * @see https://station.jup.ag/api-reference/swap
 */

const JUPITER_QUOTE_URL = 'https://api.jup.ag/swap/v1/quote';
const JUPITER_SWAP_URL = 'https://api.jup.ag/swap/v1/swap';

/** Mint addresses mainnet (SOL = wrapped SOL). */
export const MINT_BY_SYMBOL = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  mSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
};

export const DECIMALS_BY_SYMBOL = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
  BONK: 5,
  JUP: 6,
  RAY: 6,
  mSOL: 9,
};

function getApiHeaders() {
  const key = typeof process !== 'undefined' && process.env?.REACT_APP_JUPITER_API_KEY;
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers['x-api-key'] = key;
  return headers;
}

/**
 * Convertește amount uman (ex: "1.5") în raw amount (integer) pentru simbolul dat.
 */
export function toRawAmount(amountStr, symbol) {
  const dec = DECIMALS_BY_SYMBOL[symbol] ?? 9;
  const n = Number(amountStr);
  if (!Number.isFinite(n) || n < 0) return '0';
  return String(Math.floor(n * 10 ** dec));
}

/**
 * Obține un quote de la Jupiter.
 * @param {object} params - { inputMint, outputMint, amount (raw string), slippageBps }
 * @returns {Promise<object>} quote response pentru POST /swap
 */
export async function getQuote(params) {
  const { inputMint, outputMint, amount, slippageBps = 50 } = params;
  const url = new URL(JUPITER_QUOTE_URL);
  url.searchParams.set('inputMint', inputMint);
  url.searchParams.set('outputMint', outputMint);
  url.searchParams.set('amount', String(amount));
  url.searchParams.set('slippageBps', String(slippageBps));
  const res = await fetch(url.toString(), { headers: getApiHeaders() });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Jupiter quote failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Obține tranzacția de swap (base64 unsigned) de la Jupiter.
 * @param {object} params - { userPublicKey (base58), quoteResponse }
 * @returns {Promise<{ swapTransaction: string, lastValidBlockHeight: number }>}
 */
export async function getSwapTransaction(params) {
  const { userPublicKey, quoteResponse } = params;
  const body = {
    userPublicKey,
    quoteResponse,
    dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: { priorityLevelWithMaxLamports: { priorityLevel: 'medium', maxLamports: 100_000 } },
  };
  const res = await fetch(JUPITER_SWAP_URL, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Jupiter swap failed: ${res.status}`);
  }
  const data = await res.json();
  if (!data?.swapTransaction) {
    throw new Error('Jupiter did not return a swap transaction.');
  }
  return {
    swapTransaction: data.swapTransaction,
    lastValidBlockHeight: data.lastValidBlockHeight ?? 0,
  };
}
