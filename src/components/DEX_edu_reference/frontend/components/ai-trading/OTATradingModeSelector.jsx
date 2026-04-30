/**
 * 🎯 OTA Trading Mode Selector Component
 * 
 * Component pentru selectarea trading mode-ului OTA:
 * - Advisory, Assisted, Auto
 * - Afișează descrieri și gating messages bazat pe access level
 * 
 * @module OTATradingModeSelector
 */

import React from 'react';
import { Lightbulb, Zap, Sparkles, Lock, AlertCircle } from 'lucide-react';
import { useOTAMode } from '../../hooks/useOTAMode';
import { useOTAAccess } from '../../hooks/useOTAAccess';
import {
  TRADING_MODES,
  TRADING_MODE_NAMES,
  TRADING_MODE_DESCRIPTIONS,
  TRADING_MODES_VISIBLE,
  isTradingModeAvailable
} from '../../utils/otaTradingModes';
import '../../styles/components/ota-trading-mode-selector.css';

const OTATradingModeSelector = () => {
  const { currentMode, setMode, availableModes, botAuthorized } = useOTAMode();
  const { accessLevel, getRegistrationCTA } = useOTAAccess();
  
  const modeIcons = {
    [TRADING_MODES.ADVISORY]: Sparkles,
    [TRADING_MODES.AUTO]: Zap
  };
  
  const handleModeClick = (mode) => {
    if (isTradingModeAvailable(mode, accessLevel, botAuthorized)) {
      setMode(mode);
    }
  };
  
  const getModeGatingMessage = (mode) => {
    if (isTradingModeAvailable(mode, accessLevel, botAuthorized)) {
      return null;
    }
    
    if (mode === TRADING_MODES.ASSISTED) {
      if (accessLevel === 'guest') {
        return 'Login required';
      }
      if (accessLevel === 'preview') {
        return 'Full access required';
      }
    }
    
    if (mode === TRADING_MODES.AUTO) {
      if (accessLevel !== 'full') {
        return 'Full access required';
      }
      if (!botAuthorized) {
        return 'Bot authorization required';
      }
    }
    
    return 'Not available';
  };
  
  return (
    <div className="ota-trading-mode-selector">
      <div className="ota-trading-mode-selector-header">
        <p className="ota-trading-mode-selector-subtitle">
          Trading Mode: Choose how OTA executes trades for you
        </p>
      </div>
      
      <div className="ota-trading-mode-selector-tabs">
        {TRADING_MODES_VISIBLE.map((mode) => {
          const Icon = modeIcons[mode];
          const isAvailable = isTradingModeAvailable(mode, accessLevel, botAuthorized);
          const isActive = currentMode === mode;
          const gatingMessage = getModeGatingMessage(mode);
          
          return (
            <button
              key={mode}
              className={`ota-trading-mode-tab ${isActive ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
              onClick={() => handleModeClick(mode)}
              disabled={!isAvailable}
              title={gatingMessage || TRADING_MODE_DESCRIPTIONS[mode]}
            >
              <div className="ota-trading-mode-tab-content">
                <Icon size={18} className="ota-trading-mode-tab-icon" />
                <div className="ota-trading-mode-tab-text">
                  <span className="ota-trading-mode-tab-name">
                    {TRADING_MODE_NAMES[mode]}
                  </span>
                  <span className="ota-trading-mode-tab-description">
                    {TRADING_MODE_DESCRIPTIONS[mode]}
                  </span>
                </div>
                {!isAvailable && (
                  <Lock size={16} className="ota-trading-mode-tab-lock" />
                )}
              </div>
              {gatingMessage && !isAvailable && (
                <div className="ota-trading-mode-tab-gating">
                  <AlertCircle size={12} />
                  <span>{gatingMessage}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

OTATradingModeSelector.displayName = 'OTATradingModeSelector';

export default OTATradingModeSelector;
