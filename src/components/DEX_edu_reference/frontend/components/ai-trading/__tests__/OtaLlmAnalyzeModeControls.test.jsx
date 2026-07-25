import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OtaLlmAnalyzeModeControls from '../OtaLlmAnalyzeModeControls';
import { setOtaFuturesAnalyzeLlmMode, OTA_ANALYZE_LLM_WITH_OPENAI } from '../../../utils/otaAnalysisModePreference';
import { __resetOtaApiClientCachesForTests } from '../../../utils/otaApiClient';
import { toast } from 'react-toastify';

jest.mock('../../../../config/runtimeConfig.js', () => ({
  loadRuntimeConfig: () => Promise.resolve({}),
  getBackendUrl: () => 'https://backend-server-eu.onrender.com',
  getAuthBackendUrl: () => 'https://backend-server-eu.onrender.com',
  getApiBaseUrl: () => 'https://backend-server-eu.onrender.com/api',
  getConfigSource: () => 'test',
  initRuntimeConfig: () => {},
}));

jest.mock('react-toastify', () => ({
  toast: {
    info: jest.fn(),
    warning: jest.fn(),
    success: jest.fn(),
  },
}));

describe('OtaLlmAnalyzeModeControls', () => {
  const originalLocation = window.location;

  beforeAll(() => {
    delete window.location;
    window.location = {
      href: 'https://edu.bits-ai.io/dex-edu/ota/short-ops?tab=long',
      assign: jest.fn(),
    };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  beforeEach(() => {
    __resetOtaApiClientCachesForTests();
    window.localStorage.clear();
    window.location.href = 'https://edu.bits-ai.io/dex-edu/ota/short-ops?tab=long';
    window.location.assign.mockClear();
    global.fetch = jest.fn((url) => {
      const s = String(url || '');
      const parsedUrl = (() => {
        try {
          return new URL(s, 'https://example.test');
        } catch (_) {
          return null;
        }
      })();
      if (s.includes('/ai-trading/ready')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ready', checks: { openai: true, openaiLlmEnabled: true, circuitBreaker: 'CLOSED' } }),
        });
      }
      if (s.includes('/ai-trading/openai-platform-budget')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, monthSpendUsd: 12.34, otaAnalysesEstimatedUsdMtd: 1.23 }),
        });
      }
      if (s.includes('/claude/budget')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, keyConfigured: true, model: 'claude-sonnet', costUsdLast30d: 9.87 }),
        });
      }
      if (s.includes('/ai-trading/llm-billing-status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            billing: {
              trialCreditUsd: 5,
              paidCreditUsd: 1.5,
              spentCreditUsd: 0.25,
              availableCreditUsd: 6.25,
              blocked: false,
              creditBlocked: false,
              providerRatesUsdPer1k: {
                openai: 0.0015,
                anthropic: 0.0025,
              },
              providerAvailability: {
                openai: { pausedByUser: false, blockedByCredit: false, blocked: false },
                anthropic: { pausedByUser: false, blockedByCredit: false, blocked: false },
              },
            },
          }),
        });
      }
      if (s.includes('/ai-trading/llm-billing-history')) {
        const providerFilter = parsedUrl?.searchParams.get('provider') || 'all';
        const limit = Number(parsedUrl?.searchParams.get('limit') || '3');
        const allEvents = [
          {
            id: 1,
            provider: 'openai',
            status: 'charged',
            tokenTotal: 240,
            costUsd: 0.42,
            createdAt: '2026-04-18T17:30:00.000Z',
          },
          {
            id: 2,
            provider: 'openai',
            status: 'credit_grant',
            meta: { amountUsd: 5 },
            createdAt: '2026-04-18T17:20:00.000Z',
          },
          {
            id: 3,
            provider: 'anthropic',
            status: 'charged',
            tokenTotal: 310,
            costUsd: 0.32,
            createdAt: '2026-04-18T17:10:00.000Z',
          },
          {
            id: 4,
            provider: 'anthropic',
            status: 'blocked_no_credit',
            createdAt: '2026-04-18T17:00:00.000Z',
          },
        ];
        const filteredEvents = providerFilter === 'all'
          ? allEvents
          : allEvents.filter((event) => event.provider === providerFilter);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            events: filteredEvents.slice(0, limit),
          }),
        });
      }
      if (s.includes('/ai-trading/llm-billing/provider-control')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            provider: 'openai',
            paused: true,
            providerControl: { paused: true, reason: 'user_paused' },
            billing: {
              trialCreditUsd: 5,
              spentCreditUsd: 0.25,
              availableCreditUsd: 4.75,
              blocked: false,
              creditBlocked: false,
              providerAvailability: {
                openai: { pausedByUser: true, blockedByCredit: false, blocked: true, reason: 'user_paused' },
                anthropic: { pausedByUser: false, blockedByCredit: false, blocked: false },
              },
            },
          }),
        });
      }
      if (s.includes('/api/stripe/create-checkout')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            url: 'https://checkout.stripe.test/llm-topup',
            sessionId: 'cs_topup_1',
            creditAmountUsd: 10,
          }),
        });
      }
      if (s.includes('/api/stripe/verify-session')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            purpose: 'llm_billing_topup',
            credited: true,
            creditAmountUsd: 10,
            billing: {
              availableCreditUsd: 10,
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows provider cost disclosure in the selector', async () => {
    render(<OtaLlmAnalyzeModeControls walletAddress="0x1234567890123456789012345678901234567890" />);

    expect(screen.getAllByText('Separate cost')).toHaveLength(2);
    expect(screen.getByText('Included in OTA')).toBeInTheDocument();
    expect(
      screen.getByText(/OpenAI and Claude may incur separate provider cost\./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Billing status: separate provider cost/i)).toBeInTheDocument();
    expect(screen.getByText(/not a per-user invoice/i)).toBeInTheDocument();
    expect(await screen.findByText(/Per-user trial: \$5\.00/i)).toBeInTheDocument();
    expect(screen.getByText('Provider gate')).toBeInTheDocument();
    expect(screen.getByText('Available credit')).toBeInTheDocument();
    expect(screen.getByText('Spent from trial')).toBeInTheDocument();
    expect(screen.getByText('Paid top-up')).toBeInTheDocument();
    expect(screen.getByText('Provider health')).toBeInTheDocument();
    expect(screen.getByText('Next best action')).toBeInTheDocument();
    expect(screen.getAllByText(/more at recent pace/i)).toHaveLength(2);
    expect(screen.getByText('Rate: $0.00150 / 1k tok')).toBeInTheDocument();
    expect(screen.getByText('Rate: $0.00250 / 1k tok')).toBeInTheDocument();
    expect(screen.getAllByText(/Last charged/i)).toHaveLength(2);
    expect(screen.getAllByText(/OPENAI usage/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ANTHROPIC usage/i).length).toBeGreaterThan(0);
    expect(screen.getByText('$6.25')).toBeInTheDocument();
    expect(screen.getByText('$1.50')).toBeInTheDocument();
    expect(screen.getByText('Ledger focus')).toBeInTheDocument();
    expect(screen.getByText(/All providers: 2 charged run\(s\) .*avg \$0\.37 .*total \$0\.74/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/OPENAI usage .*240 tok/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/OPENAI top-up \$5\.00 added/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ANTHROPIC usage .*310 tok/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Refresh billing/i })).toBeInTheDocument();
  });

  it('shows USD pending instead of fake zero-cost when billing history has tokens but no positive USD', async () => {
    global.fetch = jest.fn((url) => {
      const s = String(url || '');
      if (s.includes('/ai-trading/ready')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ready', checks: { openai: true, openaiLlmEnabled: true, circuitBreaker: 'CLOSED' } }),
        });
      }
      if (s.includes('/ai-trading/openai-platform-budget')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, monthSpendUsd: 12.34, otaAnalysesEstimatedUsdMtd: 1.23 }),
        });
      }
      if (s.includes('/claude/budget')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, keyConfigured: true, model: 'claude-sonnet', costUsdLast30d: 9.87 }),
        });
      }
      if (s.includes('/ai-trading/llm-billing-status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            billing: {
              trialCreditUsd: 5,
              paidCreditUsd: 0,
              spentCreditUsd: 0,
              availableCreditUsd: 5,
              blocked: false,
              creditBlocked: false,
              providerRatesUsdPer1k: { openai: 0.0015, anthropic: 0.0025 },
              providerAvailability: {
                openai: { pausedByUser: false, blockedByCredit: false, blocked: false },
                anthropic: { pausedByUser: false, blockedByCredit: false, blocked: false },
              },
            },
          }),
        });
      }
      if (s.includes('/ai-trading/llm-billing-history')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            events: [
              {
                id: 1,
                provider: 'openai',
                status: 'charged',
                tokenTotal: 8339,
                costUsd: 0,
                createdAt: '2026-04-22T08:25:00.000Z',
              },
            ],
          }),
        });
      }
      if (s.includes('/ai-trading/llm-billing/provider-control')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            provider: 'openai',
            paused: false,
            providerControl: { paused: false, reason: null },
            billing: {
              trialCreditUsd: 5,
              spentCreditUsd: 0,
              availableCreditUsd: 5,
              blocked: false,
              creditBlocked: false,
              providerAvailability: {
                openai: { pausedByUser: false, blockedByCredit: false, blocked: false, reason: null },
                anthropic: { pausedByUser: false, blockedByCredit: false, blocked: false, reason: null },
              },
            },
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<OtaLlmAnalyzeModeControls walletAddress="0x1234567890123456789012345678901234567890" />);

    expect(await screen.findByText(/charged run\(s\) have token usage, but USD is still pending/i)).toBeInTheDocument();
    expect(screen.getAllByText(/OPENAI usage .*8339 tok .*USD pending/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/OPENAI usage: \$0\.00/i)).not.toBeInTheDocument();
  });

  it('shows billing note in the Claude confirm dialog before switch', async () => {
    render(<OtaLlmAnalyzeModeControls />);

    await screen.findByText(/Billing status: separate provider cost/i);
    fireEvent.click(screen.getByRole('button', { name: /Claude \(Anthropic\)/i }));

    expect(screen.getByText(/This provider may add separate cost outside OTA\./i)).toBeInTheDocument();
    expect(screen.getAllByText(/internal per-user billing ledger/i).length).toBeGreaterThan(0);
  });

  it('switches the strip to included mode for OTA Engine after confirm', async () => {
    render(<OtaLlmAnalyzeModeControls />);

    await screen.findByText(/Billing status: separate provider cost/i);
    fireEvent.click(screen.getByRole('button', { name: /OTA Engine/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));

    expect(await screen.findByText(/Billing status: included in OTA/i)).toBeInTheDocument();
    expect(screen.getByText(/no separate OpenAI or Claude provider billing/i)).toBeInTheDocument();
  });

  it('pauses paid providers when separate billing credit is exhausted', async () => {
    global.fetch = jest.fn((url) => {
      const s = String(url || '');
      if (s.includes('/ai-trading/ready')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ready', checks: { openai: true, openaiLlmEnabled: true, circuitBreaker: 'CLOSED' } }),
        });
      }
      if (s.includes('/ai-trading/openai-platform-budget')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, monthSpendUsd: 12.34, otaAnalysesEstimatedUsdMtd: 1.23 }),
        });
      }
      if (s.includes('/claude/budget')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, keyConfigured: true, model: 'claude-sonnet', costUsdLast30d: 9.87 }),
        });
      }
      if (s.includes('/ai-trading/llm-billing-status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            billing: {
              trialCreditUsd: 5,
              spentCreditUsd: 5,
              availableCreditUsd: 0,
              blocked: true,
              creditBlocked: true,
              providerAvailability: {
                openai: { pausedByUser: false, blockedByCredit: true, blocked: true },
                anthropic: { pausedByUser: false, blockedByCredit: true, blocked: true },
              },
            },
          }),
        });
      }
      if (s.includes('/ai-trading/llm-billing-history')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            events: [
              {
                id: 3,
                provider: 'openai',
                status: 'blocked_no_credit',
                createdAt: '2026-04-18T17:35:00.000Z',
              },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<OtaLlmAnalyzeModeControls walletAddress="0x1234567890123456789012345678901234567890" />);

    expect(await screen.findByText(/Billing status: included in OTA/i)).toBeInTheDocument();
    expect(toast.info).toHaveBeenCalledWith(
      expect.stringMatching(/OpenAI credit is exhausted, so analysis moved back to OTA Engine/i),
      expect.any(Object),
    );
    expect(screen.getByRole('button', { name: /^OpenAI Separate cost$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Claude \(Anthropic\) Separate cost$/i })).toBeDisabled();
  });

  it('allows pausing only OpenAI without disabling Claude', async () => {
    render(<OtaLlmAnalyzeModeControls walletAddress="0x1234567890123456789012345678901234567890" />);

    await screen.findByText(/Billing status: separate provider cost/i);
    fireEvent.click(screen.getByRole('button', { name: /Pause OpenAI/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ai-trading/llm-billing/provider-control'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    expect(await screen.findByText(/Billing status: included in OTA/i)).toBeInTheDocument();
    expect(toast.info).toHaveBeenCalledWith(
      expect.stringMatching(/OpenAI was paused for this wallet, so analysis moved back to OTA Engine/i),
      expect.any(Object),
    );
    expect(screen.getByRole('button', { name: /^OpenAI Separate cost$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Claude \(Anthropic\) Separate cost$/i })).not.toBeDisabled();
  });

  it('refreshes billing status and history on demand', async () => {
    render(<OtaLlmAnalyzeModeControls walletAddress="0x1234567890123456789012345678901234567890" />);

    await screen.findByText(/Billing status: separate provider cost/i);

    const statusCallsBefore = global.fetch.mock.calls.filter(([url]) =>
      String(url || '').includes('/ai-trading/llm-billing-status'),
    ).length;
    const historyCallsBefore = global.fetch.mock.calls.filter(([url]) =>
      String(url || '').includes('/ai-trading/llm-billing-history'),
    ).length;

    fireEvent.click(screen.getByRole('button', { name: /Refresh billing/i }));

    await waitFor(() => {
      const statusCallsAfter = global.fetch.mock.calls.filter(([url]) =>
        String(url || '').includes('/ai-trading/llm-billing-status'),
      ).length;
      const historyCallsAfter = global.fetch.mock.calls.filter(([url]) =>
        String(url || '').includes('/ai-trading/llm-billing-history'),
      ).length;
      expect(statusCallsAfter).toBeGreaterThan(statusCallsBefore);
      expect(historyCallsAfter).toBeGreaterThan(historyCallsBefore);
    });
  });

  it('starts a Stripe top-up checkout for separate provider credit', async () => {
    render(<OtaLlmAnalyzeModeControls walletAddress="0x1234567890123456789012345678901234567890" />);

    await screen.findByText(/Billing status: separate provider cost/i);
    fireEvent.click(screen.getByRole('button', { name: /Top up \$10/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stripe/create-checkout'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
    expect(window.location.assign).toHaveBeenCalledWith('https://checkout.stripe.test/llm-topup');
  });

  it('verifies a Stripe top-up success on return from checkout', async () => {
    window.location.href = 'https://edu.bits-ai.io/dex-edu/ota/short-ops?tab=long&payment=stripe-llm-billing-success&session_id=cs_topup_return';

    render(<OtaLlmAnalyzeModeControls walletAddress="0x1234567890123456789012345678901234567890" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stripe/verify-session?session_id=cs_topup_return'),
        expect.objectContaining({ credentials: 'include' }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/Stripe top-up confirmed: \$10\.00 added/i),
      expect.any(Object),
    );
  });

  it('filters and expands the billing ledger history', async () => {
    render(<OtaLlmAnalyzeModeControls walletAddress="0x1234567890123456789012345678901234567890" />);

    expect(await screen.findByText(/All providers: 2 charged run\(s\) .*total \$0\.74/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Claude$/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ai-trading/llm-billing-history?userId=0x1234567890123456789012345678901234567890&limit=3&provider=anthropic'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    expect(await screen.findByText(/Claude: 1 charged run\(s\) .*avg \$0\.32 .*total \$0\.32/i)).toBeInTheDocument();
    expect(screen.queryByText(/OPENAI usage/i)).not.toBeInTheDocument();
    expect(screen.getByText(/ANTHROPIC analyze blocked by exhausted separate credit/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Show more/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ai-trading/llm-billing-history?userId=0x1234567890123456789012345678901234567890&limit=8&provider=anthropic'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    expect(screen.getByRole('button', { name: /Show recent/i })).toBeInTheDocument();
  });

  it('falls back to OTA Engine when selected provider becomes manually paused', async () => {
    setOtaFuturesAnalyzeLlmMode(OTA_ANALYZE_LLM_WITH_OPENAI, { source: 'server' });
    global.fetch = jest.fn((url) => {
      const s = String(url || '');
      if (s.includes('/ai-trading/ready')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ready', checks: { openai: true, openaiLlmEnabled: true, circuitBreaker: 'CLOSED' } }),
        });
      }
      if (s.includes('/ai-trading/openai-platform-budget')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, monthSpendUsd: 12.34, otaAnalysesEstimatedUsdMtd: 1.23 }),
        });
      }
      if (s.includes('/claude/budget')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, keyConfigured: true, model: 'claude-sonnet', costUsdLast30d: 9.87 }),
        });
      }
      if (s.includes('/ai-trading/llm-billing-status')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            billing: {
              trialCreditUsd: 5,
              spentCreditUsd: 0.25,
              availableCreditUsd: 4.75,
              blocked: false,
              creditBlocked: false,
              providerAvailability: {
                openai: { pausedByUser: true, blockedByCredit: false, blocked: true, reason: 'user_paused' },
                anthropic: { pausedByUser: false, blockedByCredit: false, blocked: false },
              },
            },
          }),
        });
      }
      if (s.includes('/ai-trading/llm-billing-history')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, events: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<OtaLlmAnalyzeModeControls walletAddress="0x1234567890123456789012345678901234567890" />);

    expect(await screen.findByText(/Billing status: included in OTA/i)).toBeInTheDocument();
    expect(toast.info).toHaveBeenCalledWith(
      expect.stringMatching(/OpenAI was paused for this wallet, so analysis moved back to OTA Engine/i),
      expect.any(Object),
    );
  });

  it('shows a clear wallet-session-needed state when the billing ledger is locked', async () => {
    global.fetch = jest.fn((url) => {
      const s = String(url || '');
      if (s.includes('/ai-trading/ready')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ready', checks: { openai: true, openaiLlmEnabled: true, circuitBreaker: 'CLOSED' } }),
        });
      }
      if (s.includes('/ai-trading/openai-platform-budget')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, monthSpendUsd: 9.48, otaAnalysesEstimatedUsdMtd: 27.1 }),
        });
      }
      if (s.includes('/claude/budget')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, keyConfigured: true, model: 'claude-sonnet', costUsdLast30d: 0 }),
        });
      }
      if (s.includes('/ai-trading/llm-billing-status')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({
            success: false,
            error: 'Invalid or missing OTA wallet session token.',
          }),
        });
      }
      if (s.includes('/ai-trading/llm-billing-history')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({
            success: false,
            error: 'Invalid or missing OTA wallet session token.',
          }),
        });
      }
      if (s.includes('/api/stripe/create-checkout')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            url: 'https://checkout.stripe.test/locked-ledger-topup',
            sessionId: 'cs_topup_locked_1',
            creditAmountUsd: 10,
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<OtaLlmAnalyzeModeControls walletAddress="0x1234567890123456789012345678901234567890" />);

    expect(await screen.findByText('OpenAI active')).toBeInTheDocument();
    expect(screen.getByText('Stripe top-up ready')).toBeInTheDocument();
    expect(screen.getAllByText('Hidden')).toHaveLength(2);
    expect(screen.getByText(/Billing status: OpenAI analyze active .* wallet ledger hidden/i)).toBeInTheDocument();
    expect(screen.getByText('Wallet ledger hidden')).toBeInTheDocument();
    expect(
      screen.queryByText(/Wallet ledger is locked until the OTA wallet session is restored\. Stripe top-up still works for this connected address/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Per-wallet trial, history, and billing controls stay hidden until the OTA wallet session is restored\. Analyze and Stripe top-up already work for this connected address/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Stripe top-up: payment can already be started right now for the connected wallet address/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/OpenAI analyzes can run while separate credit remains available/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('ACTIVE').length).toBeGreaterThan(0);
    expect(
      screen.getByText(/The selected analyze provider stays active here, OTA Engine remains available, and Stripe top-up already works/i),
    ).toBeInTheDocument();
    const openAiLockedButton = screen.getByRole('button', { name: /^OpenAI Separate cost$/i });
    expect(openAiLockedButton).toHaveAttribute(
      'title',
      'OpenAI analyze stays active. The wallet-backed billing ledger stays hidden until the OTA wallet session is restored.',
    );
    expect(openAiLockedButton).not.toHaveClass('futures-ops-peer-nav__mode-btn--wallet-locked');
    expect(screen.getByText(/Billing status: OpenAI analyze active .* wallet ledger hidden/i).closest('.futures-ops-peer-nav__billing-strip'))
      .toHaveClass('futures-ops-peer-nav__billing-strip--locked');
    expect(screen.queryByText(/Per-wallet billing session needed/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('Analyze active').length).toBeGreaterThan(1);
    expect(
      screen.queryByText(/OpenAI stays selected\. Restore the OTA wallet session to view wallet credit again, or top up now through Stripe/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/OpenAI analyze stays active\. Stripe top-up works now for this wallet, while per-wallet trial, history, and billing controls stay hidden until the OTA wallet session is restored/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Analyze active').length).toBeGreaterThan(0);
    expect(
      screen.queryByText(/Selected: OpenAI stays chosen, but the wallet-backed billing gate is locked until the OTA wallet session is restored/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/OTA wallet session needed before per-wallet ledger events can load again/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Billing history is waiting for the OTA wallet session to unlock this wallet-backed ledger again/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /OpenAI billing controls hidden/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Claude billing controls hidden/i })).toBeDisabled();
    expect(
      screen.getByText(/You can still top up this connected wallet through Stripe right now/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Top up €10/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Top up \$10/i })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /^All$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^OpenAI$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Claude$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show more/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Refresh after OTA unlock/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Top up \$10/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stripe/create-checkout'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
    expect(window.location.assign).toHaveBeenCalledWith('https://checkout.stripe.test/locked-ledger-topup');
    expect(
      screen.queryByText(/Manual provider pause unlocks only after the OTA wallet session is restored/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Manual provider pause and resume stay hidden until the OTA wallet session is restored/i),
    ).toBeInTheDocument();
  });
});


