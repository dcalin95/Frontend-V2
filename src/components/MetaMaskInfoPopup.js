import React, { useState, useEffect } from 'react';
import './MetaMaskInfoPopup.css';

const MetaMaskInfoPopup = ({ isOpen, onClose, onContinue }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
             window.innerWidth <= 768 ||
             ('ontouchstart' in window) ||
             (navigator.maxTouchPoints > 0);
    };
    
    setIsMobile(checkMobile());
  }, []);

  if (!isOpen) return null;

  return (
    <div className="metamask-popup-overlay" onClick={onClose}>
      <div className="metamask-popup" onClick={(e) => e.stopPropagation()}>
        <div className="metamask-popup-header">
          <h2>🦊 MetaMask Connection Guide</h2>
          <button className="metamask-popup-close" onClick={onClose}>✕</button>
        </div>

        <div className="metamask-popup-content">
          {isMobile ? (
            <>
              <div className="metamask-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Install MetaMask Mobile App</h3>
                  <p>Download MetaMask from your device's app store</p>
                  <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="metamask-download-link">
                    📱 Download MetaMask Mobile
                  </a>
                </div>
              </div>

              <div className="metamask-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Open MetaMask Browser</h3>
                  <p>MetaMask has its own built-in browser. Open the MetaMask app and use its browser feature</p>
                </div>
              </div>

              <div className="metamask-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Navigate to bits-ai.io</h3>
                  <p>In MetaMask's browser, go to <strong>bits-ai.io</strong></p>
                </div>
              </div>

              <div className="metamask-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Connect Your Wallet</h3>
                  <p>Tap "Connect Wallet" and select MetaMask</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="metamask-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Install MetaMask Extension</h3>
                  <p>Add MetaMask to your browser as an extension</p>
                  <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="metamask-download-link">
                    🦊 Install MetaMask Extension
                  </a>
                </div>
              </div>

              <div className="metamask-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Create or Import Wallet</h3>
                  <p>Set up your MetaMask wallet with a secure password</p>
                </div>
              </div>

              <div className="metamask-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Connect to bits-ai.io</h3>
                  <p>Click "Connect Wallet" and select MetaMask</p>
                </div>
              </div>
            </>
          )}

          <div className="metamask-note">
            <h4>💡 Important Notes:</h4>
            <ul>
              <li>MetaMask Mobile has its own browser - you cannot connect from Chrome/Safari</li>
              <li>Make sure you're on the official <strong>bits-ai.io</strong> website</li>
              <li>Never share your private keys or seed phrase</li>
            </ul>
          </div>
        </div>

        <div className="metamask-popup-footer">
          <button className="metamask-popup-button secondary" onClick={onClose}>Cancel</button>
          <button className="metamask-popup-button primary" onClick={onContinue}>I Understand, Continue</button>
        </div>
      </div>
    </div>
  );
};

export default MetaMaskInfoPopup; 