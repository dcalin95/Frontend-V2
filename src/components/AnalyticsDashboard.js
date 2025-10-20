import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { getActiveExperiments } from '../hooks/useABTesting';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const { getUserProperties, track } = useAnalytics();
  const [isVisible, setIsVisible] = useState(false);
  const [userProperties, setUserProperties] = useState({});
  const [activeExperiments, setActiveExperiments] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [sessionData, setSessionData] = useState({});

  useEffect(() => {
    // Get user properties
    setUserProperties(getUserProperties());

    // Get active experiments
    setActiveExperiments(getActiveExperiments());

    // Get session data
    const sessionId = sessionStorage.getItem('sessionId');
    const sessionStart = sessionStorage.getItem('sessionStart');
    setSessionData({
      sessionId,
      sessionStart: sessionStart ? new Date(parseInt(sessionStart)) : new Date(),
      duration: sessionStart ? Date.now() - parseInt(sessionStart) : 0,
    });

    // Track dashboard view
    track('analytics_dashboard_view', {
      timestamp: Date.now(),
    });
  }, [getUserProperties, track]);

  // Monitor performance metrics
  useEffect(() => {
    const updatePerformanceMetrics = () => {
      if ('performance' in window) {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          setPerformanceMetrics({
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          });
        }
      }
    };

    updatePerformanceMetrics();
    window.addEventListener('load', updatePerformanceMetrics);
    return () => window.removeEventListener('load', updatePerformanceMetrics);
  }, []);

  const toggleDashboard = () => {
    setIsVisible(!isVisible);
    track('analytics_dashboard_toggle', {
      action: !isVisible ? 'open' : 'close',
    });
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isVisible) {
    return null; // Nu afișa butonul floating, doar din hamburger
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h3>📊 Analytics Dashboard</h3>
        <button className="close-btn" onClick={toggleDashboard}>
          ✕
        </button>
      </div>

      <div className="dashboard-content">
        {/* User Properties */}
        <div className="dashboard-section">
          <h4>👤 User Properties</h4>
          <div className="properties-grid">
            <div className="property-item">
              <span className="property-label">Device:</span>
              <span className="property-value">{userProperties.device_type || 'Unknown'}</span>
            </div>
            <div className="property-item">
              <span className="property-label">Browser:</span>
              <span className="property-value">{userProperties.browser || 'Unknown'}</span>
            </div>
            <div className="property-item">
              <span className="property-label">OS:</span>
              <span className="property-value">{userProperties.operating_system || 'Unknown'}</span>
            </div>
            <div className="property-item">
              <span className="property-label">Screen:</span>
              <span className="property-value">{userProperties.screen_resolution || 'Unknown'}</span>
            </div>
            <div className="property-item">
              <span className="property-label">Connection:</span>
              <span className="property-value">{userProperties.connection_type || 'Unknown'}</span>
            </div>
            <div className="property-item">
              <span className="property-label">Language:</span>
              <span className="property-value">{userProperties.language || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Session Data */}
        <div className="dashboard-section">
          <h4>🕒 Session Data</h4>
          <div className="properties-grid">
            <div className="property-item">
              <span className="property-label">Session ID:</span>
              <span className="property-value">{sessionData.sessionId?.slice(-8) || 'N/A'}</span>
            </div>
            <div className="property-item">
              <span className="property-label">Start Time:</span>
              <span className="property-value">
                {sessionData.sessionStart?.toLocaleTimeString() || 'N/A'}
              </span>
            </div>
            <div className="property-item">
              <span className="property-label">Duration:</span>
              <span className="property-value">
                {formatDuration(sessionData.duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="dashboard-section">
          <h4>⚡ Performance Metrics</h4>
          <div className="properties-grid">
            <div className="property-item">
              <span className="property-label">DOM Load:</span>
              <span className="property-value">
                {performanceMetrics.domContentLoaded ? `${Math.round(performanceMetrics.domContentLoaded)}ms` : 'N/A'}
              </span>
            </div>
            <div className="property-item">
              <span className="property-label">Page Load:</span>
              <span className="property-value">
                {performanceMetrics.loadComplete ? `${Math.round(performanceMetrics.loadComplete)}ms` : 'N/A'}
              </span>
            </div>
            <div className="property-item">
              <span className="property-label">First Paint:</span>
              <span className="property-value">
                {performanceMetrics.firstPaint ? `${Math.round(performanceMetrics.firstPaint)}ms` : 'N/A'}
              </span>
            </div>
            <div className="property-item">
              <span className="property-label">FCP:</span>
              <span className="property-value">
                {performanceMetrics.firstContentfulPaint ? `${Math.round(performanceMetrics.firstContentfulPaint)}ms` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* A/B Testing Experiments */}
        <div className="dashboard-section">
          <h4>🧪 Active Experiments</h4>
          {activeExperiments.length > 0 ? (
            <div className="experiments-list">
              {activeExperiments.map((experiment) => (
                <div key={experiment.id} className="experiment-item">
                  <div className="experiment-header">
                    <span className="experiment-name">{experiment.id}</span>
                    <span className={`experiment-variant variant-${experiment.variant}`}>
                      {experiment.variant}
                    </span>
                  </div>
                  <div className="experiment-details">
                    <span className="experiment-variants">
                      Variants: {experiment.config?.variants?.join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-experiments">No active experiments</p>
          )}
        </div>

        {/* UTM Parameters */}
        <div className="dashboard-section">
          <h4>🔗 UTM Parameters</h4>
          <div className="properties-grid">
            <div className="property-item">
              <span className="property-label">Source:</span>
              <span className="property-value">{userProperties.utm_source || 'Direct'}</span>
            </div>
            <div className="property-item">
              <span className="property-label">Medium:</span>
              <span className="property-value">{userProperties.utm_medium || 'None'}</span>
            </div>
            <div className="property-item">
              <span className="property-label">Campaign:</span>
              <span className="property-value">{userProperties.utm_campaign || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h4>⚙️ Quick Actions</h4>
          <div className="actions-grid">
            <button
              className="action-btn"
              onClick={() => {
                track('manual_event', { event_type: 'test_event' });
                alert('Test event tracked!');
              }}
            >
              Track Test Event
            </button>
            <button
              className="action-btn"
              onClick={() => {
                const newSessionId = Date.now().toString();
                sessionStorage.setItem('sessionId', newSessionId);
                sessionStorage.setItem('sessionStart', newSessionId);
                window.location.reload();
              }}
            >
              New Session
            </button>
            <button
              className="action-btn"
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 