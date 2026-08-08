import React, { useId } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Cloud, CreditCard, FileSearch, LockKeyhole, Radio, ShieldCheck, UsersRound, Waypoints } from 'lucide-react';
import './sky-control-page.css';

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

const overviewCards = [
  { title: 'Gateway', icon: Radio, detail: 'Data provider not configured' },
  { title: 'Bot Manager', icon: Waypoints, detail: 'Not connected' },
  { title: 'Bot Fleet', icon: Cloud, detail: 'Not connected' },
  { title: 'Subscriptions', icon: UsersRound, detail: 'Data provider not configured' },
  { title: 'Payments', icon: CreditCard, detail: 'Data provider not configured' },
  { title: 'Admin Activity', icon: FileSearch, detail: 'Not connected' },
];

const tabKey = (tab) => tab.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function SkyControlPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabId = useId();
  const requestedTab = searchParams.get('tab');
  const activeTab = tabs.some((tab) => tabKey(tab) === requestedTab) ? requestedTab : 'overview';

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
            <span>Phase 1 shell. No providers or operational controls are connected.</span>
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
            {overviewCards.map(({ title, icon: Icon, detail }) => (
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
