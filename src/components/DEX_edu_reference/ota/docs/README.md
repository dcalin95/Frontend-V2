# OTA – Documentație (proprietar)

Acest director conține **documentația OTA** (extrasă din docs/) și **promptul de sistem** pentru chat.

- **Locație:** `src/components/DEX/ota/docs/`
- **Documentație completă OTA:** OTA_01 … OTA_08 (ce e OTA, arhitectură, moduri, OpenAI, endpoint-uri, Learning Features, rute UI). Index: **OTA_08_INDEX_DOCUMENTATIE.md**.
- **Prompt mereu accesat de chat:** Conținutul din **PROMPT_OTA_IDENTITATE_SI_REGULI.md** este exportat în **otaSystemPrompt.js** și trimis la fiecare conversație pe /dex/ota/chat (identitate proprietar, ce trebuie să facă OTA, reguli).
- **Context RAG (DEX + OTA):** fișierele injectate în chat sunt listate în **dexChatContext.manifest.json**; bundle-ul generat este **dexChatContextBundle.generated.js** (regenerează cu `npm run sync-dex-chat-context`).
- Poți adăuga aici și fișiere noi (ex. OTA_GUID_UTILIZARE.md, OTA_STRUCTURA.md); pentru a le include în chat, adaugă-le în manifest și rulează sync-ul.
