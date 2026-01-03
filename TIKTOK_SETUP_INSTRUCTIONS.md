# 🎯 INSTRUCȚIUNI TIKTOK ADS MANAGER - SETĂRI FINALE

## ✅ CE AM IMPLEMENTAT

### Event-uri pentru PLĂȚI (Optimizare TikTok Ads):
1. **CompletePayment** - Când utilizatorii cumpără BITS
   - ✅ Stripe Payment
   - ✅ BNB Payment
   - ✅ SOL Payment
   - ✅ MATIC Payment
   - ✅ Generic Payment (ETH/USDT/USDC)
   - ✅ SHIB Payment

2. **CompleteRegistration** - Când utilizatorii intră în Telegram
   - ✅ WelcomePage Telegram link
   - ✅ Sidebar Telegram link
   - ✅ welcome.html Telegram link
   - ✅ Header Telegram link (Mobile + Desktop)

### Event-uri pentru TRACKING (NU pentru plăți):
- ⏱️ Quick_Visitor (45s) - Analytics intern
- ⏱️ Engaged_User (90s) - Analytics intern
- ⏱️ Hot_Lead (150s) - Analytics intern
- 📄 ViewContent - Analytics intern
- 🚪 Page_Exit - Analytics intern

---

## 📋 SETĂRI TIKTOK ADS MANAGER

### PASUL 1: Deschide TikTok Ads Manager
1. Mergi la: https://ads.tiktok.com
2. Loghează-te în contul tău
3. Selectează campania ta existentă SAU creează una nouă

### PASUL 2: Setează Campaign Objective
1. În setările campaniei, găsește **"Campaign Objective"** sau **"Optimization Goal"**
2. Selectează: **"Conversions"** sau **"Complete Payment"**
   - ❌ NU selecta "Traffic" sau "Engagement"
   - ✅ DOAR "Conversions"

### PASUL 3: Selectează Conversion Event
1. În secțiunea **"Conversion Event"** sau **"Pixel Events"**
2. Click pe dropdown-ul pentru event-uri
3. Selectează **"CompletePayment"** ca event principal
   - ✅ Acesta este event-ul pentru cumpărături (BUY)
4. Opțional: Poți adăuga și **"CompleteRegistration"** pentru Telegram joins
   - ✅ Dacă vrei să optimizezi și pentru Telegram joins

### PASUL 4: Bid Strategy
1. Găsește secțiunea **"Bid Strategy"** sau **"Bidding"**
2. Selectează: **"Cost per Conversion (CPA)"** sau **"Lowest Cost"**
3. Setează bugetul dorit:
   - **Daily Budget**: suma pe care vrei să o cheltuiești zilnic
   - **Bid Amount**: cost-ul maxim pe conversie (opțional, pentru CPA)

### PASUL 5: IGNORĂ aceste event-uri (NU folosi pentru optimizare):
❌ **Quick_Visitor** - DOAR pentru tracking
❌ **Engaged_User** - DOAR pentru tracking
❌ **Hot_Lead** - DOAR pentru tracking
❌ **ViewContent** - DOAR pentru tracking
❌ **Page_Exit** - DOAR pentru tracking
❌ **InitiateCheckout** - NU folosi (ai CompletePayment care este mai bun)

**IMPORTANT:** Aceste event-uri sunt track-uite pentru analytics intern, dar **NU** le folosi pentru optimizare TikTok Ads!

---

## 🔍 VERIFICARE EVENT-URI

### Cum să verifici că event-urile funcționează:

1. **Deschide TikTok Events Manager:**
   - Mergi la: https://ads.tiktok.com/help/article?aid=9579
   - Sau în TikTok Ads Manager: **Assets → Events**

2. **Verifică Pixel Status:**
   - Pixel ID: `D3RH23RC77U1STIOO1T0`
   - Status: Trebuie să fie "Active"

3. **Testează event-urile:**
   - **CompletePayment**: Fă o plată test (Stripe sau crypto) și verifică în Events Manager că apare event-ul
   - **CompleteRegistration**: Click pe un link Telegram și verifică că apare event-ul

4. **Verifică parametrii event-urilor:**
   - CompletePayment ar trebui să aibă: `value`, `currency`, `payment_method`, `content_name`
   - CompleteRegistration ar trebui să aibă: `content_name`, `method`

---

## 📊 REZUMAT FINAL

### PLĂTEȘTI DOAR PENTRU:
✅ **CompletePayment** - Cumpărături reale (BUY)
✅ **CompleteRegistration** - Telegram joins

### URMEZI (NU PLĂTEȘTI) PENTRU:
⏱️ Time-based events (Quick_Visitor, Engaged_User, Hot_Lead)
📄 View events (ViewContent, Page_Exit)

### SETĂRI TIKTOK ADS:
- **Objective**: Conversions
- **Event**: CompletePayment (și/sau CompleteRegistration)
- **Bid Strategy**: Cost per Conversion (CPA)
- **IGNORĂ**: Quick_Visitor, Engaged_User, Hot_Lead, ViewContent, Page_Exit

---

## 🚀 DEPLOYMENT

Pentru a deploi build-ul pe S3:

1. **Setează variabila de mediu:**
   ```powershell
   $env:S3_BUCKET_NAME = "numele-bucket-ului-tau"
   ```

2. **Rulează deploy script:**
   ```powershell
   npm run deploy:s3
   ```

3. **Sau manual cu AWS CLI:**
   ```powershell
   aws s3 sync build/ s3://numele-bucket-ului-tau --delete
   ```

---

## ❓ SUPORT

Dacă ai întrebări sau probleme:
1. Verifică că pixel-ul TikTok este activ în Events Manager
2. Verifică că event-urile apar corect după testare
3. Așteaptă 24-48h pentru ca TikTok să colecteze date suficiente pentru optimizare

