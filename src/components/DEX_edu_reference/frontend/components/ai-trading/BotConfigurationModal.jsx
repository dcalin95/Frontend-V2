/**
 * ⚙️ Bot Configuration Modal - Complete AI Trading Bot Configuration
 * 
 * Modal complet pentru configurarea AI Trading Bot:
 * - Integrează Intent Selection
 * - Integrează Strategy Configuration
 * - Integrează Risk Gating
 * - SEPARAT de trading clasic (doar pentru AI Trading)
 * 
 * @module BotConfigurationModal
 */

import React, { useState } from 'react';
import { X, Settings, Sparkles, Shield, Target } from 'lucide-react';
import IntentSelection from './IntentSelection';
import StrategyConfigurationModal from './StrategyConfigurationModal';
import RiskGatingPanel from './RiskGatingPanel';
import OTALogo from './OTALogo';
import { OPENAI_TRADING_AGENT_NAME, AI_PROVIDER_BADGE } from '../../utils/aiTradingConstants';
import '../../styles/components/bot-configuration-modal.css';

const BotConfigurationModal = ({ 
  userId,
  isOpen,
  onClose,
  onSave,
  initialConfig = null
}) => {
  const [activeTab, setActiveTab] = useState('intent'); // intent, strategy, risk
  const [selectedIntent, setSelectedIntent] = useState(initialConfig?.intent || null);
  const [selectedStrategy, setSelectedStrategy] = useState(initialConfig?.strategy || null);
  const [riskLimits, setRiskLimits] = useState(initialConfig?.riskLimits || null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  const handleSave = () => {
    const config = {
      intent: selectedIntent,
      strategy: selectedStrategy,
      riskLimits: riskLimits,
      automation: {
        enabled: true,
        autoExecute: false
      }
    };

    if (onSave) {
      onSave(config);
    }

    onClose();
  };

  const handleStrategySave = (strategy) => {
    setSelectedStrategy(strategy);
    setShowStrategyModal(false);
  };

  const handleRiskLimitsChange = (limits) => {
    setRiskLimits(limits);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'intent', label: 'Intent', icon: Sparkles },
    { id: 'strategy', label: 'Strategy', icon: Target },
    { id: 'risk', label: 'Risk', icon: Shield }
  ];

  return (
    <>
      <div className="ai-bot-config-modal-overlay" onClick={onClose}>
        <div className="ai-bot-config-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="ai-bot-config-modal-header">
            <div className="ai-bot-config-modal-header-left ota-title-row">
              <OTALogo size="md" showBorder showGlow className="ai-bot-config-modal-logo" />
              <Settings size={20} />
              <h2 className="ai-bot-config-modal-title">Configure {OPENAI_TRADING_AGENT_NAME}</h2>
            </div>
            <button 
              className="ai-bot-config-modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="ai-bot-config-modal-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`ai-bot-config-modal-tab ${isActive ? 'ai-bot-config-modal-tab-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="ai-bot-config-modal-body">
            {activeTab === 'intent' && (
              <IntentSelection
                selectedIntent={selectedIntent?.id}
                onIntentSelect={setSelectedIntent}
              />
            )}

            {activeTab === 'strategy' && (
              <div className="ai-bot-config-modal-strategy-section">
                {selectedStrategy ? (
                  <div className="ai-bot-config-modal-strategy-selected">
                    <div className="ai-bot-config-modal-strategy-selected-header">
                      <Target size={20} />
                      <div>
                        <h4>{selectedStrategy.name}</h4>
                        <p>{selectedStrategy.description}</p>
                      </div>
                    </div>
                    <button
                      className="ai-bot-config-modal-strategy-change-btn"
                      onClick={() => setShowStrategyModal(true)}
                    >
                      Change Strategy
                    </button>
                  </div>
                ) : (
                  <div className="ai-bot-config-modal-strategy-empty">
                    <Target size={48} />
                    <p>No strategy selected</p>
                    <button
                      className="ai-bot-config-modal-strategy-select-btn"
                      onClick={() => setShowStrategyModal(true)}
                    >
                      Select Strategy
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'risk' && (
              <RiskGatingPanel
                userId={userId}
                onRiskLimitsChange={handleRiskLimitsChange}
              />
            )}
          </div>

          {/* Footer */}
          <div className="ai-bot-config-modal-footer">
            <div className="ai-bot-config-modal-summary">
              {selectedIntent && (
                <span className="ai-bot-config-modal-summary-item">
                  Intent: {selectedIntent.label}
                </span>
              )}
              {selectedStrategy && (
                <span className="ai-bot-config-modal-summary-item">
                  Strategy: {selectedStrategy.name}
                </span>
              )}
              {riskLimits && (
                <span className="ai-bot-config-modal-summary-item">
                  Risk: Configured
                </span>
              )}
            </div>
            <div className="ai-bot-config-modal-footer-actions">
              <button
                className="ai-bot-config-modal-btn ai-bot-config-modal-btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="ai-bot-config-modal-btn ai-bot-config-modal-btn-primary"
                onClick={handleSave}
                disabled={!selectedIntent || !selectedStrategy || !riskLimits}
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Configuration Modal */}
      {showStrategyModal && (
        <StrategyConfigurationModal
          isOpen={showStrategyModal}
          onClose={() => setShowStrategyModal(false)}
          onSave={handleStrategySave}
          strategyId={selectedStrategy?.id}
        />
      )}
    </>
  );
};

export default BotConfigurationModal;
