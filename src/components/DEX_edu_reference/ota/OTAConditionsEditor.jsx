/**
 * 📝 OTAConditionsEditor.jsx - OTA Conditions Editor
 * 
 * Component pentru editarea condițiilor OTA:
 * - Trading conditions
 * - Entry/exit rules
 * - Stop loss / Take profit rules
 * - Risk management rules
 * - Conditional execution logic
 * 
 * @module OTAConditionsEditor
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import OTALogo from '../frontend/components/ai-trading/OTALogo';
import { OPENAI_TRADING_AGENT_NAME } from '../frontend/utils/aiTradingConstants';
import { useDexAuth } from '../frontend/context/DexAuthContext';
import { toast } from 'react-toastify';
import { logWithPrefix, errorWithPrefix } from '../frontend/utils/logger';
import '../frontend/styles/components/ota-conditions-editor.css';

const OTAConditionsEditor = React.memo(({ onConditionsChange, className = '' }) => {
  const { walletAddress, isAuthenticated } = useDexAuth();
  const [saving, setSaving] = useState(false);

  // Trading Conditions State
  const [conditions, setConditions] = useState({
    entryRules: [
      { id: 1, condition: 'price_above', value: 0, operator: '>', enabled: true }
    ],
    exitRules: [
      { id: 1, condition: 'stop_loss', value: 5, operator: '%', enabled: true },
      { id: 2, condition: 'take_profit', value: 10, operator: '%', enabled: true }
    ],
    stopLoss: {
      enabled: true,
      type: 'percentage', // percentage or fixed
      value: 5 // 5%
    },
    takeProfit: {
      enabled: true,
      type: 'percentage', // percentage or fixed
      value: 10 // 10%
    }
  });

  const handleConditionChange = useCallback((type, id, key, value) => {
    setConditions(prev => {
      const newConditions = {
        ...prev,
        [type]: prev[type].map(cond =>
          cond.id === id ? { ...cond, [key]: value } : cond
        )
      };
      
      logWithPrefix('OTA', `Condition changed: ${type}.${id}.${key} = ${value}`, newConditions);
      
      if (onConditionsChange) {
        onConditionsChange(newConditions);
      }
      
      return newConditions;
    });
  }, [onConditionsChange]);

  const handleAddCondition = useCallback((type) => {
    setConditions(prev => {
      const existingIds = prev[type].map(c => c.id);
      const newId = existingIds.length > 0 ? Math.max(...existingIds, 0) + 1 : 1;
      const newCondition = {
        id: newId,
        condition: type === 'entryRules' ? 'price_above' : 'stop_loss',
        value: 0,
        operator: '>',
        enabled: true
      };
      
      logWithPrefix('OTA', `Adding new ${type} condition:`, newCondition);
      
      return {
        ...prev,
        [type]: [...prev[type], newCondition]
      };
    });
  }, []);

  const handleRemoveCondition = useCallback((type, id) => {
    setConditions(prev => ({
      ...prev,
      [type]: prev[type].filter(cond => cond.id !== id)
    }));
  }, []);

  const handleStopLossChange = useCallback((key, value) => {
    setConditions(prev => {
      const newConditions = {
        ...prev,
        stopLoss: {
          ...prev.stopLoss,
          [key]: value
        }
      };
      
      if (onConditionsChange) {
        onConditionsChange(newConditions);
      }
      
      return newConditions;
    });
  }, [onConditionsChange]);

  const handleTakeProfitChange = useCallback((key, value) => {
    setConditions(prev => {
      const newConditions = {
        ...prev,
        takeProfit: {
          ...prev.takeProfit,
          [key]: value
        }
      };
      
      if (onConditionsChange) {
        onConditionsChange(newConditions);
      }
      
      return newConditions;
    });
  }, [onConditionsChange]);

  // Validate conditions before saving
  const hasValidConditions = useMemo(() => {
    return conditions.entryRules.length > 0 || conditions.exitRules.length > 0;
  }, [conditions.entryRules.length, conditions.exitRules.length]);

  const handleSave = useCallback(async () => {
    if (!isAuthenticated || !walletAddress) {
      toast.error('Please connect wallet to save conditions');
      return;
    }

    if (!hasValidConditions) {
      toast.warning('Please add at least one entry or exit rule');
      return;
    }

    try {
      setSaving(true);
      
      // TODO: Save to backend API when available
      const storageKey = `ota_conditions_${walletAddress}`;
      localStorage.setItem(storageKey, JSON.stringify(conditions));
      
      logWithPrefix('OTA', 'Conditions saved:', conditions);
      toast.success('Trading conditions saved successfully');
      
    } catch (err) {
      errorWithPrefix('OTAConditionsEditor', 'Error saving conditions:', err);
      toast.error(err?.message || 'Failed to save conditions');
    } finally {
      setSaving(false);
    }
  }, [conditions, isAuthenticated, walletAddress, hasValidConditions]);

  // Load conditions from localStorage on mount
  useEffect(() => {
    if (walletAddress) {
      const storageKey = `ota_conditions_${walletAddress}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Validate loaded conditions structure
          if (parsed.entryRules && parsed.exitRules && parsed.stopLoss && parsed.takeProfit) {
            setConditions(parsed);
          }
        } catch (err) {
          errorWithPrefix('OTAConditionsEditor', 'Error loading saved conditions:', err);
        }
      }
    }
  }, [walletAddress]);

  return (
    <div className={`ota-conditions-editor ${className}`}>
      <div className="ota-conditions-editor-header">
        <div className="ota-conditions-editor-header-left ota-title-row">
          <OTALogo size="sm" showBorder className="ota-conditions-editor-logo" />
          <h3 className="ota-conditions-editor-title">OTA Conditions Editor</h3>
        </div>
        <button
          className="ota-conditions-editor-save-btn"
          onClick={handleSave}
          disabled={saving || !isAuthenticated}
        >
          {saving ? 'Saving...' : 'Save Conditions'}
        </button>
      </div>

      <div className="ota-conditions-editor-description" role="region" aria-label="OTA Conditions Editor Description">
        <p>Define trading conditions and rules for {OPENAI_TRADING_AGENT_NAME}. Configure entry/exit rules, stop loss, and take profit settings.</p>
      </div>

      <div className="ota-conditions-editor-content">
        {/* Stop Loss & Take Profit */}
        <div className="ota-conditions-editor-section" role="region" aria-label="Risk Management Settings">
          <h4 className="ota-conditions-editor-section-title">Risk Management</h4>
          
          <div className="ota-conditions-editor-risk-grid">
            {/* Stop Loss */}
            <div className="ota-conditions-editor-risk-card">
              <label className="ota-conditions-editor-risk-label">
                <input
                  type="checkbox"
                  checked={conditions.stopLoss.enabled}
                  onChange={(e) => handleStopLossChange('enabled', e.target.checked)}
                />
                <span>Stop Loss</span>
              </label>
              {conditions.stopLoss.enabled && (
                <div className="ota-conditions-editor-risk-inputs">
                  <select
                    value={conditions.stopLoss.type}
                    onChange={(e) => handleStopLossChange('type', e.target.value)}
                    className="ota-conditions-editor-risk-type"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Price ($)</option>
                  </select>
                  <input
                    type="number"
                    value={conditions.stopLoss.value}
                    onChange={(e) => handleStopLossChange('value', parseFloat(e.target.value) || 0)}
                    className="ota-conditions-editor-risk-value"
                    step={conditions.stopLoss.type === 'percentage' ? '0.1' : '1'}
                    min="0"
                  />
                  <span className="ota-conditions-editor-risk-unit">
                    {conditions.stopLoss.type === 'percentage' ? '%' : '$'}
                  </span>
                </div>
              )}
            </div>

            {/* Take Profit */}
            <div className="ota-conditions-editor-risk-card">
              <label className="ota-conditions-editor-risk-label">
                <input
                  type="checkbox"
                  checked={conditions.takeProfit.enabled}
                  onChange={(e) => handleTakeProfitChange('enabled', e.target.checked)}
                />
                <span>Take Profit</span>
              </label>
              {conditions.takeProfit.enabled && (
                <div className="ota-conditions-editor-risk-inputs">
                  <select
                    value={conditions.takeProfit.type}
                    onChange={(e) => handleTakeProfitChange('type', e.target.value)}
                    className="ota-conditions-editor-risk-type"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Price ($)</option>
                  </select>
                  <input
                    type="number"
                    value={conditions.takeProfit.value}
                    onChange={(e) => handleTakeProfitChange('value', parseFloat(e.target.value) || 0)}
                    className="ota-conditions-editor-risk-value"
                    step={conditions.takeProfit.type === 'percentage' ? '0.1' : '1'}
                    min="0"
                  />
                  <span className="ota-conditions-editor-risk-unit">
                    {conditions.takeProfit.type === 'percentage' ? '%' : '$'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Entry Rules */}
        <div className="ota-conditions-editor-section" role="region" aria-label="Entry Rules">
          <div className="ota-conditions-editor-section-header">
            <h4 className="ota-conditions-editor-section-title">Entry Rules</h4>
            <button
              className="ota-conditions-editor-add-btn"
              onClick={() => handleAddCondition('entryRules')}
            >
              <Plus size={16} />
              Add Rule
            </button>
          </div>
          <div className="ota-conditions-editor-rules-list">
            {conditions.entryRules.map(rule => (
              <div key={rule.id} className="ota-conditions-editor-rule">
                <label className="ota-conditions-editor-rule-checkbox">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) => handleConditionChange('entryRules', rule.id, 'enabled', e.target.checked)}
                  />
                </label>
                <select
                  value={rule.condition}
                  onChange={(e) => handleConditionChange('entryRules', rule.id, 'condition', e.target.value)}
                  className="ota-conditions-editor-rule-select"
                >
                  <option value="price_above">Price Above</option>
                  <option value="price_below">Price Below</option>
                  <option value="volume_above">Volume Above</option>
                  <option value="rsi_below">RSI Below</option>
                </select>
                <input
                  type="number"
                  value={rule.value}
                  onChange={(e) => handleConditionChange('entryRules', rule.id, 'value', parseFloat(e.target.value) || 0)}
                  className="ota-conditions-editor-rule-value"
                  step="0.01"
                />
                <button
                  className="ota-conditions-editor-rule-remove"
                  onClick={() => handleRemoveCondition('entryRules', rule.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Exit Rules */}
        <div className="ota-conditions-editor-section" role="region" aria-label="Exit Rules">
          <div className="ota-conditions-editor-section-header">
            <h4 className="ota-conditions-editor-section-title">Exit Rules</h4>
            <button
              className="ota-conditions-editor-add-btn"
              onClick={() => handleAddCondition('exitRules')}
            >
              <Plus size={16} />
              Add Rule
            </button>
          </div>
          <div className="ota-conditions-editor-rules-list">
            {conditions.exitRules.map(rule => (
              <div key={rule.id} className="ota-conditions-editor-rule">
                <label className="ota-conditions-editor-rule-checkbox">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) => handleConditionChange('exitRules', rule.id, 'enabled', e.target.checked)}
                  />
                </label>
                <select
                  value={rule.condition}
                  onChange={(e) => handleConditionChange('exitRules', rule.id, 'condition', e.target.value)}
                  className="ota-conditions-editor-rule-select"
                >
                  <option value="stop_loss">Stop Loss</option>
                  <option value="take_profit">Take Profit</option>
                  <option value="trailing_stop">Trailing Stop</option>
                  <option value="time_based">Time Based Exit</option>
                </select>
                <input
                  type="number"
                  value={rule.value}
                  onChange={(e) => handleConditionChange('exitRules', rule.id, 'value', parseFloat(e.target.value) || 0)}
                  className="ota-conditions-editor-rule-value"
                  step="0.01"
                />
                <button
                  className="ota-conditions-editor-rule-remove"
                  onClick={() => handleRemoveCondition('exitRules', rule.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        {!isAuthenticated && (
          <div className="ota-conditions-editor-warning">
            <AlertCircle size={16} />
            <span>Connect your wallet to save trading conditions</span>
          </div>
        )}
      </div>
    </div>
  );
});

OTAConditionsEditor.displayName = 'OTAConditionsEditor';

export default OTAConditionsEditor;
