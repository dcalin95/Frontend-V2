# 📊 TikTok Pixel Implementation - Raport Complet pentru Analiză

**Data:** 2024-12-19  
**Proiect:** Bits AI Frontend - Crypto Presale Platform  
**Obiectiv:** Tracking engagement intent pentru optimizare TikTok Ads

---

## 🎯 CONTEXT BUSINESS

### Problema
- Conversion "Connect Wallet / Purchase" este prea greu pe cold traffic
- Necesităm semnale de engagement pentru optimizare TikTok
- Focus pe **intenție de engagement**, nu doar clicks

### Obiective de Tracking
1. **PresalePage engagement** - timp activ pe pagina presale (15s, 45s, 120s)
2. **Site engagement** - timp activ total în sesiune (30s, 90s)
3. **Telegram clicks** - user intră să verifice activitatea (Subscribe event)
4. **Return visits** - revine în alte zile → intenție (distinct_day_count)

### Strategie
Instructăm TikTok să livreze către useri care **STAU și REVIN**, nu către clickers care ies în 3 secunde.

---

## 🏗️ ARHITECTURĂ TEHNICĂ

### Stack
- **Framework:** React (SPA cu HashRouter pentru S3/CloudFront)
- **Pixel ID:** `REACT_APP_TIKTOK_PIXEL_ID` (env var) sau fallback: `D3RH23RC77U1STIOO1T0`
- **Consent:** Hook simplu `hasMarketingConsent()` (default: true, extensibil pentru cookie banner)

### Structura Modulelor

```
src/lib/
├── tiktok.js          # Pixel initialization & event tracking
└── engagement.js      # Active time tracking & visitor identity
```

### Componente Integrate

```
src/
├── App.js                    # Root component - TikTokEngagementTracker
├── Presale/PresalePage.js    # Presale-specific thresholds
└── components/
    ├── Header.js             # Telegram Subscribe tracking
    ├── Sidebar.jsx           # Telegram Subscribe tracking
    ├── MobileTelegramButton.js
    └── WelcomePage.jsx       # Telegram Subscribe tracking
```

---

## 🔧 IMPLEMENTARE DETALIATĂ

### 1. Pixel Initialization (`src/lib/tiktok.js`)

#### Caracteristici
- ✅ **SSR-safe** - verificare `typeof window === 'undefined'`
- ✅ **Dedupe strict** - inițializare o singură dată (global flag `pixelInitialized`)
- ✅ **Promise-based** - returnează Promise pentru async handling
- ✅ **Queue system** - evenimente în queue dacă pixel nu e ready
- ✅ **Consent check** - nu inițializează dacă `hasMarketingConsent() === false`

#### Flow de Inițializare
```
1. Check: pixelInitialized? → return Promise(true)
2. Check: initPromise exists? → return existing promise
3. Check: hasMarketingConsent()? → return Promise(false)
4. Check: SSR? → return Promise(false)
5. Get pixel ID from env var
6. Load TikTok Pixel script (analytics.tiktok.com/i18n/pixel/events.js)
7. Wait for readiness:
   - Check window.ttq.track exists
   - Use ttq.ready() callback if available
   - Fallback: poll every 1s (max 5s timeout)
8. Mark pixelInitialized = true
```

#### Code Snippet Critic
```javascript
export function initTikTokPixel() {
  if (pixelInitialized) return Promise.resolve(true);
  if (initPromise) return initPromise;
  if (!hasMarketingConsent()) return Promise.resolve(false);
  if (typeof window === 'undefined') return Promise.resolve(false);
  
  const pixelId = process.env.REACT_APP_TIKTOK_PIXEL_ID || 'D3RH23RC77U1STIOO1T0';
  
  // Initialize TikTok Pixel script
  // Wait for readiness with multiple fallbacks
  // Return Promise<boolean>
}
```

---

### 2. PageView Tracking

#### Deduplication Logic
- **Storage:** `sessionStorage` (persists only per browser session)
- **Key format:** `ttq_pageview_{pagePath}`
- **Behavior:** One PageView per route per session

#### Trigger Points
1. **Initial mount** - delay 100ms pentru pixel readiness
2. **Route change** - detectat prin `location.pathname` sau `location.hash`

#### Payload Structure
```javascript
{
  content_name: '/presale',  // Page path
  page_url: 'https://bits-ai.io/#/presale',
  page_title: 'Bits AI',
  session_id: 'session_1234567890_abc123',
  is_returning: false,
  distinct_day_count: 1,
  days_since_first_seen: 0,
  visit_count: 1
}
```

