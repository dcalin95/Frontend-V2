import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SkyControlPage from "../SkyControlPage";
import {
  fetchSkyControl,
  fetchSkyControlSummary,
  fetchSkyControlForensicAnomalies,
  fetchSkyControlForensicEntity,
  fetchSkyControlForensicExport,
  fetchSkyControlForensicGraph,
  fetchSkyControlForensicTimeline,
  fetchSkyControlPaymentCase,
  fetchSkyControlMoneyFlow,
  fetchSkyControlTransaction,
  fetchSkyControlWallet,
  fetchSkyControlWalletAnomalies,
  fetchSkyControlWalletExport,
  fetchSkyControlWalletHistory,
  searchSkyControlForensics,
  searchSkyControlPaymentCases,
  searchSkyControlWallets,
} from "../../services/skyControlService";

jest.mock("../../services/skyControlService", () => ({
  fetchSkyControlSummary: jest.fn().mockResolvedValue({
    health: { database: "connected" },
    overview: {
      quick: {
        status: "available",
        metrics: { active_subscriptions: 1, admin_actions_total: 2 },
      },
      skycloud: {
        status: "available",
        metrics: { active_subscriptions: 3, admin_actions_total: 4 },
      },
      bot_fleet: { metrics: { total: 5 } },
      payments: {
        metrics: { quick_payment_proofs: 6, skycloud_payment_proofs: 7 },
      },
    },
  }),
  fetchSkyControl: jest.fn().mockResolvedValue({ items: [] }),
  searchSkyControlForensics: jest.fn(),
  fetchSkyControlForensicGraph: jest.fn(),
  fetchSkyControlForensicEntity: jest.fn(),
  fetchSkyControlForensicTimeline: jest.fn(),
  fetchSkyControlForensicAnomalies: jest
    .fn()
    .mockResolvedValue({ anomalies: [] }),
  fetchSkyControlForensicExport: jest.fn(),
  searchSkyControlPaymentCases: jest.fn(),
  searchSkyControlWallets: jest.fn(),
  fetchSkyControlPaymentCase: jest.fn(),
  fetchSkyControlWallet: jest.fn(),
  fetchSkyControlTransaction: jest.fn(),
  fetchSkyControlMoneyFlow: jest.fn(),
  fetchSkyControlWalletHistory: jest.fn().mockResolvedValue({ items: [] }),
  fetchSkyControlWalletAnomalies: jest.fn().mockResolvedValue({ anomalies: [] }),
  fetchSkyControlWalletExport: jest.fn(),
}));

