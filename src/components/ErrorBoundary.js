import React from 'react';
import './ErrorBoundary.css';

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
      errorId: Date.now() // Pentru tracking
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Opțional: Trimite eroarea la un serviciu de monitoring
    // this.logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
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

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">🧑‍🚀</div>
            <h2>Uh‑oh! Something went wrong</h2>
            <p>Our AI detected an unexpected issue and is already investigating.</p>
            
            <div className="error-id">
              <small>Error ID: {this.state.errorId}</small>
            </div>

            <div className="error-actions">
              <button onClick={this.handleRetry} className="retry-button">
                🔄 Try again
              </button>
              <button onClick={this.handleGoHome} className="home-button">
                🏠 Go home
              </button>
              <button onClick={this.handleReload} className="reload-button">
                🔄 Reload page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="error-details">
                <details>
                  <summary>🔧 Technical details (dev‑only)</summary>
                  <div className="error-stack">
                    <h4>Error:</h4>
                    <pre>{this.state.error && this.state.error.toString()}</pre>
                    
                    <h4>Component Stack:</h4>
                    <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                  </div>
                </details>
              </div>
            )}

            <div className="error-help">
              <p>
                If this keeps happening, please contact support and include Error ID: <strong>{this.state.errorId}</strong>
              </p>
              <p>
                Email: <a href="mailto:contact@bits-ai.io">contact@bits-ai.io</a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 