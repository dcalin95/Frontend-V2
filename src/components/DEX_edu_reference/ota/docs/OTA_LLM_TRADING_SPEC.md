# OTA AI – Funcția LLM de Trading (spec)

Spec pentru **separarea zonei de trading** și pentru **accesul explicit al OTA (LLM) la execuția de trading** atunci când setările din DEX/OTA permit.

---

## 1. Separarea zonelor

| Zonă | Rol | Locație / API |
|------|-----|----------------|
| **Zona de trading (execuție)** | Unde se execută swap-uri și se aplică limitele/policy-ul. Separată de chat. | SwapPanel + swapExecutionService (manual); backend OTA Auto Execution worker (automat); POST /api/ai-trading/execution/execute (când backend expune). |
| **Setări OTA (policy)** | Limite, allowlist, slippage, min delay – ce permite sau restricționează execuția. | AutoTradePanel, OTASettingsPanel; otaPolicyService (get/set policy, token limits, allowlist); GET/POST /api/ai-trading/policy/*. |
| **OTA AI (LLM)** | Chat + decizii. Poate **solicita** un trade; execuția efectivă e în zona de trading, după validare policy. | OTAChatPage, OpenAI chat; eventual bloc [OTA-EXECUTE-SWAP] sau API dedicat pentru „request from LLM”. |

Regulă: **Execuția nu e în chat.** Chat-ul (OTA LLM) poate lua decizia („recomand swap X/Y în limitele tale”) și o poate exprima ca **cerere de execuție**; un modul din zona de trading (frontend sau backend) verifică policy și execută doar dacă setările permit.

---

## 2. Când OTA poate lua decizia de a face trading

- Utilizatorul setează în **OTA AI** (AutoTradePanel / OTA Settings):
  - **Policy enabled** (auto execution permis).
  - **Limite**: max per trade, daily max, slippage, min delay.
  - **Allowlist** (opțional): token-uri/perechi permise.
  - **Bot autorizat** (UserVault) cu sumă maximă autorizată.
- Când aceste setări permit un anumit swap (în limite, în allowlist, sub max autorizat), **OTA (LLM) poate lua decizia** de a solicita acel swap – nu execută singur, ci emite o **cerere de execuție** care este procesată de zona de trading.

---

## 3. Flux: OTA LLM → cerere → execuție (în limite)

1. **Utilizator** dă permisiuni în OTA: policy ON, limite, allowlist, autorizare bot.
2. **OTA (chat)** primește context despre policy/limite (din backend sau din frontend la cerere).
3. **OTA LLM** răspunde cu o decizie de trading în format explicit, de exemplu:
   - Bloc în răspuns: `[OTA-EXECUTE-SWAP tokenIn="BNB" tokenOut="BITS" amountIn="0.1" amountOutMin="0" slippageBps="100"]`
   - Sau backend: OTA trimite la un endpoint dedicat un payload structurat (tokenIn, tokenOut, amountIn, reasonFromLlm).
4. **Frontend sau backend** (zona de trading):
   - Primește cererea (parsare bloc din chat sau request la API).
   - Verifică **policy** (getPolicy, token limits, allowlist) pentru wallet-ul utilizatorului.
   - Dacă totul e în limite și permis → apelează execuția (swapExecutionService pe frontend sau backend worker / execution API).
   - Dacă nu e permis → nu execută și poate returna un mesaj (ex: „Swap refuzat: depășește limita per trade”).

Astfel, **funcția de LLM a DEX** este: a lua decizia și a o exprima ca **cerere**; **execuția** rămâne în zona de trading, cu verificare explicită de policy.

---

## 4. Implementare tehnică (opțiuni)

### A) Frontend: bloc în răspuns OTA + validare policy

- OTA (system prompt) e instruit să emită `[OTA-EXECUTE-SWAP ...]` când recomandă un swap și utilizatorul a setat că permite execuții în limite.
- OTAChatPage (sau un modul dedicat) parsează răspunsul, extrage cererea, apelează getPolicy/getTokenLimits pentru wallet-ul curent, verifică amount/allowlist/slippage.
- Dacă e OK → apelează swapExecutionService.executeSwap (sau API-ul de execuție); dacă nu → afișează mesaj (ex: „Swap nu e în limitele setate”).

### B) Backend: endpoint „request from LLM”

- Backend expune ex: `POST /api/ai-trading/execution/request-from-llm` cu body: `{ walletAddress, tokenIn, tokenOut, amountIn, amountOutMin, slippageBps, reasonFromLlm }`.
- Backend verifică policy (aceleași reguli ca pentru OTA Auto), apoi execută (sau pune în coadă) swap-ul și returnează rezultatul.
- Frontend trimite cererea către acest endpoint când detectează în răspunsul OTA o decizie de swap în limite.

### C) Hibrid

- Frontend parsează `[OTA-EXECUTE-SWAP ...]`, trimite payload-ul la backend `request-from-llm`; backend validează policy și execută (sau returnează „refuzat: motiv”).

---

## 5. Referințe în cod

| Ce | Locație |
|----|--------|
| Policy / limite | otaPolicyService.jsx, useOTAPolicy.js, AutoTradePanel.jsx |
| Execuție swap (manual) | swapExecutionService.jsx, SwapPanel.jsx |
| Execuție (API) | API_ENDPOINTS.EXECUTION_EXECUTE, EXECUTION_TRADES |
| OTA Auto (worker) | scripts/ota-auto-execution-worker-reference.js, GET /api/ai-trading/auto-execution/status |
| Chat OTA | OTAChatPage.jsx, otaSystemPrompt.js |

---

## 6. Rezumat

- **Zona de trading** e separată: SwapPanel + swapExecutionService + backend execution/auto-execution.
- **Setările din DEX/OTA** (policy, limite, allowlist, bot autorizat) decid **ce** poate fi executat.
- **OTA LLM** poate lua **decizia** și o expune ca **cerere** (bloc sau API); execuția efectivă o face zona de trading **doar dacă** setările permit.

Scriptul `scripts/ota-llm-trading-ref.js` verifică că aceste referințe (fișiere, endpoint-uri) există și afișează fluxul pentru implementare.
