/**
 * 🤖 OTA Trade Page - AI Trading Interface (Binance-style Layout)
 * 
 * Dedicated trading page for OTA AI with Binance-style layout:
 * - TradingView Chart (left, 60-70%)
 * - AI Signals + Execution Panel (right, 30-40%)
 * - Quick execution from AI recommendations
 * - Mode-aware: Advisory/Assisted/Auto
 * 
 * @module OTATradePage
 */

import React, { lazy, Suspense, memo, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Zap, Hand, Lightbulb } from 'lucide-react';
import TradingViewChart from '../components/common/TradingViewChart';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Skeleton from '../components/common/Skeleton';
import OTALogo from '../components/ai-trading/OTALogo';
import MarketAnalysis from '../components/ai-trading/MarketAnalysis';
import HeaderTokenSelector from '../components/common/HeaderTokenSelector';
import { useHeaderToken } from '../context/HeaderTokenContext';
import '../styles/components/header-token-selector.css';
import { useOTAMode } from '../hooks/useOTAMode';
import { useOTAAccess } from '../hooks/useOTAAccess';
import { useDexAuth } from '../context/DexAuthContext';
import { analyzeMarketWithLlmProvider } from '../services/otaAnalyzeFacade';
import { loadOutcomesForAnalyze, buildAnalyzeOptions } from '../utils/otaOutcomesHelper';
import { useDEXSettings } from '../../hooks/DEX/useDEXSettings';
import { toast } from 'react-toastify';
import OtaBscAutoStatusBanner from '../components/ai-trading/OtaBscAutoStatusBanner';
import '../styles/pages.css';
import '../styles/components/ota-trade-page.css';

// Lazy load mode-specific panels
const AutoTradePanel = lazy(() => 
  import('../components/ai-trading/AutoTradePanel').catch(err => {
    console.error('Failed to load AutoTradePanel:', err);
    return { default: () => <div>Error loading AutoTradePanel</div> };
  })
);

