import React, { useEffect, useId, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Cloud, CreditCard, FileSearch, LockKeyhole, Radio, ShieldCheck, UsersRound, Waypoints } from 'lucide-react';
import './sky-control-page.css';
import { fetchSkyControlSummary } from '../services/skyControlService';

const tabs = [
  'Overview',
  'Gateway',
  'Bot Fleet',
  'Users & Subscriptions',
  'Admin Timeline',
  'Payments',
  'Channel',
  'Forensics',
  'Security',
];

const tabKey = (tab) => tab.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function overviewCards(summary) {
  const { health, overview } = summary || {};
  const state = summary?.state || 'loading';
  const unavailable = state === 'unauthorized' ? 'Unauthorized' : state === 'unavailable' ? 'Unavailable' : state === 'error' ? 'Error' : 'Loading';
  if (state !== 'connected') {
    return [
      { title: 'Gateway', icon: Radio, detail: unavailable },
      { title: 'Bot Manager', icon: Waypoints, detail: unavailable },
      { title: 'Bot Fleet', icon: Cloud, detail: unavailable },
      { title: 'Subscriptions', icon: UsersRound, detail: unavailable },
      { title: 'Payments', icon: CreditCard, detail: unavailable },
      { title: 'Admin Activity', icon: FileSearch, detail: unavailable },
    ];
  }
  const quick = overview?.quick?.metrics;
  const sky = overview?.skycloud?.metrics;
  const fleet = overview?.bot_fleet?.metrics;
  const payments = overview?.payments?.metrics;
  return [
    { title: 'Gateway', icon: Radio, detail: health?.database === 'connected' ? 'Connected' : 'Unavailable' },
    { title: 'Bot Manager', icon: Waypoints, detail: overview?.quick?.status === 'available' ? 'Connected' : 'Unavailable' },
    { title: 'Bot Fleet', icon: Cloud, detail: fleet ? `${fleet.total} bots` : 'Unavailable' },
    { title: 'Subscriptions', icon: UsersRound, detail: quick && sky ? `${quick.active_subscriptions + sky.active_subscriptions} active` : 'Unavailable' },
    { title: 'Payments', icon: CreditCard, detail: payments ? `${payments.quick_payment_proofs + payments.skycloud_payment_proofs} proofs` : 'Unavailable' },
    { title: 'Admin Activity', icon: FileSearch, detail: quick && sky ? `${quick.admin_actions_total + sky.admin_actions_total} actions` : 'Unavailable' },
  ];
}

export default function SkyControlPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabId = useId();
  const [summary, setSummary] = useState({ state: 'loading' });
  const requestedTab = searchParams.get('tab');
  const activeTab = tabs.some((tab) => tabKey(tab) === requestedTab) ? requestedTab : 'overview';

  useEffect(() => {
    const controller = new AbortController();
    fetchSkyControlSummary(controller.signal)
      .then(({ health, overview }) => setSummary({ state: 'connected', health, overview }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        const state = error?.status === 401 || error?.status === 403 ? 'unauthorized' : error?.status === 503 ? 'unavailable' : 'error';
        setSummary({ state });
      });
    return () => controller.abort();
  }, []);

  const selectTab = (nextTab) => {
    setSearchParams(nextTab === 'overview' ? {} : { tab: nextTab }, { replace: true });
  };

  const handleTabKeyDown = (event) => {
    const currentIndex = tabs.findIndex((tab) => tabKey(tab) === activeTab);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === currentIndex) return;
    event.preventDefault();
    const nextTab = tabKey(tabs[nextIndex]);
    selectTab(nextTab);
    document.getElementById(`${tabId}-${nextTab}`)?.focus();
  };

  return (
    <main className="sky-control-page">
      <header className="sky-control-page__header">
        <div className="sky-control-page__topline">
          <button type="button" className="sky-control-page__back" onClick={() => navigate('/dex-edu/dashboard')}>
            <ArrowLeft size={16} aria-hidden />
            Back to dashboard
          </button>
          <span className="sky-control-page__read-only"><LockKeyhole size={13} aria-hidden />READ ONLY</span>
        </div>
        <div className="sky-control-page__title-row">
          <div>
            <span className="sky-control-page__eyebrow">PRIVATE WORKSPACE</span>
            <h1>Sky Control</h1>
            <p>Private operations and forensic workspace</p>
          </div>
          <div className="sky-control-page__boundary" role="note">
            <ShieldCheck size={17} aria-hidden />
            <span>{summary.state === 'connected' ? 'Read-only PostgreSQL provider connected.' : 'Read-only provider status is loading.'}</span>
          </div>
        </div>
      </header>

      <nav className="sky-control-page__tabs" aria-label="Sky Control sections">
        <div role="tablist" aria-orientation="horizontal" onKeyDown={handleTabKeyDown}>
          {tabs.map((tab) => {
            const key = tabKey(tab);
            const selected = key === activeTab;
            return (
              <button
                key={key}
                id={`${tabId}-${key}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${tabId}-panel`}
                tabIndex={selected ? 0 : -1}
                className={selected ? 'is-active' : ''}
                onClick={() => selectTab(key)}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </nav>

      <section id={`${tabId}-panel`} role="tabpanel" aria-label={`${tabs.find((tab) => tabKey(tab) === activeTab)} section`} className="sky-control-page__panel">
        {activeTab === 'overview' ? (
          <div className="sky-control-page__card-grid">
            {overviewCards(summary).map(({ title, icon: Icon, detail }) => (
              <article key={title} className="sky-control-page__card">
                <div className="sky-control-page__card-title"><Icon size={17} aria-hidden /><h2>{title}</h2></div>
                <p>Status</p>
                <strong>{detail}</strong>
              </article>
            ))}
          </div>
        ) : (
          <div className="sky-control-page__empty">
            <Cloud size={19} aria-hidden />
            <h2>{tabs.find((tab) => tabKey(tab) === activeTab)}</h2>
            <p>Data provider not configured. This Phase 1 view is intentionally read only.</p>
          </div>
        )}
      </section>
    </main>
  );
}
