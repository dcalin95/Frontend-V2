/**
 * AutoTradeStartStop - Start/Stop bot buttons only (Direct Entry stays in parent)
 * @param {React.ReactNode} [llmPauseSlot] - opțional: controale LLM (inline) lângă Stop/Start
 */
import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import { AutotradeIconStart, AutotradeIconStop } from './AutoTradeAnimatedIcons';

function AutoTradeStartStop({
  policy,
  policyLoading,
  saving,
  handleStopBot,
  handleStartBot,
  children = null,
  llmPauseSlot = null,
  newTradesDisabled = false,
}) {
  return (
    <div className="auto-trade-panel-start-stop" role="group" aria-label="Start or Stop OTA AI Auto Trading">
      <div className="auto-trade-panel-start-stop-actions">
        {policy.enabled ? (
          <button
            type="button"
            className="auto-trade-panel-btn-start-stop auto-trade-panel-btn-stop"
            onClick={handleStopBot}
            disabled={saving || policyLoading}
            aria-label="Stop OTA AI Auto Trading"
            title="Stop the bot – it will no longer execute trades"
          >
            {saving ? <LoadingSpinner size={20} /> : <AutotradeIconStop />}
            <span>Stop Auto Trading</span>
          </button>
        ) : (
          <button
            type="button"
            className="auto-trade-panel-btn-start-stop auto-trade-panel-btn-start"
            onClick={handleStartBot}
            disabled={saving || policyLoading}
            aria-label="Start OTA AI Auto Trading"
            title="Start the bot – it will execute trades when AI signals appear"
          >
            {saving ? <LoadingSpinner size={20} /> : <AutotradeIconStart />}
            <span>{newTradesDisabled ? 'Start Disabled' : 'Start Auto Trading'}</span>
          </button>
        )}
        {llmPauseSlot}
        {newTradesDisabled && (
          <p className="auto-trade-panel-start-stop-hint" role="alert">
            Emergency safety lock is active. New real trades are disabled; closing existing positions remains available.
          </p>
        )}
      </div>
      <p className="auto-trade-panel-start-stop-hint">
        Bot runs every 30–60 seconds. When Auto is on, it checks for AI signals and executes trades within your authorized limit. When you stop, it will not execute new trades.
      </p>
      {children}
    </div>
  );
}

export default React.memo(AutoTradeStartStop);
