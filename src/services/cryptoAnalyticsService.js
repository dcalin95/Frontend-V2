// 🚀 Crypto Analytics Service
// Enhanced analytics specifically for crypto investment platform

import { ANALYTICS_CONFIG, EVENT_TYPES, USER_PROPERTIES } from '../config/analytics';

class CryptoAnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.userProperties = {};
    this.sessionData = {};
    this.cryptoMetrics = {};
  }

  // Initialize crypto analytics
  init() {
    if (this.isInitialized) return;
    
    this.setupCryptoUserProperties();
    this.setupCryptoSessionTracking();
    this.setupCryptoPerformanceMonitoring();
    this.setupCryptoErrorTracking();
    
    this.isInitialized = true;
    console.log('🚀 Crypto Analytics Service initialized');
  }

  // Setup crypto-specific user properties
  setupCryptoUserProperties() {
    this.userProperties = {
      ...this.userProperties,
      [USER_PROPERTIES.WALLET_TYPE]: this.detectWalletType(),
      [USER_PROPERTIES.EXPERIENCE_LEVEL]: this.detectExperienceLevel(),
      [USER_PROPERTIES.RISK_TOLERANCE]: this.detectRiskTolerance(),
      [USER_PROPERTIES.COUNTRY]: this.detectUserCountry(),
      [USER_PROPERTIES.REGULATION_COMPLIANCE]: this.checkRegulationCompliance(),
    };
  }

  // Detect wallet type
  detectWalletType() {
    if (typeof window !== 'undefined') {
      if (window.ethereum?.isMetaMask) return 'metamask';
      if (window.ethereum?.isWalletConnect) return 'walletconnect';
      if (window.ethereum?.isCoinbaseWallet) return 'coinbase';
      if (window.ethereum) return 'generic';
    }
    return 'none';
  }

  // Detect user experience level
  detectExperienceLevel() {
    const cryptoKeywords = ['bitcoin', 'ethereum', 'blockchain', 'defi', 'nft'];
    const hasCryptoHistory = cryptoKeywords.some(keyword => 
      document.referrer.includes(keyword) || 
      localStorage.getItem('crypto_experience')
    );
    
    if (hasCryptoHistory) return 'experienced';
    if (localStorage.getItem('first_visit')) return 'intermediate';
    return 'beginner';
  }

  // Detect risk tolerance based on user behavior
  detectRiskTolerance() {
    const highRiskActions = ['trading_view', 'leverage_trading', 'futures_trading'];
    const lowRiskActions = ['staking_view', 'presale_view', 'hodl'];
    
    const userActions = JSON.parse(localStorage.getItem('user_actions') || '[]');
    const highRiskCount = userActions.filter(action => highRiskActions.includes(action)).length;
    const lowRiskCount = userActions.filter(action => lowRiskActions.includes(action)).length;
    
    if (highRiskCount > lowRiskCount) return 'high';
    if (lowRiskCount > highRiskCount) return 'low';
    return 'medium';
  }

  // Detect user country
  detectUserCountry() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[0];
    } catch {
      return 'unknown';
    }
  }

  // Check regulation compliance
  checkRegulationCompliance() {
    const country = this.detectUserCountry();
    const restrictedCountries = ['US', 'CN', 'KR', 'IN'];
    return restrictedCountries.includes(country) ? 'restricted' : 'compliant';
  }

  // Setup crypto session tracking
  setupCryptoSessionTracking() {
    this.sessionData = {
      sessionId: Date.now().toString(),
      startTime: Date.now(),
      cryptoActions: [],
      walletConnections: 0,
      transactions: 0,
      errors: 0,
    };

    // Track session end
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
    });
  }

  // Setup crypto performance monitoring
  setupCryptoPerformanceMonitoring() {
    // Monitor blockchain response times
    this.monitorBlockchainPerformance();
    
    // Monitor wallet connection performance
    this.monitorWalletPerformance();
    
    // Monitor price feed performance
    this.monitorPriceFeedPerformance();
  }

  // Monitor blockchain performance
  monitorBlockchainPerformance() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        if (args[0].includes('blockchain') || args[0].includes('rpc')) {
          this.trackPerformance('blockchain_response_time', endTime - startTime);
        }
        
        return response;
      } catch (error) {
        this.trackError('blockchain_rpc_error', error);
        throw error;
      }
    };
  }

  // Monitor wallet performance
  monitorWalletPerformance() {
    if (window.ethereum) {
      const originalRequest = window.ethereum.request;
      window.ethereum.request = async (...args) => {
        const startTime = performance.now();
        try {
          const result = await originalRequest(...args);
          const endTime = performance.now();
          
          this.trackPerformance('wallet_connection_time', endTime - startTime);
          return result;
        } catch (error) {
          this.trackError('wallet_connection_failed', error);
          throw error;
        }
      };
    }
  }

  // Monitor price feed performance
  monitorPriceFeedPerformance() {
    // Monitor price API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      if (args[0].includes('price') || args[0].includes('market')) {
        const startTime = performance.now();
        try {
          const response = await originalFetch(...args);
          const endTime = performance.now();
          
          this.trackPerformance('price_feed_update_time', endTime - startTime);
          return response;
        } catch (error) {
          this.trackError('price_feed_error', error);
          throw error;
        }
      }
      return originalFetch(...args);
    };
  }

  // Setup crypto error tracking
  setupCryptoErrorTracking() {
    window.addEventListener('error', (event) => {
      this.trackCryptoError(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackCryptoError(event.reason);
    });
  }

  // Track crypto-specific events
  trackCryptoEvent(eventName, properties = {}) {
    if (!this.isInitialized) this.init();

    const enhancedProperties = {
      ...properties,
      ...this.userProperties,
      sessionId: this.sessionData.sessionId,
      timestamp: Date.now(),
      cryptoMetrics: this.cryptoMetrics,
    };

    // Track to all analytics services
    this.trackToGA4(eventName, enhancedProperties);
    this.trackToMixpanel(eventName, enhancedProperties);
    this.trackToCustom(eventName, enhancedProperties);

    // Update session data
    this.sessionData.cryptoActions.push({
      event: eventName,
      timestamp: Date.now(),
      properties: enhancedProperties,
    });

    // Store user actions for risk tolerance detection
    this.storeUserAction(eventName);
  }

  // Track presale events
  trackPresaleEvent(eventName, properties = {}) {
    const presaleProperties = {
      ...properties,
      eventCategory: 'presale',
      roundNumber: properties.roundNumber || 'current',
      tokensSold: properties.tokensSold || 0,
      pricePerToken: properties.pricePerToken || 0,
      totalRaised: properties.totalRaised || 0,
    };

    this.trackCryptoEvent(eventName, presaleProperties);
  }

  // Track staking events
  trackStakingEvent(eventName, properties = {}) {
    const stakingProperties = {
      ...properties,
      eventCategory: 'staking',
      stakingAmount: properties.stakingAmount || 0,
      stakingDuration: properties.stakingDuration || 0,
      apy: properties.apy || 0,
      rewards: properties.rewards || 0,
    };

    this.trackCryptoEvent(eventName, stakingProperties);
  }

  // Track trading events
  trackTradingEvent(eventName, properties = {}) {
    const tradingProperties = {
      ...properties,
      eventCategory: 'trading',
      tradeAmount: properties.tradeAmount || 0,
      tradeType: properties.tradeType || 'unknown',
      tradingPair: properties.tradingPair || 'unknown',
      slippage: properties.slippage || 0,
    };

    this.trackCryptoEvent(eventName, tradingProperties);
  }

  // Track wallet events
  trackWalletEvent(eventName, properties = {}) {
    const walletProperties = {
      ...properties,
      eventCategory: 'wallet',
      walletType: this.userProperties[USER_PROPERTIES.WALLET_TYPE],
      connectionMethod: properties.connectionMethod || 'unknown',
      network: properties.network || 'unknown',
    };

    this.trackCryptoEvent(eventName, walletProperties);
  }

  // Track performance metrics
  trackPerformance(metricName, value) {
    this.cryptoMetrics[metricName] = value;
    
    this.trackCryptoEvent(EVENT_TYPES.PERFORMANCE_METRIC, {
      metricName,
      value,
      unit: 'milliseconds',
    });
  }

  // Track crypto errors
  trackCryptoError(error) {
    const errorProperties = {
      errorMessage: error.message,
      errorStack: error.stack,
      errorType: error.name,
      errorSeverity: this.determineErrorSeverity(error),
      userContext: this.getUserContext(),
    };

    this.trackCryptoEvent(EVENT_TYPES.ERROR_OCCURRED, errorProperties);
    this.sessionData.errors++;
  }

  // Determine error severity
  determineErrorSeverity(error) {
    const criticalErrors = ['INSUFFICIENT_BALANCE', 'NETWORK_ERROR', 'SMART_CONTRACT_ERROR'];
    const highErrors = ['WALLET_CONNECTION_FAILED', 'TRANSACTION_FAILED'];
    
    if (criticalErrors.some(type => error.message.includes(type))) return 'critical';
    if (highErrors.some(type => error.message.includes(type))) return 'high';
    return 'medium';
  }

  // Get user context for error tracking
  getUserContext() {
    return {
      walletConnected: !!window.ethereum,
      walletType: this.userProperties[USER_PROPERTIES.WALLET_TYPE],
      currentPage: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    };
  }

  // Track session end
  trackSessionEnd() {
    const sessionDuration = Date.now() - this.sessionData.startTime;
    
    this.trackCryptoEvent(EVENT_TYPES.SESSION_END, {
      sessionDuration,
      cryptoActions: this.sessionData.cryptoActions.length,
      walletConnections: this.sessionData.walletConnections,
      transactions: this.sessionData.transactions,
      errors: this.sessionData.errors,
    });
  }

  // Store user action for analysis
  storeUserAction(action) {
    const actions = JSON.parse(localStorage.getItem('user_actions') || '[]');
    actions.push(action);
    
    // Keep only last 100 actions
    if (actions.length > 100) {
      actions.splice(0, actions.length - 100);
    }
    
    localStorage.setItem('user_actions', JSON.stringify(actions));
  }

  // Track to Google Analytics 4
  trackToGA4(eventName, properties) {
    if (ANALYTICS_CONFIG.GA4.enabled && window.gtag) {
      window.gtag('event', eventName, properties);
    }
  }

  // Track to Mixpanel
  trackToMixpanel(eventName, properties) {
    if (ANALYTICS_CONFIG.MIXPANEL.enabled && window.mixpanel) {
      window.mixpanel.track(eventName, properties);
    }
  }

  // Track to custom analytics
  trackToCustom(eventName, properties) {
    if (ANALYTICS_CONFIG.CUSTOM.enabled) {
      fetch(ANALYTICS_CONFIG.CUSTOM.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: eventName,
          properties,
          timestamp: Date.now(),
        }),
      }).catch(error => {
        console.error('Failed to send custom analytics:', error);
      });
    }
  }

  // Get crypto analytics summary
  getCryptoAnalyticsSummary() {
    return {
      userProperties: this.userProperties,
      sessionData: this.sessionData,
      cryptoMetrics: this.cryptoMetrics,
      isInitialized: this.isInitialized,
    };
  }

  // Get user behavior insights
  getUserBehaviorInsights() {
    const actions = JSON.parse(localStorage.getItem('user_actions') || '[]');
    const actionCounts = actions.reduce((acc, action) => {
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {});

    return {
      totalActions: actions.length,
      actionCounts,
      riskTolerance: this.userProperties[USER_PROPERTIES.RISK_TOLERANCE],
      experienceLevel: this.userProperties[USER_PROPERTIES.EXPERIENCE_LEVEL],
      preferredActions: Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, count })),
    };
  }
}

// Create singleton instance
const cryptoAnalyticsService = new CryptoAnalyticsService();

export default cryptoAnalyticsService; 