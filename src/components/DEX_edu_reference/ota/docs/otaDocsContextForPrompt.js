/**
 * SSOT pentru contextul RAG injectat în OTA Chat (`/dex-edu/ota/chat`).
 * Conținutul efectiv este generat în `dexChatContextBundle.generated.js` din
 * `dexChatContext.manifest.json` (documentație DEX + OTA).
 *
 * Regenerează: `node scripts/sync-dex-chat-context.js`
 * (sau `node scripts/sync-ota-docs-context.js` – alias back-compat).
 */
export { getOtaDocsContextForPrompt } from './dexChatContextBundle.generated.js';
