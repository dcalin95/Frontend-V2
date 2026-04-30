import { useCallback } from 'react';
import { useAIProvider } from '../context/AIProviderContext';
import { claudeApi } from '../services/claudeApiService';
import { otaApiRequest, otaApiChatStream } from '../components/DEX_edu_reference/frontend/utils/otaApiClient';
import { getOtaWalletSessionStoredAddress } from '../components/DEX_edu_reference/frontend/utils/otaWalletSession';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import { analyzeMarketWithLlmProvider } from '../components/DEX_edu_reference/frontend/services/otaAnalyzeFacade';

/**
 * Când motorul e „OTA only”, nu există apel LLM — mesajul vechi părea un răspuns la întrebare (ex. „am bani?”).
 * Explicăm explicit că întrebarea nu e procesată aici și unde caută utilizatorul date reale.
 */
const CHAT_DISABLED_OTA_ONLY_MESSAGE = [
  'With OTA Engine selected, this assistant does not call OpenAI or Claude, so your message is not processed in this panel.',
  '',
  '• For chat answers: in the AI Engine selector (top bar), choose OpenAI or Claude.',
  '• For balances and account data: open Personal account or Dashboard — not this chat while OTA Engine is selected.',
].join('\n');

function contentToPlainString(content) {
  if (content == null) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const parts = [];
    for (const block of content) {
      if (block && typeof block === 'object' && block.type === 'text' && block.text) {
        parts.push(String(block.text));
      }
    }
    return parts.join('\n') || JSON.stringify(content);
  }
  return String(content);
}

/** Istoric compatibil Anthropic: doar user/assistant, content string. */
function toClaudeHistory(messages) {
  if (!Array.isArray(messages)) return [];
  const out = [];
  for (const m of messages) {
    if (!m || typeof m !== 'object') continue;
    const role = m.role === 'assistant' ? 'assistant' : m.role === 'user' ? 'user' : null;
    if (!role) continue;
    const text = contentToPlainString(m.content).trim();
    if (!text) continue;
    out.push({ role, content: text });
  }
  return out.slice(-24);
}

/** Adresa pentru `claimed identity` (middleware): preferă explicit (portofel conectat), apoi localStorage. */
function resolveOtaClaimedWalletAddress(explicit) {
  const e = explicit != null && String(explicit).trim();
  if (e) return e.toLowerCase();
  const s = getOtaWalletSessionStoredAddress();
  return s ? String(s).toLowerCase() : null;
}

/** Middleware OTA (OTA_WALLET_AUTH_ENFORCE): trebuie `walletAddress` în body ca să existe „claimed identity” lângă Bearer. */
function otaChatRequestBody(messages, systemPrompt, walletAddressOverride) {
  const wa = resolveOtaClaimedWalletAddress(walletAddressOverride);
  return wa ? { messages, systemPrompt, walletAddress: wa } : { messages, systemPrompt };
}

/**
 * Hook unificat: chat (OpenAI OTA / Claude / mesaj fără LLM) + analyze prin fațada existentă.
 */
export function useAIChat() {
  const { provider } = useAIProvider();

  /**
   * @param {{ messages: Array<{ role: string, content: unknown }>, systemPrompt: string, walletAddress?: string }} payload
   * @returns {Promise<{ content?: string, [k: string]: unknown }>}
   */
  const postChat = useCallback(
    async ({ messages, systemPrompt, walletAddress: walletAddressOverride }) => {
      if (provider === 'ota') {
        return {
          content: CHAT_DISABLED_OTA_ONLY_MESSAGE,
        };
      }

      if (provider === 'claude') {
        const list = Array.isArray(messages) ? messages : [];
        if (list.length === 0) {
          return { content: '' };
        }
        const last = list[list.length - 1];
        const prior = list.slice(0, -1);
        const userText = contentToPlainString(last?.content).trim() || ' ';
        const history = toClaudeHistory(prior);
        const data = await claudeApi.chat(userText, history, systemPrompt);
        const text = data?.response != null ? String(data.response) : '';
        return { ...data, content: text };
      }

      return otaApiRequest(API_ENDPOINTS.OTA_CHAT, {
        method: 'POST',
        body: JSON.stringify(otaChatRequestBody(messages, systemPrompt, walletAddressOverride)),
      });
    },
    [provider],
  );

  /**
   * Chat cu streaming (tokeni) pentru OpenAI/OTA backend; Claude/OTA-only emulează un singur delta la final.
   * @param {{ messages: Array, systemPrompt: string, walletAddress?: string, onDelta?: (chunk: string, full: string) => void, signal?: AbortSignal }} payload
   */
  const postChatStream = useCallback(
    async ({ messages, systemPrompt, walletAddress: walletAddressOverride, onDelta, signal }) => {
      if (provider === 'ota') {
        const text = CHAT_DISABLED_OTA_ONLY_MESSAGE;
        if (typeof onDelta === 'function') onDelta(text, text);
        return { content: text };
      }

      if (provider === 'claude') {
        const list = Array.isArray(messages) ? messages : [];
        if (list.length === 0) {
          return { content: '' };
        }
        const last = list[list.length - 1];
        const prior = list.slice(0, -1);
        const userText = contentToPlainString(last?.content).trim() || ' ';
        const history = toClaudeHistory(prior);
        const data = await claudeApi.chat(userText, history, systemPrompt);
        const text = data?.response != null ? String(data.response) : '';
        if (typeof onDelta === 'function' && text) onDelta(text, text);
        return { ...data, content: text };
      }

      return otaApiChatStream(API_ENDPOINTS.OTA_CHAT, {
        body: otaChatRequestBody(messages, systemPrompt, walletAddressOverride),
        onDelta,
        signal,
      });
    },
    [provider],
  );

  const analyzeTrade = useCallback(async (tradeData) => {
    if (tradeData == null) {
      return analyzeMarketWithLlmProvider('BTC', {});
    }
    if (typeof tradeData === 'string') {
      return analyzeMarketWithLlmProvider(tradeData, {});
    }
    const token =
      typeof tradeData.token === 'string'
        ? tradeData.token
        : tradeData.symbol != null
          ? String(tradeData.symbol)
          : 'BTC';
    const { token: _t, symbol: _s, ...rest } = tradeData;
    return analyzeMarketWithLlmProvider(token, rest);
  }, []);

  return { postChat, postChatStream, analyzeTrade, provider };
}
