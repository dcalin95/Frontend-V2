# OTA – Documentație (proprietar)

Acest director conține **documentația OTA** (extrasă din docs/) și **promptul de sistem** pentru chat.

- **Locație:** `src/components/DEX/ota/docs/`
- **Documentație completă OTA:** OTA_01 … OTA_08 (ce e OTA, arhitectură, moduri, OpenAI, endpoint-uri, Learning Features, rute UI). Index: **OTA_08_INDEX_DOCUMENTATIE.md**.
- **Prompt mereu accesat de chat:** Conținutul din **PROMPT_OTA_IDENTITATE_SI_REGULI.md** este exportat în **otaSystemPrompt.js** și trimis la fiecare conversație pe /dex/ota/chat (identitate proprietar, ce trebuie să facă OTA, reguli).
- **Context RAG (DEX + OTA):** fișierele injectate în chat sunt listate în **dexChatContext.manifest.json**; bundle-ul generat este **dexChatContextBundle.generated.js** (regenerează cu `npm run sync-dex-chat-context`).
- Poți adăuga aici și fișiere noi (ex. OTA_GUID_UTILIZARE.md, OTA_STRUCTURA.md); pentru a le include în chat, adaugă-le în manifest și rulează sync-ul.

---

## Added for context - 2026-07-04

**Current SSOT snapshot:** vezi **CURRENT_PROJECT_STATUS_2026-07-04.md**.

Notă importantă: documentele istorice pot spune că backend-ul nu este deployat, că DEX este doar schelet sau că futures short este doar paper. Pentru starea curentă, folosește snapshot-ul din 2026-07-04 împreună cu codul activ:

- `src/components/DEX_edu_reference/DEXApp.jsx`
- `src/components/DEX_edu_reference/config/apiEndpoints.js`
- `src/components/DEX_edu_reference/frontend/pages/OTAShortOpsPage.jsx`
- backend `server.js`
- backend `src/ota/routes/shortOpsRoutes.js`
- backend `src/ota/routes/longOpsRoutes.js`

---

## Current documentation entry point - 2026-07-17

Read **CURRENT_PROJECT_STATUS_2026-07-17.md** first. It supersedes the 2026-07-04 snapshot for current-state questions. The documentation-wide findings and classification rules are in `C:\Users\bits\Desktop\frontend\docs\DOCUMENTATION_AUDIT_2026-07-17.md`.

Correct current roots and routes:

- frontend: `C:\Users\bits\Desktop\frontend`
- backend: `C:\Users\bits\Desktop\backend-server`
- active richer UI: `/dex-edu/*`
- first-party API: `/api/*`
