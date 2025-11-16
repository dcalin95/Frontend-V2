import React, { useEffect, useMemo, useState } from 'react';
import BrandLogo from './BrandLogo';
import './CryptoAnalyticsDashboard.css';

const GLOBAL_MARKET_URL = 'https://api.coingecko.com/api/v3/global';
const COINGECKO_SIMPLE_PRICE =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin&vs_currencies=usd';

const MARKET_SNAPSHOTS = {
  daily: {
    btc: 65342,
    eth: 3432,
    cap: 2.31,
    dominance: 46.2,
    volume: 96.2,
  },
  weekly: {
    btc: 62980,
    eth: 3285,
    cap: 2.18,
    dominance: 45.8,
    volume: 88.5,
  },
  monthly: {
    btc: 61212,
    eth: 3120,
    cap: 2.04,
    dominance: 45.1,
    volume: 79.1,
  },
};

const ASSET_ANALYTICS = [
  { asset: 'BTC', id: 'bitcoin', icon: '₿', signal: 'Long bias', change: 3.4, support: '61.2k', resistance: '68.0k', confidence: 84 },
  { asset: 'ETH', id: 'ethereum', icon: 'Ξ', signal: 'Neutral', change: 1.2, support: '3.05k', resistance: '3.45k', confidence: 77 },
  { asset: 'SOL', id: 'solana', icon: '◎', signal: 'Momentum', change: 5.9, support: '134', resistance: '158', confidence: 81 },
  { asset: 'BNB', id: 'binancecoin', icon: '🟡', signal: 'Range bound', change: -0.8, support: '572', resistance: '618', confidence: 62 },
];

const DEFI_TRENDS = [
  { name: 'Perpetual DEX open interest', value: '3.8B', change: 12.4 },
  { name: 'Stablecoin net inflows', value: '1.2B', change: 7.1 },
  { name: 'Staking TVL (L2 focus)', value: '26.7B', change: 4.6 },
  { name: 'NFT marketplace volume', value: '184M', change: -3.2 },
];

const RISK_FACTORS = [
  { label: 'Funding rate extremes', status: 'elevated', notes: 'BTC/ETH perp funding > 0.08%' },
  { label: 'Exchange reserves', status: 'favorable', notes: 'BTC reserves down 2.1% WoW' },
  { label: 'Macro calendar', status: 'watch', notes: 'FOMC minutes + CPI later this week' },
  { label: 'On-chain leverage', status: 'moderate', notes: 'Binance & OKX leverage ratio stable' },
];

const STRATEGY_CARDS = [
  {
    title: 'AI momentum rotation',
    description: 'Rotate 10% of outperformers into SOL, APT, and RWAs for 7d cycle.',
    impact: 'High',
    icon: '🔁',
  },
  {
    title: 'Basis trade alert',
    description: 'ETH futures basis > 9%. Deploy delta-neutral lend/borrow spread.',
    impact: 'Medium',
    icon: '🧮',
  },
  {
    title: 'Stablecoin deployment',
    description: 'USDC curve on Base at 12% APY. Auto-route treasury idle funds.',
    impact: 'Medium',
    icon: '🏦',
  },
];

const formatUSD = (value, options = {}) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: options.maxDigits ?? 0,
  }).format(value);

