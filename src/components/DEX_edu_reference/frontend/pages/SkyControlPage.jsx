import React, { useEffect, useId, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Cloud, CreditCard, Download, FileSearch, LockKeyhole, Radio, RefreshCw, ShieldCheck, UsersRound, Waypoints } from 'lucide-react';
import './sky-control-page.css';
import { buildSkyControlWalletExportParams, fetchSkyControl, fetchSkyControlSummary, fetchSkyControlForensicAnomalies, fetchSkyControlForensicEntity, fetchSkyControlForensicExport, fetchSkyControlForensicGraph, fetchSkyControlForensicTimeline, fetchSkyControlPaymentCase, fetchSkyControlMoneyFlow, fetchSkyControlTransaction, fetchSkyControlWallet, fetchSkyControlWalletAnomalies, fetchSkyControlWalletDiscovery, fetchSkyControlWalletDiscoveryDetail, fetchSkyControlWalletExport, fetchSkyControlWalletHistory, searchSkyControlForensics, searchSkyControlPaymentCases, searchSkyControlWallets } from '../services/skyControlService';

const tabs = [
  'Overview',
  'Gateway',
  'Bot Fleet',
  'Users & Subscriptions',
  'Admin Timeline',
  'Payments',
  'Channel',
  'Forensics',
  'Wallet Intelligence',
  'Security',
];

const tabKey = (tab) => tab.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const TIMESTAMP_FIELDS = new Set(['started_at', 'stopped_at', 'last_crash_at', 'created_at', 'updated_at', 'last_heartbeat', 'next_retry_at', 'revoked_at', 'token_ready_at', 'first_seen', 'last_seen', 'event_time', 'starts_at', 'ends_at', 'expires_at', 'last_active_at']);
const SAFE_VIEW_COLUMNS = {
  'bot-fleet': ['user_id', 'bot_id', 'bot_username', 'bot_first_name', 'status', 'health', 'pid', 'started_at', 'last_heartbeat', 'heartbeat_age_seconds', 'crash_count', 'last_crash_at', 'registration_source'],
  'users-subscriptions': ['user_id', 'username', 'first_name', 'last_name', 'language', 'status', 'last_active_at', 'quick_status', 'skycloud_status', 'personal_status', 'halcyon_status', 'personal_bot_status'],
  'admin-timeline': ['admin_id', 'systems', 'total_actions', 'first_seen', 'last_seen', 'actor_type'],
  payments: ['system', 'order_id', 'transaction_id', 'verified', 'event_time', 'timestamp_source'],
  channel: ['id', 'user_id', 'purpose', 'status', 'expires_at', 'created_by_admin_id', 'created_at', 'updated_at', 'invite_present'],
};
const SENSITIVE_FIELD = /(token|password|secret|authorization|cookie|key|seed|mnemonic)/i;
const statusLabel = (value) => String(value || 'none').replaceAll('_', ' ').toUpperCase();
const systemLabel = (value) => ({ quick: 'Quick', skycloud: 'SkyCloud', personal: 'Personal', halcyon: 'Halcyon' }[String(value).toLowerCase()] || String(value));
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
    { title: 'Bot Manager Runtime', icon: Waypoints, detail: 'NOT CONNECTED' },
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
  const [filters, setFilters] = useState({ search: '', status: '', health: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [selectedRecord, setSelectedRecord] = useState(null);
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
    const params = activeTab === 'bot-fleet' ? { page, limit, ...filters } : activeTab === 'users-subscriptions' ? { page, limit, search: filters.search } : { page, limit };
    fetchSkyControl(endpoint, { signal: controller.signal, params })
      .then((response) => setData({ state: 'connected', ...response, refreshedAt: new Date().toISOString() }))
      .catch((error) => !controller.signal.aborted && setData({ state: error?.status === 401 || error?.status === 403 ? 'unauthorized' : 'unavailable', items: [] }));
    return () => controller.abort();
  }, [activeTab, page, limit, filters.search, filters.status, filters.health]);

  const selectTab = (nextTab) => {
    setPage(1);
    setSelectedRecord(null);
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
        ) : activeTab === 'forensics' ? <ForensicsWorkspace /> : activeTab === 'wallet-intelligence' ? <WalletIntelligenceWorkspace /> : (
          <div className="sky-control-page__workspace">
            <div className="sky-control-page__workspace-head">
              <div><span className="sky-control-page__eyebrow">LIVE READ-ONLY</span><h2>{tabs.find((tab) => tabKey(tab) === activeTab)}</h2></div>
              {['bot-fleet', 'users-subscriptions', 'admin-timeline', 'payments'].includes(activeTab) && <button type="button" className="sky-control-page__action" onClick={() => exportCsv(data.items, `sky-control-${activeTab}.csv`)} disabled={!data.items?.length}><Download size={14} aria-hidden />Export current view</button>}
            </div>
            {['bot-fleet', 'users-subscriptions'].includes(activeTab) && <div className="sky-control-page__filters"><input aria-label="Search" value={filters.search} onChange={(event) => { setPage(1); setFilters((value) => ({ ...value, search: event.target.value })); }} placeholder={activeTab === 'bot-fleet' ? 'Search user or bot' : 'Search user'} />{activeTab === 'bot-fleet' && <><select aria-label="Status" value={filters.status} onChange={(event) => { setPage(1); setFilters((value) => ({ ...value, status: event.target.value })); }}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="STOPPED">Stopped</option><option value="CRASHED">Crashed</option><option value="REVOKED">Revoked</option></select><select aria-label="Health" value={filters.health} onChange={(event) => { setPage(1); setFilters((value) => ({ ...value, health: event.target.value })); }}><option value="">All health states</option><option value="HEALTHY">Healthy</option><option value="DEGRADED">Degraded</option><option value="UNHEALTHY">Unhealthy</option></select></>}</div>}
            {activeTab === 'gateway' && <p className="sky-control-page__notice">SERVICE RUNTIME NOT CONNECTED. Database-derived metadata only. No live service control or runtime connection is configured.</p>}
            {activeTab === 'security' && <div className="sky-control-page__security"><strong>Sky Control DB role: {summary.state === 'connected' ? 'READ ONLY CONFIGURED' : 'UNAVAILABLE'}</strong><span>Sensitive projections: excluded</span><span>Response redaction: enabled</span><span>Telegram: NOT CONNECTED</span><span>SSH: NOT CONNECTED</span><span>Write operations: DISABLED</span></div>}
            {!['gateway', 'security'].includes(activeTab) && (data.state === 'connected' ? <><CompactTable items={data.items} view={activeTab} forensic={activeTab === 'forensics'} onSelect={setSelectedRecord} /><Pagination page={page} limit={limit} itemCount={data.items?.length || 0} onPageChange={setPage} onLimitChange={(nextLimit) => { setPage(1); setLimit(nextLimit); }} />{selectedRecord && <RecordDrawer view={activeTab} record={selectedRecord} onClose={() => setSelectedRecord(null)} />}</> : <div className="sky-control-page__empty"><Cloud size={19} aria-hidden /><p>{data.state === 'unauthorized' ? 'Not authorized for Sky Control.' : data.state === 'loading' ? 'Loading read-only data...' : data.state === 'unavailable' ? 'Data unavailable.' : 'Unable to load read-only data.'}</p></div>)}
          </div>
        )}
      </section>
    </main>
  );
}

function CompactTable({ items, view, forensic, onSelect }) {
  if (!items?.length) return <div className="sky-control-page__empty"><p>{forensic ? 'Forensic correlation not configured yet.' : 'No matching read-only records.'}</p></div>;
  const columns = (SAFE_VIEW_COLUMNS[view] || (['forensics', 'timeline'].includes(view) ? [...new Set(items.flatMap((item) => Object.keys(item)))] : [])).filter((column) => items.some((item) => Object.prototype.hasOwnProperty.call(item, column)) && !SENSITIVE_FIELD.test(column));
  if (!columns.length) return <div className="sky-control-page__empty"><p>{forensic ? 'Forensic correlation not configured yet.' : 'No safe records are available for this view.'}</p></div>;
  const label = (column) => column === 'transaction_id' ? 'REFERENCE' : column.replaceAll('_', ' ');
  const safeValue = (item, column) => {
    if (TIMESTAMP_FIELDS.has(column)) return column === 'last_heartbeat' ? `${formatTimestamp(item[column])} (${formatRelativeTime(item[column])})` : formatTimestamp(item[column]);
    if (column === 'transaction_id') return <span className="sky-control-page__reference"><small>{item.reference_type || 'none'}</small>{item.reference_value || '-'}</span>;
    if (column === 'systems' && Array.isArray(item[column])) return item[column].map(systemLabel).join(' · ');
    if (/(status|health|verified|actor_type|invite_present)$/.test(column)) return <span className="sky-control-page__status-chip">{statusLabel(item[column])}</span>;
    if (typeof item[column] === 'object') return '-';
    return String(item[column] ?? '-');
  };
  return <div className="sky-control-page__table-wrap sky-control-page__table-wrap--wide" tabIndex="0" aria-label={`${view} records`}><table><thead><tr>{columns.map((column) => <th key={column} scope="col">{label(column)}</th>)}</tr></thead><tbody>{items.map((item, index) => <tr key={item.id || item.bot_id || item.order_id || `${index}-${item.user_id}`} onClick={() => onSelect(item)} tabIndex="0" onKeyDown={(event) => event.key === 'Enter' && onSelect(item)}>{columns.map((column) => <td key={column} title={TIMESTAMP_FIELDS.has(column) ? String(item[column] || '') : undefined}>{safeValue(item, column)}</td>)}</tr>)}</tbody></table></div>;
}

const walletEvidenceLegend = [
  ["DIRECT", "Directly observed application or on-chain data."],
  ["DERIVED", "Calculated from observed records using explicit rules."],
  ["CORRELATED", "Related records; this does not establish identity or ownership."],
  ["UNPROVEN", "Reported or incomplete information requiring more evidence."],
];

const safeDisplay = (value) =>
  value == null || value === "" || typeof value === "object" ? "-" : String(value);