const OTATradePage = memo(() => {
  const navigate = useNavigate();
  const { walletAddress, user } = useDexAuth();
  const { settings } = useDEXSettings();
  const { currentMode } = useOTAMode();
  const { hasFullAccess, isPreviewMode } = useOTAAccess();
  
  const [selectedToken, setSelectedToken] = useHeaderToken();
  const [selectedPair, setSelectedPair] = useState('BINANCE:BNBUSDT');
  const [chartTimeframe, setChartTimeframe] = useState(settings.defaultChartTimeframe || 'D');
  const [lastAnalysisResult, setLastAnalysisResult] = useState(null);
  
  // Real auth only. userId optional for /analyze (public). Never use fake or unverified id.
  const userId = useMemo(
    () => walletAddress || user?.walletAddress || user?.id || null,
    [walletAddress, user]
  );
  
  const chartSymbol = useMemo(() => 
    `BINANCE:${selectedToken}USDT`,
    [selectedToken]
  );

  useEffect(() => {
    setChartTimeframe(settings.defaultChartTimeframe || 'D');
  }, [settings.defaultChartTimeframe]);
  
  const modeIcons = {
    advisory: Lightbulb,
    assisted: Hand,
    auto: Zap
  };
  
  const ModeIcon = modeIcons[currentMode] || Lightbulb;
  
  // Handle AI signal execution
  const handleExecuteSwap = (tokenIn, tokenOut, amountIn) => {
    console.log('[OTATradePage] Execute swap requested:', { tokenIn, tokenOut, amountIn });
    
    // In Assisted mode, navigate to swap page with prefilled params
    if (currentMode === 'assisted') {
      const params = new URLSearchParams({
        from: tokenIn,
        to: tokenOut
      });
      if (amountIn) {
        params.set('amount', amountIn);
      }
      window.location.href = `/dex-edu/swap?${params.toString()}`;
    } else {
      // Navigate to swap page
      const params = new URLSearchParams({
        from: tokenIn,
        to: tokenOut
      });
      if (amountIn) {
        params.set('amount', amountIn);
      }
      window.location.href = `/dex-edu/swap?${params.toString()}`;
    }
  };
  
  // Handle market analysis (send recentOutcomes when userId exists for LLM in-context learning)
  const handleAnalyzeMarket = async (token) => {
    try {
      if (!token) throw new Error('Token is required');
      const recentOutcomes = userId ? await loadOutcomesForAnalyze(userId).catch(() => []) : [];
      const options = buildAnalyzeOptions(userId, { quoteToken: 'USDT', recentOutcomes });
      return await analyzeMarketWithLlmProvider(token, options);
    } catch (err) {
      const msg = err?.message || 'Market analysis failed';
      toast.error(msg);
      throw err;
    }
  };
  
  return (
    <div className="ota-trade-page">
      {/* Header */}
      <div className="ota-trade-page-header">
        <div className="ota-trade-page-header-left ota-title-row">
          <button
            className="ota-trade-page-back-btn"
            onClick={() => navigate('/dex-edu/ota')}
            title="Back to OTA Settings"
          >
            <ArrowLeft size={20} />
          </button>
          <OTALogo size="md" className="ota-trade-page-logo" />
          <h1 className="ota-trade-page-title">OTA AI Trading</h1>
          <div className="ota-trade-page-mode-badge">
            <ModeIcon size={16} />
            <span style={{ textTransform: 'capitalize' }}>{currentMode}</span>
          </div>
        </div>
        
        <div className="ota-trade-page-header-right">
          <div className="ota-trade-page-token-selector">
            <HeaderTokenSelector
              selectedToken={selectedToken}
              onTokenChange={(token) => {
                setSelectedToken(token);
                setSelectedPair(`BINANCE:${token}USDT`);
              }}
              ariaLabel="Select token for chart and analysis"
            />
          </div>
          
          <div className="ota-trade-page-timeframe-selector">
            <select
              value={chartTimeframe}
              onChange={(e) => setChartTimeframe(e.target.value)}
              className="ota-trade-page-timeframe-select"
            >
              <option value="1">1m</option>
              <option value="5">5m</option>
              <option value="15">15m</option>
              <option value="30">30m</option>
              <option value="60">1h</option>
              <option value="240">4h</option>
              <option value="D">1D</option>
              <option value="W">1W</option>
            </select>
          </div>
          
          <button
            className="ota-trade-page-settings-btn"
            onClick={() => navigate('/dex-edu/ota')}
            title="OTA Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px', boxSizing: 'border-box' }}>
        <OtaBscAutoStatusBanner />
      </div>
      
      {/* Main Content - Binance-style Layout */}
      <div className="ota-trade-page-content">
        {/* Chart Zone - Left Side (60-70%) */}
        <div className="ota-trade-page-chart-zone">
          <div className="ota-trade-page-chart-container chart-wrapper-single-frame">
            <ErrorBoundary>
              <Suspense fallback={<Skeleton variant="rectangle" height={600} />}>
                <TradingViewChart
                  symbol={selectedPair}
                  interval={chartTimeframe}
                  theme={settings.theme || 'dark'}
                  height={600}
                  autosize={true}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
        
        {/* Execution Panel Zone - Right Side (30-40%) */}
        <div className="ota-trade-page-execution-zone">
          {/* AI Signals / Market Analysis */}
          <div className="ota-trade-page-ai-signals">
            <ErrorBoundary>
              <MarketAnalysis
                userId={userId}
                selectedToken={selectedToken}
                onTokenChange={setSelectedToken}
                onAnalyze={handleAnalyzeMarket}
                onExecuteSwap={handleExecuteSwap}
                onResultChange={setLastAnalysisResult}
                loading={false}
              />
            </ErrorBoundary>
          </div>
          
          {/* Mode-specific Execution Panel */}
          {currentMode === 'assisted' && (
            <div className="ota-trade-page-execution-panel">
              <ErrorBoundary>
                <div className="ota-trade-page-advisory-card">
                  <Hand size={24} />
                  <h3>Assisted Mode</h3>
                  <p>
                    Assisted execution runs through the standard Swap/Trade page.
                  </p>
                  <button
                    className="ota-trade-page-nav-btn"
                    onClick={() => {
                      const params = new URLSearchParams({ from: selectedToken, to: 'USDT' });
                      window.location.href = `/dex-edu/swap?${params.toString()}`;
                    }}
                  >
                    Go to Swap Page
                  </button>
                </div>
              </ErrorBoundary>
            </div>
          )}
          
          {currentMode === 'auto' && (
            <div className="ota-trade-page-execution-panel">
              <ErrorBoundary>
                <Suspense fallback={<Skeleton variant="card" height={400} />}>
                  <AutoTradePanel />
                </Suspense>
              </ErrorBoundary>
            </div>
          )}
          
          {currentMode === 'advisory' && (
            <div className="ota-trade-page-advisory-info">
              <div className="ota-trade-page-advisory-card">
                <Lightbulb size={24} />
                <h3>Signals only</h3>
                <p>AI provides recommendations. Use &quot;Execute Recommended Swap&quot; above for a quick swap, or open Trade with the current signal pre-filled (token, side, entry, amount).</p>
                <button
                  className="ota-trade-page-nav-btn"
                  onClick={() => {
                    const signalType = lastAnalysisResult && (typeof lastAnalysisResult.signal === 'string' ? lastAnalysisResult.signal : lastAnalysisResult.signal?.signal);
                    const entryPrice = lastAnalysisResult && (lastAnalysisResult.entryPrice ?? lastAnalysisResult.signal?.entryPrice);
                    const amount = lastAnalysisResult && (lastAnalysisResult.amountIn ?? lastAnalysisResult.signal?.amountIn ?? lastAnalysisResult.amount ?? lastAnalysisResult.signal?.amount);
                    const fromSignal = (lastAnalysisResult && selectedToken) ? {
                      token: selectedToken,
                      signal: signalType === 'sell' ? 'sell' : 'buy',
                      entryPrice: entryPrice != null ? Number(entryPrice) : undefined,
                      amount: amount != null ? Number(amount) : undefined
                    } : null;
                    navigate('/dex-edu/trade', fromSignal ? { state: { fromSignal } } : undefined);
                  }}
                >
                  Go to Trade Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

OTATradePage.displayName = 'OTATradePage';

export default OTATradePage;
