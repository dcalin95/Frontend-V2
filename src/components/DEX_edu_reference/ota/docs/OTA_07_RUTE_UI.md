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