function walletErrorMessage(error) {
  if ([401, 403].includes(error?.status)) return "Not authorized for Wallet Intelligence.";
  if (error?.status === 404) return "No exact case was found for this selection.";
  if (/invalid|empty/i.test(error?.message || "")) return "Enter a valid exact identifier.";
  return "Wallet Intelligence data is currently unavailable.";
}

function StatusList({ title, items, empty }) {
  const entries = Object.entries(items || {});
  return <section className="sky-control-page__wallet-status" aria-label={title}>
    <h3>{title}</h3>
    {entries.length ? entries.map(([name, value]) => {
      const state = String(value?.status || value?.state || (value?.available === false ? "UNAVAILABLE" : value?.available === true ? "AVAILABLE" : value) || "UNAVAILABLE").toUpperCase();
      const reason = typeof value === "object" ? value?.reason || value?.reason_code : null;
      return <div key={name}><span>{name.replace(/[_-]+/g, " ")}</span><strong className={`is-${state.toLowerCase()}`}>{state}</strong>{reason ? <small>{safeDisplay(reason)}</small> : null}</div>;
    }) : <p>{empty}</p>}
  </section>;
}

const discoveryErrorMessage = (error) => {
  if (error?.status === 401 || error?.status === 403) return 'Not authorized for Automatic Discovery.';
  if (error?.status === 400) return 'Automatic Discovery request was not accepted.';
  if (error?.status === 404) return 'Automatic Discovery is not available from the current provider.';
  return 'Automatic Discovery is currently unavailable.';
};

const discoveryValue = (value) => value == null ? 'Unavailable' : safeDisplay(value);

function WalletDiscovery({ onOpenInvestigation }) {
  const [filters, setFilters] = useState({ system: 'quickmail', chain: '', status: '', has_admin_activity: '' });
  const [state, setState] = useState({ status: 'loading', items: [], summary: null, source_status: null, provider_status: null, detail: null, error: null });
  const load = async (nextFilters = filters, signal) => {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const response = await fetchSkyControlWalletDiscovery({ ...nextFilters, limit: 100, offset: 0 }, { signal });
      setState({ status: 'ready', items: response.items || [], summary: response.summary || {}, source_status: response.source_status || {}, provider_status: response.provider_status || {}, detail: null, error: null });
    } catch (error) {
      if (signal?.aborted) return;
      setState((current) => ({ ...current, status: 'error', items: [], detail: null, error: discoveryErrorMessage(error) }));
    }
  };
  useEffect(() => {
    const controller = new AbortController();
    load({ system: 'quickmail', chain: '', status: '', has_admin_activity: '' }, controller.signal);
    return () => controller.abort();
  }, []);
  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    load(next);
  };
  const showDetail = async (item) => {
    if (!item.chain || !item.address) return;
    setState((current) => ({ ...current, detail: { status: 'loading', item } }));
    try {
      const detail = await fetchSkyControlWalletDiscoveryDetail(item.chain, item.address);
      setState((current) => ({ ...current, detail: { status: 'ready', item, data: detail } }));
    } catch (error) {
      setState((current) => ({ ...current, detail: { status: 'error', item, error: discoveryErrorMessage(error) } }));
    }
  };
  const summaryRows = [
    ['Total destinations', state.summary?.total_destinations], ['Application-linked destinations', state.summary?.total_destinations],
    ['Verified on-chain destinations', state.summary?.verified_onchain_destinations], ['Application-only destinations', state.summary?.application_only_destinations],
    ['Destinations with admin activity', state.summary?.destinations_with_admin_activity], ['Multi-system destinations', state.summary?.multi_system_destinations],
    ['Destination changes', state.summary?.destination_changes], ['Reused destinations', state.summary?.reused_destinations], ['Known service hits', state.summary?.known_service_hits],
  ];
  return <section className="sky-control-page__discovery" aria-label="Automatic Discovery">
    <div className="sky-control-page__workspace-head"><div><span className="sky-control-page__eyebrow">AUTOMATIC DISCOVERY</span><h3>QuickMail Discovery Summary</h3><p>Configured and application-observed destinations are not evidence of receipt or ownership.</p></div><button type="button" className="sky-control-page__action" onClick={() => load(filters)}>Refresh discovery</button></div>
    <div className="sky-control-page__timeline-filters" aria-label="Automatic Discovery filters">
      <label>System<select aria-label="Discovery system filter" value={filters.system} onChange={(event) => updateFilter('system', event.target.value)}><option value="quickmail">QuickMail</option><option value="quick">Quick</option><option value="skycloud">SkyCloud</option><option value="personal">Personal</option><option value="halcyon">Halcyon</option></select></label>
      <label>Chain<select aria-label="Discovery chain filter" value={filters.chain} onChange={(event) => updateFilter('chain', event.target.value)}><option value="">All chains</option><option value="bsc">BSC</option><option value="ethereum">Ethereum</option></select></label>
      <label>Status<select aria-label="Discovery status filter" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="">All statuses</option><option value="configured">Configured</option><option value="confirmed">On-chain confirmed</option></select></label>
      <label>Admin-linked activity<select aria-label="Discovery admin activity filter" value={filters.has_admin_activity} onChange={(event) => updateFilter('has_admin_activity', event.target.value)}><option value="">All</option><option value="true">Present</option><option value="false">None</option></select></label>
    </div>
    {state.status === 'loading' ? <div className="sky-control-page__empty"><p>Discovering payment destinations...</p></div> : null}
    {state.error ? <p className="sky-control-page__notice" role="alert">{state.error}</p> : null}
    {state.status === 'ready' ? <>
      <div className="sky-control-page__wallet-summary" aria-label="QuickMail Discovery Summary metrics"><div>{summaryRows.map(([label, value]) => <article key={label}><span>{label}</span><strong>{discoveryValue(value)}</strong></article>)}</div></div>
      {(Object.values(state.provider_status || {}).some((item) => item?.available === false) || Object.values(state.source_status || {}).some((item) => item?.available === false)) ? <p className="sky-control-page__notice">Some provider or application sources are degraded. Available discovery evidence remains visible.</p> : null}
      {!state.items.length ? <div className="sky-control-page__empty"><p>No QuickMail payment destinations were found in the currently available application evidence.</p></div> : <section className="sky-control-page__discovery-list" aria-labelledby="observed-payment-destinations"><h3 id="observed-payment-destinations">Observed Payment Destinations</h3><div className="sky-control-page__table-wrap sky-control-page__table-wrap--wide"><table><thead><tr><th>Destination</th><th>Chain</th><th>Systems</th><th>Payments</th><th>Orders</th><th>Admin-linked Activity</th><th>First Seen</th><th>Last Seen</th><th>On-chain Status</th><th>Confirmed Receipts</th><th>Destination Changes</th><th>Service Hits</th><th>Evidence</th><th>Action</th></tr></thead><tbody>{state.items.map((item) => <tr key={`${item.chain}:${item.address}`}><td><code title={item.address}>{compactIdentifier(item.address)}</code></td><td>{safeDisplay(item.chain)}</td><td>{(item.systems || []).map(systemLabel).join(', ') || '-'}</td><td>{safeDisplay(item.payment_count)}</td><td>{safeDisplay(item.order_count)}</td><td>{safeDisplay(item.admin_action_count)}</td><td>{timeLabel(item.first_seen)}</td><td>{timeLabel(item.last_seen)}</td><td>{item.onchain_status === 'ONCHAIN_PAYMENT_CONFIRMED' ? 'On-chain confirmed' : 'Configured / Application observed'}</td><td>{safeDisplay(item.confirmed_receipt_count || 0)}</td><td>{item.destination_history?.length || 0}</td><td>{item.service_labels?.length || 0}</td><td>{safeDisplay(item.evidence_type)}</td><td><button type="button" className="sky-control-page__action" onClick={() => showDetail(item)}>View destination</button></td></tr>)}</tbody></table></div></section>}
      <p className="sky-control-page__wallet-empty">Admin-linked application activity does not prove wallet ownership or control.</p>
    </> : null}
    {state.detail ? <DiscoveryDetail detailState={state.detail} onClose={() => setState((current) => ({ ...current, detail: null }))} onOpenInvestigation={onOpenInvestigation} /> : null}
  </section>;
}

