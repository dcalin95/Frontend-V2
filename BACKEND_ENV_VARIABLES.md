# 🔐 Backend Server - Environment Variables Checklist

## 📋 Variabile de mediu necesare pentru backend-server pe Render

### ✅ **CRITICAL - AUTENTIFICARE & SESSION** (NOU - pentru sistemul de login)

| Variabilă | Descriere | Exemplu | Status |
|-----------|-----------|---------|--------|
| `SESSION_SECRET` | Secret pentru sesiuni (cookies) - **OBLIGATORIU** | `your-super-secret-key-change-in-production` | ⚠️ **VERIFICĂ** |
| `CORS_ALLOWED_ORIGINS` | Origin-uri permise pentru CORS (separate prin virgulă) | `https://bits-ai.io,https://www.bits-ai.io` | ⚠️ **VERIFICĂ** |
| `FRONTEND_URL` | URL-ul frontend-ului pentru link-uri email | `https://bits-ai.io` | ⚠️ **VERIFICĂ** |
| `NODE_ENV` | Environment (production/development) | `production` | ⚠️ **VERIFICĂ** |

### ✅ **CRITICAL - EMAIL** (NOU - pentru verificare și resetare parolă)

**OPȚIUNE 1: Resend (Recomandat - mai simplu)**
| Variabilă | Descriere | Exemplu | Status |
|-----------|-----------|---------|--------|
| `RESEND_API_KEY` | API key de la Resend.com | `re_xxxxxxxxxxxxx` | ⚠️ **ADĂUGĂ** |
| `EMAIL_FROM` | Adresa email expeditor (trebuie verificată în Resend) | `noreply@bits-ai.io` | ⚠️ **ADĂUGĂ** |

**OPȚIUNE 2: SMTP (Alternativă)**
| Variabilă | Descriere | Exemplu | Status |
|-----------|-----------|---------|--------|
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` sau `smtp.sendgrid.net` | ⚠️ **ADĂUGĂ** |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` | ⚠️ **ADĂUGĂ** |
| `SMTP_PASS` | SMTP password | `your-app-password` | ⚠️ **ADĂUGĂ** |
| `SMTP_PORT` | SMTP port (default: 587) | `587` sau `465` | ⚠️ **ADĂUGĂ** |
| `SMTP_SECURE` | SSL/TLS (true pentru port 465) | `false` sau `true` | ⚠️ **ADĂUGĂ** |
| `EMAIL_FROM` | Adresa email expeditor | `noreply@bits-ai.io` | ⚠️ **ADĂUGĂ** |

**NOTĂ:** Sistemul încearcă mai întâi Resend, apoi SMTP. Dacă niciuna nu este configurată, doar loghează link-urile (pentru development).

### ✅ **CRITICAL - DATABASE** (Există deja)

| Variabilă | Descriere | Status |
|-----------|-----------|--------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ **VERIFICAT** (din imagine) |

---

## 📋 **EXISTING VARIABLES** (Verifică că sunt setate corect)

### 🔹 **Telegram** (Există deja)
- ✅ `TELEGRAM_BOT_TOKEN`
- ✅ `TELEGRAM_AI_BOT_TOKEN`
- ✅ `TELEGRAM_BROADCAST_BOT_TOKEN`
- ✅ `TELEGRAM_CHAT_ID`
- ✅ `TELEGRAM_GROUP_ID`
- ✅ `TELEGRAM_REPORT_CHAT_ID`
- ✅ `TELEGRAM_CONTRACT_ADDRESS`

### 🔹 **Stripe** (Există deja)
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `STRIPE_PRICE_ID_EUR10`

### 🔹 **Solana** (Există deja)
- ✅ `SOLANA_RECEIVE_WALLET`

### 🔹 **Blockchain** (Verifică dacă există)
- ⚠️ `BSC_RPC_URL` sau `BLOCKCHAIN_URL`
- ⚠️ `TOKEN_CONTRACT_ADDRESS` sau `BITS_TOKEN_ADDRESS`
- ⚠️ `SOL_RPC_HTTP`
- ⚠️ `BACKEND_PRIVATE_KEY` sau `ADMIN_PRIVATE_KEY`
- ⚠️ `ADMIN_PASSWORD` sau `ADMIN_PASS`

