import React, { useEffect, useId, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Cloud, CreditCard, Download, FileSearch, LockKeyhole, Radio, RefreshCw, ShieldCheck, UsersRound, Waypoints } from 'lucide-react';
import './sky-control-page.css';
import { fetchSkyControl, fetchSkyControlSummary } from '../services/skyControlService';

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
const TIMESTAMP_FIELDS = new Set(['started_at', 'stopped_at', 'last_crash_at', 'created_at', 'updated_at', 'last_heartbeat', 'next_retry_at', 'revoked_at', 'token_ready_at', 'first_seen', 'last_seen', 'event_time', 'starts_at', 'ends_at', 'last_active_at']);
export const formatTimestamp = (value) => { const date = value ? new Date(value) : null; return !date || Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(); };
export const formatRelativeTime = (value) => { const date = value ? new Date(value) : null; if (!date || Number.isNaN(date.getTime())) return '—'; const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000)); return seconds < 60 ? `${seconds} sec ago` : seconds < 3600 ? `${Math.floor(seconds / 60)} min ago` : seconds < 86400 ? `${Math.floor(seconds / 3600)} h ago` : `${Math.floor(seconds / 86400)} d ago`; };

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
    { title: 'Database Provider', icon: Radio, detail: health?.database === 'connected' ? 'CONNECTED' : 'Unavailable' },
    { title: 'Gateway Runtime', icon: Waypoints, detail: 'NOT CONNECTED' },
    { title: 'Bot Fleet Data', icon: Cloud, detail: fleet ? `CONNECTED — ${fleet.total} bots` : 'Unavailable' },
    { title: 'Subscriptions', icon: UsersRound, detail: quick && sky ? `${quick.active_subscriptions + sky.active_subscriptions} active` : 'Unavailable' },
    { title: 'Payments', icon: CreditCard, detail: payments ? `${payments.quick_payment_proofs + payments.skycloud_payment_proofs} proofs` : 'Unavailable' },
    { title: 'Admin Activity', icon: FileSearch, detail: quick && sky ? `${quick.admin_actions_total + sky.admin_actions_total} actions` : 'Unavailable' },
  ];
}

const endpointByTab = {
  'bot-fleet': '/bot-fleet', 'users-subscriptions': '/users', 'admin-timeline': '/admins',
  payments: '/payments', channel: '/channel-invites', gateway: '/overview', security: '/health',
};

