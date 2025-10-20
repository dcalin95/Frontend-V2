// 🚀 GOOGLE ANALYTICS 4 & GOOGLE ADS CONFIGURATION
// Optimized for Crypto Investment Platform

export const GOOGLE_CONFIG = {
  // 📊 GOOGLE ANALYTICS 4
  GA4: {
    measurementId: process.env.REACT_APP_GA4_MEASUREMENT_ID || 'GA_MEASUREMENT_ID',
    enabled: process.env.NODE_ENV === 'production',
    
    // 🎯 CUSTOM DIMENSIONS
    customDimensions: {
      userType: 'custom_parameter_1',
      investmentAmount: 'custom_parameter_2',
      cryptoExperience: 'custom_parameter_3',
      walletType: 'custom_parameter_4',
      tradingFrequency: 'custom_parameter_5',
      preferredCrypto: 'custom_parameter_6',
      riskTolerance: 'custom_parameter_7',
      investmentGoal: 'custom_parameter_8',
      referralSource: 'custom_parameter_9',
      deviceCategory: 'custom_parameter_10'
    },

    // 🎯 CUSTOM METRICS
    customMetrics: {
      sessionDuration: 'custom_metric_1',
      pagesPerSession: 'custom_metric_2',
      bounceRate: 'custom_metric_3',
      conversionRate: 'custom_metric_4',
      averageOrderValue: 'custom_metric_5'
    },

    // 🎯 ENHANCED ECOMMERCE
    ecommerce: {
      enabled: true,
      currency: 'USD',
      taxRate: 0.0, // Crypto transactions
      shipping: 0.0 // Digital assets
    }
  },

  // 🎯 GOOGLE ADS
  ADS: {
    conversionId: process.env.REACT_APP_GOOGLE_ADS_CONVERSION_ID || 'AW-CONVERSION_ID',
    conversionLabel: process.env.REACT_APP_GOOGLE_ADS_CONVERSION_LABEL || 'CONVERSION_LABEL',
    enabled: process.env.NODE_ENV === 'production',

    // 🎯 CONVERSION ACTIONS
    conversions: {
      // 🚀 PRESALE CONVERSIONS
      presaleRegistration: {
        id: 'AW-PRESALE-REG',
        label: 'PRESALE_REG_LABEL',
        value: 10.00,
        currency: 'USD'
      },
      
      presaleInvestment: {
        id: 'AW-PRESALE-INVEST',
        label: 'PRESALE_INVEST_LABEL',
        value: 100.00,
        currency: 'USD',
        dynamic: true // Value from actual investment
      },

      // 📈 TRADING CONVERSIONS
      firstTrade: {
        id: 'AW-FIRST-TRADE',
        label: 'FIRST_TRADE_LABEL',
        value: 25.00,
        currency: 'USD'
      },

      tradingVolume: {
        id: 'AW-TRADING-VOLUME',
        label: 'TRADING_VOLUME_LABEL',
        value: 50.00,
        currency: 'USD',
        dynamic: true
      },

      // 💰 WALLET CONVERSIONS
      walletConnection: {
        id: 'AW-WALLET-CONNECT',
        label: 'WALLET_CONNECT_LABEL',
        value: 5.00,
        currency: 'USD'
      },

      walletFunding: {
        id: 'AW-WALLET-FUND',
        label: 'WALLET_FUND_LABEL',
        value: 75.00,
        currency: 'USD',
        dynamic: true
      },

      // 📊 ANALYTICS CONVERSIONS
      analyticsSubscription: {
        id: 'AW-ANALYTICS-SUB',
        label: 'ANALYTICS_SUB_LABEL',
        value: 15.00,
        currency: 'USD'
      },

      premiumUpgrade: {
        id: 'AW-PREMIUM-UPGRADE',
        label: 'PREMIUM_UPGRADE_LABEL',
        value: 200.00,
        currency: 'USD'
      }
    },

    // 🎯 REMARKETING AUDIENCES
    audiences: {
      presaleVisitors: 'AW-PRESALE-VISITORS',
      tradingUsers: 'AW-TRADING-USERS',
      walletUsers: 'AW-WALLET-USERS',
      highValueUsers: 'AW-HIGH-VALUE-USERS',
      inactiveUsers: 'AW-INACTIVE-USERS',
      cryptoBeginners: 'AW-CRYPTO-BEGINNERS',
      cryptoExperts: 'AW-CRYPTO-EXPERTS'
    }
  },

  // 🔍 GOOGLE TAG MANAGER
  GTM: {
    containerId: process.env.REACT_APP_GTM_CONTAINER_ID || 'GTM-XXXXXXX',
    enabled: process.env.NODE_ENV === 'production'
  },

  // 🔍 GOOGLE SEARCH CONSOLE
  SEARCH_CONSOLE: {
    verificationCode: process.env.REACT_APP_SEARCH_CONSOLE_VERIFICATION || 'YOUR_VERIFICATION_CODE'
  }
};

