/**
 * 🛡️ ErrorBoundary Component - Error Boundary for DEX Components
 * 
 * Error boundary pentru a prinde erori în componentele DEX
 * 
 * @module ErrorBoundary
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, Button } from '../ui';
import { getUserFriendlyError } from '../../utils/helpers';
import { captureException } from '../../utils/sentry';
import '../../styles/components/error-boundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    // Log error pentru debugging (în development)
    if (process.env.NODE_ENV === 'development') {
      console.group('🔴 Error Boundary Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo?.componentStack);
      console.groupEnd();
    }

    this.setState({
      error,
      errorInfo
    });

    if (process.env.NODE_ENV === 'production') {
      captureException(error, {
        componentStack: errorInfo?.componentStack,
        errorBoundary: true,
      });
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const userFriendlyMessage = this.state.error 
        ? getUserFriendlyError(this.state.error)
        : 'An unexpected error occurred while rendering this component.';

      return (
        <Card className="error-boundary-container" padding="lg">
          <div className="error-boundary-content">
            <AlertCircle size={48} className="error-boundary-icon" />
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-message">
              {userFriendlyMessage}
            </p>
            
            {this.state.errorId && (
              <p className="error-boundary-id" style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280',
                marginTop: '0.5rem'
              }}>
                Error ID: {this.state.errorId}
              </p>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-boundary-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-boundary-actions" style={{ 
              display: 'flex', 
              gap: '12px', 
              marginTop: '24px',
              flexWrap: 'wrap'
            }}>
              <Button
                variant="primary"
                size="md"
                icon={<RefreshCw size={18} />}
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
