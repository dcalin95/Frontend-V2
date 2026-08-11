import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SkyControlPage, { formatRelativeTime, formatTimestamp } from '../SkyControlPage';
import { buildSkyControlWalletExportParams, fetchSkyControl, fetchSkyControlSummary, searchSkyControlForensics, fetchSkyControlForensicEntity, fetchSkyControlForensicGraph, fetchSkyControlForensicTimeline, fetchSkyControlForensicAnomalies, fetchSkyControlForensicExport, fetchSkyControlPaymentCase, fetchSkyControlMoneyFlow, fetchSkyControlProviderHealth, fetchSkyControlTransaction, fetchSkyControlWallet, fetchSkyControlWalletAnomalies, fetchSkyControlWalletDiscovery, fetchSkyControlWalletDiscoveryDetail, fetchSkyControlWalletExport, fetchSkyControlWalletHistory, searchSkyControlPaymentCases, searchSkyControlWallets } from '../../services/skyControlService';

jest.mock('../../services/skyControlService', () => ({
  fetchSkyControlSummary: jest.fn().mockResolvedValue({
    health: { database: 'connected' },
    overview: {
      quick: { status: 'available', metrics: { active_subscriptions: 1, admin_actions_total: 2 } },
      skycloud: { status: 'available', metrics: { active_subscriptions: 3, admin_actions_total: 4 } },
      bot_fleet: { metrics: { total: 5 } },
      payments: { metrics: { quick_payment_proofs: 6, skycloud_payment_proofs: 7 } },
    },
  }),
  fetchSkyControl: jest.fn().mockResolvedValue({ items: [] }),
  searchSkyControlForensics: jest.fn(),
  fetchSkyControlForensicEntity: jest.fn(),
  fetchSkyControlForensicGraph: jest.fn(),
  fetchSkyControlForensicTimeline: jest.fn(),
  fetchSkyControlForensicAnomalies: jest.fn(),
  fetchSkyControlForensicExport: jest.fn(),
  searchSkyControlPaymentCases: jest.fn(),
  searchSkyControlWallets: jest.fn(),
  fetchSkyControlPaymentCase: jest.fn(),
  fetchSkyControlWallet: jest.fn(),
  fetchSkyControlTransaction: jest.fn(),
  fetchSkyControlMoneyFlow: jest.fn(),
  fetchSkyControlProviderHealth: jest.fn().mockResolvedValue({ providers: {} }),
  fetchSkyControlWalletHistory: jest.fn().mockResolvedValue({ items: [] }),
  fetchSkyControlWalletAnomalies: jest.fn().mockResolvedValue({ anomalies: [] }),
  fetchSkyControlWalletDiscovery: jest.fn().mockResolvedValue({ items: [], summary: {}, source_status: {}, provider_status: {} }),
  fetchSkyControlWalletDiscoveryDetail: jest.fn(),
  fetchSkyControlWalletExport: jest.fn(),
  buildSkyControlWalletExportParams: jest.fn((selectedCase, csvType = "") => {
    const case_type = String(selectedCase?.entity_type || "").toUpperCase();
    if (["WALLET", "TRANSACTION"].includes(case_type) && !selectedCase?.chain) { const error = new Error("wallet_case_chain_required"); error.code = "wallet_case_chain_required"; throw error; }
    return { case_type, case_id: selectedCase?.entity_id, ...(["WALLET", "TRANSACTION"].includes(case_type) ? { chain: selectedCase.chain } : {}), ...(csvType ? { type: csvType } : {}) };
  }),
}));

