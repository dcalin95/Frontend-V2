import React, { useState, useEffect, useContext } from 'react';
import { Brain, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

// Import API
import {
  getAiStatus,
  setAiMode,
  getAiConfig,
  updateAiConfig,
  getAiSignals,
  getActivityLog,
  pauseAiForUser,
  resumeAiForUser
} from './api/neuralIntelligence';

// Import Components
import StatusCard from './components/StatusCard';
import StrategiesCard from './components/StrategiesCard';
import SignalsActivityCard from './components/SignalsActivityCard';

// Import Context
import WalletContext from '../context/WalletContext';

// Import Styles
import './styles/NeuralIntelligence.css';

/**
 * Neural Intelligence Page
 * Main page for AI trading and liquidity agent
 * 
 * This component manages the entire Neural Intelligence interface,
 * including AI status, strategy configuration, and signal monitoring.
 */
const NeuralIntelligencePage = () => {
  // Wallet Context
  const { walletAddress, isConnected } = useContext(WalletContext);

  // State Management
  const [aiStatus, setAiStatus] = useState(null);
  const [currentMode, setCurrentMode] = useState('Advisory');
  const [isPaused, setIsPaused] = useState(false);
  const [strategies, setStrategies] = useState([]);
  const [riskLimits, setRiskLimits] = useState({});
  const [signals, setSignals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchSignals();
      fetchActivityLog();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  /**
   * Fetch all data from API
   */
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statusData, configData, signalsData, activityData] = await Promise.all([
        getAiStatus(),
        getAiConfig(),
        getAiSignals(20),
        getActivityLog(50)
      ]);

      setAiStatus(statusData);
      setCurrentMode(statusData.mode);
      setStrategies(configData.strategies);
      setRiskLimits(configData.riskLimits);
      setSignals(signalsData);
      setActivities(activityData);
    } catch (error) {
      console.error('[Neural Intelligence] Error fetching data:', error);
      toast.error('Failed to load Neural Intelligence data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch signals only
   */
  const fetchSignals = async () => {
    try {
      const signalsData = await getAiSignals(20);
      setSignals(signalsData);
    } catch (error) {
      console.error('[Neural Intelligence] Error fetching signals:', error);
    }
  };

  /**
   * Fetch activity log only
   */
  const fetchActivityLog = async () => {
    try {
      const activityData = await getActivityLog(50);
      setActivities(activityData);
    } catch (error) {
      console.error('[Neural Intelligence] Error fetching activity log:', error);
    }
  };

  /**
   * Handle mode change
   * @param {string} newMode - New operating mode
   */
  const handleModeChange = async (newMode) => {
    if (!isConnected) {
      toast.warning('Please connect your wallet first');
      return;
    }

    try {
      const result = await setAiMode(newMode);
      if (result.success) {
        setCurrentMode(newMode);
        toast.success(`AI mode changed to ${newMode}`);
        
        // Refresh status
        const statusData = await getAiStatus();
        setAiStatus(statusData);
      }
    } catch (error) {
      console.error('[Neural Intelligence] Error changing mode:', error);
      toast.error('Failed to change AI mode');
    }
  };

  /**
   * Handle strategy toggle
   * @param {string} strategyId - Strategy ID to toggle
   */
  const handleStrategyToggle = async (strategyId) => {
    if (!isConnected) {
      toast.warning('Please connect your wallet first');
      return;
    }

    try {
      const updatedStrategies = strategies.map(s =>
        s.id === strategyId ? { ...s, enabled: !s.enabled } : s
      );

      const result = await updateAiConfig({ strategies: updatedStrategies });
      
      if (result.success) {
        setStrategies(updatedStrategies);
        const strategy = updatedStrategies.find(s => s.id === strategyId);
        toast.success(`${strategy.name} ${strategy.enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('[Neural Intelligence] Error toggling strategy:', error);
      toast.error('Failed to update strategy');
    }
  };

  /**
   * Handle risk level change for strategy
   * @param {string} strategyId - Strategy ID
   * @param {string} newRiskLevel - New risk level
   */
  const handleRiskLevelChange = async (strategyId, newRiskLevel) => {
    if (!isConnected) {
      toast.warning('Please connect your wallet first');
      return;
    }

    try {
      const updatedStrategies = strategies.map(s =>
        s.id === strategyId ? { ...s, riskLevel: newRiskLevel } : s
      );

      const result = await updateAiConfig({ strategies: updatedStrategies });
      
      if (result.success) {
        setStrategies(updatedStrategies);
        toast.success(`Risk level updated to ${newRiskLevel}`);
      }
    } catch (error) {
      console.error('[Neural Intelligence] Error updating risk level:', error);
      toast.error('Failed to update risk level');
    }
  };

  /**
   * Handle pause/resume toggle
   */
  const handlePauseToggle = async () => {
    if (!isConnected) {
      toast.warning('Please connect your wallet first');
      return;
    }

    try {
      const result = isPaused ? await resumeAiForUser() : await pauseAiForUser();
      
      if (result.success) {
        setIsPaused(!isPaused);
        toast.success(result.message);
        
        // Refresh activity log
        await fetchActivityLog();
      }
    } catch (error) {
      console.error('[Neural Intelligence] Error toggling pause:', error);
      toast.error('Failed to pause/resume AI');
    }
  };

  return (
    <div className="neural-intelligence-page">
      {/* Page Header */}
      <div className="neural-page-header">
        <div className="header-content">
          <div className="header-title-row">
            <Brain size={32} style={{ color: '#00FFA3' }} />
            <h1>Neural Intelligence</h1>
            <span className="beta-badge">BETA</span>
          </div>
          <p className="header-subtitle">
            AI-powered trading and liquidity agent for BitSwapDEX_AI
          </p>
        </div>

        {/* Connected Wallet Badge */}
        {isConnected && walletAddress && (
          <div className="wallet-badge">
            <span className="wallet-icon">👤</span>
            <span className="wallet-address">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          </div>
        )}
      </div>

      {/* Disclaimer Warning */}
      <div className="disclaimer-banner">
        <AlertTriangle size={20} style={{ color: '#FFC107' }} />
        <div className="disclaimer-content">
          <strong>Risk Disclaimer:</strong> Neural Intelligence does not guarantee profits. 
          Trading digital assets involves significant risk. Only invest what you can afford to lose.
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="neural-content-grid">
        {/* Left Column: Status & Mode */}
        <div className="neural-col neural-col-left">
          <StatusCard
            status={aiStatus}
            currentMode={currentMode}
            onModeChange={handleModeChange}
            isPaused={isPaused}
            onPauseToggle={handlePauseToggle}
            walletConnected={isConnected}
          />
        </div>

        {/* Middle Column: Strategies & Risk */}
        <div className="neural-col neural-col-middle">
          <StrategiesCard
            strategies={strategies}
            riskLimits={riskLimits}
            onStrategyToggle={handleStrategyToggle}
            onRiskLevelChange={handleRiskLevelChange}
            disabled={!isConnected || isPaused}
          />
        </div>

        {/* Right Column: Signals & Activity */}
        <div className="neural-col neural-col-right">
          <SignalsActivityCard
            signals={signals}
            activities={activities}
            loading={loading && signals.length === 0}
          />
        </div>
      </div>
    </div>
  );
};

export default NeuralIntelligencePage;