function exportCsv(items, filename) {
  if (!items?.length) return;
  const keys = [...new Set(items.flatMap((item) => Object.keys(item)))].filter((key) => !/(token|password|secret|authorization|cookie|key|seed|mnemonic)/i.test(key));
  const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const body = [keys.join(','), ...items.map((item) => keys.map((key) => quote(item[key])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([body], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

export default function SkyControlPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabId = useId();
  const [summary, setSummary] = useState({ state: 'loading' });
  const [data, setData] = useState({ state: 'idle', items: [] });
  const [filters, setFilters] = useState({ search: '', status: '' });
  const requestedTab = searchParams.get('tab');
  const activeTab = tabs.some((tab) => tabKey(tab) === requestedTab) ? requestedTab : 'overview';

  const refreshSummary = (signal) => {
    setSummary((current) => ({ ...current, state: 'loading' }));
    return fetchSkyControlSummary(signal)
      .then(({ health, overview, schema }) => setSummary({ state: 'connected', health, overview, schema, refreshedAt: new Date().toISOString() }))
      .catch((error) => {
        if (signal?.aborted) return;
        const state = error?.status === 401 || error?.status === 403 ? 'unauthorized' : error?.status === 503 ? 'unavailable' : 'error';
        setSummary({ state });
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    refreshSummary(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const endpoint = endpointByTab[activeTab];
    if (!endpoint || activeTab === 'overview') return undefined;
    const controller = new AbortController();
    setData({ state: 'loading', items: [] });
    fetchSkyControl(endpoint, { signal: controller.signal, params: { page: 1, limit: 50, ...filters } })
      .then((response) => setData({ state: 'connected', ...response, refreshedAt: new Date().toISOString() }))
      .catch((error) => !controller.signal.aborted && setData({ state: error?.status === 401 || error?.status === 403 ? 'unauthorized' : 'unavailable', items: [] }));
    return () => controller.abort();
  }, [activeTab, filters.search, filters.status]);

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
          <button type="button" className="sky-control-page__back" onClick={() => navigate('/')}>
            <ArrowLeft size={16} aria-hidden />
            Back to home
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
            <span>{summary.state === 'connected' ? 'LIVE READ-ONLY PostgreSQL provider.' : 'Read-only provider status is loading.'}</span>
          </div>
        </div>
        <div className="sky-control-page__utility"><span>Operational controls disabled</span><span>{summary.refreshedAt ? `Last refreshed: ${new Date(summary.refreshedAt).toLocaleTimeString()}` : 'Not refreshed yet'}</span><button type="button" onClick={() => refreshSummary() }><RefreshCw size={14} aria-hidden />Refresh</button></div>
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
          <>
            <div className="sky-control-page__card-grid">
              {overviewCards(summary).map(({ title, icon: Icon, detail }) => (
                <article key={title} className="sky-control-page__card">
                  <div className="sky-control-page__card-title"><Icon size={17} aria-hidden /><h2>{title}</h2></div>
                  <p>Status</p>
                  <strong>{detail}</strong>
                </article>
              ))}
            </div>
            <section className="sky-control-page__schema" aria-label="Database schema compatibility">
              <div className="sky-control-page__card-title"><ShieldCheck size={17} aria-hidden /><h2>Database schema compatibility</h2></div>
              <span>LIVE READ-ONLY</span>
              {summary.schema?.tables?.length ? (
                <ul>
                  {summary.schema.tables.map((table) => (
                    <li key={table.table} className={table.compatible ? 'is-compatible' : 'is-incompatible'}>
                      <code>{table.table}</code>
                      <strong>{table.compatible ? (table.adapted ? 'ADAPTED' : 'OK') : 'SCHEMA INCOMPATIBLE'}</strong>
                    </li>
                  ))}
                </ul>
              ) : <p>Diagnostics disabled.</p>}
            </section>
          </>
        ) : (
          <div className="sky-control-page__workspace">
            <div className="sky-control-page__workspace-head">
              <div><span className="sky-control-page__eyebrow">LIVE READ-ONLY</span><h2>{tabs.find((tab) => tabKey(tab) === activeTab)}</h2></div>
              {['bot-fleet', 'users-subscriptions', 'admin-timeline', 'payments'].includes(activeTab) && <button type="button" className="sky-control-page__action" onClick={() => exportCsv(data.items, `sky-control-${activeTab}.csv`)} disabled={!data.items?.length}><Download size={14} aria-hidden />Export current view</button>}
            </div>
            {['bot-fleet', 'users-subscriptions'].includes(activeTab) && <div className="sky-control-page__filters"><input aria-label="Search" value={filters.search} onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))} placeholder="Search user or bot" />{activeTab === 'bot-fleet' && <select aria-label="Status" value={filters.status} onChange={(event) => setFilters((value) => ({ ...value, status: event.target.value }))}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="STOPPED">Stopped</option><option value="CRASHED">Crashed</option><option value="REVOKED">Revoked</option></select>}</div>}
            {activeTab === 'gateway' && <p className="sky-control-page__notice">SERVICE RUNTIME NOT CONNECTED. Database-derived metadata only. No live service control or runtime connection is configured.</p>}
            {activeTab === 'security' && <div className="sky-control-page__security"><strong>Sky Control DB role: {summary.state === 'connected' ? 'READ ONLY CONFIGURED' : 'UNAVAILABLE'}</strong><span>Sensitive projections: excluded</span><span>Response redaction: enabled</span><span>Telegram: NOT CONNECTED</span><span>SSH: NOT CONNECTED</span><span>Write operations: DISABLED</span></div>}
            {!['gateway', 'security'].includes(activeTab) && (data.state === 'connected' ? <CompactTable items={data.items} forensic={activeTab === 'forensics'} /> : <div className="sky-control-page__empty"><Cloud size={19} aria-hidden /><p>{data.state === 'unauthorized' ? 'Not authorized for Sky Control.' : data.state === 'loading' ? 'Loading read-only data...' : data.state === 'unavailable' ? 'Data unavailable.' : 'Unable to load read-only data.'}</p></div>)}
          </div>
        )}
      </section>
    </main>
  );
}

function CompactTable({ items, forensic }) {
  if (!items?.length) return <div className="sky-control-page__empty"><p>{forensic ? 'Forensic correlation not configured yet.' : 'No matching read-only records.'}</p></div>;
  const columns = Object.keys(items[0]).filter((key) => !/(token|password|secret|authorization|cookie|key|seed|mnemonic)/i.test(key)).slice(0, 10);
  const label = (column) => column === 'transaction_id' ? 'REFERENCE' : column.replaceAll('_', ' ');
  const safeValue = (item, column) => TIMESTAMP_FIELDS.has(column) ? (column === 'last_heartbeat' ? `${formatTimestamp(item[column])} (${formatRelativeTime(item[column])})` : formatTimestamp(item[column])) : column === 'transaction_id' ? `${item.reference_type || 'unknown'}: ${item.reference_value || '—'}` : typeof item[column] === 'object' ? '—' : String(item[column] ?? '—');
  return <div className="sky-control-page__table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{label(column)}</th>)}</tr></thead><tbody>{items.map((item, index) => <tr key={item.id || item.bot_id || item.order_id || `${index}-${item.user_id}`}>{columns.map((column) => <td key={column} title={TIMESTAMP_FIELDS.has(column) ? String(item[column] || '') : undefined}>{safeValue(item, column)}</td>)}</tr>)}</tbody></table></div>;
}
