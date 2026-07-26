/**
 * 🛡️ Risk Gating Panel - AI Trading Risk Management
 * 
 * Panel pentru setarea limitelor de risc în AI Trading:
 * - Risk limits configuration
 * - Risk metrics display
 * - Risk warnings/alerts
 * - SEPARAT de trading clasic (doar pentru AI Trading)
 * 
 * @module RiskGatingPanel
 */

import React, { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, TrendingDown, DollarSign, Percent, Sliders } from 'lucide-react';
import OTALogo from './OTALogo';
import { OPENAI_TRADING_AGENT_NAME } from '../../utils/aiTradingConstants';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { usePerformance } from '../../hooks/usePerformance';
import { saveRiskLimits } from '../../services/performanceApiService';
import { DEFAULT_VALUES } from '../../utils/constants';
import { errorWithPrefix } from '../../utils/logger';
import { toast } from 'react-toastify';
import { useDexAuth } from '../../context/DexAuthContext';
import '../../styles/components/risk-gating-panel.css';

const RiskGatingPanel = ({ 
  userId: userIdProp,
  onRiskLimitsChange,
  className = ''
}) => {
  const { walletAddress, associatedWalletAddress } = useDexAuth();
  // Risk preferences are wallet-scoped; do not fall back to a global account id.
  const userId = userIdProp || walletAddress || associatedWalletAddress || null;
  const [isEditing, setIsEditing] = useState(false);
  const [editedLimits, setEditedLimits] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedLimits, setSavedLimits] = useState(null);

  // Load risk metrics from performance API
  const { 
    riskMetrics, 
    loading, 
    error 
  } = usePerformance(userId || null, { period: '30d' });

  // Use risk metrics or default values
  const riskLimits = useMemo(() => {
    const persisted = savedLimits || (riskMetrics?.persisted || riskMetrics?.enforced ? riskMetrics : null);
    if (persisted) {
      return {
        maxPercentPerTrade: persisted.maxPercentPerTrade ?? DEFAULT_VALUES.RISK_LIMITS.MAX_PERCENT_PER_TRADE,
        maxPercentPerDay: persisted.maxPercentPerDay ?? 10.0,
        dailyLossLimit: persisted.dailyLossLimit ?? 1000,
        maxDrawdown: persisted.maxDrawdown ?? 20.0,
        requireStopLoss: persisted.requireStopLoss !== undefined ? persisted.requireStopLoss : true,
        requireTakeProfit: persisted.requireTakeProfit !== undefined ? persisted.requireTakeProfit : true
      };
    }
    
    // Use default values if no risk metrics available
    return {
      maxPercentPerTrade: DEFAULT_VALUES.RISK_LIMITS.MAX_PERCENT_PER_TRADE,
      maxPercentPerDay: 10.0,
      dailyLossLimit: 1000,
      maxDrawdown: 20.0,
      requireStopLoss: true,
      requireTakeProfit: true
    };
  }, [riskMetrics, savedLimits]);

  useEffect(() => {
    setSavedLimits(null);
    setEditedLimits({});
  }, [userId]);

  // Initialize edited limits when entering edit mode
  useEffect(() => {
    if (isEditing && Object.keys(editedLimits).length === 0) {
      setEditedLimits(riskLimits);
    }
  }, [isEditing, riskLimits]);

  const handleLimitChange = (key, value) => {
    setEditedLimits(prev => ({
      ...prev,
      [key]: parseFloat(value) || value
    }));
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error('User ID is required to save risk limits');
      return;
    }

    try {
      setSaving(true);
      
      // Save to API
      const response = await saveRiskLimits(userId, editedLimits);
      
      if (response.success) {
        const persisted = response.riskLimits || editedLimits;
        setSavedLimits(persisted);
        setEditedLimits(persisted);
        toast.success(response.enforced ? 'Risk limits saved and enforced' : 'Risk limits saved');
        
        // Update local state
        if (onRiskLimitsChange) {
          onRiskLimitsChange(editedLimits);
        }
        
        setIsEditing(false);
      } else {
        throw new Error(response.error || 'Failed to save risk limits');
      }
    } catch (err) {
      errorWithPrefix('RiskGatingPanel', 'Error saving risk limits:', err);
      toast.error(err?.message || 'Failed to save risk limits');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedLimits(riskLimits);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className={`ai-risk-gating-panel ${className}`}>
        <LoadingSpinner message="Loading risk limits" size="medium" />
      </div>
    );
  }

  // riskLimits will always have default values from useMemo, so we can always render
  // Error is handled gracefully by using default values

  const currentLimits = isEditing ? editedLimits : riskLimits;

  return (
    <div className={`ai-risk-gating-panel ${className}`}>
      <div className="ai-risk-gating-panel-header">
        <div className="ai-risk-gating-panel-header-left ota-title-row">
          <OTALogo size="sm" showBorder className="ai-risk-gating-panel-logo" />
          <h3 className="ai-risk-gating-panel-title">AI Trading Risk Gating</h3>
        </div>
        {!isEditing ? (
          <button
            className="ai-risk-gating-panel-edit-btn"
            onClick={() => setIsEditing(true)}
          >
            <Sliders size={16} />
            Edit
          </button>
        ) : (
          <div className="ai-risk-gating-panel-actions">
            <button
              className="ai-risk-gating-panel-btn ai-risk-gating-panel-btn-secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="ai-risk-gating-panel-btn ai-risk-gating-panel-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="ai-risk-gating-panel-description">
        <p>Configure risk limits for {OPENAI_TRADING_AGENT_NAME}. These settings apply only to AI-generated trades and are separate from manual trading limits.</p>
        <p>
          {savedLimits || riskMetrics?.enforced
            ? 'Status: persisted and enforced for new OTA positions. Protective closes remain available.'
            : 'Action required: these are only suggested defaults. Click Edit, choose your limits, then Save once to activate per-wallet protection for new OTA positions.'}
        </p>
      </div>

      <div className="ai-risk-gating-panel-content">
        {/* Risk Limits Grid */}
        <div className="ai-risk-gating-panel-section">
          <h4 className="ai-risk-gating-panel-section-title">Risk Limits</h4>
          <div className="ai-risk-gating-panel-limits-grid">
            <div className="ai-risk-gating-panel-limit-card">
              <div className="ai-risk-gating-panel-limit-header">
                <Percent size={18} />
                <span className="ai-risk-gating-panel-limit-label">Max % Per Trade</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  className="ai-risk-gating-panel-limit-input"
                  value={currentLimits.maxPercentPerTrade}
                  onChange={(e) => handleLimitChange('maxPercentPerTrade', e.target.value)}
                  step="0.1"
                  min="0"
                  max="100"
                />
              ) : (
                <div className="ai-risk-gating-panel-limit-value">
                  {currentLimits.maxPercentPerTrade}%
                </div>
              )}
            </div>

            <div className="ai-risk-gating-panel-limit-card">
              <div className="ai-risk-gating-panel-limit-header">
                <Percent size={18} />
                <span className="ai-risk-gating-panel-limit-label">Max % Per Day</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  className="ai-risk-gating-panel-limit-input"
                  value={currentLimits.maxPercentPerDay}
                  onChange={(e) => handleLimitChange('maxPercentPerDay', e.target.value)}
                  step="0.1"
                  min="0"
                  max="100"
                />
              ) : (
                <div className="ai-risk-gating-panel-limit-value">
                  {currentLimits.maxPercentPerDay}%
                </div>
              )}
            </div>

            <div className="ai-risk-gating-panel-limit-card">
              <div className="ai-risk-gating-panel-limit-header">
                <DollarSign size={18} />
                <span className="ai-risk-gating-panel-limit-label">Daily Loss Limit</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  className="ai-risk-gating-panel-limit-input"
                  value={currentLimits.dailyLossLimit}
                  onChange={(e) => handleLimitChange('dailyLossLimit', e.target.value)}
                  step="10"
                  min="0"
                />
              ) : (
                <div className="ai-risk-gating-panel-limit-value">
                  ${currentLimits.dailyLossLimit.toLocaleString()}
                </div>
              )}
            </div>

            <div className="ai-risk-gating-panel-limit-card">
              <div className="ai-risk-gating-panel-limit-header">
                <TrendingDown size={18} />
                <span className="ai-risk-gating-panel-limit-label">Max Drawdown</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  className="ai-risk-gating-panel-limit-input"
                  value={currentLimits.maxDrawdown}
                  onChange={(e) => handleLimitChange('maxDrawdown', e.target.value)}
                  step="0.1"
                  min="0"
                  max="100"
                />
              ) : (
                <div className="ai-risk-gating-panel-limit-value">
                  {currentLimits.maxDrawdown}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="ai-risk-gating-panel-section">
          <h4 className="ai-risk-gating-panel-section-title">Additional Settings</h4>
          <div className="ai-risk-gating-panel-settings">
            <div className="ai-risk-gating-panel-setting">
              <label className="ai-risk-gating-panel-setting-label">
                <input
                  type="checkbox"
                  checked={currentLimits.requireStopLoss}
                  onChange={(e) => handleLimitChange('requireStopLoss', e.target.checked)}
                  disabled={!isEditing}
                />
                <span>Require Stop Loss</span>
              </label>
            </div>

            <div className="ai-risk-gating-panel-setting">
              <label className="ai-risk-gating-panel-setting-label">
                <input
                  type="checkbox"
                  checked={currentLimits.requireTakeProfit}
                  onChange={(e) => handleLimitChange('requireTakeProfit', e.target.checked)}
                  disabled={!isEditing}
                />
                <span>Require Take Profit</span>
              </label>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="ai-risk-gating-panel-warning">
          <AlertTriangle size={16} />
          <span>These risk limits apply only to {OPENAI_TRADING_AGENT_NAME}. Manual trading has separate risk controls.</span>
        </div>
      </div>
    </div>
  );
};

export default RiskGatingPanel;
