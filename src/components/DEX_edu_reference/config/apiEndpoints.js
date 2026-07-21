/**
 * Single Source of Truth for API Endpoints
 * 
 * This module centralizes all backend URL resolution.
 * All parts of the app (DEX, Presale, OTA) should import from here.
 * 
 * @module apiEndpoints
 */

import {
  getBackendUrl as getBackendUrlFromRuntime,
  getAuthBackendUrl as getAuthBackendUrlFromRuntime,
  getApiBaseUrl as getApiBaseUrlFromRuntime,
} from './runtimeConfig';

/**
 * Gets the backend base URL
 * Uses runtime config if available, otherwise falls back to env/build-time config
 * 
 * @returns {string} Backend base URL
 */
export function getBackendUrl() {
  return getBackendUrlFromRuntime();
}

/**
 * Base for OAuth redirects (Google etc.). May differ from BACKEND_URL for first-party domains.
 * @returns {string}
 */
export function getAuthBackendUrl() {
  return getAuthBackendUrlFromRuntime();
}

/**
 * Gets the API base URL
 * Uses runtime config if available, otherwise falls back to env/build-time config
 * 
 * @returns {string} API base URL (backend + '/api')
 */
export function getApiBaseUrl() {
  return getApiBaseUrlFromRuntime();
}

