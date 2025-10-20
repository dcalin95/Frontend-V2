import React from 'react';
import './SmartRingFuture.css';

const SmartRingFuture = () => {
  return (
    <div className="smart-ring">
      <div className="ring-preview">
        <div className="ring-hologram">
          <div className="ring-circle"></div>
          <div className="ring-data">
            <div className="data-point pulse">❤️ 75 BPM</div>
            <div className="data-point stress">😌 Low Stress</div>
            <div className="data-point focus">🎯 High Focus</div>
          </div>
        </div>
      </div>
      
      <div className="ring-info">
        <h3>🔮 Smart Ring Integration</h3>
        <p className="coming-soon">Coming Q4 2024</p>
        
        <div className="feature-list">
          <div className="feature">
            <span className="feature-icon">💫</span>
            <h4>Real-time Biometrics</h4>
            <p>Track heart rate, stress levels, and focus in real-time</p>
          </div>
          
          <div className="feature">
            <span className="feature-icon">🧠</span>
            <h4>Neural Pattern Analysis</h4>
            <p>Advanced AI analysis of your biological patterns</p>
          </div>
          
          <div className="feature">
            <span className="feature-icon">🔄</span>
            <h4>Continuous Sync</h4>
            <p>Seamless integration with MindMirror analysis</p>
          </div>
        </div>

        <button className="waitlist-btn">
          Join Waitlist
        </button>
      </div>
    </div>
  );
};

export default SmartRingFuture;











