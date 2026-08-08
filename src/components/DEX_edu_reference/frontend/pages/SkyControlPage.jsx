import React, { useEffect, useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Cloud,
  CreditCard,
  Download,
  FileSearch,
  LockKeyhole,
  Radio,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  Waypoints,
} from "lucide-react";
import "./sky-control-page.css";
import {
  fetchSkyControl,
  fetchSkyControlSummary,
  fetchSkyControlForensicAnomalies,
  fetchSkyControlForensicEntity,
  fetchSkyControlForensicExport,
  fetchSkyControlForensicGraph,
  fetchSkyControlForensicTimeline,
  searchSkyControlForensics,
} from "../services/skyControlService";

const tabs = [
  "Overview",
  "Gateway",
  "Bot Fleet",
  "Users & Subscriptions",
  "Admin Timeline",
  "Payments",
  "Channel",
  "Forensics",
  "Security",
];

const tabKey = (tab) =>
  tab
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function overviewCards(summary) {
  const { health, overview } = summary || {};
  const state = summary?.state || "loading";
  const unavailable =
    state === "unauthorized"
      ? "Unauthorized"
      : state === "unavailable"
        ? "Unavailable"
        : state === "error"
          ? "Error"
          : "Loading";
  if (state !== "connected") {
    return [
      { title: "Gateway", icon: Radio, detail: unavailable },
      { title: "Bot Manager", icon: Waypoints, detail: unavailable },
      { title: "Bot Fleet", icon: Cloud, detail: unavailable },
      { title: "Subscriptions", icon: UsersRound, detail: unavailable },
      { title: "Payments", icon: CreditCard, detail: unavailable },
      { title: "Admin Activity", icon: FileSearch, detail: unavailable },
    ];
  }
  const quick = overview?.quick?.metrics;
  const sky = overview?.skycloud?.metrics;
  const fleet = overview?.bot_fleet?.metrics;
  const payments = overview?.payments?.metrics;
  return [
    {
      title: "Gateway",
      icon: Radio,
      detail: health?.database === "connected" ? "Connected" : "Unavailable",
    },
    {
      title: "Bot Manager",
      icon: Waypoints,
      detail:
        overview?.quick?.status === "available" ? "Connected" : "Unavailable",
    },
    {
      title: "Bot Fleet",
      icon: Cloud,
      detail: fleet ? `${fleet.total} bots` : "Unavailable",
    },
    {
      title: "Subscriptions",
      icon: UsersRound,
      detail:
        quick && sky
          ? `${quick.active_subscriptions + sky.active_subscriptions} active`
          : "Unavailable",
    },
    {
      title: "Payments",
      icon: CreditCard,
      detail: payments
        ? `${payments.quick_payment_proofs + payments.skycloud_payment_proofs} proofs`
        : "Unavailable",
    },
    {
      title: "Admin Activity",
      icon: FileSearch,
      detail:
        quick && sky
          ? `${quick.admin_actions_total + sky.admin_actions_total} actions`
          : "Unavailable",
    },
  ];
}

const endpointByTab = {
  "bot-fleet": "/bot-fleet",
  "users-subscriptions": "/users",
  "admin-timeline": "/admins",
  payments: "/payments",
  channel: "/channel-invites",
  gateway: "/overview",
  security: "/health",
};

