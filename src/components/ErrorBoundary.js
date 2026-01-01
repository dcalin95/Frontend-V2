import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      showDetails: false
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

    // Auto-recover from common CDN/cache issues (ChunkLoadError etc.)
    try {
      const msg = String(error?.message || error || '');
      const name = String(error?.name || '');
      const isChunkish =
        name === 'ChunkLoadError' ||
        /Loading chunk \d+ failed/i.test(msg) ||
        /ChunkLoadError/i.test(msg) ||
        /CSS_CHUNK_LOAD_FAILED/i.test(msg) ||
        /Failed to fetch dynamically imported module/i.test(msg);

      if (isChunkish) {
        const key = 'bits_auto_recover_chunk_once';
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          // Best-effort: clear caches + unregister SW, then reload
          (async () => {
            try {
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
              }
              if (window.caches?.keys) {
                const keys = await window.caches.keys();
                await Promise.all(keys.map(k => window.caches.delete(k)));
              }
            } catch (_) {
              // ignore
            } finally {
              window.location.reload();
            }
          })();
        }
      }
    } catch (_) {
      // ignore
    }

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

  handleHardReset = async () => {
    try {
      // Clear SW + CacheStorage (localStorage is NOT enough)
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if (window.caches?.keys) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map(k => window.caches.delete(k)));
      }
    } catch (_) {
      // ignore
    } finally {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleToggleDetails = () => {
    this.setState(s => ({ showDetails: !s.showDetails }));
  };

  handleCopyDetails = async () => {
    const err = this.state.error;
    const info = this.state.errorInfo;
    const payload =
      `Error ID: ${this.state.errorId}\n` +
      `Name: ${String(err?.name || '')}\n` +
      `Message: ${String(err?.message || err || '')}\n\n` +
      `Stack:\n${String(err?.stack || '')}\n\n` +
      `ComponentStack:\n${String(info?.componentStack || '')}\n`;

    try {
      await navigator.clipboard.writeText(payload);
      alert('✅ Copiat. Trimite-mi textul din clipboard.');
    } catch (_) {
      // fallback
      window.prompt('Copiază manual detaliile:', payload);
    }
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
              <button onClick={this.handleHardReset} className="reload-button">
                🧹 Hard reset cache
              </button>
            </div>

            <div className="error-details">
              <button onClick={this.handleToggleDetails} className="retry-button" style={{ marginTop: 10 }}>
                {this.state.showDetails ? 'Hide details' : 'Show details'}
              </button>
              {this.state.showDetails && (
                <div className="error-stack" style={{ marginTop: 10, textAlign: 'left' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={this.handleCopyDetails} className="home-button">
                      📋 Copy details
                    </button>
                  </div>
                  <h4 style={{ marginTop: 10 }}>Error:</h4>
                  <pre>{this.state.error ? (this.state.error.stack || this.state.error.toString()) : '—'}</pre>
                  <h4>Component Stack:</h4>
                  <pre>{this.state.errorInfo?.componentStack || '—'}</pre>
                </div>
              )}
            </div>

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