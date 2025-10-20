class ErrorService {
  constructor(config = {}) {
    this.config = {
      apiUrl: process.env.REACT_APP_BACKEND_URL || 'https://backend-server-f82y.onrender.com',
      enableLogging: process.env.NODE_ENV === 'production',
      enableAnalytics: process.env.NODE_ENV === 'production',
      ...config
    };
    this.errorQueue = [];
    this.isProcessing = false;
    this.setupGlobalErrorHandlers();
  }

  setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), 'Unhandled Promise Rejection');
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), 'Global Error');
    });
  }

  handleError(error, context = 'Unknown') {
    const errorReport = {
      errorId: Date.now(),
      error: error.toString(),
      errorInfo: error.stack || '',
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context
    };

    console.error(`🚨 [${context}] Error:`, error);
    console.error('Error Report:', errorReport);

    if (this.config.enableLogging) {
      this.queueError(errorReport);
    }

    if (this.config.enableAnalytics) {
      this.sendToAnalytics(errorReport);
    }
  }

  queueError(errorReport) {
    this.errorQueue.push(errorReport);
    this.processErrorQueue();
  }

  async processErrorQueue() {
    if (this.isProcessing || this.errorQueue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.errorQueue.length > 0) {
        const errorReport = this.errorQueue.shift();
        if (errorReport) {
          await this.sendToServer(errorReport);
        }
      }
    } catch (err) {
      console.error('Failed to process error queue:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  async sendToServer(errorReport) {
    try {
      const response = await fetch(`${this.config.apiUrl}/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Unknown server error');
      }
    } catch (err) {
      console.error('Failed to send error to server:', err);
      // Re-queue the error for later retry
      this.errorQueue.unshift(errorReport);
    }
  }

  sendToAnalytics(errorReport) {
    // Send to analytics service (Google Analytics, Mixpanel, etc.)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'error', {
        error_id: errorReport.errorId,
        error_message: errorReport.error,
        error_context: errorReport.context,
        page_url: errorReport.url
      });
    }
  }

  async getErrorById(errorId) {
    try {
      const response = await fetch(`${this.config.apiUrl}/errors/${errorId}`);
      if (!response.ok) return null;

      const result = await response.json();
      return result.data || null;
    } catch (err) {
      console.error('Failed to get error by ID:', err);
      return null;
    }
  }

  getErrorStats() {
    return {
      total: this.errorQueue.length,
      queued: this.errorQueue.length
    };
  }

  clearErrorQueue() {
    this.errorQueue = [];
  }
}

// Create default instance
export const errorService = new ErrorService();

export default errorService; 