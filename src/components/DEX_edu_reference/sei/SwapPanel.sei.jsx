/* eslint-disable */
/**
 * SwapPanel.sei.jsx – Swap SEI tokens via Astroport Router (pacific-1 mainnet).
 * Prețuri USD live Binance, quote live pool, perechi multiple.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDownUp, Loader2, TrendingUp, Info, Zap } from 'lucide-react';
import TokenLogo from '../frontend/components/common/TokenLogo';
import TokenSelectorSei from './TokenSelector.sei';
import { useSeiWallet } from './context/SeiWalletContext';
import { executeSwap, calcPlatformFee, PLATFORM_FEE_PCT } from './services/seiContractService';
import { getSkipRoute, buildSkipMsgs, symbolToSkip } from './services/skipService';
import { seiNetwork, SEI_REST, SEI_RPC } from './seiConfig';
import { symbolToDenom, getTokenDecimals, ASTROPORT_POOLS } from './seiTokenConfig';
import { getLpPosition } from './services/seiLpService';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Registry } from '@cosmjs/proto-signing';
import { defaultRegistryTypes } from '@cosmjs/stargate';

const ATOM_IBC = 'ibc/6CDD4663F2F09CD62285E2D45891FC149A3568E316CE3EBBE201A71A78A69388';
const USDC_IBC = 'ibc/CA6FBFAF399474A06263E10D0CE5AEBBE15189D6D4B2DD9ADE61007E68EB9DB0';
const ASTROPORT_ROUTER = 'sei16awrdehvla6kqq2dk5v4m6ze83qfg8trpw55qc8rvfrg9qdmfvhq7hj6x9';
const ASTROPORT_FACTORY = 'sei1xr3rq8yvd7qplsw5yx90ftsr2zdhg4e9z60h5duusgxpv72hud3shh3qfl';

// Pool-uri cunoscute pe Astroport SEI mainnet (verificate on-chain)
const KNOWN_POOLS = [
  { address: 'sei14kxy2g2cw37ng0mmyk6u54qq7xxxnksyhwcvsaf57g30q7ym23vqlmjpm0', label: 'SEI/ATOM', base: 'usei', quote: ATOM_IBC, type: 'xyk' },
  { address: 'sei1ltr0r989uds8y0gahfl6uqec5rqulks06fyugpre0syml8ul0jtsjgv69c', label: 'SEI/USDC', base: 'usei', quote: USDC_IBC, type: 'concentrated' },
];

async function queryContractSmart(contract, msg) {
  const q = btoa(unescape(encodeURIComponent(JSON.stringify(msg))));
  const rest = String(SEI_REST || '').replace(/\/$/, '');
  const res = await fetch(`${rest}/cosmwasm/wasm/v1/contract/${contract}/smart/${q}`);
  if (!res.ok) throw new Error(`Query failed ${res.status}`);
  const d = await res.json();
  return d?.data || d;
}

/** Interogare factory Astroport pentru perechi care conțin un denom */
async function discoverPools(denomA, denomB) {
  try {
    const data = await queryContractSmart(ASTROPORT_FACTORY, {
      pairs: { asset_infos: [
        { native_token: { denom: denomA } },
        { native_token: { denom: denomB } },
      ], limit: 10 },
    });
    return (data?.pairs || []).map(p => ({
      address: p.contract_addr,
      label: p.asset_infos?.map(a => a.native_token?.denom?.slice(0, 10) || '?').join('/') || p.contract_addr,
      type: Object.keys(p.pair_type || {})[0] || 'xyk',
    }));
  } catch { return []; }
}

/** Obține rezervele unui pool XYK */
async function getPoolReserves(poolAddress, baseDenom, quoteDenom) {
  try {
    const data = await queryContractSmart(poolAddress, { pool: {} });
    let baseReserve = 0, quoteReserve = 0;
    for (const a of data?.assets || []) {
      const d = a.info?.native_token?.denom || '';
      if (d === baseDenom) baseReserve = Number(a.amount || 0);
      else if (d === quoteDenom) quoteReserve = Number(a.amount || 0);
    }
    return { baseReserve: baseReserve / 1e6, quoteReserve: quoteReserve / 1e6, totalShare: Number(data?.total_share || 0) };
  } catch { return null; }
}

// Perechi suportate cu info verificare
const SUPPORTED_PAIRS = [
  { from: 'SEI', to: 'ATOM', label: 'SEI → ATOM', verified: true },
  { from: 'ATOM', to: 'SEI', label: 'ATOM → SEI', verified: true },
  { from: 'SEI', to: 'USDC', label: 'SEI → USDC', verified: false },
  { from: 'USDC', to: 'SEI', label: 'USDC → SEI', verified: false },
];

const SLIPPAGE_OPTS = ['0.5%', '1%', '2%', '3%'];
const PCT_OPTS = [25, 50, 75, 100];

// Prețuri USD per token (Binance)
const BINANCE_PRICE_SYMBOLS = {
  SEI: 'SEIUSDT',
  ATOM: 'ATOMUSDT',
  USDC: null, // = 1
  USDT: null, // = 1
  WETH: 'ETHUSDT',
};

