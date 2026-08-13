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
  controlSkyControlBot,
  fetchSkyControl,
  fetchSkyControlSummary,
  fetchSkyControlForensicAnomalies,
  fetchSkyControlForensicEntity,
  fetchSkyControlForensicExport,
  fetchSkyControlForensicGraph,
  fetchSkyControlForensicTimeline,
  fetchSkyControlPaymentCase,
  fetchSkyControlMoneyFlow,
  fetchSkyControlProviderHealth,
  fetchSkyControlTransaction,
  fetchSkyControlWallet,
  fetchSkyControlWalletAnomalies,
  fetchSkyControlWalletExport,
  buildSkyControlWalletExportParams,
  fetchSkyControlWalletHistory,
  searchSkyControlForensics,
  searchSkyControlPaymentCases,
  searchSkyControlWallets,
} from "../services/skyControlService";

const tabs = [
  "Command Center",
  "Global Search",
  "Gateway",
  "Bot Fleet",
  "Users",
  "Targets & Checks",
  "Keywords",
  "Orders / Payments",
  "Admin / Support",
  "Runtime & Events",
  "Forensics",
  "Wallet Intelligence",
  "Response Console",
  "Data Sources / Security",
];

const tabKey = (tab) =>
  tab
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const tabAliases = {
  overview: "command-center",
  "users-subscriptions": "users",
  "admin-timeline": "admin-support",
  payments: "orders-payments",
  channel: "runtime-events",
  security: "data-sources-security",
};

function runtimeProviderState(summary) {
  return String(summary?.runtime?.provider?.status || "").toUpperCase();
}

function runtimeDetail(value, fallback = "Not configured") {
  const status = String(value?.status || "").toUpperCase();
  if (status && status !== "UNKNOWN") return status;
  return value?.reason || fallback;
}