// 🎯 CRYPTO-SPECIFIC EVENT TRACKING
export const CRYPTO_EVENTS = {
  // 🚀 PRESALE EVENTS
  PRESALE_VIEW: 'presale_view',
  PRESALE_REGISTER: 'presale_register',
  PRESALE_INVEST: 'presale_invest',
  PRESALE_COMPLETE: 'presale_complete',
  PRESALE_REFUND: 'presale_refund',

  // 📈 TRADING EVENTS
  TRADING_VIEW: 'trading_view',
  TRADING_START: 'trading_start',
  TRADE_EXECUTE: 'trade_execute',
  TRADE_CANCEL: 'trade_cancel',
  TRADING_VOLUME: 'trading_volume',

  // 💰 WALLET EVENTS
  WALLET_CONNECT: 'wallet_connect',
  WALLET_DISCONNECT: 'wallet_disconnect',
  WALLET_FUND: 'wallet_fund',
  WALLET_WITHDRAW: 'wallet_withdraw',
  WALLET_BALANCE: 'wallet_balance',

  // 📊 ANALYTICS EVENTS
  ANALYTICS_VIEW: 'analytics_view',
  ANALYTICS_SUBSCRIBE: 'analytics_subscribe',
  ANALYTICS_EXPORT: 'analytics_export',
  ANALYTICS_SHARE: 'analytics_share',

  // 🎯 INVESTMENT EVENTS
  INVESTMENT_VIEW: 'investment_view',
  INVESTMENT_PLAN: 'investment_plan',
  INVESTMENT_EXECUTE: 'investment_execute',
  INVESTMENT_MONITOR: 'investment_monitor',

  // 📚 EDUCATION EVENTS
  EDUCATION_VIEW: 'education_view',
  EDUCATION_COMPLETE: 'education_complete',
  EDUCATION_SHARE: 'education_share',
  EDUCATION_CERTIFICATE: 'education_certificate'
};

// 🎯 CRYPTO-SPECIFIC PARAMETERS
export const CRYPTO_PARAMETERS = {
  // 💰 INVESTMENT PARAMETERS
  INVESTMENT_AMOUNT: 'investment_amount',
  INVESTMENT_CURRENCY: 'investment_currency',
  INVESTMENT_TYPE: 'investment_type', // presale, trading, staking
  INVESTMENT_RISK: 'investment_risk', // low, medium, high

  // 🪙 CRYPTO PARAMETERS
  CRYPTO_SYMBOL: 'crypto_symbol',
  CRYPTO_NAME: 'crypto_name',
  CRYPTO_CATEGORY: 'crypto_category', // Bitcoin, Ethereum, Altcoin, DeFi
  CRYPTO_MARKET_CAP: 'crypto_market_cap',
  CRYPTO_PRICE: 'crypto_price',

  // 📈 TRADING PARAMETERS
  TRADE_TYPE: 'trade_type', // buy, sell, swap
  TRADE_AMOUNT: 'trade_amount',
  TRADE_PAIR: 'trade_pair',
  TRADE_FEE: 'trade_fee',
  TRADE_SLIPPAGE: 'trade_slippage',

  // 💼 WALLET PARAMETERS
  WALLET_TYPE: 'wallet_type', // MetaMask, WalletConnect, etc.
  WALLET_BALANCE: 'wallet_balance',
  WALLET_NETWORK: 'wallet_network', // Ethereum, BSC, Polygon
  WALLET_ADDRESS: 'wallet_address',

  // 🎯 USER PARAMETERS
  USER_EXPERIENCE: 'user_experience', // beginner, intermediate, expert
  USER_INVESTMENT_GOAL: 'user_investment_goal', // short-term, long-term, hodl
  USER_RISK_TOLERANCE: 'user_risk_tolerance', // conservative, moderate, aggressive
  USER_INVESTMENT_AMOUNT: 'user_investment_amount', // <1k, 1k-10k, 10k-100k, >100k
  USER_TRADING_FREQUENCY: 'user_trading_frequency' // daily, weekly, monthly, rarely
};