function DiscoveryDetail({ detailState, onClose, onOpenInvestigation }) {
  const item = detailState.item;
  const detail = detailState.data || {};
  if (detailState.status === 'loading') return <aside className="sky-control-page__drawer" aria-label="Destination details"><button type="button" aria-label="Close destination details" onClick={onClose}>Close</button><p>Loading destination details...</p></aside>;
  if (detailState.status === 'error') return <aside className="sky-control-page__drawer" aria-label="Destination details"><button type="button" aria-label="Close destination details" onClick={onClose}>Close</button><p role="alert">{detailState.error}</p></aside>;
  const history = detail.destination_history || [];
  const references = detail.transaction_references || [];
  return <aside className="sky-control-page__drawer" aria-label="Destination details"><div><span className="sky-control-page__eyebrow">READ-ONLY DESTINATION</span><button type="button" aria-label="Close destination details" onClick={onClose}>Close</button></div><h3>{compactIdentifier(detail.destination?.address || item.address)}</h3><p>Chain: {safeDisplay(detail.destination?.chain || item.chain)}</p><button type="button" className="sky-control-page__action" onClick={() => onOpenInvestigation({ ...item, address: detail.destination?.address || item.address, chain: detail.destination?.chain || item.chain })}>Open Investigation</button><DetailList title="Application Observations" entries={(detail.application_observations || []).map((entry, index) => [`Observation ${index + 1}`, `${entry.kind || '-'} · ${entry.system || '-'} · ${timeLabel(entry.timestamp)}`])} /><DetailList title="Payment Links" entries={(detail.payment_links || []).map((entry, index) => [`Payment ${index + 1}`, `${entry.system || '-'} · ${entry.order_id || '-'} · ${entry.payment_reference || entry.transaction_id || '-'}`])} /><DetailList title="Order Links" entries={(detail.order_links || []).map((entry, index) => [`Order ${index + 1}`, `${entry.system || '-'} · ${entry.order_id || '-'}`])} /><DetailList title="Admin-linked Activity" entries={(detail.admin_links || []).map((entry, index) => [`Activity ${index + 1}`, `${entry.system || '-'} · ${entry.action || '-'} · ${timeLabel(entry.timestamp)}`])} /><DetailList title="Destination History" entries={history.map((entry, index) => [`History ${index + 1}`, `Previous: ${compactIdentifier(entry.previous_address)} | Current: ${compactIdentifier(entry.address)} | Next: ${compactIdentifier(entry.next_address)} | Reuse: ${safeDisplay(entry.reuse_count)}`])} /><DetailList title="Transaction References" entries={references.map((entry, index) => [`Reference ${index + 1}`, `${entry.classification || entry.transaction_classification || '-'} · ${compactIdentifier(entry.value || entry.transaction_id || entry.reference)}`])} /><DetailList title="Confirmed Receipts" entries={(detail.confirmed_receipts || []).map((entry, index) => [`Receipt ${index + 1}`, `${compactIdentifier(entry.tx_hash)} · ${entry.chain || '-'} · ${entry.asset || 'native'} · ${safeDisplay(entry.amount)}`])} /><DetailList title="Amount Summary" entries={Object.entries(detail.amount_summary || {}).map(([key, value]) => [key.replaceAll('_', ' '), typeof value === 'object' ? JSON.stringify(value) : value])} /><DetailList title="Money Flow Summary" entries={Object.entries(detail.money_flow_summary || {}).map(([key, value]) => [key.replaceAll('_', ' '), typeof value === 'object' ? JSON.stringify(value) : value])} /><DetailList title="Known Service Hits" entries={(detail.service_labels || []).map((entry, index) => [`Service ${index + 1}`, `${entry.label || '-'} · ${entry.category || '-'}`])} /><StatusList title="Provider Status" items={detail.provider_status} empty="Provider status unavailable." /><StatusList title="Source Status" items={detail.source_status} empty="Source status unavailable." /><section className="sky-control-page__wallet-limitations"><h3>Limitations</h3><ul>{(detail.limitations || []).map((entry) => <li key={entry}>{safeDisplay(entry)}</li>)}</ul></section><ForensicProvenance items={detail.provenance} /></aside>;
}

function WalletIntelligenceWorkspace() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ status: "idle", candidates: [], seed: null, caseData: null, wallet: null, transaction: null, flow: null, history: null, anomalies: null, error: null });
  const submit = async (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return setState((current) => ({ ...current, status: "error", error: "Enter an exact identifier." }));
    setState({ status: "searching", candidates: [], seed: null, caseData: null, wallet: null, transaction: null, flow: null, history: null, anomalies: null, error: null });
    try {
      const [cases, wallets] = await Promise.all([searchSkyControlPaymentCases(value), searchSkyControlWallets(value)]);
      const candidates = [...(cases.candidates || []), ...(wallets.candidates || [])].filter((candidate, index, all) => all.findIndex((item) => `${item.entity_type}:${item.entity_id}:${item.chain || ""}` === `${candidate.entity_type}:${candidate.entity_id}:${candidate.chain || ""}`) === index);
      setState({ status: "searched", candidates, seed: null, caseData: null, wallet: null, transaction: null, flow: null, history: null, anomalies: null, error: null });
    } catch (error) { setState({ status: "error", candidates: [], seed: null, caseData: null, wallet: null, transaction: null, flow: null, history: null, anomalies: null, error: walletErrorMessage(error) }); }
  };
  const selectSeed = async (seed) => {
    setState((current) => ({ ...current, status: "loading", seed, caseData: null, wallet: null, transaction: null, flow: null, history: null, anomalies: null, error: null }));
    try {
      const caseData = await fetchSkyControlPaymentCase(seed.entity_type, seed.entity_id).catch(() => null);
      const address = seed.entity_type === "WALLET" ? (seed.address || seed.entity_id) : null;
      const chain = seed.chain || "bsc";
      const [wallet, transaction, flow, history, anomalies] = await Promise.all([
        address ? Promise.resolve(fetchSkyControlWallet(chain, address)).catch(() => null) : null,
        seed.entity_type === "TRANSACTION" ? Promise.resolve(fetchSkyControlTransaction(chain, seed.entity_id)).catch(() => null) : null,
        address ? Promise.resolve(fetchSkyControlMoneyFlow({ chain, address, depth: 2, direction: "BOTH" })).catch(() => null) : null,
        Promise.resolve(fetchSkyControlWalletHistory()).catch(() => null), Promise.resolve(fetchSkyControlWalletAnomalies()).catch(() => null),
      ]);
      if (!caseData && !wallet && !transaction) throw new Error("case unavailable");
      setState((current) => ({ ...current, status: "ready", caseData, wallet, transaction, flow, history, anomalies, error: null }));
    } catch (error) { setState((current) => ({ ...current, status: "error", caseData: null, wallet: null, transaction: null, flow: null, history: null, anomalies: null, error: walletErrorMessage(error) })); }
  };
  const summary = state.caseData?.summary || state.wallet || {};
  const metrics = [["Seed", state.seed?.label || state.seed?.entity_id], ["Chains", state.seed?.chain || summary.chain], ["Wallet Count", summary.wallet_count], ["Transaction Count", summary.transaction_count], ["Payment Count", summary.payment_count], ["Order Count", summary.order_count], ["User Count", summary.user_count], ["Admin Activity Count", summary.admin_activity_count], ["Counterparty Count", summary.counterparty_count], ["Service Label Count", summary.service_label_count], ["Graph Nodes", summary.graph_nodes], ["Graph Edges", summary.graph_edges], ["First Event", summary.first_event], ["Last Event", summary.last_event], ["Known Service Hits", summary.known_service_hits], ["Anomaly Count", summary.anomaly_count], ["Depth", summary.depth], ["Read Only", summary.read_only ?? state.caseData?.read_only]];
  const openDiscovery = (destination) => {
    setQuery(destination.address);
    selectSeed({ entity_type: "WALLET", entity_id: destination.address, address: destination.address, chain: destination.chain, label: destination.address });
  };
  return <div className="sky-control-page__wallet-workspace">
    <div className="sky-control-page__workspace-head"><div><span className="sky-control-page__eyebrow">READ-ONLY CASE WORKSPACE</span><h2>Wallet Intelligence</h2></div></div>
    <WalletDiscovery onOpenInvestigation={openDiscovery} />
    <form className="sky-control-page__wallet-search" onSubmit={submit}><label htmlFor="wallet-intelligence-search">Exact identifier</label><div><input id="wallet-intelligence-search" aria-label="Wallet Intelligence search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Wallet, transaction, payment reference, order, payment, user, or admin ID" /><button type="submit">Search</button></div></form>
    {state.status === "idle" ? <div className="sky-control-page__empty"><FileSearch size={19} aria-hidden /><p>Search an exact wallet, transaction hash, payment reference, order, payment, user, or admin identifier.</p></div> : null}
    {state.error ? <p className="sky-control-page__notice" role="alert">{state.error}</p> : null}
    {state.status === "searched" ? <section className="sky-control-page__wallet-candidates" aria-label="Wallet Intelligence candidates"><h3>Exact candidates</h3>{state.candidates.length ? <div>{state.candidates.map((candidate) => <button type="button" key={`${candidate.entity_type}:${candidate.entity_id}:${candidate.chain || ""}`} onClick={() => selectSeed(candidate)}><strong>{safeDisplay(candidate.entity_type)}</strong><span>{safeDisplay(candidate.label || candidate.entity_id)}</span><small>{[candidate.system, candidate.chain].filter(Boolean).join(" · ") || "Application reference"}</small></button>)}</div> : <p>No exact candidates found.</p>}</section> : null}
    {state.status === "loading" ? <div className="sky-control-page__empty"><p>Loading selected read-only case...</p></div> : null}
    {state.status === "ready" ? <><section className="sky-control-page__wallet-summary" aria-label="Wallet case summary"><h3>Case summary</h3><div>{metrics.map(([label, value]) => <article key={label}><span>{label}</span><strong>{safeDisplay(value)}</strong></article>)}</div></section><WalletDetailViews seed={state.seed} wallet={state.wallet} transaction={state.transaction} flow={state.flow} history={state.history} anomalies={state.anomalies} caseData={state.caseData} /><div className="sky-control-page__wallet-status-grid"><StatusList title="Provider status" items={state.wallet?.provider_status || state.transaction?.provider_status || state.caseData?.provider_status} empty="Provider status unavailable for this selected seed." /><StatusList title="Application source status" items={state.caseData?.source_status || state.wallet?.source_status || state.transaction?.source_status} empty="Application source status unavailable for this selected seed." /></div><section className="sky-control-page__wallet-limitations" aria-label="Wallet Intelligence limitations"><h3>Limitations</h3><ul>{(state.caseData?.limitations || state.wallet?.limitations || ["Missing activity is not proof of no activity."]).map((item) => <li key={item}>{safeDisplay(item)}</li>)}</ul></section><section className="sky-control-page__legend" aria-label="Wallet evidence legend"><h3>Evidence semantics</h3><div>{walletEvidenceLegend.map(([type, explanation]) => <p key={type}><strong>{type}</strong><span>{explanation}</span></p>)}</div></section></> : null}
  </div>;
}

const compactIdentifier = (value) => {
  const text = safeDisplay(value);
  return text.length > 18 ? `${text.slice(0, 10)}...${text.slice(-6)}` : text;
};

function DetailList({ title, entries, empty = "No data available." }) {
  return <section className="sky-control-page__wallet-detail" aria-label={title}><h3>{title}</h3>{entries?.length ? <div>{entries.map(([label, value]) => <p key={label}><span>{label}</span><strong>{safeDisplay(value)}</strong></p>)}</div> : <p className="sky-control-page__wallet-empty">{empty}</p>}</section>;
}

