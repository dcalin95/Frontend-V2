// Analytics Configuration
export const ANALYTICS_CONFIG = {
  // Google Analytics 4
  GA4: {
    measurementId: process.env.REACT_APP_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX',
    enabled: process.env.NODE_ENV === 'production',
  },

  // Sentry Error Tracking
  SENTRY: {
    dsn: process.env.REACT_APP_SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  },

  // Mixpanel Analytics
  MIXPANEL: {
    token: process.env.REACT_APP_MIXPANEL_TOKEN || '',
    enabled: process.env.NODE_ENV === 'production',
  },

  // Hotjar User Behavior
  HOTJAR: {
    hjid: process.env.REACT_APP_HOTJAR_ID || '',
    hjsv: process.env.REACT_APP_HOTJAR_SNIPPET_VERSION || '6',
    enabled: process.env.NODE_ENV === 'production',
  },

  // Custom Analytics
  CUSTOM: {
    enabled: true,
    endpoint: process.env.REACT_APP_ANALYTICS_ENDPOINT || '/api/analytics',
  },
};

// Event Types
export const EVENT_TYPES = {
  // Page Views
  PAGE_VIEW: 'page_view',
  PAGE_LOAD: 'page_load',
  
  // User Actions
  BUTTON_CLICK: 'button_click',
  FORM_SUBMIT: 'form_submit',
  FORM_ERROR: 'form_error',
  
  // Navigation
  NAVIGATION: 'navigation',
  MENU_OPEN: 'menu_open',
  MENU_CLOSE: 'menu_close',
  
  // Wallet Actions
  WALLET_CONNECT: 'wallet_connect',
  WALLET_DISCONNECT: 'wallet_disconnect',
  TRANSACTION_START: 'transaction_start',
  TRANSACTION_SUCCESS: 'transaction_success',
  TRANSACTION_ERROR: 'transaction_error',
  
  // Presale Actions
  PRESALE_VIEW: 'presale_view',
  PRESALE_PURCHASE: 'presale_purchase',
  PRESALE_ERROR: 'presale_error',
  PRESALE_ROUND_START: 'presale_round_start',
  PRESALE_ROUND_END: 'presale_round_end',
  PRESALE_ROUND_PAUSE: 'presale_round_pause',
  PRESALE_ROUND_RESUME: 'presale_round_resume',
  PRESALE_PRICE_UPDATE: 'presale_price_update',
  PRESALE_TOKENS_SOLD: 'presale_tokens_sold',
  PRESALE_PROGRESS_UPDATE: 'presale_progress_update',
  
  // Staking Actions
  STAKING_VIEW: 'staking_view',
  STAKE_TOKENS: 'stake_tokens',
  UNSTAKE_TOKENS: 'unstake_tokens',
  CLAIM_REWARDS: 'claim_rewards',
  STAKING_REWARDS_VIEW: 'staking_rewards_view',
  STAKING_HISTORY_VIEW: 'staking_history_view',
  STAKING_APY_VIEW: 'staking_apy_view',
  
  // Crypto Trading Actions
  TRADING_VIEW: 'trading_view',
  TRADE_EXECUTE: 'trade_execute',
  TRADE_CANCEL: 'trade_cancel',
  ORDER_PLACE: 'order_place',
  ORDER_CANCEL: 'order_cancel',
  MARKET_DATA_VIEW: 'market_data_view',
  PRICE_CHART_VIEW: 'price_chart_view',
  PORTFOLIO_VIEW: 'portfolio_view',
  
  // Investment Actions
  INVESTMENT_VIEW: 'investment_view',
  INVESTMENT_ANALYSIS: 'investment_analysis',
  INVESTMENT_COMPARISON: 'investment_comparison',
  INVESTMENT_EDUCATION: 'investment_education',
  WHITEPAPER_VIEW: 'whitepaper_view',
  ROADMAP_VIEW: 'roadmap_view',
  TOKENOMICS_VIEW: 'tokenomics_view',
  
  // AI Actions
  AI_CHAT_START: 'ai_chat_start',
  AI_CHAT_MESSAGE: 'ai_chat_message',
  AI_CHAT_ERROR: 'ai_chat_error',
  AI_INVESTMENT_ADVICE: 'ai_investment_advice',
  AI_MARKET_ANALYSIS: 'ai_market_analysis',
  AI_PORTFOLIO_OPTIMIZATION: 'ai_portfolio_optimization',
  
  // Performance
  PERFORMANCE_METRIC: 'performance_metric',
  ERROR_OCCURRED: 'error_occurred',
  
  // User Engagement
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  IDLE_TIMEOUT: 'idle_timeout',
  
  // Mobile Actions
  SWIPE_GESTURE: 'swipe_gesture',
  TOUCH_GESTURE: 'touch_gesture',
  ORIENTATION_CHANGE: 'orientation_change',
  
  // PWA Actions
  PWA_INSTALL: 'pwa_install',
  PWA_INSTALL_PROMPT: 'pwa_install_prompt',
  OFFLINE_MODE: 'offline_mode',
  ONLINE_MODE: 'online_mode',
  
  // Crypto Market Actions
  MARKET_TREND_VIEW: 'market_trend_view',
  CRYPTO_NEWS_VIEW: 'crypto_news_view',
  MARKET_ALERT_SET: 'market_alert_set',
  PRICE_ALERT_TRIGGER: 'price_alert_trigger',
  
  // Social Features
  SOCIAL_SHARE: 'social_share',
  REFERRAL_LINK_GENERATE: 'referral_link_generate',
  REFERRAL_LINK_CLICK: 'referral_link_click',
  INVITE_FRIEND: 'invite_friend',
  
  // Security Actions
  SECURITY_SETTINGS_VIEW: 'security_settings_view',
  TWO_FACTOR_ENABLE: 'two_factor_enable',
  TWO_FACTOR_DISABLE: 'two_factor_disable',
  PASSWORD_CHANGE: 'password_change',
  LOGIN_ATTEMPT: 'login_attempt',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
};

