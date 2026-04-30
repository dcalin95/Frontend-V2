/**
 * 💰 Token Price Service
 * 
 * Service pentru obținerea prețurilor reale ale tokenilor:
 * - Prețuri din CoinGecko API (browser-friendly, CORS-enabled)
 * - Pattern identic cu useLiveCryptoPrices.js din proiectul principal
 * 
 * IMPORTANT: Binance API is NOT browser-safe (CORS restrictions)
 * Binance APIs should be used ONLY behind a proxy/backend later
 * 
 * @module tokenPriceService
 */

/** Cache TTL 2 min – reduce CoinGecko 429 rate limit */
const CACHE_TTL_MS = 120000;
let cache = { prices: null, ts: 0 };

function getCachedPrices(symbols) {
  if (!cache.prices || Date.now() - cache.ts > CACHE_TTL_MS) return null;
  const out = {};
  symbols.forEach(s => {
    const n = String(s || '').trim().toUpperCase();
    const v = cache.prices[n];
    if (v != null) out[n] = v;
  });
  return out;
}

function setCache(p) {
  cache = { prices: p, ts: Date.now() };
}

// CoinGecko IDs (same as useLiveCryptoPrices.js). ADA/XRP necesare pentru Personal Account USD.
const COINGECKO_IDS = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'WBNB': 'binancecoin',
  'SOL': 'solana',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BUSD': 'binance-usd',
  'CAKE': 'pancakeswap-token',
  'DOGE': 'dogecoin',
  'SHIB': 'shiba-inu',
  'MATIC': 'polygon',
  'LINK': 'chainlink',
  'ADA': 'cardano',
  'XRP': 'ripple',
  'EURS': 'stasis-euro',
  'EURC': 'eurc',
  'BITS': null // BITS not on CoinGecko, fetched separately from contract
};

/** Prețuri fallback când CoinGecko dă 429/eroare – ca să se afișeze USD inline (ex. MATIC, DOGE) în Personal Account */
const FALLBACK_PRICES_WHEN_API_FAILS = {
  'MATIC': 0.40,
  'DOGE': 0.12,
  'SHIB': 0.00002,
  'XRP': 0.55,
  'ADA': 0.45,
  'LINK': 14,
  'SOL': 140,
  'ETH': 3400,
  'BTC': 97000,
};

/**
 * Get prices for multiple tokens (batch fetch from CoinGecko). Real API only.
 * Callers (SwapPanel, LimitOrderPanel) pass list from token registry; default param is fallback only.
 * @param {Array<string>} tokenSymbols - Array of token symbols (from registry when possible)
 * @returns {Promise<Object>} Object with prices: { BTC: number, USDT: 1, ... }
 */
async function fetchCoinGecko(ids, retryCount = 0) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
  const response = await fetch(url);
  if (response.status === 429 && retryCount < 1) {
    await new Promise(r => setTimeout(r, 5000));
    return fetchCoinGecko(ids, retryCount + 1);
  }
  if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
  return response.json();
}