### 🔹 **OpenAI** (Dacă folosești AI features)
- ⚠️ `OPENAI_API_KEY`
- ⚠️ `OPENAI_MODEL` (opțional, default: `gpt-4o-mini`)

### 🔹 **AWS** (Dacă folosești AWS SES pentru email)
- ⚠️ `AWS_ACCESS_KEY_ID`
- ⚠️ `AWS_SECRET_ACCESS_KEY`
- ⚠️ `AWS_REGION`

---

## 🚀 **CHECKLIST PENTRU RENDER**

### **PASUL 1: Verifică variabilele existente**
- [ ] `DATABASE_URL` - ✅ Setat
- [ ] `TELEGRAM_*` - ✅ Setate
- [ ] `STRIPE_*` - ✅ Setate
- [ ] `SOLANA_RECEIVE_WALLET` - ✅ Setat

### **PASUL 2: Adaugă variabilele NOI pentru login**

#### **A. Session & CORS**
- [ ] `SESSION_SECRET` - **OBLIGATORIU** - Generează un secret puternic
  ```bash
  # Generează un secret:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] `CORS_ALLOWED_ORIGINS` - **OBLIGATORIU**
  ```
  https://bits-ai.io,https://www.bits-ai.io
  ```
- [ ] `FRONTEND_URL` - **OBLIGATORIU**
  ```
  https://bits-ai.io
  ```
- [ ] `NODE_ENV` - **OBLIGATORIU**
  ```
  production
  ```

#### **B. Email Service (Alege UNA dintre opțiuni)**

**OPȚIUNE A: Resend (Recomandat)**
- [ ] `RESEND_API_KEY` - Obține de la https://resend.com/api-keys
- [ ] `EMAIL_FROM` - Adresa verificată în Resend (ex: `noreply@bits-ai.io`)

**OPȚIUNE B: SMTP (Gmail, SendGrid, etc.)**
- [ ] `SMTP_HOST` - ex: `smtp.gmail.com` sau `smtp.sendgrid.net`
- [ ] `SMTP_USER` - Username SMTP
- [ ] `SMTP_PASS` - Password SMTP (pentru Gmail, folosește App Password)
- [ ] `SMTP_PORT` - `587` (TLS) sau `465` (SSL)
- [ ] `SMTP_SECURE` - `false` pentru port 587, `true` pentru port 465
- [ ] `EMAIL_FROM` - Adresa expeditor

---

## 🔍 **VERIFICARE FINALĂ**

După ce adaugi variabilele, verifică în Render:
1. **Environment** tab → Toate variabilele sunt setate
2. **Logs** tab → Verifică că nu sunt erori la pornire
3. **Testează** endpoint-ul `/api/auth/register` pentru a verifica că email-urile sunt trimise

---

## 📝 **NOTĂ IMPORTANTĂ**

- `SESSION_SECRET` trebuie să fie **unic și secret** - nu îl partaja niciodată
- `CORS_ALLOWED_ORIGINS` trebuie să includă **toate** domeniile frontend (cu și fără www)
- Pentru email, **Resend** este mai simplu de configurat decât SMTP
- Dacă nu configurezi email, sistemul va funcționa dar va doar loga link-urile (pentru development)

---

## 🎯 **PRIORITATE**

**CRITICAL (Sistemul nu funcționează fără):**
1. `SESSION_SECRET` ⚠️
2. `CORS_ALLOWED_ORIGINS` ⚠️
3. `FRONTEND_URL` ⚠️
4. `NODE_ENV=production` ⚠️
5. `DATABASE_URL` ✅ (deja setat)

**IMPORTANT (Email-urile nu vor fi trimise fără):**
6. `RESEND_API_KEY` + `EMAIL_FROM` SAU `SMTP_*` variabilele ⚠️

