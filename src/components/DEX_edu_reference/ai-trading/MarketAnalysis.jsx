/**
 * 📈 MarketAnalysis Component - Market Analysis Display
 * 
 * Component pentru market analysis:
 * - Token selector
 * - Market data display
 * - Analysis trigger
 * - Recent analysis results
 * 
 * @module MarketAnalysis
 */

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { formatNumber, formatPercentage, formatCurrency } from '../utils/DEX/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../../styles/DEX/components/market-analysis.css';

const MarketAnalysis = ({ 
  userId, 
  selectedToken, 
  onTokenChange, 
  onAnalyze 
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const tokens = ['BTC', 'ETH', 'BNB', 'USDT', 'BITS'];

  const handleAnalyze = async () => {
    if (!onAnalyze || !selectedToken) return;

    try {
      setAnalyzing(true);
      const result = await onAnalyze(selectedToken);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing market:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="market-analysis">
      <div className="market-analysis-header">
        <h2 className="market-analysis-title">Market Analysis</h2>
      </div>

      <div className="market-analysis-content">
        {/* Token Selector */}
        <div className="market-analysis-token-selector">
          <label className="market-analysis-label">Select Token:</label>
          <select
            className="market-analysis-select"
            value={selectedToken}
            onChange={(e) => onTokenChange(e.target.value)}
            disabled={analyzing}
          >
            {tokens.map(token => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
        </div>

        {/* Analyze Button */}
        <button
          className="market-analysis-btn"
          onClick={handleAnalyze}
          disabled={analyzing || !selectedToken}
        >
          {analyzing ? (
            <LoadingSpinner size="small" message="" />
          ) : (
            <>
              <RefreshCw size={16} />
              Analyze Market
            </>
          )}
        </button>

        {/* Analysis Result */}
        {analysisResult && (
          <div className="market-analysis-result">
            <div className="market-analysis-result-header">
              <h3>Analysis Result for {selectedToken}</h3>
            </div>
            
            <div className="market-analysis-result-content">
              <div className="market-analysis-signal">
                <span className="market-analysis-signal-label">Signal:</span>
                <span className={`market-analysis-signal-value market-analysis-signal-${analysisResult.signal?.toLowerCase() || 'hold'}`}>
                  {analysisResult.signal?.toUpperCase() || 'HOLD'}
                  {analysisResult.signal === 'buy' && <TrendingUp size={16} />}
                  {analysisResult.signal === 'sell' && <TrendingDown size={16} />}
                </span>
              </div>

              {analysisResult.confidence !== undefined && (
                <div className="market-analysis-confidence" title="Heuristic decision score from rules; not a calibrated probability.">
                  <span className="market-analysis-confidence-label">Decision score:</span>
                  <span className="market-analysis-confidence-value">
                    {formatPercentage(analysisResult.confidence, 2, true)}
                  </span>
                </div>
              )}

              {analysisResult.reasoning && (
                <div className="market-analysis-reasoning">
                  <span className="market-analysis-reasoning-label">Reasoning:</span>
                  <p className="market-analysis-reasoning-text">{analysisResult.reasoning}</p>
                </div>
              )}

              {analysisResult.entryPrice !== undefined && (
                <div className="market-analysis-entry-price">
                  <span className="market-analysis-entry-price-label">Entry Price:</span>
                  <span className="market-analysis-entry-price-value">
                    {formatCurrency(analysisResult.entryPrice)}
                  </span>
                </div>
              )}

              {analysisResult.stopLoss !== undefined && (
                <div className="market-analysis-stop-loss">
                  <span className="market-analysis-stop-loss-label">Stop Loss:</span>
                  <span className="market-analysis-stop-loss-value">
                    {formatCurrency(analysisResult.stopLoss)}
                  </span>
                </div>
              )}

              {analysisResult.takeProfit !== undefined && (
                <div className="market-analysis-take-profit">
                  <span className="market-analysis-take-profit-label">Take Profit:</span>
                  <span className="market-analysis-take-profit-value">
                    {formatCurrency(analysisResult.takeProfit)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketAnalysis;