function overviewCards(summary) {
  const { health, overview, runtime } = summary || {};
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
      detail: runtimeDetail(runtime?.gateway, health?.database === "connected" ? "DB connected" : "Unavailable"),
    },
    {
      title: "Bot Manager",
      icon: Waypoints,
      detail:
        runtimeDetail(runtime?.manager, overview?.quick?.status === "available" ? "DB metadata available" : "Unavailable"),
    },
    {
      title: "Bot Fleet",
      icon: Cloud,
      detail: runtime?.fleet?.running != null || runtime?.fleet?.total != null
        ? `${runtime?.fleet?.running ?? "-"} / ${runtime?.fleet?.total ?? "-"} running`
        : fleet ? `${fleet.total} bots` : "Unavailable",
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
  "command-center": "/command-center",
  "global-search": "/global-search",
  gateway: "/overview",
  "bot-fleet": "/bot-fleet",
  users: "/users",
  "targets-checks": "/targets",
  keywords: "/keywords",
  "orders-payments": "/orders-payments",
  "admin-support": "/admin-support",
  "runtime-events": "/runtime/events",
  "response-console": "/response-console",
  "data-sources-security": "/data-sources",
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

function providerStatusMessage(summary) {
  const runtimeState = runtimeProviderState(summary);
  if (runtimeState === "AVAILABLE") return "LIVE READ-ONLY PostgreSQL provider + QMC Runtime Bridge.";
  if (runtimeState === "DEGRADED") return "PostgreSQL provider available. QMC Runtime Bridge degraded.";
  if (runtimeState === "NOT_CONFIGURED") return "PostgreSQL provider available. QMC Runtime Bridge not configured.";
  if (runtimeState === "AUTH_FAILED") return "QMC Runtime Bridge authentication failed.";
  if (runtimeState === "UNAVAILABLE") return "QMC Runtime Bridge unavailable.";
  switch (summary?.state) {
    case "connected":
      return "LIVE READ-ONLY PostgreSQL provider.";
    case "unauthorized":
      return "Not authorized for Sky Control.";
    case "unavailable":
      return "Read-only provider unavailable.";
    case "error":
      return "Read-only provider status unavailable.";
    default:
      return "Read-only provider status is loading.";
  }
}

function runtimeUtilityText(summary) {
  const control = summary?.runtime?.control || {};
  const runtimeState = runtimeProviderState(summary);
  if (control.enabled && control.operator_allowed) return "Runtime connected · Controls enabled";
  if (control.enabled) return "Runtime connected · Controls read-only";
  if (runtimeState === "AVAILABLE") return "Runtime connected · Controls unavailable";
  if (runtimeState === "NOT_CONFIGURED") return "Runtime not configured · Controls disabled";
  if (runtimeState === "DEGRADED") return "Runtime degraded · Controls disabled";
  if (runtimeState === "AUTH_FAILED") return "Runtime auth failed · Controls disabled";
  if (runtimeState === "UNAVAILABLE") return "Runtime unavailable · Controls disabled";
  return "Runtime status loading · Controls disabled";
}

function GatewayRuntimePanel({ summary }) {
  const runtime = summary?.runtime || {};
  const provider = runtime.provider || {};
  const cards = [
    {
      title: "Database Provider",
      detail: summary?.health?.database === "connected" ? "CONNECTED" : summary?.state === "connected" ? "AVAILABLE" : runtimeDetail({ status: summary?.state }),
      rows: {
        Provider: summary?.health?.provider || "postgresql",
        Mode: summary?.health?.mode || "read-only",
        Latency: summary?.health?.latency_ms != null ? `${summary.health.latency_ms} ms` : "-",
      },
    },
    {
      title: "Gateway Runtime",
      detail: runtimeDetail(runtime.gateway),
      rows: runtime.gateway || {},
    },
    {
      title: "Bot Manager Runtime",
      detail: runtimeDetail(runtime.manager),
      rows: runtime.manager || {},
    },
    {
      title: "Bot Fleet",
      detail: runtime?.fleet?.status || "UNKNOWN",
      rows: runtime.fleet || {},
    },
  ];
  return (
    <>
      {provider.reason ? (
        <p className="sky-control-page__notice">
          QMC Runtime Bridge: {provider.status || "UNKNOWN"} · {provider.reason}
        </p>
      ) : null}
      <div className="sky-control-page__card-grid">
        {cards.map((card) => (
          <article key={card.title} className="sky-control-page__card">
            <div className="sky-control-page__card-title">
              <ShieldCheck size={17} aria-hidden />
              <h3>{card.title}</h3>
            </div>
            <p>Status</p>
            <strong>{card.detail}</strong>
            {Object.entries(card.rows || {})
              .filter(([key]) => !/(token|password|secret|authorization|cookie|key|seed|mnemonic)/i.test(key))
              .slice(0, 6)
              .map(([key, value]) => (
                <small key={key}>
                  {key.replaceAll("_", " ")}: {safeDisplay(value)}
                </small>
              ))}
          </article>
        ))}
      </div>
    </>
  );
}

function BotRuntimeControls({ summary, onRefresh }) {
  const [targetUserId, setTargetUserId] = useState("");
  const [controlState, setControlState] = useState({ state: "idle" });
  const control = summary?.runtime?.control || {};
  const runtimeReady = Boolean(control.runtime_available);
  const operatorAllowed = Boolean(control.operator_allowed);
  const enabled = Boolean(control.enabled && runtimeReady && operatorAllowed);

  const performAction = (action) => {
    const userId = targetUserId.trim();
    if (!userId) {
      setControlState({ state: "error", message: "Enter a target user ID." });
      return;
    }
    if (["stop", "restart"].includes(action)) {
      const confirmed = window.confirm(`${action === "restart" ? "Restart" : "Stop"} bot for user ${userId}?`);
      if (!confirmed) return;
    }
    setControlState({ state: "loading", message: `${action.toUpperCase()} requested...` });
    controlSkyControlBot(userId, action)
      .then((result) => {
        setControlState({
          state: "success",
          message: result?.status || result?.result || `${action.toUpperCase()} accepted`,
        });
        onRefresh?.();
      })
      .catch((error) => {
        setControlState({
          state: "error",
          message: error?.message || `${action.toUpperCase()} failed`,
        });
      });
  };

  return (
    <section className="sky-control-page__runtime-controls" aria-label="Bot runtime controls">
      <div>
        <span className="sky-control-page__eyebrow">RUNTIME CONTROL</span>
        <h3>Personal bot controls</h3>
        <p>
          {enabled
            ? "Controls are routed through the authenticated QMC Runtime Bridge."
            : operatorAllowed
              ? "Runtime controls are not available until the bridge is configured and reachable."
              : "Runtime controls are hidden for read-only operators."}
        </p>
      </div>
      {operatorAllowed ? (
        <div className="sky-control-page__runtime-control-form">
          <input
            aria-label="Target user ID"
            value={targetUserId}
            onChange={(event) => setTargetUserId(event.target.value)}
            placeholder="Target user ID"
            disabled={!enabled || controlState.state === "loading"}
          />
          {["start", "stop", "restart"].map((action) => (
            <button
              key={action}
              type="button"
              className="sky-control-page__action"
              disabled={!enabled || controlState.state === "loading"}
              onClick={() => performAction(action)}
            >
              {action.toUpperCase()}
            </button>
          ))}
        </div>
      ) : null}
      {controlState.message ? (
        <p className={`sky-control-page__control-result is-${controlState.state}`}>
          {controlState.message}
        </p>
      ) : null}
    </section>
  );
}

function botProfileLabel(bot) {
  return (
    bot?.bot_username ||
    bot?.username ||
    bot?.telegram_username ||
    bot?.bot_id ||
    bot?.user_id ||
    "Selected bot"
  );
}

function safeBotProfileRows(bot) {
  if (!bot) return [];
  return Object.entries(bot)
    .filter(([key]) => !/(token|password|secret|authorization|cookie|key|seed|mnemonic)/i.test(key))
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .slice(0, 18);
}

function BotFleetRuntimeTable({ items, selectedBot, onSelectBot, onCloseProfile }) {
  if (!items?.length)
    return (
      <div className="sky-control-page__empty">
        <p>No matching read-only bot records.</p>
      </div>
    );

  const selectedKey =
    selectedBot?.bot_id || selectedBot?.user_id || selectedBot?.id || botProfileLabel(selectedBot);
  const columns = [
    ["bot_username", "Bot"],
    ["user_id", "User ID"],
    ["bot_id", "Bot ID"],
    ["subscription_status", "Subscription"],
    ["status", "DB status"],
    ["runtime_status", "Runtime"],
    ["pid", "PID"],
    ["heartbeat_age", "Heartbeat age"],
    ["last_error", "Last error"],
  ];

  return (
    <>
      <div className="sky-control-page__table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map(([, label]) => (
                <th key={label}>{label}</th>
              ))}
              <th>Profile</th>
            </tr>
          </thead>
          <tbody>
            {items.map((bot, index) => {
              const rowKey = bot.bot_id || bot.user_id || bot.id || `${index}-${botProfileLabel(bot)}`;
              return (
                <tr key={rowKey} className={rowKey === selectedKey ? "is-selected" : ""}>
                  {columns.map(([key]) => (
                    <td key={key}>{safeDisplay(bot[key])}</td>
                  ))}
                  <td>
                    <button
                      type="button"
                      className="sky-control-page__action"
                      onClick={() => onSelectBot(bot)}
                      aria-label={`Open bot profile ${botProfileLabel(bot)}`}
                    >
                      Open profile
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedBot ? (
        <aside className="sky-control-page__bot-profile" aria-label="Bot profile">
          <div className="sky-control-page__bot-profile-head">
            <div>
              <span className="sky-control-page__eyebrow">BOT PROFILE</span>
              <h3>{botProfileLabel(selectedBot)}</h3>
              <p>
                Runtime: {safeDisplay(selectedBot.runtime_status || selectedBot.status)} · Owner:{" "}
                {safeDisplay(selectedBot.user_id)}
              </p>
            </div>
            <button type="button" className="sky-control-page__action" onClick={onCloseProfile}>
              Close profile
            </button>
          </div>
          <div className="sky-control-page__bot-profile-grid">
            {safeBotProfileRows(selectedBot).map(([key, value]) => (
              <div key={key}>
                <span>{key.replaceAll("_", " ")}</span>
                <strong>{safeDisplay(value)}</strong>
              </div>
            ))}
          </div>
          <p className="sky-control-page__bot-profile-note">
            Controls use only the selected user ID through the QMC Runtime Bridge. No Telegram token,
            process secret, or arbitrary PID is accepted by this UI.
          </p>
        </aside>
      ) : null}
    </>
  );
}

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
  const [selectedBot, setSelectedBot] = useState(null);
  const requestedTab = searchParams.get("tab");
  const normalizedRequestedTab = tabAliases[requestedTab] || requestedTab;
  const activeTab = tabs.some((tab) => tabKey(tab) === normalizedRequestedTab)
    ? normalizedRequestedTab
    : "command-center";

  const refreshSummary = (signal) => {
    setSummary((current) => ({ ...current, state: "loading" }));
    return fetchSkyControlSummary(signal)
      .then(({ health, overview, schema, runtime }) =>
        setSummary({
          state: "connected",
          health,
          overview,
          schema,
          runtime,
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
    if (!summary.refreshedAt) return undefined;
    const runtimeState = runtimeProviderState(summary);
    const delay = runtimeState === "UNAVAILABLE" || runtimeState === "AUTH_FAILED"
      ? 45000
      : Number(summary.runtime?.poll_ms) || 25000;
    const timer = setTimeout(() => refreshSummary(), Math.min(Math.max(delay, 10000), 120000));
    return () => clearTimeout(timer);
  }, [summary.refreshedAt, summary.runtime?.provider?.status]);

  useEffect(() => {
    const endpoint = endpointByTab[activeTab];
    if (!endpoint || ["forensics", "wallet-intelligence"].includes(activeTab)) return undefined;
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
    if (nextTab !== "bot-fleet") setSelectedBot(null);
    setSearchParams(nextTab === "command-center" ? {} : { tab: nextTab }, {
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
            <span>{providerStatusMessage(summary)}</span>
          </div>
        </div>
        <div className="sky-control-page__utility">
          <span>{runtimeUtilityText(summary)}</span>
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
        {activeTab === "command-center" ? (
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
            <CommandCenterWorkspace data={data} />
          </>
        ) : activeTab === "forensics" ? (
          <ForensicsWorkspace />
        ) : activeTab === "wallet-intelligence" ? (
          <WalletIntelligenceWorkspace />
        ) : (
          <div className="sky-control-page__workspace">
            <div className="sky-control-page__workspace-head">
              <div>
                <span className="sky-control-page__eyebrow">
                  LIVE READ-ONLY
                </span>
                <h2>{tabs.find((tab) => tabKey(tab) === activeTab)}</h2>
              </div>
              {["bot-fleet", "users", "admin-support", "orders-payments"].includes(activeTab) && (
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
            {["bot-fleet", "users", "global-search"].includes(activeTab) && (
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
              <GatewayRuntimePanel summary={summary} />
            )}
            {activeTab === "global-search" && (
              <GlobalSearchWorkspace data={data} query={filters.search} />
            )}
            {activeTab === "bot-fleet" && (
              <BotRuntimeControls summary={summary} onRefresh={refreshSummary} />
            )}
            {activeTab === "bot-fleet" &&
              (data.state === "connected" ? (
                <BotFleetRuntimeTable
                  items={data.items}
                  selectedBot={selectedBot}
                  onSelectBot={setSelectedBot}
                  onCloseProfile={() => setSelectedBot(null)}
                />
              ) : (
                <div className="sky-control-page__empty">
                  <Cloud size={19} aria-hidden />
                  <p>
                    {data.state === "unauthorized"
                      ? "Not authorized for Sky Control."
                      : data.state === "loading"
                        ? "Loading read-only bot data..."
                        : "Bot runtime data unavailable or schema incompatible."}
                  </p>
                </div>
              ))}
            {activeTab === "response-console" && (
              <ResponseConsoleWorkspace data={data} />
            )}
            {activeTab === "data-sources-security" && (
              <DataSourcesWorkspace summary={summary} data={data} />
            )}
            {[
              "targets-checks",
              "keywords",
              "orders-payments",
              "admin-support",
              "runtime-events",
            ].includes(activeTab) && (
              <QmcRecordsWorkspace data={data} />
            )}
            {![
              "gateway",
              "global-search",
              "bot-fleet",
              "response-console",
              "data-sources-security",
              "targets-checks",
              "keywords",
              "orders-payments",
              "admin-support",
              "runtime-events",
            ].includes(activeTab) &&
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

function sourceStatusList(sourceStatus) {
  return Object.entries(sourceStatus || {}).map(([source, status]) => ({
    source,
    status: status?.available ? "available" : status?.reason || "unavailable",
  }));
}

function CommandCenterWorkspace({ data }) {
  if (data.state === "loading" || data.state === "idle") {
    return (
      <div className="sky-control-page__empty">
        <Cloud size={19} aria-hidden />
        <p>Loading QMC command center...</p>
      </div>
    );
  }
  if (data.state !== "connected") {
    return (
      <div className="sky-control-page__notice">
        Command Center data is temporarily unavailable. Existing read-only
        sections remain accessible.
      </div>
    );
  }
  return (
    <section className="sky-control-page__qmc-stack" aria-label="QMC command center">
      <div className="sky-control-page__metric-grid">
        {(data.cards || []).map((card) => (
          <article key={card.title}>
            <span>{card.title}</span>
            <strong>{safeDisplay(card.value)}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </div>
      <SourceStatusPanel sourceStatus={data.source_status} />
      {Object.entries(data.recent || {}).map(([label, items]) => (
        <section key={label} className="sky-control-page__qmc-section">
          <h3>{label.replaceAll("_", " ")}</h3>
          <CompactTable items={items} />
        </section>
      ))}
    </section>
  );
}

function GlobalSearchWorkspace({ data, query }) {
  if (!query) {
    return (
      <div className="sky-control-page__empty">
        <FileSearch size={19} aria-hidden />
        <p>Search users, bots, orders, payments, targets, checks, keywords, or support records by exact text.</p>
      </div>
    );
  }
  if (data.state !== "connected") {
    return (
      <div className="sky-control-page__empty">
        <FileSearch size={19} aria-hidden />
        <p>{data.state === "loading" ? "Searching read-only sources..." : "Search data unavailable."}</p>
      </div>
    );
  }
  return (
    <section className="sky-control-page__qmc-stack" aria-label="Global search results">
      <SourceStatusPanel sourceStatus={data.source_status} />
      <CompactTable items={data.items} />
    </section>
  );
}

function QmcRecordsWorkspace({ data }) {
  if (data.state !== "connected") {
    return (
      <div className="sky-control-page__empty">
        <Cloud size={19} aria-hidden />
        <p>{data.state === "loading" ? "Loading read-only QMC data..." : "QMC data unavailable."}</p>
      </div>
    );
  }
  return (
    <section className="sky-control-page__qmc-stack" aria-label="QMC records">
      <SourceStatusPanel sourceStatus={data.source_status} />
      {data.records ? (
        Object.entries(data.records).map(([label, payload]) => (
          <section key={label} className="sky-control-page__qmc-section">
            <h3>{label.replaceAll("_", " ")}</h3>
            <CompactTable items={payload?.items || []} />
          </section>
        ))
      ) : (
        <CompactTable items={data.items} />
      )}
    </section>
  );
}

function ResponseConsoleWorkspace({ data }) {
  if (data.state !== "connected") {
    return (
      <div className="sky-control-page__empty">
        <ShieldCheck size={19} aria-hidden />
        <p>{data.state === "loading" ? "Loading read-only response console..." : "Response console unavailable."}</p>
      </div>
    );
  }
  return (
    <section className="sky-control-page__qmc-stack" aria-label="Read-only response console">
      <div className="sky-control-page__notice">
        Response Console is read-only. Operational controls remain disabled.
      </div>
      <CompactTable items={data.actions || []} />
      <ul className="sky-control-page__plain-list">
        {(data.limitations || []).map((limitation) => (
          <li key={limitation}>{limitation}</li>
        ))}
      </ul>
    </section>
  );
}

function DataSourcesWorkspace({ summary, data }) {
  return (
    <section className="sky-control-page__qmc-stack" aria-label="Data sources and security">
      <div className="sky-control-page__security">
        <strong>
          Sky Control DB role:{" "}
          {summary.state === "connected" ? "READ ONLY CONFIGURED" : "UNAVAILABLE"}
        </strong>
        <span>Sensitive projections: excluded</span>
        <span>Response redaction: enabled</span>
        <span>Telegram: NOT CONNECTED</span>
        <span>SSH: NOT CONNECTED</span>
        <span>Write operations: DISABLED</span>
      </div>
      {data.state === "connected" ? (
        <>
          <SourceStatusPanel sourceStatus={data.source_status} />
          <CompactTable items={data.tables || []} />
        </>
      ) : (
        <div className="sky-control-page__empty">
          <ShieldCheck size={19} aria-hidden />
          <p>{data.state === "loading" ? "Loading source inventory..." : "Provider data is not available yet."}</p>
        </div>
      )}
    </section>
  );
}

function SourceStatusPanel({ sourceStatus }) {
  const statuses = sourceStatusList(sourceStatus);
  if (!statuses.length) return null;
  return (
    <section className="sky-control-page__source-status" aria-label="Source status">
      <h3>Source status</h3>
      <div>
        {statuses.map(({ source, status }) => (
          <span key={source}>
            <strong>{source.replaceAll("_", " ")}</strong>
            {status}
          </span>
        ))}
      </div>
    </section>
  );
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

const quickMailConfiguredDestinations = [
  { asset: "BTC", network: "Bitcoin", chain: "bitcoin", address: "12HTqXH3uZN4mLfYM5FJsBqvuFN4UHEm4X" },
  { asset: "ETH / USDT ERC20", network: "Ethereum", chain: "ethereum", address: "0xcd45dab8c93e7ef2b622ca1bb912372d319400a2" },
  { asset: "LTC", network: "Litecoin", chain: "litecoin", address: "LQ2GDsKabeY1zNMYEiT5Zv54Fw1sPMBn4D" },
  { asset: "SOL", network: "Solana", chain: "solana", address: "GWv6za4FvTXczpyX5y9zmhiCNbfRaqnWVv6NbjuwAL4G" },
  { asset: "USDT TRC20", network: "TRON", chain: "tron", address: "TLGPCqkDjup1muQETYht71jnrriLHVVfC7" },
].map((item) => ({
  ...item,
  classification: "CONFIGURED_PAYMENT_DESTINATION",
  ownership: "UNPROVEN",
  source: "QuickMailChecker source evidence",
}));

const providerStatusText = (providers, chain) => providers?.[chain]?.status || "NOT_CONFIGURED";

function WalletIntelligenceDefaultDashboard({ dashboard, onSelectSeed }) {
  const providers = dashboard.providerHealth?.providers || {};
  const historyItems = dashboard.history?.items || [];
  const anomalies = dashboard.anomalies?.anomalies || [];
  const payments = dashboard.payments?.items || [];
  const admins = dashboard.admins?.items || [];
  const changed = historyItems.filter((item) => item.previous_address || item.next_address || item.observed_change_window).slice(0, 8);
  const recentReferences = payments.filter((item) => item.reference_value || item.transaction_id || item.payment_reference || item.tx_hash).slice(0, 8);
  const crossSystem = anomalies.filter((item) => item.rule_id === "SAME_WITHDRAW_DESTINATION_MULTI_SYSTEM").slice(0, 8);
  const adminRows = admins.slice(0, 8);
  const selectConfiguredWallet = (item) => onSelectSeed({
    entity_type: "WALLET",
    entity_id: item.address,
    label: `${item.asset} configured destination`,
    chain: item.chain,
    address: item.address,
    safe_metadata: { classification: item.classification, ownership: item.ownership, source: item.source },
  });
  return <div className="sky-control-page__wallet-dashboard" aria-label="Wallet Intelligence default dashboard">
    <StatusList title="Provider Coverage" items={providers} empty="Provider coverage unavailable." />
    <section className="sky-control-page__wallet-panel" aria-label="QuickMailChecker Configured Payment Destinations">
      <div className="sky-control-page__card-title"><div><span className="sky-control-page__eyebrow">SOURCE-CONFIGURED</span><h3>QuickMailChecker Configured Payment Destinations</h3></div><span className="sky-control-page__badge">ownership: UNPROVEN</span></div>
      <p className="sky-control-page__wallet-empty">Configured destinations are investigative pivots. They are not authenticated user wallets and do not prove receipt or ownership.</p>
      <div className="sky-control-page__table-wrap"><table><thead><tr><th>Asset</th><th>Network</th><th>Address</th><th>Classification</th><th>Ownership</th><th>Provider</th><th>Actions</th></tr></thead><tbody>{quickMailConfiguredDestinations.map((item) => <tr key={item.address}><td>{item.asset}</td><td>{item.network}</td><td><button type="button" onClick={() => selectConfiguredWallet(item)}>{compactIdentifier(item.address)}</button></td><td>{item.classification}</td><td>{item.ownership}</td><td>{providerStatusText(providers, item.chain)}</td><td><button type="button" onClick={() => selectConfiguredWallet(item)}>Open Wallet Profile</button><button type="button" onClick={() => selectConfiguredWallet(item)}>Application Links</button><button type="button" onClick={() => selectConfiguredWallet(item)}>Transactions</button><button type="button" onClick={() => selectConfiguredWallet(item)}>Money Flow</button><button type="button" onClick={() => selectConfiguredWallet(item)}>Evidence</button></td></tr>)}</tbody></table></div>
    </section>
    <section className="sky-control-page__wallet-panel" aria-label="Observed Application Payment Destinations">
      <div className="sky-control-page__card-title"><div><span className="sky-control-page__eyebrow">APPLICATION-OBSERVED</span><h3>Observed Application Payment Destinations</h3></div><span className="sky-control-page__badge">{historyItems.length} observed</span></div>
      {historyItems.length ? <div className="sky-control-page__table-wrap"><table><thead><tr><th>System</th><th>Address</th><th>First seen</th><th>Last seen</th><th>Evidence</th></tr></thead><tbody>{historyItems.slice(0, 12).map((item, index) => <tr key={`${item.system}-${item.address}-${index}`}><td>{safeDisplay(item.system)}</td><td><button type="button" onClick={() => onSelectSeed({ entity_type: "WALLET", entity_id: item.address, address: item.address, chain: item.chain || "bsc", label: item.address })}>{compactIdentifier(item.address)}</button></td><td>{timeLabel(item.first_seen)}</td><td>{timeLabel(item.last_seen)}</td><td>DIRECT</td></tr>)}</tbody></table></div> : <p className="sky-control-page__wallet-empty">No application-observed payment destinations are currently available from approved sources.</p>}
    </section>
    <section className="sky-control-page__wallet-panel" aria-label="Recent Wallet Configuration Changes">
      <div className="sky-control-page__card-title"><div><span className="sky-control-page__eyebrow">CHANGE HISTORY</span><h3>Recent Wallet Configuration Changes</h3></div><span className="sky-control-page__badge">{changed.length} changes</span></div>
      {changed.length ? <div className="sky-control-page__mini-grid">{changed.map((item, index) => <article key={`${item.address}-${index}`}><strong>{compactIdentifier(item.address)}</strong><span>{safeDisplay(item.system)}</span><small>{compactIdentifier(item.previous_address)} -> {compactIdentifier(item.address)}</small><small>{timeLabel(item.observed_change_window?.end || item.last_seen)}</small></article>)}</div> : <p className="sky-control-page__wallet-empty">No wallet destination change records are visible in the current approved inventory.</p>}
    </section>
    <section className="sky-control-page__wallet-panel" aria-label="Cross-System Wallet Reuse">
      <div className="sky-control-page__card-title"><div><span className="sky-control-page__eyebrow">CORRELATED</span><h3>Cross-System Wallet Reuse</h3></div><span className="sky-control-page__badge">{crossSystem.length} signals</span></div>
      {crossSystem.length ? <div className="sky-control-page__mini-grid">{crossSystem.map((item, index) => <article key={`${item.address}-${index}`}><strong>{compactIdentifier(item.address)}</strong><span>{safeDisplay(item.rule_id)}</span><small>{(item.reason_codes || []).join(", ")}</small></article>)}</div> : <p className="sky-control-page__wallet-empty">No exact cross-system destination reuse is visible from current sources.</p>}
    </section>
    <section className="sky-control-page__wallet-panel" aria-label="Recent Payment Transaction References">
      <div className="sky-control-page__card-title"><div><span className="sky-control-page__eyebrow">REFERENCES</span><h3>Recent Payment / Transaction References</h3></div><span className="sky-control-page__badge">{recentReferences.length} references</span></div>
      {recentReferences.length ? <div className="sky-control-page__table-wrap"><table><thead><tr><th>System</th><th>Order</th><th>Reference</th><th>Status</th><th>Action</th></tr></thead><tbody>{recentReferences.map((item, index) => { const reference = item.reference_value || item.transaction_id || item.payment_reference || item.tx_hash; return <tr key={`${item.system}-${item.order_id}-${index}`}><td>{safeDisplay(item.system)}</td><td>{safeDisplay(item.order_id)}</td><td>{compactIdentifier(reference)}</td><td>{safeDisplay(item.status || item.payment_status)}</td><td><button type="button" onClick={() => onSelectSeed({ entity_type: "PAYMENT_REFERENCE", entity_id: reference, label: reference, system: item.system })}>Open case</button></td></tr>; })}</tbody></table></div> : <p className="sky-control-page__wallet-empty">No recent payment or transaction references are available from the current payment provider response.</p>}
    </section>
    <section className="sky-control-page__wallet-panel" aria-label="Admin Wallet Activity summary">
      <div className="sky-control-page__card-title"><div><span className="sky-control-page__eyebrow">ADMIN ACTIVITY</span><h3>Admin ↔ Wallet Activity summary</h3></div><span className="sky-control-page__badge">read-only</span></div>
      {adminRows.length ? <div className="sky-control-page__mini-grid">{adminRows.map((item, index) => <button type="button" key={`${item.admin_id || item.id}-${index}`} onClick={() => onSelectSeed({ entity_type: "ADMIN", entity_id: String(item.admin_id || item.id), label: String(item.admin_id || item.id), system: item.system })}><strong>{safeDisplay(item.admin_id || item.id)}</strong><span>{safeDisplay(item.system || item.source_system)}</span><small>{timeLabel(item.last_seen || item.created_at || item.event_time)}</small></button>)}</div> : <p className="sky-control-page__wallet-empty">Broad admin-action history is not available unless explicitly provided by approved read-only sources.</p>}
    </section>
  </div>;
}

function WalletIntelligenceWorkspace() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ status: "idle", candidates: [], seed: null, caseData: null, wallet: null, transaction: null, flow: null, history: null, anomalies: null, adminProfile: null, error: null });
  const [dashboard, setDashboard] = useState({ status: "loading", providerHealth: null, history: null, anomalies: null, payments: null, admins: null, error: null });
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      fetchSkyControlProviderHealth(),
      fetchSkyControlWalletHistory(),
      fetchSkyControlWalletAnomalies(),
      fetchSkyControl("/payments", { params: { limit: 25 } }),
      fetchSkyControl("/admins", { params: { limit: 25 } }),
    ]).then(([providerHealth, history, anomalies, payments, admins]) => {
      if (!active) return;
      const payload = {
        status: "ready",
        providerHealth: providerHealth.status === "fulfilled" ? providerHealth.value : null,
        history: history.status === "fulfilled" ? history.value : null,
        anomalies: anomalies.status === "fulfilled" ? anomalies.value : null,
        payments: payments.status === "fulfilled" ? payments.value : null,
        admins: admins.status === "fulfilled" ? admins.value : null,
        error: null,
      };
      if (![providerHealth, history, anomalies, payments, admins].some((result) => result.status === "fulfilled")) {
        payload.status = "unavailable";
        payload.error = "Wallet Intelligence dashboard sources are currently unavailable.";
      }
      setDashboard(payload);
    });
    return () => { active = false; };
  }, []);
  const submit = async (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return setState((current) => ({ ...current, status: "error", error: "Enter an exact identifier." }));
    setState({ status: "searching", candidates: [], seed: null, caseData: null, wallet: null, transaction: null, flow: null, history: null, anomalies: null, adminProfile: null, error: null });
    try {
      const [cases, wallets] = await Promise.all([searchSkyControlPaymentCases(value), searchSkyControlWallets(value)]);
      const candidates = [...(cases.candidates || []), ...(wallets.candidates || [])].filter((candidate, index, all) => all.findIndex((item) => `${item.entity_type}:${item.entity_id}:${item.chain || ""}` === `${candidate.entity_type}:${candidate.entity_id}:${candidate.chain || ""}`) === index);
      setState({ status: "searched", candidates, seed: null, caseData: null, wallet: null, transaction: null, flow: null, history: null, anomalies: null, adminProfile: null, error: null });
    } catch (error) { setState({ status: "error", candidates: [], seed: null, caseData: null, wallet: null, transaction: null, flow: null, history: null, anomalies: null, adminProfile: null, error: walletErrorMessage(error) }); }
  };
  const selectSeed = async (seed) => {
    setState((current) => ({ ...current, status: "loading", seed, caseData: null, wallet: null, transaction: null, flow: null, history: null, anomalies: null, adminProfile: null, error: null }));
    try {
      const configuredSeed = seed.safe_metadata?.classification === "CONFIGURED_PAYMENT_DESTINATION";
      const supportedProfileChain = ["ethereum", "bsc", "base"].includes(String(seed.chain || "").toLowerCase());
      const caseData = await fetchSkyControlPaymentCase(seed.entity_type, seed.entity_id).catch(() => null);
      const address = seed.entity_type === "WALLET" ? (seed.address || seed.entity_id) : null;
      const chain = seed.chain || "bsc";
      const [wallet, transaction, flow, history, anomalies, adminProfile] = await Promise.all([
        address && (!configuredSeed || supportedProfileChain) ? Promise.resolve(fetchSkyControlWallet(chain, address)).catch(() => null) : null,
        seed.entity_type === "TRANSACTION" ? Promise.resolve(fetchSkyControlTransaction(chain, seed.entity_id)).catch(() => null) : null,
        address && (!configuredSeed || supportedProfileChain) ? Promise.resolve(fetchSkyControlMoneyFlow({ chain, address, depth: 2, direction: "BOTH" })).catch(() => null) : null,
        Promise.resolve(fetchSkyControlWalletHistory()).catch(() => null), Promise.resolve(fetchSkyControlWalletAnomalies()).catch(() => null),
        seed.entity_type === "ADMIN" ? Promise.resolve(fetchSkyControl(`/admins/${encodeURIComponent(seed.entity_id)}`, { params: { limit: 50 } })).catch(() => null) : null,
      ]);
      const staticWallet = configuredSeed ? { address, chain, classification: seed.safe_metadata?.classification, ownership_status: seed.safe_metadata?.ownership, application_systems: ["QuickMailChecker"], linked_orders: [], linked_payments: [], linked_users: [], linked_admin_actions: [], service_labels: [], withdrawal_destination_history: [], provider_status: dashboard.providerHealth?.providers, limitations: ["Configured payment destination is a source-configured investigative seed. It does not prove wallet ownership or receipt.", supportedProfileChain ? "Provider data may be limited for this configured destination." : "On-chain provider lookup is not configured for this network."], read_only: true } : null;
      if (!caseData && !wallet && !transaction && !staticWallet && !adminProfile) throw new Error("case unavailable");
      setState((current) => ({ ...current, status: "ready", caseData, wallet: wallet || staticWallet, transaction, flow, history, anomalies, adminProfile, error: null }));
    } catch (error) { setState((current) => ({ ...current, status: "error", caseData: null, wallet: null, transaction: null, flow: null, history: null, anomalies: null, adminProfile: null, error: walletErrorMessage(error) })); }
  };
  const summary = state.caseData?.summary || state.wallet || {};
  const discoveryMetrics = observedPaymentDestinationMetrics({ summary, wallet: state.wallet || {}, history: state.history || {}, caseData: state.caseData || {} });
  const metrics = [["Seed", state.seed?.label || state.seed?.entity_id], ["Chains", state.seed?.chain || summary.chain], ["Wallet Count", summary.wallet_count], ["Transaction Count", summary.transaction_count], ["Payment Count", summary.payment_count], ["Order Count", summary.order_count], ["User Count", summary.user_count], ["Admin Activity Count", summary.admin_activity_count], ["Counterparty Count", summary.counterparty_count], ["Service Label Count", summary.service_label_count], ["Graph Nodes", summary.graph_nodes], ["Graph Edges", summary.graph_edges], ["First Event", summary.first_event], ["Last Event", summary.last_event], ["Known Service Hits", summary.known_service_hits], ["Anomaly Count", summary.anomaly_count], ["Depth", summary.depth], ["Read Only", summary.read_only ?? state.caseData?.read_only]];
  return <div className="sky-control-page__wallet-workspace">
    <div className="sky-control-page__workspace-head"><div><span className="sky-control-page__eyebrow">READ-ONLY CASE WORKSPACE</span><h2>Wallet Intelligence</h2></div></div>
    <form className="sky-control-page__wallet-search" onSubmit={submit}><label htmlFor="wallet-intelligence-search">Exact identifier</label><div><input id="wallet-intelligence-search" aria-label="Wallet Intelligence search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Wallet, transaction, payment reference, order, payment, user, or admin ID" /><button type="submit">Search</button></div></form>
    {dashboard.status === "loading" ? <div className="sky-control-page__empty"><FileSearch size={19} aria-hidden /><p>Loading read-only Wallet Intelligence dashboard...</p></div> : <WalletIntelligenceDefaultDashboard dashboard={dashboard} onSelectSeed={selectSeed} />}
    {state.error ? <p className="sky-control-page__notice" role="alert">{state.error}</p> : null}
    {state.status === "searched" ? <section className="sky-control-page__wallet-candidates" aria-label="Wallet Intelligence candidates"><h3>Exact candidates</h3>{state.candidates.length ? <div>{state.candidates.map((candidate) => <button type="button" key={`${candidate.entity_type}:${candidate.entity_id}:${candidate.chain || ""}`} onClick={() => selectSeed(candidate)}><strong>{safeDisplay(candidate.entity_type)}</strong><span>{safeDisplay(candidate.label || candidate.entity_id)}</span><small>{[candidate.system, candidate.chain].filter(Boolean).join(" · ") || "Application reference"}</small></button>)}</div> : <p>No exact candidates found.</p>}</section> : null}
    {state.status === "loading" ? <div className="sky-control-page__empty"><p>Loading selected read-only case...</p></div> : null}
    {state.status === "ready" ? <><section className="sky-control-page__wallet-summary sky-control-page__wallet-discovery" aria-label="Observed Payment Destinations"><span className="sky-control-page__eyebrow">AUTOMATIC DISCOVERY</span><h3>Observed Payment Destinations</h3><p className="sky-control-page__wallet-empty">Configured and application-observed destinations are not evidence of receipt or ownership.</p><div>{discoveryMetrics.map(([label, value]) => <article key={label}><span>{label}</span><strong>{safeDisplay(value)}</strong></article>)}</div></section><section className="sky-control-page__wallet-summary" aria-label="Wallet case summary"><h3>Case summary</h3><div>{metrics.map(([label, value]) => <article key={label}><span>{label}</span><strong>{safeDisplay(value)}</strong></article>)}</div></section><WalletDetailViews seed={state.seed} wallet={state.wallet} transaction={state.transaction} flow={state.flow} history={state.history} anomalies={state.anomalies} caseData={state.caseData} adminProfile={state.adminProfile} /><div className="sky-control-page__wallet-status-grid"><StatusList title="Provider status" items={state.wallet?.provider_status || state.transaction?.provider_status || state.caseData?.provider_status} empty="Provider status unavailable for this selected seed." /><StatusList title="Application source status" items={state.caseData?.source_status || state.wallet?.source_status || state.transaction?.source_status} empty="Application source status unavailable for this selected seed." /></div><section className="sky-control-page__wallet-limitations" aria-label="Wallet Intelligence limitations"><h3>Limitations</h3><ul>{(state.caseData?.limitations || state.wallet?.limitations || ["Missing activity is not proof of no activity."]).map((item) => <li key={item}>{safeDisplay(item)}</li>)}</ul></section><section className="sky-control-page__legend" aria-label="Wallet evidence legend"><h3>Evidence semantics</h3><div>{walletEvidenceLegend.map(([type, explanation]) => <p key={type}><strong>{type}</strong><span>{explanation}</span></p>)}</div></section></> : null}
  </div>;
}

const compactIdentifier = (value) => {
  const text = safeDisplay(value);
  return text.length > 18 ? `${text.slice(0, 10)}...${text.slice(-6)}` : text;
};

function observedPaymentDestinationMetrics({ summary = {}, wallet = {}, history = {}, caseData = {} } = {}) {
  const items = Array.isArray(history?.items) ? history.items : Array.isArray(caseData?.wallet_history) ? caseData.wallet_history : [];
  const normalizedAddress = (value) => String(value || "").trim().toLowerCase();
  const addressGroups = new Map();
  items.forEach((item) => {
    const address = normalizedAddress(item.address);
    if (!address) return;
    const list = addressGroups.get(address) || [];
    list.push(item);
    addressGroups.set(address, list);
  });
  const addressCount = [...addressGroups.keys()].length || Number(summary.wallet_count || 0) || items.length;
  const applicationLinkedCount = items.filter((item) => item.user_id != null || item.system || item.source_table).length;
  const verifiedOnChainCount = items.filter((item) => item.onchain_confirmed || item.verified_onchain || item.first_seen_chain || item.last_seen_chain).length;
  const applicationOnlyCount = items.filter((item) => !(item.onchain_confirmed || item.verified_onchain || item.first_seen_chain || item.last_seen_chain)).length;
  const adminActivityCount = items.filter((item) => item.admin_id || (Array.isArray(item.admin_ids) && item.admin_ids.length) || item.admin_activity_count).length;
  const multiSystemCount = [...addressGroups.values()].filter((rows) => new Set(rows.map((item) => String(item.system || "").trim()).filter(Boolean)).size > 1).length;
  const destinationChangeCount = items.filter((item) => item.previous_address || item.next_address || item.observed_change_window || item.return_to_previous).length;
  const reusedDestinationCount = items.filter((item) => Number(item.reuse_count || 0) > 1 || item.return_to_previous).length;
  const knownServiceHits = Number(summary.known_service_hits ?? wallet?.service_labels?.length ?? caseData?.summary?.known_service_hits ?? 0);
  return [
    ["Total destinations", addressCount],
    ["Application-linked destinations", applicationLinkedCount],
    ["Verified on-chain destinations", verifiedOnChainCount],
    ["Application-only destinations", applicationOnlyCount],
    ["Destinations with admin activity", adminActivityCount],
    ["Multi-system destinations", multiSystemCount],
    ["Destination changes", destinationChangeCount],
    ["Reused destinations", reusedDestinationCount],
    ["Known service hits", knownServiceHits],
  ];
}

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

function WalletRecordDrawer({ type, record, onClose }) {
  const title = type === "transaction" ? "Transaction Drawer" : type === "service" ? "Service Drawer" : "Wallet Drawer";
  const entries = type === "transaction"
    ? [["Hash", record.tx_hash], ["Chain", record.chain], ["Timestamp", record.timestamp], ["From", record.from], ["To", record.to], ["Asset", record.asset], ["Amount", record.amount], ["Evidence", record.evidence_type]]
    : type === "service"
      ? [["Label", record.service_label || record.label], ["Category", record.service_category || record.category || "UNKNOWN_SERVICE"], ["Address", record.service_address || record.address], ["Chain", record.chain], ["Confidence", record.confidence], ["Retrieved", record.retrieved_at], ["Evidence", record.evidence_type]]
      : [["Address", record.address], ["Chain", record.chain], ["Direction", record.direction], ["Transactions", record.tx_count], ["First seen", record.first_seen], ["Last seen", record.last_seen], ["Native transfers", record.native_transfer_count], ["Token transfers", record.token_transfer_count], ["Assets", Array.isArray(record.assets) ? record.assets.join(", ") : record.assets], ["Evidence", record.evidence_type || "CORRELATED"]];
  const provenance = evidenceProvenance(record.provenance);
  return <aside className="sky-control-page__schema sky-control-page__wallet-record-drawer" aria-label={title}>
    <button type="button" aria-label={`Close ${title.toLowerCase()}`} onClick={onClose}>Close</button>
    <h3>{title}</h3>
    <p>This read-only drawer shows loaded case data only. It does not establish ownership, identity, or intent.</p>
    <div>{entries.map(([label, value]) => <p key={label}><span>{label}</span><strong>{safeDisplay(value)}</strong></p>)}</div>
    <p>Provenance: {provenance.join("; ") || "No source provenance available"}</p>
    {type === "wallet" ? <button type="button" aria-label="Open full Wallet Profile">Open full Wallet Profile</button> : null}
    {type === "transaction" ? <button type="button" aria-label="Open full Transaction Profile">Open full Transaction Profile</button> : null}
  </aside>;
}

function AdminActivityProfile({ adminProfile, seed }) {
  const rows = adminProfile?.items || [];
  const systems = [...new Set(rows.map((item) => item.system).filter(Boolean))].sort();
  const orders = [...new Set(rows.map((item) => item.target_order_id).filter(Boolean))].sort();
  const users = [...new Set(rows.map((item) => item.target_user_id).filter(Boolean))].sort();
  const firstSeen = rows.map((item) => item.created_at).filter(Boolean).sort()[0] || null;
  const lastSeen = rows.map((item) => item.created_at).filter(Boolean).sort().at(-1) || null;
  const summary = [
    ["Admin ID", seed?.entity_id],
    ["Systems", systems.join(", ")],
    ["First seen", timeLabel(firstSeen)],
    ["Last seen", timeLabel(lastSeen)],
    ["Total actions", rows.length],
    ["Orders touched", orders.length],
    ["Users touched", users.length],
  ];
  return <section className="sky-control-page__wallet-detail sky-control-page__admin-profile" aria-label="Admin Activity Profile">
    <div className="sky-control-page__card-title"><div><span className="sky-control-page__eyebrow">DIRECTLY EVIDENCED</span><h3>Admin Activity Profile</h3></div><span className="sky-control-page__badge">read-only</span></div>
    <p className="sky-control-page__wallet-empty">Admin activity is shown only from approved application event sources. It does not establish wallet ownership, identity, or intent.</p>
    <div className="sky-control-page__wallet-summary"><div>{summary.map(([label, value]) => <article key={label}><span>{label}</span><strong>{safeDisplay(value)}</strong></article>)}</div></div>
    {rows.length ? <div className="sky-control-page__table-wrap"><table><thead><tr><th>System</th><th>Action</th><th>Target user</th><th>Target order</th><th>Timestamp</th><th>Evidence</th></tr></thead><tbody>{rows.map((item, index) => <tr key={`${item.system}-${item.action_type}-${item.created_at}-${index}`}><td>{safeDisplay(item.system)}</td><td>{safeDisplay(item.action_type)}</td><td>{safeDisplay(item.target_user_id)}</td><td>{safeDisplay(item.target_order_id)}</td><td>{timeLabel(item.created_at)}</td><td>DIRECT</td></tr>)}</tbody></table></div> : <p className="sky-control-page__wallet-empty">No explicit admin events were returned for this identifier.</p>}
    <div className="sky-control-page__mini-grid" aria-label="Admin wallet classifications">
      <article><strong>DIRECTLY EVIDENCED</strong><span>Explicit admin action rows returned by the read-only source.</span></article>
      <article><strong>CORRELATED</strong><span>Temporal application/payment/wallet correlations only when data exists.</span></article>
      <article><strong>UNPROVEN</strong><span>No ownership or control is inferred from this profile.</span></article>
    </div>
  </section>;
}

function WalletDetailViews({ seed, wallet, transaction, flow, history, anomalies, caseData, adminProfile }) {
  const [drawer, setDrawer] = useState(null);
  const [flowFilters, setFlowFilters] = useState({ chain: "", asset: "", direction: "", counterparty: "", serviceType: "", minAmount: "", maxAmount: "", dateFrom: "", dateTo: "", depth: "2" });
  const copy = (value) => navigator.clipboard?.writeText(String(value));
  const profile = wallet && [["Address", wallet.address], ["Chain", wallet.chain], ["Classification", wallet.classification || "APPLICATION_OBSERVED_WALLET"], ["Ownership status", wallet.ownership_status || "UNPROVEN"], ["Application First Seen", wallet.first_seen_application], ["Application Last Seen", wallet.last_seen_application], ["Chain First Seen", wallet.first_seen_chain], ["Chain Last Seen", wallet.last_seen_chain], ["Native Balance", wallet.native_balance], ["Transaction Count", wallet.transaction_count], ["Total Native Received", wallet.total_native_received], ["Total Native Sent", wallet.total_native_sent], ["Application Systems", wallet.application_systems?.join(", ")], ["Linked Orders", wallet.linked_orders?.length], ["Linked Payments", wallet.linked_payments?.length], ["Linked Users", wallet.linked_users?.length], ["Linked Admin Activity", wallet.linked_admin_actions?.length], ["Service Labels", wallet.service_labels?.length]];
  const tx = transaction && [["Transaction Hash", transaction.tx_hash], ["Chain", transaction.chain], ["Verification", transaction.verification_status], ["Block", transaction.block_number], ["Timestamp", transaction.timestamp], ["From", transaction.from], ["To", transaction.to], ["Native Value", transaction.native_value], ["Token Transfers", transaction.token_transfers?.length], ["Status", transaction.status], ["Gas Used", transaction.gas_used], ["Application Payment Links", transaction.application_payment_links?.length], ["Application Order Links", transaction.application_order_links?.length]];
  const edges = flow?.edges || [];
  const filteredEdges = edges.filter((edge) => {
    const amount = Number(edge.amount);
    const timestamp = edge.timestamp ? Date.parse(edge.timestamp) : null;
    const from = String(edge.from || "").toLowerCase();
    const to = String(edge.to || "").toLowerCase();
    const counterparty = flowFilters.counterparty.trim().toLowerCase();
    if (flowFilters.chain && String(edge.chain || "").toLowerCase() !== flowFilters.chain.toLowerCase()) return false;
    if (flowFilters.asset && String(edge.asset || "").toLowerCase() !== flowFilters.asset.toLowerCase()) return false;
    if (flowFilters.direction && String(edge.direction || "").toUpperCase() !== flowFilters.direction) return false;
    if (flowFilters.serviceType && String(edge.service_category || edge.service_type || "").toUpperCase() !== flowFilters.serviceType) return false;
    if (counterparty && !from.includes(counterparty) && !to.includes(counterparty)) return false;
    if (flowFilters.minAmount && (!Number.isFinite(amount) || amount < Number(flowFilters.minAmount))) return false;
    if (flowFilters.maxAmount && (!Number.isFinite(amount) || amount > Number(flowFilters.maxAmount))) return false;
    if (flowFilters.dateFrom && (!timestamp || timestamp < Date.parse(flowFilters.dateFrom))) return false;
    if (flowFilters.dateTo && (!timestamp || timestamp > Date.parse(flowFilters.dateTo))) return false;
    return true;
  });
  const uniqueFlowValues = (key) => [...new Set(edges.map((edge) => edge[key]).filter(Boolean).map(String))].sort();
  const counterparties = flow?.counterparties || wallet?.top_counterparties || {};
  const openWalletDrawer = (record) => setDrawer({ type: "wallet", record });
  const openTransactionDrawer = (record) => setDrawer({ type: "transaction", record });
  const openServiceDrawer = (record) => setDrawer({ type: "service", record });
  return <div className="sky-control-page__wallet-views">
    {profile ? <section className="sky-control-page__wallet-detail" aria-label="Wallet Profile"><div className="sky-control-page__card-title"><h3>Wallet Profile</h3><button type="button" onClick={() => copy(wallet.address)}>Copy address</button></div><p className="sky-control-page__address"><span>{compactIdentifier(wallet.address)}</span><strong>{safeDisplay(wallet.chain)}</strong></p><div>{profile.map(([label, value]) => <p key={label}><span>{label}</span><strong>{safeDisplay(value)}</strong></p>)}</div><p className="sky-control-page__wallet-empty">Application links are evidence links and do not establish wallet ownership.</p></section> : null}
    {tx ? <DetailList title="Transaction Profile" entries={tx} empty="No transaction profile available." /> : null}
    {flow ? <section className="sky-control-page__wallet-detail" aria-label="Money Flow"><h3>Money Flow</h3><p className="sky-control-page__wallet-empty">Directional flow is bounded for safety and performance.</p><div className="sky-control-page__flow-controls" aria-label="Money Flow controls"><button type="button">Fit View</button><button type="button">Zoom In</button><button type="button">Zoom Out</button><button type="button">Depth 1</button><button type="button">Depth 2</button><button type="button">Depth 3</button><button type="button">Reset</button><span>Max 250 nodes / 500 edges</span></div><div className="sky-control-page__flow-bounds"><span>Depth requested: {safeDisplay(flow.depth_requested || flow.requested_depth)}</span><span>Depth reached: {safeDisplay(flow.depth_reached)}</span><span>Nodes: {safeDisplay(flow.nodes?.length)}</span><span>Edges: {safeDisplay(filteredEdges.length)} / {safeDisplay(edges.length)}</span></div>{flow.truncated ? <p className="sky-control-page__notice">Partial money-flow graph - bounded for safety/performance.</p> : null}<div className="sky-control-page__flow-graph">{filteredEdges.length ? filteredEdges.map((edge, index) => <article key={`${edge.tx_hash || "edge"}-${edge.from || "from"}-${edge.to || "to"}-${index}`}><button type="button" onClick={() => openWalletDrawer({ address: edge.from, chain: edge.chain, direction: "SOURCE", first_seen: edge.timestamp, last_seen: edge.timestamp, assets: [edge.asset].filter(Boolean), evidence_type: edge.evidence_type, provenance: edge.provenance })}><strong>WALLET</strong><span>{compactIdentifier(edge.from)}</span></button><b>→</b><button type="button" onClick={() => edge.service_label ? openServiceDrawer(edge) : openWalletDrawer({ address: edge.to, chain: edge.chain, direction: edge.direction, first_seen: edge.timestamp, last_seen: edge.timestamp, assets: [edge.asset].filter(Boolean), evidence_type: edge.evidence_type, provenance: edge.provenance })}><strong>{edge.service_label ? "SERVICE" : "WALLET"}</strong><span>{edge.service_label ? safeDisplay(edge.service_label) : compactIdentifier(edge.to)}</span></button><small>{[edge.amount, edge.asset, edge.timestamp, edge.hop, edge.direction, edge.evidence_type].filter((value) => value != null).join(" · ")}</small>{edge.tx_hash ? <button type="button" onClick={() => openTransactionDrawer(edge)}>Transaction Drawer</button> : null}</article>) : <p>{edges.length ? "No loaded money-flow records match the current filters." : "No bounded money-flow records are available."}</p>}</div></section> : null}
    {adminProfile || seed?.entity_type === "ADMIN" ? <AdminActivityProfile adminProfile={adminProfile} seed={seed} /> : null}
    {flow ? <section className="sky-control-page__wallet-detail" aria-label="Money Flow filters">
      <h3>Money Flow Filters</h3>
      <p className="sky-control-page__wallet-empty">Filters are bounded to loaded read-only flow records. They do not issue arbitrary queries.</p>
      <div className="sky-control-page__flow-filters">
        <label>Chain<select value={flowFilters.chain} onChange={(event) => setFlowFilters((current) => ({ ...current, chain: event.target.value }))}><option value="">All chains</option>{uniqueFlowValues("chain").map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>Asset<select value={flowFilters.asset} onChange={(event) => setFlowFilters((current) => ({ ...current, asset: event.target.value }))}><option value="">All assets</option>{uniqueFlowValues("asset").map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>Direction<select value={flowFilters.direction} onChange={(event) => setFlowFilters((current) => ({ ...current, direction: event.target.value }))}><option value="">All directions</option><option value="INCOMING">INCOMING</option><option value="OUTGOING">OUTGOING</option><option value="BOTH">BOTH</option></select></label>
        <label>Min amount<input type="number" min="0" value={flowFilters.minAmount} onChange={(event) => setFlowFilters((current) => ({ ...current, minAmount: event.target.value }))} /></label>
        <label>Max amount<input type="number" min="0" value={flowFilters.maxAmount} onChange={(event) => setFlowFilters((current) => ({ ...current, maxAmount: event.target.value }))} /></label>
        <label>Date from<input type="date" value={flowFilters.dateFrom} onChange={(event) => setFlowFilters((current) => ({ ...current, dateFrom: event.target.value }))} /></label>
        <label>Date to<input type="date" value={flowFilters.dateTo} onChange={(event) => setFlowFilters((current) => ({ ...current, dateTo: event.target.value }))} /></label>
        <label>Counterparty<input value={flowFilters.counterparty} onChange={(event) => setFlowFilters((current) => ({ ...current, counterparty: event.target.value }))} placeholder="Exact address fragment" /></label>
        <label>Service type<select value={flowFilters.serviceType} onChange={(event) => setFlowFilters((current) => ({ ...current, serviceType: event.target.value }))}><option value="">All services</option><option value="EXCHANGE">EXCHANGE</option><option value="DEX">DEX</option><option value="BRIDGE">BRIDGE</option><option value="PAYMENT_PROCESSOR">PAYMENT_PROCESSOR</option><option value="CONTRACT">CONTRACT</option><option value="UNKNOWN_SERVICE">UNKNOWN_SERVICE</option></select></label>
        <label>Depth<select value={flowFilters.depth} onChange={(event) => setFlowFilters((current) => ({ ...current, depth: event.target.value }))}><option value="1">Depth 1</option><option value="2">Depth 2</option><option value="3">Depth 3</option></select></label>
      </div>
      <p className="sky-control-page__wallet-empty">{filteredEdges.length} of {edges.length} loaded edges match the current filters.</p>
    </section> : null}
    <CaseTimeline events={caseData?.timeline || caseData?.events || []} />
    <WalletEvidence wallet={wallet} transaction={transaction} flow={flow} caseData={caseData} anomalies={anomalies} />
    {seed ? <WalletExport key={`${seed.entity_type}:${seed.entity_id}`} seed={seed} /> : null}
    <DetailList title="Transaction Paths" entries={(flow?.paths || []).map((path, index) => [`Path ${index + 1}`, `${safeDisplay(path.hop_count)} hops · ${safeDisplay(path.assets?.join(", "))}`])} empty="No bounded transaction paths are available." />
    <section className="sky-control-page__wallet-detail" aria-label="Counterparty Intelligence"><h3>Counterparty Intelligence</h3><div className="sky-control-page__counterparty-grid">{[["Top Incoming", counterparties.top_incoming], ["Top Outgoing", counterparties.top_outgoing], ["Recurring Counterparties", counterparties.recurring_counterparties]].map(([title, list]) => <article key={title}><h4>{title}</h4>{list?.length ? list.map((item) => <button type="button" key={item.address} onClick={() => openWalletDrawer(item)}><strong>{compactIdentifier(item.address)}</strong><span>{[item.chain, item.direction, `${item.tx_count} tx`].filter(Boolean).join(" · ")}</span></button>) : <p>No counterparty data.</p>}</article>)}</div></section>
    {drawer ? <WalletRecordDrawer type={drawer.type} record={drawer.record} onClose={() => setDrawer(null)} /> : null}
    <DetailList title="Wallet Destination History" entries={(history?.items || []).map((item, index) => [`${item.system || "Application"} ${index + 1}`, `${compactIdentifier(item.address)} · ${safeDisplay(item.first_seen)} - ${safeDisplay(item.last_seen)} · observed change window: ${safeDisplay(item.observed_change_window?.start || item.previous_observed_at)} - ${safeDisplay(item.observed_change_window?.end || item.current_observed_at)}`])} empty="No wallet destination history is available." />
    <DetailList title="Application Links" entries={Object.entries(caseData?.case?.safe_metadata || {}).map(([key, value]) => [key.replace(/_/g, " "), value])} empty="No application-side links are available." />
    <WalletAnomalies anomalies={anomalies?.anomalies || caseData?.anomalies || []} />
  </div>;
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
      <p>Investigator prefill unavailable</p>
      <p>
        The current Investigator route has no supported URL, query, or state
        prefill contract, so Sky Control does not automatically transfer
        identifiers.
      </p>
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
