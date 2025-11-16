import React, { useEffect, useMemo, useState } from 'react';
import BrandLogo from './BrandLogo';
import './PortfolioManager.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://backend-server-f82y.onrender.com';

const DEFAULT_PROFILES = {
  moderate: {
    totalValue: 256840,
    totalReturn: 18.4,
    riskScore: 38,
    diversification: 74,
    allocations: [
      { asset: 'BTC', allocation: 42, change: 2.8 },
      { asset: 'ETH', allocation: 26, change: 3.4 },
      { asset: 'SOL', allocation: 12, change: 5.1 },
      { asset: 'AI basket', allocation: 10, change: 6.8 },
      { asset: 'Stable yield', allocation: 10, change: 1.9 },
    ],
    summary: 'Strategie moderată, orientată spre creștere și protecție împotriva volatilității.',
    score: 3.6,
  },
  growth: {
    totalValue: 312420,
    totalReturn: 26.1,
    riskScore: 54,
    diversification: 68,
    allocations: [
      { asset: 'BTC', allocation: 34, change: 3.2 },
      { asset: 'ETH', allocation: 24, change: 4.1 },
      { asset: 'SOL', allocation: 14, change: 6.7 },
      { asset: 'Restaking', allocation: 12, change: 7.4 },
      { asset: 'DePIN AI', allocation: 16, change: 9.8 },
    ],
    summary: 'Portofoliu orientat către creștere accelerată și expunere pe tokenuri AI.',
    score: 4.2,
  },
  defensive: {
    totalValue: 198320,
    totalReturn: 11.2,
    riskScore: 24,
    diversification: 81,
    allocations: [
      { asset: 'BTC', allocation: 48, change: 2.2 },
      { asset: 'ETH', allocation: 22, change: 2.8 },
      { asset: 'Stable yield', allocation: 18, change: 1.4 },
      { asset: 'RWAs', allocation: 8, change: 0.9 },
      { asset: 'AI credits', allocation: 4, change: 1.2 },
    ],
    summary: 'Structură defensivă cu focus pe stabilitate și venit pasiv.',
    score: 3.1,
  },
};

const PROFILE_CONFIG = {
  moderate: { budget: 15000, riskLabel: 'moderate', riskScore: 38 },
  growth: { budget: 20000, riskLabel: 'aggressive', riskScore: 58 },
  defensive: { budget: 10000, riskLabel: 'conservative', riskScore: 24 },
};

const RECOMMENDATIONS = [
  {
    icon: '📡',
    title: 'Restaking rotation',
    detail: 'Shift 4% from SOL to restaking basket (ETH, STRK) for boosted ETH LSD yields.',
  },
  {
    icon: '🛡️',
    title: 'Delta hedge',
    detail: 'Sell weekly BTC covered calls to fund additional stablecoin laddering.',
  },
  {
    icon: '🧠',
    title: 'AI infra exposure',
    detail: 'Add 3% AI compute (RNDR, AKT) to capture BitSwap cross-chain narratives.',
  },
];

