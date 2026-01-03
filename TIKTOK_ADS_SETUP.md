# 📊 TikTok Ads Manager - Configurare pentru Optimizare Conversii

## 🎯 STRATEGIE

**PLĂTEȘTI DOAR PENTRU CONVERSII REALE:**
- ✅ **CompletePayment** - Când utilizatorul cumpără BITS (BUY)
- ✅ **CompleteRegistration** - Când utilizatorul intră în grupul Telegram

**TRACKING PENTRU ANALYTICS (NU PLĂTEȘTI):**
- ⏱️ **Quick_Visitor** (45s) - Tracking intern pentru analytics
- ⏱️ **Engaged_User** (90s) - Tracking intern pentru analytics
- ⏱️ **Hot_Lead** (150s) - Tracking intern pentru analytics
- 📄 **ViewContent** - Tracking intern pentru analytics
- 🚪 **Page_Exit** - Tracking intern pentru analytics

## ⚙️ CONFIGURARE TIKTOK ADS MANAGER

### Pasul 1: Deschide TikTok Ads Manager
1. Mergi la https://ads.tiktok.com
2. Selectează campania ta

### Pasul 2: Setează Optimization Goal
1. În setările campaniei, caută **"Optimization Goal"** sau **"Campaign Objective"**
2. Selectează **"Conversions"** sau **"Complete Payment"**

### Pasul 3: Selectează Conversion Event
1. În secțiunea **"Conversion Event"** sau **"Pixel Events"**
2. Selectează **"CompletePayment"** pentru campanii de cumpărături
3. SAU selectează **"CompleteRegistration"** pentru campanii de Telegram joins
4. SAU folosește **"CompletePayment"** ca event principal (recomandat)

### Pasul 4: Bid Strategy
1. Selectează **"Cost per Conversion"** sau **"CPA (Cost Per Acquisition)"**
2. Setează bugetul dorit per conversie

### Pasul 5: IGNORĂ aceste event-uri (NU optimizează pentru ele):
❌ Quick_Visitor
❌ Engaged_User
❌ Hot_Lead
❌ ViewContent
❌ Page_Exit
❌ InitiateCheckout (dacă există)

**IMPORTANT:** Aceste event-uri sunt doar pentru TRACKING/ANALYTICS intern, NU pentru optimizare TikTok Ads.

## 📋 EVENT-URI TRACK-uite ÎN COD

### CompletePayment Events (PENTRU PLĂȚI):
- **Stripe Payment** - `PresalePage.js` (linia ~265)
- **BNB Payment** - `handleBNBPayment.js` (linia ~235)
- **SOL Payment** - `handleSOLPayment.js` (linia ~620)
- **MATIC Payment** - `handleMATICPayment.js` (linia ~159)
- **Generic Payment** (ETH/USDT/USDC) - `handleGenericPayment.js` (linia ~121)
- **SHIB Payment** - `handleSHIBPayment.js` (linia ~40)

### CompleteRegistration Events (PENTRU PLĂȚI):
- **WelcomePage Telegram** - `WelcomePage.jsx` (linia ~147)
- **Sidebar Telegram** - `Sidebar.jsx` (linia ~83)
- **welcome.html Telegram** - `welcome.html` (linia ~354)
- **Header Telegram (Mobile)** - `Header.js` (linia ~115)
- **Header Telegram (Desktop)** - `Header.js` (linia ~303)

### Tracking Events (PENTRU ANALYTICS - NU PLĂTEȘTI):
- **ViewContent** - `PresalePage.js` (linia ~76) - Tracking când user vede pagina
- **Quick_Visitor** (45s) - `PresalePage.js` (linia ~90) - Tracking pentru utilizatori care stau 45s+
- **Engaged_User** (90s) - `PresalePage.js` (linia ~104) - Tracking pentru utilizatori care stau 90s+
- **Hot_Lead** (150s) - `PresalePage.js` (linia ~119) - Tracking pentru utilizatori care stau 150s+
- **Page_Exit** - `PresalePage.js` (linia ~141) - Tracking când user părăsește pagina

## ✅ REZUMAT

**PENTRU OPTIMIZARE TIKTOK ADS (PLĂȚI):**
- ✅ CompletePayment
- ✅ CompleteRegistration

**PENTRU TRACKING/ANALYTICS (NU PLĂȚI):**
- ⏱️ Quick_Visitor, Engaged_User, Hot_Lead
- 📄 ViewContent, Page_Exit

## 🔍 VERIFICARE

După configurare, verifică în TikTok Events Manager că:
1. CompletePayment events apar când utilizatorii cumpără
2. CompleteRegistration events apar când utilizatorii click pe Telegram
3. Event-urile time-based (Quick_Visitor, etc.) NU sunt folosite pentru optimizare

