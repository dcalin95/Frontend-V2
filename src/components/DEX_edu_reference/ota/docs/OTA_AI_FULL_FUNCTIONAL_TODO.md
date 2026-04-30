# OTA AI – Todo list complet (full functional, fără erori/halucinații)

Listă pe puncte, în ordine de implementare. Bifat = făcut.

---

## 1. Prompt și reguli anti-halucinație

- [x] **1.1** Reguli explicite în system prompt: răspunde doar din documentație / fișiere citate / conversație; nu inventa endpoint-uri sau path-uri.
- [x] **1.2** Few-shot în prompt: exemple corecte („care e endpoint-ul pentru chat?”) și exemplu de abstain („nu am în documentație”).
- [x] **1.3** Instrucțiune: când nu ești sigur, răspunde „Verifică în ota/docs (OTA_01 … OTA_08) sau în cod.”

---

## 2. RAG – injectare documentație (grounding)

- [x] **2.1** Modul frontend care exportă conținutul OTA_05 (endpoint-uri) și OTA_02 (arhitectură) pentru prompt → `ota/docs/otaDocsContextForPrompt.js`.
- [x] **2.2** La fiecare request chat, injectează acest context în system prompt sub secțiunea „CONTEXT DOCUMENTAȚIE (sursă de adevăr)” → OTAChatPage useMemo.
- [x] **2.3** Actualizare: când se modifică OTA_05 sau OTA_02, rulează **node scripts/sync-ota-docs-context.js** sau **node scripts/ssot-detect-and-sync.js** – acesta din urmă detectează toate modificările în SSOT și rulează sync-ul + scrie raport în `scripts/ssot-sync-report.txt`.

---

## 3. Error handling – mesaje user-friendly

- [x] **3.1** Mapare coduri HTTP în otaApiClient: 401 → „Sesiune expirată. Reconectează-te.”; 503/5xx → „Serviciul e ocupat…”; timeout (AbortError) → „Răspuns întârziat. Încearcă din nou.”
- [x] **3.2** În OTAChatPage: afișează mesajul din otaApiRequest (deja user-friendly).
- [x] **3.3** Buton „Reîncearcă” când apare eroare – ascunde eroarea ca utilizatorul să poată reîncerca.

---

## 4. Backend – contract pentru viitor

- [x] **4.1** Documentare: backend poate primi `contextDocs` (opțional) și injecta fragmente din ota/docs → OTA_AGENT_BACKEND_API.md §5.
- [x] **4.2** Documentare: backend poate implementa tools (read_file, list_dir, get_doc_chunk) + loop function calling → OTA_AGENT_BACKEND_API.md §6.
- [x] **4.3** Documentare: backend retry cu backoff la 429/5xx; returnare cod și mesaj clar → menționat în §6.

---

## 5. Opțional (următorul pas)

- [ ] **5.1** Structured outputs (backend): schema strictă pentru acțiuni [OTA-READ], [OTA-MEMORY-SAVE].
- [ ] **5.2** Guardrails: verificare că endpoint-urile citate în răspuns există în lista cunoscută.
- [ ] **5.3** Context window: trunchiere sau sumarizare conversație lungă.

---

**Referință:** OTA_AI_FULL_FUNCTIONAL_ROADMAP.md.
