/**
 * 🎮 BotControls Component - Bot Control Buttons
 * 
 * Component pentru controlling AI Trading Bot:
 * - Start button
 * - Stop button
 * - Refresh button
 * - Configuration modal trigger
 * 
 * @module BotControls
 */

import React, { useState } from 'react';
import { Play, Square, RefreshCw, Settings } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/components/bot-controls.css';

const BotControls = ({ 
  status, 
  loading = false, 
  onStart, 
  onStop, 
  onRefresh,
  onConfigure = null 
}) => {
  const [actionLoading, setActionLoading] = useState(false);
  const isRunning = status?.status === 'running';

  const handleStart = async () => {
    if (!onStart) return;
    
    try {
      setActionLoading(true);
      // Default config dacă nu e provided
      const defaultConfig = {
        strategies: [],
        riskLimits: {
          maxPercentPerTrade: 5.0,
          dailyLossLimit: 10.0,
          maxDrawdown: 20.0
        },
        conditions: {},
        automation: {}
      };
      await onStart(defaultConfig);
    } catch (error) {
      console.error('Error starting bot:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!onStop) return;
    
    try {
      setActionLoading(true);
      await onStop();
    } catch (error) {
      console.error('Error stopping bot:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    await onRefresh();
  };

  return (
    <div className="bot-controls">
      <div className="bot-controls-buttons">
        {!isRunning ? (
          <button
            className="bot-control-btn bot-control-btn-start"
            onClick={handleStart}
            disabled={loading || actionLoading}
          >
            {actionLoading ? (
              <LoadingSpinner size="small" message="" />
            ) : (
              <>
                <Play size={16} />
                Start Bot
              </>
            )}
          </button>
        ) : (
          <button
            className="bot-control-btn bot-control-btn-stop"
            onClick={handleStop}
            disabled={loading || actionLoading}
          >
            {actionLoading ? (
              <LoadingSpinner size="small" message="" />
            ) : (
              <>
                <Square size={16} />
                Stop Bot
              </>
            )}
          </button>
        )}

        <button
          className="bot-control-btn bot-control-btn-secondary"
          onClick={handleRefresh}
          disabled={loading}
          title="Refresh status"
        >
          <RefreshCw size={16} />
          Refresh
        </button>

        {onConfigure && (
          <button
            className="bot-control-btn bot-control-btn-secondary"
            onClick={onConfigure}
            disabled={loading || actionLoading}
            title="Configure bot"
          >
            <Settings size={16} />
            Configure
          </button>
        )}
      </div>
    </div>
  );
};

export default BotControls;

