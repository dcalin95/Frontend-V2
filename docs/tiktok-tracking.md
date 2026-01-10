# 📊 TikTok Pixel - Engagement Intent Tracking

**Data:** 2026-01-09  
**Obiectiv:** Măsurare și optimizare pe "engagement intent" pentru presale crypto

---

## 🎯 Business Context

**Semnal principal (NU "Connect Wallet / Purchase"):**
1. **PresalePage engagement** - timp activ pe pagina presale
2. **Site engagement** - timp activ total în sesiune
3. **Join Telegram click** - user intră să verifice activitatea
4. **Return visits** - revine în alte zile → intenție

**Dorința:** Instruim TikTok să livreze către useri care **STAU** și **REVIN**, nu către clickers care ies în 3 secunde.

---

## 🔧 Setup

### Environment Variable

Adaugă în `.env` sau `.env.local`:

```bash
REACT_APP_TIKTOK_PIXEL_ID=D3RH23RC77U1STIOO1T0
```

**Notă:** Dacă nu este setat, se folosește valoarea default `D3RH23RC77U1STIOO1T0`.

---

## 📡 Evenimente Trimise

### A) PageView

**Când:** La load + la fiecare route change (SPA)

**Dedupe:** O singură dată per route view (sessionStorage)

**Payload:**
```javascript
{
  content_name: '/presale',
  page_url: 'https://bits-ai.io/#/presale',
  page_title: 'Bits AI - Presale',
  session_id: 'session_1234567890_abc123',
  is_returning: true,
  days_since_first_seen: 5,
  visit_count: 12
}
```

---

### B) ViewContent = "Engaged View"

**Standard event acceptat pentru optimizare TikTok Ads.**

#### 1. Presale Page Engagement

**Praguri:**
- `engaged_15s` - după 15 secunde ACTIVE pe presale
- `engaged_45s` - după 45 secunde ACTIVE pe presale
- `engaged_120s` - după 120 secunde ACTIVE pe presale

**Dedupe:** O singură dată per sesiune per prag (sessionStorage)

**Payload:**
```javascript
{
  content_type: 'presale',
  content_name: 'presale_engaged_45s',
  value: 45,
  currency: 'USD',
  page_path: '/presale',
  session_id: 'session_1234567890_abc123',
  is_returning: true,
  days_since_first_seen: 5,
  visit_count: 12,
  active_seconds: 45
}
```

#### 2. Site-Wide Engagement

**Praguri:**
- `site_engaged_30s` - după 30 secunde ACTIVE în sesiune
- `site_engaged_90s` - după 90 secunde ACTIVE în sesiune

**Dedupe:** O singură dată per sesiune (sessionStorage)

**Payload:**
```javascript
{
  content_type: 'site',
  content_name: 'site_engaged_90s',
  value: 90,
  currency: 'USD',
  page_path: '/presale',
  session_id: 'session_1234567890_abc123',
  is_returning: true,
  days_since_first_seen: 5,
  visit_count: 12
}
```

#### 3. Return Visit (Opțional)

**Când:** Prima pagină a zilei (o dată/zi)

**Dedupe:** O dată pe zi (localStorage key = YYYY-MM-DD)

**Payload:**
```javascript
{
  content_type: 'return',
  content_name: 'return_visit_day_5',
  value: 5, // distinct_day_count
  page_path: '/presale',
  is_returning: true,
  distinct_day_count: 5,
  days_since_first_seen: 5
}
```

---

### C) Subscribe = Telegram Click

**Când:** User apasă butonul/iconița Telegram

**Dedupe:** Nu (fiecare click contează, dar protejat cu debounce 500ms în UI)

**Payload:**
```javascript
{
  description: 'telegram_click',
  page_path: '/presale',
  method: 'header', // sau 'sidebar', 'mobile_button', 'welcome_page'
  session_id: 'session_1234567890_abc123',
  is_returning: true,
  days_since_first_seen: 5,
  visit_count: 12
}
```

---

## ⏱️ Active Time Tracking

**IMPORTANT:** Nu folosim doar `setTimeout`. Măsurăm timp **ACTIV**:

### Reguli:
1. **Page Visibility API** - numără doar când `document.visibilityState === 'visible'`
2. **Window Focus** - oprește când fereastra pierde focus (`blur`)
3. **Activity Gating** - dacă nu există `mousemove`/`scroll`/`keydown`/`touch` în ultimele 15 secunde, consideră user "idle" și nu mai numără

### Utilitare:
- `startEngagementTimer()` - pornește tracking-ul
- `getPageActiveSeconds()` - returnează secunde active pe pagină curentă
- `getSessionActiveSeconds()` - returnează secunde active în sesiune
- `resetOnRouteChange()` - resetează timerul pentru pagină (la schimbarea rutei)

---

## 🔐 Consent/GDPR

### Hook de Consent

Funcția `hasMarketingConsent()` verifică:
- `localStorage.getItem('marketing_consent')` - dacă este `'false'`, pixel-ul nu se inițializează