// User Properties
export const USER_PROPERTIES = {
  DEVICE_TYPE: 'device_type',
  BROWSER: 'browser',
  OS: 'operating_system',
  SCREEN_RESOLUTION: 'screen_resolution',
  CONNECTION_TYPE: 'connection_type',
  LANGUAGE: 'language',
  TIMEZONE: 'timezone',
  USER_AGENT: 'user_agent',
  REFERRER: 'referrer',
  UTM_SOURCE: 'utm_source',
  UTM_MEDIUM: 'utm_medium',
  UTM_CAMPAIGN: 'utm_campaign',
  
  // Crypto-specific properties
  WALLET_TYPE: 'wallet_type',
  WALLET_ADDRESS: 'wallet_address',
  TOKENS_OWNED: 'tokens_owned',
  TOTAL_INVESTMENT: 'total_investment',
  INVESTMENT_HISTORY: 'investment_history',
  TRADING_FREQUENCY: 'trading_frequency',
  PREFERRED_CRYPTO: 'preferred_crypto',
  RISK_TOLERANCE: 'risk_tolerance',
  INVESTMENT_GOALS: 'investment_goals',
  EXPERIENCE_LEVEL: 'experience_level',
  COUNTRY: 'country',
  REGULATION_COMPLIANCE: 'regulation_compliance',
};

// Performance Metrics
export const PERFORMANCE_METRICS = {
  FIRST_CONTENTFUL_PAINT: 'FCP',
  LARGEST_CONTENTFUL_PAINT: 'LCP',
  FIRST_INPUT_DELAY: 'FID',
  CUMULATIVE_LAYOUT_SHIFT: 'CLS',
  TIME_TO_FIRST_BYTE: 'TTFB',
  DOM_CONTENT_LOADED: 'DCL',
  WINDOW_LOAD: 'WL',
  
  // Crypto-specific metrics
  BLOCKCHAIN_RESPONSE_TIME: 'blockchain_response_time',
  TRANSACTION_CONFIRMATION_TIME: 'transaction_confirmation_time',
  WALLET_CONNECTION_TIME: 'wallet_connection_time',
  PRICE_FEED_UPDATE_TIME: 'price_feed_update_time',
  CHART_RENDERING_TIME: 'chart_rendering_time',
  API_RESPONSE_TIME: 'api_response_time',
};