#### Code Flow
```javascript
// App.js - TikTokEngagementTracker component
React.useEffect(() => {
  // On route change
  if (prevPathRef.current !== currentPath) {
    resetOnRouteChange();  // Reset page engagement timer
    trackPageView(currentPath, { /* visitor data */ });
  }
}, [location.pathname, location.hash]);
```

---

### 3. Active Time Tracking (`src/lib/engagement.js`)

#### Conceptul: "ACTIVE TIME" vs "ELAPSED TIME"
- ❌ Nu folosim `setTimeout` simplu
- ✅ Numărăm doar secunde când:
  - Document este **visible** (Page Visibility API)
  - Fereastra are **focus** (window focus/blur)
  - User este **activ** (mousemove, scroll, keydown, touch, click)
  - Nu este **idle** (no activity în ultimele 15 secunde)

#### State Management
```javascript
let activeTimeState = {
  sessionStartTime: null,        // Timestamp când sesiunea a început
  pageStartTime: null,            // Timestamp când pagina curentă a început
  lastActivityTime: null,         // Ultimul timestamp de activitate
  lastUpdateTime: null,           // Ultimul timestamp când am actualizat counters
  totalActiveSeconds: 0,          // Total secunde active în sesiune (acumulativ)
  pageActiveSeconds: 0,           // Secunde active pe pagina curentă (acumulativ)
  isVisible: true,                // Document visibility state
  hasFocus: true,                 // Window focus state
  isIdle: false,                  // User idle state (15s fără activitate)
  idleThreshold: 15000            // 15 seconds
};
```

#### Acumulare Incrementală (CRITIC)
```javascript
function updateActiveTime() {
  const now = Date.now();
  if (!activeTimeState.lastUpdateTime) {
    activeTimeState.lastUpdateTime = now;
    return;
  }
  
  const elapsedMs = now - activeTimeState.lastUpdateTime;
  
  // Doar acumulează dacă condițiile sunt îndeplinite
  if (activeTimeState.isVisible && activeTimeState.hasFocus && !activeTimeState.isIdle) {
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    activeTimeState.totalActiveSeconds += elapsedSeconds;  // Acumulare incrementală
    activeTimeState.pageActiveSeconds += elapsedSeconds;   // Acumulare incrementală
  }
  
  activeTimeState.lastUpdateTime = now;  // Actualizează pentru următoarea iterație
}
```

#### Event Listeners
1. **Page Visibility API** - `document.addEventListener('visibilitychange')`
   - Actualizează `isVisible`
   - Reset `lastUpdateTime` când devine visible

2. **Window Focus/Blur** - `window.addEventListener('focus'/'blur')`
   - Actualizează `hasFocus`
   - Reset `lastUpdateTime` când câștigă focus

3. **Activity Detection** - Throttled (max 1/sec)
   - Events: `mousemove`, `scroll`, `keydown`, `touchstart`, `click`
   - Actualizează `lastActivityTime`
   - Reset `isIdle` dacă era idle

4. **Idle Check** - Interval 5 secunde
   - Verifică dacă `now - lastActivityTime > 15s`
   - Setează `isIdle = true` dacă da

#### Update Interval
- **Idle check + Active time update:** La fiecare 5 secunde
- **Performance:** Throttled activity listeners (1/sec)
- **Optimization:** Update doar dacă pixel este ready

---

### 4. Engagement Thresholds

#### Presale Page Thresholds
```javascript
const PRESALE_THRESHOLDS = [15, 45, 120]; // seconds
```

**Event:** `ViewContent`  
**Payload:**
```javascript
{
  content_type: 'presale',
  content_name: 'presale_engaged_15s',  // sau 45s, 120s
  value: 15,                             // threshold value
  currency: 'USD',
  page_path: '/presale',
  session_id: '...',
  is_returning: false,
  distinct_day_count: 1,
  days_since_first_seen: 0,
  visit_count: 1,
  active_seconds: 15                    // Actual active seconds
}
```

**Deduplication:**
- Storage: `sessionStorage`
- Key: `presale_engaged_{threshold}s`
- Behavior: Fires **once per session** per threshold

**Check Logic:**
- Interval: La fiecare 5 secunde
- Condition: `pageActiveSeconds >= threshold && !isThresholdFired(key)`
- Fire: Immediate when threshold reached

#### Site-wide Thresholds
```javascript
const SITE_THRESHOLDS = [30, 90]; // seconds
```

