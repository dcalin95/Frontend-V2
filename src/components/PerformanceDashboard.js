import React, { useState, useEffect } from 'react';
import performanceService from '../services/performanceService';
import './PerformanceDashboard.css';

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [performanceScore, setPerformanceScore] = useState(0);

  useEffect(() => {
    // Initialize performance service
    performanceService.init();

    // Subscribe to performance updates
    const unsubscribe = performanceService.subscribe((metric) => {
      setMetrics(prev => ({ ...prev, [metric.type]: metric.value }));
      
      // Update recommendations
      const newRecommendations = performanceService.getOptimizationRecommendations();
      setRecommendations(newRecommendations);
      
      // Update performance score
      const score = performanceService.getPerformanceScore();
      setPerformanceScore(score);
    });

    // Initial metrics
    setMetrics(performanceService.getMetrics());
    setRecommendations(performanceService.getOptimizationRecommendations());
    setPerformanceScore(performanceService.getPerformanceScore());

    return unsubscribe;
  }, []);

  const getScoreColor = (score) => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#eab308';
    return '#ef4444';
  };

  const formatMetric = (value, type) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (type) {
      case 'fcp':
      case 'lcp':
      case 'fid':
      case 'ttfb':
        return `${Math.round(value)}ms`;
      case 'cls':
        return value.toFixed(3);
      case 'memory':
        return `${Math.round(value.used / 1024 / 1024)}MB / ${Math.round(value.limit / 1024 / 1024)}MB`;
      default:
        return value.toString();
    }
  };

  const getMetricStatus = (value, type) => {
    if (value === null || value === undefined) return 'neutral';
    
    switch (type) {
      case 'fcp':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      case 'lcp':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'fid':
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
      case 'cls':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      default:
        return 'neutral';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good':
        return '✅';
      case 'needs-improvement':
        return '⚠️';
      case 'poor':
        return '❌';
      default:
        return '⏳';
    }
  };

  if (!isVisible) {
    return (
      <button
        className="performance-toggle"
        onClick={() => setIsVisible(true)}
        title="Performance Dashboard"
      >
        🚀
      </button>
    );
  }

  return (
    <div className="performance-dashboard">
      <div className="performance-header">
        <h3>🚀 Performance Dashboard</h3>
        <button
          className="performance-close"
          onClick={() => setIsVisible(false)}
        >
          ✕
        </button>
      </div>

      <div className="performance-content">
        {/* Performance Score */}
        <div className="performance-score">
          <div className="score-circle" style={{ borderColor: getScoreColor(performanceScore) }}>
            <span className="score-value">{performanceScore}</span>
            <span className="score-label">Score</span>
          </div>
        </div>

        {/* Core Web Vitals */}
        <div className="metrics-section">
          <h4>📊 Core Web Vitals</h4>
          <div className="metrics-grid">
            {['fcp', 'lcp', 'fid', 'cls'].map(metric => {
              const value = metrics[metric];
              const status = getMetricStatus(value, metric);
              const icon = getStatusIcon(status);
              
              return (
                <div key={metric} className={`metric-card ${status}`}>
                  <div className="metric-header">
                    <span className="metric-icon">{icon}</span>
                    <span className="metric-name">{metric.toUpperCase()}</span>
                  </div>
                  <div className="metric-value">
                    {formatMetric(value, metric)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="metrics-section">
          <h4>📈 Additional Metrics</h4>
          <div className="metrics-grid">
            {['ttfb', 'memory'].map(metric => {
              const value = metrics[metric];
              return (
                <div key={metric} className="metric-card neutral">
                  <div className="metric-header">
                    <span className="metric-name">{metric.toUpperCase()}</span>
                  </div>
                  <div className="metric-value">
                    {formatMetric(value, metric)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optimization Recommendations */}
        {recommendations.length > 0 && (
          <div className="recommendations-section">
            <h4>💡 Optimization Recommendations</h4>
            <div className="recommendations-list">
              {recommendations.map((rec, index) => (
                <div key={index} className={`recommendation ${rec.type}`}>
                  <div className="recommendation-header">
                    <span className="recommendation-metric">{rec.metric}</span>
                    <span className="recommendation-type">{rec.type}</span>
                  </div>
                  <p className="recommendation-message">{rec.message}</p>
                  <ul className="recommendation-suggestions">
                    {rec.suggestions.map((suggestion, idx) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Actions */}
        <div className="performance-actions">
          <button
            className="action-btn"
            onClick={() => {
              performanceService.startMeasure('user-action');
              // Trigger some performance measurement
              setTimeout(() => {
                performanceService.endMeasure('user-action');
              }, 100);
            }}
          >
            📊 Measure Action
          </button>
          <button
            className="action-btn"
            onClick={() => {
              const metrics = performanceService.getMetrics();
              console.log('Current Performance Metrics:', metrics);
            }}
          >
            📋 Log Metrics
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard; 