### Setare Consent

```javascript
import { setMarketingConsent } from './lib/tiktok';

// Grant consent
setMarketingConsent(true);

// Revoke consent
setMarketingConsent(false);
```

**Notă:** Dacă există deja un cookie banner, conectează-l la `setMarketingConsent()`.

---

## 🧪 Testare

### 1. TikTok Pixel Helper

1. Instalează extensia [TikTok Pixel Helper](https://chrome.google.com/webstore/detail/tiktok-pixel-helper/...) pentru Chrome
2. Deschide site-ul
3. Verifică că pixel-ul se încarcă (icon verde în toolbar)
4. Navighează pe site și verifică că evenimentele apar

### 2. TikTok Events Manager

1. Mergi la [TikTok Events Manager](https://ads.tiktok.com/help/article?aid=9579)
2. Selectează pixel-ul tău
3. Verifică că evenimentele apar:
   - **PageView** - la fiecare navigare
   - **ViewContent** - la pragurile de timp (15s, 45s, 120s pentru presale; 30s, 90s pentru site)
   - **Subscribe** - la click pe Telegram

### 3. Test Local

**Debug Mode:**
Adaugă `?tiktok_debug=true` în URL pentru a vedea logs în console.

**Disable Tracking:**
Adaugă `?disable_tiktok=true` în URL pentru a dezactiva tracking-ul.

---

## 🐛 Troubleshooting

### Duplicate Events

**Problema:** Același event apare de mai multe ori.

**Soluție:**
- Verifică că dedupe keys sunt setate corect în `sessionStorage`/`localStorage`
- Verifică că `trackPageView()` nu este apelat de mai multe ori pentru aceeași rută

### SPA Routing

**Problema:** PageView nu se trimite la schimbarea rutei.

**Soluție:**
- Verifică că `TikTokEngagementTracker` este în `App.js` și ascultă `location.pathname` și `location.hash`
- Pentru HashRouter, path-ul este în `location.hash`, nu `location.pathname`

### Pixel Not Loading

**Problema:** `window.ttq` nu este disponibil.

**Soluție:**
- Verifică că `REACT_APP_TIKTOK_PIXEL_ID` este setat
- Verifică că consent-ul este acordat (`hasMarketingConsent() === true`)
- Verifică că nu ești pe localhost (pixel-ul este dezactivat automat pe localhost)

### AdBlock

**Problema:** AdBlock blochează pixel-ul.

**Soluție:**
- Nu există soluție perfectă, dar pixel-ul folosește queue system - dacă se încarcă mai târziu, evenimentele vor fi trimise
- Verifică în console dacă există erori de tip `net::ERR_BLOCKED_BY_CLIENT`

### Active Time Not Counting

**Problema:** Timpul activ nu se numără corect.

**Soluție:**
- Verifică că `startEngagementTimer()` este apelat în `App.js`
- Verifică că tab-ul este vizibil (`document.visibilityState === 'visible'`)
- Verifică că fereastra are focus (`document.hasFocus() === true`)
- Verifică că există activitate (mouse/scroll/keyboard/touch) în ultimele 15 secunde

---

## 📋 Acceptance Criteria ✅

- [x] Pixel init o singură dată, SSR-safe, cu env var
- [x] PageView la load + route change, fără duplicate
- [x] ViewContent engaged_15s/45s/120s pe presale doar cu active time (nu tab hidden)
- [x] ViewContent site_engaged_30s/90s pe sesiune, active time, fără duplicate
- [x] Subscribe la Telegram click (fără double fire)
- [x] Return logic: is_returning + distinct_day_count + days_since_first_seen apare în payload
- [x] Opțional return_visit ViewContent 1x/zi
- [x] Documentație completă

---

## 📁 Structură Fișiere

```
src/
├── lib/
│   ├── tiktok.js          # Pixel init, trackPageView, trackStandardEvent
│   └── engagement.js      # Active time tracking, thresholds, visitor identity
├── App.js                 # TikTokEngagementTracker component
├── Presale/
│   └── PresalePage.js     # Presale threshold tracking
└── components/
    ├── Header.js          # Telegram Subscribe tracking
    ├── MobileTelegramButton.js
    ├── Sidebar.jsx
    └── WelcomePage.jsx
```

---

## 🔄 Migration de la Vechea Implementare

**Fișiere vechi (păstrate pentru backward compatibility):**
- `src/utils/tiktok.js` - vechiul sistem (nu se mai folosește)

**Fișiere noi:**
- `src/lib/tiktok.js` - noua implementare
- `src/lib/engagement.js` - engagement tracking

**Breaking Changes:**
- `trackTikTokEvent()` → `trackStandardEvent()`
- `trackTikTokPageView()` → `trackPageView()`
- Threshold-urile vechi (Quick_Visitor, Engaged_User, Hot_Lead) → ViewContent cu active time

---

**Last Updated:** 2026-01-09  
**Status:** ✅ Implementare Completă

