/**
 * 🎮 BotControls Component - OpenAI Trading Agent (OTA) Control Buttons
 * 
 * Component pentru controlling OpenAI Trading Agent (OTA):
 * - Start button
 * - Stop button
 * - Refresh button
 * - Configuration modal trigger
 * 
 * @module BotControls
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Play, Square, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import BotConfigurationModal from './BotConfigurationModal';
import OTALogo from './OTALogo';
import { AGENT_UI_LABELS } from '../../utils/aiTradingConstants';
import { errorWithPrefix } from '../../utils/logger';
import { useOTARegistrationContext } from '../../context/OTARegistrationContext';
import '../../styles/components/bot-controls.css';

const BotControls = React.memo(({ 
  userId,
  status, 
  loading = false, 
  onStart, 
  onStop, 
  onRefresh,
  onConfigure = null 
}) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const isRunning = useMemo(() => status?.status === 'running', [status?.status]);
  
  // Check on-chain registration status
  const { isRegistered, isLoading: registrationLoading } = useOTARegistrationContext();

  const defaultConfig = useMemo(() => ({
    strategies: [],
    riskLimits: {
      maxPercentPerTrade: 5.0,
      dailyLossLimit: 10.0,
      maxDrawdown: 20.0
    },
    conditions: {},
    automation: {}
  }), []);

  const handleStart = useCallback(async () => {
    if (!onStart) return;
    
    // Check on-chain registration before starting
    if (!isRegistered) {
      toast.error('Please register for OTA on-chain first. Go to OTA Access Control to register.');
      return;
    }
    
    try {
      setActionLoading(true);
      await onStart(defaultConfig);
    } catch (error) {
      errorWithPrefix('OTA', 'Error starting agent:', error);
      toast.error(error?.message || 'Failed to start AI Trading Agent');
    } finally {
      setActionLoading(false);
    }
  }, [onStart, defaultConfig, isRegistered]);

  const handleStop = useCallback(async () => {
    if (!onStop) return;
    
    try {
      setActionLoading(true);
      await onStop();
    } catch (error) {
      errorWithPrefix('OTA', 'Error stopping agent:', error);
    } finally {
      setActionLoading(false);
    }
  }, [onStop]);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    try {
      await onRefresh();
    } catch (error) {
      errorWithPrefix('OTA', 'Error refreshing status:', error);
    }
  }, [onRefresh]);

  const handleConfigModalClose = useCallback(() => {
    setShowConfigModal(false);
  }, []);

  const handleConfigSave = useCallback((config) => {
    if (onConfigure) {
      onConfigure(config);
    }
    setShowConfigModal(false);
  }, [onConfigure]);

  return (
    <div className="bot-controls ota-controls">
      <div className="bot-controls-header ota-controls-header ota-title-row">
        <OTALogo size="md" showBorder showGlow={isRunning} />
        <span className="bot-controls-agent-name ota-controls-agent-name">{AGENT_UI_LABELS.controls}</span>
      </div>
      <div className="bot-controls-buttons ota-controls-buttons">
        {!isRunning ? (
        <button
          className="bot-control-btn ota-control-btn bot-control-btn-start ota-control-btn-start"
          onClick={handleStart}
          disabled={loading || actionLoading || registrationLoading || !isRegistered}
          aria-label={AGENT_UI_LABELS.start}
          aria-busy={actionLoading}
          title={!isRegistered ? 'Please register for OTA on-chain first' : undefined}
        >
            {actionLoading ? (
              <LoadingSpinner size="small" message="" />
            ) : (
              <>
                <OTALogo size="xs" className="ota-control-btn-logo" />
                <Play size={16} />
                {AGENT_UI_LABELS.start}
              </>
            )}
          </button>
        ) : (
          <button
            className="bot-control-btn ota-control-btn bot-control-btn-stop ota-control-btn-stop"
            onClick={handleStop}
            disabled={loading || actionLoading}
            aria-label={AGENT_UI_LABELS.stop}
            aria-busy={actionLoading}
          >
            {actionLoading ? (
              <LoadingSpinner size="small" message="" />
            ) : (
              <>
                <Square size={16} />
                {AGENT_UI_LABELS.stop}
              </>
            )}
          </button>
        )}

        <button
          className="bot-control-btn ota-control-btn bot-control-btn-secondary ota-control-btn-secondary"
          onClick={handleRefresh}
          disabled={loading}
          title={`Refresh ${AGENT_UI_LABELS.status}`}
          aria-label={`Refresh ${AGENT_UI_LABELS.status}`}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </button>

        <button
          className="bot-control-btn ota-control-btn bot-control-btn-secondary ota-control-btn-secondary"
          onClick={() => setShowConfigModal(true)}
          disabled={loading || actionLoading}
          title={AGENT_UI_LABELS.configure}
          aria-label={AGENT_UI_LABELS.configure}
        >
          <Settings size={16} aria-hidden="true" />
          Configure
        </button>
      </div>

      {/* OpenAI Trading Agent (OTA) Configuration Modal */}
      <BotConfigurationModal
        userId={userId}
        isOpen={showConfigModal}
        onClose={handleConfigModalClose}
        onSave={handleConfigSave}
      />
    </div>
  );
});

BotControls.displayName = 'BotControls';

export default BotControls;

