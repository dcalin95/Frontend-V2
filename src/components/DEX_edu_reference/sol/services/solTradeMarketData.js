import { DECIMALS_BY_SYMBOL, MINT_BY_SYMBOL, getQuote, toRawAmount } from './jupiterService';

const DEFAULT_DEPTH_SIZES = [0.1, 0.5, 1];
const MEME_DEPTH_SIZES = [100000, 500000, 1000000];

export function parseSolPair(pair) {
  const [base, quote] = String(pair || '').split('/');
  if (!base || !quote) return null;
  if (!MINT_BY_SYMBOL[base] || !MINT_BY_SYMBOL[quote]) return null;
  return { base, quote };
}

function getDepthSizes(base) {
  return base === 'BONK' ? MEME_DEPTH_SIZES : DEFAULT_DEPTH_SIZES;
}

function formatAmount(value, maximumFractionDigits = 6) {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString(undefined, {
    maximumFractionDigits,
    minimumFractionDigits: value >= 1000 ? 0 : 2,
  });
}

function formatPrice(value) {
  if (!Number.isFinite(value)) return '-';
  const maximumFractionDigits = value >= 100 ? 2 : value >= 1 ? 4 : 8;
  return value.toLocaleString(undefined, {
    maximumFractionDigits,
    minimumFractionDigits: value >= 1 ? 2 : 4,
  });
}

function readOutAmount(quote, symbol) {
  const decimals = DECIMALS_BY_SYMBOL[symbol] ?? 6;
  const raw = Number(quote?.outAmount);
  if (!Number.isFinite(raw)) return null;
  return raw / 10 ** decimals;
}

export function buildQuoteDepthRows({ pair, sellQuotes = [], buyQuotes = [] }) {
  const parsed = parseSolPair(pair);
  if (!parsed) {
    return {
      bids: [],
      asks: [],
      recent: [],
      source: 'Unsupported pair',
      updatedAt: null,
    };
  }

  const { base, quote } = parsed;
  const updatedAt = new Date().toISOString();
  const bids = sellQuotes
    .map((item) => {
      const outQuote = readOutAmount(item.quote, quote);
      const price = outQuote && item.baseSize ? outQuote / item.baseSize : null;
      return {
        side: 'bid',
        price,
        priceLabel: formatPrice(price),
        size: item.baseSize,
        sizeLabel: formatAmount(item.baseSize, base === 'BONK' ? 0 : 4),
        total: outQuote,
        totalLabel: formatAmount(outQuote, 2),
        venue: item.quote?.routePlan?.[0]?.swapInfo?.label || 'Jupiter',
      };
    })
    .filter((row) => Number.isFinite(row.price));

  const asks = buyQuotes
    .map((item) => {
      const outBase = readOutAmount(item.quote, base);
      const price = outBase && item.quoteSize ? item.quoteSize / outBase : null;
      return {
        side: 'ask',
        price,
        priceLabel: formatPrice(price),
        size: outBase,
        sizeLabel: formatAmount(outBase, base === 'BONK' ? 0 : 4),
        total: item.quoteSize,
        totalLabel: formatAmount(item.quoteSize, 2),
        venue: item.quote?.routePlan?.[0]?.swapInfo?.label || 'Jupiter',
      };
    })
    .filter((row) => Number.isFinite(row.price));

  const recent = [...bids.slice(0, 2), ...asks.slice(0, 2)].map((row) => ({
    side: row.side === 'bid' ? 'buy' : 'sell',
    price: row.priceLabel,
    amount: row.sizeLabel,
    venue: row.venue,
  }));

  return {
    bids,
    asks,
    recent,
    source: 'Jupiter quote depth',
    updatedAt,
  };
}

async function collectQuotes(items, getItemQuote) {
  const results = [];
  const errors = [];

  for (const item of items) {
    try {
      results.push(await getItemQuote(item));
    } catch (error) {
      errors.push(error);
    }
  }

  return { results, errors };
}

export async function fetchJupiterQuoteDepth({ pair, slippageBps = 50 }) {
  const parsed = parseSolPair(pair);
  if (!parsed) {
    return buildQuoteDepthRows({ pair });
  }

  const { base, quote } = parsed;
  const inputMint = MINT_BY_SYMBOL[base];
  const outputMint = MINT_BY_SYMBOL[quote];
  const reverseInputMint = MINT_BY_SYMBOL[quote];
  const reverseOutputMint = MINT_BY_SYMBOL[base];
  const baseSizes = getDepthSizes(base);

  const { results: sellQuotes, errors: sellErrors } = await collectQuotes(
    baseSizes,
    async (baseSize) => ({
      baseSize,
      quote: await getQuote({
        inputMint,
        outputMint,
        amount: toRawAmount(String(baseSize), base),
        slippageBps,
      }),
    })
  );

  if (sellQuotes.length === 0) {
    throw sellErrors[0] || new Error('Jupiter quote depth failed.');
  }

  const referenceSell = sellQuotes.find((item) => Number.isFinite(readOutAmount(item.quote, quote)));
  const referencePrice = readOutAmount(referenceSell?.quote, quote) / referenceSell?.baseSize;
  const quoteSizes = Number.isFinite(referencePrice)
    ? baseSizes.map((baseSize) => baseSize * referencePrice)
    : [];

  const { results: buyQuotes } = await collectQuotes(
    quoteSizes,
    async (quoteSize) => ({
      quoteSize,
      quote: await getQuote({
        inputMint: reverseInputMint,
        outputMint: reverseOutputMint,
        amount: toRawAmount(String(quoteSize), quote),
        slippageBps,
      }),
    })
  );

  return buildQuoteDepthRows({ pair, sellQuotes, buyQuotes });
}