const walletTimelineLabels = {
  ORDER_CREATED: "Order created", PAYMENT_REFERENCE_RECORDED: "Payment reference recorded",
  WITHDRAW_DESTINATION_OBSERVED: "Withdrawal destination observed", WITHDRAW_DESTINATION_CHANGED: "Withdrawal destination changed",
  TRANSACTION_CONFIRMED: "Transaction confirmed", NATIVE_TRANSFER: "Native transfer", TOKEN_TRANSFER: "Token transfer",
  FORWARDING: "Forwarding", SERVICE_REACHED: "Known service reached",
};
const validTime = (value) => value && !Number.isNaN(new Date(value).getTime());
const timeLabel = (value) => validTime(value) ? new Date(value).toLocaleString() : "-";

function CaseTimeline({ events }) {
  const [filters, setFilters] = useState({ event_type: "", system: "", chain: "", evidence_type: "" });
  const validEvents = (events || []).filter((event) => validTime(event.timestamp));
  const filtered = validEvents.filter((event) => Object.entries(filters).every(([key, value]) => !value || String(event[key] || "").toUpperCase() === value));
  const options = (key) => [...new Set(validEvents.map((event) => event[key]).filter(Boolean))].sort();
  const copy = (value) => navigator.clipboard?.writeText(String(value));
  return <section className="sky-control-page__wallet-detail sky-control-page__timeline" aria-label="Case Timeline"><h3>Case Timeline</h3><p className="sky-control-page__wallet-empty">Timeline filters apply only to events already loaded for this selected case.</p>{validEvents.length ? <><div className="sky-control-page__timeline-filters">{[["event_type", "Event Type"], ["system", "System"], ["chain", "Chain"], ["evidence_type", "Evidence Type"]].map(([key, label]) => <label key={key}>{label}<select aria-label={`${label} filter`} value={filters[key]} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}><option value="">All</option>{options(key).map((value) => <option key={value} value={String(value).toUpperCase()}>{key === "event_type" ? walletTimelineLabels[value] || `Unknown event: ${value}` : value}</option>)}</select></label>)}</div><div className="sky-control-page__table-wrap"><table><thead><tr><th>Timestamp</th><th>Event</th><th>System / chain</th><th>Subjects</th><th>Asset / amount</th><th>Evidence</th><th>Provenance</th></tr></thead><tbody>{filtered.map((event, index) => { const window = event.metadata?.observed_change_window; const ids = [event.tx_hash, event.wallet_address, event.payment_reference, event.order_id].filter(Boolean); return <tr key={event.event_id || `${event.event_type}-${index}`}><td>{timeLabel(event.timestamp)}{(event.reason_codes || []).includes("CHANGE_TIME_NOT_EXACT") || window ? <small>Observed change window: {safeDisplay(window?.start)} - {safeDisplay(window?.end)}</small> : null}</td><td>{walletTimelineLabels[event.event_type] || `Unknown event: ${safeDisplay(event.event_type)}`}</td><td>{[event.system, event.chain].filter(Boolean).join(" · ") || "-"}</td><td>{[event.actor, event.subject, event.object].map(safeDisplay).filter((value) => value !== "-").join(" · ") || "-"}{ids.map((id) => <button key={id} type="button" aria-label={`Copy ${compactIdentifier(id)}`} onClick={() => copy(id)}>Copy</button>)}</td><td>{[event.asset, event.amount].filter(Boolean).join(" · ") || "-"}</td><td><strong>{safeDisplay(event.evidence_type)}</strong><small>{(event.reason_codes || []).join(", ") || "-"}</small></td><td>{(event.provenance || []).map((item) => [item.source_system, item.source_table, item.source_record_id].filter(Boolean).join(" · ")).filter(Boolean).join("; ") || "No source provenance available"}</td></tr>; })}</tbody></table></div>{!filtered.length ? <p className="sky-control-page__wallet-empty">No timeline events match the selected filters.</p> : null}</> : <div className="sky-control-page__empty"><p>No timestamped case events are available from current sources.</p><p>Missing timeline activity is not proof that no activity occurred.</p></div>}</section>;
}

const walletAnomalyRuleLabels = {
  PAYMENT_REFERENCE_WITHOUT_ONCHAIN_TX: "Payment reference without on-chain transaction",
  ONCHAIN_TX_WITHOUT_MATCHING_PAYMENT: "On-chain transaction without matching payment",
  SAME_TRANSACTION_MULTI_PAYMENT: "Same transaction referenced by multiple payments",
  SAME_PAYMENT_REFERENCE_MULTI_ORDER: "Same payment reference used by multiple orders",
  SAME_WITHDRAW_DESTINATION_MULTI_SYSTEM: "Withdrawal destination observed across systems",
  WITHDRAW_DESTINATION_CHANGED_BEFORE_PAYMENT: "Withdrawal destination changed before payment",
  PAYMENT_NEAR_DESTINATION_CHANGE: "Payment near withdrawal destination change",
  FIRST_RECEIPT_AFTER_DESTINATION_CHANGE: "First receipt after withdrawal destination change",
  RAPID_WITHDRAW_DESTINATION_ROTATION: "Rapid withdrawal destination rotation",
  RAPID_FORWARDING: "Rapid forwarding",
  FLOW_TO_KNOWN_EXCHANGE: "Flow to known exchange",
  FLOW_TO_KNOWN_DEX: "Flow to known DEX",
  FLOW_TO_KNOWN_BRIDGE: "Flow to known bridge",
};

const anomalyProvenance = (items) => (items || []).map((item) => [item.source_system, item.source_table, item.source_record_id].filter(Boolean).join(" · ")).filter(Boolean);
const anomalyEntities = (item) => [...new Set([...(item.entity_ids || []), ...(item.record_ids || []), ...(item.user_ids || []), ...(item.admin_ids || []), item.wallet_address, item.address, item.tx_hash, item.payment_reference, item.payment_id, item.order_id, item.user_id, item.admin_id, item.source_entity_id, item.target_entity_id].filter(Boolean))];
const anomalyTimestamps = (item) => {
  const values = Array.isArray(item.timestamps) ? item.timestamps : Object.values(item.timestamps || {});
  return [...new Set([...values, item.timestamp, item.payment_timestamp, item.receipt_timestamp].filter(validTime))];
};
const safeMetadataEntries = (metadata) => Object.entries(metadata || {}).filter(([key, value]) => ["matched_value", "systems", "chain", "observed_change_window", "time_delta_seconds", "amount", "asset"].includes(key) && (typeof value === "string" || typeof value === "number" || Array.isArray(value))).map(([key, value]) => [key.replace(/_/g, " "), Array.isArray(value) ? value.filter((item) => typeof item === "string" || typeof item === "number").join(", ") : value]);

function WalletAnomalyDrawer({ anomaly, onClose }) {
  const entities = anomalyEntities(anomaly);
  const timestamps = anomalyTimestamps(anomaly);
  const provenance = anomalyProvenance(anomaly.provenance);
  return <aside className="sky-control-page__schema sky-control-page__wallet-anomaly-drawer" aria-label="Anomaly Detail"><button type="button" aria-label="Close anomaly detail" onClick={onClose}>Close</button><h3>Anomaly Detail</h3><p>Rule: {walletAnomalyRuleLabels[anomaly.rule_id] || safeDisplay(anomaly.rule_id)}</p><p>Severity: {safeDisplay(anomaly.severity)}</p><p>Title: {safeDisplay(anomaly.title)}</p><p>Reason: {safeDisplay(anomaly.reason)}</p><p>Evidence Type: {safeDisplay(anomaly.evidence_type)}</p><p>Reason Codes: {(anomaly.reason_codes || []).join(", ") || "-"}</p><p>Entities: {entities.map(compactIdentifier).join(" · ") || "-"}</p><p>Timestamps: {timestamps.map(timeLabel).join(" · ") || "-"}</p><p>Provenance: {provenance.join("; ") || "No source provenance available"}</p><h4>Safe Metadata</h4>{safeMetadataEntries(anomaly.metadata).length ? safeMetadataEntries(anomaly.metadata).map(([key, value]) => <p key={key}>{key}: {safeDisplay(value)}</p>) : <p>No safe metadata available</p>}</aside>;
}

function WalletAnomalies({ anomalies }) {
  const [filters, setFilters] = useState({ severity: "", rule_id: "", evidence_type: "" });
  const [selected, setSelected] = useState(null);
  const items = Array.isArray(anomalies) ? anomalies : [];
  const filtered = items.filter((item) => Object.entries(filters).every(([key, value]) => !value || String(item[key] || "").toUpperCase() === value));
  const options = (key) => [...new Set(items.map((item) => item[key]).filter(Boolean))].sort();
  const copy = (value) => navigator.clipboard?.writeText(String(value));
  return <section className="sky-control-page__wallet-detail sky-control-page__wallet-anomalies" aria-label="Wallet Intelligence Anomalies"><h3>Anomalies</h3><p className="sky-control-page__wallet-empty">Anomaly signals indicate unusual, repeated, temporal, or cross-system application/blockchain patterns. They are not findings of ownership, fraud, wrongdoing, or identity.</p>{items.length ? <><div className="sky-control-page__timeline-filters">{[["severity", "Severity"], ["rule_id", "Rule"], ["evidence_type", "Evidence Type"]].map(([key, label]) => <label key={key}>{label}<select aria-label={`Anomaly ${label.toLowerCase()} filter`} value={filters[key]} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}><option value="">All</option>{options(key).map((value) => <option key={value} value={String(value).toUpperCase()}>{key === "rule_id" ? walletAnomalyRuleLabels[value] || value : value}</option>)}</select></label>)}</div><div className="sky-control-page__table-wrap"><table><thead><tr><th>Severity</th><th>Rule</th><th>Signal</th><th>Evidence</th><th>Entities</th><th>Provenance</th><th>Action</th></tr></thead><tbody>{filtered.map((item, index) => { const entities = anomalyEntities(item); const provenance = anomalyProvenance(item.provenance); return <tr key={item.anomaly_id || `${item.rule_id}-${index}`}><td><strong>{safeDisplay(item.severity)}</strong></td><td>{walletAnomalyRuleLabels[item.rule_id] || safeDisplay(item.rule_id)}</td><td><strong>{safeDisplay(item.title)}</strong><small>{safeDisplay(item.reason)}</small></td><td>{safeDisplay(item.evidence_type)}<small>{(item.reason_codes || []).join(", ") || "-"}</small></td><td>{entities.length ? entities.map((id) => <button key={id} type="button" aria-label={`Copy ${compactIdentifier(id)}`} onClick={() => copy(id)}>{compactIdentifier(id)}</button>) : "-"}</td><td>{provenance.join("; ") || "No source provenance available"}</td><td><button type="button" onClick={() => setSelected(item)}>Why flagged</button></td></tr>; })}</tbody></table></div>{!filtered.length ? <p className="sky-control-page__wallet-empty">No anomaly signals match the selected filters.</p> : null}</> : <div className="sky-control-page__empty"><p>No anomaly signals are available from the current case data.</p><p>Absence of anomaly signals is not proof that no unusual activity occurred.</p></div>}{selected ? <WalletAnomalyDrawer anomaly={selected} onClose={() => setSelected(null)} /> : null}</section>;
}

