# Ghid complet – Proprietar OTA AI / OpenAI Key

Tu ești proprietarul key-ului OpenAI (plătești pentru el). Acest ghid răspunde la: **unde discut cu OTA**, **unde pun documentația**, **cum îi dau acces la fișierele frontend** și **cum fac toate astea**.

---

## 1. Unde și cum discut cu OTA (OpenAI)?

- **În aplicație (acum):**
  - Ești pe: `http://127.0.0.1:3000/dex/ota?mode=advisory`
  - **Din Sidebar** (meniul din stânga): apasă pe **„Chat OpenAI”**.
  - Sau deschide direct: **http://127.0.0.1:3000/dex/ota/chat**
  - Trebuie să fii **autentificat cu email** (dacă nu ești, te va trimite la login).
  - Acolo scrii mesajul, apeși **Trimite** și primești răspuns de la OpenAI (același key ca pentru OTA).

- **Cum funcționează:** Mesajul tău merge la backend-ul tău (Render) → backend apelează OpenAI cu key-ul tău → răspunsul revine în chat. Nu există key în frontend.

---

## 2. Unde adaug documentația?

- **Un singur loc în frontend:** directorul **`src/components/DEX/ota/docs/`** (în repo-ul frontend-edu).

- **Cum:**  
  - Deschizi în Explorer (sau IDE) proiectul frontend-edu.  
  - Mergi la: `src/components/DEX/ota/docs/`  
  - Adaugi fișiere noi acolo, de exemplu:  
    - `OTA_GUID_UTILIZARE.md`  
    - `OTA_STRUCTURA.md`  
    - `REGULI_TRADING.md`  
    - orice `.md` sau `.txt` cu documentația ta.

- **Ce se întâmplă cu ele:**  
  - Acum aceste fișiere sunt doar în proiect; **chat-ul nu le citește automat**.  
  - Le poți folosi tu (să le deschizi, să le copiezi în chat dacă vrei).  
  - Dacă vrei ca **OTA să le „vadă” automat** în chat, trebuie implementat un pas în plus (vezi secțiunea 4).

---

## 3. Cum îi dau acces la fișierele care compun frontend-ul?

- **Situația actuală:**  
  - Chat-ul de pe `/dex/ota/chat` **nu are acces automat** la fișierele din proiect (nici la `ota/docs`, nici la restul frontend-ului).  
  - El doar trimite mesajele tale la OpenAI și afișează răspunsul.

- **Ce poți face acum (fără cod nou):**  
  - Poți **lipsa (paste)** în chat conținut din fișiere: deschizi un fișier, copiezi un fragment, lipsești în mesaj și întrebi ce vrei (ex: „Explică acest cod”, „Cum se leagă asta de OTA?”).  
  - Poți pune **documentația** în `ota/docs/` și, când vrei să discuți despre ea, poți copia pasaje în chat.

- **Ce se poate adăuga ulterior (cu implementare):**  
  - **Varianta A – RAG (recomandat):**  
    - Se indexează fișiere alese (ex: `src/components/DEX/`, `ota/docs/`) într-un vector store.  
    - La fiecare întrebare în chat, backend-ul caută fragmente relevante și le pune în prompt; astfel modelul „vede” fișierele tale la cerere.  
  - **Varianta B – System prompt cu documentația:**  
    - La deschiderea chat-ului (sau la un buton „Încarcă docs”), backend-ul citește conținutul din `ota/docs/` și îl pune în system prompt; modelul are mereu în context acea documentație.

Dacă vrei să implementăm una dintre variante, spune ce preferi (RAG peste tot frontend vs. doar `ota/docs`).

---

## 4. Cum fac toate astea? – Rezumat pe pași

| Ce vrei | Unde | Cum |
|--------|------|-----|
| **Să discut cu OTA** | Pagina de chat | Sidebar → **„Chat OpenAI”** sau URL: **http://127.0.0.1:3000/dex/ota/chat** (autentificat cu email). |
| **Să adaug documentație** | Un singur folder | Creezi/adaugi fișiere în **`src/components/DEX/ota/docs/`** (ex: `.md`, `.txt`). |
| **Să „vadă” OTA documentația / fișierele** | Același chat | **Acum:** copiezi și lipsești în chat ce vrei. **Mai târziu:** se poate implementa RAG sau încărcare docs în system prompt (vezi secțiunea 3). |

---

## 5. Quick reference (pe scurt)

- **URL chat (local):** `http://127.0.0.1:3000/dex/ota/chat`  
- **Folder documentație (în frontend-edu):** `src/components/DEX/ota/docs/`  
- **Autentificare:** email (același ca pentru OTA).  
- **Key OpenAI:** rămâne doar pe Render; nu apare în frontend.

Dacă vrei pași concreți pentru RAG sau pentru „încarcă ota/docs în chat”, putem detalia următorii pași de implementare.
