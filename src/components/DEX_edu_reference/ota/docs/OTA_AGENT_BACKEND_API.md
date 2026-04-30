# Contract API Backend pentru OTA Agent (Render)

Acest document descrie endpoint-urile pe care **backend-ul (backend-server-repo pe Render)** trebuie să le implementeze ca OTA să se comporte ca un Agent AI atât **local** cât și **când aplicația e deployată pe S3**. Utilizatorul logat ca **Proprietar** poate folosi memoria OTA și (opțional) citirea fișierelor din repo-ul backend.

**Frontend:** apelează aceste endpoint-uri cu `otaApiRequest` (credentials: include), deci cookie-urile de autentificare sunt trimise către Render. Backend-ul poate restricționa accesul la utilizatorul autentificat (proprietar).

---

## 1. POST /api/ai-trading/ota-memory/apply

**Scop:** Aplică blocurile [OTA-MEMORY-SAVE] și [OTA-MEMORY-DELETE] din răspunsul OTA. Memoria este stocată **per user** pe backend, astfel încât funcționează și când utilizatorul accesează app-ul online (S3), nu doar local.

**Request:**
- Method: `POST`
- Headers: `Content-Type: application/json`, cookies de sesiune
- Body: `{ "content": "string" }` – conținutul răspunsului OTA (text care poate conține [OTA-MEMORY-SAVE] și [OTA-MEMORY-DELETE])

**Parsare (același format ca în scripts/ota-memory-server.js):**
- **Salvare:** regex `[OTA-MEMORY-SAVE]\s*path:\s*([^\n]+)\s*content:\s*\|?\s*([\s\S]*?)\s*\[\/OTA-MEMORY-SAVE\]` (case-insensitive). `path` e relativ (ex. `memory/decizii.md`), `content` e corpul (trim leading whitespace per line).
- **Ștergere:** regex `[OTA-MEMORY-DELETE\s+path="([^"]+)"\]`. `path` e relativ (ex. `memory/decizii.md`).

**Stocare backend:** 
- Recomandat: tabel `ota_memory` cu `user_id`, `path` (ex. `memory/decizii.md`), `content` (text), `updated_at`. Cheie unică (user_id, path). La SAVE: upsert; la DELETE: ștergere rând.
- Alternativ: fișiere per user într-un bucket/storage (ex. `ota-memory/{user_id}/memory/decizii.md`).

**Response:** `200` JSON: `{ "saved": ["memory/decizii.md", ...], "deleted": ["memory/vechi.md"], "errors": [] }` (sau array de `{ path, error }` pentru erori).

**Autentificare:** Opțional dar recomandat – doar utilizatorul autentificat (proprietar) poate scrie în propria memorie. La 401: frontend nu afișează eroare, doar nu persistă pe backend.

---

## 2. GET /api/ai-trading/ota-files/read (opțional)

**Scop:** Permite OTA să citească fișiere din **repo-ul backend** (backend-server-repo) când utilizatorul e logat ca Proprietar. Util când app-ul e pe S3 (nu există server local pentru fișiere).

**Request:**
- Method: `GET`
- Query: `path=...` (cale relativă la rădăcina repo-ului backend, ex. `routes/ai-trading/openaiProxyRoutes.js`), opțional `root=backend-server-repo` (backend poate ignora, are un singur root).

**Validare:** Calea trebuie normalizată și să nu conțină `..` (safe path). Doar fișiere din rădăcina proiectului backend.

**Response:** `200` JSON: `{ "path": "...", "root": "backend-server-repo", "content": "..." }`. La 404: `{ "error": "File not found" }`.

**Autentificare:** Recomandat – doar proprietarul (user autentificat) poate citi. La 401: frontend afișează „fișier negăsit sau inaccesibil”.

---

## 3. GET /api/ai-trading/ota-files/list (opțional)

**Scop:** Listează fișiere și directoare într-un path din repo-ul backend (pentru explorare).

**Request:** `GET` cu query `path=...` (ex. `routes`).

**Response:** `200` JSON: `{ "path": "...", "root": "backend-server-repo", "files": ["a.js", ...], "dirs": ["subdir", ...] }`.

---

## 4. OTA Vault – informații sensibile (doar proprietar verificat)