// Error Severity Levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Crypto-specific Error Types
export const CRYPTO_ERROR_TYPES = {
  WALLET_CONNECTION_FAILED: 'wallet_connection_failed',
  TRANSACTION_FAILED: 'transaction_failed',
  INSUFFICIENT_BALANCE: 'insufficient_balance',
  NETWORK_ERROR: 'network_error',
  SMART_CONTRACT_ERROR: 'smart_contract_error',
  GAS_ESTIMATION_FAILED: 'gas_estimation_failed',
  PRICE_FEED_ERROR: 'price_feed_error',
  BLOCKCHAIN_RPC_ERROR: 'blockchain_rpc_error',
  USER_REJECTED_TRANSACTION: 'user_rejected_transaction',
  TIMEOUT_ERROR: 'timeout_error',
};

// A/B Testing Configuration
export const AB_TESTING_CONFIG = {
  enabled: process.env.NODE_ENV === 'production',
  experiments: {
    // UI Variations
    BUTTON_COLOR: {
      id: 'button_color_test',
      variants: ['blue', 'green', 'purple'],
      default: 'blue',
    },
    
    // Layout Variations
    HEADER_LAYOUT: {
      id: 'header_layout_test',
      variants: ['compact', 'expanded'],
      default: 'compact',
    },
    
    // Feature Flags
    NEW_FEATURES: {
      id: 'new_features_test',
      variants: ['enabled', 'disabled'],
      default: 'disabled',
    },
    
    // Crypto-specific experiments
    PRESALE_UI: {
      id: 'presale_ui_test',
      variants: ['modern', 'classic', 'minimal'],
      default: 'modern',
    },
    
    STAKING_INTERFACE: {
      id: 'staking_interface_test',
      variants: ['card_view', 'table_view', 'list_view'],
      default: 'card_view',
    },
    
    PRICE_DISPLAY: {
      id: 'price_display_test',
      variants: ['large', 'medium', 'small'],
      default: 'medium',
    },
    
    CHART_TYPE: {
      id: 'chart_type_test',
      variants: ['candlestick', 'line', 'area'],
      default: 'candlestick',
    },
  },
};

// Conversion Goals
export const CONVERSION_GOALS = {
  WALLET_CONNECTION: 'wallet_connection',
  FIRST_PRESALE_PURCHASE: 'first_presale_purchase',
  FIRST_STAKE: 'first_stake',
  FIRST_TRADE: 'first_trade',
  ACCOUNT_REGISTRATION: 'account_registration',
  EMAIL_SUBSCRIPTION: 'email_subscription',
  SOCIAL_SHARE: 'social_share',
  REFERRAL_SIGNUP: 'referral_signup',
  WHITEPAPER_DOWNLOAD: 'whitepaper_download',
  AI_CHAT_ENGAGEMENT: 'ai_chat_engagement',
};

// Revenue Tracking
export const REVENUE_EVENTS = {
  PRESALE_PURCHASE: 'presale_purchase',
  STAKING_REWARDS: 'staking_rewards',
  TRADING_FEES: 'trading_fees',
  SUBSCRIPTION_PAYMENT: 'subscription_payment',
  PREMIUM_FEATURES: 'premium_features',
};

// User Segments
export const USER_SEGMENTS = {
  NEW_USER: 'new_user',
  RETURNING_USER: 'returning_user',
  ACTIVE_INVESTOR: 'active_investor',
  PASSIVE_INVESTOR: 'passive_investor',
  HIGH_VALUE_USER: 'high_value_user',
  MOBILE_USER: 'mobile_user',
  DESKTOP_USER: 'desktop_user',
  CRYPTO_NATIVE: 'crypto_native',
  TRADITIONAL_INVESTOR: 'traditional_investor',
  DE_FI_USER: 'de_fi_user',
}; 