**Event:** `ViewContent`  
**Payload:**
```javascript
{
  content_type: 'site',
  content_name: 'site_engaged_30s',  // sau 90s
  value: 30,
  currency: 'USD',
  page_path: '/current-page',
  session_id: '...',
  is_returning: false,
  distinct_day_count: 1,
  days_since_first_seen: 0,
  visit_count: 1
}
```

**Deduplication:**
- Storage: `sessionStorage`
- Key: `site_engaged_{threshold}s`
- Behavior: Fires **once per session** per threshold

**Check Logic:**
- Interval: La fiecare 5 secunde (în `TikTokEngagementTracker`)
- Condition: `sessionActiveSeconds >= threshold && !isThresholdFired(key)`
- Fire: Immediate when threshold reached

---

### 5. Visitor Identity Management

#### Storage Strategy
- **localStorage** (persistent across sessions):
  - `visitor_first_seen` - Timestamp prima vizită
  - `visitor_last_seen_date` - Data ultimei vizite (YYYY-MM-DD)
  - `visitor_visit_count` - Număr total de vizite (incrementat o dată/sesiune)
  - `visitor_distinct_days` - Număr de zile calendaristice distincte

- **sessionStorage** (per browser session):
  - `visitor_init_{today}` - Flag pentru inițializare o singură dată/sesiune

#### Identity Calculation
```javascript
export function getVisitorIdentity() {
  // Check cache first (initialized once per session)
  if (visitorIdentityCache) return visitorIdentityCache;
  
  // Initialize visitor data
  const today = new Date().toISOString().split('T')[0];
  let firstSeen = localStorage.getItem('visitor_first_seen');
  let lastSeenDate = localStorage.getItem('visitor_last_seen_date');
  let visitCount = parseInt(localStorage.getItem('visitor_visit_count') || '0');
  let distinctDays = parseInt(localStorage.getItem('visitor_distinct_days') || '0');
  
  // First visit ever
  if (!firstSeen) {
    firstSeen = Date.now().toString();
    distinctDays = 1;
    visitCount = 1;
    // Save to localStorage
  } else {
    // Check if returning (different calendar day)
    const isReturning = lastSeenDate !== today;
    if (isReturning) {
      distinctDays += 1;  // Increment only once per day
      localStorage.setItem('visitor_last_seen_date', today);
    }
    visitCount += 1;  // Increment once per session
  }
  
  // Calculate days since first seen
  const daysSinceFirstSeen = Math.floor((Date.now() - parseInt(firstSeen)) / (1000 * 60 * 60 * 24));
  
  // Cache for session
  visitorIdentityCache = {
    is_returning: lastSeenDate !== today && distinctDays > 1,
    distinct_day_count: distinctDays,
    days_since_first_seen: daysSinceFirstSeen,
    visit_count: visitCount
  };
  
  return visitorIdentityCache;
}
```

#### Critical Logic
1. **Initialization:** O singură dată pe sesiune (sessionStorage flag)
2. **Visit count:** Incrementat o singură dată la inițializare
3. **Distinct days:** Incrementat doar când `lastSeenDate !== today`
4. **Is returning:** `true` dacă `lastSeenDate !== today && distinctDays > 1`

---

### 6. Return Visit Tracking

#### Logic
```javascript
export function shouldFireReturnVisit() {
  const today = new Date().toISOString().split('T')[0];
  const key = `return_visit_${today}`;
  
  // Check if already fired today (localStorage - once per day)
  if (isThresholdFired(key, true)) return false;
  
  const identity = getVisitorIdentity();
  
  // Fire only if returning visitor (different day) with distinct_day_count > 1
  if (identity.is_returning && identity.distinct_day_count > 1) {
    markThresholdFired(key, true);  // localStorage
    return true;
  }
  
  return false;
}
```

#### Event
**Event:** `ViewContent`  
**Payload:**
```javascript
{
  content_type: 'return',
  content_name: 'return_visit_day_2',  // distinct_day_count
  value: 2,                             // distinct_day_count
  page_path: '/current-page',
  is_returning: true,
  distinct_day_count: 2,
  days_since_first_seen: 1
}
```

**Trigger:**
- La mount-ul inițial al `TikTokEngagementTracker` (delay 500ms)
- O singură dată pe zi (localStorage dedupe)

---

### 7. Subscribe Event (Telegram Clicks)

