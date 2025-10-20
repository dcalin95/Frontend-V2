/**
 * 🎁 AI REWARDS HUB WRAPPER
 * 
 * Wrapper component pentru integrarea graduală a componentei enhanced
 * Permite comutarea între versiunea veche și cea nouă
 */

import React, { useState, useContext } from "react";
import WalletContext from "../../context/WalletContext";
import ReferralRewardBox from "./ReferralRewardBox";
import AIRewardsHubEnhanced from "./AIRewardsHubEnhanced";
import "./AIRewardsHubWrapper.css";

export default function AIRewardsHubWrapper() {
  const { walletAddress } = useContext(WalletContext);
  const [useEnhancedVersion, setUseEnhancedVersion] = useState(true);

  return (
    <div className="ai-rewards-hub-wrapper">
      {/* Version Toggle */}
      <div className="version-toggle">
        <div className="toggle-container">
          <span className="toggle-label">
            {useEnhancedVersion ? "🚀 Enhanced Version" : "📋 Classic Version"}
          </span>
          <button
            className={`toggle-button ${useEnhancedVersion ? 'enhanced' : 'classic'}`}
            onClick={() => setUseEnhancedVersion(!useEnhancedVersion)}
            title={`Switch to ${useEnhancedVersion ? 'Classic' : 'Enhanced'} Version`}
          >
            <div className="toggle-slider">
              <span className="toggle-icon">
                {useEnhancedVersion ? "🎨" : "📊"}
              </span>
            </div>
          </button>
          <span className="toggle-description">
            {useEnhancedVersion 
              ? "Modern UI with analytics & real-time updates" 
              : "Original interface with full functionality"
            }
          </span>
        </div>
      </div>

      {/* Component Render */}
      <div className="component-container">
        {useEnhancedVersion ? (
          <AIRewardsHubEnhanced walletAddress={walletAddress} />
        ) : (
          <ReferralRewardBox walletAddress={walletAddress} />
        )}
      </div>

      {/* Feature Comparison */}
      {!walletAddress && (
        <div className="feature-comparison">
          <h3>🎯 Choose Your Experience</h3>
          <div className="comparison-grid">
            <div className="version-card classic">
              <h4>📋 Classic Version</h4>
              <ul>
                <li>✅ All original functionality</li>
                <li>✅ Telegram investigation</li>
                <li>✅ Referral system</li>
                <li>✅ Node.sol integration</li>
                <li>✅ Proven stability</li>
              </ul>
            </div>
            <div className="version-card enhanced">
              <h4>🚀 Enhanced Version</h4>
              <ul>
                <li>✅ Modern responsive design</li>
                <li>✅ Interactive analytics charts</li>
                <li>✅ Real-time notifications</li>
                <li>✅ Mobile optimized</li>
                <li>✅ Performance optimized</li>
                <li>✅ Advanced data caching</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
