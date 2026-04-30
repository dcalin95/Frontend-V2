/**
 * 🎓 OTA Tutorial Component - Interactive Step-by-Step Guide
 * 
 * Component pentru tutorial interactiv OTA:
 * - Step-by-step guide
 * - Highlight elements
 * - Progress tracking
 * - Skip/Next/Previous navigation
 * 
 * @module OTATutorial
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { useOTAAccess } from '../../hooks/useOTAAccess';
import '../../styles/components/ota-tutorial.css';

const OTATutorial = ({ 
  onComplete, 
  onSkip,
  startStep = 0,
  className = '' 
}) => {
  const { isPreviewMode, hasFullAccess } = useOTAAccess();
  const [currentStep, setCurrentStep] = useState(startStep);
  const [isVisible, setIsVisible] = useState(true);
  const overlayRef = useRef(null);
  const highlightRef = useRef(null);

  // Tutorial steps
  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to OTA AI Trading',
      description: 'OTA (On-Token-Agent) is an AI-powered trading assistant that helps you make informed trading decisions using OpenAI GPT-4 Turbo.',
      target: null,
      position: 'center',
      content: (
        <div className="ota-tutorial-content">
          <div className="ota-tutorial-icon-large">
            <Sparkles size={48} />
          </div>
          <h3>What is OTA?</h3>
          <p>OTA computes a trading signal and entry/stop/take levels from real market data (deterministic engine), then OpenAI adds a short explanation and lists assumptions and limitations. The system does not guarantee outcomes or use privileged information.</p>
          <ul>
            <li>✅ Signal and levels computed from real data</li>
            <li>✅ Automated strategy selection</li>
            <li>✅ Risk management</li>
            <li>✅ On-chain registration</li>
          </ul>
        </div>
      )
    },
    {
      id: 'market-analysis',
      title: 'Market Analysis',
      description: 'Use Market Analysis to get AI-powered trading signals for any token.',
      target: '.market-analysis',
      position: 'right',
      content: (
        <div className="ota-tutorial-content">
          <h3>How to Use Market Analysis:</h3>
          <ol>
            <li>Select a token from the dropdown (BTC, ETH, BNB, etc.)</li>
            <li>Click "Analyze Market"</li>
            <li>Review the computed signal (buy/sell/hold) and levels (entry, stop loss, take profit)</li>
            <li>Check "Data used" and "Limitations" for context</li>
            <li>Score is rule strength (0–100), not a probability</li>
          </ol>
          <p className="ota-tutorial-tip">
            💡 <strong>Tip:</strong> Signal and levels are computed from data; OpenAI only explains. Always use stop loss to manage risk.
          </p>
        </div>
      )
    },
    {
      id: 'bandit-selector',
      title: 'Bandit Selector',
      description: 'The Multi-Armed Bandit algorithm selects a trading strategy based on observed performance (no guarantee of best or optimal outcome).',
      target: '.bandit-selector-panel',
      position: 'left',
      content: (
        <div className="ota-tutorial-content">
          <h3>How Bandit Selector Works:</h3>
          <ol>
            <li>View strategy statistics (plays, wins, win rate, avg reward)</li>
            <li>Select market regime (bull, bear, sideways)</li>
            <li>Click "Select Best Strategy" - algorithm picks a strategy from observed performance</li>
            <li>Record rewards after trades to improve future selections</li>
          </ol>
          <p className="ota-tutorial-tip">
            💡 <strong>Tip:</strong> The algorithm balances exploration (trying new strategies) with exploitation (using proven winners).
          </p>
        </div>
      )
    },
    {
      id: 'registration',
      title: 'OTA Registration',
      description: 'Register on-chain to access full OTA features and personalization.',
      target: '.ota-access-control-register',
      position: 'top',
      content: (
        <div className="ota-tutorial-content">
          <h3>Registration Steps:</h3>
          <ol>
            <li>✅ Authenticate (Login/Register) - You're here!</li>
            <li>✅ Connect Wallet - Connect your MetaMask</li>
            <li>⏳ Register On-Chain - Click "Register for OTA" button</li>
            <li>⏳ Approve Transaction - Confirm in MetaMask</li>
            <li>⏳ Wait for Confirmation - ~15-30 seconds</li>
          </ol>
          <p className="ota-tutorial-tip">
            💡 <strong>Note:</strong> Registration is an on-chain transaction (not a database entry). You need BNB for gas fees.
          </p>
        </div>
      )
    },
    {
      id: 'preview-mode',
      title: 'Preview Mode',
      description: 'In preview mode you can explore OTA. Real analysis and data require registration.',
      target: '.ai-trading-dashboard-preview-badge',
      position: 'bottom',
      content: (
        <div className="ota-tutorial-content">
          <h3>What You Can Do in Preview Mode:</h3>
          <ul>
            <li>✅ View Market Analysis (real OTA AI after registration)</li>
            <li>✅ Explore Bandit Selector statistics</li>
            <li>✅ See AI Trading Dashboard</li>
            <li>✅ Understand OTA features</li>
            <li>❌ Execute real trades (requires registration)</li>
            <li>❌ Personalize settings (requires registration)</li>
          </ul>
          <p className="ota-tutorial-tip">
            💡 <strong>Tip:</strong> Preview mode helps you understand OTA before committing to on-chain registration.
          </p>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'You now understand the basics of OTA. Register to unlock full features!',
      target: null,
      position: 'center',
      content: (
        <div className="ota-tutorial-content">
          <div className="ota-tutorial-icon-large">
            <CheckCircle size={48} />
          </div>
          <h3>Ready to Start Trading with OTA?</h3>
          <p>You've learned about:</p>
          <ul>
            <li>✅ Market Analysis</li>
            <li>✅ Bandit Selector</li>
            <li>✅ Registration Process</li>
            <li>✅ Preview Mode</li>
          </ul>
          <p className="ota-tutorial-tip">
            🚀 <strong>Next Step:</strong> Register on-chain to access full OTA features and start making AI-powered trading decisions!
          </p>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Handle step navigation
  const handleComplete = useCallback(() => {
    setIsVisible(false);
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
    if (onSkip) {
      onSkip();
    }
  }, [onSkip]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length, handleComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Highlight target element
  useEffect(() => {
    if (!currentStepData?.target || !isVisible) {
      if (highlightRef.current) {
        highlightRef.current.style.display = 'none';
      }
      return;
    }

    const updateHighlight = () => {
      const targetElement = document.querySelector(currentStepData.target);
      if (targetElement && highlightRef.current) {
        const rect = targetElement.getBoundingClientRect();
        highlightRef.current.style.top = `${rect.top + window.scrollY}px`;
        highlightRef.current.style.left = `${rect.left + window.scrollX}px`;
        highlightRef.current.style.width = `${rect.width}px`;
        highlightRef.current.style.height = `${rect.height}px`;
        highlightRef.current.style.display = 'block';
      } else if (highlightRef.current) {
        highlightRef.current.style.display = 'none';
      }
    };

    // Initial update
    updateHighlight();

    // Update on scroll/resize
    window.addEventListener('scroll', updateHighlight);
    window.addEventListener('resize', updateHighlight);

    return () => {
      window.removeEventListener('scroll', updateHighlight);
      window.removeEventListener('resize', updateHighlight);
    };
  }, [currentStepData?.target, isVisible]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isVisible) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, handleNext, handlePrevious, handleSkip]);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="ota-tutorial-overlay"
        onClick={handleSkip}
      />

      {/* Highlight */}
      {currentStepData?.target && (
        <div 
          ref={highlightRef}
          className="ota-tutorial-highlight"
        />
      )}

      {/* Tutorial Card */}
      <div 
        className={`ota-tutorial-card ota-tutorial-${currentStepData?.position || 'center'} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ota-tutorial-header">
          <div className="ota-tutorial-progress">
            <div className="ota-tutorial-progress-bar">
              <div 
                className="ota-tutorial-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="ota-tutorial-progress-text">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button
            className="ota-tutorial-close"
            onClick={handleSkip}
            aria-label="Close tutorial"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="ota-tutorial-body">
          <h2 className="ota-tutorial-title">{currentStepData?.title}</h2>
          {currentStepData?.description && (
            <p className="ota-tutorial-description">{currentStepData?.description}</p>
          )}
          {currentStepData?.content}
        </div>

        {/* Footer */}
        <div className="ota-tutorial-footer">
          <button
            className="ota-tutorial-btn ota-tutorial-btn-skip"
            onClick={handleSkip}
          >
            Skip Tutorial
          </button>
          <div className="ota-tutorial-nav">
            <button
              className="ota-tutorial-btn ota-tutorial-btn-secondary"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              className="ota-tutorial-btn ota-tutorial-btn-primary"
              onClick={handleNext}
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Complete
                  <CheckCircle size={16} />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OTATutorial;