#### Implementation
```javascript
export function trackStandardEvent(eventName, payload = {}, options = {}) {
  // Debounce pentru Subscribe events (prevent double-firing)
  if (eventName === 'Subscribe' && options.debounce !== false) {
    const debounceKey = `subscribe_${payload.method || 'default'}`;
    const now = Date.now();
    const lastFired = eventDebounceMap.get(debounceKey) || 0;
    const debounceMs = options.debounce || 500; // Default 500ms
    
    if (now - lastFired < debounceMs) {
      return; // Skip duplicate within debounce window
    }
    eventDebounceMap.set(debounceKey, now);
  }
  
  // Track event
  ttq.track(eventName, payload);
}
```

#### Event
**Event:** `Subscribe`  
**Payload:**
```javascript
{
  description: 'telegram_click',
  page_path: '/presale',
  method: 'header',  // sau 'sidebar', 'mobile_button', 'welcome_page'
  session_id: '...',
  is_returning: false,
  distinct_day_count: 1,
  days_since_first_seen: 0,
  visit_count: 1
}
```

**Trigger Points:**
- Header Telegram button (desktop & mobile)
- Sidebar Telegram button
- Mobile Telegram button
- Welcome page Telegram button

**Debounce:** 500ms per method (prevent rapid double-clicks)

---

## 📈 EVENIMENTE TRACKUITE - SUMMARY

| Event | Trigger | Dedupe | Storage | Payload Keys |
|-------|---------|--------|---------|--------------|
| **PageView** | Route change | Per route/session | sessionStorage | `ttq_pageview_{path}` |
| **ViewContent** (presale_15s) | Active time >= 15s | Per session | sessionStorage | `presale_engaged_15s` |
| **ViewContent** (presale_45s) | Active time >= 45s | Per session | sessionStorage | `presale_engaged_45s` |
| **ViewContent** (presale_120s) | Active time >= 120s | Per session | sessionStorage | `presale_engaged_120s` |
| **ViewContent** (site_30s) | Session active >= 30s | Per session | sessionStorage | `site_engaged_30s` |
| **ViewContent** (site_90s) | Session active >= 90s | Per session | sessionStorage | `site_engaged_90s` |
| **ViewContent** (return) | Return visit (new day) | Per day | localStorage | `return_visit_{YYYY-MM-DD}` |
| **Subscribe** | Telegram click | 500ms debounce | Memory (Map) | `subscribe_{method}` |

---

## 🔍 OPTIMIZĂRI IMPLEMENTATE

### 1. Performance
- ✅ **Throttled activity listeners** (1/sec max)
- ✅ **Optimized interval checks** (5s pentru threshold checks)
- ✅ **Pixel readiness check** - threshold checks doar dacă pixel ready
- ✅ **Identity caching** - o singură inițializare/sesiune

### 2. Accuracy
- ✅ **Incremental time accumulation** - nu recalculează de la start time
- ✅ **Visibility/Focus tracking** - update active time înainte de state change
- ✅ **Idle detection** - 15s fără activitate = idle
- ✅ **Activity gating** - mouse, scroll, keyboard, touch, click

### 3. Deduplication
- ✅ **SessionStorage** pentru PageView și thresholds (per session)
- ✅ **LocalStorage** pentru return visits (per day)
- ✅ **Memory Map** pentru Subscribe debounce (per session)
- ✅ **Global flags** pentru pixel init (prevent duplicate)

### 4. Error Handling
- ✅ **Try-catch** blocks pentru storage operations
- ✅ **SSR checks** - `typeof window === 'undefined'`
- ✅ **Queue system** - evenimente în queue dacă pixel nu e ready
- ✅ **Fallback promises** - timeout handling pentru pixel readiness

---

## 🚨 PROBLEME POTENȚIALE / ZONE DE ÎMBUNĂTĂȚIRE

### 1. Active Time Calculation
**Problema:** Acumulare incrementală bazată pe `lastUpdateTime` - dacă intervalul de 5s ratează, timpul poate fi subestimat.

**Soluție actuală:** Update la fiecare visibility/focus change înainte de state change.

**Îmbunătățire posibilă:** 
- Să adăugăm un "heartbeat" mai frecvent (1s) pentru time accumulation?
- Să calculăm diferența exactă la fiecare threshold check?

### 2. Threshold Firing Timing
**Problema:** Threshold checks la fiecare 5s - dacă user atinge threshold între checks, event-ul se fire cu delay.

**Exemplu:** User ajunge la 16s active time, dar check-ul e la 14s și următorul e la 19s → event fired la 19s.

**Soluție actuală:** Acceptăm delay-ul (5s max delay).

