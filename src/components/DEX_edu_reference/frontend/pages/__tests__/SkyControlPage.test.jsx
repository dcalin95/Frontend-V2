import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SkyControlPage from '../SkyControlPage';
import { fetchSkyControl, fetchSkyControlSummary, fetchSkyControlForensicAnomalies, fetchSkyControlForensicEntity, fetchSkyControlForensicExport, fetchSkyControlForensicGraph, fetchSkyControlForensicTimeline, searchSkyControlForensics } from '../../services/skyControlService';

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
  searchSkyControlForensics: jest.fn(), fetchSkyControlForensicGraph: jest.fn(), fetchSkyControlForensicEntity: jest.fn(), fetchSkyControlForensicTimeline: jest.fn(), fetchSkyControlForensicAnomalies: jest.fn().mockResolvedValue({ anomalies: [] }), fetchSkyControlForensicExport: jest.fn(),
}));

describe('SkyControlPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    fetchSkyControlSummary.mockImplementation(() => new Promise(() => {}));
    fetchSkyControl.mockImplementation(() => new Promise(() => {}));
  });

  const graph = { seed: { label: 'Reader' }, nodes: [], edges: [] };
  const entity = { entity: { type: 'USER', label: 'Reader', safe_metadata: {} } };
  const timelineEvent = (overrides = {}) => ({ event_id: 'event-1', timestamp: '2026-01-01T00:00:00Z', event_type: 'ADMIN_ACTION', source_system: 'quick', source_table: 'admin_actions', source_record_id: 'a1', evidence_type: 'DIRECT', actor: 'admin-1', subject: 'user-7', object: 'order-1', ...overrides });
  const selectTimelineSeed = async () => {
    searchSkyControlForensics.mockResolvedValue({ count: 1, candidates: [{ entity_type: 'USER', entity_id: '7', label: 'Reader', system: 'quick' }] });
    fetchSkyControlForensicGraph.mockResolvedValue(graph);
    fetchSkyControlForensicEntity.mockResolvedValue(entity);
    render(<MemoryRouter initialEntries={['/?tab=forensics']}><SkyControlPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Forensic search'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.click(await screen.findByRole('button', { name: /Reader/i }));
  };

  afterEach(() => {
    delete global.fetch;
    jest.restoreAllMocks();
  });

  it('exports backend-canonical JSON and CSV only after a seed, with safe filenames and a readable integrity hash', async () => {
    const integrityHash = 'a'.repeat(64);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn().mockReturnValue('blob:export') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
    const downloads = []; const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function captureDownload() { downloads.push(this.download); });
    fetchSkyControlForensicExport
      .mockResolvedValueOnce({ blob: new Blob([`{"integrity_hash":"${integrityHash}"}`], { type: 'application/json' }), contentType: 'application/json', integrityHash })
      .mockResolvedValueOnce({ blob: new Blob(['time,event'], { type: 'text/csv' }), contentType: 'text/csv' });
    render(<MemoryRouter initialEntries={['/?tab=forensics']}><SkyControlPage /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: 'Export JSON' })).not.toBeInTheDocument();
    searchSkyControlForensics.mockResolvedValue({ count: 1, candidates: [{ entity_type: 'ADDRESS', entity_id: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', label: 'Public address', safe_metadata: { bot_token: 'hidden' } }] });
    fetchSkyControlForensicGraph.mockResolvedValue({ seed: { label: 'Public address' }, nodes: [], edges: [] });
    fetchSkyControlForensicEntity.mockResolvedValue({ entity: { type: 'ADDRESS', label: 'Public address', safe_metadata: {} } });
    fireEvent.change(screen.getByLabelText('Forensic search'), { target: { value: 'address' } }); fireEvent.click(screen.getByRole('button', { name: 'Search' })); fireEvent.click(await screen.findByRole('button', { name: /Public address/i }));
    expect(screen.queryByRole('button', { name: 'Open in Investigator' })).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Export JSON' }));
    await waitFor(() => expect(fetchSkyControlForensicExport).toHaveBeenCalledWith('json', { seed_type: 'ADDRESS', seed_id: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }));
    expect(await screen.findByText('Export integrity hash')).toBeInTheDocument(); expect(screen.getByText(`sha256:${integrityHash}`)).toBeInTheDocument(); expect(screen.getByText(/does not prove the immutability/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Export Timeline CSV' })); await waitFor(() => expect(fetchSkyControlForensicExport).toHaveBeenLastCalledWith('csv', { seed_type: 'ADDRESS', seed_id: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2); expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2); expect(click).toHaveBeenCalledTimes(2); expect(URL.createObjectURL.mock.calls[0][0].type).toBe('application/json'); expect(URL.createObjectURL.mock.calls[1][0].type).toBe('text/csv'); expect(downloads).toEqual(['sky-control-forensics-address-0xaaaaaaaa-aaaaaa.json', 'sky-control-forensics-address-0xaaaaaaaa-aaaaaa-timeline.csv']); expect(downloads.join('')).not.toContain('hidden');
  });

  it('shows a sanitized export failure without interrupting the forensic workspace', async () => {
    fetchSkyControlForensicExport.mockRejectedValueOnce(new Error('password=hidden SQL stack'));
    await selectTimelineSeed(); fireEvent.click(await screen.findByRole('button', { name: 'Export JSON' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Export unavailable. Please try again.'); expect(screen.queryByText(/password=hidden|SQL stack/i)).not.toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Export Timeline CSV' })).toBeEnabled();
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
    expect(screen.getByText('SERVICE RUNTIME NOT CONNECTED. This view contains database-derived metadata only.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
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
    expect(await screen.findByText('5 bots')).toBeInTheDocument();
    expect(screen.getByText('4 active')).toBeInTheDocument();
    expect(screen.getByText('SCHEMA INCOMPATIBLE')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('opens and safely closes the selected forensic entity drawer', async () => {
    searchSkyControlForensics.mockResolvedValue({ count: 1, candidates: [{ entity_type: 'USER', entity_id: '7', label: 'Reader', system: 'quick' }] });
    fetchSkyControlForensicGraph.mockResolvedValue({ seed: { label: 'Reader' }, nodes: [], edges: [] });
    fetchSkyControlForensicTimeline.mockResolvedValue({ events: [] });
    fetchSkyControlForensicEntity.mockResolvedValue({ entity: { type: 'USER', label: 'Reader', system: 'quick', first_seen: '2026-01-01T00:00:00Z', last_seen: 'bad', safe_metadata: { user_id: '7', bot_username: 'safe-bot', language: 'en', bot_token: 'hidden', password: 'hidden' } }, connected_entities: [{ type: 'BOT', id: 'b', label: 'safe-bot', system: 'quick' }], provenance: [{ source_system: 'quick', source_table: 'users', source_record_id: '7', event_time: '2026-01-01T00:00:00Z' }, { source_system: 'skycloud', source_table: 'users', source_record_id: '7', event_time: '2026-01-02T00:00:00Z' }] });
    render(<MemoryRouter initialEntries={['/?tab=forensics']}><SkyControlPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Forensic search'), { target: { value: '7' } }); fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('Reader')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: /Reader/i }));
    expect(await screen.findByRole('complementary', { name: 'Entity details' })).toBeInTheDocument();
    expect(screen.getByText('USER: Reader')).toBeInTheDocument(); expect(screen.getAllByText(/safe-bot/)).toHaveLength(2); expect(screen.getByText(/quick · users · 7/)).toBeInTheDocument(); expect(screen.getByText('Last seen: -')).toBeInTheDocument();
    expect(screen.queryByText('bot_token')).not.toBeInTheDocument(); expect(screen.queryByText('hidden')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close entity details' })); await waitFor(() => expect(screen.queryByRole('complementary', { name: 'Entity details' })).not.toBeInTheDocument());
  });

  it('opens a safe relationship drawer with deterministic evidence details', async () => {
    const relationship = { relationship_type: 'ORDER_SUBSCRIPTION', source_entity_type: 'ORDER', source_entity_id: 'o1', target_entity_type: 'SUBSCRIPTION', target_entity_id: 's1', evidence_type: 'DERIVED', confidence: 0.75, reason_codes: ['same_user_id', 'within_window'], event_time: '2026-01-01T00:00:00Z', metadata: { rule_id: 'DERIVED_ORDER_SUBSCRIPTION', rule_description: 'Observed application sequence.', matched_fields: ['user_id', 'plan_id'], time_delta_seconds: 600, password: 'hidden', provenance: [{ source_system: 'quick', source_table: 'quick_orders', source_record_id: 'o1', event_time: '2026-01-01T00:00:00Z' }, { source_system: 'quick', source_table: 'quick_subscriptions', source_record_id: 's1', event_time: '2026-01-01T00:10:00Z' }] } };
    searchSkyControlForensics.mockResolvedValue({ count: 1, candidates: [{ entity_type: 'USER', entity_id: '7', label: 'Reader', system: 'quick' }] });
    fetchSkyControlForensicGraph.mockResolvedValue({ seed: { label: 'Reader' }, nodes: [], edges: [relationship] }); fetchSkyControlForensicEntity.mockResolvedValue({ entity: { type: 'USER', label: 'Reader', safe_metadata: {} } }); fetchSkyControlForensicTimeline.mockResolvedValue({ events: [] });
    render(<MemoryRouter initialEntries={['/?tab=forensics']}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText('Forensic search'), { target: { value: '7' } }); fireEvent.click(screen.getByRole('button', { name: 'Search' })); fireEvent.click(await screen.findByRole('button', { name: /Reader/i })); fireEvent.click(await screen.findByRole('button', { name: 'Open relationship details' }));
    const drawer = screen.getByRole('complementary', { name: 'Relationship details' }); expect(drawer).toBeInTheDocument(); expect(drawer).toHaveTextContent('ORDER_SUBSCRIPTION'); expect(drawer).toHaveTextContent('From: ORDER: o1'); expect(drawer).toHaveTextContent('To: SUBSCRIPTION: s1'); expect(drawer).toHaveTextContent('Evidence: DERIVED'); expect(drawer).toHaveTextContent('Confidence: 75%'); expect(drawer).toHaveTextContent(`Event time: ${new Date('2026-01-01T00:00:00Z').toLocaleString()}`); expect(drawer).toHaveTextContent(/same_user_id, within_window/); expect(drawer).toHaveTextContent(/quick · quick_orders · o1/); expect(screen.queryByText('hidden')).not.toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Close relationship details' })); expect(screen.queryByRole('complementary', { name: 'Relationship details' })).not.toBeInTheDocument();
  });

  it('renders all relationship evidence labels, confidence values, and safe fallbacks', async () => {
    searchSkyControlForensics.mockResolvedValue({ count: 1, candidates: [{ entity_type: 'USER', entity_id: '7', label: 'Reader', system: 'quick' }] });
    fetchSkyControlForensicEntity.mockResolvedValue({ entity: { type: 'USER', label: 'Reader', safe_metadata: {} } }); fetchSkyControlForensicTimeline.mockResolvedValue({ events: [] });
    fetchSkyControlForensicGraph.mockResolvedValue({ seed: { label: 'Reader' }, nodes: [], edges: [{ relationship_type: 'SAFE_LINK', source_entity_type: 'USER', source_entity_id: '7', target_entity_type: 'ORDER', target_entity_id: 'o1', evidence_type: 'DIRECT', confidence: 1, event_time: null, metadata: {} }] });
    render(<MemoryRouter initialEntries={['/?tab=forensics']}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText('Forensic search'), { target: { value: '7' } }); fireEvent.click(screen.getByRole('button', { name: 'Search' })); fireEvent.click(await screen.findByRole('button', { name: /Reader/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open relationship details' })); const legend = document.querySelector('.sky-control-page__legend'); ['DIRECT', 'DERIVED', 'CORRELATED', 'UNPROVEN'].forEach((label) => expect(legend).toHaveTextContent(label)); const drawer = screen.getByRole('complementary', { name: 'Relationship details' }); expect(drawer).toHaveTextContent('Confidence: 100%'); expect(drawer).toHaveTextContent('Event time: -'); expect(drawer).toHaveTextContent('No source provenance available'); expect(drawer).toHaveTextContent(/Deterministic application-data confidence; not identity proof/); expect(drawer).not.toHaveTextContent(/Invalid Date|\[object Object\]|\{\}/);
  });

  it.each([[0.9, '90%'], [0.75, '75%'], [0.5, '50%']])('formats confidence %s as %s', async (confidence, expected) => {
    cleanup(); searchSkyControlForensics.mockResolvedValue({ count: 1, candidates: [{ entity_type: 'USER', entity_id: '7', label: 'Reader' }] }); fetchSkyControlForensicEntity.mockResolvedValue({ entity: { type: 'USER', label: 'Reader', safe_metadata: {} } }); fetchSkyControlForensicTimeline.mockResolvedValue({ events: [] }); fetchSkyControlForensicGraph.mockResolvedValue({ seed: { label: 'Reader' }, nodes: [], edges: [{ relationship_type: 'SAFE_LINK', source_entity_type: 'USER', source_entity_id: '7', target_entity_type: 'ORDER', target_entity_id: 'o1', evidence_type: 'CORRELATED', confidence, event_time: 'invalid', metadata: {} }] });
    render(<MemoryRouter initialEntries={['/?tab=forensics']}><SkyControlPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText('Forensic search'), { target: { value: '7' } }); fireEvent.click(screen.getByRole('button', { name: 'Search' })); fireEvent.click(await screen.findByRole('button', { name: /Reader/i })); fireEvent.click(await screen.findByRole('button', { name: 'Open relationship details' })); expect(screen.getByRole('complementary', { name: 'Relationship details' })).toHaveTextContent(`Confidence: ${expected}`); expect(screen.getByText('Event time: -')).toBeInTheDocument();
  });

  it('loads timeline only after selecting a forensic seed with exact seed parameters', async () => {
    fetchSkyControlForensicTimeline.mockResolvedValue({ events: [] });
    render(<MemoryRouter initialEntries={['/?tab=forensics']}><SkyControlPage /></MemoryRouter>);
    expect(fetchSkyControlForensicTimeline).not.toHaveBeenCalled();
    cleanup();
    fetchSkyControlForensicTimeline.mockResolvedValue({ events: [] });
    await selectTimelineSeed();
    await waitFor(() => expect(fetchSkyControlForensicTimeline).toHaveBeenCalledWith(expect.objectContaining({ seed_type: 'USER', seed_id: '7', limit: 25, offset: 0 })));
  });

  it('renders timeline labels, safe event fields, source, chronology, and timestamps', async () => {
    const eventTypes = ['ADMIN_ACTION', 'ORDER_CREATED', 'ORDER_UPDATED', 'PAYMENT_PROOF', 'SUBSCRIPTION_START', 'SUBSCRIPTION_END', 'BOT_REGISTERED', 'BOT_STARTED', 'BOT_CRASHED', 'INVITE_CREATED', 'INVITE_APPROVED', 'INVITE_REVOKED', 'WITHDRAW_DESTINATION_UPDATED'];
    fetchSkyControlForensicTimeline.mockResolvedValue({ events: eventTypes.map((event_type, index) => timelineEvent({ event_id: `event-${index}`, event_type, timestamp: index === 1 ? null : index === 2 ? 'invalid' : `2026-01-${String(index + 1).padStart(2, '0')}T00:00:00Z`, evidence_type: ['DIRECT', 'DERIVED', 'CORRELATED'][index % 3], actor: index === 3 ? { label: 'admin-1' } : 'admin-1', subject: index === 4 ? null : 'user-7', object: index === 5 ? { id: 'order-1' } : 'order-1' })) });
    await selectTimelineSeed();
    const table = await screen.findByRole('table');
    expect(table).toHaveTextContent('Admin action');
    ['Order created', 'Order updated', 'Payment proof', 'Subscription started', 'Subscription ended', 'Bot registered', 'Bot started', 'Bot crashed', 'Invite created', 'Invite approved', 'Invite revoked', 'Withdrawal destination updated'].forEach((label) => expect(table).toHaveTextContent(label));
    expect(table).toHaveTextContent(new Date('2026-01-01T00:00:00Z').toLocaleString());
    expect(table).toHaveTextContent('admin-1');
    expect(table).toHaveTextContent('user-7');
    expect(table).toHaveTextContent('order-1');
    expect(table).toHaveTextContent('quick');
    expect(table).toHaveTextContent('admin_actions / a1');
    expect(table).toHaveTextContent('-');
    expect(table).not.toHaveTextContent(/Invalid Date|\[object Object\]|\{\}/);
    const rows = Array.from(table.querySelectorAll('tbody tr')).map((row) => row.textContent);
    expect(rows[0]).toContain('Admin action');
    expect(rows[1]).toContain('Order created');
  });

  it('renders unknown timeline events safely without fabricating invoice status events', async () => {
    fetchSkyControlForensicTimeline.mockResolvedValue({ events: [timelineEvent({ event_type: 'CUSTOM_SAFE_EVENT', actor: { unsafe: true }, subject: null, object: {} })] });
    await selectTimelineSeed();
    const table = await screen.findByRole('table');
    expect(table).toHaveTextContent('Unknown event: CUSTOM SAFE EVENT');
    expect(table).not.toHaveTextContent(/\[object Object\]|\{\}|Invoice status/i);
  });

  it('reloads Timeline server-side for filters and pagination, with safe empty and error states', async () => {
    fetchSkyControlForensicTimeline
      .mockResolvedValueOnce({ events: [timelineEvent()], pagination: { total: 50, has_next: true } })
      .mockResolvedValueOnce({ events: [timelineEvent({ event_id: 'system' })], pagination: { total: 50, has_next: true } })
      .mockResolvedValueOnce({ events: [timelineEvent({ event_id: 'event' })], pagination: { total: 50, has_next: true } })
      .mockResolvedValueOnce({ events: [timelineEvent({ event_id: 'evidence' })], pagination: { total: 50, has_next: true } })
      .mockResolvedValueOnce({ events: [timelineEvent({ event_id: 'next' })], pagination: { total: 50, has_next: false } })
      .mockResolvedValueOnce({ events: [], pagination: { total: 50, has_next: true } });
    await selectTimelineSeed();
    await screen.findByRole('table');
    expect(screen.getByRole('button', { name: 'Previous timeline page' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('System filter'), { target: { value: 'quick' } });
    await waitFor(() => expect(fetchSkyControlForensicTimeline).toHaveBeenLastCalledWith(expect.objectContaining({ system: 'quick', offset: 0 })));
    fireEvent.change(screen.getByLabelText('Event type filter'), { target: { value: 'ORDER_CREATED' } });
    await waitFor(() => expect(fetchSkyControlForensicTimeline).toHaveBeenLastCalledWith(expect.objectContaining({ event_type: 'ORDER_CREATED', system: 'quick', offset: 0 })));
    fireEvent.change(screen.getByLabelText('Evidence type filter'), { target: { value: 'CORRELATED' } });
    await waitFor(() => expect(fetchSkyControlForensicTimeline).toHaveBeenLastCalledWith(expect.objectContaining({ evidence_type: 'CORRELATED', event_type: 'ORDER_CREATED', offset: 0 })));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next timeline page' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Next timeline page' }));
    await waitFor(() => expect(fetchSkyControlForensicTimeline).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 25 })));
    expect(await screen.findByText('Page 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next timeline page' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Previous timeline page' }));
    await waitFor(() => expect(fetchSkyControlForensicTimeline).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 0 })));
    expect(await screen.findByText('No timeline events')).toBeInTheDocument();
  });

  it('shows sanitized Timeline failure states, including unauthorized responses', async () => {
    fetchSkyControlForensicTimeline.mockRejectedValueOnce(Object.assign(new Error('internal details'), { status: 401 }));
    await selectTimelineSeed();
    expect(await screen.findByText('Not authorized for Sky Control.')).toBeInTheDocument();
    cleanup();
    fetchSkyControlForensicTimeline.mockRejectedValueOnce(new Error('SQL connection failure'));
    await selectTimelineSeed();
    expect(await screen.findByText('Timeline unavailable')).toBeInTheDocument();
    expect(screen.queryByText(/SQL connection failure|internal details/i)).not.toBeInTheDocument();
  });

  it('renders safe anomalies and evidence only after a selected seed', async () => {
    const provenance = [{ source_system: 'quick', source_table: 'orders', source_record_id: 'o1', event_time: '2026-01-01T00:00:00Z' }, { source_system: 'skycloud', source_table: 'payments', source_record_id: 'p1', event_time: '2026-01-01T01:00:00Z' }];
    const edge = { relationship_type: 'ORDER_SUBSCRIPTION', evidence_type: 'DIRECT', confidence: 1, reason_codes: ['same_user'], event_time: '2026-01-01T00:00:00Z', metadata: { provenance, password: 'hidden' } };
    const anomaly = { anomaly_id: 'a1', severity: 'HIGH', rule_id: 'RULE_1', title: 'Neutral signal', reason: 'Observed inconsistency', evidence_type: 'CORRELATED', entity_ids: ['7'], record_ids: ['o1'], timestamps: ['2026-01-01T00:00:00Z'], timestamp: '2026-01-01T00:00:00Z', reason_codes: ['same_user'], metadata: { matched_fields: ['user_id'], bot_token: 'hidden' }, provenance };
    fetchSkyControlForensicTimeline.mockResolvedValue({ events: [timelineEvent({ evidence_type: 'DERIVED' })] });
    fetchSkyControlForensicAnomalies.mockResolvedValue({ anomalies: [anomaly], pagination: { has_next: true } });
    render(<MemoryRouter initialEntries={['/?tab=forensics']}><SkyControlPage /></MemoryRouter>);
    expect(fetchSkyControlForensicAnomalies).not.toHaveBeenCalled();
    cleanup();
    graph.edges = [edge]; graph.capabilities = { broad_admin_actions_available: false, broad_invoices_available: false, invoice_status_timeline_available: false, invite_user_mismatch_rule_available: false };
    fetchSkyControlForensicTimeline.mockResolvedValue({ events: [timelineEvent({ evidence_type: 'DERIVED' })] });
    fetchSkyControlForensicAnomalies.mockResolvedValue({ anomalies: [anomaly], pagination: { has_next: true } });
    await selectTimelineSeed();
    await waitFor(() => expect(fetchSkyControlForensicAnomalies).toHaveBeenCalledWith(expect.objectContaining({ seed_type: 'USER', seed_id: '7', limit: 25, offset: 0 })));
    const anomalies = await screen.findByRole('region', { name: 'Forensic anomalies' });
    expect(anomalies).toHaveTextContent(/unusual or inconsistent application patterns/i);
    expect(anomalies).toHaveTextContent('Severity: HIGH'); expect(anomalies).toHaveTextContent('Rule: RULE_1'); expect(anomalies).toHaveTextContent('Neutral signal'); expect(anomalies).toHaveTextContent('Observed inconsistency'); expect(anomalies).toHaveTextContent('Evidence Type: CORRELATED');
    fireEvent.click(screen.getByRole('button', { name: 'Why flagged' }));
    expect(anomalies).toHaveTextContent('Reason codes: same_user'); expect(anomalies).toHaveTextContent('Record IDs: o1'); expect(anomalies).toHaveTextContent('quick · orders · o1'); expect(anomalies).toHaveTextContent('skycloud · payments · p1');
    fireEvent.change(screen.getByLabelText('Anomaly severity filter'), { target: { value: 'HIGH' } }); await waitFor(() => expect(fetchSkyControlForensicAnomalies).toHaveBeenLastCalledWith(expect.objectContaining({ severity: 'HIGH' })));
    fireEvent.change(screen.getByLabelText('Anomaly rule filter'), { target: { value: 'RULE_1' } }); await waitFor(() => expect(fetchSkyControlForensicAnomalies).toHaveBeenLastCalledWith(expect.objectContaining({ rule_id: 'RULE_1' })));
    fireEvent.change(screen.getByLabelText('Anomaly evidence type filter'), { target: { value: 'CORRELATED' } }); await waitFor(() => expect(fetchSkyControlForensicAnomalies).toHaveBeenLastCalledWith(expect.objectContaining({ evidence_type: 'CORRELATED' })));
    expect(screen.getByRole('button', { name: 'Previous anomaly page' })).toBeDisabled(); await waitFor(() => expect(screen.getByRole('button', { name: 'Next anomaly page' })).toBeEnabled());
    const evidence = screen.getByRole('region', { name: 'Forensic evidence' }); await waitFor(() => expect(evidence).toHaveTextContent('ORDER_SUBSCRIPTION'));
    expect(evidence).toHaveTextContent('Evidence Type: DIRECT'); expect(evidence).toHaveTextContent('Evidence Type: DERIVED'); expect(evidence).toHaveTextContent('Evidence Type: CORRELATED'); expect(evidence).toHaveTextContent('Confidence: 100%'); expect(evidence).toHaveTextContent('Confidence: -'); expect(evidence).toHaveTextContent('quick · orders · o1'); expect(evidence).toHaveTextContent('skycloud · payments · p1'); expect(evidence).not.toHaveTextContent(/hidden|\[object Object\]|\{\}|Invalid Date/);
    const limits = screen.getByRole('region', { name: 'Forensic limitations' }); ['Broad admin-action history unavailable', 'Broad invoice history unavailable', 'Invoice status timeline unavailable', 'Invite mismatch rule unavailable'].forEach((note) => expect(limits).toHaveTextContent(note));
  });

  it.each(['INFO', 'LOW', 'MEDIUM', 'HIGH'])('shows anomaly severity %s as visible text', async (severity) => {
    fetchSkyControlForensicAnomalies.mockResolvedValue({ anomalies: [{ severity, rule_id: 'RULE', title: 'Neutral', reason: 'Observed', evidence_type: 'UNPROVEN', entity_ids: [], timestamp: null }] }); fetchSkyControlForensicTimeline.mockResolvedValue({ events: [] });
    await selectTimelineSeed();
    expect(await screen.findByText(`Severity: ${severity}`, { exact: false })).toBeInTheDocument();
  });
});
