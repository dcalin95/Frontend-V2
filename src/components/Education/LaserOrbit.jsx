import React, { useEffect, useRef, useState } from 'react';
import BITS_LOGO from '../../assets/logo.png';
import './LaserOrbit.css';
import useCellManagerData from '../../Presale/hooks/useCellManagerData';
import { usePresaleState } from '../../Presale/Timer/usePresaleState';

export default function LaserOrbit({
  centerLabel = 'AI',
  nodes = [],
  variant = 'classic',
}) {
  // Formatting helpers
  const formatIntRO = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return '-';
    return Math.round(v).toLocaleString('ro-RO');
  };
  const formatUSD = (n, min = 2, max = 2) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return '-';
    return `$${(Math.round(v * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: max })}`;
  };
  const formatUSDCompact = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return '-';
    if (Math.abs(v) >= 1_000_000) return `$${(v/1_000_000).toFixed(2)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v/1_000).toFixed(2)}K`;
    return formatUSD(v);
  };
  const adjustRaisedForDisplay = (raised, soldBits) => {
    const r = Number(raised);
    const s = Number(soldBits);
    if (!Number.isFinite(r)) return raised;
    if (s >= 1000 && r < 1000) return r * 1000; // backend may return in thousands-unscaled
    return r;
  };
  const applyWalletBaseline = (walletUsers, txCount) => {
    const BASE = 12001;
    const wu = Number(walletUsers || 0);
    const tx = Number(txCount || 0);
    const source = Math.max(wu, tx);
    if (source <= 0 && BASE) return BASE; // always show baseline
    return BASE + source;
  };
  const formatPrice = (n) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return '—';
    return `$${v.toFixed(3)}`; // show 0.001 format
  };
  function MegaBitsTyped({
    priceUSD,
    round,
    completion,
    soldBits,
    raisedUSD,
    availableBits,
    txCount,
    telegramUsers,
    telegramMembers,
    prevRoundPrice,
    totalSupply,
    startTime,
    endTime,
    totalBoosted
  }) {
    const [lineIndex, setLineIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [done, setDone] = useState(false);

    const lines = [
      { label: 'Presale', value: Number.isFinite(priceUSD) ? `$${priceUSD.toFixed(4)}` : '—' },
      { label: 'Round', value: `${round ?? '-'}` },
      { label: 'Completion', value: completion != null ? `${(Number(completion) || 0).toFixed(2)}%` : '-' },
      { label: 'Sold', value: Number.isFinite(soldBits) ? `${Math.round(soldBits).toLocaleString()} BITS` : '-' },
      { label: 'Raised', value: Number.isFinite(raisedUSD) ? `$${Math.round(raisedUSD).toLocaleString()}` : '-' },
      { label: 'Available', value: Number.isFinite(availableBits) ? `${Math.round(availableBits).toLocaleString()} BITS` : '-' },
      { label: 'Tx', value: txCount != null ? `${Math.round(Number(txCount)).toLocaleString()}` : '-' },
      { label: 'TG Wallet Users', value: telegramUsers != null ? `${Math.round(Number(telegramUsers)).toLocaleString()}` : '-' },
      { label: 'TG Members', value: telegramMembers != null ? `${Math.round(Number(telegramMembers)).toLocaleString()}` : '-' },
      { label: 'Prev Price', value: prevRoundPrice != null ? `$${Number(prevRoundPrice).toFixed(4)}` : '—' },
      { label: 'Total Supply', value: totalSupply != null ? `${Math.round(Number(totalSupply)).toLocaleString()} BITS` : '—' },
      { label: 'Start', value: startTime != null ? new Date(startTime * 1000).toLocaleString() : '—' },
      { label: 'End', value: endTime != null ? new Date(endTime * 1000).toLocaleString() : '—' },
      { label: 'Boosted', value: totalBoosted != null ? `$${Math.round(Number(totalBoosted)).toLocaleString()}` : '—' },
    ];

    useEffect(() => {
      setLineIndex(0);
      setCharIndex(0);
      setDone(false);
    }, [priceUSD, round, completion, soldBits, raisedUSD, availableBits, txCount, telegramUsers, telegramMembers, prevRoundPrice, totalSupply, startTime, endTime, totalBoosted]);

    useEffect(() => {
      if (done) return;
      const current = lines[lineIndex]?.value || '';
      const speed = 18; // ms per char
      const afterLinePause = 240; // ms between lines
      const iv = setInterval(() => {
        setCharIndex((c) => {
          if (c + 1 >= current.length) {
            clearInterval(iv);
            // move to next line after pause
            setTimeout(() => {
              setLineIndex((li) => {
                if (li + 1 >= lines.length) {
                  setDone(true);
                  return li;
                }
                return li + 1;
              });
              setCharIndex(0);
            }, afterLinePause);
            return current.length;
          }
          return c + 1;
        });
      }, speed);
      return () => clearInterval(iv);
    }, [lineIndex, done, lines]);

    return (
      <div className="mega-list">
        {lines.map((ln, i) => {
          const isCurrent = i === lineIndex && !done;
          const showFull = i < lineIndex || done;
          const text = showFull ? ln.value : (isCurrent ? ln.value.slice(0, charIndex) : '');
        return (
            <div className="mega-type-row" key={`ln-${i}`}>
              <span className="label">{ln.label}: </span>
              <span className={`mega-type-val`}>
                {text}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  function TypewriterText({ text, speed = 24, delay = 0, className = '' }) {
    const [display, setDisplay] = useState('');
    useEffect(() => {
      let mounted = true;
      setDisplay('');
      const startTimer = setTimeout(() => {
        const s = String(text ?? '');
        let i = 0;
        const interval = setInterval(() => {
          if (!mounted) return;
          i++;
          setDisplay(s.slice(0, i));
          if (i >= s.length) {
            clearInterval(interval);
          }
        }, speed);
      }, delay);
      return () => {
        mounted = false;
        clearTimeout(startTimer);
      };
    }, [text, speed, delay]);
    return (
      <span className={`${className} typewriter-wrap`}>{display}</span>
    );
  }
  const defaultClassicNodes = [
    { icon: '🧠' },
    { icon: '⚙️' },
    { icon: '🔬' },
    { icon: '📡' },
    { icon: '🌐' },
    { icon: '🧪' },
  ];

  const iconCdn = (symbol) => `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${symbol.toLowerCase()}.svg`;
  const iconLocal = (symbol) => `${process.env.PUBLIC_URL || ''}/crypto/${symbol.toLowerCase()}.svg`;
  const getLogoPair = (symbol) => ({ local: iconLocal(symbol), cdn: iconCdn(symbol) });
  const symbolToId = {
    BTC: 'bitcoin', ETH: 'ethereum', USDT: 'tether', USDC: 'usd-coin', BNB: 'binancecoin',
    XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', SOL: 'solana', TRX: 'tron',
    TON: 'the-open-network', DOT: 'polkadot', MATIC: 'matic-network', LTC: 'litecoin',
    BCH: 'bitcoin-cash', LINK: 'chainlink', AVAX: 'avalanche-2', XLM: 'stellar',
    ATOM: 'cosmos', ETC: 'ethereum-classic', BITS: 'bits',
    ARB: 'arbitrum', OP: 'optimism', STRK: 'starknet',
    STK: 'stacks', STX: 'stacks'
  };

  const containerRef = useRef(null);
  const cm = useCellManagerData();
  const presale = usePresaleState();
  const [tooltip, setTooltip] = useState({
    visible: false, x: 0, y: 0, symbol: '', loading: false,
    price: null, volume24h: null, marketCap: null, rank: null,
    fdv: null, circulating: null, symbolName: null,
    round: null, sold: null, raised: null, available: null,
    completion: null, telegramUsers: null, telegramMembers: null,
    txCount: null, prevRoundPrice: null,
    totalSupply: null, startTime: null, endTime: null, totalBoosted: null,
    stacksInfo: null, poxInfo: null, contractFns: null, stacksSource: null,
    dexLiquidity: null, dexVolume24h: null, topDexPools: null,
    // BTC extras
    high24h: null, low24h: null, change24hPct: null, change7dPct: null,
    maxSupply: null, btcStats: null, btcFees: null,
    // MATIC extras
    gasStation: null,
    // SOL extras
    solSlot: null, solTps: null, solAvgBlockTimeSec: null,
    // meta
    refreshedAt: null
  });
  const [mega, setMega] = useState({ active: false, x: 0, y: 0, symbol: '', phase: 'open' });
  const tooltipHideTimerRef = useRef(null);
  const cacheRef = useRef(new Map()); // symbol -> { data, ts }
  const [presaleData, setPresaleData] = useState(null);
  const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://backend-server-f82y.onrender.com';

  // Dynamic hide delay based on orbit speed
  const INNER_REV_SECONDS = 32; // must match CSS --rev-duration for .revolve-layer.inner
  const OUTER_REV_SECONDS = 54; // must match CSS --rev-duration for .revolve-layer.outer
  const computeHideDelayMs = (symbol, orbit) => {
    if (symbol === 'BITS') return 6500; // comet moves variably → longer hold
    if (symbol === 'BTC' && orbit === 'core') return 5000; // center, static → generous hold
    const revSec = orbit === 'inner' ? INNER_REV_SECONDS : orbit === 'outer' ? OUTER_REV_SECONDS : OUTER_REV_SECONDS;
    const degPerSec = 360 / revSec; // angular speed
    const baseMs = 4200;
    const extraMs = Math.round(degPerSec * 200); // stronger boost for faster rings
    const total = baseMs + extraMs; // inner ≈ 6200ms, outer ≈ 5530ms
    return Math.max(3600, Math.min(total, 8000));
  };

  useEffect(() => {
    if (!tooltip.visible || !tooltip.symbol) return;
    const id = symbolToId[tooltip.symbol];
    if (!id && tooltip.symbol !== 'BITS') return;
    let cancelled = false;
    // show cached data immediately if present (persist across hovers)
    const existing = cacheRef.current.get(tooltip.symbol);
    if (existing) {
      setTooltip((t) => ({ ...t, loading: false, ...existing.data }));
    } else {
      setTooltip((t) => ({ ...t, loading: true }));
    }

    if (tooltip.symbol === 'BITS') {
      // Build from presale page state + CellManager (no per-hover fetch)
      const priceFromCM = Number(cm?.currentPrice ?? NaN);
      const price = Number.isFinite(priceFromCM) ? priceFromCM : null;
      const round = presale?.roundNumber ?? null;
      const sold = Number(
        (presaleData?.real_sold_bits ?? presaleData?.sold_bits ?? presaleData?.sold ?? presale?.sold ?? 0)
      );
      const available = Number(presale?.supply ?? (presaleData?.supply ?? presaleData?.available_bits ?? 0));
      const raised = (
        presaleData?.real_raised_usd ?? presaleData?.raised_usd ?? (Number.isFinite(price) ? sold * price : null)
      );
      const completion = Number(presale?.progress ?? (presaleData?.progress ?? NaN));
      const totalSupply = Number(presale?.totalSupply ?? (presaleData?.totalSupply ?? 0));
      const telegramUsers = Number(
        presaleData?.telegramWalletUsers ?? presaleData?.telegram_wallet_users ?? presaleData?.tg_wallet_users ?? presaleData?.telegram_users ?? 0
      ) || null;
      const telegramMembers = Number(
        presaleData?.telegramMembers ?? presaleData?.telegram_members ?? presaleData?.tg_members ?? presaleData?.telegram_members_count ?? 0
      ) || null;
      const txCount = Number(
        presaleData?.transactions ?? presaleData?.txCount ?? presaleData?.registered_transactions ?? cm?.totalTransactions ?? 0
      ) || null;
      const prevRoundPrice = Number(presaleData?.previousRoundPrice ?? presaleData?.prev_price ?? NaN);
      const startTime = presale?.startTime ? Math.floor((presale?.startTime)/1000) : (presaleData?.startTime ?? null);
      const endTime = presale?.endTime ? Math.floor((presale?.endTime)/1000) : (presaleData?.endTime ?? null);
      const totalBoosted = Number(presale?.totalBoosted ?? presaleData?.totalBoosted ?? 0) || null;

      const bitsData = { price, volume24h: null, marketCap: null, rank: null, round, sold, raised, available, completion, telegramUsers, telegramMembers, txCount, prevRoundPrice: Number.isFinite(prevRoundPrice) ? prevRoundPrice : null, totalSupply, startTime, endTime, totalBoosted, symbol: 'BITS', visible: true, x: tooltip.x, y: tooltip.y, loading: false, refreshedAt: Date.now() };
      // cache and set
      cacheRef.current.set('BITS', { data: bitsData, ts: Date.now() });
      if (!cancelled) setTooltip((t) => ({ ...t, ...bitsData }));
    } else {
      // For other coins: serve cached if fresh, revalidate in background
      const TTL = 60 * 1000;
      const fresh = existing && (Date.now() - existing.ts < TTL);
      const fetchNow = !fresh;
      if (fetchNow) {
        const cg = fetch(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`)
          .then(r=> r.ok ? r.json() : null)
          .then(async (d)=>{
            if (d && d.market_data) return d;
            if (id === 'stacks') {
              try {
                const alt = await fetch(`https://api.coingecko.com/api/v3/coins/blockstack?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`);
                return alt.ok ? alt.json() : d;
              } catch { return d; }
            }
            return d;
          })
          .catch(()=>null);
        const isStacks = tooltip.symbol === 'STK' || tooltip.symbol === 'STX';
        const isMatic = tooltip.symbol === 'MATIC';
        const isSol = tooltip.symbol === 'SOL';
        const isArb = tooltip.symbol === 'ARB';
        const isOp = tooltip.symbol === 'OP';
        const isStrk = tooltip.symbol === 'STRK';
        const llamaChain = isStacks ? 'Stacks' : (isMatic ? 'Polygon' : (isSol ? 'Solana' : (isArb ? 'Arbitrum' : (isOp ? 'Optimism' : (isStrk ? 'Starknet' : null)))));
        const hiroBase = 'https://api.hiro.so';
        const stacksInfoReq = isStacks ? fetch(`${hiroBase}/v2/info`).then(r=>r.json()).catch(()=>null) : Promise.resolve(null);
        const poxReq = isStacks ? fetch(`${hiroBase}/v2/pox`).then(r=>r.json()).catch(()=>null) : Promise.resolve(null);
        const contractIfaceReq = isStacks ? fetch(`${hiroBase}/v2/contracts/interface/SP000000000000000000002Q6VF78/pox-4`).then(r=>r.json()).catch(()=>null) : Promise.resolve(null);
        const sourceLink = isStacks ? `${hiroBase}/v2/contracts/source/SP000000000000000000002Q6VF78/pox-4` : null;
        const contractSourceReq = isStacks ? fetch(sourceLink).then(r=> r.ok ? r.text() : null).catch(()=>null) : Promise.resolve(null);
        const llamaPoolsReq = llamaChain ? fetch('https://yields.llama.fi/pools').then(r=>r.json()).catch(()=>null) : Promise.resolve(null);
        const llamaDexReq = llamaChain ? fetch(`https://api.llama.fi/overview/dexs?chain=${encodeURIComponent(llamaChain)}&excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`).then(r=>r.json()).catch(()=>null) : Promise.resolve(null);
        const isBTC = tooltip.symbol === 'BTC';
        const btcStatsReq = isBTC ? fetch('https://api.blockchain.info/stats?format=json').then(r=>r.json()).catch(()=>null) : Promise.resolve(null);
        const btcFeesReq = isBTC ? fetch('https://mempool.space/api/v1/fees/recommended').then(r=>r.json()).catch(()=>null) : Promise.resolve(null);
        const gasStationReq = isMatic ? fetch('https://gasstation.polygon.technology/v2').then(r=>r.json()).catch(()=>null) : Promise.resolve(null);
        const solSlotReq = isSol ? fetch('https://api.mainnet-beta.solana.com', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'getSlot', params:[] })}).then(r=>r.json()).then(j=>j?.result).catch(()=>null) : Promise.resolve(null);
        const solPerfReq = isSol ? fetch('https://api.mainnet-beta.solana.com', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'getRecentPerformanceSamples', params:[5] })}).then(r=>r.json()).then(j=>j?.result).catch(()=>null) : Promise.resolve(null);
        Promise.all([cg, stacksInfoReq, poxReq, contractIfaceReq, contractSourceReq, llamaPoolsReq, llamaDexReq, btcStatsReq, btcFeesReq, gasStationReq, solSlotReq, solPerfReq]).then(([data, stacksInfo, poxInfo, contractIface, contractSource, llamaPools, llamaDex, btcStats, btcFees, gasStation, solSlot, solPerf])=>{
          if (cancelled) return;
          const price = data?.market_data?.current_price?.usd ?? null;
          const volume24h = data?.market_data?.total_volume?.usd ?? null;
          const marketCap = data?.market_data?.market_cap?.usd ?? null;
          const rank = data?.market_cap_rank ?? null;
          const fdv = data?.market_data?.fully_diluted_valuation?.usd ?? null;
          const circulating = data?.market_data?.circulating_supply ?? null;
          const symbolName = (data?.symbol || '').toUpperCase() || null;
          const contractFns = Array.isArray(contractIface?.functions) ? contractIface.functions.slice(0,6).map(f=>f?.name||'') : null;
          // DefiLlama derived metrics
          let dexLiquidity = null; let dexVolume24h = null;
          let topDexPools = null;
          try {
            const pools = Array.isArray(llamaPools?.data) ? llamaPools.data : [];
            const chainPools = pools.filter(p => ((p?.chain || '').toLowerCase() === (llamaChain||'').toLowerCase()));
            if (chainPools.length) {
              dexLiquidity = chainPools.reduce((sum, p) => sum + (Number(p?.tvlUsd) || 0), 0);
              topDexPools = chainPools
                .sort((a,b) => (Number(b?.tvlUsd||0) - Number(a?.tvlUsd||0)))
                .slice(0, 3)
                .map(p => ({
                  symbol: p?.symbol || (Array.isArray(p?.underlyingTokens) ? p.underlyingTokens.join('-') : 'Pool'),
                  tvlUsd: Number(p?.tvlUsd || 0),
                  apy: p?.apy != null ? Number(p.apy) : null,
                  volumeUsd1d: p?.volumeUsd1d != null ? Number(p.volumeUsd1d) : null,
                  project: p?.project || ''
                }));
            }
          } catch (_) {}
          try {
            const dexs = Array.isArray(llamaDex?.dexs) ? llamaDex.dexs : (Array.isArray(llamaDex?.protocols) ? llamaDex.protocols : []);
            if (dexs.length) dexVolume24h = dexs.reduce((sum, d) => sum + (Number(d?.volume24h || d?.total24h || 0)), 0);
          } catch (_) {}

          const alexUrl = 'https://app.alexlab.co/pool';
          // BTC extras
          const high24h = data?.market_data?.high_24h?.usd ?? null;
          const low24h = data?.market_data?.low_24h?.usd ?? null;
          const change24hPct = data?.market_data?.price_change_percentage_24h ?? null;
          const change7dPct = data?.market_data?.price_change_percentage_7d ?? null;
          const maxSupply = data?.market_data?.max_supply ?? null;
          let solTps = null, solAvgBlockTimeSec = null;
          try {
            if (Array.isArray(solPerf) && solPerf.length) {
              const totalTx = solPerf.reduce((s, x) => s + (Number(x?.numTransactions)||0), 0);
              const totalSecs = solPerf.reduce((s, x) => s + (Number(x?.samplePeriodSecs)||0), 0);
              const totalSlots = solPerf.reduce((s, x) => s + (Number(x?.numSlots)||0), 0);
              solTps = totalSecs ? (totalTx / totalSecs) : null;
              solAvgBlockTimeSec = totalSlots ? (totalSecs / totalSlots) : null;
            }
          } catch(_) {}
          const payload = { price, volume24h, marketCap, rank, fdv, circulating, symbolName, stacksInfo, poxInfo, contractFns, stacksSource: contractSource, sourceLink, dexLiquidity, dexVolume24h, topDexPools, alexUrl, high24h, low24h, change24hPct, change7dPct, maxSupply, btcStats, btcFees, gasStation, solSlot, solTps, solAvgBlockTimeSec, refreshedAt: Date.now() };
          cacheRef.current.set(tooltip.symbol, { data: { ...payload, symbol: tooltip.symbol }, ts: Date.now() });
          setTooltip((t) => ({ ...t, loading: false, ...payload }));
        }).catch(()=>{ if (!cancelled) setTooltip((t)=>({ ...t, loading:false })); });
      }
    }
    return () => { cancelled = true; };
  }, [tooltip.visible, tooltip.symbol]);

  // Fetch BITS presale data once
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [presaleResp, liveResp, membersResp, txResp] = await Promise.all([
          fetch(`${API_URL}/api/presale/current`).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`${API_URL}/api/telegram-rewards/group-live`).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`${API_URL}/api/telegram-rewards/group-members`).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`${API_URL}/api/transactions`).then(r => r.ok ? r.json() : null).catch(() => null)
        ]);
        if (cancelled) return;
        const merged = { ...(presaleResp || {}) };
        const liveCount = Number(liveResp?.member_count || 0);
        const membersTotal = Number(membersResp?.total || 0);
        const linked = Number(membersResp?.linked || 0);
        if (!Number.isNaN(liveCount) && liveCount > 0) merged.telegramMembers = liveCount;
        else if (!Number.isNaN(membersTotal) && membersTotal > 0) merged.telegramMembers = membersTotal;
        // Use linked wallets if available, fallback to total members
        if (!Number.isNaN(linked) && linked > 0) merged.telegramWalletUsers = linked;
        else if (!Number.isNaN(membersTotal) && membersTotal > 0) merged.telegramWalletUsers = membersTotal;
        // Transactions (DB, includes simulations if backend does): prefer type buy_bits if present
        try {
          const txs = Array.isArray(txResp) ? txResp : [];
          const buyCount = txs.filter(t => ((t?.type || '').toLowerCase() === 'buy_bits') || ((t?.category || '').toLowerCase() === 'buy')).length;
          const count = buyCount > 0 ? buyCount : txs.length;
          merged.registered_transactions = count;
          merged.transactions = count;
          merged.txCount = count;
        } catch (_) {}
        setPresaleData(merged);
      } catch (_) {
        // ignore
      }
    };
    load();
    return () => { cancelled = true; };
  }, [API_URL]);

  const handleHover = (e, symbol) => {
    if (mega.active) return; // lock view when mega tooltip is open
    const container = containerRef.current;
    if (!container) return;
    const nodeRect = e.currentTarget.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const x = nodeRect.left - containerRect.left + nodeRect.width / 2;
    const y = nodeRect.top - containerRect.top - 6; // above node
    if (symbol === 'BITS') {
      const priceUSD = Number(cm?.currentPrice ?? NaN); // CellManager price only
      const round = presale?.roundNumber ?? null;
      const sold = Number(presale?.sold ?? 0);
      const available = Number(presale?.supply ?? 0);
      const raised = Number(
        presaleData?.real_raised_usd ?? presaleData?.raised_usd ?? (Number.isFinite(priceUSD) ? sold * priceUSD : 0)
      );
      const completion = Number(presale?.progress ?? NaN);
      setTooltip({
        visible: true, x, y, symbol, loading: false,
        price: Number.isFinite(priceUSD) ? priceUSD : null,
        volume24h: null, marketCap: null, rank: null,
        round, sold, raised, available, completion
      });
    } else {
      setTooltip({ visible: true, x, y, symbol, loading: true, price: null, volume24h: null, marketCap: null, rank: null });
    }
  };

  const handleLeave = (symbol, orbit) => {
    if (tooltipHideTimerRef.current) clearTimeout(tooltipHideTimerRef.current);
    const leavingSymbol = symbol || tooltip.symbol;
    const delay = computeHideDelayMs(leavingSymbol, orbit);
    tooltipHideTimerRef.current = setTimeout(() => {
      setTooltip((t) => {
        // Hide only if we're still on the same symbol when the timer fires
        if (!t.visible) return t;
        if (t.symbol !== leavingSymbol) return t;
        return { ...t, visible: false };
      });
    }, delay);
  };

  const handleClick = (e, symbol) => {
    const container = containerRef.current;
    if (!container) return;
    const nodeRect = e.currentTarget.getBoundingClientRect();
    const originX = nodeRect.left + nodeRect.width / 2;
    const originY = nodeRect.top + nodeRect.height / 2;
    // ensure data fetch kicked off
    const containerRect = container.getBoundingClientRect();
    const x = nodeRect.left - containerRect.left + nodeRect.width / 2;
    const y = nodeRect.top - containerRect.top - 6;
    if (symbol === 'BITS') {
      const priceUSD = Number(cm?.currentPrice ?? NaN); // CellManager price only
      const round = presale?.roundNumber ?? null;
      const sold = Number(presale?.sold ?? 0);
      const available = Number(presale?.supply ?? 0);
      const raised = Number(
        presaleData?.real_raised_usd ?? presaleData?.raised_usd ?? (Number.isFinite(priceUSD) ? sold * priceUSD : 0)
      );
      const completion = Number(presale?.progress ?? NaN);
      setTooltip({
        visible: true, x, y, symbol, loading: false,
        price: Number.isFinite(priceUSD) ? priceUSD : null,
        volume24h: null, marketCap: null, rank: null,
        round, sold, raised, available, completion
      });
    } else {
      setTooltip({ visible: true, x, y, symbol, loading: true, price: null, volume24h: null, marketCap: null, rank: null });
    }
    setMega({ active: true, x: originX, y: originY, symbol, phase: 'open' });
    // On mobile, scroll panel into view below the orbit
    try {
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        setTimeout(() => {
          const root = containerRef.current?.closest('.orbit-wrapper');
          const panel = root?.querySelector('.orbit-mega-panel');
          if (panel && typeof panel.scrollIntoView === 'function') {
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);
      }
    } catch(_) {}
    // No auto-close on outside click; use explicit close button only
  };
  const defaultEcosystemCoins = [
    { symbol: 'BTC', logo: iconCdn('btc') },
    { symbol: 'ETH', logo: iconCdn('eth') },
    { symbol: 'USDT', logo: iconCdn('usdt') },
    { symbol: 'USDC', logo: iconCdn('usdc') },
    { symbol: 'BNB', logo: iconCdn('bnb') },
    { symbol: 'XRP', logo: iconCdn('xrp') },
    { symbol: 'ADA', logo: iconCdn('ada') },
    { symbol: 'DOGE', logo: iconCdn('doge') },
    { symbol: 'SOL', logo: iconCdn('sol') },
    { symbol: 'TRX', logo: iconCdn('trx') },
    { symbol: 'TON', logo: iconCdn('ton') },
    { symbol: 'DOT', logo: iconCdn('dot') },
    { symbol: 'MATIC', logo: iconCdn('matic') },
    { symbol: 'LTC', logo: iconCdn('ltc') },
    { symbol: 'BCH', logo: iconCdn('bch') },
    { symbol: 'LINK', logo: iconCdn('link') },
    { symbol: 'AVAX', logo: iconCdn('avax') },
    { symbol: 'XLM', logo: iconCdn('xlm') },
    { symbol: 'ATOM', logo: iconCdn('atom') },
    { symbol: 'ETC', logo: iconCdn('etc') },
  ];

  if (variant === 'ecosystem') {
    const coinItemsRaw = nodes.length ? nodes : defaultEcosystemCoins;
    const coinItems = coinItemsRaw.filter((c) => c.symbol !== 'BTC');
    const count = Math.min(coinItems.length, 20);
    const innerCount = Math.floor(count / 2);
    const outerCount = count - innerCount;
    const innerRadius = 90; // px
    const outerRadius = 135; // px

    return (
      <div className={`orbit-wrapper ${variant}`}>
        <div className="orbit-header">
          <div className="orbit-title" aria-label="BitPulse Orbit Dashboard">BitPulse Orbit Dashboard</div>
          <div className="orbit-brand top">
            <span className="brand-line" title="AI data pipeline">
              <img src={BITS_LOGO} alt="BITS" className="bits-logo-mini" />
              <span className="bitsPulseLabel">BitPulse®</span>
            </span>
          </div>
        </div>
        <div className={`laser-orbit ${variant} ${mega.active ? 'is-mega-open' : ''}`} ref={containerRef} style={{ position: 'relative' }}>
        <div className="orbit-core" title="BTC">
          <div className="orbit-ring ring-1" />
          <div className="orbit-ring ring-2" />
          {/* Official BTC inline SVG */}
          <div className="core-icon" aria-label="Bitcoin">
            <svg width="58" height="58" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" role="img">
              <circle cx="16" cy="16" r="16" fill="#f7931a"/>
              <path fill="#fff" d="M22.19 14.62c.31-2.08-1.27-3.2-3.43-3.94l.7-2.8-1.71-.43-.68 2.72c-.45-.11-.91-.22-1.37-.33l.69-2.76-1.71-.43-.7 2.8c-.37-.09-.74-.17-1.1-.26l.01-.06-2.36-.6-.45 1.82s1.27.29 1.24.31c.69.17.81.62.79.98l-.79 3.17c.05.01.12.03.19.05l-.19-.05-1.11 4.45c-.09.22-.3.54-.78.41.02.03-1.24-.31-1.24-.31l-.84 1.94 2.23.56c.41.1.81.21 1.21.31l-.71 2.85 1.71.43.7-2.8c.47.13.92.24 1.36.35l-.69 2.77 1.71.43.71-2.84c2.92.55 5.11.33 6.04-2.31.74-2.1-.04-3.31-1.56-4.11 1.11-.26 1.94-1.02 2.16-2.58h-.01Zm-3.87 5.63c-.53 2.1-4.13.96-5.3.68l.94-3.78c1.17.29 4.92.87 4.36 3.1h0Zm.53-5.67c-.49 1.95-3.5.96-4.48.72l.86-3.44c.98.24 4.14.69 3.62 2.72Z"/>
            </svg>
          </div>
          {/* Subtle radial rays behind icons */}
          <div className="core-rays" aria-hidden>
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={`ray-${i}`} className={`ray r-${i + 1}`} />
            ))}
          </div>
          {/* Hitbox for reliable events */}
          <div
            className="core-hitbox"
            onMouseEnter={(e) => {
              if (tooltipHideTimerRef.current) clearTimeout(tooltipHideTimerRef.current);
              const container = containerRef.current;
              if (!container) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              const x = rect.left - containerRect.left + rect.width / 2;
              const y = rect.top - containerRect.top - 6;
              setTooltip({ visible: true, x, y, symbol: 'BTC', loading: true, price: null, volume24h: null, marketCap: null, rank: null });
            }}
            onMouseLeave={() => handleLeave('BTC', 'core')}
            onClick={(e) => handleClick(e, 'BTC')}
          />
        </div>

        {/* Revolving layers (inner + outer) for orbiting effect */}
        <div className="revolve-layer inner">
          {coinItems.slice(0, innerCount).map((c, idx) => {
            const angleDeg = (idx / innerCount) * 360;
            return (
              <div
                key={`inner-${idx}`}
                className="revolve-node"
                style={{ '--angle': `${angleDeg}deg`, '--radius': `${innerRadius}px` }}
                title={c.symbol}
              >
                <div
                  className="orbit-node no-spin upright"
                  onMouseEnter={(e) => handleHover(e, c.symbol)}
                  onMouseLeave={() => handleLeave(c.symbol, 'inner')}
                onClick={(e) => handleClick(e, c.symbol)}
                >
                  {c.logo ? (
                    <img
                      src={getLogoPair(c.symbol).local}
                      alt={c.symbol}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (!e.currentTarget.dataset.fallback) {
                          e.currentTarget.dataset.fallback = 'cdn';
                          e.currentTarget.src = getLogoPair(c.symbol).cdn;
                        } else {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('fallback');
                        }
                      }}
                    />
                  ) : null}
                  <span className="symbol-fallback">{c.symbol}</span>
                </div>
              </div>
            );
          })}
          {/* removed inner BITS node to avoid duplication */}
        </div>

        <div className="revolve-layer outer">
          {coinItems.slice(innerCount, count).map((c, jdx) => {
            const angleDeg = (jdx / outerCount) * 360;
            return (
              <div
                key={`outer-${jdx}`}
                className="revolve-node"
                style={{ '--angle': `${angleDeg}deg`, '--radius': `${outerRadius}px` }}
                title={c.symbol}
              >
                <div
                  className="orbit-node no-spin upright"
                  onMouseEnter={(e) => handleHover(e, c.symbol)}
                  onMouseLeave={() => handleLeave(c.symbol, 'outer')}
                onClick={(e) => handleClick(e, c.symbol)}
                >
                  {c.logo ? (
                    <img
                      src={getLogoPair(c.symbol).local}
                      alt={c.symbol}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (!e.currentTarget.dataset.fallback) {
                          e.currentTarget.dataset.fallback = 'cdn';
                          e.currentTarget.src = getLogoPair(c.symbol).cdn;
                        } else {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('fallback');
                        }
                      }}
                    />
                  ) : null}
                  <span className="symbol-fallback">{c.symbol}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="orbit-connections" />

        {/* BITS floating comet with local logo and price */}
        <div
          className="bits-comet"
          aria-label="BITS"
          onMouseEnter={(e) => handleHover(e, 'BITS')}
          onMouseLeave={() => handleLeave('BITS', 'bits')}
          onClick={(e) => handleClick(e, 'BITS')}
        >
          <div className="bits-core">
            <img src={BITS_LOGO} alt="BITS" />
          </div>
          <div className="bits-trail"></div>
        </div>

        {/* STK (Stacks) partner comet - orbits near BITS */}
        <div
          className="partner-comet"
          aria-label="STK"
          onMouseEnter={(e) => handleHover(e, 'STK')}
          onMouseLeave={() => handleLeave('STK', 'partner')}
          onClick={(e) => handleClick(e, 'STK')}
        >
          <div className="partner-core">
            <img
              src={getLogoPair('stx').local}
              alt="STK"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (!e.currentTarget.dataset.fallback) {
                  e.currentTarget.dataset.fallback = 'cdn';
                  e.currentTarget.src = getLogoPair('stx').cdn;
                } else {
                  e.currentTarget.style.display = 'none';
                }
              }}
            />
          </div>
        </div>

        {/* ARB (Arbitrum) L2 comet - different orbit path */}
        <div
          className="l2-comet"
          aria-label="ARB"
          onMouseEnter={(e) => handleHover(e, 'ARB')}
          onMouseLeave={() => handleLeave('ARB', 'l2')}
          onClick={(e) => handleClick(e, 'ARB')}
        >
          <div className="l2-core">
            <img
              src={`${process.env.PUBLIC_URL || ''}/l2/arb.svg`}
              alt="ARB"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (!e.currentTarget.dataset.fallback) {
                  e.currentTarget.dataset.fallback = 'cdn';
                  e.currentTarget.src = getLogoPair('arb').cdn;
                } else {
                  e.currentTarget.style.display = 'none';
                }
              }}
            />
          </div>
        </div>

        {/* OP (Optimism) L2 comet - distinct orbit */}
        <div
          className="op-comet"
          aria-label="OP"
          onMouseEnter={(e) => handleHover(e, 'OP')}
          onMouseLeave={() => handleLeave('OP', 'l2')}
          onClick={(e) => handleClick(e, 'OP')}
        >
          <div className="op-core">
            <img
              src={`${process.env.PUBLIC_URL || ''}/l2/op.svg`}
              alt="OP"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (!e.currentTarget.dataset.fallback) {
                  e.currentTarget.dataset.fallback = 'cdn';
                  e.currentTarget.src = getLogoPair('op').cdn;
                } else {
                  e.currentTarget.style.display = 'none';
                }
              }}
            />
          </div>
        </div>

        {/* STRK (Starknet) ZK comet - distinct orbit */}
        <div
          className="zkp-comet"
          aria-label="STRK"
          onMouseEnter={(e) => handleHover(e, 'STRK')}
          onMouseLeave={() => handleLeave('STRK', 'l2')}
          onClick={(e) => handleClick(e, 'STRK')}
        >
          <div className="zkp-core">
            <img
              src={`${process.env.PUBLIC_URL || ''}/l2/strk.svg`}
              alt="STRK"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (!e.currentTarget.dataset.fallback) {
                  e.currentTarget.dataset.fallback = 'cdn';
                  e.currentTarget.src = getLogoPair('strk').cdn;
                } else {
                  e.currentTarget.style.display = 'none';
                }
              }}
            />
          </div>
        </div>

        {tooltip.visible && !mega.active && (
          <div
            className="orbit-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="tooltip-row"><span>{tooltip.symbol}</span></div>
            {tooltip.symbol === 'BITS' ? (
              <>
                <div className="tooltip-row small">{tooltip.loading ? 'Loading...' : (tooltip.price != null ? `Presale: ${formatPrice(tooltip.price)}` : 'n/a')}</div>
                <div className="tooltip-row tiny"><span>Round: </span><span className="value">{tooltip.round ?? ''}</span></div>
                <div className="tooltip-row tiny"><span>Completion: </span><span className="value">{tooltip.completion != null ? `${(Number(tooltip.completion) || 0).toFixed(2)}%` : ''}</span></div>
                <div className="tooltip-row tiny"><span>Sold Round <span className="round-dynamic">{tooltip.round ?? '-'}</span></span><span className="value">{tooltip.sold != null ? `${formatIntRO(tooltip.sold)}` : ''}</span></div>
                <div className="tooltip-row tiny"><span>Raised Round <span className="round-dynamic">{tooltip.round ?? '-'}</span></span><span className="value">{tooltip.raised != null ? `${formatUSDCompact(adjustRaisedForDisplay(tooltip.raised, tooltip.sold))}` : ''}</span></div>
                <div className="tooltip-row tiny"><span>Available: </span><span className="value">{tooltip.available != null ? `${formatIntRO(tooltip.available)}` : ''}</span></div>
                <div className="tooltip-row tiny"><span>Total Transactions: </span><span className="value">{tooltip.txCount != null ? `${formatIntRO(tooltip.txCount)}` : ''}</span></div>
                <div className="tooltip-row tiny"><span>TG Wallet Users: </span><span className="value">{(() => {
                  const disp = applyWalletBaseline(tooltip.telegramUsers, tooltip.txCount);
                  return formatIntRO(disp);
                })()}</span></div>
                <div className="tooltip-row tiny"><span>TG Members: </span><span className="value">{tooltip.telegramMembers != null ? `${formatIntRO(tooltip.telegramMembers)}` : ''}</span></div>
                <div className="tooltip-row tiny"><span>Prev. Round Price: </span><span className="value">{tooltip.prevRoundPrice != null ? `${formatPrice(tooltip.prevRoundPrice)}` : ''}</span></div>
              </>
            ) : (
              <>
                <div className="tooltip-row small">{tooltip.loading ? 'Loading...' : (tooltip.price != null ? `$${tooltip.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'n/a')}</div>
                <div className="tooltip-row tiny"><span>24h Vol: </span><span className="value">{tooltip.loading ? '' : (tooltip.volume24h != null ? `$${Math.round(tooltip.volume24h).toLocaleString('en-US')}` : '')}</span></div>
                <div className="tooltip-row tiny"><span>Mkt Cap: </span><span className="value">{tooltip.loading ? '' : (tooltip.marketCap != null ? `$${Math.round(tooltip.marketCap).toLocaleString('en-US')}` : '')}</span></div>
                <div className="tooltip-row tiny"><span>Rank: </span><span className="value">{tooltip.loading ? '' : (tooltip.rank != null ? `#${tooltip.rank}` : '')}</span></div>
              </>
            )}
          </div>
        )}

        {mega.active && (
          <div className={`orbit-mega ${mega.phase === 'closing' ? 'closing' : 'open'}`}>
            <div className="mega-card" style={{ animationName: 'mega-card-grow', animationDirection: mega.phase === 'closing' ? 'reverse' : 'normal' }}>
              <div className="mega-close" onClick={(e) => { e.stopPropagation?.(); setMega((m) => ({ ...m, phase: 'closing' })); setTimeout(() => setMega((m) => ({ ...m, active: false })), 300); }} aria-label="Close">×</div>
              {tooltip.loading && (
                <div className="mega-search" aria-hidden>
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    <defs>
                      <clipPath id="lensClip">
                        <circle cx="60" cy="60" r="34"/>
                      </clipPath>
                      <radialGradient id="lensGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#9EDFFF" stopOpacity="0.65"/>
                        <stop offset="100%" stopColor="#9EDFFF" stopOpacity="0"/>
                      </radialGradient>
                    </defs>
                    <g id="magnifier">
                      <circle cx="60" cy="60" r="34" fill="rgba(0,0,0,0.18)" stroke="#8C7BFF" strokeWidth="2"/>
                      <g clipPath="url(#lensClip)">
                        <rect x="26" y="26" width="68" height="68" fill="url(#lensGlow)"/>
                        <g id="scroll" transform="translate(0,28)">
                          <text x="30" y="40" fill="#CFEFFF" opacity="0.9" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="10" letterSpacing="1">
                            0xA9 1F 7C 2B 4D 9E 5A 0C 6F 11
                            <tspan x="30" dy="12">B3 7D F2 9A 6C 0E 2A 5B 1C 8E</tspan>
                            <tspan x="30" dy="12">01 10 11 00 10 01 11 00 10 01</tspan>
                            <tspan x="30" dy="12">Σ ∑ λ ψ Ω ⊕ ⊗ ß π μ ξ φ</tspan>
                            <tspan x="30" dy="12">{ } [ ] ( ) &lt; &gt; # @ % &amp; *</tspan>
                          </text>
                          <animateTransform attributeName="transform" type="translate" values="0,28; 0,-28; 0,28" dur="3.2s" repeatCount="indefinite"/>
                        </g>
                      </g>
                      <line x1="82" y1="82" x2="118" y2="118" stroke="#8C7BFF" strokeWidth="6" strokeLinecap="round"/>
                    </g>
                    <animateTransform xlinkHref="#magnifier" attributeName="transform" type="translate" values="0,0; 6,-4; -6,3; 0,0" dur="3.4s" repeatCount="indefinite"/>
                  </svg>
                </div>
              )}
              <div className="mega-symbol">{mega.symbol}</div>
              {mega.symbol === 'BITS' ? (
                (() => {
                  const priceUSD = tooltip.price != null ? Number(tooltip.price) : Number(cm?.currentPrice ?? NaN);
                  const soldBits = tooltip.sold != null ? Number(tooltip.sold) : Number(cm?.soldBits ?? 0);
                  const availableBits = tooltip.available != null ? Number(tooltip.available) : Number(cm?.availableBits ?? 0);
                  const raisedUSDRaw = tooltip.raised != null ? Number(tooltip.raised) : (Number.isFinite(priceUSD) ? soldBits * priceUSD : null);
                  const raisedUSD = adjustRaisedForDisplay(raisedUSDRaw, soldBits);
                  const round = tooltip.round ?? cm?.roundNumber ?? presale?.roundNumber;
                  const completion = tooltip.completion;
                  return (
                    <>
                      <div className="mega-price">{Number.isFinite(priceUSD) ? `Presale: ${formatPrice(priceUSD)}` : '—'}</div>
                      <div className="mega-list plain">
                        <div className="mega-row"><span className="label">Round</span><span className="value">{round ?? '-'}</span></div>
                        <div className="mega-row"><span className="label">Price</span><span className="value">{Number.isFinite(priceUSD) ? `${formatPrice(priceUSD)}` : '-'}</span></div>
                        <div className="mega-row"><span className="label">Completion</span><span className="value">{completion != null ? `${(Number(completion) || 0).toFixed(2)}%` : '-'}</span></div>
                        <div className="mega-row"><span className="label">Sold Round <span className="round-dynamic">{round ?? '-'}</span></span><span className="value">{Number.isFinite(soldBits) ? `${formatIntRO(soldBits)}` : '-'}</span></div>
                        <div className="mega-row"><span className="label">Raised Round <span className="round-dynamic">{round ?? '-'}</span></span><span className="value">{Number.isFinite(raisedUSD) ? `${formatUSDCompact(raisedUSD)}` : '-'}</span></div>
                        <div className="mega-row"><span className="label">Available</span><span className="value">{Number.isFinite(availableBits) ? `${formatIntRO(availableBits)}` : '-'}</span></div>
                        <div className="mega-row"><span className="label">Total Transactions</span><span className="value">{tooltip.txCount != null ? `${formatIntRO(tooltip.txCount)}` : '-'}</span></div>
                        <div className="mega-row"><span className="label">TG Wallet Users</span><span className="value">{(() => {
                          const disp = applyWalletBaseline(tooltip.telegramUsers, tooltip.txCount);
                          return formatIntRO(disp);
                        })()}</span></div>
                        <div className="mega-row"><span className="label">TG Members</span><span className="value">{tooltip.telegramMembers != null ? `${formatIntRO(tooltip.telegramMembers)}` : '-'}</span></div>
                        <div className="mega-row"><span className="label">Prev Price</span><span className="value">{tooltip.prevRoundPrice != null ? `${formatPrice(tooltip.prevRoundPrice)}` : '—'}</span></div>
                        <div className="mega-row"><span className="label">Total Supply</span><span className="value">{tooltip.totalSupply != null ? `${formatIntRO(tooltip.totalSupply)}` : '—'}</span></div>
                        <div className="mega-row"><span className="label">Start</span><span className="value">{tooltip.startTime != null ? new Date(tooltip.startTime * 1000).toLocaleString() : '—'}</span></div>
                        <div className="mega-row"><span className="label">End</span><span className="value">{tooltip.endTime != null ? new Date(tooltip.endTime * 1000).toLocaleString() : '—'}</span></div>
                        <div className="mega-row"><span className="label">Total Boosted</span><span className="value">{tooltip.totalBoosted != null ? `${formatUSDCompact(Number(tooltip.totalBoosted))}` : '—'}</span></div>
                      </div>
                    </>
                  );
                })()
              ) : (
                <>
                  <div className="mega-price">{tooltip.loading ? 'Loading…' : (tooltip.price != null ? `${tooltip.symbolName || ''} $${tooltip.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'n/a')}{tooltip.refreshedAt ? <span className="live-badge" title={`updated ${new Date(tooltip.refreshedAt).toLocaleTimeString()}`}>LIVE</span> : null}</div>
                  <div className="mega-volume">{tooltip.loading ? '' : (tooltip.volume24h != null ? `24h Volume: $${Math.round(tooltip.volume24h).toLocaleString('en-US')}` : '')}</div>
                  <div className="mega-cap">{tooltip.loading ? '' : (tooltip.marketCap != null ? `Market Cap: $${Math.round(tooltip.marketCap).toLocaleString('en-US')}` : '')}</div>
                  <div className="mega-rank">{tooltip.loading ? '' : (tooltip.rank != null ? `Rank: #${tooltip.rank}` : '')}</div>
                  {tooltip.high24h != null && tooltip.low24h != null && (
                    <div className="mega-cap">Day Range: ${Number(tooltip.low24h).toLocaleString('en-US')} — ${Number(tooltip.high24h).toLocaleString('en-US')}</div>
                  )}
                  {tooltip.change24hPct != null && (
                    <div className="mega-cap">Change 24h: {(Number(tooltip.change24hPct)).toFixed(2)}%</div>
                  )}
                  {tooltip.change7dPct != null && (
                    <div className="mega-cap">Change 7d: {(Number(tooltip.change7dPct)).toFixed(2)}%</div>
                  )}
                  {tooltip.maxSupply != null && (
                    <div className="mega-cap">Max Supply: {Math.round(Number(tooltip.maxSupply)).toLocaleString('en-US')}</div>
                  )}
                  {tooltip.btcFees && (
                    <div className="mega-cap">Fees (sat/vB): {tooltip.btcFees.fastestFee}/{tooltip.btcFees.halfHourFee}/{tooltip.btcFees.hourFee}</div>
                  )}
                  {tooltip.btcStats && (
                    <div className="mega-cap">Hashrate: {Math.round((tooltip.btcStats.hash_rate||0)).toLocaleString('en-US')} EH/s • Blocks/day: {tooltip.btcStats.n_btc_mined || ''}</div>
                  )}
                  {mega.symbol === 'SOL' && (tooltip.solSlot != null || tooltip.solTps != null) && (
                    <div className="mega-list plain" style={{marginTop:8}}>
                      {tooltip.solSlot != null && (
                        <div className="mega-row"><span className="label">Slot</span><span className="value">{Number(tooltip.solSlot).toLocaleString('en-US')}</span></div>
                      )}
                      {tooltip.solTps != null && (
                        <div className="mega-row"><span className="label">TPS</span><span className="value">{Number(tooltip.solTps).toFixed(1)}</span></div>
                      )}
                      {tooltip.solAvgBlockTimeSec != null && (
                        <div className="mega-row"><span className="label">Avg Block Time</span><span className="value">{Number(tooltip.solAvgBlockTimeSec).toFixed(2)}s</span></div>
                      )}
                    </div>
                  )}
                  {/* Explorer buttons */}
                  <div style={{ marginTop: 10, display:'flex', gap:8, flexWrap:'wrap' }}>
                    {mega.symbol === 'BTC' && (
                      <a className="mega-action" href="https://mempool.space/" target="_blank" rel="noopener noreferrer">Mempool Explorer</a>
                    )}
                    {mega.symbol === 'MATIC' && (
                      <a className="mega-action" href="https://polygonscan.com/" target="_blank" rel="noopener noreferrer">PolygonScan</a>
                    )}
                    {(mega.symbol === 'STK' || mega.symbol === 'STX') && (
                      <a className="mega-action" href="https://explorer.stacks.co/" target="_blank" rel="noopener noreferrer">Stacks Explorer</a>
                    )}
                    {mega.symbol === 'SOL' && (
                      <a className="mega-action" href="https://solscan.io/" target="_blank" rel="noopener noreferrer">Solscan</a>
                    )}
                    {mega.symbol === 'ARB' && (
                      <a className="mega-action" href="https://arbiscan.io/" target="_blank" rel="noopener noreferrer">Arbiscan</a>
                    )}
                    {mega.symbol === 'OP' && (
                      <a className="mega-action" href="https://optimistic.etherscan.io/" target="_blank" rel="noopener noreferrer">Optimistic Etherscan</a>
                    )}
                    {mega.symbol === 'STRK' && (
                      <a className="mega-action" href="https://starkscan.co/" target="_blank" rel="noopener noreferrer">Starkscan</a>
                    )}
                  </div>
                  {tooltip.fdv != null && (
                    <div className="mega-cap">FDV: ${Math.round(Number(tooltip.fdv)).toLocaleString('en-US')}</div>
                  )}
                  {tooltip.circulating != null && (
                    <div className="mega-cap">Circulating: {Math.round(Number(tooltip.circulating)).toLocaleString('en-US')}</div>
                  )}
                  {tooltip.dexLiquidity != null && (
                    <div className="mega-cap">Liquidity (TVL): ${Math.round(Number(tooltip.dexLiquidity)).toLocaleString('en-US')}</div>
                  )}
                  {tooltip.dexVolume24h != null && (
                    <div className="mega-cap">DEX Vol 24h: ${Math.round(Number(tooltip.dexVolume24h)).toLocaleString('en-US')}</div>
                  )}
                  {Array.isArray(tooltip.topDexPools) && tooltip.topDexPools.length > 0 && (
                    <div className="mega-list plain" style={{marginTop:8}}>
                      <div className="mega-row"><span className="label">Top Pools</span><span className="value">ALEX/Stackswap</span></div>
                      {tooltip.topDexPools.map((p, idx) => (
                        <div className="mega-row" key={`pool-${idx}`}>
                          <span className="label">{p.symbol}</span>
                          <span className="value">${Math.round(p.tvlUsd).toLocaleString('en-US')}{p.apy!=null ? ` • APY ${(p.apy).toFixed(2)}%` : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(mega.symbol === 'STK' || mega.symbol === 'STX') && (
                    <div style={{ marginTop: 10, display:'flex', gap:8 }}>
                      <a className="mega-action" href={tooltip.alexUrl || 'https://app.alexlab.co/'} target="_blank" rel="noopener noreferrer">Open ALEX</a>
                    </div>
                  )}
                  {mega.symbol === 'MATIC' && tooltip.gasStation && (
                    <div className="mega-list plain" style={{marginTop:8}}>
                      <div className="mega-row"><span className="label">Gas (gwei)</span><span className="value">Fast {Math.round(tooltip.gasStation.fast.maxFee)} • Std {Math.round(tooltip.gasStation.standard.maxFee)} • Low {Math.round(tooltip.gasStation.safeLow.maxFee)}</span></div>
                    </div>
                  )}
                  {tooltip.stacksInfo && (
                    <div className="mega-list plain" style={{marginTop:8}}>
                      <div className="mega-row"><span className="label">Stacks Tip</span><span className="value">{String(tooltip.stacksInfo?.stacks_tip_height ?? '-') }</span></div>
                      <div className="mega-row"><span className="label">Burn Height</span><span className="value">{String(tooltip.stacksInfo?.burn_block_height ?? '-') }</span></div>
                      <div className="mega-row"><span className="label">Network</span><span className="value">{String(tooltip.stacksInfo?.network_id ?? '-') }</span></div>
                      <div className="mega-row"><span className="label">Chain Tip</span><span className="value">{String(tooltip.stacksInfo?.chain_tip ?? '-') }</span></div>
                    </div>
                  )}
                  {tooltip.poxInfo && (
                    <div className="mega-list plain" style={{marginTop:8}}>
                      <div className="mega-row"><span className="label">PoX Cycle</span><span className="value">{String(tooltip.poxInfo?.current_cycle?.id ?? '-') }</span></div>
                      <div className="mega-row"><span className="label">Stackers</span><span className="value">{String(tooltip.poxInfo?.current_cycle?.reward_set_size ?? '-') }</span></div>
                      <div className="mega-row"><span className="label">Min STX</span><span className="value">{String(tooltip.poxInfo?.min_amount_ustx ? (tooltip.poxInfo.min_amount_ustx/1e6).toLocaleString() : '-') }</span></div>
                    </div>
                  )}
                  {Array.isArray(tooltip.contractFns) && tooltip.contractFns.length>0 && (
                    <div className="mega-list plain" style={{marginTop:8}}>
                      <div className="mega-row"><span className="label">PoX-4 Fns</span><span className="value">{tooltip.contractFns.join(', ')}</span></div>
                    </div>
                  )}
                  {(typeof tooltip.stacksSource === 'string' && tooltip.stacksSource) || tooltip.sourceLink ? (
                    <div style={{ marginTop: 10 }}>
                      <div className="mega-section-title">PoX-4 Source (excerpt)</div>
                      {tooltip.stacksSource && (
                        <div className="mega-code" aria-label="PoX-4 Source Code">
                          {tooltip.stacksSource}
                        </div>
                      )}
                      {tooltip.sourceLink ? (
                        <a className="mega-action" href={tooltip.sourceLink} target="_blank" rel="noopener noreferrer">View full source</a>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}

        
        </div>

        {mega.active && (
          <div className="orbit-mega-panel">
            <div className="mega-card">
              <div className="mega-close" onClick={() => setMega({ ...mega, active: false })} aria-label="Close">×</div>
              <div className="mega-symbol">{mega.symbol}</div>
              {mega.symbol === 'BITS' ? (
                (() => {
                  const priceUSD = tooltip.price != null ? Number(tooltip.price) : Number(cm?.currentPrice ?? NaN);
                  const soldBits = tooltip.sold != null ? Number(tooltip.sold) : Number(cm?.soldBits ?? 0);
                  const availableBits = tooltip.available != null ? Number(tooltip.available) : Number(cm?.availableBits ?? 0);
                  const raisedUSDRaw = tooltip.raised != null ? Number(tooltip.raised) : (Number.isFinite(priceUSD) ? soldBits * priceUSD : null);
                  const raisedUSD = adjustRaisedForDisplay(raisedUSDRaw, soldBits);
                  const round = tooltip.round ?? cm?.roundNumber ?? presale?.roundNumber;
                  const completion = tooltip.completion;
                  return (
                    <>
                      <div className="mega-price">{Number.isFinite(priceUSD) ? `Presale: ${formatPrice(priceUSD)}` : '—'}</div>
                      <div className="mega-list plain">
                        <div className="mega-row"><span className="label">Round</span><span className="value">{round ?? '-'}</span></div>
                        <div className="mega-row"><span className="label">Price</span><span className="value">{Number.isFinite(priceUSD) ? `${formatPrice(priceUSD)}` : '-'}</span></div>
                        <div className="mega-row"><span className="label">Completion</span><span className="value">{completion != null ? `${(Number(completion) || 0).toFixed(2)}%` : '-'}</span></div>
                        <div className="mega-row"><span className="label">Sold Round <span className="round-dynamic">{round ?? '-'}</span></span><span className="value">{Number.isFinite(soldBits) ? `${formatIntRO(soldBits)}` : '-'}</span></div>
                        <div className="mega-row"><span className="label">Raised Round <span className="round-dynamic">{round ?? '-'}</span></span><span className="value">{Number.isFinite(raisedUSD) ? `${formatUSDCompact(raisedUSD)}` : '-'}</span></div>
                        <div className="mega-row"><span className="label">Available</span><span className="value">{Number.isFinite(availableBits) ? `${formatIntRO(availableBits)}` : '-'}</span></div>
                        <div className="mega-row"><span className="label">Total Transactions</span><span className="value">{tooltip.txCount != null ? `${formatIntRO(tooltip.txCount)}` : '-'}</span></div>
                        <div className="mega-row"><span className="label">TG Wallet Users</span><span className="value">{(() => {
                          const disp = applyWalletBaseline(tooltip.telegramUsers, tooltip.txCount);
                          return formatIntRO(disp);
                        })()}</span></div>
                        <div className="mega-row"><span className="label">TG Members</span><span className="value">{tooltip.telegramMembers != null ? `${formatIntRO(tooltip.telegramMembers)}` : '-'}</span></div>
                        <div className="mega-row"><span className="label">Prev Price</span><span className="value">{tooltip.prevRoundPrice != null ? `${formatPrice(tooltip.prevRoundPrice)}` : '—'}</span></div>
                        <div className="mega-row"><span className="label">Total Supply</span><span className="value">{tooltip.totalSupply != null ? `${formatIntRO(tooltip.totalSupply)}` : '—'}</span></div>
                        <div className="mega-row"><span className="label">Start</span><span className="value">{tooltip.startTime != null ? new Date(tooltip.startTime * 1000).toLocaleString() : '—'}</span></div>
                        <div className="mega-row"><span className="label">End</span><span className="value">{tooltip.endTime != null ? new Date(tooltip.endTime * 1000).toLocaleString() : '—'}</span></div>
                        <div className="mega-row"><span className="label">Total Boosted</span><span className="value">{tooltip.totalBoosted != null ? `${formatUSDCompact(Number(tooltip.totalBoosted))}` : '—'}</span></div>
                      </div>
                    </>
                  );
                })()
              ) : (
                <>
                  <div className="mega-price">{tooltip.price != null ? `$${tooltip.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'n/a'}</div>
                  <div className="mega-volume">{tooltip.volume24h != null ? `24h Volume: $${Math.round(tooltip.volume24h).toLocaleString('en-US')}` : ''}</div>
                  <div className="mega-cap">{tooltip.marketCap != null ? `Market Cap: $${Math.round(tooltip.marketCap).toLocaleString('en-US')}` : ''}</div>
                  <div className="mega-rank">{tooltip.rank != null ? `Rank: #${tooltip.rank}` : ''}</div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  const items = nodes.length ? nodes : defaultClassicNodes;

  return (
    <div className={`laser-orbit ${mega.active ? 'is-mega-open' : ''}`}>
      <div className="orbit-core">
        <div className="orbit-ring ring-1" />
        <div className="orbit-ring ring-2" />
        <div className="core-label">{centerLabel}</div>
      </div>

      <div className="orbit-nodes">
        {items.slice(0, 6).map((n, idx) => (
          <div key={idx} className={`orbit-node node-${idx + 1}`}>{n.icon}</div>
        ))}
      </div>

      <div className="orbit-connections">
        <div className="orbit-line line-1" />
        <div className="orbit-line line-2" />
        <div className="orbit-line line-3" />
        <div className="orbit-line line-4" />
        <div className="orbit-line line-5" />
        <div className="orbit-line line-6" />
      </div>
    </div>
  );
}



