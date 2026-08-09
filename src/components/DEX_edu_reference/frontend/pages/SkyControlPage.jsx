import React, { useEffect, useId, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Cloud, CreditCard, Download, FileSearch, LockKeyhole, Radio, RefreshCw, ShieldCheck, UsersRound, Waypoints } from 'lucide-react';
import './sky-control-page.css';
import { fetchSkyControl, fetchSkyControlSummary, fetchSkyControlForensicAnomalies, fetchSkyControlForensicEntity, fetchSkyControlForensicExport, fetchSkyControlForensicGraph, fetchSkyControlForensicTimeline, fetchSkyControlPaymentCase, fetchSkyControlWallet, searchSkyControlForensics, searchSkyControlPaymentCases, searchSkyControlWallets } from '../services/skyControlService';

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

function WalletIntelligenceWorkspace() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ status: "idle", candidates: [], seed: null, caseData: null, wallet: null, error: null });
  const submit = async (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return setState((current) => ({ ...current, status: "error", error: "Enter an exact identifier." }));
    setState({ status: "searching", candidates: [], seed: null, caseData: null, wallet: null, error: null });
    try {
      const [cases, wallets] = await Promise.all([searchSkyControlPaymentCases(value), searchSkyControlWallets(value)]);
      const candidates = [...(cases.candidates || []), ...(wallets.candidates || [])].filter((candidate, index, all) => all.findIndex((item) => `${item.entity_type}:${item.entity_id}:${item.chain || ""}` === `${candidate.entity_type}:${candidate.entity_id}:${candidate.chain || ""}`) === index);
      setState({ status: "searched", candidates, seed: null, caseData: null, wallet: null, error: null });
    } catch (error) { setState({ status: "error", candidates: [], seed: null, caseData: null, wallet: null, error: walletErrorMessage(error) }); }
  };
  const selectSeed = async (seed) => {
    setState((current) => ({ ...current, status: "loading", seed, caseData: null, wallet: null, error: null }));
    try {
      const caseData = await fetchSkyControlPaymentCase(seed.entity_type, seed.entity_id);
      const address = seed.entity_type === "WALLET" ? (seed.address || seed.entity_id) : null;
      const wallet = address && seed.chain ? await fetchSkyControlWallet(seed.chain, address).catch(() => null) : null;
      setState((current) => ({ ...current, status: "ready", caseData, wallet, error: null }));
    } catch (error) { setState((current) => ({ ...current, status: "error", caseData: null, wallet: null, error: walletErrorMessage(error) })); }
  };
  const summary = state.caseData?.summary || state.wallet || {};
  const metrics = [["Seed", state.seed?.label || state.seed?.entity_id], ["Chains", state.seed?.chain || summary.chain], ["Wallet Count", summary.wallet_count], ["Transaction Count", summary.transaction_count], ["Payment Count", summary.payment_count], ["Order Count", summary.order_count], ["User Count", summary.user_count], ["Admin Activity Count", summary.admin_activity_count], ["Counterparty Count", summary.counterparty_count], ["Service Label Count", summary.service_label_count], ["Graph Nodes", summary.graph_nodes], ["Graph Edges", summary.graph_edges], ["First Event", summary.first_event], ["Last Event", summary.last_event], ["Known Service Hits", summary.known_service_hits], ["Anomaly Count", summary.anomaly_count], ["Depth", summary.depth], ["Read Only", summary.read_only ?? state.caseData?.read_only]];
  return <div className="sky-control-page__wallet-workspace">
    <div className="sky-control-page__workspace-head"><div><span className="sky-control-page__eyebrow">READ-ONLY CASE WORKSPACE</span><h2>Wallet Intelligence</h2></div></div>
    <form className="sky-control-page__wallet-search" onSubmit={submit}><label htmlFor="wallet-intelligence-search">Exact identifier</label><div><input id="wallet-intelligence-search" aria-label="Wallet Intelligence search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Wallet, transaction, payment reference, order, payment, user, or admin ID" /><button type="submit">Search</button></div></form>
    {state.status === "idle" ? <div className="sky-control-page__empty"><FileSearch size={19} aria-hidden /><p>Search an exact wallet, transaction hash, payment reference, order, payment, user, or admin identifier.</p></div> : null}
    {state.error ? <p className="sky-control-page__notice" role="alert">{state.error}</p> : null}
    {state.status === "searched" ? <section className="sky-control-page__wallet-candidates" aria-label="Wallet Intelligence candidates"><h3>Exact candidates</h3>{state.candidates.length ? <div>{state.candidates.map((candidate) => <button type="button" key={`${candidate.entity_type}:${candidate.entity_id}:${candidate.chain || ""}`} onClick={() => selectSeed(candidate)}><strong>{safeDisplay(candidate.entity_type)}</strong><span>{safeDisplay(candidate.label || candidate.entity_id)}</span><small>{[candidate.system, candidate.chain].filter(Boolean).join(" · ") || "Application reference"}</small></button>)}</div> : <p>No exact candidates found.</p>}</section> : null}
    {state.status === "loading" ? <div className="sky-control-page__empty"><p>Loading selected read-only case...</p></div> : null}
    {state.status === "ready" ? <><section className="sky-control-page__wallet-summary" aria-label="Wallet case summary"><h3>Case summary</h3><div>{metrics.map(([label, value]) => <article key={label}><span>{label}</span><strong>{safeDisplay(value)}</strong></article>)}</div></section><div className="sky-control-page__wallet-status-grid"><StatusList title="Provider status" items={state.wallet?.provider_status || state.caseData?.provider_status} empty="Provider status unavailable for this selected seed." /><StatusList title="Application source status" items={state.caseData?.source_status || state.wallet?.source_status} empty="Application source status unavailable for this selected seed." /></div><section className="sky-control-page__wallet-limitations" aria-label="Wallet Intelligence limitations"><h3>Limitations</h3><ul>{(state.caseData?.limitations || state.wallet?.limitations || ["Missing activity is not proof of no activity."]).map((item) => <li key={item}>{safeDisplay(item)}</li>)}</ul></section><section className="sky-control-page__legend" aria-label="Wallet evidence legend"><h3>Evidence semantics</h3><div>{walletEvidenceLegend.map(([type, explanation]) => <p key={type}><strong>{type}</strong><span>{explanation}</span></p>)}</div></section></> : null}
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
const evidenceTypes = ['DIRECT', 'DERIVED', 'CORRELATED', 'UNPROVEN'];
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
  const [caseState, setCaseState] = useState({ status: 'idle', candidates: [], seed: null, graph: null, entity: null, relationship: null, timeline: [], anomalies: [], limitations: {} });
  const [timelinePage, setTimelinePage] = useState({ offset: 0, hasPrevious: false, hasNext: false, filters: { system: '', event_type: '', evidence_type: '' } });
  const [anomalyPage, setAnomalyPage] = useState({ offset: 0, hasPrevious: false, hasNext: false, filters: { severity: '', rule_id: '', evidence_type: '' } });
  const [exportState, setExportState] = useState({ status: 'idle', integrityHash: null });
  const limit = 25;
  const loadTimeline = async (seed, offset = 0, filters = timelinePage.filters) => {
    const response = await fetchSkyControlForensicTimeline({ seed_type: seed.entity_type, seed_id: seed.entity_id, limit, offset, ...filters });
    setCaseState((current) => ({ ...current, timeline: response.events || [], limitations: { ...current.limitations, ...(response.limitations || {}) } }));
    setTimelinePage((current) => ({ ...current, offset, hasPrevious: Boolean(response.pagination?.has_previous), hasNext: Boolean(response.pagination?.has_next), filters }));
  };
  const loadAnomalies = async (seed, offset = 0, filters = anomalyPage.filters) => {
    const response = await fetchSkyControlForensicAnomalies({ seed_type: seed.entity_type, seed_id: seed.entity_id, limit, offset, ...filters });
    setCaseState((current) => ({ ...current, anomalies: response.anomalies || response.items || [], limitations: { ...current.limitations, ...(response.limitations || {}) } }));
    setAnomalyPage((current) => ({ ...current, offset, hasPrevious: Boolean(response.pagination?.has_previous), hasNext: Boolean(response.pagination?.has_next), filters }));
  };
  const submit = async (event) => { event.preventDefault(); const q = query.trim(); if (!q) { setCaseState({ status: 'empty', candidates: [], seed: null, graph: null, entity: null, relationship: null, timeline: [], anomalies: [], limitations: {} }); return; } setCaseState((current) => ({ ...current, status: 'searching', candidates: [] })); try { const response = await searchSkyControlForensics(q); setCaseState((current) => ({ ...current, status: response.count ? 'ready' : 'none', candidates: response.candidates || [] })); } catch (error) { setCaseState((current) => ({ ...current, status: error.status === 401 || error.status === 403 ? 'unauthorized' : 'error' })); } };
  const select = async (seed) => { setTimelinePage({ offset: 0, hasPrevious: false, hasNext: false, filters: { system: '', event_type: '', evidence_type: '' } }); setAnomalyPage({ offset: 0, hasPrevious: false, hasNext: false, filters: { severity: '', rule_id: '', evidence_type: '' } }); setCaseState({ status: 'loading', candidates: [], seed, graph: null, entity: null, relationship: null, timeline: [], anomalies: [], limitations: {} }); try { const [graph, entity] = await Promise.all([fetchSkyControlForensicGraph({ seed_type: seed.entity_type, seed_id: seed.entity_id }), fetchSkyControlForensicEntity(seed.entity_type, seed.entity_id)]); setCaseState((current) => ({ ...current, status: 'ready', graph, entity, limitations: graph.limitations || {} })); await Promise.all([loadTimeline(seed, 0, { system: '', event_type: '', evidence_type: '' }), loadAnomalies(seed, 0, { severity: '', rule_id: '', evidence_type: '' })]); } catch { setCaseState((current) => ({ ...current, status: 'error' })); } };
  const exportCase = async (format) => { if (!caseState.seed) return; setExportState({ status: 'loading', integrityHash: null }); try { const result = await fetchSkyControlForensicExport(format, { seed_type: caseState.seed.entity_type, seed_id: caseState.seed.entity_id }); const url = URL.createObjectURL(result.blob); const link = document.createElement('a'); link.href = url; link.download = `sky-control-forensics-${caseState.seed.entity_type}-${caseState.seed.entity_id}.${format === 'csv' ? 'csv' : 'json'}`; link.click(); URL.revokeObjectURL(url); setExportState({ status: 'success', integrityHash: /^sha256:[a-f0-9]{64}$/.test(result.integrityHash || '') ? result.integrityHash : null }); } catch { setExportState({ status: 'error', integrityHash: null }); } };
  const graph = caseState.graph;
  const metadata = graph?.metadata || {};
  const evidenceRows = [...(graph?.edges || []).map((item) => ({ label: item.relationship_type, type: item.evidence_type, timestamp: item.event_time, provenance: item.metadata?.provenance })), ...caseState.timeline.map((item) => ({ label: forensicLabel(item.event_type), type: item.evidence_type, timestamp: item.timestamp, provenance: [{ source_system: item.source_system, source_table: item.source_table, source_record_id: item.source_record_id }] })), ...caseState.anomalies.map((item) => ({ label: item.title || item.rule_id, type: item.evidence_type, timestamp: item.timestamp, provenance: item.provenance || item.metadata?.provenance }))];
  return <div className="sky-control-page__workspace sky-control-page__forensics"><div className="sky-control-page__workspace-head"><div><span className="sky-control-page__eyebrow">FORENSIC INVESTIGATION</span><h2>Forensics</h2><p>Search exact safe identifiers and inspect bounded evidence.</p></div><span className="sky-control-page__read-only">READ ONLY</span></div><form className="sky-control-page__filters" onSubmit={submit}><input aria-label="Forensic search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exact safe identifier"/><button type="submit" className="sky-control-page__action">Search</button></form>{caseState.status === 'empty' && <p className="sky-control-page__notice">Enter an identifier to start a read-only case.</p>}{caseState.status === 'searching' && <p>Searching safe forensic records...</p>}{caseState.status === 'none' && <p>No matching entity.</p>}{caseState.status === 'unauthorized' && <p>Not authorized for Sky Control.</p>}{caseState.status === 'error' && <p>Forensic provider unavailable.</p>}{caseState.candidates.map((candidate) => <button type="button" className="sky-control-page__action" key={`${candidate.entity_type}:${candidate.entity_id}`} onClick={() => select(candidate)}>{candidate.entity_type}: {candidate.label}</button>)}{graph && <><section className="sky-control-page__schema"><div className="sky-control-page__workspace-head"><div><h3>Case graph</h3><p>Seed Entity: {graph.seed?.label || '-'} | Entity Count: {graph.case?.entity_count ?? graph.nodes?.length ?? 0} | Edge Count: {graph.case?.edge_count ?? graph.edges?.length ?? 0}</p><p>Earliest Event: {forensicTime(graph.case?.earliest_event)} | Latest Event: {forensicTime(graph.case?.latest_event)} | Read Only</p><p>Bounded graph | Depth: {metadata.depth_reached ?? '-'} / {metadata.max_depth ?? '-'} | Nodes: {graph.nodes?.length || 0} / {metadata.max_nodes ?? '-'} | Edges: {graph.edges?.length || 0} / {metadata.max_edges ?? '-'}</p></div><div className="sky-control-page__panel-actions"><button type="button" className="sky-control-page__action" onClick={() => exportCase('json')}>Export JSON</button><button type="button" className="sky-control-page__action" onClick={() => exportCase('csv')}>Export Timeline CSV</button></div></div>{(metadata.truncated_nodes || metadata.truncated_edges) && <p className="sky-control-page__notice">Partial graph - bounded for safety/performance</p>}{exportState.status === 'success' && <p>Export ready for download.</p>}{exportState.integrityHash && <><strong>Export integrity hash</strong><code>{exportState.integrityHash}</code></>}<div className="sky-control-page__legend">{evidenceTypes.map((type) => <span key={type}>{type}</span>)}</div><CompactTable items={graph.edges || []} view="forensics" forensic onSelect={(relationship) => setCaseState((current) => ({ ...current, relationship }))}/></section><section className="sky-control-page__schema"><h3>Timeline</h3><div className="sky-control-page__filters"><select aria-label="System filter" value={timelinePage.filters.system} onChange={(e) => loadTimeline(caseState.seed, 0, { ...timelinePage.filters, system: e.target.value })}><option value="">All systems</option><option value="quick">Quick</option><option value="skycloud">SkyCloud</option></select><select aria-label="Event type filter" value={timelinePage.filters.event_type} onChange={(e) => loadTimeline(caseState.seed, 0, { ...timelinePage.filters, event_type: e.target.value })}><option value="">All event types</option>{Object.entries(timelineLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Evidence type filter" value={timelinePage.filters.evidence_type} onChange={(e) => loadTimeline(caseState.seed, 0, { ...timelinePage.filters, evidence_type: e.target.value })}><option value="">All evidence types</option>{evidenceTypes.map((type) => <option key={type}>{type}</option>)}</select></div>{caseState.timeline.length ? <CompactTable items={caseState.timeline.map((item) => ({ event_id: item.event_id, time: forensicTime(item.timestamp), event: forensicLabel(item.event_type), system: item.system || item.source_system, evidence: item.evidence_type, source: `${item.source_table || '-'} / ${item.source_record_id || '-'}` }))} view="timeline"/> : <p>No timeline events</p>}<ForensicPagination page={timelinePage} onPrevious={() => loadTimeline(caseState.seed, Math.max(0, timelinePage.offset - limit))} onNext={() => loadTimeline(caseState.seed, timelinePage.offset + limit)}/></section><section className="sky-control-page__schema"><h3>Anomalies</h3><p>Anomaly signals indicate unusual or inconsistent application patterns. They are not findings of fraud or wrongdoing.</p><div className="sky-control-page__filters"><select aria-label="Anomaly severity filter" value={anomalyPage.filters.severity} onChange={(e) => loadAnomalies(caseState.seed, 0, { ...anomalyPage.filters, severity: e.target.value })}><option value="">All severities</option>{['INFO', 'LOW', 'MEDIUM', 'HIGH'].map((type) => <option key={type}>{type}</option>)}</select><input aria-label="Anomaly rule filter" value={anomalyPage.filters.rule_id} onChange={(e) => loadAnomalies(caseState.seed, 0, { ...anomalyPage.filters, rule_id: e.target.value })}/></div>{caseState.anomalies.length ? caseState.anomalies.map((item, index) => <details key={item.anomaly_id || index}><summary>Severity: {forensicValue(item.severity)} | Rule: {forensicValue(item.rule_id)} | {forensicValue(item.title)}</summary><p>Reason: {forensicValue(item.reason)}</p><p>Evidence Type: {forensicValue(item.evidence_type)}</p><p>Reason codes: {Array.isArray(item.reason_codes) ? item.reason_codes.join(', ') : '-'}</p><ForensicProvenance items={item.provenance || item.metadata?.provenance}/></details>) : <p>No anomalies</p>}<ForensicPagination page={anomalyPage} onPrevious={() => loadAnomalies(caseState.seed, Math.max(0, anomalyPage.offset - limit))} onNext={() => loadAnomalies(caseState.seed, anomalyPage.offset + limit)}/></section><section className="sky-control-page__schema"><h3>Evidence</h3>{evidenceRows.length ? evidenceRows.map((item, index) => <article key={index}><p>Evidence Type: {forensicValue(item.type)}</p><p>Relationship / Event / Anomaly: {forensicValue(item.label)}</p><p>Timestamp: {forensicTime(item.timestamp)}</p><ForensicProvenance items={item.provenance}/></article>) : <p>No evidence records</p>}</section><section className="sky-control-page__schema"><h3>Limitations</h3><p>Unavailable means the current safe read-only source contract does not provide sufficient evidence. Missing evidence should not be interpreted as proof that no activity occurred.</p>{[['broad_admin_actions_available', 'Broad admin-action history unavailable'], ['broad_invoices_available', 'Broad invoice history unavailable'], ['invoice_status_timeline_available', 'Invoice status timeline unavailable'], ['invite_user_mismatch_rule_available', 'Invite mismatch rule unavailable']].filter(([key]) => caseState.limitations[key] === false).map(([, note]) => <p key={note}>{note}</p>)}<p>Investigator prefill unavailable</p><p>The current Investigator route has no supported URL, query, or state prefill contract, so Sky Control does not automatically transfer identifiers.</p></section>{caseState.entity && <ForensicDrawer label="Entity details" title={`${caseState.entity.entity?.type || caseState.entity.type || '-'}: ${caseState.entity.entity?.label || caseState.entity.label || '-'}`} onClose={() => setCaseState((current) => ({ ...current, entity: null }))}><p>System: {caseState.entity.entity?.system || caseState.entity.system || '-'}</p><p>First seen: {forensicTime(caseState.entity.entity?.first_seen || caseState.entity.first_seen)}</p><p>Last seen: {forensicTime(caseState.entity.entity?.last_seen || caseState.entity.last_seen)}</p><ForensicProvenance items={caseState.entity.provenance}/></ForensicDrawer>}{caseState.relationship && <ForensicDrawer label="Relationship details" title={caseState.relationship.relationship_type || '-'} onClose={() => setCaseState((current) => ({ ...current, relationship: null }))}><p>Evidence: {caseState.relationship.evidence_type || '-'}</p><p>Confidence: {Math.round((Number(caseState.relationship.confidence) || 0) * 100)}%</p><p>Event time: {forensicTime(caseState.relationship.event_time)}</p><p>Deterministic application-data confidence; not identity proof.</p><ForensicProvenance items={caseState.relationship.metadata?.provenance}/></ForensicDrawer>}</>}</div>;
}

function ForensicPagination({ page, onPrevious, onNext }) {
  return <div className="sky-control-page__pagination"><button type="button" aria-label="Previous forensic page" disabled={!page.hasPrevious} onClick={onPrevious}>Previous</button><span>Page {Math.floor(page.offset / 25) + 1}</span><button type="button" aria-label="Next forensic page" disabled={!page.hasNext} onClick={onNext}>Next</button></div>;
}