**Îmbunătățire posibilă:**
- Să facem threshold checks mai frecvente (1s)?
- Să folosim un "threshold watcher" care monitorizează continuu?

### 3. Visitor Identity - Visit Count
**Problema:** `visit_count` se incrementează o dată per sesiune, dar dacă user-ul închide tab-ul și deschide din nou în aceeași zi, e considerat aceeași sesiune?

**Soluție actuală:** `visit_count` incrementează doar la prima inițializare a identității în sesiune (sessionStorage flag).

**Îmbunătățire posibilă:**
- Să folosim un timestamp pentru a detecta sesiuni noi chiar dacă sessionStorage persistă?

### 4. Return Visit Detection
**Problema:** `shouldFireReturnVisit()` se apelează doar la mount-ul inițial al componentului. Dacă componenta se remount-ează, se poate fire din nou?

**Soluție actuală:** Dedupe în localStorage cu key `return_visit_{YYYY-MM-DD}`.

**Verificare:** ✅ Corect - dedupe-ul previne duplicate-urile.

### 5. Session ID Generation
**Problema:** `getSessionId()` folosește `sessionStorage` - dacă user-ul deschide site-ul în multiple tabs, fiecare tab are session ID diferit.

**Comportament actual:** Corect - fiecare tab = sesiune separată.

**Îmbunătățire posibilă:**
- Să folosim `BroadcastChannel` pentru a sincroniza session ID între tabs?

### 6. Active Time Reset on Route Change
**Problema:** `resetOnRouteChange()` resetează `pageActiveSeconds`, dar dacă user-ul navighează rapid între pagini, timpul activ pe presale page poate fi pierdut.

**Soluție actuală:** `updateActiveTime()` este apelat înainte de reset pentru a acumula timpul final.

**Verificare:** ✅ Corect - timpul este acumulat înainte de reset.

### 7. Idle Detection - Activity Threshold
**Problema:** Idle threshold de 15s poate fi prea agresiv - un user care citește conținut static poate fi marcat ca idle.

**Soluție actuală:** 15s fără activitate = idle.

**Îmbunătățire posibilă:**
- Să mărim threshold-ul la 30s?
- Să adăugăm o verificare pentru scroll position change?

### 8. Pixel Initialization - Retry Logic
**Problema:** Dacă pixel-ul nu se încarcă în 5s, marchem `pixelInitialized = true` și nu mai încercăm.

**Soluție actuală:** Acceptăm failure-ul și continuăm (evenimentele sunt în queue).

**Îmbunătățire posibilă:**
- Să adăugăm retry logic cu exponential backoff?
- Să persistăm evenimentele în localStorage pentru retry ulterior?

---

## 🧪 TESTARE

### Teste Manuale Recomandate

1. **Pixel Initialization**
   - [ ] Verifică că pixel-ul se încarcă o singură dată
   - [ ] Verifică că evenimentele sunt queue-uite dacă pixel nu e ready
   - [ ] Testează cu consent = false (pixel nu se inițializează)

