/**
 * 🚨 ErrorBoundary Component - Error Boundary
 * 
 * Error boundary component pentru catching React errors:
 * - Catch errors în component tree
 * - Display error message
 * - Error recovery
 * 
 * @module ErrorBoundary
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import '../../../styles/DEX/error-boundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error (în production, poate fi trimis la error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="ai-trading-error-boundary">
          <div className="ai-trading-error-boundary-content">
            <AlertCircle size={48} className="ai-trading-error-icon" />
            <h2 className="ai-trading-error-title">Something went wrong</h2>
            <p className="ai-trading-error-message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="ai-trading-error-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="ai-trading-error-stack">
                  {this.state.error?.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <button 
              className="ai-trading-error-reset-btn"
              onClick={this.handleReset}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