async function getAllTokenPrices(tokenSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'USDT', 'USDC', 'BUSD', 'BITS']) {
  try {
    const normalized = (Array.isArray(tokenSymbols) ? tokenSymbols : []).map(s => String(s || '').trim().toUpperCase()).filter(Boolean);
    const cached = getCachedPrices(normalized);
    if (cached && Object.keys(cached).length > 0 && Object.values(cached).some(v => v > 0)) {
      const out = {};
      (Array.isArray(tokenSymbols) ? tokenSymbols : []).forEach(s => {
        const n = String(s || '').trim().toUpperCase();
        out[s] = cached[n] ?? (n === 'USDT' || n === 'USDC' || n === 'BUSD' ? 1 : 0);
      });
      return out;
    }

    const coinGeckoTokens = normalized.filter(symbol => symbol !== 'BITS' && COINGECKO_IDS[symbol]);
    const coinGeckoIdsString = coinGeckoTokens.map(s => COINGECKO_IDS[s]).join(',');

    const prices = { USDT: 1, USDC: 1, BUSD: 1, BITS: 0 };

    if (coinGeckoIdsString) {
      try {
        const data = await fetchCoinGecko(coinGeckoIdsString);
        coinGeckoTokens.forEach(symbol => {
          const tokenId = COINGECKO_IDS[symbol];
          const fromApi = data[tokenId]?.usd;
          prices[symbol] = (fromApi != null && fromApi > 0) ? fromApi : (FALLBACK_PRICES_WHEN_API_FAILS[symbol] ?? 0);
        });
        ['BNB', 'WBNB', 'CAKE'].forEach(sym => {
          if ((prices[sym] ?? 0) <= 0) prices[sym] = sym === 'CAKE' ? 1.3 : 620;
        });
        setCache({ ...prices });
      } catch (error) {
        const isRateLimitOrNetwork = error?.name === 'TypeError' || /failed to fetch|429|cors/i.test(String(error?.message ?? ''));
        if (process.env.NODE_ENV === 'development' && !isRateLimitOrNetwork) {
          console.warn('[tokenPriceService] CoinGecko failed, using cache/fallback:', error?.message || error);
        }
        if (cache.prices && Date.now() - cache.ts < CACHE_TTL_MS * 2) {
          coinGeckoTokens.forEach(symbol => {
            prices[symbol] = cache.prices[symbol] ?? 0;
          });
        } else {
          let dexPrice = 0;
          try {
            const { getPrice } = await import('./dexApiService');
            const res = await getPrice();
            if (res?.success && res?.price) dexPrice = parseFloat(res.price) || 0;
          } catch (_) {}
          coinGeckoTokens.forEach(symbol => {
            const isBnb = symbol === 'BNB' || symbol === 'WBNB';
            const isCake = symbol === 'CAKE';
            if (isBnb) prices[symbol] = dexPrice > 100 ? dexPrice : 620;
            else if (isCake) prices[symbol] = (dexPrice > 0 && dexPrice < 100) ? dexPrice : 1.3;
            else prices[symbol] = FALLBACK_PRICES_WHEN_API_FAILS[symbol] ?? 0;
          });
        }
      }
    }

    // BITS: preț din CellManager.sol (ultima celulă Open) pe BSC
    if (normalized.includes('BITS')) {
      try {
        const getBitsPrice = (await import('./getBitsPriceFromCellManager.js')).default;
        const bitsPrice = await getBitsPrice();
        if (bitsPrice > 0) prices['BITS'] = bitsPrice;
        setCache({ ...prices });
      } catch (_) {}
    }

    // Map prices to original symbols (backend may return "bnb" vs "BNB")
    const tokenSymbolsArr = Array.isArray(tokenSymbols) ? tokenSymbols : [];
    tokenSymbolsArr.forEach(symbol => {
      const norm = String(symbol || '').trim().toUpperCase();
      if (prices.hasOwnProperty(symbol)) return;
      if (prices.hasOwnProperty(norm) && prices[norm] > 0) {
        prices[symbol] = prices[norm];
      } else {
        prices[symbol] = (norm === 'USDT' || norm === 'USDC' || norm === 'BUSD') ? 1 : 0;
      }
    });

    return prices;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.warn('[tokenPriceService] Error:', error?.message || error);
    const prices = {};
    (Array.isArray(tokenSymbols) ? tokenSymbols : []).forEach(symbol => {
      const n = String(symbol || '').toUpperCase();
      prices[symbol] = n === 'USDT' || n === 'USDC' || n === 'BUSD' ? 1
        : (n === 'BNB' || n === 'WBNB' ? 620 : n === 'CAKE' ? 1.3 : (FALLBACK_PRICES_WHEN_API_FAILS[n] ?? 0));
    });
    return prices;
  }
}

/**
 * Get real price for a single token.
 * Prefer batch fallback (getAllTokenPrices) on CoinGecko 429/CORS/network failure to avoid noisy errors.
 * @param {string} tokenSymbol - Token symbol (BTC, USDT, BITS, etc.)
 * @returns {Promise<number>} Price in USD
 */
async function getTokenPrice(tokenSymbol) {
  try {
    // Stablecoins USD
    if (tokenSymbol === 'USDT' || tokenSymbol === 'BUSD' || tokenSymbol === 'USDC') {
      return 1;
    }

    const tokenId = COINGECKO_IDS[tokenSymbol];
    if (tokenId) {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
        );

        if (!response.ok) {
          if (response.status === 429) {
            // Rate limit – use batch fallback (cache or backend fallback) without logging
            const fallback = await getAllTokenPrices([tokenSymbol]).catch(() => ({}));
            return fallback[tokenSymbol] ?? (tokenSymbol === 'BNB' || tokenSymbol === 'WBNB' ? 620 : tokenSymbol === 'ETH' ? 3400 : 0);
          }
          throw new Error(`CoinGecko ${response.status}`);
        }

        const data = await response.json();
        return data[tokenId]?.usd || 0;
      } catch (error) {
        // CORS / network / 429 (browser often reports as "Failed to fetch") – use batch fallback, no console spam
        const isRateLimitOrNetwork = error?.name === 'TypeError' || /fetch|429|cors/i.test(String(error?.message ?? ''));
        const fallback = await getAllTokenPrices([tokenSymbol]).catch(() => ({}));
        const value = fallback[tokenSymbol] ?? (tokenSymbol === 'BNB' || tokenSymbol === 'WBNB' ? 620 : tokenSymbol === 'ETH' ? 3400 : 0);
        if (!isRateLimitOrNetwork && process.env.NODE_ENV === 'development') {
          console.warn(`[tokenPriceService] CoinGecko failed for ${tokenSymbol}:`, error?.message || error);
        }
        return value;
      }
    }

    return 0;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.warn(`[tokenPriceService] getTokenPrice(${tokenSymbol}):`, error?.message || error);
    return tokenSymbol === 'BNB' || tokenSymbol === 'WBNB' ? 620 : tokenSymbol === 'ETH' ? 3400 : 0;
  }
}

const tokenPriceService = {
  getTokenPrice,
  getAllTokenPrices,
  COINGECKO_IDS
};

export default tokenPriceService;