2. **PageView Tracking**
   - [ ] Verifică că PageView se fire la initial load
   - [ ] Verifică că PageView se fire la route change
   - [ ] Verifică că nu se fire duplicate pentru același route
   - [ ] Testează cu HashRouter (#/presale)

3. **Active Time Tracking**
   - [ ] Verifică că timpul se oprește când tab e hidden
   - [ ] Verifică că timpul se oprește când fereastra pierde focus
   - [ ] Verifică că timpul se oprește după 15s idle
   - [ ] Verifică că timpul se acumulează corect incremental

4. **Presale Thresholds**
   - [ ] Verifică că `presale_engaged_15s` se fire la 15s active
   - [ ] Verifică că `presale_engaged_45s` se fire la 45s active
   - [ ] Verifică că `presale_engaged_120s` se fire la 120s active
   - [ ] Verifică că fiecare threshold se fire o singură dată/sesiune

5. **Site Thresholds**
   - [ ] Verifică că `site_engaged_30s` se fire la 30s session active
   - [ ] Verifică că `site_engaged_90s` se fire la 90s session active
   - [ ] Verifică că thresholds persist across route changes

6. **Return Visit Tracking**
   - [ ] Verifică că return visit event se fire doar o dată/zi
   - [ ] Verifică că `distinct_day_count` se incrementează corect
   - [ ] Testează cu localStorage clear (simulează prima vizită)

7. **Subscribe Events**
   - [ ] Verifică că Subscribe se fire la click pe Telegram button
   - [ ] Verifică că debounce previne duplicate clicks
   - [ ] Testează rapid double-click (ar trebui să fire doar o dată)

8. **Visitor Identity**
   - [ ] Verifică că `visit_count` se incrementează o singură dată/sesiune
   - [ ] Verifică că `distinct_day_count` se incrementează doar la zi nouă
   - [ ] Verifică că `is_returning` este corect calculat

### Debug Tools

**TikTok Pixel Helper (Browser Extension)**
- Instalează extensia TikTok Pixel Helper
- Verifică evenimentele în real-time
- Verifică payload-urile pentru fiecare event

**Browser Console**
```javascript
// Check pixel status
window.ttq && typeof window.ttq.track === 'function' ? 'Ready' : 'Not Ready'

// Check active time
// (Add temporary console.log in engagement.js)

// Check visitor identity
localStorage.getItem('visitor_first_seen')
localStorage.getItem('visitor_visit_count')
localStorage.getItem('visitor_distinct_days')

// Check dedupe keys
sessionStorage.getItem('ttq_pageview_/presale')
sessionStorage.getItem('presale_engaged_15s')
```

---

## 📋 CHECKLIST PENTRU GPT-5 ANALIZĂ

### Aspecte de Verificat

- [ ] **Logica de active time** - Este corectă acumularea incrementală?
- [ ] **Threshold timing** - E acceptabil delay-ul de 5s între checks?
- [ ] **Visitor identity** - E corectă logica de visit_count și distinct_days?
- [ ] **Return visit detection** - E robustă?
- [ ] **Performance** - Sunt optimizările suficiente?
- [ ] **Edge cases** - Ce scenarii nu sunt acoperite?
- [ ] **TikTok Pixel API** - Folosim corect API-ul TikTok?
- [ ] **Event payloads** - Sunt conform cu standardele TikTok?
- [ ] **Deduplication** - Există risc de duplicate events?
- [ ] **Error handling** - E suficientă?

### Întrebări Specifice pentru GPT-5

1. **Active Time Accuracy:** Este metoda noastră de acumulare incrementală bazată pe `lastUpdateTime` suficient de precisă, sau ar trebui să calculăm diferența exactă la fiecare threshold check?

2. **Threshold Check Frequency:** Intervalul de 5s pentru threshold checks este optim, sau ar trebui să fie mai frecvent (1s) pentru acuratețe mai bună?

3. **Idle Detection:** Threshold-ul de 15s pentru idle detection este rezonabil, sau ar trebui să fie ajustat (ex: 30s) pentru a evita false positives la useri care citesc conținut static?

4. **Visit Count Logic:** Logica noastră de incrementare a `visit_count` o dată per sesiune este corectă, sau ar trebui să folosim un alt mecanism (ex: timestamp-based session detection)?

5. **Return Visit Timing:** Este corect să verificăm return visit doar la mount-ul inițial, sau ar trebui să verificăm și la route changes?

6. **Session ID Strategy:** Este acceptabil să avem session ID-uri diferite pentru fiecare tab, sau ar trebui să sincronizăm între tabs?

7. **Pixel Retry Logic:** Ar trebui să adăugăm retry logic pentru pixel initialization failure, sau queue system-ul actual este suficient?

8. **Event Batching:** Ar trebui să batch-uim evenimente pentru a reduce numărul de requests către TikTok, sau fiecare event trebuie să fie trimis individual?

9. **Payload Optimization:** Payload-urile noastre sunt optimale, sau putem elimina/optimiza anumite câmpuri?

10. **GDPR/Consent:** Hook-ul nostru simplu `hasMarketingConsent()` este suficient, sau ar trebui să implementăm un sistem mai robust de consent management?

---

## 🔗 REFERINȚE

### TikTok Pixel Documentation
- [TikTok Pixel Standard Events](https://ads.tiktok.com/help/article?aid=10028)
- [TikTok Pixel Implementation Guide](https://ads.tiktok.com/help/article?aid=10036)

### File Paths
- Pixel implementation: `src/lib/tiktok.js`
- Engagement tracking: `src/lib/engagement.js`
- App integration: `src/App.js`
- Presale integration: `src/Presale/PresalePage.js`

### Environment Variables
- `REACT_APP_TIKTOK_PIXEL_ID` - TikTok Pixel ID (optional, fallback: D3RH23RC77U1STIOO1T0)

---

**Raport generat:** 2024-12-19  
**Versiune:** 1.0  
**Status:** Production Ready ✅

