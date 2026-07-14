import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OtaFuturesAgentTraceStrip from '../OtaFuturesAgentTraceStrip';
import { OTA_FUTURES_TRACE_APPEND_EVENT } from '../../../utils/otaFuturesTraceImmediatePoll';

jest.mock('../../../services/aiTradingApiService', () => ({
  fetchOtaAgentTraceLive: jest.fn(),
}));

jest.mock('../OTALogo', () => () => <span>OTA</span>);

const { fetchOtaAgentTraceLive } = require('../../../services/aiTradingApiService');

describe('OtaFuturesAgentTraceStrip', () => {
  beforeEach(() => {
    fetchOtaAgentTraceLive.mockReset();
    fetchOtaAgentTraceLive.mockResolvedValue({
      success: true,
      active: false,
      currentToken: 'BTC',
      nextAfter: 2,
      bufferEpoch: 0,
      events: [
        {
          type: 'browser_analyze',
          phase: 'start',
          token: 'BTC',
          provider: 'openai',
          tradeContext: 'long_live',
          ts: Date.parse('2026-04-22T11:47:00.000Z'),
        },
        {
          type: 'browser_analyze',
          phase: 'done',
          token: 'BTC',
          provider: 'openai',
          signal: 'buy',
          confidence: 0.7,
          totalTokens: 8243,
          usdStatus: 'pending',
          tradeContext: 'long_live',
          model: 'ft:gpt-4o-mini-2024-07-18:personal:ota-l64-stabilize:test',
          ts: Date.parse('2026-04-22T11:47:02.000Z'),
        },
      ],
    });
  });

  it('renders explicit browser analyze proof lines in the Matrix strip', async () => {
    render(<OtaFuturesAgentTraceStrip userId="0x1234567890123456789012345678901234567890" futuresLane="long" />);

    await waitFor(() => {
      expect(screen.getByText(/Browser analyze start .*OpenAI .*BTC .*long_live/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Browser analyze done .*OpenAI .*BTC .*BUY \(70%\) .*8243 tok .*USD pending .*long_live/i),
    ).toBeInTheDocument();
  });

  it('does not show LONG trace lines as fallback in the SHORT panel', async () => {
    render(<OtaFuturesAgentTraceStrip userId="0x1234567890123456789012345678901234567890" futuresLane="short" />);

    await waitFor(() => {
      expect(screen.getByText(/No SHORT cycle in the current buffer/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Browser analyze done/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Opposite-lane runs are hidden/i)).toHaveLength(2);
  });

  it('renders executor engine-only analyze lines in the Matrix strip', async () => {
    fetchOtaAgentTraceLive.mockReset();
    fetchOtaAgentTraceLive.mockResolvedValue({
      success: true,
      active: false,
      currentToken: 'BTC',
      nextAfter: 3,
      bufferEpoch: 0,
      events: [
        {
          type: 'run_started',
          token: 'BTC',
          pair: 'BTC/USDT',
          model: 'ota_engine',
          ts: Date.parse('2026-04-22T11:48:00.000Z'),
        },
        {
          type: 'executor_analyze',
          phase: 'start',
          token: 'BTC',
          provider: 'ota_engine',
          ts: Date.parse('2026-04-22T11:48:01.000Z'),
        },
        {
          type: 'executor_analyze',
          phase: 'done',
          token: 'BTC',
          provider: 'ota_engine',
          signal: 'buy',
          confidence: 0.68,
          skippedOpenAI: true,
          ts: Date.parse('2026-04-22T11:48:02.000Z'),
        },
      ],
    });

    render(<OtaFuturesAgentTraceStrip userId="0x1234567890123456789012345678901234567890" futuresLane="long" />);

    await waitFor(() => {
      expect(screen.getByText(/OTA Motor analyze start .*OTA Engine .*BTC/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/OTA Motor analyze done .*OTA Engine .*BTC .*BUY \(68%\) .*no OpenAI/i),
    ).toBeInTheDocument();
  });

  it('appends a local analyze event immediately when dispatched from the panel', async () => {
    fetchOtaAgentTraceLive.mockReset();
    fetchOtaAgentTraceLive.mockResolvedValue({
      success: true,
      active: false,
      currentToken: null,
      nextAfter: 0,
      bufferEpoch: 0,
      events: [],
    });

    render(<OtaFuturesAgentTraceStrip userId="0x1234567890123456789012345678901234567890" futuresLane="long" />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent(OTA_FUTURES_TRACE_APPEND_EVENT, {
          detail: {
            userId: '0x1234567890123456789012345678901234567890',
            event: {
              type: 'browser_analyze',
              phase: 'done',
              token: 'BTC',
              provider: 'openai',
              signal: 'buy',
              confidence: 0.7,
              totalTokens: 8243,
              usdStatus: 'pending',
              tradeContext: 'long_live',
              ts: Date.parse('2026-04-22T11:47:02.000Z'),
            },
          },
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Browser analyze done .*OpenAI .*BTC .*BUY \(70%\) .*8243 tok .*USD pending .*long_live/i),
      ).toBeInTheDocument();
    });
  });
});
