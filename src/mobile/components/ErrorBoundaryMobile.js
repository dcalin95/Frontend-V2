import React from 'react';
import Icon from '../../assets/icons/Icon';
import '../Mobile.css';

class ErrorBoundaryMobile extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mobile-error-boundary">
          <div className="mobile-error-content">
            <Icon name="error" size="xlarge" animate="pulse" className="mobile-error-icon" />
            <h2 className="mobile-error-title">Oops! Something went wrong</h2>
            <p className="mobile-error-message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button 
              className="mobile-error-reload-btn"
              onClick={() => window.location.reload()}
            >
              <Icon name="refresh" size="small" />
              <span>Reload App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryMobile;

