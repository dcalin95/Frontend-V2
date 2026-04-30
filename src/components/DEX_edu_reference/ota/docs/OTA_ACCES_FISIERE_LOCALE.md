# OTA – Acces la fișiere locale (inclusiv online)

Poți da OTA acces la fișiere locale la fel cum dai acces unui Agent AI: **și când folosești app-ul online (deploy pe S3)**, dacă rulezi pe PC-ul tău serverul local, OTA poate citi fișiere de pe mașina ta.

## Cum funcționează

1. **Serverul local** (din frontend-edu): `node scripts/ota-memory-server.js`
   - Ascultă pe `http://localhost:3765`.
   - Frontend-ul (chiar și cel servit de pe S3) încearcă mereu să citească fișiere de la `localhost:3765`; dacă rulezi serverul pe același PC cu browserul, citirea merge.

2. **Rădăcini implicite**
   - `frontend-edu` – rădăcina proiectului (parent of `scripts/`)
   - `backend-server-repo` – `../backend-server-repo` (sibling pe Desktop)

3. **Rădăcini suplimentare (acces la alte foldere)**

   Setezi variabile de mediu `OTA_ROOT_*`; numele root-ului este cel din env, lowercase.

   **Exemplu – acces la Remix (C:\Users\bits\Desktop\remix):**

   ```bash
   # Windows (PowerShell)
   $env:OTA_ROOT_REMIX = "C:\Users\bits\Desktop\remix"
   node scripts/ota-memory-server.js
   ```

   ```bash
   # Windows (CMD)
   set OTA_ROOT_REMIX=C:\Users\bits\Desktop\remix
   node scripts/ota-memory-server.js
   ```

   Sau creezi un fișier `.env` în rădăcina frontend-edu (dacă serverul citește .env) sau pornești cu un script care setează env-ul.

   După ce pornești serverul cu `OTA_ROOT_REMIX` setat, în chat poți spune OTA: „ai acces la C:\Users\bits\Desktop\remix” sau „poți citi din remix”. OTA va putea cere fișiere cu `[OTA-READ path="app/routes.tsx" root="remix"]`.

## Rezumat

- **Local (app pe localhost):** rulezi `node scripts/ota-memory-server.js` (opțional cu `OTA_ROOT_REMIX=...`); OTA citește din frontend-edu, backend-server-repo și din remix.
- **Online (app pe S3):** pe același PC rulezi serverul local cu rădăcinile dorite; în browser deschizi app-ul de pe S3; OTA va încerca întâi localhost și va citi fișierele de pe mașina ta.
