# Cum accesezi și discuți direct cu OpenAI (key-ul tău)

Acest document explică **procedura** și **zona** unde poți lucra direct cu OpenAI pentru care plătești (key setat în Render).

---

## 1. Ce este implementat

- **Backend (Render):** Endpoint `POST /api/ai-trading/chat`  
  - Folosește același **OPENAI_API_KEY** din variabilele de mediu Render.  
  - Acceptă: `messages` (array de `{ role, content }`) și opțional `systemPrompt`.  
  - Răspuns: text liber (nu JSON forțat).

- **Frontend (DEX):** Pagină **„Chat OpenAI”**  
  - Locație: **Sidebar → „Chat OpenAI”** sau direct **`/dex/ota/chat`**.  
  - Trebuie să fii autentificat (email) ca să accesezi pagina.  
  - Scrii mesajul, apeși Trimite; răspunsul vine de la OpenAI prin backend.

---

## 2. Procedura (pași)

1. **Backend pe Render**  
   - Asigură-te că în **Environment** ai setat **`OPENAI_API_KEY`** (key-ul tău plătit).  
   - Opțional: **`OPENAI_MODEL`** (ex. `gpt-4o-mini` sau `gpt-4o`). Fără el se folosește `gpt-4o-mini`.

2. **Frontend (aplicația DEX)**  
   - Deschide aplicația (frontend-edu).  
   - Autentifică-te (email) dacă nu ești deja logat.  
   - În **Sidebar** apasă pe **„Chat OpenAI”** (sau mergi la **`/dex/ota/chat`**).  
   - Scrie un mesaj în câmpul de text și apasă **Trimite**.  
   - Răspunsurile sunt afișate în aceeași pagină; conversația se păstrează pe sesiune.

3. **Cum „discuți direct” cu OpenAI**  
   - Fiecare mesaj trimis merge la backend → backend apelează **OpenAI Chat Completions** cu key-ul tău → răspunsul revine și se afișează în chat.  
   - Nu există cheie în frontend; totul trece prin serverul tău (Render).

---

## 3. Unde este zona în aplicație

- **Rută:** `/dex/ota/chat`  
- **Sidebar:** link **„Chat OpenAI”** (sub OTA AI).  
- **Protecție:** doar utilizatori autentificați (email) pot accesa; dacă nu ești logat, se afișează flow-ul de login.

---

## 4. Tehnical (pentru dezvoltare)

- **Backend:** `backend-server-repo/routes/ai-trading/openaiProxyRoutes.js` – ruta `POST /chat`.  
- **Frontend:**  
  - Pagină: `src/components/DEX/frontend/pages/OTAChatPage.jsx`  
  - Stil: `src/components/DEX/frontend/styles/components/ota-chat-page.css`  
- **API:** frontend apelează `POST getApiBaseUrl() + '/ai-trading/chat'` cu body `{ messages, systemPrompt? }`.

---

## 5. Rezumat

| Ce vrei | Cum |
|--------|-----|
| Să accesezi OpenAI (key-ul tău) | Key-ul e setat doar în Render; backend-ul îl folosește. |
| Să discuți direct cu OpenAI | Sidebar → **Chat OpenAI** sau `/dex/ota/chat`; scrii și trimiți mesaje. |
| Să vezi răspunsurile | În aceeași pagină de chat, sub mesajele tale. |

Dacă vrei să adaugi și documentație (ex. RAG peste fișiere din `ota/docs`) ca să „învețe” structura proiectului, se poate implementa separat.
