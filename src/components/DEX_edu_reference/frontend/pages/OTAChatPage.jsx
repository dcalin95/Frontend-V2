/**
 * Direct chat with OpenAI (OTA), using the same OPENAI_API_KEY from Render.
 * Area where you can talk to your model (key paid by you).
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/apiEndpoints.js';
import { otaApiRequest } from '../utils/otaApiClient';
import { useAIChat } from '../../../../hooks/useAIChat';
import { useDexAuth } from '../context/DexAuthContext';
import OTALogo from '../components/ai-trading/OTALogo';
import { OTA_SYSTEM_PROMPT } from '../../ota/docs/otaSystemPrompt';
import { getOtaDocsContextForPrompt } from '../../ota/docs/otaDocsContextForPrompt';
import { Modal } from '../components/common/Modal';
import { Lock, Eye, EyeOff, ImagePlus, X, User, MessageSquare } from 'lucide-react';
import OtaBscAutoStatusBanner from '../components/ai-trading/OtaBscAutoStatusBanner';
import { getOtaChatLiveContextBlock, resolveOtaChatLiveUserId } from '../utils/otaChatLiveContext';
import { useWallet } from '../../context/WalletContext.jsx';
import { useOtaEvmWalletAuthSync } from '../hooks/useOtaEvmWalletAuthSync';
import { ensureOtaWalletForApiIfNeeded, getOtaWalletSessionStoredAddress } from '../utils/otaWalletSession';
import { OtaChatMarkdown } from '../components/ota-chat/OtaChatMarkdown';
import '../styles/components/ota-chat-page.css';

/** Maximum image size (MB), to avoid an oversized payload. */
const MAX_IMAGE_MB = 5;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

/** Local OTA server: memory only when the app is on localhost. */
const OTA_LOCAL_SERVER = typeof window !== 'undefined' && window.location?.hostname === 'localhost'
  ? 'http://localhost:3765'
  : '';
/** For file reads: always try localhost so online chat can access local files when the server runs on the PC. */
const OTA_LOCAL_FILE_SERVER = 'http://localhost:3765';

/** localStorage per wallet: backup + fast load; server is SSOT when an OTA session exists. */
const OTA_CHAT_LOCAL_PREFIX = 'ota-chat-v2-';
const OTA_CHAT_LEGACY_SESSION_KEY = 'ota-chat-messages';
const OTA_CHAT_MAX_SAVED = 50;
const OTA_CHAT_SERVER_SYNC_DEBOUNCE_MS = 1400;

/** Trimite la API doar ultimele N mesaje (cost prompt ∝ istoric). Default 32; override REACT_APP_OTA_CHAT_MAX_HISTORY_MESSAGES (4–96). */
function readOtaChatMaxHistoryMessages() {
  const raw = typeof process !== 'undefined' && process.env && process.env.REACT_APP_OTA_CHAT_MAX_HISTORY_MESSAGES;
  const n = parseInt(String(raw ?? '').trim(), 10);
  if (Number.isFinite(n) && n >= 4 && n <= 96) return n;
  return 32;
}

const OTA_CHAT_MAX_HISTORY_MESSAGES = readOtaChatMaxHistoryMessages();

/** Starter prompts (English UI) — typical “assistant” empty-state chips */
const CHAT_STARTER_PROMPTS = [
  'What is OTA Advisory mode?',
  'Where can I submit feedback or a complaint?',
  'How does Vault differ from my open positions?',
];

function sliceOtaChatHistoryForApi(arr) {
  if (!Array.isArray(arr) || arr.length <= OTA_CHAT_MAX_HISTORY_MESSAGES) return arr;
  return arr.slice(-OTA_CHAT_MAX_HISTORY_MESSAGES);
}

/** ChatGPT-style thinking line: muted gray, no bubble; letters + dots shimmer with staggered fade. */
function OtaChatThinking() {
  const label = 'Thinking';
  return (
    <div className="ota-chat-thinking" role="status" aria-live="polite">
      <span className="ota-chat-thinking__word" aria-hidden="true">
        {label.split('').map((ch, i) => (
          <span key={`t-${i}`} className="ota-chat-thinking__glyph" style={{ '--ota-i': i }}>
            {ch}
          </span>
        ))}
      </span>
      <span className="ota-chat-thinking__ellipsis" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={`d-${i}`} className="ota-chat-thinking__glyph" style={{ '--ota-i': label.length + i }}>
            .
          </span>
        ))}
      </span>
      <span className="ota-chat-sr-only">Assistant is thinking</span>
    </div>
  );
}

