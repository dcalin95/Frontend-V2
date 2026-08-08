import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SkyControlPage, { formatRelativeTime, formatTimestamp } from '../SkyControlPage';
import { fetchSkyControl, fetchSkyControlSummary } from '../../services/skyControlService';

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
});