const evidenceTypes = ["DIRECT", "DERIVED", "CORRELATED", "UNPROVEN"];
const evidenceProvenance = (items) => anomalyProvenance(Array.isArray(items) ? items : items ? [items] : []);
const evidenceIdentifier = (item) => [item.evidence_type, item.relationship_type || item.rule_id || item.event_type || item.claim, item.tx_hash, item.wallet_address || item.address, item.payment_reference, item.payment_id, item.order_id, item.source_entity_id, item.target_entity_id].filter(Boolean).join("|");
const toEvidenceItem = (item, source, claim) => item?.evidence_type ? { ...item, source, claim: item.title || item.relationship_type || item.rule_id || item.event_type || claim, evidence_id: evidenceIdentifier(item), provenance: item.provenance || item.metadata?.provenance || [] } : null;
function walletEvidenceItems({ wallet, transaction, flow, caseData, anomalies }) {
  const raw = [
    ...(caseData?.evidence || []).map((item) => toEvidenceItem(item, "Selected case", "Case evidence")),
    ...(caseData?.timeline || caseData?.events || []).map((item) => toEvidenceItem(item, "Case timeline", "Timeline event")),
    ...(anomalies?.anomalies || caseData?.anomalies || []).map((item) => toEvidenceItem(item, "Case anomaly", "Anomaly signal")),
    ...(flow?.edges || []).map((item) => toEvidenceItem(item, "Money flow", "Bounded flow relationship")),
    ...(flow?.paths || []).map((item) => toEvidenceItem(item, "Transaction path", "Bounded transaction path")),
    ...(wallet?.service_labels || []).map((item) => toEvidenceItem(item, "Service label", item.label || "Service label")),
    ...(transaction ? [toEvidenceItem(transaction, "Transaction profile", "Transaction record")] : []),
  ].filter(Boolean);
  const merged = new Map();
  raw.forEach((item) => { const current = merged.get(item.evidence_id); merged.set(item.evidence_id, current ? { ...current, provenance: [...current.provenance, ...item.provenance] } : item); });
  return [...merged.values()].map((item) => ({ ...item, provenance: [...new Map((item.provenance || []).map((value) => [JSON.stringify(value), value])).values()] })).sort((a, b) => String(a.evidence_type).localeCompare(String(b.evidence_type)) || String(a.claim).localeCompare(String(b.claim)) || String(a.evidence_id).localeCompare(String(b.evidence_id)));
}
function EvidenceDrawer({ item, onClose }) {
  const identifiers = anomalyEntities(item);
  const timestamps = anomalyTimestamps(item);
  const provenance = evidenceProvenance(item.provenance);
  return <aside className="sky-control-page__schema sky-control-page__wallet-evidence-drawer" aria-label="Evidence Detail"><button type="button" aria-label="Close evidence detail" onClick={onClose}>Close</button><h3>Evidence Detail</h3><p>Evidence Type: {safeDisplay(item.evidence_type)}</p><p>Claim / Relationship: {safeDisplay(item.claim)}</p><p>Source: {safeDisplay(item.source)}</p><p>System: {safeDisplay(item.system)}</p><p>Chain: {safeDisplay(item.chain)}</p><p>Timestamps: {timestamps.map(timeLabel).join(" · ") || "-"}</p><p>Reason Codes: {(item.reason_codes || []).join(", ") || "-"}</p><p>Identifiers: {identifiers.map(compactIdentifier).join(" · ") || "-"}</p><p>Provenance: {provenance.join("; ") || "No source provenance available"}</p><h4>Safe Metadata</h4>{safeMetadataEntries(item.metadata).length ? safeMetadataEntries(item.metadata).map(([key, value]) => <p key={key}>{key}: {safeDisplay(value)}</p>) : <p>No safe metadata available</p>}</aside>;
}
function WalletEvidence({ wallet, transaction, flow, caseData, anomalies }) {
  const [type, setType] = useState("");
  const [selected, setSelected] = useState(null);
  const items = walletEvidenceItems({ wallet, transaction, flow, caseData, anomalies });
  const filtered = items.filter((item) => !type || item.evidence_type === type);
  const counts = evidenceTypes.reduce((all, evidenceType) => ({ ...all, [evidenceType]: items.filter((item) => item.evidence_type === evidenceType).length }), {});
  const copy = (value) => navigator.clipboard?.writeText(String(value));
  return <section className="sky-control-page__wallet-detail sky-control-page__wallet-evidence" aria-label="Wallet Intelligence Evidence"><h3>Evidence</h3><p className="sky-control-page__wallet-empty">Evidence records are displayed from the currently loaded case sources only.</p><div className="sky-control-page__evidence-counts">{evidenceTypes.map((evidenceType) => <span key={evidenceType}>{evidenceType}: <strong>{counts[evidenceType]}</strong></span>)}</div><label className="sky-control-page__evidence-filter">Evidence Type<select aria-label="Wallet evidence type filter" value={type} onChange={(event) => setType(event.target.value)}><option value="">ALL</option>{evidenceTypes.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>{items.some((item) => item.evidence_type === "UNPROVEN") ? <p className="sky-control-page__notice">Unproven items are hypotheses or unresolved associations and must not be treated as established identity, ownership, or control.</p> : null}{items.length ? <div className="sky-control-page__table-wrap"><table><thead><tr><th>Evidence Type</th><th>Claim / Relationship</th><th>Source</th><th>System / Chain</th><th>Identifiers</th><th>Provenance</th><th>Action</th></tr></thead><tbody>{filtered.map((item) => { const identifiers = anomalyEntities(item); const provenance = evidenceProvenance(item.provenance); const linkageWarning = ["ADMIN_ACTIVITY_LINKED_TO_PAYMENT_FLOW", "USER_PAYMENT_FLOW_LINK"].includes(item.rule_id || item.relationship_type); return <tr key={item.evidence_id}><td><strong>{item.evidence_type}</strong></td><td><strong>{safeDisplay(item.claim)}</strong>{item.reason_codes?.length ? <small>{item.reason_codes.join(", ")}</small> : null}{linkageWarning ? <small>This application linkage does not prove wallet ownership or control.</small> : null}</td><td>{safeDisplay(item.source)}</td><td>{[item.system, item.chain].filter(Boolean).join(" · ") || "-"}</td><td>{identifiers.length ? identifiers.map((id) => <button key={id} type="button" aria-label={`Copy ${compactIdentifier(id)}`} onClick={() => copy(id)}>{compactIdentifier(id)}</button>) : "-"}</td><td>{provenance.length ? provenance.join("; ") : "No source provenance available"}</td><td><button type="button" onClick={() => setSelected(item)}>View evidence</button></td></tr>; })}</tbody></table></div> : <div className="sky-control-page__empty"><p>No case evidence is available from the currently loaded sources.</p><p>Missing evidence is not proof that an activity or relationship did not occur.</p></div>}{items.length && !filtered.length ? <p className="sky-control-page__wallet-empty">No evidence records match the selected type.</p> : null}{selected ? <EvidenceDrawer item={selected} onClose={() => setSelected(null)} /> : null}</section>;
}

function safeExportFilenamePart(value, fallback) {
  const safe = String(value || "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  if (!safe) return fallback;
  return safe.length > 20 ? `${safe.slice(0, 10)}-${safe.slice(-6)}` : safe;
}

const validIntegrityHash = (value) =>
  /^sha256:[a-f0-9]{64}$/.test(String(value || "")) ? String(value) : null;

function downloadForensicExport(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function WalletExport({ seed }) {
  const [state, setState] = useState({ loading: "", integrityHash: null, error: null });
  const shortSeed = safeExportFilenamePart(seed?.entity_id, "record");
  const type = safeExportFilenamePart(seed?.entity_type, "case").toLowerCase();
  const exports = [
    ["json", "", "Export Case JSON", `sky-wallet-case-${type}-${shortSeed}.json`],
    ["csv", "transactions", "Export Transactions CSV", `sky-wallet-transactions-${shortSeed}.csv`],
    ["csv", "money_flow", "Export Money Flow CSV", `sky-wallet-money-flow-${shortSeed}.csv`],
    ["csv", "wallet_history", "Export Wallet History CSV", `sky-wallet-history-${shortSeed}.csv`],
    ["csv", "counterparties", "Export Counterparties CSV", `sky-wallet-counterparties-${shortSeed}.csv`],
  ];
  const run = async (format, csvType, label, filename) => {
    const action = csvType || format;
    setState({ loading: action, integrityHash: null, error: null });
    try {
      const params = buildSkyControlWalletExportParams(seed, csvType);
      const result = await fetchSkyControlWalletExport(format, params);
      downloadForensicExport(result.blob, filename);
      setState({ loading: "", integrityHash: format === "json" ? validIntegrityHash(result.integrityHash) : null, error: null });
    } catch (error) {
      const message = error.code === "wallet_case_chain_required" ? "Selected case is missing required chain information." : error.code === "wallet_case_seed_required" ? "Selected case is not available for export." : error.status === 401 || error.status === 403 ? "Not authorized for this export." : error.status === 400 ? "Requested export is not available." : error.status === 404 ? "Selected case export was not found." : "Export is currently unavailable. Please try again.";
      setState({ loading: "", integrityHash: null, error: message });
    }
  };
  return <section className="sky-control-page__wallet-detail sky-control-page__wallet-export" aria-label="Wallet Intelligence Export"><h3>Export</h3><p className="sky-control-page__wallet-empty">Downloads are produced directly by the read-only backend export contract.</p><p className="sky-control-page__wallet-empty">Hash verifies exported bundle content, not source database or blockchain immutability.</p><div className="sky-control-page__wallet-export-actions">{exports.map(([format, csvType, label, filename]) => <button key={label} type="button" aria-label={label} disabled={Boolean(state.loading)} onClick={() => run(format, csvType, label, filename)}>{state.loading === (csvType || format) ? "Preparing..." : label}</button>)}</div>{state.loading ? <p role="status">Preparing export...</p> : null}{state.error ? <p role="alert">{state.error}</p> : null}{state.integrityHash ? <div className="sky-control-page__wallet-export-hash"><strong>Export integrity hash</strong><code>{state.integrityHash}</code><button type="button" aria-label="Copy export integrity hash" onClick={() => navigator.clipboard?.writeText(state.integrityHash)}>Copy</button></div> : null}</section>;
}

function WalletDetailViews({ seed, wallet, transaction, flow, history, anomalies, caseData }) {
  const copy = (value) => navigator.clipboard?.writeText(String(value));
  const profile = wallet && [["Address", wallet.address], ["Chain", wallet.chain], ["Application First Seen", wallet.first_seen_application], ["Application Last Seen", wallet.last_seen_application], ["Chain First Seen", wallet.first_seen_chain], ["Chain Last Seen", wallet.last_seen_chain], ["Native Balance", wallet.native_balance], ["Transaction Count", wallet.transaction_count], ["Total Native Received", wallet.total_native_received], ["Total Native Sent", wallet.total_native_sent], ["Application Systems", wallet.application_systems?.join(", ")], ["Linked Orders", wallet.linked_orders?.length], ["Linked Payments", wallet.linked_payments?.length], ["Linked Users", wallet.linked_users?.length], ["Linked Admin Activity", wallet.linked_admin_actions?.length], ["Service Labels", wallet.service_labels?.length]];
  const tx = transaction && [["Transaction Hash", transaction.tx_hash], ["Chain", transaction.chain], ["Verification", transaction.verification_status], ["Block", transaction.block_number], ["Timestamp", transaction.timestamp], ["From", transaction.from], ["To", transaction.to], ["Native Value", transaction.native_value], ["Token Transfers", transaction.token_transfers?.length], ["Status", transaction.status], ["Gas Used", transaction.gas_used], ["Application Payment Links", transaction.application_payment_links?.length], ["Application Order Links", transaction.application_order_links?.length]];
  const edges = flow?.edges || [];
  const counterparties = flow?.counterparties || wallet?.top_counterparties || {};
  return <div className="sky-control-page__wallet-views">
    {profile ? <section className="sky-control-page__wallet-detail" aria-label="Wallet Profile"><div className="sky-control-page__card-title"><h3>Wallet Profile</h3><button type="button" onClick={() => copy(wallet.address)}>Copy address</button></div><p className="sky-control-page__address"><span>{compactIdentifier(wallet.address)}</span><strong>{safeDisplay(wallet.chain)}</strong></p><div>{profile.map(([label, value]) => <p key={label}><span>{label}</span><strong>{safeDisplay(value)}</strong></p>)}</div><p className="sky-control-page__wallet-empty">Application links are evidence links and do not establish wallet ownership.</p></section> : null}
    {tx ? <DetailList title="Transaction Profile" entries={tx} empty="No transaction profile available." /> : null}
    {flow ? <section className="sky-control-page__wallet-detail" aria-label="Money Flow"><h3>Money Flow</h3><p className="sky-control-page__wallet-empty">Directional flow is bounded for safety and performance.</p><div className="sky-control-page__flow-bounds"><span>Depth requested: {safeDisplay(flow.depth_requested || flow.requested_depth)}</span><span>Depth reached: {safeDisplay(flow.depth_reached)}</span><span>Nodes: {safeDisplay(flow.nodes?.length)}</span><span>Edges: {safeDisplay(edges.length)}</span></div>{flow.truncated ? <p className="sky-control-page__notice">Partial money-flow graph - bounded for safety/performance.</p> : null}<div className="sky-control-page__flow-graph">{edges.length ? edges.map((edge, index) => <button key={`${edge.tx_hash || index}-${edge.from}-${edge.to}`} type="button"><strong>WALLET</strong><span>{compactIdentifier(edge.from)}</span><b>→</b><strong>{edge.service_label ? "SERVICE" : "WALLET"}</strong><span>{compactIdentifier(edge.to)}</span><small>{[edge.amount, edge.asset, edge.timestamp, edge.hop, edge.direction, edge.evidence_type].filter((value) => value != null).join(" · ")}</small></button>) : <p>No bounded money-flow records are available.</p>}</div></section> : null}
    <CaseTimeline events={caseData?.timeline || caseData?.events || []} />
    <WalletEvidence wallet={wallet} transaction={transaction} flow={flow} caseData={caseData} anomalies={anomalies} />
    {seed ? <WalletExport key={`${seed.entity_type}:${seed.entity_id}`} seed={seed} /> : null}
    <DetailList title="Transaction Paths" entries={(flow?.paths || []).map((path, index) => [`Path ${index + 1}`, `${safeDisplay(path.hop_count)} hops · ${safeDisplay(path.assets?.join(", "))}`])} empty="No bounded transaction paths are available." />
    <section className="sky-control-page__wallet-detail" aria-label="Counterparty Intelligence"><h3>Counterparty Intelligence</h3><div className="sky-control-page__counterparty-grid">{[["Top Incoming", counterparties.top_incoming], ["Top Outgoing", counterparties.top_outgoing], ["Recurring Counterparties", counterparties.recurring_counterparties]].map(([title, list]) => <article key={title}><h4>{title}</h4>{list?.length ? list.map((item) => <p key={item.address}><strong>{compactIdentifier(item.address)}</strong><span>{[item.chain, item.direction, `${item.tx_count} tx`].filter(Boolean).join(" · ")}</span></p>) : <p>No counterparty data.</p>}</article>)}</div></section>
    <DetailList title="Wallet Destination History" entries={(history?.items || []).map((item, index) => [`${item.system || "Application"} ${index + 1}`, `${compactIdentifier(item.address)} · ${safeDisplay(item.first_seen)} - ${safeDisplay(item.last_seen)} · observed change window: ${safeDisplay(item.observed_change_window?.start || item.previous_observed_at)} - ${safeDisplay(item.observed_change_window?.end || item.current_observed_at)}`])} empty="No wallet destination history is available." />
    <DetailList title="Application Links" entries={Object.entries(caseData?.case?.safe_metadata || {}).map(([key, value]) => [key.replace(/_/g, " "), value])} empty="No application-side links are available." />
    <WalletAnomalies anomalies={anomalies?.anomalies || caseData?.anomalies || []} />
  </div>;
}

function Pagination({ page, limit, itemCount, onPageChange, onLimitChange }) {
  return <div className="sky-control-page__pagination" aria-label="Table pagination"><button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>Previous</button><span>Page {page}</span><button type="button" onClick={() => onPageChange(page + 1)} disabled={itemCount < limit}>Next</button><label>Rows per page<select value={limit} onChange={(event) => onLimitChange(Number(event.target.value))}><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label></div>;
}

function RecordDrawer({ view, record, onClose }) {
  const fields = Object.entries(record).filter(([key, value]) => !SENSITIVE_FIELD.test(key) && typeof value !== 'object' && value !== null);
  return <aside className="sky-control-page__drawer" aria-label={`${view} record details`}><div><span className="sky-control-page__eyebrow">READ-ONLY DETAILS</span><button type="button" onClick={onClose}>Close</button></div><h3>{view === 'bot-fleet' ? 'Bot details' : view === 'users-subscriptions' ? 'User details' : 'Record details'}</h3><dl>{fields.map(([key, value]) => <React.Fragment key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{TIMESTAMP_FIELDS.has(key) ? formatTimestamp(value) : String(value)}</dd></React.Fragment>)}</dl></aside>;
}

function LegacyForensicsWorkspace() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ candidates: [], seed: null, graph: null, entity: null, timeline: [], anomalies: [], limitations: null, status: 'idle' });
  const select = async (candidate) => {
    setState({ candidates: [], seed: candidate, graph: null, entity: null, timeline: [], anomalies: [], limitations: null, status: 'loading' });
    try {
      const params = { seed_type: candidate.entity_type, seed_id: candidate.entity_id, limit: 25, offset: 0 };
      const [graph, entity, timeline, anomalies] = await Promise.all([fetchSkyControlForensicGraph(params), fetchSkyControlForensicEntity(candidate.entity_type, candidate.entity_id), fetchSkyControlForensicTimeline(params), fetchSkyControlForensicAnomalies(params)]);
      setState({ candidates: [], seed: candidate, graph, entity, timeline: timeline.events || [], anomalies: anomalies.anomalies || [], limitations: graph.limitations || timeline.limitations || anomalies.limitations || {}, status: 'ready' });
    } catch { setState((current) => ({ ...current, status: 'error' })); }
  };
  const submit = async (event) => { event.preventDefault(); const q = query.trim(); if (!q) return; setState((current) => ({ ...current, status: 'searching' })); try { const response = await searchSkyControlForensics(q); setState((current) => ({ ...current, candidates: response.candidates || [], status: 'idle' })); } catch { setState((current) => ({ ...current, status: 'error' })); } };
  const meta = state.graph?.metadata || {};
  return <div className="sky-control-page__workspace"><div className="sky-control-page__workspace-head"><div><span className="sky-control-page__eyebrow">READ-ONLY CASEWORK</span><h2>Forensics</h2><p>Search exact safe identifiers and inspect bounded evidence.</p></div><span className="sky-control-page__read-only">READ ONLY</span></div><form className="sky-control-page__filters" onSubmit={submit}><input aria-label="Forensic search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exact identifier" /><button type="submit">Search</button></form>{state.status === 'error' && <p className="sky-control-page__notice">Forensic provider unavailable.</p>}{state.candidates.map((candidate) => <button type="button" className="sky-control-page__action" key={`${candidate.entity_type}:${candidate.entity_id}`} onClick={() => select(candidate)}>{candidate.entity_type}: {candidate.label}</button>)}{state.graph && <><section className="sky-control-page__schema"><h3>Case graph</h3><p>Seed Entity: {state.graph.seed?.label || '-'} | Entity Count: {state.graph.case?.entity_count ?? state.graph.nodes?.length ?? 0} | Edge Count: {state.graph.case?.edge_count ?? state.graph.edges?.length ?? 0}</p><p>Earliest Event: {formatTimestamp(state.graph.case?.earliest_event)} | Latest Event: {formatTimestamp(state.graph.case?.latest_event)} | Read Only</p><p>Depth: {meta.depth_reached ?? '-'} / {meta.max_depth ?? 2} | Nodes: {state.graph.nodes?.length || 0} / {meta.max_nodes ?? 250} | Edges: {state.graph.edges?.length || 0} / {meta.max_edges ?? 500}</p>{(meta.truncated_nodes || meta.truncated_edges) && <p>Partial graph - bounded for safety/performance</p>}<p>DIRECT | DERIVED | CORRELATED | UNPROVEN</p></section><section className="sky-control-page__schema"><h3>Timeline</h3>{state.timeline.map((item) => <p key={item.event_id}>{formatTimestamp(item.timestamp)} | {item.event_type} | {item.evidence_type}</p>)}</section><section className="sky-control-page__schema"><h3>Anomalies</h3><p>Anomaly signals are not findings of fraud or wrongdoing.</p>{state.anomalies.map((item) => <p key={item.anomaly_id}>Severity: {item.severity} | Rule: {item.rule_id} | {item.title}</p>)}</section><section className="sky-control-page__schema"><h3>Evidence</h3><p>Evidence is limited to this selected case.</p></section><section className="sky-control-page__schema"><h3>Limitations</h3>{Object.entries({ broad_admin_actions_available: 'Broad admin-action history unavailable', broad_invoices_available: 'Broad invoice history unavailable', invoice_status_timeline_available: 'Invoice status timeline unavailable', invite_user_mismatch_rule_available: 'Invite mismatch rule unavailable' }).filter(([key]) => state.limitations?.[key] === false).map(([, text]) => <p key={text}>{text}</p>)}<p>Investigator prefill unavailable</p><p>The current Investigator route has no supported URL/query/state prefill contract, so Sky Control does not automatically transfer identifiers.</p></section></>}</div>;
}