// Export constants for OTA endpoints (relative paths)
// SSOT: This is the single source of truth for all API endpoints
export const API_ENDPOINTS = {
  // DEX Authentication endpoints (wallet-based)
  DEX_AUTH_NONCE: '/api/dex/v1/auth/nonce',
  DEX_AUTH_VERIFY: '/api/dex/v1/auth/verify',
  DEX_AUTH_ME: '/api/dex/v1/auth/me',
  DEX_AUTH_LOGOUT: '/api/dex/v1/auth/logout',
  // Leverage Demo Account (30-day, per user + wallet)
  LEVERAGE_DEMO_STATUS: '/api/dex/v1/leverage-demo/status',
  LEVERAGE_DEMO_OPEN: '/api/dex/v1/leverage-demo/open',
  LEVERAGE_DEMO_ACCOUNT_GET: '/api/dex/v1/leverage-demo/account',
  LEVERAGE_DEMO_ACCOUNT_UPDATE: '/api/dex/v1/leverage-demo/account',

  // Leverage – Fiat (Stripe direct → open position)
  // Backend: POST /api/stripe/create-checkout { purpose:'leverage_fiat_open', ...tradeParams }
  LEVERAGE_FIAT_CHECKOUT: '/api/stripe/create-checkout',
  // GET /api/stripe/verify-session?session_id= → { ok, paid, purpose, tradeParams }
  LEVERAGE_FIAT_VERIFY: '/api/stripe/verify-session',

  // Email Authentication endpoints
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_VERIFY_EMAIL: '/api/auth/verify-email',
  AUTH_FORGOT_PASSWORD: '/api/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/api/auth/reset-password',
  AUTH_RESEND_VERIFICATION: '/api/auth/resend-verification',
  AUTH_PROFILE_AVATAR: '/api/auth/profile/avatar',
  /** Save phone (unverified). Backend: POST body { phone }, returns { ok, user }. */
  AUTH_PROFILE_PHONE: '/api/auth/profile/phone',
  /** Send OTP to phone (AWS SNS). Backend: POST body { phone }, returns { success, message }. */
  AUTH_PHONE_SEND_CODE: '/api/auth/phone/send-code',
  /** Verify OTP and login/register. Backend: POST body { phone, code }, returns { success, user }. */
  AUTH_PHONE_VERIFY: '/api/auth/phone/verify',
  /** Update phone for authenticated user (verify OTP). Backend: POST body { phone, code }, returns { success, user }. */
  AUTH_PHONE_UPDATE: '/api/auth/phone/update',
  /** Save bank account for withdrawals. Backend: POST body { iban, bic_swift?, bank_account_holder? }, returns { ok, user }. See docs/STRIPE_IBAN_WITHDRAWAL_SKELETON.md */
  AUTH_PROFILE_BANK: '/api/auth/profile/bank',
  /** Parse bank statement (PDF/image) → IBAN/BIC/holder. Backend: POST multipart field `statement`, returns { extracted, hint }. */
  AUTH_PROFILE_BANK_PARSE: '/api/auth/profile/bank/parse-statement',
  /** Stripe: available balance for withdrawal. Backend: GET, returns { balanceEur, balanceUsd } or similar. */
  STRIPE_BALANCE: '/api/stripe/balance',
  /** Stripe: request withdrawal to saved IBAN. Backend: POST body { amount, currency: 'eur'|'usd' }, returns { ok, payoutId, status }. */
  STRIPE_WITHDRAW: '/api/stripe/withdraw',
  /** Stripe: vault deposits + withdrawals for profile. Backend: GET, returns { deposits, withdrawals }. */
  STRIPE_HISTORY: '/api/stripe/history',
  /** Stripe: quote for fiat→BNB/USDT conversion. GET ?amountFiat=&currency=&tokenOut= */
  STRIPE_CONVERT_QUOTE: '/api/stripe/convert-quote',
  /** Stripe: create conversion order (fiat→BNB/USDT). POST { amountFiat, currency, tokenOut, walletAddress? } */
  STRIPE_CONVERT_TO_TOKEN: '/api/stripe/convert-to-token',
  /** Stripe: list conversion orders. GET */
  STRIPE_CONVERT_ORDERS: '/api/stripe/convert-orders',
  /** Claim Stripe balance by email (OTP). Backend: POST { email } → { success, message }. */
  AUTH_CLAIM_STRIPE_SEND_CODE: '/api/auth/claim-stripe/send-code',
  /** Verify OTP and login for Stripe balance. Backend: POST { email, code } → { success, user }. */
  AUTH_CLAIM_STRIPE_VERIFY: '/api/auth/claim-stripe/verify',
  /** Stripe payment history (checkout sessions by email). Backend: GET /api/auth/payments/history, returns { ok, payments: [{ id, amount_total, currency, created_at, ... }] }. */
  AUTH_PAYMENTS_HISTORY: '/api/auth/payments/history',

  // OTA (OpenAI Trading Agent) endpoints
  OTA_HEALTH: '/ai-trading/health',
  OTA_QUOTE: '/ai-trading/quote',
  OTA_MARKET: '/ai-trading/market',
  OTA_ANALYZE: '/ai-trading/analyze',
  OTA_QUOTA: '/ai-trading/quota',
  OTA_HISTORY: '/ai-trading/history',
  OTA_STATS: '/ai-trading/stats',
  OTA_SWAP_TX: '/ai-trading/swap-tx',
  // OpenAI Proxy endpoint (server-side only - no API key in client)
  OPENAI_PROXY: '/ai-trading/openai-proxy',
  // Direct chat with OpenAI using the same key as OTA.
  OTA_CHAT: '/ai-trading/chat',
  /** GET/PUT - per-wallet chat history sync on server, default 5-day TTL; requires an OTA wallet session. */
  OTA_CHAT_TRANSCRIPT: '/ai-trading/ota-chat-transcript',
  // OTA Agent: backend memory writes/deletes, works when the app is hosted on S3.
  OTA_MEMORY_APPLY: '/ai-trading/ota-memory/apply',
  // OTA Agent: read files from the backend repo on Render when the user is logged in as Owner.
  OTA_FILES_READ: '/ai-trading/ota-files/read',
  OTA_FILES_LIST: '/ai-trading/ota-files/list',
  // OTA Vault: sensitive information for authenticated owners only, delivered only in the Vault panel.
  OTA_VAULT_SET: '/ai-trading/ota-vault/set',
  OTA_VAULT_GET: '/ai-trading/ota-vault/get',
  // OTA: owner SSOT report for changes in a date range, with on-demand email delivery and admin users.
  OTA_SSOT_REPORT: '/ai-trading/ssot-report',
  OTA_SEND_EMAIL: '/ai-trading/send-email',
  /** BTC movement alert: per-wallet preferences + public snapshot (Binance USD-M). */
  OTA_MARKET_ALERTS_BTC: '/ai-trading/market-alerts/btc',
  OTA_MARKET_ALERTS_BTC_SNAPSHOT: '/ai-trading/market-alerts/btc/snapshot',
  OTA_ADMIN_USERS: '/ai-trading/admin/users',
  // OTA Registration endpoints
  OTA_REGISTRATION_STATUS: '/ai-trading/registration-status',
  OTA_REGISTER: '/ai-trading/register',
  OTA_AUTHORIZE_BOT: '/ai-trading/authorize-bot',
  OTA_BOT_ADDRESS: '/ai-trading/bot-address',
  // OTA Policy Management endpoints
  OTA_POLICY_GET: '/ai-trading/policy/get',
  OTA_POLICY_SET: '/ai-trading/policy/set',
  /** Token list for Limits (OTA_TRACKED_TOKENS from backend). Response: { symbols: string[] } or { tokens: { symbol, address }[] }. */
  OTA_TRACKED_TOKENS_GET: '/ai-trading/tracked-tokens',
  OTA_POLICY_TOKEN_LIMITS_GET: '/ai-trading/policy/token-limits/get',
  OTA_POLICY_TOKEN_LIMITS_SET: '/ai-trading/policy/token-limits/set',
  OTA_POLICY_TOKEN_ALLOWLIST_SET: '/ai-trading/policy/token-allowlist/set',
  OTA_POLICY_PAIR_ALLOWLIST_SET: '/ai-trading/policy/pair-allowlist/set',
  OTA_POLICY_ENFORCE_TOKEN_ALLOWLIST: '/ai-trading/policy/enforce-token-allowlist',
  OTA_POLICY_ENFORCE_PAIR_ALLOWLIST: '/ai-trading/policy/enforce-pair-allowlist',
  // OTA Circuit Breaker endpoints (GET ready = lightweight, no market data/CoinGecko)
  OTA_READY: '/ai-trading/ready',
  /** OTA variables on server, without full secrets. Public GET with limiter. */
  OTA_ENV_CHECK: '/ai-trading/ota-env-check',
  /** POST - EIP-191 challenge for OTA session (see OTA_AUTH_REMEDIATION.md). */
  OTA_AUTH_EVM_CHALLENGE: '/ai-trading/auth/evm/challenge',
  /** POST body { challengeId, address, signature } → { token } */
  OTA_AUTH_EVM_VERIFY: '/ai-trading/auth/evm/verify',
  /** Aggregated OpenAI Platform spend/credit (GET, server -> OpenAI HTTP). */
  OTA_OPENAI_PLATFORM_BUDGET: '/ai-trading/openai-platform-budget',
  /** Anthropic: configured key, model, ~30d org cost when ANTHROPIC_ADMIN_API_KEY exists (GET /api/claude/budget). */
  CLAUDE_BUDGET: '/claude/budget',
  /** Per-user internal trial/credit status for paid LLM providers. Requires wallet-backed userId. */
  OTA_LLM_BILLING_STATUS: '/ai-trading/llm-billing-status',
  OTA_LLM_BILLING_HISTORY: '/ai-trading/llm-billing-history',
  OTA_LLM_BILLING_PROVIDER_CONTROL: '/ai-trading/llm-billing/provider-control',
  /** Stripe checkout for separate LLM prepaid credit (purpose='llm_billing_topup'). */
  OTA_LLM_BILLING_TOPUP_CHECKOUT: '/api/stripe/create-checkout',
  /** Verify Stripe LLM top-up session after redirect. */
  OTA_LLM_BILLING_TOPUP_VERIFY: '/api/stripe/verify-session',
  /** Newsletter subscribers in DB (backend-server routes/email.js). POST body: { email, userInfo }. */
  EMAIL_NEWSLETTER_SUBSCRIBE: '/email/newsletter-subscribe',
  /** DEX complaints — POST { message, subject?, contactEmail?, walletAddress?, context?, attachments? }. attachments: [{ filename, mimeType, dataBase64 }] */
  DEX_COMPLAINTS: '/dex-complaints',
  /** Owner / site admin stats (POST body: password, actorEmail). backend-server routes/siteAdminRoutes.js */
  SITE_ADMIN_STATS: '/site-admin/stats',
  /** Owner paginated user list (POST body: password, actorEmail, limit?, offset?, q?). */
  SITE_ADMIN_USERS: '/site-admin/users',
  /** Owner KYC document queue (POST body: password, actorEmail, userId?, status?, limit?, offset?). */
  SITE_ADMIN_DOCUMENTS: '/site-admin/documents',
  /** Owner KYC document file (POST body: password, actorEmail, documentId). */
  SITE_ADMIN_DOCUMENT_FILE: '/site-admin/documents/file',
  /** Owner KYC document review (POST body: password, actorEmail, documentId, verificationStatus, verificationResult?). */
  SITE_ADMIN_DOCUMENT_REVIEW: '/site-admin/documents/review',
  OTA_CIRCUIT_BREAKER_RESET: '/ai-trading/circuit-breaker/reset',
  // OTA Direct Entry – user-initiated open/close, LLM may close
  OTA_DIRECT_ENTRY_OPEN: '/ai-trading/direct-entry/open',
  OTA_DIRECT_ENTRY_CLOSE: '/ai-trading/direct-entry/close',
  OTA_DIRECT_ENTRY_POSITION: '/ai-trading/direct-entry/position',
  OTA_DIRECT_ENTRY_CLOSED_POSITIONS: '/ai-trading/direct-entry/positions/closed',
  OTA_DIRECT_ENTRY_LLM_MAY_CLOSE: '/ai-trading/direct-entry/position/llm-may-close',
  OTA_DIRECT_ENTRY_ADVICE: '/ai-trading/direct-entry/advice',
  
  /** Render logs: persisted backend errors (GET /api/admin/render-errors). See docs/RENDER_ERRORS_UI_AND_BACKEND_SPEC.md */
  RENDER_ERRORS: '/admin/render-errors',
  /** Latest successful OTA Auto executions (GET /api/admin/render-successes), same auth as render-errors. */
  RENDER_SUCCESSES: '/admin/render-successes',
  
  // Legacy AI Trading endpoints (backward compatibility)
  AI_TRADING_START: '/ai-trading/start',
  AI_TRADING_STOP: '/ai-trading/stop',
  AI_TRADING_STATUS: '/ai-trading/status',
  
  // Strategies endpoints
  STRATEGIES_LIST: '/ai-trading/strategies',
  STRATEGIES_CREATE: '/ai-trading/strategies',
  STRATEGIES_UPDATE: (id) => `/ai-trading/strategies/${id}`,
  STRATEGIES_DELETE: (id) => `/ai-trading/strategies/${id}`,
  STRATEGIES_ENABLE: (id) => `/ai-trading/strategies/${id}/enable`,
  STRATEGIES_DISABLE: (id) => `/ai-trading/strategies/${id}/disable`,
  
  // Signals endpoints
  SIGNALS_LIST: '/ai-trading/signals',
  /** GET text/event-stream: same query as SIGNALS_LIST; Bearer through fetch streaming, not native EventSource. */
  SIGNALS_STREAM: '/ai-trading/signals/stream',
  SIGNALS_GET: (id) => `/ai-trading/signals/${id}`,
  SIGNALS_GENERATE: '/ai-trading/signals/generate',
  SIGNALS_VALIDATE: (id) => `/ai-trading/signals/${id}/validate`,
  SIGNALS_PERFORMANCE: '/ai-trading/signals/performance',
  
  // Dev Agent Runner endpoints (development only)
  // IMPORTANT: In production builds, these keys do NOT exist (keeps /dev/* out of the bundle).
  ...(process.env.NODE_ENV === 'development'
    ? {
        DEV_MARKET: '/dev/market',
        DEV_SIGNALS_GENERATE: '/dev/signals/generate',
        DEV_SIGNALS_LIST: '/dev/signals',
        DEV_SIGNALS_APPROVE: (id) => `/dev/signals/${id}/approve`,
        DEV_SIGNALS_REJECT: (id) => `/dev/signals/${id}/reject`,
        DEV_TRADES: '/dev/trades',
      }
    : {}),
  
  // Execution endpoints
  EXECUTION_EXECUTE: '/ai-trading/execution/execute',
  EXECUTION_TRADES: '/ai-trading/execution/trades',
  EXECUTION_TRADE: (id) => `/ai-trading/execution/trades/${id}`,
  EXECUTION_CANCEL: (id) => `/ai-trading/execution/trades/${id}/cancel`,
  // OTA Auto Execution status (backend worker)
  OTA_AUTO_EXECUTION_STATUS: '/ai-trading/auto-execution/status',
  /** Last execution for Activity panel: GET /api/ai-trading/last-signal?userId= */
  OTA_LAST_SIGNAL: '/ai-trading/last-signal',
  /** Auto session persistence in backend; worker knows who has Auto ON. See docs/OTA_AI_AUTO_SESSION_AND_OPENAI_MONITORING.md */
  OTA_AUTO_SESSION: '/ai-trading/auto/session',
  /** Safety controls: POST /api/ai-trading/safety/set body { walletAddress|userId, stopAll?, chains? }. Start Auto resets BSC. */
  OTA_SAFETY_SET: '/ai-trading/safety/set',
  /** Assumed risk level setting (conservative/moderate/aggressive/high); OpenAI adjusts confidence threshold. */
  OTA_POLICY_RISK_LEVEL: '/ai-trading/policy/risk-level',
  // OTA LLM: record manual trade outcome (backend inserts into ota.trade_outcomes, source='manual')
  OTA_RECORD_OUTCOME: '/ai-trading/record-outcome',
  // OTA LLM Agent: agent sessions (ReAct + tool calling)
  OTA_AGENT_SESSIONS: '/ai-trading/agent/sessions',
  /** POST body { userId, token?, riskLevel? } -> 202 { runId }. SSOT: docs/OTA_LIVE_AGENT_TRACE_PLAN.md */
  OTA_AGENT_TRACE_START: '/ai-trading/agent/trace/start',
  /** Prefix: `/${runId}/events` or `/${runId}/stream?userId=` */
  OTA_AGENT_TRACE_RUN_BASE: '/ai-trading/agent/trace',
  /** GET ?userId=&after= - trace from OTA executor (real runAgent), without POST /trace/start. */
  OTA_AGENT_TRACE_LIVE: '/ai-trading/agent/trace/live',
  /** Per-user Agent Mode toggle: GET/POST /api/ai-trading/policy/agent-mode */
  OTA_POLICY_AGENT_MODE: '/ai-trading/policy/agent-mode',
  /** Per-user bot auth duration preference: GET/POST /api/ai-trading/policy/bot-auth-duration (1d, 7d, 30d, unlimited) */
  OTA_POLICY_BOT_AUTH_DURATION: '/ai-trading/policy/bot-auth-duration',
  /** Unified bot auth status: preference + on-chain (reauthorizationRequired, onChainEffectiveActive). GET /api/ai-trading/policy/bot-auth-status */
  OTA_POLICY_BOT_AUTH_STATUS: '/ai-trading/policy/bot-auth-status',
  /** Per-user LLM tuning preferences. GET/POST /api/ai-trading/policy/llm-tuning */
  OTA_POLICY_LLM_TUNING: '/ai-trading/policy/llm-tuning',

  // Trade Cost Analytics (OTA)
  ANALYTICS_TRANSACTION_COSTS: '/ai-trading/analytics/transaction-costs',
  ANALYTICS_PORTFOLIO_SUMMARY: '/ai-trading/analytics/portfolio-summary',
  ANALYTICS_CAPITAL_BRIDGE: '/ai-trading/analytics/capital-bridge',
  /** GET ?userId= - FundsDeposited/FundsWithdrawn UserVault (BSC scan on server; much longer history than browser). */
  ANALYTICS_VAULT_CHAIN_HISTORY: '/ai-trading/analytics/vault-chain-history',
  /** POST - local DB indexing of DEPOSIT/WITHDRAW events from the wallet receipt. */
  ANALYTICS_VAULT_CHAIN_HISTORY_INDEX_MANUAL: '/ai-trading/analytics/vault-chain-history/index-manual',
  ANALYTICS_OPEN_POSITIONS_COST_BASIS: '/ai-trading/analytics/open-positions-cost-basis',
  ANALYTICS_OPEN_POSITIONS: '/ai-trading/analytics/open-positions',
  OTA_POSITIONS_CLOSE: '/ai-trading/ota/positions/close',
  /** POST body { userId, token } / DELETE ?walletAddress=&token= - suspend/resume LLM analysis per OTA position (Analytics). */
  OTA_POSITION_OPENAI_SUSPEND: '/ai-trading/ota/positions/openai-suspend',
  /** OTA manual close status: GET ?walletAddress=&token= -> { status: 'queued'|'completed'|'unknown', txHash?, amountIn?, amountOut?, executedAt? }. */
  OTA_MANUAL_CLOSE_STATUS: '/ai-trading/ota/manual-close-status',

  // OTA Short ops (staging / internal; auth: X-Ota-Short-Ops-Secret)
  /** GET /api/ai-trading/short/open-shorts?userId= (optional) → { success, positions, count } */
  OTA_SHORT_OPEN_SHORTS: '/ai-trading/short/open-shorts',
  /** GET /api/ai-trading/short/short-activity?userId=&limit= → { success, activity, count } */
  OTA_SHORT_ACTIVITY: '/ai-trading/short/short-activity',
  /** POST /api/ai-trading/short/manual-close body { userId, symbol, exitMark }; exitMark required (mark price > 0). */
  OTA_SHORT_MANUAL_CLOSE: '/ai-trading/short/manual-close',
  /** POST /api/ai-trading/short/reset-kill body { userId } */
  OTA_SHORT_RESET_KILL: '/ai-trading/short/reset-kill',
  /** POST /api/ai-trading/short/activate-kill body { userId, reason? } */
  OTA_SHORT_ACTIVATE_KILL: '/ai-trading/short/activate-kill',
  /** POST /api/ai-trading/short/token-block body { userId, symbol, durationMinutes?, permanent? } */
  OTA_SHORT_TOKEN_BLOCK: '/ai-trading/short/token-block',
  /** POST /api/ai-trading/short/token-block-clear body { userId, symbol } */
  OTA_SHORT_TOKEN_BLOCK_CLEAR: '/ai-trading/short/token-block-clear',
  /** GET /api/ai-trading/short/token-blocks?userId= */
  OTA_SHORT_TOKEN_BLOCKS: '/ai-trading/short/token-blocks',
  /** POST body { userId, symbols[], permanent?, durationMinutes? } */
  OTA_SHORT_TOKEN_BLOCK_BULK: '/ai-trading/short/token-block-bulk',
  /** POST body { userId } - clears all per-token blocks. */
  OTA_SHORT_TOKEN_BLOCK_CLEAR_ALL: '/ai-trading/short/token-block-clear-all',
  /** POST /api/ai-trading/short/backfill-metadata - updates missing metadata for old positions. */
  OTA_SHORT_BACKFILL_METADATA: '/ai-trading/short/backfill-metadata',
  /** GET /api/ai-trading/short/rejections?userId=&limit= → { success, rejections, count } */
  OTA_SHORT_REJECTIONS: '/ai-trading/short/rejections',
  /** GET /api/ai-trading/short/kill-status?userId= → { success, killStatus, count } */
  OTA_SHORT_KILL_STATUS: '/ai-trading/short/kill-status',
  /** GET /api/ai-trading/short/executor-decisions?userId=&token=&limit= → { success, decisions, count } */
  OTA_SHORT_EXECUTOR_DECISIONS: '/ai-trading/short/executor-decisions',
  /** Phase 3b: gate + guardrails, without sensitive values. Auth: X-Ota-Short-Ops-Secret. */
  OTA_SHORT_LIVE_STATUS: '/ai-trading/short/live-status',
  /** Phase 3c: read-only mark price de la venue. Query: symbol= (default BTC). Auth: X-Ota-Short-Ops-Secret. */
  OTA_SHORT_VENUE_MARK: '/ai-trading/short/venue-mark',
  OTA_SHORT_VENUE_FUNDING: '/ai-trading/short/venue-funding',
  /** GET real FUNDING_FEE sum (Binance income) - symbol + startTime|since. */
  OTA_SHORT_VENUE_FUNDING_ACC: '/ai-trading/short/venue-funding-acc',
  OTA_SHORT_VENUE_POSITION: '/ai-trading/short/venue-position',
  OTA_SHORT_VENUE_MARGIN: '/ai-trading/short/venue-margin',
  OTA_SHORT_VENUE_RECONCILE: '/ai-trading/short/venue-reconcile',
  OTA_SHORT_VENUE_MARGIN_MODE: '/ai-trading/short/venue-margin-mode',
  /** GET /api/ai-trading/short/win-rate-stats?userId=&days= → win rate real per token + global + confidence buckets */
  OTA_SHORT_WIN_RATE_STATS: '/ai-trading/short/win-rate-stats',
  /** POST: per-open SHORT position — OTA must not auto-close at a net loss (this position only). Auth: X-Ota-Short-Ops-Secret */
  OTA_SHORT_POSITION_LOSS_CLOSE_GUARD: '/ai-trading/short/position-loss-close-guard',

  // OTA Long Futures ops (staging / internal; auth: X-Ota-Long-Ops-Secret)
  OTA_LONG_OPEN_LONGS: '/ai-trading/long/open-longs',
  OTA_LONG_ACTIVITY: '/ai-trading/long/long-activity',
  OTA_LONG_MANUAL_CLOSE: '/ai-trading/long/manual-close',
  OTA_LONG_RESET_KILL: '/ai-trading/long/reset-kill',
  OTA_LONG_ACTIVATE_KILL: '/ai-trading/long/activate-kill',
  OTA_LONG_TOKEN_BLOCK: '/ai-trading/long/token-block',
  OTA_LONG_TOKEN_BLOCK_CLEAR: '/ai-trading/long/token-block-clear',
  OTA_LONG_TOKEN_BLOCKS: '/ai-trading/long/token-blocks',
  OTA_LONG_TOKEN_BLOCK_BULK: '/ai-trading/long/token-block-bulk',
  OTA_LONG_TOKEN_BLOCK_CLEAR_ALL: '/ai-trading/long/token-block-clear-all',
  /** POST: per-open-position flag. OTA must not auto-close at a loss for this position only. */
  OTA_LONG_POSITION_LOSS_CLOSE_GUARD: '/ai-trading/long/position-loss-close-guard',
  OTA_LONG_REJECTIONS: '/ai-trading/long/rejections',
  OTA_LONG_KILL_STATUS: '/ai-trading/long/kill-status',
  OTA_LONG_EXECUTOR_DECISIONS: '/ai-trading/long/executor-decisions',
  OTA_LONG_LIVE_STATUS: '/ai-trading/long/live-status',
  OTA_LONG_VENUE_MARK: '/ai-trading/long/venue-mark',
  OTA_LONG_VENUE_FUNDING: '/ai-trading/long/venue-funding',
  OTA_LONG_VENUE_FUNDING_ACC: '/ai-trading/long/venue-funding-acc',
  OTA_LONG_VENUE_POSITION: '/ai-trading/long/venue-position',
  OTA_LONG_VENUE_MARGIN: '/ai-trading/long/venue-margin',
  OTA_LONG_VENUE_RECONCILE: '/ai-trading/long/venue-reconcile',
  OTA_LONG_VENUE_MARGIN_MODE: '/ai-trading/long/venue-margin-mode',
  OTA_LONG_RECENT_SIGNALS: '/ai-trading/long/recent-llm-signals',
  /** GET /api/ai-trading/long/win-rate-stats?userId=&days= - mirrors short; auth: X-Ota-Long-Ops-Secret. */
  OTA_LONG_WIN_RATE_STATS: '/ai-trading/long/win-rate-stats',

  // Per-user Binance Futures credentials. The backend derives the user from the
  // authenticated wallet session and never returns API keys or secrets.
  OTA_BINANCE_FUTURES_CREDENTIALS: '/ai-trading/binance-futures/credentials',
  OTA_BINANCE_FUTURES_CREDENTIALS_STATUS: '/ai-trading/binance-futures/credentials/status',

  // Performance endpoints
  PERFORMANCE_METRICS: '/ai-trading/performance/metrics',
  PERFORMANCE_PROFIT: '/ai-trading/performance/profit',
  PERFORMANCE_RISK: '/ai-trading/performance/risk-metrics',
  PERFORMANCE_TOKEN_BREAKDOWN: '/ai-trading/performance/token-breakdown',
  PERFORMANCE_RISK_LIMITS: '/ai-trading/performance/risk-limits',
  PERFORMANCE_HISTORY: '/ai-trading/performance/history',
  PERFORMANCE_CHARTS: '/ai-trading/performance/charts',
  
  // Health
  HEALTH: '/health'
};
