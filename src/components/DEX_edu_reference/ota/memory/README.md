# Memorie auxiliară OTA

Acest folder este **zona de memorie auxiliară** a OTA: aici OTA poate să salveze, să actualizeze sau să șteargă informații importante (decizii, preferințe, rezumate de conversații, cheat sheet-uri).

- **Cale locală:** `C:\Users\bits\Desktop\frontend-edu\src\components\DEX\ota\memory\`
- **Cale relativă din repo:** `src/components/DEX/ota/memory/`

OTA poate scrie singur în acest folder: când răspunde cu blocurile [OTA-MEMORY-SAVE] și [OTA-MEMORY-DELETE], un server local aplică automat scrierile/ștergerile. Pornește serverul cu: **node scripts/ota-memory-server.js** (în rădăcina frontend-edu). Poți și tu să pui aici fișiere pe care OTA să le „citească” când îi dai conținutul în chat.

## Exemplu de fișiere pe care OTA le poate gestiona

- `decizii.md` – decizii tehnice sau de produs
- `preferinte.md` – preferințe ale proprietarului (limbă, stil răspuns)
- `rezumat-conversatii.md` – rezumate importante din chat
- `cheatsheet.md` – comenzi / pași frecvenți

Fișierele din acest folder sunt ignorate în `.gitignore` dacă vrei să rămână doar locale (opțional).
