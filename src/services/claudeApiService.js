/**
 * Client pentru POST /api/claude/* — folosește același transport ca OTA (credentials + base URL din runtime).
 */
import { otaApiRequest } from '../components/DEX_edu_reference/frontend/utils/otaApiClient';

export const claudeApi = {
  /**
   * @param {string} message
   * @param {Array<{ role?: string, content?: unknown }>} history
   * @param {string} [systemPrompt] – același system prompt ca la OpenAI OTA Chat (reguli + CONTEXT DOCUMENTAție); obligatoriu pentru comportament aliniat.
   */
  chat: async (message, history = [], systemPrompt) => {
    const body = { message, history };
    if (typeof systemPrompt === 'string' && systemPrompt.trim()) {
      body.systemPrompt = systemPrompt.trim();
    }
    return otaApiRequest('/claude/chat', {
      method: 'POST',
      body: JSON.stringify(body),
      timeoutMs: 120000,
    });
  },

  /** @param {Record<string, unknown>} tradeData */
  analyze: async (tradeData) => {
    return otaApiRequest('/claude/analyze', {
      method: 'POST',
      body: JSON.stringify({ tradeData }),
      timeoutMs: 90000,
    });
  },

  academy: async (question, topic = 'bitcoin') => {
    return otaApiRequest('/claude/academy', {
      method: 'POST',
      body: JSON.stringify({ question, topic }),
      timeoutMs: 90000,
    });
  },
};