const COINGECKO_IDS = { SEI: 'sei-network', ATOM: 'cosmos', WETH: 'ethereum' };

async function fetchTokenPrices(symbols) {
  const prices = {};
  // Stablecoins = $1
  for (const sym of symbols) {
    if (!BINANCE_PRICE_SYMBOLS[sym]) prices[sym] = 1.0;
  }
  const toFetch = symbols.filter(s => BINANCE_PRICE_SYMBOLS[s] && COINGECKO_IDS[s]);
  if (!toFetch.length) return prices;

  // 1) CoinGecko — stabil, fără throttle
  try {
    const ids = toFetch.map(s => COINGECKO_IDS[s]).join(',');
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    if (res.ok) {
      const data = await res.json();
      for (const sym of toFetch) {
        const id = COINGECKO_IDS[sym];
        const p = parseFloat(data?.[id]?.usd) || 0;
        prices[sym] = p > 0 ? p : 0;
      }
      // Dacă toate prețurile au venit → return
      if (toFetch.every(s => prices[s] > 0)) return prices;
    }
  } catch { /* fallback */ }

  // 2) Fallback Binance
  for (const sym of toFetch) {
    if (prices[sym] > 0) continue;
    try {
      const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${BINANCE_PRICE_SYMBOLS[sym]}`);
      const d = await r.json();
      prices[sym] = parseFloat(d.price) || 0;
    } catch { prices[sym] = 0; }
  }
  return prices;
}

function toMinimalUnits(amount, symbol) {
  const n = parseFloat(amount);
  if (!Number.isFinite(n) || n <= 0) return '0';
  return String(Math.floor(n * 10 ** getTokenDecimals(symbol)));
}

function assetInfo(denom) {
  return { native_token: { denom } };
}

async function simulateRouterOps(operations, offerAmount) {
  try {
    const q = btoa(JSON.stringify({
      simulate_swap_operations: { offer_amount: String(offerAmount), operations },
    }));
    const rest = String(SEI_REST || '').replace(/\/$/, '');
    const res = await fetch(`${rest}/cosmwasm/wasm/v1/contract/${ASTROPORT_ROUTER}/smart/${q}`);
    if (!res.ok) return null;
    const data = await res.json();
    return Number(data?.data?.amount || 0);
  } catch { return null; }
}

/** Încearcă rute multiple și returnează cel mai bun quote + ruta folosită */
async function getBestRouterQuote(fromSymbol, toSymbol, amount) {
  if (!amount || parseFloat(amount) <= 0) return null;
  const fromDenom = symbolToDenom(fromSymbol);
  const toDenom   = symbolToDenom(toSymbol);
  if (!fromDenom || !toDenom || fromDenom === toDenom) return null;

  const amountIn = Math.floor(parseFloat(amount) * 10 ** getTokenDecimals(fromSymbol));
  const toDecimals = getTokenDecimals(toSymbol);

  // Ruta 1: Direct (1 hop)
  const directOps = [{ astro_swap: { offer_asset_info: assetInfo(fromDenom), ask_asset_info: assetInfo(toDenom) } }];

  // Ruta 2: Multi-hop prin USDC (SEI→USDC→ATOM sau invers)
  let multiOps = null;
  if (fromDenom === 'usei' && toDenom === ATOM_IBC) {
    multiOps = [
      { astro_swap: { offer_asset_info: assetInfo('usei'),     ask_asset_info: assetInfo(USDC_IBC) } },
      { astro_swap: { offer_asset_info: assetInfo(USDC_IBC),   ask_asset_info: assetInfo(ATOM_IBC) } },
    ];
  } else if (fromDenom === ATOM_IBC && toDenom === 'usei') {
    multiOps = [
      { astro_swap: { offer_asset_info: assetInfo(ATOM_IBC),   ask_asset_info: assetInfo(USDC_IBC) } },
      { astro_swap: { offer_asset_info: assetInfo(USDC_IBC),   ask_asset_info: assetInfo('usei')   } },
    ];
  }

  const [directRaw, multiRaw] = await Promise.all([
    simulateRouterOps(directOps, amountIn),
    multiOps ? simulateRouterOps(multiOps, amountIn) : Promise.resolve(null),
  ]);

  const directOut = directRaw ? directRaw / 10 ** toDecimals : null;
  const multiOut  = multiRaw  ? multiRaw  / 10 ** toDecimals : null;

  if (!directOut && !multiOut) return null;

  // Alege ruta cu output mai mare
  if (multiOut && (!directOut || multiOut > directOut * 1.001)) {
    return { amount: multiOut, route: `${fromSymbol} → USDC → ${toSymbol}`, ops: multiOps };
  }
  return { amount: directOut, route: `${fromSymbol} → ${toSymbol} (direct)`, ops: directOps };
}

function UsdValue({ amount, price, symbol }) {
  if (!amount || !price || parseFloat(amount) <= 0) return null;
  const usd = parseFloat(amount) * price;
  return (
    <span style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginLeft: 4 }}>
      ≈ <strong style={{ color: '#94a3b8' }}>${usd.toFixed(2)}</strong>
    </span>
  );
}

export default function SwapPanelSei() {
  const { address, balance: seiBalance, isConnected, connect, getOfflineSigner } = useSeiWallet();
  const [fromAmount, setFromAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [bestRoute, setBestRoute] = useState(null);
  const [poolsInfo, setPoolsInfo] = useState([]); // pool-uri cu rezerve
  const [showPools, setShowPools] = useState(false);
  const [slippage, setSlippage] = useState('1%');
  const [fromPair, setFromPair] = useState('SEI');
  const [toPair, setToPair] = useState('ATOM');
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [prices, setPrices] = useState({});
  const [priceLoading, setPriceLoading] = useState(true);

  // Skip Protocol cross-chain state
  const [skipMode, setSkipMode] = useState(false);       // true = folosim Skip în loc de Astroport
  const [skipRoute, setSkipRoute] = useState(null);      // ruta Skip găsită
  const [skipLoading, setSkipLoading] = useState(false);
  const [skipStatusMsg, setSkipStatusMsg] = useState(null); // progres IBC

  // User is LP in current pool (SEI/ATOM only) — don't block high impact when swapping against own liquidity
  const [userLpInThisPool, setUserLpInThisPool] = useState(false);
  const [lpSharePercent, setLpSharePercent] = useState(null);

  // Fetch prețuri USD
  useEffect(() => {
    setPriceLoading(true);
    fetchTokenPrices(['SEI', 'ATOM', 'USDC', 'USDT', 'WETH'])
      .then(p => { setPrices(p); setPriceLoading(false); });
    const interval = setInterval(() => {
      fetchTokenPrices(['SEI', 'ATOM', 'USDC', 'USDT', 'WETH']).then(setPrices);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check if user is LP in the current pool (SEI/ATOM XYK has LP tokens; SEI/USDC is CL so no LP check)
  const isSeiAtomPair = (fromPair === 'SEI' && toPair === 'ATOM') || (fromPair === 'ATOM' && toPair === 'SEI');
  useEffect(() => {
    if (!address || !isSeiAtomPair || !ASTROPORT_POOLS.SEI_ATOM_XYK?.lpTokenAddress) {
      setUserLpInThisPool(false);
      setLpSharePercent(null);
      return;
    }
    getLpPosition(address, ASTROPORT_POOLS.SEI_ATOM_XYK)
      .then((pos) => {
        const hasLp = pos && (pos.lpBalance || 0) > 0;
        setUserLpInThisPool(hasLp);
        setLpSharePercent(hasLp && pos.sharePercent != null ? pos.sharePercent : null);
      })
      .catch(() => {
        setUserLpInThisPool(false);
        setLpSharePercent(null);
      });
  }, [address, isSeiAtomPair]);

  // Descoperă pool-uri RELEVANTE pentru perechea curentă
  useEffect(() => {
    const fromDenom = symbolToDenom(fromPair);
    const toDenom = symbolToDenom(toPair);
    if (!fromDenom || !toDenom) return;
    // Filtrează doar pool-urile care conțin ambii tokeni ai perechii curente
    const relevantPools = KNOWN_POOLS.filter(p =>
      (p.base === fromDenom || p.quote === fromDenom) &&
      (p.base === toDenom   || p.quote === toDenom)
    );
    // Dacă nu există pool direct, arată toate (pentru multi-hop info)
    const poolsToQuery = relevantPools.length > 0 ? relevantPools : KNOWN_POOLS;
    Promise.all(
      poolsToQuery.map(async p => {
        const res = await getPoolReserves(p.address, p.base, p.quote);
        return res ? { ...p, ...res, isRelevant: relevantPools.includes(p) } : null;
      })
    ).then(results => {
      setPoolsInfo(results.filter(Boolean));
    }).catch(() => {});
  }, [fromPair, toPair]);

  // Quote live — folosește Router cu multi-hop
  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) { setQuote(null); setBestRoute(null); return; }
    setQuoteLoading(true);
    const t = setTimeout(() => {
      getBestRouterQuote(fromPair, toPair, fromAmount)
        .then(res => {
          if (res) { setQuote(res.amount); setBestRoute(res.route); }
          else { setQuote(null); setBestRoute(null); }
        })
        .finally(() => setQuoteLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [fromAmount, fromPair, toPair]);

  // Price impact %
  const priceImpact = (() => {
    if (!quote || !fromAmount || !prices[fromPair] || !prices[toPair]) return null;
    const usdIn = parseFloat(fromAmount) * prices[fromPair];
    const usdOut = quote * prices[toPair];
    if (usdIn <= 0) return null;
    return ((usdIn - usdOut) / usdIn) * 100;
  })();
  const impactHigh = priceImpact != null && priceImpact > 15;
  const impactDanger = priceImpact != null && priceImpact > 5;

  // ── Skip Protocol: fetch route când skipMode e activ ──────────────────────
  useEffect(() => {
    if (!skipMode || !fromAmount || parseFloat(fromAmount) <= 0) {
      setSkipRoute(null);
      return;
    }
    const src = symbolToSkip(fromPair);
    const dst = symbolToSkip(toPair);
    if (!src || !dst) { setSkipRoute(null); return; }

    setSkipLoading(true);
    const amountIn = toMinimalUnits(fromAmount, fromPair);
    const t = setTimeout(async () => {
      try {
        const route = await getSkipRoute({
          srcDenom: src.denom, srcChain: src.chain,
          dstDenom: dst.denom, dstChain: dst.chain,
          amountIn: String(amountIn),
        });
        setSkipRoute(route);
      } catch (e) {
        setSkipRoute(null);
      } finally {
        setSkipLoading(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [skipMode, fromAmount, fromPair, toPair]);

  // ── Swap via Astroport ──────────────────────────────────────────────────────
  const handleSwapAstroport = async (amount) => {
    const routeResult = await getBestRouterQuote(fromPair, toPair, amount);
    const result = await executeSwap({
      senderAddress: address,
      tokenIn: symbolToDenom(fromPair),
      tokenOut: symbolToDenom(toPair),
      amountIn: toMinimalUnits(amount, fromPair),
      minAmountOut: '0',
      signer: await getOfflineSigner(),
      operations: routeResult?.ops || null,
    });
    return result?.txHash || null;
  };

  // ── Swap via Skip Protocol (cross-chain) ───────────────────────────────────
  const handleSwapSkip = async (amount) => {
    if (!skipRoute) throw new Error('No Skip route found. Please try again.');
    const offlineSigner = await getOfflineSigner();
    if (!offlineSigner) throw new Error('Signer unavailable. Please reconnect your wallet.');

    setSkipStatusMsg('⏳ Building Skip transactions...');

    const { txs } = await buildSkipMsgs({ route: skipRoute, seiAddress: address });
    if (!txs || txs.length === 0) throw new Error('Skip returned no transactions. Try again.');

    let lastHash = null;
    for (let i = 0; i < txs.length; i++) {
      const txObj = txs[i];
      // Skip returnează cosmos_tx cu msgs în format { msg_type_url, msg (base64 proto value) }
      const cosmosTx = txObj.cosmos_tx;
      if (!cosmosTx) throw new Error('Unexpected Skip response: no cosmos_tx found.');

      // Cu Skip smart relay, utilizatorul semnează MEREU pe SEI chain via Compass
      const signerAddress = address;

      // Skip returnează msg ca JSON string (snake_case) — convertim la camelCase CosmJS
      const snakeToCamel = k => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      const convertKeys = (obj) => {
        if (Array.isArray(obj)) return obj.map(convertKeys);
        if (obj && typeof obj === 'object') {
          return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [snakeToCamel(k), convertKeys(v)])
          );
        }
        return obj;
      };

      const cosmjsMsgs = (cosmosTx.msgs || []).map(m => {
        let parsed;
        try { parsed = JSON.parse(m.msg); } catch {
          throw new Error('Skip returned invalid message format.');
        }
        const value = convertKeys(parsed);

        // CRITIC: sender trebuie să fie adresa utilizatorului (Skip lasă câmpul gol)
        if (!value.sender) value.sender = address;

        // timeout_timestamp e în nanosecunde ca string → BigInt
        if (value.timeoutTimestamp && typeof value.timeoutTimestamp === 'string') {
          value.timeoutTimestamp = BigInt(value.timeoutTimestamp);
        }
        // timeoutHeight: revisionNumber și revisionHeight ca Long/number
        if (value.timeoutHeight) {
          value.timeoutHeight = {
            revisionNumber: Number(value.timeoutHeight.revisionNumber || 0),
            revisionHeight: Number(value.timeoutHeight.revisionHeight || 0),
          };
        }

        return { typeUrl: m.msg_type_url, value };
      });

      // Fee — folosim ce returnează Skip, cu fallback generos
      const skipFee = cosmosTx.fee;
      const fee = skipFee && skipFee.amount?.length
        ? { amount: skipFee.amount, gas: String(skipFee.gas || '350000') }
        : { amount: [{ denom: 'usei', amount: '100000' }], gas: '400000' };

      // Registry cu tipuri IBC incluse (MsgTransfer)
      const registry = new Registry(defaultRegistryTypes);

      // Fallback RPC-uri SEI mainnet (primul = env / bridgeConfig; rest = fallback la rate limit)
      const SEI_RPCS = [...new Set([
        SEI_RPC,
        'https://sei-rpc.polkachu.com',
        'https://rpc.sei-apis.com',
        'https://sei.rpc.kjnodes.com',
        'https://rpc.sei.basementnodes.ca',
      ].filter(Boolean))];
      let client = null;
      for (const rpc of SEI_RPCS) {
        try {
          client = await SigningCosmWasmClient.connectWithSigner(rpc, offlineSigner, {
            gasPrice: { denom: 'usei', amount: '0.025' },
            registry,
          });
          break;
        } catch { /* încearcă următorul */ }
      }
      if (!client) throw new Error('All SEI RPC endpoints are unavailable. Try again in a moment.');

      setSkipStatusMsg(`⏳ Sign transaction ${i + 1}/${txs.length} in your wallet...`);

      const result = await client.signAndBroadcast(
        signerAddress,
        cosmjsMsgs,
        fee,
        'Skip cross-chain swap'
      );
      if (result.code !== 0) throw new Error(`Tx ${i + 1} failed (code ${result.code}): ${result.rawLog}`);
      lastHash = result.transactionHash;
      setSkipStatusMsg(`✅ Tx ${i + 1}/${txs.length} sent! Waiting for IBC...`);
      if (i < txs.length - 1) await new Promise(r => setTimeout(r, 2000));
    }

    setSkipStatusMsg(`🔄 IBC in progress (~30-90 sec). ${toPair} is on its way to your wallet!`);
    setTimeout(() => setSkipStatusMsg(null), 60000);
    return lastHash;
  };

  // ── Handler principal Swap ─────────────────────────────────────────────────
  const handleSwap = async () => {
    setError(null); setTxHash(null);
    const amount = fromAmount?.trim();
    if (!amount || parseFloat(amount) <= 0) { setError('Enter an amount'); return; }
    if (!address) { setError('Connect your wallet first'); return; }
    if (impactHigh && !userLpInThisPool) {
      setError(`Price impact too high (${priceImpact.toFixed(1)}%). Use a smaller amount or trade on a CEX (Binance, Coinbase) — this swap is blocked to protect your funds.`);
      return;
    }
    setLoading(true);
    try {
      const hash = skipMode
        ? await handleSwapSkip(amount)
        : await handleSwapAstroport(amount);
      setTxHash(hash);
      setFromAmount(''); setQuote(null); setBestRoute(null); setSkipRoute(null);
    } catch (e) {
      setError(e?.message || 'Swap failed');
      setSkipStatusMsg(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setFromPair(toPair); setToPair(fromPair);
    setFromAmount(''); setQuote(null);
  };

  const handlePct = (pct) => {
    if (!seiBalance || fromPair !== 'SEI') return;
    const amt = (Number(seiBalance) * pct / 100);
    setFromAmount(pct === 100 ? Math.max(0, amt - 0.01).toFixed(4) : amt.toFixed(4));
  };

  const txUrl = (hash) => `https://www.seiscan.app/pacific-1/txs/${hash}`;
  const canSwap = isConnected && fromAmount && parseFloat(fromAmount) > 0 && !loading
    && (skipMode ? !!skipRoute : (!impactHigh || userLpInThisPool));
  const isPairVerified = SUPPORTED_PAIRS.find(p => p.from === fromPair && p.to === toPair)?.verified;
  // Skip: disponibil dacă ambele simboluri au mapping
  const skipAvailable = !!symbolToSkip(fromPair) && !!symbolToSkip(toPair) && fromPair !== toPair;
  // Quote afișat
  const displayQuote = skipMode
    ? (skipRoute ? (parseFloat(skipRoute.amountOut) / 1e6).toFixed(6) : null)
    : quote;
  const displayRoute = skipMode
    ? (skipRoute ? `Skip: ${skipRoute.routeLabel}` : null)
    : bestRoute;

  // Exchange rate display
  const exchangeRate = fromAmount && quote && parseFloat(fromAmount) > 0
    ? (quote / parseFloat(fromAmount)).toFixed(6)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Network row */}
      <div style={{ fontSize: 11, color: 'var(--ds-text-secondary)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>Network: <strong style={{ color: 'var(--ds-text-primary)' }}>pacific-1</strong></span>
        <span style={{ color: '#22c55e' }}>● Astroport Router</span>
        <span title="Use the Symphony tab above for aggregated liquidity if pools are empty">(low liquidity? try Symphony)</span>
        {!priceLoading && prices.SEI > 0 && (
          <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>
            SEI ${prices.SEI?.toFixed(4)} · ATOM ${prices.ATOM?.toFixed(3)}
          </span>
        )}
      </div>

      {/* FROM */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ds-text-secondary)' }}>
          <span>From</span>
          <span>
            {isConnected && fromPair === 'SEI' && seiBalance != null && (
              <>
                Balance: <strong style={{ color: 'var(--ds-text-primary)' }}>{Number(seiBalance).toFixed(4)} SEI</strong>
                <UsdValue amount={seiBalance} price={prices.SEI} symbol="SEI" />
              </>
            )}
          </span>
        </div>
        <div style={{ padding: '10px 12px', border: '1px solid var(--ds-border-color, #27272a)', borderRadius: 10, background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
            <TokenLogo symbol={fromPair} size="24" showBorder />
            <input
              aria-label="Amount from"
              type="number" min="0" placeholder="0.0" value={fromAmount}
              onChange={e => setFromAmount(e.target.value)}
              style={{ flex: '1 1 0', minWidth: 0, width: 0, border: 'none', background: 'transparent', fontSize: 20, fontWeight: 600, outline: 'none', color: 'var(--ds-text-primary, #e2e8f0)' }}
            />
            <TokenSelectorSei variant="token" value={fromPair} onChange={v => { setFromPair(v); setFromAmount(''); setQuote(null); }} label="Token from" />
          </div>
          {fromAmount && parseFloat(fromAmount) > 0 && prices[fromPair] > 0 && (
            <div style={{ fontSize: 11, color: '#64748b', paddingLeft: 34 }}>
              ≈ ${(parseFloat(fromAmount) * prices[fromPair]).toFixed(2)} USD
            </div>
          )}
        </div>
        {/* % buttons */}
        {isConnected && fromPair === 'SEI' && seiBalance != null && (
          <div style={{ display: 'flex', gap: 4 }}>
            {PCT_OPTS.map(p => (
              <button key={p} type="button" onClick={() => handlePct(p)}
                style={{ flex: 1, padding: '3px 0', fontSize: 11, borderRadius: 5, border: '1px solid var(--ds-border-color, #27272a)', background: 'rgba(255,255,255,0.03)', color: 'var(--ds-text-secondary)', cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.background = 'rgba(99,102,241,0.12)'}
                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.03)'}>
                {p === 100 ? 'MAX' : `${p}%`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FLIP */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--ds-border-color,#27272a)' }} />
        <button type="button" onClick={handleFlip}
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}
          title="Flip pair">
          <ArrowDownUp size={13} />
        </button>
        <div style={{ flex: 1, height: 1, background: 'var(--ds-border-color,#27272a)' }} />
      </div>

      {/* Skip Protocol Toggle */}
      {skipAvailable && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: skipMode ? 'rgba(234,179,8,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${skipMode ? 'rgba(234,179,8,0.45)' : 'var(--ds-border-color,#27272a)'}`, cursor: 'pointer' }} onClick={() => { setSkipMode(m => !m); setSkipRoute(null); setSkipStatusMsg(null); }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Zap size={14} style={{ color: skipMode ? '#eab308' : '#64748b' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: skipMode ? '#eab308' : 'var(--ds-text-secondary)' }}>
                Skip Cross-chain
              </span>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(234,179,8,0.15)', color: '#eab308' }}>IBC</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {skipMode && <span style={{ fontSize: 10, color: '#64748b' }}>~30-90 sec</span>}
              <div style={{ width: 32, height: 17, borderRadius: 9, background: skipMode ? '#eab308' : '#334155', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: skipMode ? 17 : 2, transition: 'left 0.2s' }} />
              </div>
            </div>
          </div>
          {skipMode && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.25)', fontSize: 11, color: '#94a3b8', lineHeight: 1.7 }}>
              ⚡ Cross-chain routing via IBC — your swap travels through multiple blockchains to find the best price.
              It usually completes in <strong style={{ color: '#e2e8f0' }}>30–90 seconds</strong>.
              In rare cases of network congestion, delivery may take longer — but your funds are always safe and traceable on-chain.
            </div>
          )}
        </div>
      )}

      {/* TO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
          You receive (estimated) {skipMode && <span style={{ color: '#818cf8', fontWeight: 600 }}>· via Skip IBC</span>}
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 10, background: (!skipMode && impactHigh && !userLpInThisPool) ? 'rgba(239,68,68,0.04)' : (skipMode || (impactHigh && userLpInThisPool)) ? 'rgba(99,102,241,0.04)' : 'rgba(34,197,94,0.03)', border: `1px solid ${(!skipMode && impactHigh && !userLpInThisPool) ? 'rgba(239,68,68,0.25)' : (skipMode || (impactHigh && userLpInThisPool)) ? 'rgba(99,102,241,0.25)' : 'rgba(34,197,94,0.12)'}`, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
            <TokenLogo symbol={toPair} size="24" showBorder />
            <div aria-label="Amount to" style={{ flex: 1, fontSize: 20, fontWeight: 600, color: (!skipMode && impactHigh && !userLpInThisPool) ? '#f87171' : (quoteLoading || skipLoading) ? '#475569' : displayQuote != null ? (skipMode || (impactHigh && userLpInThisPool) ? '#818cf8' : '#22c55e') : 'var(--ds-text-secondary)' }}>
              {!skipMode && impactHigh && !userLpInThisPool ? (
                <span style={{ fontSize: 14, fontWeight: 500 }}>⛔ Blocked</span>
              ) : (quoteLoading || skipLoading) ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> …</span>
              ) : displayQuote != null ? parseFloat(displayQuote).toFixed(6) : '0.0'}
            </div>
            <TokenSelectorSei variant="token" value={toPair} onChange={v => { setToPair(v); setQuote(null); setSkipRoute(null); }} label="Token to" />
          </div>
          {!skipMode && impactHigh && !userLpInThisPool ? (
            <div style={{ fontSize: 11, color: '#f87171', paddingLeft: 34 }}>
              Price impact too high — use a smaller amount or trade on a CEX (e.g. Binance, Coinbase).
            </div>
          ) : !skipMode && impactHigh && userLpInThisPool ? (
            <div style={{ fontSize: 11, color: '#818cf8', paddingLeft: 34 }}>
              You provide liquidity to this pool{lpSharePercent != null ? ` (${lpSharePercent.toFixed(2)}%)` : ''}. High impact is expected; you can proceed.
            </div>
          ) : displayQuote != null && prices[toPair] > 0 && (
            <div style={{ fontSize: 11, color: skipMode ? '#818cf8' : '#22c55e', paddingLeft: 34 }}>
              ≈ ${(parseFloat(displayQuote) * prices[toPair]).toFixed(2)} USD
              {skipMode && skipRoute?.txsRequired > 1 && <span style={{ color: '#64748b', marginLeft: 6 }}>· {skipRoute.txsRequired} tx-uri</span>}
            </div>
          )}
        </div>
      </div>

      {/* Skip status progress */}
      {skipStatusMsg && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', fontSize: 12, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 size={12} style={{ animation: skipStatusMsg.startsWith('✅') || skipStatusMsg.startsWith('🔄') ? 'none' : 'spin 1s linear infinite' }} />
          {skipStatusMsg}
        </div>
      )}

      {/* Rate + slippage box */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ds-border-color,#27272a)', fontSize: 12 }}>
        {!skipMode && exchangeRate && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ds-text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={11} /> Rate</span>
            <strong style={{ color: 'var(--ds-text-primary)' }}>1 {fromPair} = {exchangeRate} {toPair}</strong>
          </div>
        )}
        {displayRoute && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--ds-text-secondary)', fontSize: 11 }}>Best route</span>
            <span style={{ fontSize: 11, background: skipMode ? 'rgba(99,102,241,0.15)' : displayRoute.includes('USDC') ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.1)', color: skipMode ? '#818cf8' : displayRoute.includes('USDC') ? '#22c55e' : '#818cf8', padding: '1px 7px', borderRadius: 4, fontWeight: 600 }}>
              {displayRoute}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--ds-text-secondary)' }}>Slippage:</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {SLIPPAGE_OPTS.map(s => (
              <button key={s} type="button" onClick={() => setSlippage(s)}
                style={{ padding: '2px 7px', borderRadius: 4, border: `1px solid ${slippage === s ? 'rgba(99,102,241,0.6)' : 'var(--ds-border-color,#27272a)'}`, background: slippage === s ? 'rgba(99,102,241,0.15)' : 'transparent', color: slippage === s ? '#818cf8' : 'var(--ds-text-secondary)', cursor: 'pointer', fontSize: 11, fontWeight: slippage === s ? 600 : 400 }}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ds-text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Info size={11} />
            Pool fee (LP providers)
          </span>
          <span>0.30%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ds-text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Info size={11} />
            <span style={{ color: '#818cf8' }}>Platform fee</span>
          </span>
          <span style={{ color: '#818cf8' }}>
            {(PLATFORM_FEE_PCT * 100).toFixed(2)}%
            {fromAmount && fromPair === 'SEI' && calcPlatformFee(Math.floor((parseFloat(fromAmount)||0)*1e6), 'usei').willCollect
              ? ` (≈ ${(calcPlatformFee(Math.floor((parseFloat(fromAmount)||0)*1e6), 'usei').feeAmount / 1e6).toFixed(4)} SEI)`
              : ''}
          </span>
        </div>
        {priceImpact != null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: impactHigh ? '#f87171' : impactDanger ? '#eab308' : '#22c55e' }}>
              <Info size={11} /> Price impact
            </span>
            <strong style={{ color: impactHigh ? '#f87171' : impactDanger ? '#eab308' : '#22c55e', fontSize: 12 }}>
              {priceImpact.toFixed(2)}%
            </strong>
          </div>
        )}
        {!isPairVerified && fromPair && toPair && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#eab308', fontSize: 11 }}>
            <Info size={11} /> Experimental pair – not yet verified on Router
          </div>
        )}
      </div>
      {/* PRICE IMPACT: when user is LP in this pool, allow swap and show info; otherwise block */}
      {!skipMode && impactHigh && userLpInThisPool && (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.4)', fontSize: 12, color: '#a5b4fc', lineHeight: 1.6 }}>
          ℹ️ <strong>You provide liquidity to this pool</strong>{lpSharePercent != null ? ` (${lpSharePercent.toFixed(2)}% share)` : ''}.<br />
          High price impact ({priceImpact.toFixed(1)}%) is expected when swapping large amounts against your own pool. You can proceed if you accept it.
        </div>
      )}
      {!skipMode && impactHigh && !userLpInThisPool && (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.12)', border: '2px solid rgba(248,113,113,0.5)', fontSize: 12, color: '#f87171', lineHeight: 1.6 }}>
          ⛔ <strong>Price impact {priceImpact.toFixed(1)}% — SWAP BLOCKED</strong><br />
          You would lose ~${((parseFloat(fromAmount)||0)*prices[fromPair] - (quote||0)*(prices[toPair]||0)).toFixed(2)} USD in this trade.<br />
          The pool has low liquidity for this amount. Try a smaller amount here, or use a centralized exchange (CEX): e.g. Binance, Coinbase, or Kraken — open an account, deposit SEI or USDC, and trade the pair there for deeper liquidity.
        </div>
      )}
      {!skipMode && impactDanger && !impactHigh && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.35)', fontSize: 12, color: '#eab308' }}>
          ⚠️ <strong>High price impact ({priceImpact.toFixed(1)}%)</strong> — consider a smaller amount.
        </div>
      )}
      {/* SKIP STATUS BANNER */}
      {skipMode && fromAmount && parseFloat(fromAmount) > 0 && !skipRoute && !skipLoading && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', fontSize: 12, color: '#818cf8' }}>
          ⚡ Skip is searching for a cross-chain route (IBC)... If no quote appears, try a larger amount (min ~5 SEI).
        </div>
      )}
      {skipMode && skipRoute && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 12, color: '#818cf8', lineHeight: 1.6 }}>
          ⚡ <strong>Route found:</strong> {skipRoute.routeLabel}<br />
          Est. time: ~30-90 sec · {skipRoute.txsRequired} transaction(s) to sign
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div role="alert" style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', fontSize: 12, color: '#f87171', lineHeight: 1.5, wordBreak: 'break-word' }}>
          {error}
        </div>
      )}

      {/* TX HASH */}
      {txHash && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', fontSize: 12, color: '#22c55e' }}>
          ✅ Swap successful!{' '}
          <a href={txUrl(txHash)} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'underline' }}>
            {txHash.slice(0, 10)}…{txHash.slice(-8)}
          </a>
        </div>
      )}

      {/* MAIN BUTTON */}
      {!isConnected ? (
        <button type="button" onClick={() => connect?.('keplr')}
          style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: 'var(--ds-accent,#6366f1)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', letterSpacing: '-0.01em' }}>
          Connect Wallet
        </button>
      ) : (
        <button type="button" disabled={!canSwap} onClick={handleSwap}
          style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: canSwap ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: canSwap ? 'pointer' : 'not-allowed', opacity: canSwap ? 1 : 0.55, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '-0.01em' }}>
          {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
          {loading ? 'Swapping…' : `Swap ${fromPair} → ${toPair}`}
        </button>
      )}

      {/* ── Available Pools ── */}
      <div style={{ marginTop: 4 }}>
        <button type="button" onClick={() => setShowPools(p => !p)}
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ds-text-secondary)', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '4px 0' }}>
          <Info size={11} />
          {showPools ? 'Hide' : 'Show'} available pools
        </button>
        {showPools && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>

            {/* Pool-uri relevante pentru perechea curentă */}
            {poolsInfo.filter(p => p.isRelevant).length > 0 ? (
              poolsInfo.filter(p => p.isRelevant).map((p, i) => {
                const tvlSei = (p.baseReserve || 0) * (prices['SEI'] || 0) * 2;
                const isLow = tvlSei < 100;
                return (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: isLow ? 'rgba(239,68,68,0.04)' : 'rgba(34,197,94,0.04)', border: `1px solid ${isLow ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`, fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontWeight: 700, color: 'var(--ds-text-primary)', fontSize: 12 }}>{p.label}</span>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '1px 6px', borderRadius: 3, fontSize: 10 }}>{p.type?.toUpperCase()}</span>
                        <span style={{ background: isLow ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: isLow ? '#f87171' : '#22c55e', padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 700 }}>
                          {isLow ? '⚠ Low liquidity' : '✓ Active'}
                        </span>
                      </div>
                    </div>
                    <div style={{ color: 'var(--ds-text-secondary)', display: 'flex', gap: 12, marginBottom: 4 }}>
                      <span>SEI: <strong style={{ color: 'var(--ds-text-primary)' }}>{(p.baseReserve||0).toLocaleString('en', { maximumFractionDigits: 1 })}</strong></span>
                      <span>{p.label.split('/')[1]}: <strong style={{ color: 'var(--ds-text-primary)' }}>{(p.quoteReserve||0).toLocaleString('en', { maximumFractionDigits: 2 })}</strong></span>
                      {tvlSei > 0 && <span>TVL: <strong style={{ color: isLow ? '#f87171' : '#22c55e' }}>${tvlSei.toFixed(0)}</strong></span>}
                    </div>
                    <a href={`https://www.seiscan.app/pacific-1/contracts/${p.address}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#818cf8', fontSize: 10, textDecoration: 'none' }}>
                      {p.address.slice(0, 20)}…{p.address.slice(-6)} ↗
                    </a>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 11, color: '#f87171' }}>
                ⛔ No direct pool found for {fromPair}/{toPair} on Astroport SEI
              </div>
            )}

            {/* Sugestii perechi cu lichiditate bună */}
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 11 }}>
              <div style={{ color: '#818cf8', fontWeight: 600, marginBottom: 6 }}>💡 Pairs with good liquidity on Astroport SEI:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { from: 'SEI', to: 'USDC', label: 'SEI → USDC', tvl: '$2,260', status: '✅ Ready' },
                  { from: 'USDC', to: 'SEI', label: 'USDC → SEI', tvl: '$2,260', status: '✅ Ready' },
                ].map(s => (
                  <button key={s.label} type="button"
                    onClick={() => { setFromPair(s.from); setToPair(s.to); setFromAmount(''); setQuote(null); setShowPools(false); }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.08)', cursor: 'pointer', color: 'var(--ds-text-primary)', fontSize: 11 }}>
                    <span style={{ fontWeight: 600 }}>{s.label}</span>
                    <div style={{ display: 'flex', gap: 8, color: 'var(--ds-text-secondary)' }}>
                      <span>TVL {s.tvl}</span>
                      <span style={{ color: '#22c55e' }}>{s.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 10, color: 'var(--ds-text-secondary)', textAlign: 'center' }}>
              For more pairs, visit{' '}
              <a href="https://app.astroport.fi/swap" target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8' }}>Astroport ↗</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