describe('SkyControlPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
    fetchSkyControlSummary.mockImplementation(() => new Promise(() => {}));
    fetchSkyControl.mockImplementation(() => new Promise(() => {}));
    fetchSkyControlForensicTimeline.mockResolvedValue({ events: [], pagination: {} });
    fetchSkyControlForensicAnomalies.mockResolvedValue({ anomalies: [], pagination: {} });
    fetchSkyControlProviderHealth.mockResolvedValue({ providers: {} });
    fetchSkyControlWalletHistory.mockResolvedValue({ items: [] });
    fetchSkyControlWalletAnomalies.mockResolvedValue({ anomalies: [] });
    fetchSkyControlWalletDiscovery.mockResolvedValue({ items: [], summary: {}, source_status: {}, provider_status: {} });
    fetchSkyControlWalletDiscoveryDetail.mockReset();
    buildSkyControlWalletExportParams.mockImplementation((selectedCase, csvType = "") => {
      const case_type = String(selectedCase?.entity_type || "").toUpperCase();
      if (["WALLET", "TRANSACTION"].includes(case_type) && !selectedCase?.chain) { const error = new Error("wallet_case_chain_required"); error.code = "wallet_case_chain_required"; throw error; }
      return { case_type, case_id: selectedCase?.entity_id, ...(["WALLET", "TRANSACTION"].includes(case_type) ? { chain: selectedCase.chain } : {}), ...(csvType ? { type: csvType } : {}) };
    });
  });

  const graph = { seed: { label: "Reader" }, nodes: [], edges: [] };
  const entity = { entity: { type: "USER", label: "Reader", safe_metadata: {} } };
  const timelineEvent = (overrides = {}) => ({
    event_id: "event-1",
    timestamp: "2026-01-01T00:00:00Z",
    event_type: "ADMIN_ACTION",
    source_system: "quick",
    source_table: "admin_actions",
    source_record_id: "a1",
    evidence_type: "DIRECT",
    actor: "admin-1",
    subject: "user-7",
    object: "order-1",
    ...overrides,
  });
  const selectTimelineSeed = async () => {
    searchSkyControlForensics.mockResolvedValue({ count: 1, candidates: [{ entity_type: "USER", entity_id: "7", label: "Reader", system: "quick" }] });
    fetchSkyControlForensicGraph.mockResolvedValue(graph);
    fetchSkyControlForensicEntity.mockResolvedValue(entity);
    render(<MemoryRouter initialEntries={["/?tab=forensics"]}><SkyControlPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Forensic search"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.click(await screen.findByRole("button", { name: /Reader/i }));
  };

  afterEach(() => {
    delete global.fetch;
    jest.restoreAllMocks();
  });

  it('renders the read-only overview shell without external requests', () => {
    render(<MemoryRouter><SkyControlPage /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'Sky Control' })).toBeInTheDocument();
    expect(screen.getByText('READ ONLY')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByText('Loading')).toHaveLength(6);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('changes tabs with a keyboard and keeps the view read only', () => {
    render(<MemoryRouter><SkyControlPage /></MemoryRouter>);

    const overview = screen.getByRole('tab', { name: 'Overview' });
    fireEvent.keyDown(overview, { key: 'ArrowRight' });

    expect(screen.getByRole('tab', { name: 'Gateway' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/SERVICE RUNTIME NOT CONNECTED/)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('formats ISO timestamps safely and distinguishes data from runtime state', () => {
    expect(formatTimestamp('2026-08-08T00:00:00.000Z')).not.toBe('—');
    expect(formatTimestamp(null)).toBe('—');
    expect(formatTimestamp({})).toBe('—');
    expect(formatRelativeTime(null)).toBe('—');
  });

  it('renders only safe overview summaries after the provider connects', async () => {
    fetchSkyControlSummary.mockResolvedValue({
      health: { database: 'connected' },
      overview: {
        quick: { status: 'available', metrics: { active_subscriptions: 1, admin_actions_total: 2 } },
        skycloud: { status: 'available', metrics: { active_subscriptions: 3, admin_actions_total: 4 } },
        bot_fleet: { metrics: { total: 5 } },
        payments: { metrics: { quick_payment_proofs: 6, skycloud_payment_proofs: 7 } },
      },
      schema: { tables: [{ table: 'users', compatible: true }, { table: 'halcyon_user_bots', compatible: false }] },
    });
    render(<MemoryRouter><SkyControlPage /></MemoryRouter>);
    expect(await screen.findByText('CONNECTED — 5 bots')).toBeInTheDocument();
    expect(screen.getByText('4 active')).toBeInTheDocument();
    expect(screen.getByText('SCHEMA INCOMPATIBLE')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('renders Bot Fleet from an explicit safe allowlist with pagination', async () => {
    fetchSkyControl.mockResolvedValue({ items: [{ user_id: '42', bot_id: 'b-1', bot_username: 'bot_alpha', bot_token: 'must-not-render', status: 'ACTIVE', health: 'HEALTHY', started_at: '2026-08-08T00:00:00.000Z', last_heartbeat: '2026-08-08T00:01:00.000Z', crash_count: 0 }] });
    render(<MemoryRouter initialEntries={['/?tab=bot-fleet']}><SkyControlPage /></MemoryRouter>);
    expect(await screen.findByText('bot_alpha')).toBeInTheDocument();
    expect(screen.queryByText('must-not-render')).not.toBeInTheDocument();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Health')).toBeInTheDocument();
  });

  it('formats admin systems safely instead of rendering JSON', async () => {
    fetchSkyControl.mockResolvedValue({ items: [{ admin_id: '0', systems: ['quick', 'skycloud'], total_actions: 2, actor_type: 'system' }] });
    render(<MemoryRouter initialEntries={['/?tab=admin-timeline']}><SkyControlPage /></MemoryRouter>);
    expect(await screen.findByText('Quick · SkyCloud')).toBeInTheDocument();
    expect(screen.queryByText('["quick","skycloud"]')).not.toBeInTheDocument();
  });

  it('loads the bounded forensic workspace without changing other Sky Control tabs', async () => {
    searchSkyControlForensics.mockResolvedValue({ count: 1, candidates: [{ entity_type: 'user', entity_id: '42', label: 'Safe user' }] });
    fetchSkyControlForensicGraph.mockResolvedValue({ seed: { label: 'Safe user' }, nodes: [], edges: [], metadata: {} });
    fetchSkyControlForensicEntity.mockResolvedValue({ entity: { type: 'user', label: 'Safe user' } });
    fetchSkyControlForensicTimeline.mockResolvedValue({ events: [], pagination: {} });
    fetchSkyControlForensicAnomalies.mockResolvedValue({ anomalies: [], pagination: {} });
    render(<MemoryRouter initialEntries={['/?tab=forensics']}><SkyControlPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Forensic search'), { target: { value: '42' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('user: Safe user')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'user: Safe user' }));
    expect(await screen.findByText('Case graph')).toBeInTheDocument();
    expect(screen.getByText('Investigator prefill unavailable')).toBeInTheDocument();
    expect(screen.getAllByText('DIRECT').length).toBeGreaterThan(0);
  });
  it.each([
    [0.9, "90%"],
    [0.75, "75%"],
    [0.5, "50%"],
  ])("formats confidence %s as %s", async (confidence, expected) => {
    cleanup();
    searchSkyControlForensics.mockResolvedValue({
      count: 1,
      candidates: [{ entity_type: "USER", entity_id: "7", label: "Reader" }],
    });
    fetchSkyControlForensicEntity.mockResolvedValue({
      entity: { type: "USER", label: "Reader", safe_metadata: {} },
    });
    fetchSkyControlForensicTimeline.mockResolvedValue({ events: [] });
    fetchSkyControlForensicGraph.mockResolvedValue({
      seed: { label: "Reader" },
      nodes: [],
      edges: [
        {
          relationship_type: "SAFE_LINK",
          source_entity_type: "USER",
          source_entity_id: "7",
          target_entity_type: "ORDER",
          target_entity_id: "o1",
          evidence_type: "CORRELATED",
          confidence,
          event_time: "invalid",
          metadata: {},
        },
      ],
    });
    render(
      <MemoryRouter initialEntries={["/?tab=forensics"]}>
        <SkyControlPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("Forensic search"), {
      target: { value: "7" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.click(await screen.findByRole("button", { name: /Reader/i }));
    fireEvent.click((await screen.findByRole("table")).querySelector("tbody tr"));
    expect(
      screen.getByRole("complementary", { name: "Relationship details" }),
    ).toHaveTextContent(`Confidence: ${expected}`);
    expect(
      screen.getByRole("complementary", { name: "Relationship details" }),
    ).toHaveTextContent(/Event time:/);
  });

  it("loads timeline only after selecting a forensic seed with exact seed parameters", async () => {
    fetchSkyControlForensicTimeline.mockResolvedValue({ events: [] });
    render(
      <MemoryRouter initialEntries={["/?tab=forensics"]}>
        <SkyControlPage />
      </MemoryRouter>,
    );
    expect(fetchSkyControlForensicTimeline).not.toHaveBeenCalled();
    cleanup();
    fetchSkyControlForensicTimeline.mockResolvedValue({ events: [] });
    await selectTimelineSeed();
    await waitFor(() =>
      expect(fetchSkyControlForensicTimeline).toHaveBeenCalledWith(
        expect.objectContaining({
          seed_type: "USER",
          seed_id: "7",
          limit: 25,
          offset: 0,
        }),
      ),
    );
  });

  it("renders timeline labels, safe event fields, source, chronology, and timestamps", async () => {
    const eventTypes = [
      "ADMIN_ACTION",
      "ORDER_CREATED",
      "ORDER_UPDATED",
      "PAYMENT_PROOF",
      "SUBSCRIPTION_START",
      "SUBSCRIPTION_END",
      "BOT_REGISTERED",
      "BOT_STARTED",
      "BOT_CRASHED",
      "INVITE_CREATED",
      "INVITE_APPROVED",
      "INVITE_REVOKED",
      "WITHDRAW_DESTINATION_UPDATED",
    ];
    fetchSkyControlForensicTimeline.mockResolvedValue({
      events: eventTypes.map((event_type, index) =>
        timelineEvent({
          event_id: `event-${index}`,
          event_type,
          timestamp:
            index === 1
              ? null
              : index === 2
                ? "invalid"
                : `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00Z`,
          evidence_type: ["DIRECT", "DERIVED", "CORRELATED"][index % 3],
          actor: index === 3 ? { label: "admin-1" } : "admin-1",
          subject: index === 4 ? null : "user-7",
          object: index === 5 ? { id: "order-1" } : "order-1",
        }),
      ),
    });
    await selectTimelineSeed();
    const table = await screen.findByRole("table");
    expect(table).toHaveTextContent("Admin action");
    [
      "Order created",
      "Order updated",
      "Payment proof",
      "Subscription started",
      "Subscription ended",
      "Bot registered",
      "Bot started",
      "Bot crashed",
      "Invite created",
      "Invite approved",
      "Invite revoked",
      "Withdrawal destination updated",
    ].forEach((label) => expect(table).toHaveTextContent(label));
    expect(table).toHaveTextContent(
      new Date("2026-01-01T00:00:00Z").toLocaleString(),
    );
    expect(table).toHaveTextContent("quick");
    expect(table).toHaveTextContent("admin_actions / a1");
    expect(table).toHaveTextContent("-");
    expect(table).not.toHaveTextContent(/Invalid Date|\[object Object\]|\{\}/);
    const rows = Array.from(table.querySelectorAll("tbody tr")).map(
      (row) => row.textContent,
    );
    expect(rows[0]).toContain("Admin action");
    expect(rows[1]).toContain("Order created");
  });

  it("renders unknown timeline events safely without fabricating invoice status events", async () => {
    fetchSkyControlForensicTimeline.mockResolvedValue({
      events: [
        timelineEvent({
          event_type: "CUSTOM_SAFE_EVENT",
          actor: { unsafe: true },
          subject: null,
          object: {},
        }),
      ],
    });
    await selectTimelineSeed();
    const table = await screen.findByRole("table");
    expect(table).toHaveTextContent("Unknown event: CUSTOM SAFE EVENT");
    expect(table).not.toHaveTextContent(
      /\[object Object\]|\{\}|Invoice status/i,
    );
  });

  it("reloads Timeline server-side for filters and pagination, with safe empty and error states", async () => {
    fetchSkyControlForensicTimeline
      .mockResolvedValueOnce({
        events: [timelineEvent()],
        pagination: { limit: 25, offset: 0, count: 25, has_previous: false, has_next: true },
      })
      .mockResolvedValueOnce({
        events: [timelineEvent({ event_id: "system" })],
        pagination: { limit: 25, offset: 0, count: 25, has_previous: false, has_next: true },
      })
      .mockResolvedValueOnce({
        events: [timelineEvent({ event_id: "event" })],
        pagination: { limit: 25, offset: 0, count: 25, has_previous: false, has_next: true },
      })
      .mockResolvedValueOnce({
        events: [timelineEvent({ event_id: "evidence" })],
        pagination: { limit: 25, offset: 25, count: 25, has_previous: true, has_next: true },
      })
      .mockResolvedValueOnce({
        events: [timelineEvent({ event_id: "next" })],
        pagination: { limit: 25, offset: 25, count: 25, has_previous: true, has_next: false },
      })
      .mockResolvedValueOnce({
        events: [],
        pagination: { limit: 25, offset: 0, count: 25, has_previous: false, has_next: true },
      });
    await selectTimelineSeed();
    await screen.findByRole("table");
    expect(
      screen.getByRole("button", { name: "Previous timeline page" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("System filter"), {
      target: { value: "quick" },
    });
    await waitFor(() =>
      expect(fetchSkyControlForensicTimeline).toHaveBeenLastCalledWith(
        expect.objectContaining({ system: "quick", offset: 0 }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("System filter")).toHaveValue("quick"),
    );
    fireEvent.change(screen.getByLabelText("Event type filter"), {
      target: { value: "ORDER_CREATED" },
    });
    await waitFor(() =>
      expect(fetchSkyControlForensicTimeline).toHaveBeenLastCalledWith(
        expect.objectContaining({
          event_type: "ORDER_CREATED",
          system: "quick",
          offset: 0,
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Event type filter")).toHaveValue("ORDER_CREATED"),
    );
    fireEvent.change(screen.getByLabelText("Evidence type filter"), {
      target: { value: "CORRELATED" },
    });
    await waitFor(() =>
      expect(fetchSkyControlForensicTimeline).toHaveBeenLastCalledWith(
        expect.objectContaining({
          evidence_type: "CORRELATED",
          event_type: "ORDER_CREATED",
          offset: 0,
        }),
      ),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Next timeline page" }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Next timeline page" }));
    await waitFor(() =>
      expect(fetchSkyControlForensicTimeline).toHaveBeenLastCalledWith(
        expect.objectContaining({ offset: 25 }),
      ),
    );
    expect(await screen.findByText("Page 2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next timeline page" }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Previous timeline page" }),
    );
    await waitFor(() =>
      expect(fetchSkyControlForensicTimeline).toHaveBeenLastCalledWith(
        expect.objectContaining({ offset: 0 }),
      ),
    );
    expect(await screen.findByText("No timeline events")).toBeInTheDocument();
  });

  it("shows sanitized Timeline failure states, including unauthorized responses", async () => {
    fetchSkyControlForensicTimeline.mockRejectedValueOnce(
      Object.assign(new Error("internal details"), { status: 401 }),
    );
    await selectTimelineSeed();
    expect(
      await screen.findByText("Not authorized for Sky Control."),
    ).toBeInTheDocument();
    expect(screen.getByText("Case graph")).toBeInTheDocument();
    cleanup();
    fetchSkyControlForensicTimeline.mockRejectedValueOnce(
      new Error("SQL connection failure"),
    );
    await selectTimelineSeed();
    expect(await screen.findByText("Timeline unavailable from current source.")).toBeInTheDocument();
    expect(screen.getByText("Case graph")).toBeInTheDocument();
    expect(
      screen.queryByText(/SQL connection failure|internal details/i),
    ).not.toBeInTheDocument();
  });

  it("keeps the case workspace visible when anomalies cannot be loaded", async () => {
    fetchSkyControlForensicAnomalies.mockRejectedValueOnce(
      new Error("provider internals"),
    );
    await selectTimelineSeed();
    expect(
      await screen.findByText("Anomaly data unavailable from current source."),
    ).toBeInTheDocument();
    expect(screen.getByText("Case graph")).toBeInTheDocument();
    expect(screen.queryByText(/provider internals/i)).not.toBeInTheDocument();
  });

  it("renders safe anomalies and evidence only after a selected seed", async () => {
    const provenance = [
      {
        source_system: "quick",
        source_table: "orders",
        source_record_id: "o1",
        event_time: "2026-01-01T00:00:00Z",
      },
      {
        source_system: "skycloud",
        source_table: "payments",
        source_record_id: "p1",
        event_time: "2026-01-01T01:00:00Z",
      },
    ];
    const edge = {
      relationship_type: "ORDER_SUBSCRIPTION",
      evidence_type: "DIRECT",
      confidence: 1,
      reason_codes: ["same_user"],
      event_time: "2026-01-01T00:00:00Z",
      metadata: { provenance, password: "hidden" },
    };
    const anomaly = {
      anomaly_id: "a1",
      severity: "HIGH",
      rule_id: "RULE_1",
      title: "Neutral signal",
      reason: "Observed inconsistency",
      evidence_type: "CORRELATED",
      entity_ids: ["7"],
      record_ids: ["o1"],
      timestamps: ["2026-01-01T00:00:00Z"],
      timestamp: "2026-01-01T00:00:00Z",
      reason_codes: ["same_user"],
      metadata: { matched_fields: ["user_id"], bot_token: "hidden" },
      provenance,
    };
    fetchSkyControlForensicTimeline.mockResolvedValue({
      events: [timelineEvent({ evidence_type: "DERIVED" })],
    });
    fetchSkyControlForensicAnomalies.mockResolvedValue({
      anomalies: [anomaly],
      pagination: { has_next: true },
    });
    render(
      <MemoryRouter initialEntries={["/?tab=forensics"]}>
        <SkyControlPage />
      </MemoryRouter>,
    );
    expect(fetchSkyControlForensicAnomalies).not.toHaveBeenCalled();
    cleanup();
    graph.edges = [edge];
    graph.limitations = {
      broad_admin_actions_available: false,
      broad_invoices_available: false,
      invoice_status_timeline_available: false,
      invite_user_mismatch_rule_available: false,
    };
    fetchSkyControlForensicTimeline.mockResolvedValue({
      events: [timelineEvent({ evidence_type: "DERIVED" })],
    });
    fetchSkyControlForensicAnomalies.mockResolvedValue({
      anomalies: [anomaly],
      pagination: { has_next: true },
    });
    await selectTimelineSeed();
    await waitFor(() =>
      expect(fetchSkyControlForensicAnomalies).toHaveBeenCalledWith(
        expect.objectContaining({
          seed_type: "USER",
          seed_id: "7",
          limit: 25,
          offset: 0,
        }),
      ),
    );
    const anomaliesHeading = await screen.findByRole("heading", { name: "Anomalies" });
    const anomalies = anomaliesHeading.closest("section");
    expect(anomalies).not.toBeNull();
    expect(anomalies).toHaveTextContent(
      /unusual or inconsistent application patterns/i,
    );
    expect(anomalies).toHaveTextContent("Severity: HIGH");
    expect(anomalies).toHaveTextContent("Rule: RULE_1");
    expect(anomalies).toHaveTextContent("Neutral signal");
    expect(anomalies).toHaveTextContent("Observed inconsistency");
    expect(anomalies).toHaveTextContent("Evidence Type: CORRELATED");
    fireEvent.click(anomalies.querySelector("summary"));
    expect(anomalies).toHaveTextContent("Reason codes: same_user");
    expect(anomalies).toHaveTextContent("quick · orders · o1");
    expect(anomalies).toHaveTextContent("skycloud · payments · p1");
    fireEvent.change(screen.getByLabelText("Anomaly severity filter"), {
      target: { value: "HIGH" },
    });
    await waitFor(() =>
      expect(fetchSkyControlForensicAnomalies).toHaveBeenLastCalledWith(
        expect.objectContaining({ severity: "HIGH" }),
      ),
    );
    fireEvent.change(screen.getByLabelText("Anomaly rule filter"), {
      target: { value: "RULE_1" },
    });
    await waitFor(() =>
      expect(fetchSkyControlForensicAnomalies).toHaveBeenLastCalledWith(
        expect.objectContaining({ rule_id: "RULE_1" }),
      ),
    );
    expect(
      screen.getByRole("button", { name: "Previous anomaly page" }),
    ).toBeDisabled();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Next anomaly page" }),
      ).toBeEnabled(),
    );
    const evidence = screen.getByRole("heading", { name: "Evidence" }).closest("section");
    expect(evidence).not.toBeNull();
    await waitFor(() =>
      expect(evidence).toHaveTextContent("ORDER_SUBSCRIPTION"),
    );
    expect(evidence).toHaveTextContent("Evidence Type: DIRECT");
    expect(evidence).toHaveTextContent("Evidence Type: DERIVED");
    expect(evidence).toHaveTextContent("Evidence Type: CORRELATED");
    expect(evidence).toHaveTextContent("quick · orders · o1");
    expect(evidence).toHaveTextContent("skycloud · payments · p1");
    expect(evidence).not.toHaveTextContent(
      /hidden|\[object Object\]|\{\}|Invalid Date/,
    );
    const limits = screen.getByRole("heading", { name: "Limitations" }).closest("section");
    expect(limits).not.toBeNull();
    [
      "Broad admin-action history unavailable",
      "Broad invoice history unavailable",
      "Invoice status timeline unavailable",
      "Invite mismatch rule unavailable",
    ].forEach((note) => expect(limits).toHaveTextContent(note));
    expect(limits).toHaveTextContent("Investigator prefill unavailable");
    expect(limits).toHaveTextContent(
      /does not automatically transfer identifiers/i,
    );
    expect(
      screen.queryByRole("button", { name: /open in investigator/i }),
    ).not.toBeInTheDocument();
  });

  it.each(["INFO", "LOW", "MEDIUM", "HIGH"])(
    "shows anomaly severity %s as visible text",
    async (severity) => {
      fetchSkyControlForensicAnomalies.mockResolvedValue({
        anomalies: [
          {
            severity,
            rule_id: "RULE",
            title: "Neutral",
            reason: "Observed",
            evidence_type: "UNPROVEN",
            entity_ids: [],
            timestamp: null,
          },
        ],
      });
      fetchSkyControlForensicTimeline.mockResolvedValue({ events: [] });
      await selectTimelineSeed();
      expect(
        await screen.findByText(`Severity: ${severity}`, { exact: false }),
      ).toBeInTheDocument();
    },
  );

  it("renders Wallet Intelligence with exact search, explicit seed selection, and safe case data", async () => {
    searchSkyControlPaymentCases.mockResolvedValue({ candidates: [
      { entity_type: "PAYMENT", entity_id: "42", label: "Payment 42", system: "quick" },
      { entity_type: "ORDER", entity_id: "42", label: "Order 42", system: "quick" },
    ] });
    searchSkyControlWallets.mockResolvedValue({ candidates: [] });
    fetchSkyControlPaymentCase.mockResolvedValue({
      case: { entity_id: "42" },
      read_only: true,
      summary: { payment_count: 1, order_count: 1, graph_nodes: 2, graph_edges: 1, depth: 3 },
      source_status: { orders: { available: true }, payments: { available: false, reason: "QUERY_FAILED" } },
      limitations: ["Admin wallet ownership unproven", "Missing activity is not proof of no activity."],
    });
    render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>);
    expect(screen.getByRole("tab", { name: "Wallet Intelligence" })).toBeInTheDocument();
    expect(screen.getByText(/Search an exact wallet/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "42" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(searchSkyControlPaymentCases).toHaveBeenCalledWith("42"));
    expect(await screen.findByText("Payment 42")).toBeInTheDocument();
    expect(fetchSkyControlPaymentCase).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Payment 42/i }));
    await waitFor(() => expect(fetchSkyControlPaymentCase).toHaveBeenCalledWith("PAYMENT", "42"));
    const summary = await screen.findByRole("region", { name: "Wallet case summary" });
    expect(summary).toHaveTextContent("Payment Count");
    expect(summary).toHaveTextContent("1");
    expect(screen.getByRole("region", { name: "Application source status" })).toHaveTextContent("QUERY_FAILED");
    expect(screen.getByRole("region", { name: "Wallet Intelligence limitations" })).toHaveTextContent("Admin wallet ownership unproven");
    const legend = screen.getByRole("region", { name: "Wallet evidence legend" });
    ["DIRECT", "DERIVED", "CORRELATED", "UNPROVEN"].forEach((label) => expect(legend).toHaveTextContent(label));
  });

  it("clears stale Wallet Intelligence case data and sanitizes errors on seed switch", async () => {
    searchSkyControlPaymentCases.mockResolvedValue({ candidates: [{ entity_type: "PAYMENT", entity_id: "1", label: "Payment 1" }] });
    searchSkyControlWallets.mockResolvedValue({ candidates: [] });
    fetchSkyControlPaymentCase.mockRejectedValue(Object.assign(new Error("internal provider URL"), { status: 503 }));
    render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.click(await screen.findByRole("button", { name: /Payment 1/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Wallet Intelligence data is currently unavailable.");
    expect(screen.queryByRole("region", { name: "Wallet case summary" })).not.toBeInTheDocument();
    expect(screen.queryByText(/internal provider URL/i)).not.toBeInTheDocument();
  });

  it("renders bounded wallet, transaction, flow, and history evidence without ownership claims", async () => {
    searchSkyControlPaymentCases.mockResolvedValue({ candidates: [] });
    searchSkyControlWallets.mockResolvedValue({ candidates: [{ entity_type: "WALLET", entity_id: "0xabc123456789012345678901234567890123abcd", address: "0xabc123456789012345678901234567890123abcd", chain: "bsc", label: "Wallet" }] });
    fetchSkyControlPaymentCase.mockRejectedValue({ status: 404 });
    fetchSkyControlWallet.mockResolvedValue({ address: "0xabc123456789012345678901234567890123abcd", chain: "bsc", transaction_count: 2, application_systems: ["quick"], linked_orders: ["o1"], linked_payments: ["p1"], source_status: { orders: { available: true } }, provider_status: { bsc: { available: false, reason: "PROVIDER_UNAVAILABLE" } }, limitations: ["Application links do not establish wallet ownership."] });
    fetchSkyControlMoneyFlow.mockResolvedValue({ depth_requested: 2, depth_reached: 2, nodes: [{ id: "1" }], edges: [{ from: "0xabc123456789012345678901234567890123abcd", to: "0xdef123456789012345678901234567890123abcd", tx_hash: "0xtx", amount: "1", asset: "BNB", hop: 1, direction: "OUTGOING", evidence_type: "DIRECT" }], truncated: true, paths: [] });
    fetchSkyControlWalletHistory.mockResolvedValue({ items: [{ system: "quick", address: "0xabc123456789012345678901234567890123abcd", first_seen: "2026-01-01", last_seen: "2026-01-02", previous_observed_at: "2026-01-01", current_observed_at: "2026-01-02" }] });
    fetchSkyControlWalletAnomalies.mockResolvedValue({ anomalies: [] });
    render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "0xabc123456789012345678901234567890123abcd" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.click(await screen.findByRole("button", { name: /Wallet/i }));
    expect(await screen.findByRole("region", { name: "Wallet Profile" })).toHaveTextContent("Transaction Count");
    expect(screen.getByRole("region", { name: "Money Flow" })).toHaveTextContent("Partial money-flow graph");
    expect(screen.getByText("Wallet Destination History")).toBeInTheDocument();
    expect(screen.queryByText(/owned by admin|owned by user/i)).not.toBeInTheDocument();
  });

  it("renders and filters loaded Wallet Intelligence case timeline without fabricating wallet-change time", async () => {
    searchSkyControlPaymentCases.mockResolvedValue({ candidates: [{ entity_type: "PAYMENT", entity_id: "t1", label: "Timeline payment" }] }); searchSkyControlWallets.mockResolvedValue({ candidates: [] });
    fetchSkyControlPaymentCase.mockResolvedValue({ case: {}, read_only: true, timeline: [{ event_id: "1", event_type: "ORDER_CREATED", timestamp: "2026-01-01T00:00:00Z", system: "quick", chain: "bsc", evidence_type: "DIRECT", provenance: [{ source_system: "quick", source_table: "orders", source_record_id: "o1" }] }, { event_id: "2", event_type: "WITHDRAW_DESTINATION_CHANGED", timestamp: "2026-01-02T00:00:00Z", system: "quick", chain: "bsc", evidence_type: "DERIVED", reason_codes: ["CHANGE_TIME_NOT_EXACT"], metadata: { observed_change_window: { start: "2026-01-01", end: "2026-01-02" } } }] });
    render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "t1" } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /Timeline payment/i }));
    const timeline = await screen.findByRole("region", { name: "Case Timeline" }); expect(timeline).toHaveTextContent("Order created"); expect(timeline).toHaveTextContent("Observed change window"); expect(timeline).toHaveTextContent("quick · orders · o1");
    fireEvent.change(screen.getByLabelText("Evidence Type filter"), { target: { value: "DERIVED" } }); expect(timeline).toHaveTextContent("Withdrawal destination changed"); expect(timeline.querySelector("tbody")).not.toHaveTextContent("Order created");
  });

  it("renders, filters, and opens backend-provided Wallet Intelligence anomalies safely", async () => {
    const wallet = "0xabc123456789012345678901234567890123abcd";
    searchSkyControlPaymentCases.mockResolvedValue({ candidates: [] }); searchSkyControlWallets.mockResolvedValue({ candidates: [{ entity_type: "WALLET", entity_id: wallet, address: wallet, chain: "bsc", label: "Wallet anomaly case" }] });
    fetchSkyControlPaymentCase.mockResolvedValue({ case: {}, read_only: true }); fetchSkyControlWallet.mockResolvedValue({ address: wallet });
    fetchSkyControlWalletAnomalies.mockResolvedValue({ anomalies: [
      { anomaly_id: "a-info", severity: "INFO", rule_id: "SAME_TRANSACTION_MULTI_PAYMENT", title: "Repeated transaction reference", reason: "Exact application references repeat.", evidence_type: "CORRELATED", reason_codes: ["EXACT_MATCH"], entity_ids: [wallet, "0xaaa"], timestamps: ["2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z"], provenance: [{ source_system: "quick", source_table: "payments", source_record_id: "p1" }], metadata: { matched_value: "reference-1" } },
      { anomaly_id: "a-low", severity: "LOW", rule_id: "UNKNOWN_RULE", title: "Neutral backend signal", evidence_type: "DIRECT" },
      { anomaly_id: "a-medium", severity: "MEDIUM", rule_id: "RAPID_FORWARDING", title: "Forwarding pattern", evidence_type: "DERIVED" },
    ] });
    render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: wallet } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /Wallet anomaly case/i }));
    const anomalies = await screen.findByRole("region", { name: "Wallet Intelligence Anomalies" }); expect(anomalies).toHaveTextContent("INFO"); expect(anomalies).toHaveTextContent("LOW"); expect(anomalies).toHaveTextContent("MEDIUM"); expect(anomalies).toHaveTextContent("Same transaction referenced by multiple payments"); expect(anomalies).toHaveTextContent("UNKNOWN_RULE"); expect(anomalies).toHaveTextContent(/not findings of ownership, fraud, wrongdoing, or identity/i);
    fireEvent.change(screen.getByLabelText("Anomaly severity filter"), { target: { value: "INFO" } }); expect(anomalies.querySelector("tbody")).toHaveTextContent("Repeated transaction reference"); expect(anomalies.querySelector("tbody")).not.toHaveTextContent("Forwarding pattern");
    fireEvent.change(screen.getByLabelText("Anomaly severity filter"), { target: { value: "" } }); fireEvent.change(screen.getByLabelText("Anomaly rule filter"), { target: { value: "SAME_TRANSACTION_MULTI_PAYMENT" } }); fireEvent.change(screen.getByLabelText("Anomaly evidence type filter"), { target: { value: "CORRELATED" } }); fireEvent.click(screen.getByRole("button", { name: "Why flagged" }));
    const drawer = screen.getByRole("complementary", { name: "Anomaly Detail" }); expect(drawer).toHaveTextContent("EXACT_MATCH"); expect(drawer).toHaveTextContent(/quick.*payments.*p1/); expect(drawer).toHaveTextContent("reference-1"); expect(drawer).toHaveTextContent(new Date("2026-01-01T00:00:00Z").toLocaleString()); fireEvent.click(screen.getByRole("button", { name: "Close anomaly detail" })); expect(screen.queryByRole("complementary", { name: "Anomaly Detail" })).not.toBeInTheDocument();
  });

  it("clears Wallet Intelligence anomaly selection when the selected seed changes", async () => {
    searchSkyControlPaymentCases.mockResolvedValue({ candidates: [{ entity_type: "PAYMENT", entity_id: "one", label: "Case one" }, { entity_type: "PAYMENT", entity_id: "two", label: "Case two" }] }); searchSkyControlWallets.mockResolvedValue({ candidates: [] }); fetchSkyControlPaymentCase.mockResolvedValue({ case: {} }); fetchSkyControlWalletAnomalies.mockResolvedValue({ anomalies: [{ anomaly_id: "a1", severity: "INFO", rule_id: "RAPID_FORWARDING", title: "First signal" }] });
    render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "case" } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /Case one/ })); fireEvent.click(await screen.findByRole("button", { name: "Why flagged" })); expect(screen.getByRole("complementary", { name: "Anomaly Detail" })).toBeInTheDocument(); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "case" } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /Case two/ })); await waitFor(() => expect(screen.queryByRole("complementary", { name: "Anomaly Detail" })).not.toBeInTheDocument());
  });

  it("shows the Wallet Intelligence anomaly empty state without creating signals", async () => {
    searchSkyControlPaymentCases.mockResolvedValue({ candidates: [{ entity_type: "PAYMENT", entity_id: "empty", label: "Empty case" }] }); searchSkyControlWallets.mockResolvedValue({ candidates: [] }); fetchSkyControlPaymentCase.mockResolvedValue({ case: {} }); fetchSkyControlWalletAnomalies.mockResolvedValue({ anomalies: [] }); render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "empty" } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /Empty case/ })); const anomalies = await screen.findByRole("region", { name: "Wallet Intelligence Anomalies" }); expect(anomalies).toHaveTextContent("No anomaly signals are available from the current case data."); expect(anomalies).toHaveTextContent("Absence of anomaly signals is not proof that no unusual activity occurred.");
  });

  it("groups selected-case evidence, preserves warnings and provenance, and opens safe details", async () => {
    searchSkyControlPaymentCases.mockResolvedValue({ candidates: [] }); searchSkyControlWallets.mockResolvedValue({ candidates: [{ entity_type: "WALLET", entity_id: "0xevidence", address: "0xevidence", chain: "bsc", label: "Evidence case" }] });
    fetchSkyControlPaymentCase.mockResolvedValue({ case: {}, timeline: [{ event_type: "ORDER_CREATED", evidence_type: "DIRECT", timestamp: "2026-01-01T00:00:00Z", order_id: "o1", provenance: [{ source_system: "quick", source_table: "orders", source_record_id: "o1" }] }], evidence: [{ relationship_type: "ADMIN_ACTIVITY_LINKED_TO_PAYMENT_FLOW", evidence_type: "CORRELATED", admin_id: "a1", payment_id: "p1", reason_codes: ["EXACT_LINK"], provenance: [{ source_system: "quick", source_table: "admin_actions", source_record_id: "a1" }] }, { relationship_type: "USER_PAYMENT_FLOW_LINK", evidence_type: "UNPROVEN", user_id: "u1" }] });
    fetchSkyControlMoneyFlow.mockResolvedValue({ edges: [{ tx_hash: "0xtx", evidence_type: "DERIVED", relationship_type: "FORWARDING", provenance: [{ source_system: "moralis", source_table: "transfers", source_record_id: "tx1" }] }, { tx_hash: "0xtx", evidence_type: "DERIVED", relationship_type: "FORWARDING", provenance: [{ source_system: "moralis", source_table: "transfers", source_record_id: "tx1" }] }], paths: [] }); fetchSkyControlWalletAnomalies.mockResolvedValue({ anomalies: [{ rule_id: "SAME_TRANSACTION_MULTI_PAYMENT", title: "Repeated reference", evidence_type: "CORRELATED", tx_hash: "0xtx" }] });
    render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "evidence" } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /Evidence case/ }));
    const evidence = await screen.findByRole("region", { name: "Wallet Intelligence Evidence" }); ["DIRECT: 1", "DERIVED: 1", "CORRELATED: 2", "UNPROVEN: 1"].forEach((label) => expect(evidence).toHaveTextContent(label)); expect(evidence).toHaveTextContent("This application linkage does not prove wallet ownership or control."); expect(evidence).toHaveTextContent(/Unproven items are hypotheses/i); expect(evidence).toHaveTextContent(/quick.*orders.*o1/); fireEvent.change(screen.getByLabelText("Wallet evidence type filter"), { target: { value: "DERIVED" } }); expect(evidence.querySelector("tbody")).toHaveTextContent("FORWARDING"); expect(evidence.querySelector("tbody")).not.toHaveTextContent("ORDER_CREATED"); fireEvent.click(screen.getByRole("button", { name: "View evidence" })); const drawer = screen.getByRole("complementary", { name: "Evidence Detail" }); expect(drawer).toHaveTextContent("Evidence Type: DERIVED"); expect(drawer).toHaveTextContent(/moralis.*transfers.*tx1/); fireEvent.click(screen.getByRole("button", { name: "Close evidence detail" })); expect(screen.queryByRole("complementary", { name: "Evidence Detail" })).not.toBeInTheDocument();
  });

  it("shows the Wallet Intelligence evidence empty state without broad evidence fetching", async () => {
    searchSkyControlPaymentCases.mockResolvedValue({ candidates: [{ entity_type: "PAYMENT", entity_id: "none", label: "No evidence case" }] }); searchSkyControlWallets.mockResolvedValue({ candidates: [] }); fetchSkyControlPaymentCase.mockResolvedValue({ case: {} }); fetchSkyControlWalletAnomalies.mockResolvedValue({ anomalies: [] }); render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "none" } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /No evidence case/ })); const evidence = await screen.findByRole("region", { name: "Wallet Intelligence Evidence" }); expect(evidence).toHaveTextContent("No case evidence is available from the currently loaded sources."); expect(evidence).toHaveTextContent("Missing evidence is not proof that an activity or relationship did not occur."); expect(fetchSkyControlForensicGraph).not.toHaveBeenCalled();
  });

  it("downloads canonical Wallet Intelligence JSON and backend CSV exports with safe filenames", async () => {
    const hash = `sha256:${"b".repeat(64)}`; Object.defineProperty(URL, "createObjectURL", { configurable: true, value: jest.fn().mockReturnValue("blob:wallet") }); Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: jest.fn() }); const downloads = []; jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function capture() { downloads.push(this.download); });
    searchSkyControlPaymentCases.mockResolvedValue({ candidates: [{ entity_type: "PAYMENT", entity_id: "unsafe/very-long-wallet-identifier-1234567890", label: "Export case" }] }); searchSkyControlWallets.mockResolvedValue({ candidates: [] }); fetchSkyControlPaymentCase.mockResolvedValue({ case: {} }); fetchSkyControlWalletExport.mockResolvedValueOnce({ blob: new Blob(["canonical-json"], { type: "application/json" }), contentType: "application/json", integrityHash: hash }).mockResolvedValueOnce({ blob: new Blob(["tx_hash,chain"], { type: "text/csv" }), contentType: "text/csv" }).mockResolvedValueOnce({ blob: new Blob(["from,to"], { type: "text/csv" }), contentType: "text/csv" }).mockResolvedValueOnce({ blob: new Blob(["system,address"], { type: "text/csv" }), contentType: "text/csv" }).mockResolvedValueOnce({ blob: new Blob(["address,chain"], { type: "text/csv" }), contentType: "text/csv" });
    render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "export" } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /Export case/ })); const exportRegion = await screen.findByRole("region", { name: "Wallet Intelligence Export" }); expect(exportRegion).toHaveTextContent("Hash verifies exported bundle content");
    const labels = ["Export Case JSON", "Export Transactions CSV", "Export Money Flow CSV", "Export Wallet History CSV", "Export Counterparties CSV"]; for (const [index, label] of labels.entries()) { const button = exportRegion.querySelector(`[aria-label="${label}"]`); fireEvent.click(button); await waitFor(() => expect(downloads).toHaveLength(index + 1)); await waitFor(() => expect(button).not.toBeDisabled()); if (index === 0) expect(exportRegion).toHaveTextContent(hash); } expect(fetchSkyControlWalletExport).toHaveBeenNthCalledWith(1, "json", { case_type: "PAYMENT", case_id: "unsafe/very-long-wallet-identifier-1234567890" }); expect(fetchSkyControlWalletExport).toHaveBeenNthCalledWith(2, "csv", { case_type: "PAYMENT", case_id: "unsafe/very-long-wallet-identifier-1234567890", type: "transactions" }); expect(fetchSkyControlWalletExport).toHaveBeenNthCalledWith(3, "csv", { case_type: "PAYMENT", case_id: "unsafe/very-long-wallet-identifier-1234567890", type: "money_flow" }); expect(fetchSkyControlWalletExport).toHaveBeenNthCalledWith(4, "csv", { case_type: "PAYMENT", case_id: "unsafe/very-long-wallet-identifier-1234567890", type: "wallet_history" }); expect(fetchSkyControlWalletExport).toHaveBeenNthCalledWith(5, "csv", { case_type: "PAYMENT", case_id: "unsafe/very-long-wallet-identifier-1234567890", type: "counterparties" }); expect(downloads).toEqual(expect.arrayContaining([expect.stringMatching(/^sky-wallet-case-payment-/), expect.stringMatching(/^sky-wallet-transactions-/), expect.stringMatching(/^sky-wallet-money-flow-/), expect.stringMatching(/^sky-wallet-history-/), expect.stringMatching(/^sky-wallet-counterparties-/)])); expect(downloads.join(" ")).not.toMatch(/[\\/:*?"<>|]/);
  });

  it("keeps valid header-only and degraded exports downloadable while sanitizing export errors", async () => {
    searchSkyControlPaymentCases.mockResolvedValue({ candidates: [{ entity_type: "PAYMENT", entity_id: "errors", label: "Error case" }] }); searchSkyControlWallets.mockResolvedValue({ candidates: [] }); fetchSkyControlPaymentCase.mockResolvedValue({ case: {} }); fetchSkyControlWalletExport.mockResolvedValueOnce({ blob: new Blob(["tx_hash,chain\r\n"], { type: "text/csv" }), contentType: "text/csv" }).mockResolvedValueOnce({ blob: new Blob(["{}"], { type: "application/json" }), contentType: "application/json", integrityHash: "invalid" }).mockRejectedValueOnce(Object.assign(new Error("provider host secret"), { status: 403 })); Object.defineProperty(URL, "createObjectURL", { configurable: true, value: jest.fn().mockReturnValue("blob:wallet") }); Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: jest.fn() }); jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "errors" } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /Error case/ })); const exportRegion = await screen.findByRole("region", { name: "Wallet Intelligence Export" }); const transactionsButton = exportRegion.querySelector('[aria-label="Export Transactions CSV"]'); fireEvent.click(transactionsButton); await waitFor(() => expect(fetchSkyControlWalletExport).toHaveBeenCalledWith("csv", expect.objectContaining({ type: "transactions" }))); await waitFor(() => expect(transactionsButton).not.toBeDisabled()); const jsonButton = exportRegion.querySelector('[aria-label="Export Case JSON"]'); fireEvent.click(jsonButton); await waitFor(() => expect(jsonButton).not.toBeDisabled()); expect(exportRegion.querySelector(".sky-control-page__wallet-export-hash")).not.toBeInTheDocument(); fireEvent.click(exportRegion.querySelector('[aria-label="Export Counterparties CSV"]')); expect(await screen.findByRole("alert")).toHaveTextContent("Not authorized for this export."); expect(screen.queryByText(/provider host secret/i)).not.toBeInTheDocument();
  });

  it("blocks wallet exports without a selected chain before making a request", async () => {
    searchSkyControlPaymentCases.mockResolvedValue({ candidates: [] }); searchSkyControlWallets.mockResolvedValue({ candidates: [{ entity_type: "WALLET", entity_id: "0xrawwallet", label: "Wallet without chain" }] }); fetchSkyControlPaymentCase.mockResolvedValue({ case: {} }); render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "wallet" } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /Wallet without chain/ })); const exportRegion = await screen.findByRole("region", { name: "Wallet Intelligence Export" }); fireEvent.click(exportRegion.querySelector('[aria-label="Export Case JSON"]')); expect(await screen.findByRole("alert")).toHaveTextContent("Selected case is missing required chain information."); expect(fetchSkyControlWalletExport).not.toHaveBeenCalled();
  });

  it("sanitizes unavailable export responses and clears export state when the Wallet Intelligence seed changes", async () => {
    const hash = `sha256:${"c".repeat(64)}`; searchSkyControlPaymentCases.mockResolvedValueOnce({ candidates: [{ entity_type: "PAYMENT", entity_id: "first", label: "First case" }] }).mockResolvedValueOnce({ candidates: [{ entity_type: "PAYMENT", entity_id: "second", label: "Second case" }] }); searchSkyControlWallets.mockResolvedValue({ candidates: [] }); fetchSkyControlPaymentCase.mockResolvedValue({ case: {} }); fetchSkyControlWalletExport.mockResolvedValueOnce({ blob: new Blob(["{}"], { type: "application/json" }), contentType: "application/json", integrityHash: hash }).mockRejectedValueOnce(Object.assign(new Error("internal provider detail"), { status: 400 })); Object.defineProperty(URL, "createObjectURL", { configurable: true, value: jest.fn().mockReturnValue("blob:wallet") }); Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: jest.fn() }); jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "first" } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /First case/ })); const firstExport = await screen.findByRole("region", { name: "Wallet Intelligence Export" }); fireEvent.click(firstExport.querySelector('[aria-label="Export Case JSON"]')); await screen.findByText(hash); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "second" } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /Second case/ })); const secondExport = await screen.findByRole("region", { name: "Wallet Intelligence Export" }); expect(secondExport).not.toHaveTextContent(hash); fireEvent.click(secondExport.querySelector('[aria-label="Export Case JSON"]')); expect(await screen.findByRole("alert")).toHaveTextContent("Requested export is not available."); expect(buildSkyControlWalletExportParams).toHaveBeenLastCalledWith(expect.objectContaining({ entity_id: "second" }), ""); expect(screen.queryByText(/internal provider detail/i)).not.toBeInTheDocument();
  });

  it("loads QuickMail Automatic Discovery, distinguishes configured evidence, and opens a destination detail", async () => {
    const address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    fetchSkyControlWalletDiscovery.mockResolvedValue({
      items: [{ address, chain: "bsc", systems: ["quick"], payment_count: 2, order_count: 2, admin_action_count: 1, first_seen: "2026-01-01T00:00:00Z", last_seen: "2026-01-02T00:00:00Z", onchain_status: "CONFIGURED_OR_APPLICATION_OBSERVED", destination_history: [], service_labels: [], evidence_type: "DIRECT" }],
      summary: { total_destinations: 1, verified_onchain_destinations: 0, application_only_destinations: 1, destinations_with_admin_activity: 1, multi_system_destinations: 0, destination_changes: 0, reused_destinations: 0, known_service_hits: 0 },
      source_status: { withdrawals: { available: true }, payments: { available: false, reason: "QUERY_FAILED" } }, provider_status: { bsc: { available: false } },
    });
    fetchSkyControlWalletDiscoveryDetail.mockResolvedValue({ destination: { address, chain: "bsc" }, application_observations: [{ kind: "CONFIGURED_DESTINATION", system: "quick", timestamp: "2026-01-01T00:00:00Z" }], payment_links: [{ system: "quick", order_id: "o1", payment_reference: "ref1" }], order_links: [{ system: "quick", order_id: "o1" }], admin_links: [{ system: "quick", action: "review", timestamp: "2026-01-02T00:00:00Z" }], destination_history: [{ previous_address: null, address, next_address: null, reuse_count: 1 }], transaction_references: [{ classification: "APPLICATION_REFERENCE", value: "ref1" }], confirmed_receipts: [], amount_summary: { confirmed_receipt_count: 0 }, money_flow_summary: { graph_available: false }, provider_status: { bsc: { available: false } }, source_status: { withdrawals: { available: true } }, limitations: ["Provider is degraded"], provenance: [{ source_system: "quick", source_table: "withdrawals", source_record_id: "1" }] });
    render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>);
    expect(await screen.findByRole("region", { name: "Automatic Discovery" })).toHaveTextContent("QuickMail Discovery Summary");
    expect(fetchSkyControlWalletDiscovery).toHaveBeenCalledWith(expect.objectContaining({ system: "quickmail" }), expect.any(Object));
    expect(await screen.findByText("Configured / Application observed")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Observed Payment Destinations" })).toBeInTheDocument();
    expect(screen.getByText("Admin-linked application activity does not prove wallet ownership or control.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View destination" }));
    expect(fetchSkyControlWalletDiscoveryDetail).toHaveBeenCalledWith("bsc", address);
    expect(await screen.findByText("Transaction References")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Destination details" })).toHaveTextContent("Transaction References");
    expect(screen.queryByText(/Admin Wallet|Owner Wallet|Scammer Wallet|Criminal Wallet/i)).not.toBeInTheDocument();
  });
});
