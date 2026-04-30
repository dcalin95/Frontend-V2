/**
 * Client Anthropic Claude — apeluri către POST /api/claude/* (separat de aiTradingApiService / OpenAI).
 */

import { otaApiRequest } from '../utils/otaApiClient';

/**
 * @param {Record<string, unknown>} tradeData
 * @returns {Promise<{ analysis?: object, provider?: string }>}
 */
export async function postClaudeAnalyze(tradeData) {
  return otaApiRequest('/claude/analyze', {
    method: 'POST',
    body: JSON.stringify({ tradeData }),
    timeoutMs: 90000,
  });
}
