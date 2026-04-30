/**
 * Tests for useBotAuthorizationFlow – state constants and hook shape.
 * Full flow (savePreferenceOnly, startReauthorization) requires mocked context + API.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { REAUTH_FLOW_STATES, useBotAuthorizationFlow } from '../useBotAuthorizationFlow';

// Mock context and API
const mockAuthorizeBot = jest.fn();
const mockCheckRegistrationStatus = jest.fn();
jest.mock('../../context/OTARegistrationContext', () => ({
  useOTARegistrationContext: () => ({
    authorizeBot: mockAuthorizeBot,
    checkRegistrationStatus: mockCheckRegistrationStatus,
  }),
}));
import { getBotAuthStatus, setBotAuthDuration } from '../../services/aiTradingApiService';
jest.mock('../../services/aiTradingApiService', () => ({
  getBotAuthStatus: jest.fn(),
  setBotAuthDuration: jest.fn(),
}));

describe('useBotAuthorizationFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthorizeBot.mockResolvedValue({ hash: '0xabc', receipt: {} });
    getBotAuthStatus.mockResolvedValue({ success: true, onChainEffectiveActive: true });
    setBotAuthDuration.mockResolvedValue({ success: true });
  });

  describe('REAUTH_FLOW_STATES', () => {
    test('exports all required flow states', () => {
      expect(REAUTH_FLOW_STATES.IDLE).toBe('idle');
      expect(REAUTH_FLOW_STATES.PREFERENCE_SAVED).toBe('preference_saved');
      expect(REAUTH_FLOW_STATES.REAUTHORIZATION_REQUIRED).toBe('reauthorization_required');
      expect(REAUTH_FLOW_STATES.AWAITING_WALLET_SIGNATURE).toBe('awaiting_wallet_signature');
      expect(REAUTH_FLOW_STATES.TRANSACTION_SUBMITTED).toBe('transaction_submitted');
      expect(REAUTH_FLOW_STATES.TRANSACTION_CONFIRMED).toBe('transaction_confirmed');
      expect(REAUTH_FLOW_STATES.STATUS_REFRESHING).toBe('status_refreshing');
      expect(REAUTH_FLOW_STATES.ACTIVE_ON_CHAIN).toBe('active_on_chain');
      expect(REAUTH_FLOW_STATES.REAUTHORIZATION_FAILED).toBe('reauthorization_failed');
    });
  });

  describe('hook return shape', () => {
    test('returns expected keys and initial state', () => {
      const { result } = renderHook(() => useBotAuthorizationFlow());
      expect(result.current.reauthFlowState).toBe(REAUTH_FLOW_STATES.IDLE);
      expect(result.current.lastReauthTxHash).toBeNull();
      expect(result.current.lastReauthError).toBeNull();
      expect(result.current.statusAfterReauth).toBeNull();
      expect(typeof result.current.startReauthorization).toBe('function');
      expect(typeof result.current.savePreferenceOnly).toBe('function');
      expect(typeof result.current.resetReauthState).toBe('function');
    });
  });

  describe('resetReauthState', () => {
    test('resets state to idle', async () => {
      const { result } = renderHook(() => useBotAuthorizationFlow());
      await act(async () => {
        await result.current.savePreferenceOnly('0x123', '7d');
      });
      expect(result.current.reauthFlowState).toBe(REAUTH_FLOW_STATES.PREFERENCE_SAVED);
      act(() => {
        result.current.resetReauthState();
      });
      expect(result.current.reauthFlowState).toBe(REAUTH_FLOW_STATES.IDLE);
      expect(result.current.lastReauthTxHash).toBeNull();
      expect(result.current.lastReauthError).toBeNull();
    });
  });

  describe('savePreferenceOnly', () => {
    test('calls setBotAuthDuration and sets preference_saved', async () => {
      const { result } = renderHook(() => useBotAuthorizationFlow());
      await act(async () => {
        await result.current.savePreferenceOnly('0xWallet', '7d');
      });
      expect(setBotAuthDuration).toHaveBeenCalledWith('0xWallet', '7d');
      expect(result.current.reauthFlowState).toBe(REAUTH_FLOW_STATES.PREFERENCE_SAVED);
    });

    test('on API failure sets reauthorization_failed', async () => {
      setBotAuthDuration.mockRejectedValueOnce(new Error('Network error'));
      const { result } = renderHook(() => useBotAuthorizationFlow());
      await act(async () => {
        await result.current.savePreferenceOnly('0xWallet', '7d');
      });
      expect(result.current.reauthFlowState).toBe(REAUTH_FLOW_STATES.REAUTHORIZATION_FAILED);
      expect(result.current.lastReauthError).toBeTruthy();
    });
  });

  describe('startReauthorization', () => {
    test('on success reaches active_on_chain after polling', async () => {
      getBotAuthStatus.mockResolvedValue({ success: true, onChainEffectiveActive: true });
      const { result } = renderHook(() => useBotAuthorizationFlow());
      await act(async () => {
        await result.current.startReauthorization({
          walletAddress: '0xUser',
          botAddress: '0xBot',
          maxAmountUsdt: '100',
          duration: '7d',
        });
      });
      expect(mockAuthorizeBot).toHaveBeenCalledWith('0xBot', '100');
      expect(result.current.reauthFlowState).toBe(REAUTH_FLOW_STATES.ACTIVE_ON_CHAIN);
      expect(result.current.lastReauthTxHash).toBe('0xabc');
      expect(result.current.statusAfterReauth?.onChainEffectiveActive).toBe(true);
    });

    test('on authorizeBot reject sets reauthorization_failed', async () => {
      mockAuthorizeBot.mockRejectedValueOnce(new Error('User rejected'));
      const { result } = renderHook(() => useBotAuthorizationFlow());
      await act(async () => {
        await result.current.startReauthorization({
          walletAddress: '0xUser',
          botAddress: '0xBot',
          maxAmountUsdt: '50',
        });
      });
      expect(result.current.reauthFlowState).toBe(REAUTH_FLOW_STATES.REAUTHORIZATION_FAILED);
      expect(result.current.lastReauthError).toContain('rejected');
    });
  });
});