const EVENT_LOG = [
  { icon: '✅', label: 'Rebalanced AI basket', timestamp: '2h ago' },
  { icon: '🔄', label: 'Harvested restaking rewards', timestamp: '6h ago' },
  { icon: '⚠️', label: 'Risk alert: high perp funding', timestamp: 'Yesterday' },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const PortfolioManager = () => {
  const [profile, setProfile] = useState('moderate');
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentProfile = useMemo(
    () => profiles[profile] || DEFAULT_PROFILES[profile],
    [profiles, profile]
  );

  const performanceMetrics = useMemo(
    () => [
      { label: 'Total return YTD', value: `${currentProfile.totalReturn.toFixed(1)}%` },
      { label: 'Risk score', value: currentProfile.riskScore },
      { label: 'Diversification', value: `${currentProfile.diversification}%` },
      {
        label: 'AI score',
        value:
          typeof currentProfile.score === 'number'
            ? currentProfile.score.toFixed(1)
            : currentProfile.score || '—',
      },
    ],
    [currentProfile]
  );

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const config = PROFILE_CONFIG[profile];

    if (!config || profiles[profile]) {
      return () => controller.abort();
    }

    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${BACKEND_URL}/api/portfolio/generate-portfolio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            budget: config.budget,
            horizon: '6-12 months',
            risk: config.riskLabel,
            objectives: [],
            tokenPreferences: [],
            useBITS: profile === 'growth',
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API response ${response.status}`);
        }

        const data = await response.json();
        if (!active) return;

        const allocations = Array.isArray(data.allocations)
          ? data.allocations.map((item) => ({
              asset: item.token,
              allocation: Number(item.percent) || 0,
              change: 0,
            }))
          : DEFAULT_PROFILES[profile].allocations;

        const derived = {
          totalValue: config.budget,
          totalReturn: data.score ? Number(data.score) * 4 : DEFAULT_PROFILES[profile].totalReturn,
          riskScore: config.riskScore,
          diversification: Math.min(95, 55 + allocations.length * 8),
          allocations,
          summary: data.summary || DEFAULT_PROFILES[profile].summary,
          score: Number(data.score || DEFAULT_PROFILES[profile].score),
        };

        setProfiles((prev) => ({
          ...prev,
          [profile]: derived,
        }));
      } catch (err) {
        if (active && err.name !== 'AbortError') {
          console.error('Portfolio API error:', err);
          setError('Unable to fetch portfolio data right now.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPortfolio();

    return () => {
      active = false;
      controller.abort();
    };
  }, [profile, profiles]);

  return (
    <div className="portfolio-dashboard-page">
      <header className="portfolio-dashboard-page__header">
        <div>
          <BrandLogo
            size="sm"
            className="portfolio-dashboard-brand"
            textClassName="eyebrow"
          />
          <h1 className="title">AI Portfolio Manager</h1>
          <p className="subtitle">
            Risk-aware allocations, automated rebalancing, and actionable insights generated by BitSwap’s multi-chain AI
            optimizer.
          </p>
        </div>
        <div className="profile-selector" role="tablist" aria-label="Select profile">
          {Object.keys(DEFAULT_PROFILES).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={profile === key}
              className={`profile-selector__button ${profile === key ? 'is-active' : ''}`}
              onClick={() => setProfile(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </header>

      {loading && <p className="data-hint" aria-live="polite">Calculăm recomandările AI…</p>}
      {error && <p className="alert alert--error" role="alert">{error}</p>}

      <section className="panel ai-surface portfolio-summary">
        <div>
          <span className="label">Portfolio value</span>
          <h2>{formatCurrency(currentProfile.totalValue)}</h2>
          <span className="delta positive">+{currentProfile.totalReturn.toFixed(1)}% YTD</span>
        </div>
        <div>
          <span className="label">Risk score</span>
          <h3>{currentProfile.riskScore}/100</h3>
          <p>Adaptive based on volatility clusters.</p>
        </div>
        <div>
          <span className="label">Diversification</span>
          <h3>{currentProfile.diversification}%</h3>
          <p>AI-optimized across beta, factor, and sector exposures.</p>
        </div>
      </section>
      <p className="portfolio-summary__description">{currentProfile.summary}</p>

      <section className="panel ai-surface">
        <header className="panel__header">
          <h2>Allocation explorer</h2>
          <span className="panel__tag">Live weights</span>
        </header>
        <div className="allocation-grid">
          {currentProfile.allocations.map((row) => {
            const changeValue = typeof row.change === 'number' ? row.change : 0;
            return (
              <article key={row.asset} className="allocation-card">
                <header>
                  <strong>{row.asset}</strong>
                  <span>{row.allocation}%</span>
                </header>
                <div className="allocation-meter">
                  <div className="allocation-meter__fill" style={{ width: `${row.allocation}%` }} />
                </div>
                <footer className={changeValue >= 0 ? 'positive' : 'negative'}>
                  {changeValue >= 0 ? '+' : ''}
                  {changeValue.toFixed(1)}% 7d
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel ai-surface portfolio-grid">
        <article className="panel-card">
          <header className="panel__header">
            <h2>Performance metrics</h2>
          </header>
          <ul className="performance-list">
            {performanceMetrics.map((metric) => (
              <li key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel-card">
          <header className="panel__header">
            <h2>AI recommendations</h2>
          </header>
          <ul className="recommendation-list">
            {RECOMMENDATIONS.map((item) => (
              <li key={item.title}>
                <span className="recommendation-icon">{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel-card">
          <header className="panel__header">
            <h2>Recent automation</h2>
          </header>
          <ul className="event-feed">
            {EVENT_LOG.map((event) => (
              <li key={event.label}>
                <span className="event-icon">{event.icon}</span>
                <div>
                  <strong>{event.label}</strong>
                  <span>{event.timestamp}</span>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
};

export default PortfolioManager;