**Scop:** Zonă protejată pentru adrese wallet, contracte, chei API sau orice informații care de obicei merg în .env. Datele sunt **livrate doar proprietarului autentificat**; nu apar niciodată în chat. Backend verifică sesiunea și servește doar vault-ul utilizatorului curent.

### POST /api/ai-trading/ota-vault/set

- **Request:** `POST`, body `{ "entries": [ { "key": "WALLET_BSC", "value": "0x..." }, ... ] }`. Cookies de sesiune obligatorii.
- **Comportament:** Upsert per (user_id, key). Doar utilizatorul autentificat poate scrie în propriul vault. La 401: frontend nu afișează eroare.
- **Recomandare:** Criptare la rest (ex. câmp `value` criptat cu cheie derivată din user_id sau cheie de aplicație). Nu loga valorile.

### GET /api/ai-trading/ota-vault/get

- **Request:** `GET`, fără body. Cookies de sesiune obligatorii.
- **Response:** `200` JSON: `{ "entries": [ { "key": "WALLET_BSC", "value": "0x..." }, ... ] }`. Doar intrările utilizatorului curent. La 401: nu returna date; frontend afișează „Autentifică-te”.
- **Verificare proprietar:** Backend identifică user-ul din sesiune (JWT/cookie); nu returna vault pentru alt user.

**Rezumat Vault:** Stocare per user_id; criptare la rest recomandată; livrare doar după verificare sesiune.

---

## 5. RAG / Context documentație (opțional – îmbunătățire anti-halucinație)

**Stare actuală:** Frontend injectează deja context OTA_05 + OTA_02 în system prompt (otaDocsContextForPrompt.js). Backend primește `systemPrompt` de la frontend deci nu trebuie să facă RAG pentru acest context.

**Opțional backend:** Dacă backend vrea să adauge și alte surse (ex. search în vector store peste ota/docs), poate:
- Primi în body `contextDocs?: string[]` (ex. `["OTA_05", "OTA_02"]`) și citi din repo fragmente relevante, apoi concatena la `systemPrompt` înainte de a apela OpenAI.
- Sau: la fiecare request chat, face retrieval peste ota/docs și injectează top-K fragmente în system message. Astfel răspunsurile rămân „grounded” în documentație.

---

## 6. Tools (function calling) – opțional, pentru agent full funcțional

**Scop:** OTA să execute acțiuni prin API-uri definite (read_file, list_dir, get_doc_chunk), nu doar să „ghicească” blocuri [OTA-READ].

**Implementare backend:**
- La apelul către OpenAI pentru chat, trimite `tools: [ { type: "function", function: { name: "read_file", description: "...", parameters: { type: "object", properties: { path: {...}, root: {...} } } } }, { type: "function", function: { name: "list_directory", ... } } ]`.
- Când OpenAI răspunde cu `tool_calls`, backend execută fiecare tool (citește din repo, listare director), apoi trimite rezultatul înapoi în conversație și reapelează OpenAI până când nu mai sunt tool_calls.
- Frontend rămâne neschimbat (trimite messages + systemPrompt); backend face loop-ul tool_call → execute → append → re-call model.

**Erori:** La apel către OpenAI: retry cu backoff la 429/5xx; la eșec returnare `{ error: "…", code: "RATE_LIMIT" | "OPENAI_ERROR" }` ca să poată frontend afișa mesaj clar.

---

## Rezumat

| Endpoint | Obligatoriu | Scop |
|----------|-------------|------|
| POST /api/ai-trading/ota-memory/apply | **Da** | Memorie OTA pe Render – funcționează și pe S3 |
| POST /api/ai-trading/ota-vault/set | **Da** | Vault – informații sensibile, doar proprietar |
| GET /api/ai-trading/ota-vault/get | **Da** | Citire vault – doar pentru utilizatorul autentificat |
| GET /api/ai-trading/ota-files/read | Opțional | Citire fișiere din repo backend (când user e Proprietar) |
| GET /api/ai-trading/ota-files/list | Opțional | Listare director backend |

**SSOT frontend:** src/config/apiEndpoints.js (OTA_MEMORY_APPLY, OTA_VAULT_SET, OTA_VAULT_GET, OTA_FILES_READ, OTA_FILES_LIST). Frontend încearcă întâi serverul local (localhost:3765) pentru fișiere și memorie; pentru memorie și vault apelează **mereu** backend-ul; vault este doar backend, livrat doar în panoul Vault (după autentificare).
