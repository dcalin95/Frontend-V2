import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DashboardInsights from '../components/dashboard/DashboardInsights';

describe('DashboardInsights', () => {
  it('labels entry price as signal price, not ambiguous money', () => {
    const aggregate = {
      loading: false,
      isInitialLoading: false,
      lastUpdatedAt: Date.now(),
      signals: [
        { id: '1', token: 'BTC', signal: 'buy', entryPrice: 74639 },
        { id: '2', token: 'XRP', signal: 'buy', entryPrice: 1.36 },
      ],
      lastSignal: null,
      otaStats: null,
    };
    render(
      <MemoryRouter>
        <DashboardInsights aggregate={aggregate} />
      </MemoryRouter>
    );
    expect(screen.getByText(/signal price \$74639\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/signal price \$1\.36/i)).toBeInTheDocument();
  });

  it('keeps signal list visible during background refresh (no skeleton)', () => {
    const aggregate = {
      isInitialLoading: false,
      loading: false,
      isRefreshing: true,
      lastUpdatedAt: Date.now(),
      signals: [{ id: '1', token: 'BTC', signal: 'buy', entryPrice: 100 }],
      lastSignal: null,
      otaStats: null,
    };
    render(
      <MemoryRouter>
        <DashboardInsights aggregate={aggregate} />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/updating/i)).toBeInTheDocument();
    expect(screen.getByText(/signal price \$100\.00/i)).toBeInTheDocument();
    expect(document.querySelector('.dash-insights__skeleton')).toBeNull();
  });

  it('uses the newest feed signal for the highlighted latest signal', () => {
    const aggregate = {
      loading: false,
      isInitialLoading: false,
      lastUpdatedAt: Date.now(),
      signals: [
        { id: 'older', token: 'ADA', signal: 'open_short', entryPrice: 0.24, createdAt: '2026-05-25T04:20:00.000Z' },
        { id: 'new', token: 'SOL', signal: 'sell', entryPrice: 85.22, createdAt: '2026-05-25T04:29:28.000Z' },
      ],
      lastSignal: { token: 'XRP', side: 'buy' },
      otaStats: null,
    };
    render(
      <MemoryRouter>
        <DashboardInsights aggregate={aggregate} />
      </MemoryRouter>
    );
    expect(screen.queryByText(/XRP\s+—\s+BUY/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/SOL\s+—\s+SELL/i).length).toBeGreaterThan(0);
  });
});
