/**
 * ⚙️ Strategy Configuration Modal - AI Trading Strategy Configuration
 * 
 * Modal pentru configurarea strategiilor AI Trading:
 * - Strategy templates
 * - Parameter configuration
 * - Risk settings
 * - Activation/deactivation
 * - SEPARAT de trading clasic (doar pentru AI Trading)
 * 
 * @module StrategyConfigurationModal
 */

import React, { useState, useEffect } from 'react';
import { X, Settings, Target, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import OTALogo from './OTALogo';
import { OPENAI_TRADING_AGENT_NAME } from '../../utils/aiTradingConstants';
import { getStrategies, getStrategy, createStrategy, updateStrategy } from '../../services/strategyApiService';
import { useDexAuth } from '../../context/DexAuthContext';
import { errorWithPrefix } from '../../utils/logger';
import { toast } from 'react-toastify';
import '../../styles/components/strategy-configuration-modal.css';

const StrategyConfigurationModal = ({ 
  isOpen,
  onClose,
  onSave,
  strategyId = null
}) => {
  const { walletAddress, associatedWalletAddress } = useDexAuth();
  const effectiveUserWallet = walletAddress || associatedWalletAddress || null;
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [parameters, setParameters] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && effectiveUserWallet) {
      const loadStrategies = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Fetch real AI trading strategies from API
          if (strategyId) {
            // Fetch specific strategy by ID
            const response = await getStrategy(effectiveUserWallet, strategyId);
            if (response.success && response.strategy) {
              setSelectedStrategy(response.strategy);
              setParameters(response.strategy.config || response.strategy.parameters || {});
            }
          } else {
            // Fetch all strategies
            const response = await getStrategies(effectiveUserWallet);
            const strategiesList = response.strategies || response || [];
            setStrategies(strategiesList);
          }
        } catch (err) {
          errorWithPrefix('StrategyConfigurationModal', '❌ ERROR:', err);
          setError(err?.message || String(err) || 'Unknown error');
          setStrategies([]);
        } finally {
          setLoading(false);
        }
      };

      loadStrategies();
    }
  }, [isOpen, strategyId, effectiveUserWallet]);

  const handleStrategySelect = (strategy) => {
    setSelectedStrategy(strategy);
    setParameters(strategy.config || strategy.parameters || {});
  };

  const handleParameterChange = (key, value) => {
    setParameters(prev => ({
      ...prev,
      [key]: parseFloat(value) || value
    }));
  };

  const handleSave = async () => {
    if (!selectedStrategy || !effectiveUserWallet) return;
    
    try {
      setLoading(true);
      
      const strategyData = {
        name: selectedStrategy.name,
        type: selectedStrategy.type,
        config: { ...parameters },
        riskLevel: selectedStrategy.riskLevel || 'medium',
        enabled: true
      };
      
      let response;
      if (strategyId) {
        // Update existing strategy
        response = await updateStrategy(effectiveUserWallet, strategyId, strategyData);
      } else {
        // Create new strategy
        response = await createStrategy(effectiveUserWallet, strategyData);
      }
      
      if (response.success) {
        toast.success(strategyId ? 'Strategy updated successfully' : 'Strategy created successfully');
        
        if (onSave) {
          onSave(response.strategy || strategyData);
        }
        
        onClose();
      } else {
        throw new Error(response.error || 'Failed to save strategy');
      }
    } catch (err) {
      errorWithPrefix('StrategyConfigurationModal', 'Error saving strategy:', err);
      toast.error(err?.message || 'Failed to save strategy');
      setError(err?.message || String(err) || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-strategy-modal-overlay" onClick={onClose}>
      <div className="ai-strategy-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="ai-strategy-modal-header">
            <div className="ai-strategy-modal-header-left ota-title-row">
              <OTALogo size="md" showBorder className="ai-strategy-modal-logo" />
              <Settings size={20} />
              <h2 className="ai-strategy-modal-title">Configure {OPENAI_TRADING_AGENT_NAME} Strategy</h2>
            </div>
          <button 
            className="ai-strategy-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="ai-strategy-modal-body">
          {/* Strategy Selection */}
          <div className="ai-strategy-modal-section">
            <h3 className="ai-strategy-modal-section-title">Select Strategy Template</h3>
            <div className="ai-strategy-modal-strategies-grid">
              {strategies.map((strategy) => {
                const isSelected = selectedStrategy?.id === strategy.id;
                return (
                  <button
                    key={strategy.id}
                    className={`ai-strategy-modal-strategy-card ${isSelected ? 'ai-strategy-modal-strategy-card-selected' : ''}`}
                    onClick={() => handleStrategySelect(strategy)}
                  >
                    <div className="ai-strategy-modal-strategy-card-header">
                      <Target size={20} />
                      <span className="ai-strategy-modal-strategy-card-name">{strategy.name}</span>
                    </div>
                    <p className="ai-strategy-modal-strategy-card-description">
                      {strategy.description}
                    </p>
                    <div className="ai-strategy-modal-strategy-card-stats">
                      <span className="ai-strategy-modal-strategy-card-stat">
                        Win Rate: {strategy.winRate}%
                      </span>
                      <span className="ai-strategy-modal-strategy-card-stat">
                        Avg Profit: ${strategy.avgProfit}
                      </span>
                    </div>
                    <div 
                      className={`ai-strategy-modal-strategy-card-risk ai-strategy-modal-strategy-card-risk-${strategy.riskLevel}`}
                    >
                      {strategy.riskLevel.toUpperCase()} RISK
                    </div>
                    {isSelected && (
                      <div className="ai-strategy-modal-strategy-card-selected-indicator">
                        <CheckCircle size={16} />
                        Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parameters Configuration */}
          {selectedStrategy && (
            <div className="ai-strategy-modal-section">
              <h3 className="ai-strategy-modal-section-title">Configure Parameters</h3>
              <div className="ai-strategy-modal-parameters">
                {Object.entries(parameters).map(([key, value]) => (
                  <div key={key} className="ai-strategy-modal-parameter">
                    <label className="ai-strategy-modal-parameter-label">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                    </label>
                    <input
                      type="number"
                      className="ai-strategy-modal-parameter-input"
                      value={value}
                      onChange={(e) => handleParameterChange(key, e.target.value)}
                      step="0.1"
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="ai-strategy-modal-warning">
            <AlertCircle size={16} />
            <span>This configuration is for {OPENAI_TRADING_AGENT_NAME} only. Manual trading settings are separate.</span>
          </div>
        </div>

        <div className="ai-strategy-modal-footer">
          <button
            className="ai-strategy-modal-btn ai-strategy-modal-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="ai-strategy-modal-btn ai-strategy-modal-btn-primary"
            onClick={handleSave}
            disabled={!selectedStrategy}
          >
            Save Strategy
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyConfigurationModal;
