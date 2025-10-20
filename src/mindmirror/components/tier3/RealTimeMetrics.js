import React, { useState, useEffect } from 'react';
import './RealTimeMetrics.css';

const emotions = ['Joy', 'Neutral', 'Focus', 'Engagement'];
const colors = {
  Joy: '#FFD700',
  Neutral: '#00ff9d',
  Focus: '#00a3ff',
  Engagement: '#ff3366'
};

const RealTimeMetrics = ({ isActive }) => {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const newMetrics = {};
      emotions.forEach(emotion => {
        // Simulare fluctuații naturale
        const baseValue = metrics[emotion]?.value || Math.random() * 100;
        const fluctuation = Math.random() * 10 - 5; // ±5%
        newMetrics[emotion] = {
          value: Math.max(0, Math.min(100, baseValue + fluctuation)),
          trend: fluctuation > 0 ? 'up' : 'down'
        };
      });
      setMetrics(newMetrics);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="realtime-metrics">
      <h4>Real-time Analysis</h4>
      <div className="metrics-grid">
        {emotions.map(emotion => (
          <div key={emotion} className="metric-card">
            <div className="metric-header">
              <span>{emotion}</span>
              <span className={`trend-indicator ${metrics[emotion]?.trend}`}>
                {metrics[emotion]?.trend === 'up' ? '↑' : '↓'}
              </span>
            </div>
            <div className="metric-bar-container">
              <div 
                className="metric-bar"
                style={{
                  width: `${metrics[emotion]?.value || 0}%`,
                  backgroundColor: colors[emotion]
                }}
              />
            </div>
            <div className="metric-value">
              {Math.round(metrics[emotion]?.value || 0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealTimeMetrics;











