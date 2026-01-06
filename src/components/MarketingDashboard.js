import React, { useEffect, useMemo, useState } from 'react';
import BrandLogo from './BrandLogo';
import './MarketingDashboard.css';

const COINGECKO_SIMPLE_PRICE =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,blockstack&vs_currencies=usd';

const KPI_SEGMENTS = {
  daily: {
    budget: 12500,
    spendChange: 6.2,
    conversions: 642,
    conversionDelta: 11.4,
    revenue: 53400,
    revenueDelta: 12.4,
    engagement: 7.4,
    engagementDelta: 5.1,
  },
  weekly: {
    budget: 86500,
    spendChange: 8.1,
    conversions: 4290,
    conversionDelta: 9.8,
    revenue: 312400,
    revenueDelta: 15.2,
    engagement: 7.1,
    engagementDelta: 6.7,
  },
  monthly: {
    budget: 342000,
    spendChange: 11.6,
    conversions: 17560,
    conversionDelta: 18.9,
    revenue: 1275400,
    revenueDelta: 21.3,
    engagement: 7.8,
    engagementDelta: 8.4,
  },
};

const CHANNEL_METRICS = [
  { channel: 'TikTok Ads', icon: '🎵', cpa: 0.32, roas: 8.5, trend: 24.3 }, // 24 EUR / 76 clicks = 0.32 EUR CPA
  { channel: 'Email automation', icon: '📬', cpa: 8.6, roas: 5.4, trend: 18.4 },
  { channel: 'Telegram community', icon: '💬', cpa: 6.2, roas: 6.1, trend: 22.0 },
  { channel: 'Twitter paid', icon: '🐦', cpa: 9.4, roas: 4.2, trend: 12.6 },
  { channel: 'Influencer pods', icon: '🤝', cpa: 7.8, roas: 4.9, trend: 15.1 },
];

const PLAYBOOK_STEPS = [
  {
    title: 'Detect signal',
    detail: 'AI monitor identifies whale inflows & social sentiment spikes.',
    icon: '📡',
  },
  {
    title: 'Segment audience',
    detail: 'Target power users & high LTV wallets via wallet graph.',
    icon: '🎯',
  },
  {
    title: 'Launch creatives',
    detail: 'Generate motion clips + copy; publish to Twitter, Telegram, email.',
    icon: '🎨',
  },
  {
    title: 'Reinforce',
    detail: 'Triggered reminders for users who clicked but did not convert.',
    icon: '🔁',
  },
  {
    title: 'Learn & iterate',
    detail: 'Retrain model on campaign lift and attribution data.',
    icon: '🧠',
  },
];

const INSIGHTS = [
  {
    id: 1,
    tone: 'positive',
    title: 'Conversion breakout in EMEA',
    description: 'AI detected a 14% lift after localized push notifications.',
    action: 'Allocate +12% budget to localized assets this week.',
  },
  {
    id: 2,
    tone: 'neutral',
    title: 'Optimal posting window',
    description: '2–4 PM UTC drives the largest wallet connect spike.',
    action: 'Schedule the next Bits giveaway thread for 14:30 UTC.',
  },
  {
    id: 3,
    tone: 'warning',
    title: 'Referral fatigue',
    description: 'Referral velocity slowed 6% compared to last week.',
    action: 'Refresh refer-a-friend reward copy and rotate creative set.',
  },
];

const CAMPAIGNS = [
  {
    name: 'Boosted Vault Launch',
    status: 'running',
    spend: 18400,
    revenue: 64200,
    roas: 3.5,
    channel: 'Telegram',
    objective: 'Community growth',
  },
  {
    name: 'AI Trader Waitlist',
    status: 'running',
    spend: 12800,
    revenue: 50800,
    roas: 4.0,
    channel: 'Email',
    objective: 'Early access',
  },
  {
    name: 'DeFi Thought Leadership',
    status: 'paused',
    spend: 6200,
    revenue: 15200,
    roas: 2.5,
    channel: 'Twitter',
    objective: 'Authority',
  },
];