function exportCsv(items, filename) {
  if (!items?.length) return;
  const keys = [...new Set(items.flatMap((item) => Object.keys(item)))].filter(
    (key) =>
      !/(token|password|secret|authorization|cookie|key|seed|mnemonic)/i.test(
        key,
      ),
  );
  const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const body = [
    keys.join(","),
    ...items.map((item) => keys.map((key) => quote(item[key])).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([body], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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

export default function SkyControlPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabId = useId();
  const [summary, setSummary] = useState({ state: "loading" });
  const [data, setData] = useState({ state: "idle", items: [] });
  const [filters, setFilters] = useState({ search: "", status: "" });
  const requestedTab = searchParams.get("tab");
  const activeTab = tabs.some((tab) => tabKey(tab) === requestedTab)
    ? requestedTab
    : "overview";

  const refreshSummary = (signal) => {
    setSummary((current) => ({ ...current, state: "loading" }));
    return fetchSkyControlSummary(signal)
      .then(({ health, overview, schema }) =>
        setSummary({
          state: "connected",
          health,
          overview,
          schema,
          refreshedAt: new Date().toISOString(),
        }),
      )
      .catch((error) => {
        if (signal?.aborted) return;
        const state =
          error?.status === 401 || error?.status === 403
            ? "unauthorized"
            : error?.status === 503
              ? "unavailable"
              : "error";
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
    if (!endpoint || activeTab === "overview") return undefined;
    const controller = new AbortController();
    setData({ state: "loading", items: [] });
    fetchSkyControl(endpoint, {
      signal: controller.signal,
      params: { page: 1, limit: 50, ...filters },
    })
      .then((response) =>
        setData({
          state: "connected",
          ...response,
          refreshedAt: new Date().toISOString(),
        }),
      )
      .catch(
        (error) =>
          !controller.signal.aborted &&
          setData({
            state:
              error?.status === 401 || error?.status === 403
                ? "unauthorized"
                : "unavailable",
            items: [],
          }),
      );
    return () => controller.abort();
  }, [activeTab, filters.search, filters.status]);

  const selectTab = (nextTab) => {
    setSearchParams(nextTab === "overview" ? {} : { tab: nextTab }, {
      replace: true,
    });
  };

  const handleTabKeyDown = (event) => {
    const currentIndex = tabs.findIndex((tab) => tabKey(tab) === activeTab);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight")
      nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
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
          <button
            type="button"
            className="sky-control-page__back"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={16} aria-hidden />
            Back to home
          </button>
          <span className="sky-control-page__read-only">
            <LockKeyhole size={13} aria-hidden />
            READ ONLY
          </span>
        </div>
        <div className="sky-control-page__title-row">
          <div>
            <span className="sky-control-page__eyebrow">PRIVATE WORKSPACE</span>
            <h1>Sky Control</h1>
            <p>Private operations and forensic workspace</p>
          </div>
          <div className="sky-control-page__boundary" role="note">
            <ShieldCheck size={17} aria-hidden />
            <span>
              {summary.state === "connected"
                ? "LIVE READ-ONLY PostgreSQL provider."
                : "Read-only provider status is loading."}
            </span>
          </div>
        </div>
        <div className="sky-control-page__utility">
          <span>Operational controls disabled</span>
          <span>
            {summary.refreshedAt
              ? `Last refreshed: ${new Date(summary.refreshedAt).toLocaleTimeString()}`
              : "Not refreshed yet"}
          </span>
          <button type="button" onClick={() => refreshSummary()}>
            <RefreshCw size={14} aria-hidden />
            Refresh
          </button>
        </div>
      </header>

      <nav className="sky-control-page__tabs" aria-label="Sky Control sections">
        <div
          role="tablist"
          aria-orientation="horizontal"
          onKeyDown={handleTabKeyDown}
        >
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
                className={selected ? "is-active" : ""}
                onClick={() => selectTab(key)}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </nav>

      <section
        id={`${tabId}-panel`}
        role="tabpanel"
        aria-label={`${tabs.find((tab) => tabKey(tab) === activeTab)} section`}
        className="sky-control-page__panel"
      >
        {activeTab === "overview" ? (
          <>
            <div className="sky-control-page__card-grid">
              {overviewCards(summary).map(({ title, icon: Icon, detail }) => (
                <article key={title} className="sky-control-page__card">
                  <div className="sky-control-page__card-title">
                    <Icon size={17} aria-hidden />
                    <h2>{title}</h2>
                  </div>
                  <p>Status</p>
                  <strong>{detail}</strong>
                </article>
              ))}
            </div>
            <section
              className="sky-control-page__schema"
              aria-label="Database schema compatibility"
            >
              <div className="sky-control-page__card-title">
                <ShieldCheck size={17} aria-hidden />
                <h2>Database schema compatibility</h2>
              </div>
              <span>LIVE READ-ONLY</span>
              {summary.schema?.tables?.length ? (
                <ul>
                  {summary.schema.tables.map((table) => (
                    <li
                      key={table.table}
                      className={
                        table.compatible ? "is-compatible" : "is-incompatible"
                      }
                    >
                      <code>{table.table}</code>
                      <strong>
                        {table.compatible
                          ? table.adapted
                            ? "ADAPTED"
                            : "OK"
                          : "SCHEMA INCOMPATIBLE"}
                      </strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Schema diagnostics unavailable.</p>
              )}
            </section>
          </>
        ) : activeTab === "forensics" ? (
          <ForensicsWorkspace />
        ) : (
          <div className="sky-control-page__workspace">
            <div className="sky-control-page__workspace-head">
              <div>
                <span className="sky-control-page__eyebrow">
                  LIVE READ-ONLY
                </span>
                <h2>{tabs.find((tab) => tabKey(tab) === activeTab)}</h2>
              </div>
              {[
                "bot-fleet",
                "users-subscriptions",
                "admin-timeline",
                "payments",
              ].includes(activeTab) && (
                <button
                  type="button"
                  className="sky-control-page__action"
                  onClick={() =>
                    exportCsv(data.items, `sky-control-${activeTab}.csv`)
                  }
                  disabled={!data.items?.length}
                >
                  <Download size={14} aria-hidden />
                  Export current view
                </button>
              )}
            </div>
            {["bot-fleet", "users-subscriptions"].includes(activeTab) && (
              <div className="sky-control-page__filters">
                <input
                  aria-label="Search"
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((value) => ({
                      ...value,
                      search: event.target.value,
                    }))
                  }
                  placeholder="Search user or bot"
                />
                {activeTab === "bot-fleet" && (
                  <select
                    aria-label="Status"
                    value={filters.status}
                    onChange={(event) =>
                      setFilters((value) => ({
                        ...value,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option value="">All statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="STOPPED">Stopped</option>
                    <option value="CRASHED">Crashed</option>
                    <option value="REVOKED">Revoked</option>
                  </select>
                )}
              </div>
            )}
            {activeTab === "gateway" && (
              <p className="sky-control-page__notice">
                SERVICE RUNTIME NOT CONNECTED. This view contains
                database-derived metadata only.
              </p>
            )}
            {activeTab === "security" && (
              <div className="sky-control-page__security">
                <strong>
                  Sky Control DB role:{" "}
                  {summary.state === "connected"
                    ? "READ ONLY CONFIGURED"
                    : "UNAVAILABLE"}
                </strong>
                <span>Sensitive projections: excluded</span>
                <span>Response redaction: enabled</span>
                <span>Telegram: NOT CONNECTED</span>
                <span>SSH: NOT CONNECTED</span>
                <span>Write operations: DISABLED</span>
              </div>
            )}
            {!["gateway", "security"].includes(activeTab) &&
              (data.state === "connected" ? (
                <CompactTable items={data.items} />
              ) : (
                <div className="sky-control-page__empty">
                  <Cloud size={19} aria-hidden />
                  <p>
                    {data.state === "unauthorized"
                      ? "Not authorized for Sky Control."
                      : data.state === "loading"
                        ? "Loading read-only data..."
                        : "Data unavailable or schema incompatible."}
                  </p>
                </div>
              ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ForensicsWorkspace() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState({
    status: "idle",
    candidates: [],
    graph: null,
    entity: null,
    relationship: null,
    seed: null,
    timelineData: [],
    anomalyData: [],
  });
  const [exportState, setExportState] = useState({
    status: "idle",
    integrityHash: null,
  });
  const submit = async (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value)
      return setState({ status: "empty", candidates: [], graph: null });
    setState({ status: "loading", candidates: [], graph: null });
    try {
      const response = await searchSkyControlForensics(value);
      setState({
        status: response.count ? "ready" : "none",
        candidates: response.candidates || [],
        graph: null,
      });
    } catch (error) {
      setState({
        status:
          error.status === 401 || error.status === 403
            ? "unauthorized"
            : "error",
        candidates: [],
        graph: null,
      });
    }
  };
  const select = async (candidate) => {
    setState((current) => ({
      ...current,
      status: "graph-loading",
      seed: candidate,
      graph: null,
      entity: null,
      relationship: null,
      timelineData: [],
      anomalyData: [],
    }));
    try {
      const [graph, entity] = await Promise.all([
        fetchSkyControlForensicGraph({
          seed_type: candidate.entity_type,
          seed_id: candidate.entity_id,
        }),
        fetchSkyControlForensicEntity(
          candidate.entity_type,
          candidate.entity_id,
        ),
      ]);
      setState((current) => ({
        ...current,
        status: "graph-ready",
        graph,
        entity,
      }));
    } catch {
      setState((current) => ({ ...current, status: "error" }));
    }
  };
  const exportCase = async (format) => {
    if (!state.seed) return;
    setExportState({ status: "loading", integrityHash: null });
    try {
      const result = await fetchSkyControlForensicExport(format, {
        seed_type: state.seed.entity_type,
        seed_id: state.seed.entity_id,
      });
      const type = safeExportFilenamePart(
        state.seed.entity_type,
        "case",
      ).toLowerCase();
      const id = safeExportFilenamePart(state.seed.entity_id, "record");
      downloadForensicExport(
        result.blob,
        `sky-control-forensics-${type}-${id}${format === "csv" ? "-timeline.csv" : ".json"}`,
      );
      setExportState({
        status: "success",
        integrityHash:
          format === "json" ? validIntegrityHash(result.integrityHash) : null,
      });
    } catch {
      setExportState({ status: "error", integrityHash: null });
    }
  };
  return (
    <div className="sky-control-page__workspace sky-control-page__forensics">
      <div className="sky-control-page__workspace-head">
        <div>
          <span className="sky-control-page__eyebrow">
            FORENSIC INVESTIGATION
          </span>
          <h2>Forensics</h2>
          <p>
            Enter an Admin ID, User ID, Bot ID, Order ID, transaction hash or
            public address.
          </p>
        </div>
        <span className="sky-control-page__read-only">
          <LockKeyhole size={13} />
          READ ONLY
        </span>
      </div>
      <form className="sky-control-page__filters" onSubmit={submit}>
        <input
          aria-label="Forensic search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search exact safe identifier"
        />
        <button type="submit" className="sky-control-page__action">
          Search
        </button>
      </form>
      {state.status === "empty" && (
        <p className="sky-control-page__notice">
          Enter an identifier to start a read-only case.
        </p>
      )}
      {state.status === "loading" && (
        <p className="sky-control-page__notice">
          Searching safe forensic records...
        </p>
      )}
      {state.status === "none" && (
        <div className="sky-control-page__empty">
          <p>No matching entity.</p>
        </div>
      )}
      {state.status === "unauthorized" && (
        <div className="sky-control-page__empty">
          <p>Not authorized for Sky Control.</p>
        </div>
      )}
      {state.status === "error" && (
        <div className="sky-control-page__empty">
          <p>Forensic provider unavailable.</p>
        </div>
      )}
      {state.candidates.length > 0 && (
        <section>
          <h3>Search candidates</h3>
          <div className="sky-control-page__card-grid">
            {state.candidates.map((candidate) => (
              <button
                type="button"
                className="sky-control-page__card sky-control-page__candidate"
                key={`${candidate.entity_type}:${candidate.entity_id}`}
                onClick={() => select(candidate)}
              >
                <span>{candidate.entity_type}</span>
                <strong>{candidate.label}</strong>
                <small>{candidate.system || "Application record"}</small>
              </button>
            ))}
          </div>
        </section>
      )}
      {state.graph && (
        <section className="sky-control-page__schema">
          <div className="sky-control-page__workspace-head">
            <div>
              <h3>Case graph</h3>
              <p>
                Seed Entity: {state.graph.seed?.label || "-"} | Entity Count: {state.graph.case?.entity_count ?? state.graph.nodes?.length ?? 0} | Edge Count: {state.graph.case?.edge_count ?? state.graph.edges?.length ?? 0}
              </p>
              <p>
                Earliest Event: {formatSafeTime(state.graph.case?.earliest_event)} | Latest Event: {formatSafeTime(state.graph.case?.latest_event)} | Read Only
              </p>
              <p>
                Bounded graph | Depth: {state.graph.metadata?.depth_reached ?? "-"} / {state.graph.metadata?.max_depth ?? "-"} | Nodes: {state.graph.nodes?.length || 0} / {state.graph.metadata?.max_nodes ?? "-"} | Edges: {state.graph.edges?.length || 0} / {state.graph.metadata?.max_edges ?? "-"}
              </p>
              {(state.graph.metadata?.truncated_nodes || state.graph.metadata?.truncated_edges) && <p className="sky-control-page__notice">Partial graph - bounded for safety/performance</p>}
            </div>
            <div className="sky-control-page__panel-actions">
              <button
                type="button"
                className="sky-control-page__action"
                onClick={() => exportCase("json")}
                disabled={exportState.status === "loading"}
              >
                Export JSON
              </button>
              <button
                type="button"
                className="sky-control-page__action"
                onClick={() => exportCase("csv")}
                disabled={exportState.status === "loading"}
              >
                Export Timeline CSV
              </button>
            </div>
          </div>
          {exportState.status === "loading" && (
            <p role="status">Preparing canonical export...</p>
          )}
          {exportState.status === "success" && (
            <p role="status">Export ready for download.</p>
          )}
          {exportState.status === "error" && (
            <p role="alert">Export unavailable. Please try again.</p>
          )}
          {exportState.integrityHash && (
            <div>
              <p>
                <strong>Export integrity hash</strong>
              </p>
              <code>{exportState.integrityHash}</code>
              <p>
                This hash verifies the exported bundle content; it does not
                prove the immutability of the source database.
              </p>
            </div>
          )}
          <div className="sky-control-page__legend">
            <span>DIRECT</span>
            <span>DERIVED</span>
            <span>CORRELATED</span>
            <span>UNPROVEN</span>
          </div>
          <CompactTable items={state.graph.edges || []} />
        </section>
      )}
      {state.entity && (
        <ForensicEntityDrawer
          detail={state.entity}
          onClose={() => setState((current) => ({ ...current, entity: null }))}
        />
      )}
      {state.graph?.edges?.[0] && (
        <button
          type="button"
          className="sky-control-page__action"
          onClick={() =>
            setState((current) => ({
              ...current,
              relationship: current.graph.edges[0],
            }))
          }
        >
          Open relationship details
        </button>
      )}
      {state.relationship && (
        <ForensicRelationshipDrawer
          relationship={state.relationship}
          onClose={() =>
            setState((current) => ({ ...current, relationship: null }))
          }
        />
      )}
      {state.graph && (
        <>
          <TimelinePanel
            seed={state.seed}
            onData={(timelineData, limitations) =>
              setState((current) => ({ ...current, timelineData, graph: current.graph ? { ...current.graph, limitations: Object.keys(limitations).length ? limitations : current.graph.limitations } : current.graph }))
            }
          />
          <AnomaliesPanel
            seed={state.seed}
            onData={(anomalyData, limitations) =>
              setState((current) => ({ ...current, anomalyData, graph: current.graph ? { ...current.graph, limitations: Object.keys(limitations).length ? limitations : current.graph.limitations } : current.graph }))
            }
          />
          <EvidencePanel
            relationships={state.graph.edges || []}
            timeline={state.timelineData}
            anomalies={state.anomalyData}
          />
          <LimitationsPanel
            capabilities={
              state.graph.limitations || {}
            }
          />
        </>
      )}
    </div>
  );
}

const safeMetadata = [
  "user_id",
  "admin_id",
  "bot_id",
  "bot_username",
  "order_id",
  "status",
  "language",
  "address",
  "reference_value",
];
const formatSafeTime = (value) => {
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toLocaleString() : "-";
};
function Provenance({ items }) {
  return (
    <div>
      <h4>Evidence sources</h4>
      {items?.length ? (
        items.map((item, index) => (
          <p key={`${item.source_table}-${item.source_record_id}-${index}`}>
            {item.source_system || "-"} · {item.source_table || "-"} ·{" "}
            {item.source_record_id || "-"} · {item.event_time || "-"}
          </p>
        ))
      ) : (
        <p>No source provenance available</p>
      )}
    </div>
  );
}
function ForensicEntityDrawer({ detail, onClose }) {
  const entity = detail.entity || detail;
  const provenance = Array.isArray(detail.provenance)
    ? detail.provenance
    : detail.provenance
      ? [detail.provenance]
      : [];
  return (
    <aside className="sky-control-page__schema" aria-label="Entity details">
      <button type="button" aria-label="Close entity details" onClick={onClose}>
        Close
      </button>
      <h3>
        {entity.type}: {entity.label}
      </h3>
      <p>System: {entity.system || "-"}</p>
      <p>First seen: {formatSafeTime(entity.first_seen)}</p>
      <p>Last seen: {formatSafeTime(entity.last_seen)}</p>
      <h4>Safe metadata</h4>
      {safeMetadata.map(
        (key) =>
          entity.safe_metadata?.[key] != null && (
            <p key={key}>
              {key}: {String(entity.safe_metadata[key])}
            </p>
          ),
      )}
      {detail.connected_entities?.length ? (
        <>
          <h4>Connected entities</h4>
          {detail.connected_entities.map((item) => (
            <p key={`${item.type}-${item.id}`}>
              {item.type} · {item.label} · {item.system || "-"}
            </p>
          ))}
        </>
      ) : null}
      <h4>Connected relationships</h4>
      <p>{detail.edges?.length || 0} relationship records</p>
      <h4>Timeline summary</h4>
      <p>{detail.timeline_summary?.length || 0} timeline records</p>
      <h4>Anomaly summary</h4>
      <p>{detail.anomalies?.length || 0} anomaly records</p>
      <h4>Graph bounds</h4>
      <p>Depth: {detail.graph_metadata?.max_depth ?? "-"} | Nodes: {detail.graph_metadata?.max_nodes ?? "-"} | Edges: {detail.graph_metadata?.max_edges ?? "-"}</p>
      <Provenance items={provenance} />
    </aside>
  );
}
function ForensicRelationshipDrawer({ relationship, onClose }) {
  const metadata = relationship.metadata || {};
  const from =
    relationship.source_label ||
    `${relationship.source_entity_type || "-"}: ${relationship.source_entity_id || "-"}`;
  const to =
    relationship.target_label ||
    `${relationship.target_entity_type || "-"}: ${relationship.target_entity_id || "-"}`;
  return (
    <aside
      className="sky-control-page__schema"
      aria-label="Relationship details"
    >
      <button
        type="button"
        aria-label="Close relationship details"
        onClick={onClose}
      >
        Close
      </button>
      <h3>{relationship.relationship_type || "-"}</h3>
      <p>From: {typeof from === "string" ? from : "-"}</p>
      <p>To: {typeof to === "string" ? to : "-"}</p>
      <p>Evidence: {relationship.evidence_type || "-"}</p>
      <p>
        Confidence: {Math.round((Number(relationship.confidence) || 0) * 100)}%
      </p>
      <p>Reason codes: {(relationship.reason_codes || []).join(", ") || "-"}</p>
      <p>Rule ID: {metadata.rule_id || "-"}</p>
      <p>Rule description: {metadata.rule_description || "-"}</p>
      <p>Matched fields: {(metadata.matched_fields || []).join(", ") || "-"}</p>
      <p>Time delta: {metadata.time_delta_seconds ?? "-"}</p>
      <p>Event time: {formatSafeTime(relationship.event_time)}</p>
      <p>Deterministic application-data confidence; not identity proof.</p>
      <Provenance items={metadata.provenance} />
    </aside>
  );
}
const timelineLabels = {
  ADMIN_ACTION: "Admin action",
  ORDER_CREATED: "Order created",
  ORDER_UPDATED: "Order updated",
  PAYMENT_PROOF: "Payment proof",
  SUBSCRIPTION_START: "Subscription started",
  SUBSCRIPTION_END: "Subscription ended",
  BOT_REGISTERED: "Bot registered",
  BOT_STARTED: "Bot started",
  BOT_CRASHED: "Bot crashed",
  INVITE_CREATED: "Invite created",
  INVITE_APPROVED: "Invite approved",
  INVITE_REVOKED: "Invite revoked",
  WITHDRAW_DESTINATION_UPDATED: "Withdrawal destination updated",
};
const timelineEvidenceTypes = ["DIRECT", "DERIVED", "CORRELATED", "UNPROVEN"];
const safeTimelineValue = (value) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "-";
const timelineActor = (value) =>
  typeof value === "object" && value
    ? safeTimelineValue(value.label ?? value.name ?? value.id)
    : safeTimelineValue(value);
const timelineEventLabel = (value) =>
  timelineLabels[value] ||
  (typeof value === "string" && value
    ? `Unknown event: ${value.replaceAll("_", " ")}`
    : "Unknown event");
function TimelinePanel({ seed, onData }) {
  const [timeline, setTimeline] = useState({
    status: "idle",
    events: [],
    offset: 0,
    hasPrevious: false,
    hasNext: false,
  });
  const [filters, setFilters] = useState({
    system: "",
    event_type: "",
    evidence_type: "",
  });
  const limit = 25;
  const load = async (offset = 0, nextFilters = filters) => {
    if (!seed) return;
    setTimeline((current) => ({ ...current, status: "loading" }));
    try {
      const response = await fetchSkyControlForensicTimeline({
        seed_type: seed.entity_type,
        seed_id: seed.entity_id,
        limit,
        offset,
        ...nextFilters,
      });
      const pagination = response.pagination || {};
      const events = response.events || [];
      onData?.(events, response.limitations || {});
      setTimeline({
        status: "ready",
        events,
        offset,
        hasPrevious: Boolean(pagination.has_previous),
        hasNext: Boolean(pagination.has_next),
      });
    } catch (error) {
      onData?.([], {});
      setTimeline({
        status:
          error.status === 401 || error.status === 403
            ? "unauthorized"
            : "error",
        events: [],
        offset,
        hasPrevious: false,
        hasNext: false,
      });
    }
  };
  useEffect(() => {
    setFilters({ system: "", event_type: "", evidence_type: "" });
    load(0, { system: "", event_type: "", evidence_type: "" });
  }, [seed]);
  const changeFilter = (name, value) => {
    const next = { ...filters, [name]: value };
    setFilters(next);
    load(0, next);
  };
  const page = Math.floor(timeline.offset / limit) + 1;
  return (
    <section
      className="sky-control-page__schema"
      aria-label="Forensic timeline"
    >
      <h3>Timeline</h3>
      <div className="sky-control-page__filters">
        <select
          aria-label="System filter"
          value={filters.system}
          onChange={(event) => changeFilter("system", event.target.value)}
        >
          <option value="">All systems</option>
          <option value="quick">Quick</option>
          <option value="skycloud">SkyCloud</option>
        </select>
        <select
          aria-label="Event type filter"
          value={filters.event_type}
          onChange={(event) => changeFilter("event_type", event.target.value)}
        >
          <option value="">All event types</option>
          {Object.entries(timelineLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Evidence type filter"
          value={filters.evidence_type}
          onChange={(event) =>
            changeFilter("evidence_type", event.target.value)
          }
        >
          <option value="">All evidence types</option>
          {timelineEvidenceTypes.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
      {timeline.status === "loading" ? (
        <p>Loading timeline...</p>
      ) : timeline.status === "unauthorized" ? (
        <p>Not authorized for Sky Control.</p>
      ) : timeline.status === "error" ? (
        <p>Timeline unavailable</p>
      ) : !timeline.events?.length ? (
        <p>No timeline events</p>
      ) : (
        <div className="sky-control-page__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>System</th>
                <th>Actor</th>
                <th>Subject</th>
                <th>Object</th>
                <th>Evidence</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {timeline.events.map((event, index) => (
                <tr
                  key={
                    safeTimelineValue(event.event_id) !== "-"
                      ? safeTimelineValue(event.event_id)
                      : index
                  }
                >
                  <td>{formatSafeTime(event.timestamp)}</td>
                  <td>{timelineEventLabel(event.event_type)}</td>
                  <td>
                    {safeTimelineValue(event.system ?? event.source_system)}
                  </td>
                  <td>{timelineActor(event.actor)}</td>
                  <td>{timelineActor(event.subject)}</td>
                  <td>{timelineActor(event.object)}</td>
                  <td>{safeTimelineValue(event.evidence_type)}</td>
                  <td>
                    {safeTimelineValue(event.source_table)} /{" "}
                    {safeTimelineValue(event.source_record_id)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="sky-control-page__pagination">
        <button
          type="button"
          aria-label="Previous timeline page"
          onClick={() => load(Math.max(0, timeline.offset - limit))}
          disabled={timeline.status === "loading" || !timeline.hasPrevious}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          type="button"
          aria-label="Next timeline page"
          onClick={() => load(timeline.offset + limit)}
          disabled={timeline.status === "loading" || !timeline.hasNext}
        >
          Next
        </button>
      </div>
    </section>
  );
}

const safeList = (value) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string" || typeof item === "number")
        .join(", ") || "-"
    : safeTimelineValue(value);
function AnomaliesPanel({ seed, onData }) {
  const [state, setState] = useState({
    status: "idle",
    items: [],
    offset: 0,
    hasNext: false,
  });
  const [filters, setFilters] = useState({
    severity: "",
    rule_id: "",
    evidence_type: "",
  });
  const limit = 25;
  const load = async (offset = 0, next = filters) => {
    if (!seed) return;
    setState((current) => ({ ...current, status: "loading" }));
    try {
      const response = await fetchSkyControlForensicAnomalies({
        seed_type: seed.entity_type,
        seed_id: seed.entity_id,
        limit,
        offset,
        ...next,
      });
      const items = response.anomalies || response.items || [];
      onData?.(items, response.limitations || {});
      setState({
        status: "ready",
        items,
        offset,
        hasNext: Boolean(response.pagination?.has_next),
      });
    } catch (error) {
      onData?.([], {});
      setState({
        status:
          error.status === 401 || error.status === 403
            ? "unauthorized"
            : "error",
        items: [],
        offset,
        hasNext: false,
      });
    }
  };
  useEffect(() => {
    load(0, { severity: "", rule_id: "", evidence_type: "" });
  }, [seed]);
  const filter = (name, value) => {
    const next = { ...filters, [name]: value };
    setFilters(next);
    load(0, next);
  };
  return (
    <section
      className="sky-control-page__schema"
      aria-label="Forensic anomalies"
    >
      <h3>Anomalies</h3>
      <p>
        Anomaly signals indicate unusual or inconsistent application patterns.
        They are not findings of fraud or wrongdoing.
      </p>
      <div className="sky-control-page__filters">
        <select
          aria-label="Anomaly severity filter"
          value={filters.severity}
          onChange={(e) => filter("severity", e.target.value)}
        >
          <option value="">All severities</option>
          {["INFO", "LOW", "MEDIUM", "HIGH"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <input
          aria-label="Anomaly rule filter"
          value={filters.rule_id}
          onChange={(e) => filter("rule_id", e.target.value)}
          placeholder="Rule ID"
        />
        <select
          aria-label="Anomaly evidence type filter"
          value={filters.evidence_type}
          onChange={(e) => filter("evidence_type", e.target.value)}
        >
          <option value="">All evidence types</option>
          {timelineEvidenceTypes.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      {state.status === "loading" ? (
        <p>Loading anomalies...</p>
      ) : state.status === "unauthorized" ? (
        <p>Not authorized for Sky Control.</p>
      ) : state.status === "error" ? (
        <p>Anomalies unavailable</p>
      ) : !state.items.length ? (
        <p>No anomalies</p>
      ) : (
        state.items.map((item, index) => (
          <details key={item.anomaly_id || index}>
            <summary>
              Severity: {safeTimelineValue(item.severity)} | Rule:{" "}
              {safeTimelineValue(item.rule_id)} |{" "}
              {safeTimelineValue(item.title)}
            </summary>
            <p>Reason: {safeTimelineValue(item.reason)}</p>
            <p>Evidence Type: {safeTimelineValue(item.evidence_type)}</p>
            <p>Entities: {safeList(item.entity_ids)}</p>
            <p>Time: {formatSafeTime(item.timestamp)}</p>
            <button type="button">Why flagged</button>
            <p>Reason codes: {safeList(item.reason_codes)}</p>
            <p>Record IDs: {safeList(item.record_ids)}</p>
            <p>Entity IDs: {safeList(item.entity_ids)}</p>
            <p>Timestamps: {safeList(item.timestamps)}</p>
            <p>Metadata: {safeList(item.metadata?.matched_fields)}</p>
            <Provenance items={item.provenance || item.metadata?.provenance} />
          </details>
        ))
      )}
      <div className="sky-control-page__pagination">
        <button
          type="button"
          aria-label="Previous anomaly page"
          onClick={() => load(Math.max(0, state.offset - limit))}
          disabled={state.status === "loading" || state.offset === 0}
        >
          Previous
        </button>
        <span>Page {Math.floor(state.offset / limit) + 1}</span>
        <button
          type="button"
          aria-label="Next anomaly page"
          onClick={() => load(state.offset + limit)}
          disabled={state.status === "loading" || !state.hasNext}
        >
          Next
        </button>
      </div>
    </section>
  );
}

function EvidencePanel({ relationships = [], timeline = [], anomalies = [] }) {
  const rows = [
    ...relationships.map((x) => ({
      type: x.evidence_type,
      label: x.relationship_type,
      confidence: x.confidence,
      reasons: x.reason_codes,
      provenance: x.metadata?.provenance,
      timestamp: x.event_time,
    })),
    ...timeline.map((x) => ({
      type: x.evidence_type,
      label: timelineEventLabel(x.event_type),
      provenance: [
        {
          source_system: x.source_system,
          source_table: x.source_table,
          source_record_id: x.source_record_id,
        },
      ],
      timestamp: x.timestamp,
    })),
    ...anomalies.map((x) => ({
      type: x.evidence_type,
      label: x.title || x.rule_id,
      reasons: x.reason_codes,
      provenance: x.provenance || x.metadata?.provenance,
      timestamp: x.timestamp,
    })),
  ];
  return (
    <section
      className="sky-control-page__schema"
      aria-label="Forensic evidence"
    >
      <h3>Evidence</h3>
      {!rows.length ? (
        <p>No evidence records</p>
      ) : (
        rows.map((row, index) => (
          <article key={index}>
            <p>Evidence Type: {safeTimelineValue(row.type)}</p>
            <p>
              Relationship / Event / Anomaly: {safeTimelineValue(row.label)}
            </p>
            <p>
              Confidence:{" "}
              {row.confidence == null
                ? "-"
                : `${Math.round(Number(row.confidence) * 100)}%`}
            </p>
            <p>Reason Codes: {safeList(row.reasons)}</p>
            <p>Timestamp: {formatSafeTime(row.timestamp)}</p>
            <Provenance items={row.provenance} />
          </article>
        ))
      )}
    </section>
  );
}

function LimitationsPanel({ capabilities }) {
  const notes = [
    ["broad_admin_actions_available", "Broad admin-action history unavailable"],
    ["broad_invoices_available", "Broad invoice history unavailable"],
    [
      "invoice_status_timeline_available",
      "Invoice status timeline unavailable",
    ],
    ["invite_user_mismatch_rule_available", "Invite mismatch rule unavailable"],
  ].filter(([key]) => capabilities[key] === false);
  return (
    <section
      className="sky-control-page__schema"
      aria-label="Forensic limitations"
    >
      <h3>Limitations</h3>
      <p>
        Unavailable means the current safe read-only source contract does not
        provide sufficient evidence. Missing evidence should not be interpreted
        as proof that no activity occurred.
      </p>
      {notes.map(([, note]) => (
        <p key={note}>{note}</p>
      ))}
    </section>
  );
}

function CompactTable({ items }) {
  if (!items?.length)
    return (
      <div className="sky-control-page__empty">
        <p>No matching read-only records.</p>
      </div>
    );
  const columns = Object.keys(items[0])
    .filter(
      (key) =>
        !/(token|password|secret|authorization|cookie|key|seed|mnemonic)/i.test(
          key,
        ),
    )
    .slice(0, 10);
  return (
    <div className="sky-control-page__table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column.replaceAll("_", " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={
                item.id ||
                item.bot_id ||
                item.order_id ||
                `${index}-${item.user_id}`
              }
            >
              {columns.map((column) => (
                <td key={column}>
                  {typeof item[column] === "object"
                    ? JSON.stringify(item[column])
                    : String(item[column] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