const CryptoAnalyticsDashboard = () => {
  const [timeframe, setTimeframe] = useState('daily');
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const snapshot = useMemo(() => {
    const defaults = MARKET_SNAPSHOTS[timeframe];
    if (!marketData?.global) return defaults;
    const { prices = {}, global } = marketData;
    return {
      btc: prices.bitcoin ?? defaults.btc,
      eth: prices.ethereum ?? defaults.eth,
      cap: global.marketCap ? global.marketCap / 1_000_000_000_000 : defaults.cap,
      volume: global.volume ? global.volume / 1_000_000_000 : defaults.volume,
      dominance: global.btcDominance ?? defaults.dominance,
    };
  }, [marketData, timeframe]);
  const updatedLabel = marketData ? new Date(marketData.updatedAt).toLocaleTimeString() : null;

  useEffect(() => {
    let active = true;
    let interval;

    const fetchMarketData = async () => {
      try {
        if (!active) return;
        setLoading((prev) => prev === false && marketData ? prev : true);
        const [priceRes, globalRes] = await Promise.all([
          fetch(COINGECKO_SIMPLE_PRICE),
          fetch(GLOBAL_MARKET_URL),
        ]);

        if (!active) return;

        const priceJson = await priceRes.json().catch(() => ({}));
        const globalJson = await globalRes.json().catch(() => ({}));
        const globalData = globalJson?.data || {};

        setMarketData({
          prices: {
            bitcoin: Number(priceJson?.bitcoin?.usd) || null,
            ethereum: Number(priceJson?.ethereum?.usd) || null,
            solana: Number(priceJson?.solana?.usd) || null,
            binancecoin: Number(priceJson?.binancecoin?.usd) || null,
          },
          global: {
            marketCap: Number(globalData?.total_market_cap?.usd) || null,
            volume: Number(globalData?.total_volume?.usd) || null,
            btcDominance: Number(globalData?.market_cap_percentage?.btc) || null,
          },
          updatedAt: new Date().toISOString(),
        });
        setError(null);
      } catch (err) {
        if (active) {
          console.error('Crypto dashboard live data error:', err);
          setError('Unable to fetch market data right now.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchMarketData();
    interval = setInterval(fetchMarketData, 60_000);

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [marketData]);

  return (
    <div className="crypto-dashboard-page">
      <header className="crypto-dashboard-page__header">
        <div>
          <BrandLogo
            size="sm"
            className="crypto-dashboard-brand"
            textClassName="eyebrow"
          />
          <h1 className="title">AI Crypto Intelligence</h1>
          <p className="subtitle">
            Macro + on-chain telemetry, market structure, and AI-generated tactics for BitSwap treasury and traders.
          </p>
        </div>
        <div className="header-controls">
          <div className="timeframe-toggle" role="tablist" aria-label="Select timeframe">
            {['daily', 'weekly', 'monthly'].map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={timeframe === option}
                className={`timeframe-button ${timeframe === option ? 'is-active' : ''}`}
                onClick={() => setTimeframe(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="market-capsule">
            <span className="market-capsule__label">BTC</span>
            <span className="market-capsule__value">
              {typeof snapshot.btc === 'number' ? formatUSD(snapshot.btc, { maxDigits: 0 }) : '—'}
            </span>
          </div>
          <div className="market-capsule">
            <span className="market-capsule__label">ETH</span>
            <span className="market-capsule__value">
              {typeof snapshot.eth === 'number' ? formatUSD(snapshot.eth, { maxDigits: 0 }) : '—'}
            </span>
          </div>
        </div>
      </header>

      {loading && <p className="data-hint" aria-live="polite">Actualizăm datele de piață…</p>}
      {error && <p className="alert alert--error" role="alert">{error}</p>}
      {updatedLabel && !error && (
        <p className="data-hint" aria-live="polite">Ultima actualizare: {updatedLabel}</p>
      )}

      <section className="market-grid">
        <article className="market-card">
          <span className="market-card__label">Total market cap</span>
          <h2>{snapshot.cap.toFixed(2)}T</h2>
          <p className="market-card__note">Aggregated across top 250 assets.</p>
        </article>
        <article className="market-card">
          <span className="market-card__label">24h volume</span>
          <h2>{snapshot.volume.toFixed(1)}B</h2>
          <p className="market-card__note">Perp + spot volume across CEX/L2.</p>
        </article>
        <article className="market-card">
          <span className="market-card__label">BTC dominance</span>
          <h2>{snapshot.dominance.toFixed(1)}%</h2>
          <p className="market-card__note">AI trending bias: rotation into AI/DePIN.</p>
        </article>
      </section>

      <section className="panel ai-surface">
        <header className="panel__header">
          <h2>Asset positioning</h2>
          <span className="panel__tag">AI outlook</span>
        </header>
        <div className="asset-table">
          {ASSET_ANALYTICS.map((row) => (
            <article key={row.asset} className="asset-row">
              <div className="asset-row__title">
                <span className="asset-row__icon">{row.icon}</span>
                <div>
                  <strong>{row.asset}</strong>
                  <span>{row.signal}</span>
                  {marketData?.prices?.[row.id] ? (
                    <span className="asset-price">
                      {formatUSD(marketData.prices[row.id], { maxDigits: 0 })}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="asset-row__metric">
                <span>Δ 24h</span>
                <strong className={row.change >= 0 ? 'positive' : 'negative'}>
                  {row.change >= 0 ? '+' : ''}
                  {row.change.toFixed(1)}%
                </strong>
              </div>
              <div className="asset-row__metric">
                <span>Support</span>
                <strong>{row.support}</strong>
              </div>
              <div className="asset-row__metric">
                <span>Resistance</span>
                <strong>{row.resistance}</strong>
              </div>
              <div className="asset-row__confidence">
                <span>Confidence</span>
                <div className="confidence-bar">
                  <div className="confidence-fill" style={{ width: `${row.confidence}%` }} />
                </div>
                <strong>{row.confidence}%</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="market-grid market-grid--split">
        <article className="panel ai-surface">
          <header className="panel__header">
            <h2>DeFi telemetry</h2>
          </header>
          <ul className="trend-list">
            {DEFI_TRENDS.map((trend) => (
              <li key={trend.name} className="trend-item">
                <div>
                  <strong>{trend.name}</strong>
                  <span>{trend.value}</span>
                </div>
                <span className={trend.change >= 0 ? 'positive' : 'negative'}>
                  {trend.change >= 0 ? '+' : ''}
                  {trend.change.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </article>
        <article className="panel ai-surface">
          <header className="panel__header">
            <h2>Risk matrix</h2>
          </header>
          <ul className="risk-list">
            {RISK_FACTORS.map((risk) => (
              <li key={risk.label} className="risk-item">
                <div>
                  <strong>{risk.label}</strong>
                  <span>{risk.notes}</span>
                </div>
                <span className={`risk-status risk-status--${risk.status}`}>
                  {risk.status}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel ai-surface">
        <header className="panel__header">
          <h2>AI strategy board</h2>
        </header>
        <div className="strategy-grid">
          {STRATEGY_CARDS.map((card) => (
            <article key={card.title} className="strategy-card">
              <header>
                <span className="strategy-icon">{card.icon}</span>
                <div>
                  <strong>{card.title}</strong>
                  <span>Impact: {card.impact}</span>
                </div>
              </header>
              <p>{card.description}</p>
              <footer>
                <button type="button" className="ghost-button">Run play</button>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CryptoAnalyticsDashboard;

