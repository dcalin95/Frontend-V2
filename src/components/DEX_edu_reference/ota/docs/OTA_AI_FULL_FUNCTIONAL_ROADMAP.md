# OTA AI – Full functional ca Agent AI (Cursor-style), fără erori și halucinații

Document de investigație: ce se mai poate implementa ca OTA (OpenAI) să fie full funcțional, fără erori și fără halucinații, la nivel de Agent AI asistent (similar Cursor).

---

## 1. Starea actuală (ce are OTA acum)

| Aspect | Implementat | Lipsește / limitare |
|--------|-------------|----------------------|
| **System prompt** | Da – identitate, reguli, memory/vault/read | Nu include documentație reală (doar referințe la ota/docs) |
| **Context la fiecare request** | Doar `messages` + `systemPrompt` | Fără RAG: niciun fragment din OTA_01…OTA_08 nu e injectat |
| **Tools / function calling** | Nu | OTA nu are tools; răspunde în text liber și folosește blocuri [OTA-READ], [OTA-MEMORY-SAVE] etc. |
| **Structured outputs** | Nu | Răspunsul e text liber; nu există schema strictă pentru acțiuni |
| **Verificare răspuns** | Nu | Niciun post-check că endpoint-urile/ fișierele citate există |
| **Error handling** | Timeout + 1 retry în frontend | Backend poate returna erori opace; nu există fallback/retry pe backend |
| **Documentație la îndemână** | Referințe în prompt la „ota/docs (OTA_01 … OTA_08)” | Modelul nu citește conținutul; poate inventa endpoint-uri/rute |

**Concluzie:** OTA se bazează aproape doar pe ceea ce „știe” modelul și pe instrucțiunile din system prompt. Nu e „grounded” în documentația reală a proiectului, nu are tools pentru acțiuni verificabile, și nu are structură forțată pe răspuns.

---

## 2. De ce apar erori și halucinații

- **Fără RAG:** Modelul nu primește fragmente din OTA_01…OTA_08 sau din lista de endpoint-uri. Poate inventa path-uri (/api/ai-trading/xyz) sau rute UI care nu există.
- **Fără tools:** Toate acțiunile (citire fișier, salvare memorie) sunt „ghicite” ca text ([OTA-READ path="..."]) fără validare; path-uri greșite sau inexistente duc la „fișier negăsit” sau la răspunsuri bazate pe presupuneri.
- **Fără structured outputs:** Blocurile [OTA-*] pot fi malformate (lipsă ghilimele, path incorect); nu există garanție de format.
- **Prompt lung + fără prioritizare:** Dacă system prompt-ul e foarte lung și fără secțiuni clare „sursă de adevăr”, modelul poate ignora reguli sau confunda surse.
- **Fără abstain:** Nu e instruit explicit să răspundă „nu știu” sau „verifică în docs” când nu e sigur; tinde să completeze din „knowledge” intern, adesea depășit.

---

## 3. Ce se poate implementa (prioritizat)

### 3.1 RAG / injectare documentație (grounding) – prioritate mare

**Scop:** Răspunsurile să se bazeze pe documentație reală, nu pe memoria modelului.

**Opțiuni:**

- **A) Frontend:** Înainte de fiecare request de chat, încarcă 1–3 fișiere relevante din `ota/docs` (ex. OTA_05_ENDPOINTS_API.md, OTA_02_ARHITECTURA.md) în funcție de ultimul mesaj al user-ului (cuvinte cheie: „endpoint”, „API”, „arhitectură” etc.) și adaugă un mesaj system sau user: „Context documentație (sursă de adevăr): …”.
- **B) Backend:** Backend-ul are acces la repo; la fiecare request chat face retrieval (vector store sau căutare simplă) peste ota/docs și injectează fragmente în system message. Răspunsul e astfel „grounded” în docs.
- **C) Hybrid:** Frontend trimite `contextDocs: ["OTA_05", "OTA_02"]`; backend citește acele fișiere și le pune în system prompt.

**Reduce:** Halucinări despre endpoint-uri, rute, arhitectură.

---

### 3.2 Few-shot în system prompt – prioritate mare, cost mic

**Scop:** Să vadă exemple clare de răspuns corect și de „nu inventa”.

**Implementare:** Adaugi în `otaSystemPrompt.js` o secțiune scurtă:

- 1–2 exemple de răspuns corect (ex.: „Care e endpoint-ul pentru chat?” → „POST /api/ai-trading/chat, vezi OTA_05.”).
- 1 exemplu de abstain: „Dacă nu e în documentație, răspunde: «Nu e specificat în documentație; poți verifica în ota/docs sau în cod.»”

**Reduce:** Inventare de endpoint-uri și overconfidence.

---

### 3.3 Reguli explicite anti-halucinație în prompt – prioritate mare

**Scop:** Comportament predictibil când nu e sigur.

**Adăugat în prompt:**

- „Răspunde DOAR pe baza documentației injectate sau a conținutului fișierelor citate prin [OTA-READ]. Nu inventa endpoint-uri, rute sau fișiere.”
- „Dacă întrebarea depășește documentația disponibilă, spune explicit: «Nu am asta în documentație; verifică în ota/docs sau în repo.»”
- „Când citezi un path sau endpoint, folosește exact textul din context (nu variații).”

**Reduce:** Răspunsuri plauzibile dar false.

---

### 3.4 Function calling / tools (backend) – prioritate mare pentru „agent” real

**Scop:** OTA să execute acțiuni prin API-uri definite (read_file, list_dir, search_docs), nu doar să „ghicească” blocuri de text.

**Implementare (backend):**

