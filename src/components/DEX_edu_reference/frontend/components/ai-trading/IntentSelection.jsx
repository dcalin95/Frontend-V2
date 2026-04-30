/**
 * 🎯 Intent Selection Component - AI Trading Intent Selection
 * 
 * Component pentru selecția intent-ului în AI Trading:
 * - Buy/Sell/Hold/Swap intents
 * - Decision scores (heuristic; not calibrated probability)
 * - Reasoning display
 * - Recommended tokens
 * - SEPARAT de trading clasic (doar pentru AI Trading)
 * 
 * @module IntentSelection
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Pause, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import TokenLogo from '../common/TokenLogo';
import OTALogo from './OTALogo';
import { OPENAI_TRADING_AGENT_NAME, AI_PROVIDER_BADGE } from '../../utils/aiTradingConstants';
import { analyzeMarketWithLlmProvider } from '../../services/otaAnalyzeFacade';
import { isOpenAiUnavailableResult } from '../../utils/helpers';
import { loadOutcomesForAnalyze, buildAnalyzeOptions } from '../../utils/otaOutcomesHelper';
import { errorWithPrefix } from '../../utils/logger';
import { useDexAuth } from '../../context/DexAuthContext';
import '../../styles/components/intent-selection.css';

const IntentSelection = ({ 
  selectedIntent = null,
  onIntentSelect,
  className = ''
}) => {
  const { walletAddress, associatedWalletAddress } = useDexAuth();
  const effectiveUserWallet = walletAddress || associatedWalletAddress || null;
  const [intents, setIntents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadIntents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch AI trading intents from /api/ai-trading/analyze for popular tokens
        // ⚡ Public access: No userId required for price analysis (AI can access prices freely)
        const popularTokens = ['BTC', 'ETH', 'BNB', 'BITS', 'USDT'];
        const recentOutcomes = effectiveUserWallet ? await loadOutcomesForAnalyze(effectiveUserWallet).catch(() => []) : [];
        const options = buildAnalyzeOptions(effectiveUserWallet, { quoteToken: 'USDT', recentOutcomes });
        const intentsPromises = popularTokens.map(async (token) => {
          try {
            const response = await analyzeMarketWithLlmProvider(token, options);
            if (isOpenAiUnavailableResult(response)) return null;
            if (response.success && response.signal) {
              const signal = response.signal;
              const intentType = signal.signal === 'buy' ? 'buy' :
                                signal.signal === 'sell' ? 'sell' :
                                signal.signal === 'hold' ? 'hold' : 'swap';
              
              return {
                id: `${token}-${intentType}`,
                type: intentType,
                label: `${intentType.toUpperCase()} ${token}`,
                description: signal.reasoning || `AI recommendation for ${token}`,
                confidence: Math.round((signal.confidence || 0.5) * 100),
                reasoning: signal.reasoning || '',
                riskLevel: signal.riskLevel || 'medium',
                color: intentType === 'buy' ? '#10b981' :
                       intentType === 'sell' ? '#ef4444' :
                       intentType === 'hold' ? '#f59e0b' : '#6366f1',
                recommendedTokens: [token],
                token: token,
                entryPrice: signal.entryPrice,
                stopLoss: signal.stopLoss,
                takeProfit: signal.takeProfit
              };
            }
            return null;
          } catch (err) {
            errorWithPrefix('IntentSelection', `Error analyzing ${token}:`, err);
            return null;
          }
        });

        const results = await Promise.all(intentsPromises);
        const validIntents = results.filter(intent => intent !== null);
        
        setIntents(validIntents);
      } catch (err) {
        errorWithPrefix('IntentSelection', '❌ ERROR:', err);
        setError(err?.message || String(err) || 'Unknown error');
        setIntents([]);
      } finally {
        setLoading(false);
      }
    };

    loadIntents();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadIntents, 30000);
    return () => clearInterval(interval);
  }, [effectiveUserWallet]);

  const getIntentIcon = (type) => {
    switch (type) {
      case 'buy':
        return <TrendingUp size={24} />;
      case 'sell':
        return <TrendingDown size={24} />;
      case 'hold':
        return <Pause size={24} />;
      case 'swap':
        return <RefreshCw size={24} />;
      default:
        return <Sparkles size={24} />;
    }
  };

  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return 'var(--dex-success)';
      case 'medium':
        return 'var(--dex-warning)';
      case 'high':
        return 'var(--dex-error)';
      default:
        return 'var(--dex-text-secondary)';
    }
  };

  if (loading) {
    return (
      <div className={`ai-intent-selection ${className}`}>
        <div className="ai-intent-selection-loading">Loading AI intents...</div>
      </div>
    );
  }

  return (
    <div className={`ai-intent-selection ${className}`}>
      <div className="ai-intent-selection-header">
        <div className="ai-intent-selection-header-left ota-title-row">
          <OTALogo size="md" showGlow className="ai-intent-selection-logo" />
          <Sparkles size={20} className="ai-intent-selection-icon" />
          <h3 className="ai-intent-selection-title">AI Intent Selection</h3>
        </div>
        <div className="ai-intent-selection-badge ota-title-row">
          <OTALogo size="xs" className="ai-intent-selection-badge-logo" />
          <span>{AI_PROVIDER_BADGE}</span>
        </div>
      </div>

      <div className="ai-intent-selection-description">
        <p>Select an AI-generated trading intent based on market analysis. These recommendations are generated by {OPENAI_TRADING_AGENT_NAME} and are separate from manual trading.</p>
      </div>

      <div className="ai-intent-selection-grid">
        {intents.map((intent) => {
          const isSelected = selectedIntent === intent.id;
          const Icon = getIntentIcon(intent.type);
          
          return (
            <button
              key={intent.id}
              className={`ai-intent-card ${isSelected ? 'ai-intent-card-selected' : ''}`}
              onClick={() => onIntentSelect && onIntentSelect(intent)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onIntentSelect && onIntentSelect(intent);
                }
              }}
              aria-label={`Select ${intent.label} intent, decision score ${intent.confidence}%`}
              aria-pressed={isSelected}
              aria-describedby={`intent-${intent.id}-description`}
              style={{ '--intent-color': intent.color }}
            >
              <div className="ai-intent-card-header">
                <div className="ai-intent-card-icon" style={{ color: intent.color }}>
                  {Icon}
                </div>
                <div className="ai-intent-card-info">
                  <h4 className="ai-intent-card-label">{intent.label}</h4>
                  <p id={`intent-${intent.id}-description`} className="ai-intent-card-description">{intent.description}</p>
                </div>
              </div>

              <div className="ai-intent-card-body">
                <div className="ai-intent-card-confidence" title="Heuristic decision score; not a calibrated probability.">
                  <span className="ai-intent-card-confidence-label">Decision score:</span>
                  <div 
                    className="ai-intent-card-confidence-bar"
                    role="progressbar"
                    aria-valuenow={intent.confidence}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Decision score: ${intent.confidence}%`}
                  >
                    <div 
                      className="ai-intent-card-confidence-fill"
                      style={{ 
                        width: `${intent.confidence}%`,
                        backgroundColor: intent.color
                      }}
                    />
                  </div>
                  <span className="ai-intent-card-confidence-value">{intent.confidence}%</span>
                </div>

                {intent.reasoning && (
                  <div className="ai-intent-card-reasoning">
                    <AlertCircle size={14} />
                    <span>{intent.reasoning}</span>
                  </div>
                )}

                {intent.recommendedTokens && intent.recommendedTokens.length > 0 && (
                  <div className="ai-intent-card-tokens">
                    <span className="ai-intent-card-tokens-label">Recommended:</span>
                    <div className="ai-intent-card-tokens-list">
                      {intent.recommendedTokens.map((token) => (
                        <TokenLogo 
                          key={token} 
                          symbol={token} 
                          size="xs" 
                          showBorder 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="ai-intent-card-footer">
                <div 
                  className="ai-intent-card-risk-badge"
                  style={{ backgroundColor: getRiskBadgeColor(intent.riskLevel) }}
                >
                  {intent.riskLevel.toUpperCase()} RISK
                </div>
                {isSelected && (
                  <div className="ai-intent-card-selected-indicator">
                    Selected
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="ai-intent-selection-footer">
        <span className="ai-intent-selection-warning">
          ⚠️ {OPENAI_TRADING_AGENT_NAME} Mode - These intents are AI-generated recommendations, separate from manual trading.
        </span>
      </div>
    </div>
  );
};

export default IntentSelection;