// 🎯 CONVERSION VALUE MAPPING
export const CONVERSION_VALUES = {
  // 🚀 PRESALE VALUES
  [CRYPTO_EVENTS.PRESALE_REGISTER]: 10,
  [CRYPTO_EVENTS.PRESALE_INVEST]: 100,
  [CRYPTO_EVENTS.PRESALE_COMPLETE]: 500,

  // 📈 TRADING VALUES
  [CRYPTO_EVENTS.TRADING_START]: 25,
  [CRYPTO_EVENTS.TRADE_EXECUTE]: 50,
  [CRYPTO_EVENTS.TRADING_VOLUME]: 75,

  // 💰 WALLET VALUES
  [CRYPTO_EVENTS.WALLET_CONNECT]: 5,
  [CRYPTO_EVENTS.WALLET_FUND]: 75,
  [CRYPTO_EVENTS.WALLET_BALANCE]: 25,

  // 📊 ANALYTICS VALUES
  [CRYPTO_EVENTS.ANALYTICS_SUBSCRIBE]: 15,
  [CRYPTO_EVENTS.ANALYTICS_EXPORT]: 10,
  [CRYPTO_EVENTS.ANALYTICS_SHARE]: 5,

  // 🎯 INVESTMENT VALUES
  [CRYPTO_EVENTS.INVESTMENT_PLAN]: 30,
  [CRYPTO_EVENTS.INVESTMENT_EXECUTE]: 200,
  [CRYPTO_EVENTS.INVESTMENT_MONITOR]: 50,

  // 📚 EDUCATION VALUES
  [CRYPTO_EVENTS.EDUCATION_COMPLETE]: 20,
  [CRYPTO_EVENTS.EDUCATION_CERTIFICATE]: 40,
  [CRYPTO_EVENTS.EDUCATION_SHARE]: 10
};

// 🎯 DYNAMIC CONVERSION VALUE CALCULATOR
export const calculateConversionValue = (eventName, parameters = {}) => {
  const baseValue = CONVERSION_VALUES[eventName] || 0;
  
  // 🚀 PRESALE INVESTMENT - Dynamic based on amount
  if (eventName === CRYPTO_EVENTS.PRESALE_INVEST && parameters[CRYPTO_PARAMETERS.INVESTMENT_AMOUNT]) {
    const amount = parseFloat(parameters[CRYPTO_PARAMETERS.INVESTMENT_AMOUNT]);
    return Math.min(amount * 0.1, 1000); // 10% of investment, max $1000
  }

  // 📈 TRADING VOLUME - Dynamic based on volume
  if (eventName === CRYPTO_EVENTS.TRADING_VOLUME && parameters[CRYPTO_PARAMETERS.TRADE_AMOUNT]) {
    const volume = parseFloat(parameters[CRYPTO_PARAMETERS.TRADE_AMOUNT]);
    return Math.min(volume * 0.05, 500); // 5% of volume, max $500
  }

  // 💰 WALLET FUNDING - Dynamic based on amount
  if (eventName === CRYPTO_EVENTS.WALLET_FUND && parameters[CRYPTO_PARAMETERS.INVESTMENT_AMOUNT]) {
    const amount = parseFloat(parameters[CRYPTO_PARAMETERS.INVESTMENT_AMOUNT]);
    return Math.min(amount * 0.08, 800); // 8% of funding, max $800
  }

  return baseValue;
};

// 🎯 GOOGLE ANALYTICS 4 HELPER FUNCTIONS
export const GA4_HELPERS = {
  // 📊 TRACK PAGE VIEW
  trackPageView: (pageTitle, pageLocation, customParameters = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GOOGLE_CONFIG.GA4.measurementId, {
        page_title: pageTitle,
        page_location: pageLocation,
        ...customParameters
      });
    }
  },

  // 🎯 TRACK EVENT
  trackEvent: (eventName, parameters = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'Crypto Investment',
        event_label: eventName,
        value: calculateConversionValue(eventName, parameters),
        currency: 'USD',
        ...parameters
      });
    }
  },

  // 💰 TRACK CONVERSION
  trackConversion: (conversionId, conversionLabel, value = 0, currency = 'USD') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: `${conversionId}/${conversionLabel}`,
        value: value,
        currency: currency
      });
    }
  },

  // 📊 TRACK ECOMMERCE
  trackEcommerce: (action, parameters = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        currency: 'USD',
        ...parameters
      });
    }
  },

  // 🎯 SET USER PROPERTIES
  setUserProperties: (properties = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GOOGLE_CONFIG.GA4.measurementId, {
        custom_map: properties
      });
    }
  }
};

// 🎯 GOOGLE ADS HELPER FUNCTIONS
export const ADS_HELPERS = {
  // 💰 TRACK CONVERSION
  trackConversion: (conversionType, value = 0, currency = 'USD') => {
    const conversion = GOOGLE_CONFIG.ADS.conversions[conversionType];
    if (conversion && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: `${conversion.id}/${conversion.label}`,
        value: value || conversion.value,
        currency: currency || conversion.currency
      });
    }
  },

  // 🎯 TRACK DYNAMIC CONVERSION
  trackDynamicConversion: (conversionType, parameters = {}) => {
    const conversion = GOOGLE_CONFIG.ADS.conversions[conversionType];
    if (conversion && typeof window !== 'undefined' && window.gtag) {
      const value = conversion.dynamic ? 
        calculateConversionValue(conversionType, parameters) : 
        conversion.value;

      window.gtag('event', 'conversion', {
        send_to: `${conversion.id}/${conversion.label}`,
        value: value,
        currency: conversion.currency,
        ...parameters
      });
    }
  },

  // 📊 TRACK REMARKETING
  trackRemarketing: (audienceId) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'remarketing', {
        send_to: audienceId
      });
    }
  }
};

export default GOOGLE_CONFIG; 