- Backend expune la OpenAI un set de **tools** (ex.: `read_file`, `list_directory`, `get_doc_chunk`).
- La răspuns, modelul poate returna `tool_calls`; backend execută tool-urile (citire din repo, listare, search în docs) și trimite rezultatul înapoi în conversație; modelul generează răspunsul final.
- Frontend rămâne neschimbat (trimite messages + systemPrompt); backend face loop-ul tool-call → execute → append → re-call model până când nu mai sunt tool_calls.

**Beneficii:** Citiri de fișiere și listări verificate; răspunsuri grounded în conținut real; mai puține halucinații legate de structura proiectului.

---

### 3.5 Structured outputs pentru acțiuni OTA – prioritate medie

**Scop:** Blocurile [OTA-READ], [OTA-MEMORY-SAVE], [OTA-VAULT-SAVE] să iasă într-un format valid, verificabil.

**Implementare:**

- Backend poate folosi **structured outputs** (OpenAI: `response_format: { type: "json_schema", json_schema: {...} }`) pentru un „pas” separat: „Din ultimul răspuns al modelului, extrage acțiunile: listă de { type: 'read'|'memory_save'|'vault_save', path?, key?, value? }.” Sau folosești un tool `emit_actions` cu schema strictă.
- Alternativ: după ce modelul răspunde, frontend/backend parsează [OTA-*] și **validează** (path safe, key non-empty); dacă invalid, nu execută și poate trimite înapoi „Acțiune invalidă: …”.

**Reduce:** Erori de parsare și acțiuni malformate.

---

### 3.6 Post-verificare (guardrails) – prioritate medie

**Scop:** Să nu se confirme în chat informații false.

**Idee:**

- După răspuns: dacă modelul citează un endpoint (ex. `/api/ai-trading/xyz`), backend sau frontend verifică că acel endpoint există în lista cunoscută (ex. din OTA_05 sau din config). Dacă nu există, poți atașa un mesaj de corecție sau să nu afișezi răspunsul și să ceri regen.
- Pentru [OTA-READ path="..."]: după ce se încarcă fișierul, conținutul e deja „real”; problema e doar când path-ul e inventat și revine 404 – atunci mesajul „fișier negăsit” e deja afișat utilizatorului.

**Reduce:** Confirmarea unor halucinații (endpoint-uri inexistente).

---

### 3.7 Gestionare erori și retry (frontend + backend) – prioritate medie

**Scop:** Mai puține erori „opace” pentru user și mai mult succes la request-uri tranzitorii.

- **Frontend:** Deja există timeout 15s + 1 retry la eroare de rețea. Poți adăuga: mesaje user-friendly per cod (503 = „Serviciul e ocupat, încearcă în câteva secunde”; 401 = „Sesiune expirată, reconectează-te”).
- **Backend:** La apelul către OpenAI: retry cu backoff la 429/5xx; timeout clar; la eșec, returnare `{ error: "…", code: "RATE_LIMIT" | "OPENAI_ERROR" }` ca să poată frontend să afișeze mesaj adecvat.

**Reduce:** Erori neexplicate și abandonul conversației.

---

### 3.8 Context window și sumarizare – prioritate mai mică

**Scop:** Conversații lungi să nu depășească limita și să păstreze informații importante.

- Trunchiere: păstrezi ultimele N mesaje + system prompt; sau „sliding window” + un mesaj sumar al conversației anterioare.
- Backend poate sumariza periodic (ex. la fiecare 10 mesaje) și înlocui mesajele vechi cu un singur mesaj „Rezumat conversație: …”.

**Reduce:** Erori de context overflow și pierderea regulilor din system prompt.

---

## 4. Rezumat: ce face un „Agent AI full functional” (Cursor-style)

| Capabilitate | Cursor / agent modern | OTA acum | Ce implementăm |
|--------------|------------------------|----------|-----------------|
| **Grounding în documentație** | Rules, docs, codebase search | Doar referințe în text | RAG / injectare docs (3.1) |
| **Tools** | Terminal, browser, read file, search | Blocuri text [OTA-*] | Function calling pe backend (3.4) |
| **Structured outputs** | JSON/ schema pentru acțiuni | Text liber | Schema pentru acțiuni (3.5) |
| **Anti-halucinație** | „Don’t invent” + abstain | Parțial în prompt | Few-shot + reguli explicite (3.2, 3.3) |
| **Verificare** | Erori la rulare, linter | Doar 404 la read | Guardrails endpoint / path (3.6) |
| **Erori robuste** | Retry, mesaje clare | Timeout + retry | Mesaje per cod + retry backend (3.7) |

---

## 5. Pași recomandați (ordine practică)

1. **Prompt (frontend):** Adaugi few-shot + reguli anti-halucinație în `otaSystemPrompt.js` (3.2, 3.3) – fără backend.
2. **RAG simplu (frontend sau backend):** La fiecare request chat, injectezi conținutul fix din OTA_05 (endpoint-uri) și opțional OTA_02 (arhitectură) în system message sau într-un mesaj „Context documentație” (3.1).
3. **Backend:** Implementezi tool-uri (read_file, list_dir, get_doc) + loop function calling (3.4) și îmbunătățești error handling + retry (3.7).
4. **Opțional:** Structured outputs pentru acțiuni (3.5) și guardrails pe endpoint-uri (3.6).

După pașii 1–3, OTA va fi mult mai apropiat de un Agent AI full funcțional, cu mai puține erori și fără halucinații legate de documentație și structura proiectului.

---

**Surse folosite:** OpenAI – Optimizing LLM Accuracy, Hallucination Guardrails, Function Calling, Structured Outputs; RAG și context injection; Cursor – agent tools și grounding; comunitatea OpenAI (strategies for preventing hallucinations).