const forensicValue = (value) => typeof value === 'string' || typeof value === 'number' ? String(value) : '-';
const forensicTime = (value) => formatTimestamp(value);
const timelineLabels = { ADMIN_ACTION: 'Admin action', ORDER_CREATED: 'Order created', ORDER_UPDATED: 'Order updated', PAYMENT_PROOF: 'Payment proof', SUBSCRIPTION_START: 'Subscription started', SUBSCRIPTION_END: 'Subscription ended', BOT_REGISTERED: 'Bot registered', BOT_STARTED: 'Bot started', BOT_CRASHED: 'Bot crashed', INVITE_CREATED: 'Invite created', INVITE_APPROVED: 'Invite approved', INVITE_REVOKED: 'Invite revoked', WITHDRAW_DESTINATION_UPDATED: 'Withdrawal destination updated' };
const forensicLabel = (value) => timelineLabels[value] || (typeof value === 'string' && value ? `Unknown event: ${value.replaceAll('_', ' ')}` : 'Unknown event');

function ForensicProvenance({ items }) {
  return <div><h4>Evidence sources</h4>{items?.length ? items.map((item, index) => <p key={`${item.source_table}-${item.source_record_id}-${index}`}>{item.source_system || '-'} · {item.source_table || '-'} · {item.source_record_id || '-'} · {forensicTime(item.event_time)}</p>) : <p>No source provenance available</p>}</div>;
}