describe("SkyControlPage", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    fetchSkyControlSummary.mockImplementation(() => new Promise(() => {}));
    fetchSkyControl.mockImplementation(() => new Promise(() => {}));
  });

  const graph = { seed: { label: "Reader" }, nodes: [], edges: [] };
  const entity = {
    entity: { type: "USER", label: "Reader", safe_metadata: {} },
  };
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
    searchSkyControlForensics.mockResolvedValue({
      count: 1,
      candidates: [
        {
          entity_type: "USER",
          entity_id: "7",
          label: "Reader",
          system: "quick",
        },
      ],
    });
    fetchSkyControlForensicGraph.mockResolvedValue(graph);
    fetchSkyControlForensicEntity.mockResolvedValue(entity);
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
  };

  afterEach(() => {
    delete global.fetch;
    jest.restoreAllMocks();
  });

  it("exports backend-canonical JSON and CSV only after a seed, with safe filenames and a readable integrity hash", async () => {
    const integrityHash = `sha256:${"a".repeat(64)}`;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: jest.fn().mockReturnValue("blob:export"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: jest.fn(),
    });
    const downloads = [];
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function captureDownload() {
        downloads.push(this.download);
      });
    fetchSkyControlForensicExport
      .mockResolvedValueOnce({
        blob: new Blob([`{"integrity_hash":"${integrityHash}"}`], {
          type: "application/json",
        }),
        contentType: "application/json",
        integrityHash,
      })
      .mockResolvedValueOnce({
        blob: new Blob(["time,event"], { type: "text/csv" }),
        contentType: "text/csv",
      });
    render(
      <MemoryRouter initialEntries={["/?tab=forensics"]}>
        <SkyControlPage />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole("button", { name: "Export JSON" }),
    ).not.toBeInTheDocument();
    searchSkyControlForensics.mockResolvedValue({
      count: 1,
      candidates: [
        {
          entity_type: "ADDRESS",
          entity_id:
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          label: "Public address",
          safe_metadata: { bot_token: "hidden" },
        },
      ],
    });
    fetchSkyControlForensicGraph.mockResolvedValue({
      seed: { label: "Public address" },
      nodes: [],
      edges: [],
    });
    fetchSkyControlForensicEntity.mockResolvedValue({
      entity: { type: "ADDRESS", label: "Public address", safe_metadata: {} },
    });
    fireEvent.change(screen.getByLabelText("Forensic search"), {
      target: { value: "address" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.click(
      await screen.findByRole("button", { name: /Public address/i }),
    );
    expect(
      screen.queryByRole("button", { name: "Open in Investigator" }),
    ).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Export JSON" }));
    await waitFor(() =>
      expect(fetchSkyControlForensicExport).toHaveBeenCalledWith("json", {
        seed_type: "ADDRESS",
        seed_id:
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      }),
    );
    expect(
      await screen.findByText("Export integrity hash"),
    ).toBeInTheDocument();
    expect(screen.getByText(integrityHash)).toBeInTheDocument();
    expect(
      screen.getByText(/does not prove the immutability/i),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Export Timeline CSV" }),
    );
    await waitFor(() =>
      expect(fetchSkyControlForensicExport).toHaveBeenLastCalledWith("csv", {
        seed_type: "ADDRESS",
        seed_id:
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      }),
    );
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(click).toHaveBeenCalledTimes(2);
    expect(URL.createObjectURL.mock.calls[0][0].type).toBe("application/json");
    expect(URL.createObjectURL.mock.calls[1][0].type).toBe("text/csv");
    expect(downloads).toEqual([
      "sky-control-forensics-address-0xaaaaaaaa-aaaaaa.json",
      "sky-control-forensics-address-0xaaaaaaaa-aaaaaa-timeline.csv",
    ]);
    expect(downloads.join("")).not.toContain("hidden");
  });

  it("shows a sanitized export failure without interrupting the forensic workspace", async () => {
    fetchSkyControlForensicExport.mockRejectedValueOnce(
      new Error("password=hidden SQL stack"),
    );
    await selectTimelineSeed();
    fireEvent.click(await screen.findByRole("button", { name: "Export JSON" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Export unavailable. Please try again.",
    );
    expect(
      screen.queryByText(/password=hidden|SQL stack/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export Timeline CSV" }),
    ).toBeEnabled();
  });

  it("renders the read-only overview shell without external requests", () => {
    render(
      <MemoryRouter>
        <SkyControlPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Sky Control" }),
    ).toBeInTheDocument();
    expect(screen.getByText("READ ONLY")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getAllByText("Loading")).toHaveLength(6);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("changes tabs with a keyboard and keeps the view read only", () => {
    render(
      <MemoryRouter>
        <SkyControlPage />
      </MemoryRouter>,
    );

    const overview = screen.getByRole("tab", { name: "Overview" });
    fireEvent.keyDown(overview, { key: "ArrowRight" });

    expect(screen.getByRole("tab", { name: "Gateway" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByText(
        "SERVICE RUNTIME NOT CONNECTED. This view contains database-derived metadata only.",
      ),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("renders only safe overview summaries after the provider connects", async () => {
    fetchSkyControlSummary.mockResolvedValue({
      health: { database: "connected" },
      overview: {
        quick: {
          status: "available",
          metrics: { active_subscriptions: 1, admin_actions_total: 2 },
        },
        skycloud: {
          status: "available",
          metrics: { active_subscriptions: 3, admin_actions_total: 4 },
        },
        bot_fleet: { metrics: { total: 5 } },
        payments: {
          metrics: { quick_payment_proofs: 6, skycloud_payment_proofs: 7 },
        },
      },
      schema: {
        tables: [
          { table: "users", compatible: true },
          { table: "halcyon_user_bots", compatible: false },
        ],
      },
    });
    render(
      <MemoryRouter>
        <SkyControlPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText("5 bots")).toBeInTheDocument();
    expect(screen.getByText("4 active")).toBeInTheDocument();
    expect(screen.getByText("SCHEMA INCOMPATIBLE")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("opens and safely closes the selected forensic entity drawer", async () => {
    searchSkyControlForensics.mockResolvedValue({
      count: 1,
      candidates: [
        {
          entity_type: "USER",
          entity_id: "7",
          label: "Reader",
          system: "quick",
        },
      ],
    });
    fetchSkyControlForensicGraph.mockResolvedValue({
      seed: { label: "Reader" },
      nodes: [],
      edges: [],
    });
    fetchSkyControlForensicTimeline.mockResolvedValue({ events: [] });
    fetchSkyControlForensicEntity.mockResolvedValue({
      entity: {
        type: "USER",
        label: "Reader",
        system: "quick",
        first_seen: "2026-01-01T00:00:00Z",
        last_seen: "bad",
        safe_metadata: {
          user_id: "7",
          bot_username: "safe-bot",
          language: "en",
          bot_token: "hidden",
          password: "hidden",
        },
      },
      connected_entities: [
        { type: "BOT", id: "b", label: "safe-bot", system: "quick" },
      ],
      provenance: [
        {
          source_system: "quick",
          source_table: "users",
          source_record_id: "7",
          event_time: "2026-01-01T00:00:00Z",
        },
        {
          source_system: "skycloud",
          source_table: "users",
          source_record_id: "7",
          event_time: "2026-01-02T00:00:00Z",
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
    expect(await screen.findByText("Reader")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Reader/i }));
    expect(
      await screen.findByRole("complementary", { name: "Entity details" }),
    ).toBeInTheDocument();
    expect(screen.getByText("USER: Reader")).toBeInTheDocument();
    expect(screen.getAllByText(/safe-bot/)).toHaveLength(2);
    expect(screen.getByText(/quick · users · 7/)).toBeInTheDocument();
    expect(screen.getByText("Last seen: -")).toBeInTheDocument();
    expect(screen.queryByText("bot_token")).not.toBeInTheDocument();
    expect(screen.queryByText("hidden")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Close entity details" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("complementary", { name: "Entity details" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("opens a safe relationship drawer with deterministic evidence details", async () => {
    const relationship = {
      relationship_type: "ORDER_SUBSCRIPTION",
      source_entity_type: "ORDER",
      source_entity_id: "o1",
      target_entity_type: "SUBSCRIPTION",
      target_entity_id: "s1",
      evidence_type: "DERIVED",
      confidence: 0.75,
      reason_codes: ["same_user_id", "within_window"],
      event_time: "2026-01-01T00:00:00Z",
      metadata: {
        rule_id: "DERIVED_ORDER_SUBSCRIPTION",
        rule_description: "Observed application sequence.",
        matched_fields: ["user_id", "plan_id"],
        time_delta_seconds: 600,
        password: "hidden",
        provenance: [
          {
            source_system: "quick",
            source_table: "quick_orders",
            source_record_id: "o1",
            event_time: "2026-01-01T00:00:00Z",
          },
          {
            source_system: "quick",
            source_table: "quick_subscriptions",
            source_record_id: "s1",
            event_time: "2026-01-01T00:10:00Z",
          },
        ],
      },
    };
    searchSkyControlForensics.mockResolvedValue({
      count: 1,
      candidates: [
        {
          entity_type: "USER",
          entity_id: "7",
          label: "Reader",
          system: "quick",
        },
      ],
    });
    fetchSkyControlForensicGraph.mockResolvedValue({
      seed: { label: "Reader" },
      nodes: [],
      edges: [relationship],
    });
    fetchSkyControlForensicEntity.mockResolvedValue({
      entity: { type: "USER", label: "Reader", safe_metadata: {} },
    });
    fetchSkyControlForensicTimeline.mockResolvedValue({ events: [] });
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
    const drawer = screen.getByRole("complementary", {
      name: "Relationship details",
    });
    expect(drawer).toBeInTheDocument();
    expect(drawer).toHaveTextContent("ORDER_SUBSCRIPTION");
    expect(drawer).toHaveTextContent("From: ORDER: o1");
    expect(drawer).toHaveTextContent("To: SUBSCRIPTION: s1");
    expect(drawer).toHaveTextContent("Evidence: DERIVED");
    expect(drawer).toHaveTextContent("Confidence: 75%");
    expect(drawer).toHaveTextContent(
      `Event time: ${new Date("2026-01-01T00:00:00Z").toLocaleString()}`,
    );
    expect(drawer).toHaveTextContent(/same_user_id, within_window/);
    expect(drawer).toHaveTextContent(/quick · quick_orders · o1/);
    expect(screen.queryByText("hidden")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Close relationship details" }),
    );
    expect(
      screen.queryByRole("complementary", { name: "Relationship details" }),
    ).not.toBeInTheDocument();
  });

  it("renders all relationship evidence labels, confidence values, and safe fallbacks", async () => {
    searchSkyControlForensics.mockResolvedValue({
      count: 1,
      candidates: [
        {
          entity_type: "USER",
          entity_id: "7",
          label: "Reader",
          system: "quick",
        },
      ],
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
          evidence_type: "DIRECT",
          confidence: 1,
          event_time: null,
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
    const legend = document.querySelector(".sky-control-page__legend");
    ["DIRECT", "DERIVED", "CORRELATED", "UNPROVEN"].forEach((label) =>
      expect(legend).toHaveTextContent(label),
    );
    const drawer = screen.getByRole("complementary", {
      name: "Relationship details",
    });
    expect(drawer).toHaveTextContent("Confidence: 100%");
    expect(drawer).toHaveTextContent("Event time: -");
    expect(drawer).toHaveTextContent("No source provenance available");
    expect(drawer).toHaveTextContent(
      /Deterministic application-data confidence; not identity proof/,
    );
    expect(drawer).not.toHaveTextContent(/Invalid Date|\[object Object\]|\{\}/);
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
    const labels = ["Export Case JSON", "Export Transactions CSV", "Export Money Flow CSV", "Export Wallet History CSV", "Export Counterparties CSV"]; for (const [index, label] of labels.entries()) { const button = exportRegion.querySelector(`[aria-label="${label}"]`); fireEvent.click(button); await waitFor(() => expect(downloads).toHaveLength(index + 1)); await waitFor(() => expect(button).not.toBeDisabled()); if (index === 0) expect(exportRegion).toHaveTextContent(hash); } expect(fetchSkyControlWalletExport).toHaveBeenNthCalledWith(1, "json", { seed_type: "PAYMENT", seed_id: "unsafe/very-long-wallet-identifier-1234567890" }); expect(fetchSkyControlWalletExport).toHaveBeenNthCalledWith(2, "csv", { seed_type: "PAYMENT", seed_id: "unsafe/very-long-wallet-identifier-1234567890", type: "transactions" }); expect(downloads).toEqual(expect.arrayContaining([expect.stringMatching(/^sky-wallet-case-payment-/), expect.stringMatching(/^sky-wallet-transactions-/), expect.stringMatching(/^sky-wallet-money-flow-/), expect.stringMatching(/^sky-wallet-history-/), expect.stringMatching(/^sky-wallet-counterparties-/)])); expect(downloads.join(" ")).not.toMatch(/[\\/:*?"<>|]/);
  });

  it("keeps valid header-only and degraded exports downloadable while sanitizing export errors", async () => {
    searchSkyControlPaymentCases.mockResolvedValue({ candidates: [{ entity_type: "PAYMENT", entity_id: "errors", label: "Error case" }] }); searchSkyControlWallets.mockResolvedValue({ candidates: [] }); fetchSkyControlPaymentCase.mockResolvedValue({ case: {} }); fetchSkyControlWalletExport.mockResolvedValueOnce({ blob: new Blob(["tx_hash,chain\r\n"], { type: "text/csv" }), contentType: "text/csv" }).mockResolvedValueOnce({ blob: new Blob(["{}"], { type: "application/json" }), contentType: "application/json", integrityHash: "invalid" }).mockRejectedValueOnce(Object.assign(new Error("provider host secret"), { status: 403 })); Object.defineProperty(URL, "createObjectURL", { configurable: true, value: jest.fn().mockReturnValue("blob:wallet") }); Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: jest.fn() }); jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "errors" } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /Error case/ })); const exportRegion = await screen.findByRole("region", { name: "Wallet Intelligence Export" }); const transactionsButton = exportRegion.querySelector('[aria-label="Export Transactions CSV"]'); fireEvent.click(transactionsButton); await waitFor(() => expect(fetchSkyControlWalletExport).toHaveBeenCalledWith("csv", expect.objectContaining({ type: "transactions" }))); await waitFor(() => expect(transactionsButton).not.toBeDisabled()); const jsonButton = exportRegion.querySelector('[aria-label="Export Case JSON"]'); fireEvent.click(jsonButton); await waitFor(() => expect(jsonButton).not.toBeDisabled()); expect(exportRegion.querySelector(".sky-control-page__wallet-export-hash")).not.toBeInTheDocument(); fireEvent.click(exportRegion.querySelector('[aria-label="Export Counterparties CSV"]')); expect(await screen.findByRole("alert")).toHaveTextContent("Not authorized for this export."); expect(screen.queryByText(/provider host secret/i)).not.toBeInTheDocument();
  });

  it("sanitizes unavailable export responses and clears export state when the Wallet Intelligence seed changes", async () => {
    const hash = `sha256:${"c".repeat(64)}`; searchSkyControlPaymentCases.mockResolvedValueOnce({ candidates: [{ entity_type: "PAYMENT", entity_id: "first", label: "First case" }] }).mockResolvedValueOnce({ candidates: [{ entity_type: "PAYMENT", entity_id: "second", label: "Second case" }] }); searchSkyControlWallets.mockResolvedValue({ candidates: [] }); fetchSkyControlPaymentCase.mockResolvedValue({ case: {} }); fetchSkyControlWalletExport.mockResolvedValueOnce({ blob: new Blob(["{}"], { type: "application/json" }), contentType: "application/json", integrityHash: hash }).mockRejectedValueOnce(Object.assign(new Error("internal provider detail"), { status: 400 })); Object.defineProperty(URL, "createObjectURL", { configurable: true, value: jest.fn().mockReturnValue("blob:wallet") }); Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: jest.fn() }); jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<MemoryRouter initialEntries={["/?tab=wallet-intelligence"]}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "first" } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /First case/ })); const firstExport = await screen.findByRole("region", { name: "Wallet Intelligence Export" }); fireEvent.click(firstExport.querySelector('[aria-label="Export Case JSON"]')); await screen.findByText(hash); fireEvent.change(screen.getByLabelText("Wallet Intelligence search"), { target: { value: "second" } }); fireEvent.click(screen.getByRole("button", { name: "Search" })); fireEvent.click(await screen.findByRole("button", { name: /Second case/ })); const secondExport = await screen.findByRole("region", { name: "Wallet Intelligence Export" }); expect(secondExport).not.toHaveTextContent(hash); fireEvent.click(secondExport.querySelector('[aria-label="Export Case JSON"]')); expect(await screen.findByRole("alert")).toHaveTextContent("Requested export is not available."); expect(screen.queryByText(/internal provider detail/i)).not.toBeInTheDocument();
  });
});
