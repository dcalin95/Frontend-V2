# Rute UI OTA (DEX)

- **/dex** – redirect la /dex/dashboard.  
- **/dex/dashboard** – Dashboard.  
- **/dex/ota** – Pagina principală OTA AI (OTAPage); mode selector (Advisory / Auto); Learning Features; Access Control.  
- **/dex/ota?mode=advisory** – Mod Advisory (implicit).  
- **/dex/ota?mode=auto** – Mod Auto (AutoTradePanel dacă full + bot autorizat).  
- **/dex/ota/chat** – Chat direct cu OpenAI (proprietar key); autentificare email.  
- **/dex/ota/login, /dex/ota/register, /dex/ota/forgot-password, /dex/ota/reset-password** – Auth OTA.  
- **/dex/ota/profile** – Profil OTA (protejat).  
- **/dex/swap** – Swap; după swap se poate apela recordManualOutcome.  
- **/dex/trade** – Trade (orderbook, limit orders).  
- **/dex/signals** – Lista semnale (același userId/wallet ca AutoTradePanel).
- **/dex/complaints** – **Singurul canal oficial în app** pentru reclamații: formular (mesaj + opțional email de contact + context wallet). Nu există alt „formular de contact” separat pentru DEX în acest produs. **Nu** folosi adrese inventate (ex. support@bitswapdex.com) sau Discord/Telegram ca răspuns standard — nu sunt documentate aici ca flux de reclamații. Din Dashboard: More links → Support → Complaints & feedback.

**SSOT rute:** src/components/DEX/DEXApp.jsx. Sidebar: link-uri către Dashboard, OTA AI, Chat OpenAI, Swap, Trade, etc.

---

## Added for context - 2026-07-04

Lista de mai sus descrie o etapă veche cu `/dex`. În codul actual, aplicația DEX/OTA bogată este montată la **`/dex-edu/*`**.

SSOT curent:

- `src/App.js` - montează `/dex-edu/*`
- `src/components/DEX_edu_reference/DEXApp.jsx` - rutele interne active

Rute curente importante:

- `/dex-edu/dashboard`
- `/dex-edu/swap`
- `/dex-edu/trade`
- `/dex-edu/open-orders`
- `/dex-edu/order-history`
- `/dex-edu/account`
- `/dex-edu/account/analytics`
- `/dex-edu/leverage`
- `/dex-edu/signals`
- `/dex-edu/profile`
- `/dex-edu/ota`
- `/dex-edu/ota/chat`
- `/dex-edu/ota/trade`
- `/dex-edu/ota/logs`
- `/dex-edu/ota/short-ops` - Futures Ops, SHORT + LONG tabs
- `/dex-edu/ota/futures` - redirect la `/dex-edu/ota/short-ops`
- `/dex-edu/ota/short_ops` - redirect la `/dex-edu/ota/short-ops`
- `/dex-edu/ota/sei`
- `/dex-edu/ota/stx`
- `/dex-edu/sei/trade`, `/dex-edu/sei/swap`
- `/dex-edu/stx/trade`, `/dex-edu/stx/swap`
- `/dex-edu/sol/trade`, `/dex-edu/sol/swap`
- `/dex-edu/clob-sei`
- `/dex-edu/site-admin`
- `/dex-edu/complaints`

`/dex` încă există în aplicația principală ca rută legacy pentru `SwapPage` / `TradePage`, dar nu este sursa completă a experienței OTA curente.
