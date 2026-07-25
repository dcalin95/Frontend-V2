# BitSwapDEX AI (`bits-ai.io`)

Aplicația principală BitSwapDEX AI combină experiența publică BITS (presale,
staking, rewards și educație) cu portofoliu, wallet, DEX și sistemul OTA de
analiză și operare trading.

## Arhitectura curentă

- Frontend local: `C:\Users\bits\Desktop\frontend`
- Backend local: `C:\Users\bits\Desktop\backend-server`
- Producție frontend: `https://bits-ai.io`
- DEX/OTA: `https://bits-ai.io/#/dex-edu/*`
- API producție: `https://backend-server-eu.onrender.com/api`

Frontendul este construit din branch-ul `main` prin GitHub Actions, publicat în
bucketul AWS S3 `bits-ai.io` și servit prin CloudFront. Backendul Express este
deployat separat pe Render din repository-ul `backend-server`.

## Documentație canonică

Începe cu:

1. `DOCUMENTATION_INDEX.md`
2. `docs/DOCUMENTATION_AUDIT_2026-07-18.md`
3. `src/components/DEX_edu_reference/ota/docs/CURRENT_OPERATIONAL_TRUTH.md`
4. `src/components/DEX_edu_reference/ota/docs/CURRENT_PROJECT_STATUS_2026-07-18.md`
5. backend: `docs/OTA_PRODUCTION_CONTRACT.md`

Documentele mai vechi sunt păstrate pentru trasabilitate. Afirmațiile istorice
despre `frontend-edu`, `/dex/*`, un backend nedeployat sau hostname-ul
`backend-server-f82y.onrender.com` nu sunt instrucțiuni operaționale curente.

## Rulare locală

Creează `.env.local` fără a-l comite:

```env
REACT_APP_BACKEND_URL=https://backend-server-eu.onrender.com
```

Administrator passwords must never use a `REACT_APP_*` variable. The legacy
admin panel accepts the password interactively and the backend validates it.

Apoi:

```bash
npm install
npm start
```

Verificări:

```bash
npm test -- --watchAll=false --runInBand
npm run build
```

## Reguli de securitate

- Nu adăuga tokenuri, chei private, parole sau fișiere `.env` în Git.
- Orice variabilă `REACT_APP_*` este publică în bundle-ul browserului.
- Secretele LONG/SHORT OTA rămân exclusiv pe server; browserul folosește
  sesiunea autentificată a walletului.
- UI-ul nu acordă autoritate administrativă; backendul validează fiecare
  operație privilegiată.
- OTA nu garantează profit, randament sau acuratețe fixă.