function ForensicDrawer({ title, children, onClose, label }) {
  return <aside className="sky-control-page__drawer" aria-label={label}><div><span className="sky-control-page__eyebrow">READ-ONLY DETAILS</span><button type="button" aria-label={`Close ${label}`} onClick={onClose}>Close</button></div><h3>{title}</h3>{children}</aside>;
}

function ForensicsWorkspace() {
  const [query, setQuery] = useState('');
  const [caseState, setCaseState] = useState({ status: 'idle', candidates: [], seed: null, graph: null, entity: null, relationship: null, timeline: [], timelineError: null, anomalies: [], anomaliesError: null, limitations: {} });
  const [timelinePage, setTimelinePage] = useState({ offset: 0, hasPrevious: false, hasNext: false, filters: { system: '', event_type: '', evidence_type: '' } });
  const [anomalyPage, setAnomalyPage] = useState({ offset: 0, hasPrevious: false, hasNext: false, filters: { severity: '', rule_id: '', evidence_type: '' } });
  const [exportState, setExportState] = useState({ status: 'idle', integrityHash: null });
  const limit = 25;
  const loadTimeline = async (seed, offset = 0, filters = timelinePage.filters) => {
    try {
      const response = (await fetchSkyControlForensicTimeline({ seed_type: seed.entity_type, seed_id: seed.entity_id, limit, offset, ...filters })) || {};
      setCaseState((current) => ({ ...current, timeline: response.events || [], timelineError: null, limitations: { ...current.limitations, ...(response.limitations || {}) } }));
      setTimelinePage((current) => ({ ...current, offset, hasPrevious: Boolean(response.pagination?.has_previous), hasNext: Boolean(response.pagination?.has_next), filters, error: null }));
    } catch (error) {
      const timelineError = error?.status === 401 || error?.status === 403 ? 'Not authorized for Sky Control.' : 'Timeline unavailable from current source.';
      setCaseState((current) => ({ ...current, timeline: [], timelineError }));
      setTimelinePage((current) => ({ ...current, offset, hasPrevious: false, hasNext: false, filters, error: timelineError }));
    }
  };
  const loadAnomalies = async (seed, offset = 0, filters = anomalyPage.filters) => {
    try {
      const response = (await fetchSkyControlForensicAnomalies({ seed_type: seed.entity_type, seed_id: seed.entity_id, limit, offset, ...filters })) || {};
      setCaseState((current) => ({ ...current, anomalies: response.anomalies || response.items || [], anomaliesError: null, limitations: { ...current.limitations, ...(response.limitations || {}) } }));
      setAnomalyPage((current) => ({ ...current, offset, hasPrevious: Boolean(response.pagination?.has_previous), hasNext: Boolean(response.pagination?.has_next), filters, error: null }));
    } catch (error) {
      const anomaliesError = error?.status === 401 || error?.status === 403 ? 'Not authorized for Sky Control.' : 'Anomaly data unavailable from current source.';
      setCaseState((current) => ({ ...current, anomalies: [], anomaliesError }));
      setAnomalyPage((current) => ({ ...current, offset, hasPrevious: false, hasNext: false, filters, error: anomaliesError }));
    }
  };
  const submit = async (event) => { event.preventDefault(); const q = query.trim(); if (!q) { setCaseState({ status: 'empty', candidates: [], seed: null, graph: null, entity: null, relationship: null, timeline: [], timelineError: null, anomalies: [], anomaliesError: null, limitations: {} }); return; } setCaseState((current) => ({ ...current, status: 'searching', candidates: [] })); try { const response = await searchSkyControlForensics(q); setCaseState((current) => ({ ...current, status: response.count ? 'ready' : 'none', candidates: response.candidates || [] })); } catch (error) { setCaseState((current) => ({ ...current, status: error.status === 401 || error.status === 403 ? 'unauthorized' : 'error' })); } };
  const select = async (seed) => { setTimelinePage({ offset: 0, hasPrevious: false, hasNext: false, filters: { system: '', event_type: '', evidence_type: '' } }); setAnomalyPage({ offset: 0, hasPrevious: false, hasNext: false, filters: { severity: '', rule_id: '', evidence_type: '' } }); setCaseState({ status: 'loading', candidates: [], seed, graph: null, entity: null, relationship: null, timeline: [], timelineError: null, anomalies: [], anomaliesError: null, limitations: {} }); try { const [graph, entity] = await Promise.all([fetchSkyControlForensicGraph({ seed_type: seed.entity_type, seed_id: seed.entity_id }), fetchSkyControlForensicEntity(seed.entity_type, seed.entity_id)]); setCaseState((current) => ({ ...current, status: 'ready', graph, entity, limitations: graph.limitations || {} })); await Promise.all([loadTimeline(seed, 0, { system: '', event_type: '', evidence_type: '' }), loadAnomalies(seed, 0, { severity: '', rule_id: '', evidence_type: '' })]); } catch { setCaseState((current) => ({ ...current, status: 'error' })); } };
  const exportCase = async (format) => { if (!caseState.seed) return; setExportState({ status: 'loading', integrityHash: null }); try { const result = await fetchSkyControlForensicExport(format, { seed_type: caseState.seed.entity_type, seed_id: caseState.seed.entity_id }); const url = URL.createObjectURL(result.blob); const link = document.createElement('a'); link.href = url; link.download = `sky-control-forensics-${caseState.seed.entity_type}-${caseState.seed.entity_id}.${format === 'csv' ? 'csv' : 'json'}`; link.click(); URL.revokeObjectURL(url); setExportState({ status: 'success', integrityHash: /^sha256:[a-f0-9]{64}$/.test(result.integrityHash || '') ? result.integrityHash : null }); } catch { setExportState({ status: 'error', integrityHash: null }); } };
  const graph = caseState.graph;
  const metadata = graph?.metadata || {};
  const evidenceRows = [...(graph?.edges || []).map((item) => ({ label: item.relationship_type, type: item.evidence_type, timestamp: item.event_time, provenance: item.metadata?.provenance })), ...caseState.timeline.map((item) => ({ label: forensicLabel(item.event_type), type: item.evidence_type, timestamp: item.timestamp, provenance: [{ source_system: item.source_system, source_table: item.source_table, source_record_id: item.source_record_id }] })), ...caseState.anomalies.map((item) => ({ label: item.title || item.rule_id, type: item.evidence_type, timestamp: item.timestamp, provenance: item.provenance || item.metadata?.provenance }))];
  return <div className="sky-control-page__workspace sky-control-page__forensics"><div className="sky-control-page__workspace-head"><div><span className="sky-control-page__eyebrow">FORENSIC INVESTIGATION</span><h2>Forensics</h2><p>Search exact safe identifiers and inspect bounded evidence.</p></div><span className="sky-control-page__read-only">READ ONLY</span></div><form className="sky-control-page__filters" onSubmit={submit}><input aria-label="Forensic search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exact safe identifier"/><button type="submit" className="sky-control-page__action">Search</button></form>{caseState.status === 'empty' && <p className="sky-control-page__notice">Enter an identifier to start a read-only case.</p>}{caseState.status === 'searching' && <p>Searching safe forensic records...</p>}{caseState.status === 'none' && <p>No matching entity.</p>}{caseState.status === 'unauthorized' && <p>Not authorized for Sky Control.</p>}{caseState.status === 'error' && <p>Forensic provider unavailable.</p>}{caseState.candidates.map((candidate) => <button type="button" className="sky-control-page__action" key={`${candidate.entity_type}:${candidate.entity_id}`} onClick={() => select(candidate)}>{candidate.entity_type}: {candidate.label}</button>)}{graph && <><section className="sky-control-page__schema"><div className="sky-control-page__workspace-head"><div><h3>Case graph</h3><p>Seed Entity: {graph.seed?.label || '-'} | Entity Count: {graph.case?.entity_count ?? graph.nodes?.length ?? 0} | Edge Count: {graph.case?.edge_count ?? graph.edges?.length ?? 0}</p><p>Earliest Event: {forensicTime(graph.case?.earliest_event)} | Latest Event: {forensicTime(graph.case?.latest_event)} | Read Only</p><p>Bounded graph | Depth: {metadata.depth_reached ?? '-'} / {metadata.max_depth ?? '-'} | Nodes: {graph.nodes?.length || 0} / {metadata.max_nodes ?? '-'} | Edges: {graph.edges?.length || 0} / {metadata.max_edges ?? '-'}</p></div><div className="sky-control-page__panel-actions"><button type="button" className="sky-control-page__action" onClick={() => exportCase('json')}>Export JSON</button><button type="button" className="sky-control-page__action" onClick={() => exportCase('csv')}>Export Timeline CSV</button></div></div>{(metadata.truncated_nodes || metadata.truncated_edges) && <p className="sky-control-page__notice">Partial graph - bounded for safety/performance</p>}{exportState.status === 'success' && <p>Export ready for download.</p>}{exportState.integrityHash && <><strong>Export integrity hash</strong><code>{exportState.integrityHash}</code></>}<div className="sky-control-page__legend">{evidenceTypes.map((type) => <span key={type}>{type}</span>)}</div><CompactTable items={graph.edges || []} view="forensics" forensic onSelect={(relationship) => setCaseState((current) => ({ ...current, relationship }))}/></section><section className="sky-control-page__schema"><h3>Timeline</h3><div className="sky-control-page__filters"><select aria-label="System filter" value={timelinePage.filters.system} onChange={(e) => loadTimeline(caseState.seed, 0, { ...timelinePage.filters, system: e.target.value })}><option value="">All systems</option><option value="quick">Quick</option><option value="skycloud">SkyCloud</option></select><select aria-label="Event type filter" value={timelinePage.filters.event_type} onChange={(e) => loadTimeline(caseState.seed, 0, { ...timelinePage.filters, event_type: e.target.value })}><option value="">All event types</option>{Object.entries(timelineLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Evidence type filter" value={timelinePage.filters.evidence_type} onChange={(e) => loadTimeline(caseState.seed, 0, { ...timelinePage.filters, evidence_type: e.target.value })}><option value="">All evidence types</option>{evidenceTypes.map((type) => <option key={type}>{type}</option>)}</select></div>{caseState.timeline.length ? <CompactTable items={caseState.timeline.map((item) => ({ event_id: item.event_id, time: forensicTime(item.timestamp), event: forensicLabel(item.event_type), system: item.system || item.source_system, evidence: item.evidence_type, source: `${item.source_table || '-'} / ${item.source_record_id || '-'}` }))} view="timeline"/> : <p>No timeline events</p>}<ForensicPagination page={timelinePage} onPrevious={() => loadTimeline(caseState.seed, Math.max(0, timelinePage.offset - limit))} onNext={() => loadTimeline(caseState.seed, timelinePage.offset + limit)}/></section><section className="sky-control-page__schema"><h3>Anomalies</h3><p>Anomaly signals indicate unusual or inconsistent application patterns. They are not findings of fraud or wrongdoing.</p><div className="sky-control-page__filters"><select aria-label="Anomaly severity filter" value={anomalyPage.filters.severity} onChange={(e) => loadAnomalies(caseState.seed, 0, { ...anomalyPage.filters, severity: e.target.value })}><option value="">All severities</option>{['INFO', 'LOW', 'MEDIUM', 'HIGH'].map((type) => <option key={type}>{type}</option>)}</select><input aria-label="Anomaly rule filter" value={anomalyPage.filters.rule_id} onChange={(e) => loadAnomalies(caseState.seed, 0, { ...anomalyPage.filters, rule_id: e.target.value })}/></div>{caseState.anomalies.length ? caseState.anomalies.map((item, index) => <details key={item.anomaly_id || index}><summary>Severity: {forensicValue(item.severity)} | Rule: {forensicValue(item.rule_id)} | {forensicValue(item.title)}</summary><p>Reason: {forensicValue(item.reason)}</p><p>Evidence Type: {forensicValue(item.evidence_type)}</p><p>Reason codes: {Array.isArray(item.reason_codes) ? item.reason_codes.join(', ') : '-'}</p><ForensicProvenance items={item.provenance || item.metadata?.provenance}/></details>) : <p>No anomalies</p>}<ForensicPagination page={anomalyPage} onPrevious={() => loadAnomalies(caseState.seed, Math.max(0, anomalyPage.offset - limit))} onNext={() => loadAnomalies(caseState.seed, anomalyPage.offset + limit)}/></section><section className="sky-control-page__schema"><h3>Evidence</h3>{evidenceRows.length ? evidenceRows.map((item, index) => <article key={index}><p>Evidence Type: {forensicValue(item.type)}</p><p>Relationship / Event / Anomaly: {forensicValue(item.label)}</p><p>Timestamp: {forensicTime(item.timestamp)}</p><ForensicProvenance items={item.provenance}/></article>) : <p>No evidence records</p>}</section><section className="sky-control-page__schema"><h3>Limitations</h3><p>Unavailable means the current safe read-only source contract does not provide sufficient evidence. Missing evidence should not be interpreted as proof that no activity occurred.</p>{[['broad_admin_actions_available', 'Broad admin-action history unavailable'], ['broad_invoices_available', 'Broad invoice history unavailable'], ['invoice_status_timeline_available', 'Invoice status timeline unavailable'], ['invite_user_mismatch_rule_available', 'Invite mismatch rule unavailable']].filter(([key]) => caseState.limitations[key] === false).map(([, note]) => <p key={note}>{note}</p>)}<p>Investigator prefill unavailable</p><p>The current Investigator route has no supported URL, query, or state prefill contract, so Sky Control does not automatically transfer identifiers.</p></section>{caseState.entity && <ForensicDrawer label="Entity details" title={`${caseState.entity.entity?.type || caseState.entity.type || '-'}: ${caseState.entity.entity?.label || caseState.entity.label || '-'}`} onClose={() => setCaseState((current) => ({ ...current, entity: null }))}><p>System: {caseState.entity.entity?.system || caseState.entity.system || '-'}</p><p>First seen: {forensicTime(caseState.entity.entity?.first_seen || caseState.entity.first_seen)}</p><p>Last seen: {forensicTime(caseState.entity.entity?.last_seen || caseState.entity.last_seen)}</p><ForensicProvenance items={caseState.entity.provenance}/></ForensicDrawer>}{caseState.relationship && <ForensicDrawer label="Relationship details" title={caseState.relationship.relationship_type || '-'} onClose={() => setCaseState((current) => ({ ...current, relationship: null }))}><p>Evidence: {caseState.relationship.evidence_type || '-'}</p><p>Confidence: {Math.round((Number(caseState.relationship.confidence) || 0) * 100)}%</p><p>Event time: {forensicTime(caseState.relationship.event_time)}</p><p>Deterministic application-data confidence; not identity proof.</p><ForensicProvenance items={caseState.relationship.metadata?.provenance}/></ForensicDrawer>}</>}</div>;
}

function ForensicPagination({ page, onPrevious, onNext }) {
  const resource = Object.prototype.hasOwnProperty.call(page.filters || {}, 'system') ? 'timeline' : 'anomaly';
  return <div className="sky-control-page__pagination">{page.error ? <p className="sky-control-page__notice" role="alert">{page.error}</p> : null}<button type="button" aria-label={`Previous ${resource} page`} disabled={!page.hasPrevious} onClick={onPrevious}>Previous</button><span>Page {Math.floor(page.offset / 25) + 1}</span><button type="button" aria-label={`Next ${resource} page`} disabled={!page.hasNext} onClick={onNext}>Next</button></div>;
}