const RATE_LIMIT_RETRY_DELAY_MS = 4000;

/** OTA middleware: `claimed identity` in query (GET). Prefer connected wallet address (EVM), then localStorage. */
function appendOtaClaimedWalletQuery(endpoint, preferredAddr) {
  const w =
    (preferredAddr && String(preferredAddr).trim()) || getOtaWalletSessionStoredAddress();
  if (!w) return endpoint;
  const sep = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${sep}walletAddress=${encodeURIComponent(String(w).toLowerCase())}`;
}

function jsonBodyWithOtaWallet(obj, preferredAddr) {
  const w =
    (preferredAddr && String(preferredAddr).trim()) || getOtaWalletSessionStoredAddress();
  if (!w) return JSON.stringify(obj);
  return JSON.stringify({ ...obj, walletAddress: String(w).toLowerCase() });
}

function numUsageToken(x) {
  const n = typeof x === 'number' ? x : parseFloat(String(x ?? '').trim());
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Normalizes usage fields (OpenAI / Anthropic aliases). */
function normalizeOtaChatUsage(raw) {
  if (!raw || typeof raw !== 'object') return null;
  let pin = numUsageToken(raw.prompt_tokens) ?? numUsageToken(raw.input_tokens);
  let cout = numUsageToken(raw.completion_tokens) ?? numUsageToken(raw.output_tokens);
  const tot = numUsageToken(raw.total_tokens);
  if (pin != null && cout == null && tot != null && tot >= pin) {
    cout = tot - pin;
  }
  if (cout != null && pin == null && tot != null && tot >= cout) {
    pin = tot - cout;
  }
  return {
    ...raw,
    ...(pin != null ? { prompt_tokens: pin } : {}),
    ...(cout != null ? { completion_tokens: cout } : {}),
    ...(tot != null ? { total_tokens: tot } : {}),
  };
}

function formatTokenUsageLine(usage) {
  if (!usage || typeof usage !== 'object') return null;
  const p = usage.prompt_tokens;
  const c = usage.completion_tokens;
  const t = usage.total_tokens;
  const parts = [];
  if (Number.isFinite(p)) parts.push(`input ${p}`);
  if (Number.isFinite(c)) parts.push(`output ${c}`);
  if (Number.isFinite(t)) parts.push(`total ${t}`);
  if (parts.length === 0) return null;
  return parts.join(' · ');
}

function localStorageKeyForWallet(walletAddr) {
  return `${OTA_CHAT_LOCAL_PREFIX}${walletAddr ? String(walletAddr).toLowerCase() : 'anon'}`;
}

function loadLocalChatMessages(walletAddr) {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(localStorageKeyForWallet(walletAddr)) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-OTA_CHAT_MAX_SAVED) : [];
  } catch {
    return [];
  }
}

function saveLocalChatMessages(walletAddr, messages) {
  try {
    if (typeof localStorage === 'undefined') return;
    const key = localStorageKeyForWallet(walletAddr);
    if (!Array.isArray(messages) || messages.length === 0) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(messages.slice(-OTA_CHAT_MAX_SAVED)));
  } catch (_) {}
}

function parseVaultSave(content) {
  const entries = [];
  const inlineRe = /\[OTA-VAULT-SAVE\s+key="([^"]+)"\s+value="([^"]*)"\]/gi;
  let m;
  while ((m = inlineRe.exec(content)) !== null) {
    const key = (m[1] || '').trim();
    const value = (m[2] || '').replace(/\\"/g, '"');
    if (key) entries.push({ key, value });
  }
  const multilineRe = /\[OTA-VAULT-SAVE\s+key="([^"]+)"\]\s*value:\s*\|?\s*([\s\S]*?)\s*\[\/OTA-VAULT-SAVE\]/gi;
  while ((m = multilineRe.exec(content)) !== null) {
    const key = (m[1] || '').trim();
    const value = (m[2] || '').replace(/^\n?([ \t]*)/gm, '').trim();
    if (key && !entries.some(e => e.key === key)) entries.push({ key, value });
  }
  return entries;
}

function dedupeVaultEntries(entries) {
  const byKey = new Map();
  entries.forEach(e => byKey.set(e.key, e.value));
  return [...byKey.entries()].map(([key, value]) => ({ key, value }));
}

function redactVaultFromContent(content) {
  let out = content;
  out = out.replace(/\[OTA-VAULT-SAVE\s+key="[^"]+"\s+value="[^"]*"\]/gi, '[OTA-VAULT-SAVE key="..." value="[stored in Vault – for you only]"]');
  out = out.replace(/\[OTA-VAULT-SAVE\s+key="[^"]+"\]\s*value:\s*\|?\s*[\s\S]*?\s*\[\/OTA-VAULT-SAVE\]/gi, '[OTA-VAULT-SAVE key="..." value="[stored in Vault – for you only]"]');
  return out;
}

export default function OTAChatPage() {
  const { postChat, postChatStream, provider } = useAIChat();
  const { user, associatedWalletAddress, connectedWalletAddress } = useDexAuth();
  const { isConnected, walletType, walletAddress, signer } = useWallet();
  /** Bearer otaw_* session for /ai-trading (vault, live, chat), same flow as OTAPage. */
  useOtaEvmWalletAuthSync({
    enabled: Boolean(isConnected && walletAddress && walletType === 'EVM' && signer),
  });
  /** For OTA middleware: always use UI EVM address when available (ADDR_KEY can be missing after verify). */
  const otaClaimEvm =
    walletType === 'EVM' && walletAddress
      ? String(walletAddress).toLowerCase()
      : getOtaWalletSessionStoredAddress() || undefined;
  const [messages, setMessages] = useState(() => []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  /** Streaming OpenAI response (hides separate "Typing..." bubbles). */
  const [streamingAssistant, setStreamingAssistant] = useState(false);
  /** Last OpenAI usage (prompt/completion/total tokens) for the last successful response. */
  const [lastUsage, setLastUsage] = useState(null);
  /** Short message while waiting before automatic retry on 429. */
  const [rateLimitNote, setRateLimitNote] = useState(null);
  const [error, setError] = useState(null);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [vaultEntries, setVaultEntries] = useState([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultReveal, setVaultReveal] = useState({});
  /** Attached image for analysis (vision): { dataUrl } - base64 data URL. */
  const [attachedImage, setAttachedImage] = useState(null);
  /** Server sync metadata: retention days, last server save. */
  const [transcriptMeta, setTranscriptMeta] = useState(null);
  const fileInputRef = useRef(null);
  /** Scroll container — nu folosi scrollIntoView pe anchor (ridica tot .dex-page-wrapper). */
  const chatScrollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  /** Migrates old sessionStorage -> localStorage once. */
  useEffect(() => {
    try {
      if (typeof sessionStorage === 'undefined' || typeof localStorage === 'undefined') return;
      const leg = sessionStorage.getItem(OTA_CHAT_LEGACY_SESSION_KEY);
      if (leg && !localStorage.getItem(`${OTA_CHAT_LOCAL_PREFIX}anon`)) {
        localStorage.setItem(`${OTA_CHAT_LOCAL_PREFIX}anon`, leg);
        sessionStorage.removeItem(OTA_CHAT_LEGACY_SESSION_KEY);
      }
    } catch (_) {}
  }, []);

  /** Loads local + then server history (same wallet, other browsers) when an EVM address exists. */
  useEffect(() => {
    const local = loadLocalChatMessages(otaClaimEvm);
    setMessages(local);
    if (!otaClaimEvm) {
      setTranscriptMeta(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const url = appendOtaClaimedWalletQuery(API_ENDPOINTS.OTA_CHAT_TRANSCRIPT, otaClaimEvm);
        const data = await otaApiRequest(url, { method: 'GET' });
        if (cancelled || !data?.ok) return;
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages.slice(-OTA_CHAT_MAX_SAVED));
          saveLocalChatMessages(otaClaimEvm, data.messages);
        }
        setTranscriptMeta({
          retentionDays: typeof data.retentionDays === 'number' ? data.retentionDays : 5,
          updatedAt: data.updatedAt || null,
          expired: Boolean(data.expired),
        });
      } catch {
        if (!cancelled) setTranscriptMeta((m) => m || { retentionDays: 5, updatedAt: null, expired: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [otaClaimEvm]);

  /** Local backup la fiecare schimbare. */
  useEffect(() => {
    saveLocalChatMessages(otaClaimEvm, messages);
  }, [messages, otaClaimEvm]);

  /** Server sync (debounced), cross-browser when OTA Bearer is active. */
  useEffect(() => {
    if (!otaClaimEvm || !Array.isArray(messages) || messages.length === 0) return;
    const t = setTimeout(() => {
      otaApiRequest(API_ENDPOINTS.OTA_CHAT_TRANSCRIPT, {
        method: 'PUT',
        body: jsonBodyWithOtaWallet({ messages: messages.slice(-OTA_CHAT_MAX_SAVED) }, otaClaimEvm),
      }).catch(() => {});
    }, OTA_CHAT_SERVER_SYNC_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [messages, otaClaimEvm]);

  /** System prompt with identity + documentation context (RAG); OTA answers only from docs. */
  const systemPromptWithIdentity = useMemo(() => {
    let base = OTA_SYSTEM_PROMPT;
    const docsContext = getOtaDocsContextForPrompt();
    if (docsContext) {
      base = `${base}\n\n---\nDOCUMENTATION CONTEXT (source of truth - do not invent outside this context):\n${docsContext}`;
    }
    if (user?.id) {
      const who = [user.email, user.username].filter(Boolean).join(' ') || `id:${user.id}`;
      base = `${base}\n\nCURRENT USER (owner, recognize them): ${who}. This is the user you are talking to now.`;
    }
    /** Without this, the model does not "see" the wallet: the JSON body has wallet only for auth, not as prompt text. */
    if (isConnected && walletType === 'EVM' && walletAddress) {
      const evmLower = String(walletAddress).toLowerCase();
      base = `${base}\n\nCONNECTED SESSION (canonical - use for "what wallet am I using?", "what address do I use in the app?"):\n- EVM wallet connected in BitSwap DEX for this chat: ${evmLower}`;
    } else if (isConnected && walletType && walletType !== 'EVM') {
      base = `${base}\n\nCONNECTED SESSION:\n- No EVM wallet is connected in the UI for this chat (current type: ${walletType}).`;
    } else {
      base = `${base}\n\nCONNECTED SESSION:\n- No wallet is connected in the UI for this chat.`;
    }
    return base;
  }, [user?.id, user?.email, user?.username, isConnected, walletType, walletAddress]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const el = chatScrollRef.current;
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * One retry after 429 (rate limit), like otaApiClient.
   * @param {{ messages: unknown[], systemPrompt: string }} payload
   */
  const postChatWith429Retry = useCallback(
    async (payload) => {
      try {
        return await postChat(payload);
      } catch (e) {
        if (e?.failedStatus === 429) {
          setRateLimitNote('Rate limited — retrying once in a few seconds…');
          await new Promise((r) => setTimeout(r, RATE_LIMIT_RETRY_DELAY_MS));
          setRateLimitNote(null);
          return await postChat(payload);
        }
        throw e;
      }
    },
    [postChat]
  );

  const postChatStreamWith429Retry = useCallback(
    async (payload) => {
      try {
        return await postChatStream(payload);
      } catch (e) {
        if (e?.failedStatus === 429) {
          setRateLimitNote('Rate limited — retrying once in a few seconds…');
          await new Promise((r) => setTimeout(r, RATE_LIMIT_RETRY_DELAY_MS));
          setRateLimitNote(null);
          return await postChatStream(payload);
        }
        throw e;
      }
    },
    [postChatStream]
  );

  const lastUsageDisplay = useMemo(() => formatTokenUsageLine(lastUsage), [lastUsage]);

  const openVault = () => {
    setVaultOpen(true);
    setVaultReveal({});
  };

  useEffect(() => {
    if (!vaultOpen || !user?.id) return;
    setVaultLoading(true);
    otaApiRequest(appendOtaClaimedWalletQuery(API_ENDPOINTS.OTA_VAULT_GET, otaClaimEvm), { method: 'GET' })
      .then(data => setVaultEntries(Array.isArray(data?.entries) ? data.entries : []))
      .catch(() => setVaultEntries([]))
      .finally(() => setVaultLoading(false));
  }, [vaultOpen, user?.id, otaClaimEvm]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setError(`Image is too large (max ${MAX_IMAGE_MB} MB).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage({ dataUrl: reader.result });
      setError(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearAttachedImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async () => {
    const text = (input || '').trim();
    if ((!text && !attachedImage) || loading) return;

    /** User message content for API: string or array (text + image_url) for vision. */
    const userMessageContent = attachedImage
      ? [
          { type: 'text', text: text || 'Analyze this image.' },
          { type: 'image_url', image_url: { url: attachedImage.dataUrl } }
        ]
      : text;
    const userMessageDisplay = text ? (attachedImage ? text + ' [Image attached]' : text) : (attachedImage ? '[Image attached]' : '');
    const userMessage = { role: 'user', content: userMessageContent };
    const useOpenAiStream = provider === 'openai';
    setMessages(prev =>
      useOpenAiStream
        ? [...prev, { role: 'user', content: userMessageDisplay }, { role: 'assistant', content: '' }]
        : [...prev, { role: 'user', content: userMessageDisplay }]
    );
    if (useOpenAiStream) setStreamingAssistant(true);
    setInput('');
    clearAttachedImage();
    setLoading(true);
    setError(null);
    setRateLimitNote(null);

    try {
      /** Before any /ai-trading call: otaw_* token (challenge avoids race with quick Send). */
      if (isConnected && walletType === 'EVM' && signer && walletAddress) {
        await ensureOtaWalletForApiIfNeeded(signer, walletAddress);
      }

      /** Final system prompt: identity + docs + VAULT (if authenticated), so OTA answers from what it saved. */
      let systemPrompt = systemPromptWithIdentity;
      if (user?.id) {
        try {
          const vaultRes = await otaApiRequest(appendOtaClaimedWalletQuery(API_ENDPOINTS.OTA_VAULT_GET, otaClaimEvm), { method: 'GET' });
          const entries = Array.isArray(vaultRes?.entries) ? vaultRes.entries : [];
          if (entries.length > 0) {
            const vaultBlock = '\n\n---\nVAULT (info saved for you – answer from these when asked what you saved, what contract X has, etc.):\n' +
              entries.map(e => `${(e.key || '').trim()}=${String(e.value || '').trim()}`).filter(Boolean).join('\n');
            systemPrompt = systemPrompt + vaultBlock;
          }
        } catch (_) { /* backend without vault or unauthenticated */ }
      }

      const otaWalletId = resolveOtaChatLiveUserId(user, associatedWalletAddress, connectedWalletAddress, otaClaimEvm);
      try {
        /** Without wallet: still inject platformMarket (BTC ref. from backend). With wallet: + account data. */
        const liveBlock = await getOtaChatLiveContextBlock(otaWalletId || null);
        if (liveBlock) systemPrompt = systemPrompt + liveBlock;
      } catch (_) { /* optional snapshot */ }

      const history = [
        ...sliceOtaChatHistoryForApi(messages).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessageContent }
      ];

      let content = '';
      if (useOpenAiStream) {
        const res = await postChatStreamWith429Retry({
          messages: history,
          systemPrompt,
          walletAddress: otaClaimEvm,
          onDelta: (_chunk, full) => {
            setMessages(prev => {
              const next = [...prev];
              if (next.length && next[next.length - 1].role === 'assistant') {
                next[next.length - 1] = { role: 'assistant', content: full };
              }
              return next;
            });
          },
        });
        content = res.content != null ? String(res.content) : '';
        if (res.usage && typeof res.usage === 'object') {
          setLastUsage(normalizeOtaChatUsage(res.usage));
        }
        setStreamingAssistant(false);
      } else {
        const res = await postChatWith429Retry({
          messages: history,
          systemPrompt,
          walletAddress: otaClaimEvm,
        });
        content = res.content != null ? String(res.content) : '';
        if (res.usage && typeof res.usage === 'object') {
          setLastUsage(normalizeOtaChatUsage(res.usage));
        }
        setMessages(prev => [...prev, { role: 'assistant', content }]);
      }
      // Apply OTA writes/deletes: local (when running on localhost) + Render backend (always, also works on S3).
      if (content.includes('[OTA-MEMORY-SAVE]') || content.includes('[OTA-MEMORY-DELETE')) {
        if (OTA_LOCAL_SERVER) {
          try {
            await fetch(OTA_LOCAL_SERVER + '/ota-memory/apply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content })
            });
          } catch (_) { /* local not running */ }
        }
        try {
          await otaApiRequest(API_ENDPOINTS.OTA_MEMORY_APPLY, {
            method: 'POST',
            body: jsonBodyWithOtaWallet({ content }, otaClaimEvm)
          });
        } catch (_) { /* backend without endpoint or unauthenticated */ }
      }

      // Vault: sensitive info, backend only for authenticated owner; never raw values in chat.
      const rawVault = parseVaultSave(content);
      const vaultEntries = dedupeVaultEntries(rawVault);
      if (vaultEntries.length > 0) {
        if (user?.id) {
          try {
            await otaApiRequest(API_ENDPOINTS.OTA_VAULT_SET, {
              method: 'POST',
              body: jsonBodyWithOtaWallet({ entries: vaultEntries })
            });
          } catch (_) { /* backend without endpoint or unauthenticated */ }
        }
        setMessages(prev => prev.slice(0, -1).concat([{ role: 'assistant', content: redactVaultFromContent(content) }]));
      }

      // If OTA asks to read files via [OTA-READ path="..." [root="..."]], load and send follow-up.
      const readRegex = /\[OTA-READ\s+path="([^"]+)"(?:\s+root="([^"]*)")?\]/gi;
      const readItems = []; // { path, root }
      let readM;
      while ((readM = readRegex.exec(content)) !== null) {
        const p = (readM[1] || '').trim();
        const root = (readM[2] || '').trim() || 'frontend-edu';
        if (p && !readItems.some((x) => x.path === p && x.root === root)) readItems.push({ path: p, root });
      }
      if (readItems.length > 0) {
        let fileContentMsg = '';
        for (const { path: relPath, root } of readItems) {
          const q = 'path=' + encodeURIComponent(relPath) + (root && root !== 'frontend-edu' ? '&root=' + encodeURIComponent(root) : '');
          let data = null;
          try {
            const r = await fetch(OTA_LOCAL_FILE_SERVER + '/ota-files/read?' + q);
            if (r.ok) data = await r.json();
          } catch (_) { /* local not running or user is not on the same PC */ }
          if (!data) {
            try {
              data = await otaApiRequest(appendOtaClaimedWalletQuery(API_ENDPOINTS.OTA_FILES_READ + '?' + q, otaClaimEvm), { method: 'GET' });
            } catch (_) { /* backend without endpoint or unauthenticated */ }
          }
          if (data?.content != null) {
            const label = (data.root ? data.root + '/' : '') + (data.path || relPath);
            fileContentMsg += (fileContentMsg ? '\n\n' : '') + '**' + label + '**:\n```\n' + String(data.content).slice(0, 30000) + '\n```';
          } else {
            fileContentMsg += (fileContentMsg ? '\n\n' : '') + '**' + (root !== 'frontend-edu' ? root + '/' : '') + relPath + '**: (file not found or inaccessible)';
          }
        }
        if (fileContentMsg) {
          const followUpUser = 'File contents (loaded automatically):\n\n' + fileContentMsg;
          const historyWithFile = [
            ...sliceOtaChatHistoryForApi(messages),
            userMessage,
            { role: 'assistant', content },
            { role: 'user', content: followUpUser }
          ];
          const mapMsg = (m) => ({ role: m.role, content: m.content });
          if (useOpenAiStream) {
            setStreamingAssistant(true);
            setMessages(prev => [
              ...prev,
              { role: 'user', content: '[Files loaded for OTA]' },
              { role: 'assistant', content: '' }
            ]);
            const res2 = await postChatStreamWith429Retry({
              messages: historyWithFile.map(mapMsg),
              systemPrompt,
              walletAddress: otaClaimEvm,
              onDelta: (_chunk, full) => {
                setMessages(prevMsgs => {
                  const next = [...prevMsgs];
                  if (next.length && next[next.length - 1].role === 'assistant') {
                    next[next.length - 1] = { role: 'assistant', content: full };
                  }
                  return next;
                });
              },
            });
            if (res2.usage && typeof res2.usage === 'object') {
              setLastUsage(normalizeOtaChatUsage(res2.usage));
            }
            setStreamingAssistant(false);
          } else {
            const res2 = await postChatWith429Retry({
              messages: historyWithFile.map(mapMsg),
              systemPrompt,
              walletAddress: otaClaimEvm,
            });
            const content2 = res2.content != null ? String(res2.content) : '';
            if (res2.usage && typeof res2.usage === 'object') {
              setLastUsage(normalizeOtaChatUsage(res2.usage));
            }
            setMessages(prev => [...prev, { role: 'user', content: '[Files loaded for OTA]' }, { role: 'assistant', content: content2 }]);
          }
        }
      }
    } catch (err) {
      setRateLimitNote(null);
      const msg = err.message || 'Error sending message.';
      setError(err?.failedStatus === 429 ? `${msg} You can tap Retry and send again in a moment.` : msg);
      const errText = `Error: ${err.message || 'Unknown error'}`;
      setMessages(prev => {
        const next = [...prev];
        if (provider === 'openai' && next.length && next[next.length - 1].role === 'assistant') {
          next[next.length - 1] = { role: 'assistant', content: errText };
          return next;
        }
        return [...prev, { role: 'assistant', content: errText }];
      });
    } finally {
      setStreamingAssistant(false);
      setLoading(false);
      setRateLimitNote(null);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const retentionDays = transcriptMeta?.retentionDays ?? 5;
  const transcriptBannerText = otaClaimEvm
    ? transcriptMeta?.expired
      ? `Previous transcript expired (retention ${retentionDays} days). New messages will sync again when you send.`
      : `History for this wallet is kept ${retentionDays} days and synced across browsers when OTA wallet sign-in is active.`
    : 'Connect an EVM wallet and complete OTA sign-in to sync this chat across devices. Until then, history stays in this browser only.';

  return (
    <div className="ota-chat-page ota-chat-page--bits ota-chat-page--studio">
      <div className="ota-chat-page__shell">
      <header className="ota-chat-header ota-chat-header--bits ota-chat-header--studio" role="banner">
        <div className="ota-chat-header__strip ota-chat-header__strip--studio">
          <div className="ota-chat-studio-masthead">
            <div className="ota-chat-studio-masthead__mark">
              <OTALogo size="xs" />
              <span className="ota-chat-studio-masthead__bits">$BITS</span>
            </div>
            <div className="ota-chat-studio-masthead__body">
              <h1 className="ota-chat-title ota-chat-title--studio" id="ota-chat-main-heading">
                <MessageSquare size={20} className="ota-chat-title-icon" aria-hidden />
                <span className="ota-chat-title--studio__label">Chat console</span>
                {provider === 'openai' ? (
                  <span className="ota-chat-studio-llm ota-chat-studio-llm--openai">OpenAI</span>
                ) : null}
                {provider === 'claude' ? (
                  <span className="ota-chat-studio-llm ota-chat-studio-llm--claude">Claude</span>
                ) : null}
                {provider === 'ota' ? (
                  <span className="ota-chat-studio-llm ota-chat-studio-llm--off">No LLM</span>
                ) : null}
              </h1>
              {provider === 'ota' ? (
                <p className="ota-chat-ota-engine-warning" role="status">
                  <strong>OTA Engine</strong> is on in the header — <strong>this chat does not use OTA Engine.</strong> Switch to{' '}
                  <strong>OpenAI</strong> or <strong>Claude</strong> for replies.
                </p>
              ) : null}
              <p className="ota-chat-subtitle ota-chat-subtitle--bits ota-chat-subtitle--studio">
                Messages go to the provider selected in the top bar (OpenAI or Claude). This panel is only the conversation UI.
              </p>
            </div>
          </div>
        {user?.id ? (
          <button
            type="button"
            className="ota-chat-vault-btn ota-chat-vault-btn--bits ota-chat-vault-btn--studio"
            onClick={openVault}
            title="Vault – sensitive info (for you only)"
            aria-label="Open Vault"
          >
            <Lock size={18} aria-hidden />
            <span>Vault</span>
          </button>
        ) : null}
        </div>
      </header>

      <div className="ota-chat-body ota-chat-body--studio">
        <div className="ota-chat-banner-slot">
          <OtaBscAutoStatusBanner />
        </div>

        <div className="ota-chat-transcript-banner-wrap">
          <div className="ota-chat-transcript-banner ota-chat-transcript-banner--emph" role="status" aria-live="polite">
            <span className="ota-chat-transcript-banner__label">Retention</span>
            <span className="ota-chat-transcript-banner__text">{transcriptBannerText}</span>
            {otaClaimEvm && transcriptMeta?.updatedAt ? (
              <span className="ota-chat-transcript-banner__meta" title="Last transcript sync from server">
                Updated {new Date(transcriptMeta.updatedAt).toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>

        {rateLimitNote ? (
          <div className="ota-chat-rate-limit-banner" role="status" aria-live="polite">
            {rateLimitNote}
          </div>
        ) : null}

      <Modal isOpen={vaultOpen} onClose={() => setVaultOpen(false)} title="Vault – for you only" size="medium">
        {!user?.id ? (
          <p className="ota-vault-auth-required">Sign in to access the Vault. Sensitive data is delivered only to the verified owner.</p>
        ) : vaultLoading ? (
          <p className="ota-vault-loading">Loading...</p>
        ) : vaultEntries.length === 0 ? (
          <p className="ota-vault-empty">No entries in Vault. OTA can save wallet addresses, contracts or other sensitive info here (never shown in chat).</p>
        ) : (
          <ul className="ota-vault-list" role="list">
            {vaultEntries.map(({ key: k, value: v }) => (
              <li key={k} className="ota-vault-item">
                <span className="ota-vault-key">{k}</span>
                <span className="ota-vault-value">
                  {vaultReveal[k] ? v : '••••••••••••'}
                  <button
                    type="button"
                    className="ota-vault-reveal"
                    onClick={() => setVaultReveal(prev => ({ ...prev, [k]: !prev[k] }))}
                    aria-label={vaultReveal[k] ? 'Hide value' : 'Show value'}
                  >
                    {vaultReveal[k] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>

        <div
          ref={chatScrollRef}
          className="ota-chat-scroll"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
        >
          <div className={`ota-chat-thread${messages.length === 0 ? ' ota-chat-thread--empty' : ''}`}>
            {messages.length === 0 && (
              <div className="ota-chat-welcome">
                <div className="ota-chat-empty-panel">
                <div className="ota-chat-welcome__hero">
                  <div className="ota-chat-welcome__icon" aria-hidden>
                    <OTALogo size="xl" className="ota-chat-welcome__ota-logo" />
                  </div>
                  <h2 className="ota-chat-welcome__title">How can I help you today?</h2>
                  <p className="ota-chat-welcome__lead">
                    This is the OTA product assistant. Replies follow the language you write in when it’s clear; otherwise
                    English is used.
                  </p>
                </div>
                <div className="ota-chat-starters" aria-label="Suggested prompts">
                  {CHAT_STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="ota-chat-starter-chip"
                      onClick={() => {
                        setInput(p);
                        inputRef.current?.focus();
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              const showStreamThinking =
                streamingAssistant &&
                m.role === 'assistant' &&
                i === messages.length - 1 &&
                !(m.content && String(m.content).trim());
              return (
              <div
                key={i}
                className={`ota-chat-msg ota-chat-msg--${m.role}`}
              >
                {m.role === 'assistant' ? (
                  <div
                    className={`ota-chat-msg__avatar ota-chat-msg__avatar--assistant${showStreamThinking ? ' ota-chat-msg__avatar--waiting' : ''}`}
                    aria-hidden
                  >
                    <OTALogo size="sm" className="ota-chat-msg__ota-logo" />
                  </div>
                ) : null}
                <div className="ota-chat-msg__body">
                  <span className="ota-chat-sr-only">{m.role === 'user' ? 'You said' : 'Assistant said'}</span>
                  <div className={`ota-chat-msg__bubble${showStreamThinking ? ' ota-chat-msg__bubble--thinking' : ''}`}>
                    <div className="ota-chat-msg__text">
                      {showStreamThinking ? (
                        <OtaChatThinking />
                      ) : (
                        <OtaChatMarkdown>{String(m.content || '')}</OtaChatMarkdown>
                      )}
                    </div>
                  </div>
                </div>
                {m.role === 'user' ? (
                  <div className="ota-chat-msg__avatar ota-chat-msg__avatar--user" aria-hidden>
                    <User size={17} strokeWidth={2} />
                  </div>
                ) : null}
              </div>
              );
            })}

            {loading && !streamingAssistant ? (
              <div className="ota-chat-msg ota-chat-msg--assistant ota-chat-msg--typing">
                <div className="ota-chat-msg__avatar ota-chat-msg__avatar--assistant ota-chat-msg__avatar--waiting" aria-hidden>
                  <OTALogo size="sm" className="ota-chat-msg__ota-logo" />
                </div>
                <div className="ota-chat-msg__body">
                  <div className="ota-chat-msg__bubble ota-chat-msg__bubble--thinking">
                    <div className="ota-chat-msg__text ota-chat-typing">
                      <OtaChatThinking />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} className="ota-chat-scroll-anchor" />
          </div>
        </div>

        {error ? (
          <div className="ota-chat-error" role="alert">
            <span>{error}</span>
            <button type="button" className="ota-chat-retry" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        ) : null}
      </div>

      <div className="ota-chat-composer ota-chat-composer--studio">
        <div className="ota-chat-composer__inner">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            aria-label="Upload image for analysis"
            className="ota-chat-file-input"
            onChange={handleImageSelect}
          />
          {attachedImage ? (
            <div className="ota-chat-image-preview">
              <img src={attachedImage.dataUrl} alt="Attached" className="ota-chat-image-preview-img" />
              <button
                type="button"
                className="ota-chat-image-preview-remove"
                onClick={clearAttachedImage}
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          ) : null}
          <div className="ota-chat-input-shell">
            <div className="ota-chat-input-row">
              <textarea
                ref={inputRef}
                className="ota-chat-input"
                placeholder="Message OTA Assistant…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
                autoFocus
                aria-label="Message to OTA Assistant"
              />
              <div className="ota-chat-actions">
                <button
                  type="button"
                  className="ota-chat-attach-image"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  title="Upload image for analysis"
                  aria-label="Upload image"
                >
                  <ImagePlus size={20} aria-hidden />
                </button>
                <button
                  type="button"
                  className="ota-chat-send"
                  onClick={sendMessage}
                  disabled={loading || (!input.trim() && !attachedImage)}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
          {lastUsageDisplay ? (
            <p className="ota-chat-token-usage" aria-live="polite">
              {lastUsageDisplay}
            </p>
          ) : null}
        </div>
      </div>
      </div>
    </div>
  );
}
