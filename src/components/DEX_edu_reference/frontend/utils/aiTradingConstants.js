/**
 * 🤖 AI Trading Constants - OpenAI Trading Agent (OTA)
 * 
 * Constante standardizate pentru OpenAI Trading Agent:
 * - Nume standardizat: OpenAI Trading Agent (OTA)
 * - Provider: OpenAI
 * - Short name: OTA
 * 
 * @module aiTradingConstants
 */

// AI Trading Agent Naming
export const OPENAI_TRADING_AGENT_NAME = 'OpenAI Trading Agent';
export const OTA_SHORT_NAME = 'OTA';
export const AI_PROVIDER = 'OpenAI';
export const AI_PROVIDER_BADGE = 'Powered by OpenAI';

// Display Names
export const AGENT_DISPLAY_NAME = OPENAI_TRADING_AGENT_NAME;
export const AGENT_DISPLAY_SHORT = OTA_SHORT_NAME;

// Status Messages
export const AGENT_STATUS_MESSAGES = {
  starting: `${OPENAI_TRADING_AGENT_NAME} is starting...`,
  running: `${OPENAI_TRADING_AGENT_NAME} is running`,
  stopped: `${OPENAI_TRADING_AGENT_NAME} is stopped`,
  paused: `${OPENAI_TRADING_AGENT_NAME} is paused`,
  error: `${OPENAI_TRADING_AGENT_NAME} encountered an error`
};

// UI Labels
export const AGENT_UI_LABELS = {
  start: `Start ${OTA_SHORT_NAME}`,
  stop: `Stop ${OTA_SHORT_NAME}`,
  configure: `Configure ${OTA_SHORT_NAME}`,
  status: `${OTA_SHORT_NAME} Status`,
  statistics: `${OTA_SHORT_NAME} Statistics`,
  controls: `${OTA_SHORT_NAME} Controls`
};

// Export default for convenience
export default {
  OPENAI_TRADING_AGENT_NAME,
  OTA_SHORT_NAME,
  AI_PROVIDER,
  AI_PROVIDER_BADGE,
  AGENT_DISPLAY_NAME,
  AGENT_DISPLAY_SHORT,
  AGENT_STATUS_MESSAGES,
  AGENT_UI_LABELS
};
