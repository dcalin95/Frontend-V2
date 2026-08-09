import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SkyControlPage, { formatRelativeTime, formatTimestamp } from '../SkyControlPage';
import { fetchSkyControl, fetchSkyControlSummary, searchSkyControlForensics, fetchSkyControlForensicEntity, fetchSkyControlForensicGraph, fetchSkyControlForensicTimeline, fetchSkyControlForensicAnomalies, fetchSkyControlForensicExport, fetchSkyControlPaymentCase, fetchSkyControlWallet, searchSkyControlPaymentCases, searchSkyControlWallets } from '../../services/skyControlService';

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
}));

describe('SkyControlPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    fetchSkyControlSummary.mockImplementation(() => new Promise(() => {}));
    fetchSkyControl.mockImplementation(() => new Promise(() => {}));
  });

  afterEach(() => {
    delete global.fetch;
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
    fireEvent.click(
      await screen.findByRole("button", { name: "Open relationship details" }),
    );
    expect(
      screen.getByRole("complementary", { name: "Relationship details" }),
    ).toHaveTextContent(`Confidence: ${expected}`);
    expect(screen.getByText("Event time: -")).toBeInTheDocument();
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
    expect(table).toHaveTextContent("admin-1");
    expect(table).toHaveTextContent("user-7");
    expect(table).toHaveTextContent("order-1");
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
    cleanup();
    fetchSkyControlForensicTimeline.mockRejectedValueOnce(
      new Error("SQL connection failure"),
    );
    await selectTimelineSeed();
    expect(await screen.findByText("Timeline unavailable")).toBeInTheDocument();
    expect(
      screen.queryByText(/SQL connection failure|internal details/i),
    ).not.toBeInTheDocument();
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
    const anomalies = await screen.findByRole("region", {
      name: "Forensic anomalies",
    });
    expect(anomalies).toHaveTextContent(
      /unusual or inconsistent application patterns/i,
    );
    expect(anomalies).toHaveTextContent("Severity: HIGH");
    expect(anomalies).toHaveTextContent("Rule: RULE_1");
    expect(anomalies).toHaveTextContent("Neutral signal");
    expect(anomalies).toHaveTextContent("Observed inconsistency");
    expect(anomalies).toHaveTextContent("Evidence Type: CORRELATED");
    fireEvent.click(screen.getByRole("button", { name: "Why flagged" }));
    expect(anomalies).toHaveTextContent("Reason codes: same_user");
    expect(anomalies).toHaveTextContent("Record IDs: o1");
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
    fireEvent.change(screen.getByLabelText("Anomaly evidence type filter"), {
      target: { value: "CORRELATED" },
    });
    await waitFor(() =>
      expect(fetchSkyControlForensicAnomalies).toHaveBeenLastCalledWith(
        expect.objectContaining({ evidence_type: "CORRELATED" }),
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
    const evidence = screen.getByRole("region", { name: "Forensic evidence" });
    await waitFor(() =>
      expect(evidence).toHaveTextContent("ORDER_SUBSCRIPTION"),
    );
    expect(evidence).toHaveTextContent("Evidence Type: DIRECT");
    expect(evidence).toHaveTextContent("Evidence Type: DERIVED");
    expect(evidence).toHaveTextContent("Evidence Type: CORRELATED");
    expect(evidence).toHaveTextContent("Confidence: 100%");
    expect(evidence).toHaveTextContent("Confidence: -");
    expect(evidence).toHaveTextContent("quick · orders · o1");
    expect(evidence).toHaveTextContent("skycloud · payments · p1");
    expect(evidence).not.toHaveTextContent(
      /hidden|\[object Object\]|\{\}|Invalid Date/,
    );
    const limits = screen.getByRole("region", { name: "Forensic limitations" });
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
});