const SENTIMENT = {
  daily: { score: 0.76, label: 'Positive', delta: 4.2 },
  weekly: { score: 0.82, label: 'Strong positive', delta: 5.8 },
  monthly: { score: 0.79, label: 'Positive', delta: 6.4 },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

const MarketingDashboard = () => {
  const [timeframe, setTimeframe] = useState('weekly');
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const kpis = useMemo(() => KPI_SEGMENTS[timeframe], [timeframe]);
  const sentiment = useMemo(() => SENTIMENT[timeframe], [timeframe]);
  const updatedLabel = liveMetrics ? new Date(liveMetrics.updatedAt).toLocaleTimeString() : null;

  useEffect(() => {
    let active = true;
    let interval;

    const fetchLiveMetrics = async () => {
      try {
        if (!active) return;
        setLoading((prev) => prev === false && liveMetrics ? prev : true);
        const response = await fetch(COINGECKO_SIMPLE_PRICE);
        if (!response.ok) {
          throw new Error(`market fetch ${response.status}`);
        }
        const data = await response.json();
        if (!active) return;

        const stxPrice = Number(data?.blockstack?.usd) || null;
        const btcPrice = Number(data?.bitcoin?.usd) || null;

        setLiveMetrics({
          stx: stxPrice,
          bitcoin: btcPrice,
          updatedAt: new Date().toISOString(),
        });
        setError(null);
      } catch (err) {
        if (active) {
          console.error('Marketing dashboard live data error:', err);
        setError('Unable to fetch live data right now.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchLiveMetrics();
    interval = setInterval(fetchLiveMetrics, 60_000);

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [liveMetrics]);

  const summaryCards = useMemo(() => {
    const bitcoinValue =
      typeof liveMetrics?.bitcoin === 'number'
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(liveMetrics.bitcoin)
        : '—';

    const stxValue =
      typeof liveMetrics?.stx === 'number'
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 3,
          }).format(liveMetrics.stx)
        : '—';

    return [
      {
        icon: '₿',
        label: 'Bitcoin price',
        value: bitcoinValue,
        footer: updatedLabel ? `Actualizat la ${updatedLabel}` : 'Feed live Coindesk',
      },
      {
        icon: 'Ⓢ',
        label: 'Stacks (STX)',
        value: stxValue,
        footer: 'Proxy backend /api/market/price',
      },
      {
        icon: '🎯',
        label: 'Conversions',
        value: kpis.conversions.toLocaleString(),
        footer: `${formatPercent(kpis.conversionDelta)} vs prev.`,
      },
      {
        icon: '✨',
        label: 'Engagement score',
        value: kpis.engagement.toFixed(1),
        footer: `${formatPercent(kpis.engagementDelta)} vs prev.`,
      },
    ];
  }, [kpis, liveMetrics, updatedLabel]);

  return (
    <div className="marketing-dashboard-page">
      <header className="marketing-dashboard-page__header">
        <div>
          <BrandLogo
            size="sm"
            className="marketing-dashboard-brand"
            textClassName="eyebrow"
          />
          <h1 className="title">AI Marketing Suite</h1>
          <p className="subtitle">
            Real-time growth analytics, channel orchestration, and campaign recommendations generated by the BitSwap AI
            engine.
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
          <div className="sentiment-meter">
            <span className="meter-label">Sentiment</span>
            <div className="meter-value">
              <span className="meter-score">{Math.round(sentiment.score * 100)}%</span>
              <span className="meter-tag">{sentiment.label}</span>
            </div>
            <span className="meter-delta positive">{formatPercent(sentiment.delta)}</span>
          </div>
        </div>
      </header>

      {loading && <p className="data-hint" aria-live="polite">Actualizăm datele live…</p>}
      {error && <p className="alert alert--error" role="alert">{error}</p>}

      <section className="kpi-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="kpi-card">
            <header>
              <span className="kpi-icon">{card.icon}</span>
              <span className="kpi-label">{card.label}</span>
            </header>
            <div className="kpi-value">{card.value}</div>
            <footer className="kpi-footer">{card.footer}</footer>
          </article>
        ))}
      </section>

      <section className="marketing-dashboard-page__columns">
        <div className="panel ai-surface">
          <header className="panel__header">
            <h2>Channel performance</h2>
            <span className="panel__tag">AI-ranked</span>
          </header>
          <ul className="channel-list">
            {CHANNEL_METRICS.map((channel) => (
              <li key={channel.channel} className="channel-item">
                <div className="channel-title">
                  <span className="channel-icon">{channel.icon}</span>
                  <div>
                    <strong>{channel.channel}</strong>
                    <span>Optimized by AI playbooks</span>
                  </div>
                </div>
                <div className="channel-metric">
                  <span className="metric-label">CPA</span>
                  <span className="metric-value">${channel.cpa.toFixed(2)}</span>
                </div>
                <div className="channel-metric">
                  <span className="metric-label">ROAS</span>
                  <span className="metric-value">{channel.roas.toFixed(1)}x</span>
                </div>
                <div className="channel-trend positive">{formatPercent(channel.trend)}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel ai-surface">
          <header className="panel__header">
            <h2>Automation playbook</h2>
          </header>
          <ol className="playbook">
            {PLAYBOOK_STEPS.map((step, index) => (
              <li key={step.title} className="playbook-step">
                <div className="playbook-index">{index + 1}</div>
                <div className="playbook-icon">{step.icon}</div>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="panel ai-surface">
        <header className="panel__header">
          <h2>AI highlights</h2>
          <span className="panel__tag">Updated moments ago</span>
        </header>
        <div className="insights-grid">
          {INSIGHTS.map((insight) => (
            <article key={insight.id} className={`insight insight--${insight.tone}`}>
              <header>
                <h3>{insight.title}</h3>
              </header>
              <p>{insight.description}</p>
              <footer>{insight.action}</footer>
            </article>
          ))}
        </div>
      </section>

      <section className="panel ai-surface">
        <header className="panel__header">
          <h2>Campaigns overview</h2>
          <span className="panel__tag">Live cohorts</span>
        </header>
        <div className="campaigns">
          {CAMPAIGNS.map((campaign) => (
            <article key={campaign.name} className="campaign-card">
              <header>
                <div>
                  <strong>{campaign.name}</strong>
                  <span>{campaign.channel} · {campaign.objective}</span>
                </div>
                <span className={`status status--${campaign.status}`}>{campaign.status}</span>
              </header>
              <dl className="campaign-metrics">
                <div>
                  <dt>Spend</dt>
                  <dd>{formatCurrency(campaign.spend)}</dd>
                </div>
                <div>
                  <dt>Revenue</dt>
                  <dd>{formatCurrency(campaign.revenue)}</dd>
                </div>
                <div>
                  <dt>ROAS</dt>
                  <dd>{campaign.roas.toFixed(1)}x</dd>
                </div>
              </dl>
              <footer className="campaign-actions">
                <button type="button" className="ghost-button">Optimize</button>
                <button type="button" className="ghost-button">Share</button>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MarketingDashboard;

