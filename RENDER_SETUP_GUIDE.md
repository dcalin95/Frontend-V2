# 🚀 Ghid Simplu: Ce să setezi în Render pentru backend-server

## 📍 **UNDE:** Render.com → backend-server → Environment tab

---

## ✅ **VARIABILE OBLIGATORII (Sistemul de login nu funcționează fără ele)**

### 1️⃣ **SESSION_SECRET** 
**Ce face:** Secret pentru cookies (securitate)
**Cum să-l obții:**
```bash
# Rulează în terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Valoare exemplu:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`
**În Render:** Click "+ New" → Key: `SESSION_SECRET` → Value: (paste secret-ul generat)

---

### 2️⃣ **CORS_ALLOWED_ORIGINS**
**Ce face:** Permite frontend-ul să facă request-uri către backend
**Valoare:**
```
https://bits-ai.io,https://www.bits-ai.io,https://edu.bits-ai.io
```
**În Render:** Click "+ New" → Key: `CORS_ALLOWED_ORIGINS` → Value: `https://bits-ai.io,https://www.bits-ai.io,https://edu.bits-ai.io`

---

### 3️⃣ **FRONTEND_URL**
**Ce face:** URL-ul folosit în link-urile din email-uri
**Valoare:**
```
https://bits-ai.io
```
**În Render:** Click "+ New" → Key: `FRONTEND_URL` → Value: `https://bits-ai.io`

---

### 4️⃣ **NODE_ENV**
**Ce face:** Spune backend-ului că e în producție (activează HTTPS pentru cookies)
**Valoare:**
```
production
```
**În Render:** Click "+ New" → Key: `NODE_ENV` → Value: `production`

---

## 📧 **VARIABILE PENTRU EMAIL (Alege UNA dintre opțiuni)**

### **OPȚIUNE A: AWS SES (Dacă ai deja email configurat în S3/AWS) - PRIORITATE**

Dacă ai deja configurat AWS SES și adresa de email în S3/AWS, folosește această opțiune:

#### 5️⃣ **AWS_ACCESS_KEY_ID**
**Ce face:** AWS Access Key ID pentru SES
**Valoare:** (deja setat în S3/AWS)

#### 6️⃣ **AWS_SECRET_ACCESS_KEY**
**Ce face:** AWS Secret Access Key pentru SES
**Valoare:** (deja setat în S3/AWS)

#### 7️⃣ **AWS_REGION**
**Ce face:** AWS Region pentru SES (ex: `us-east-1`, `eu-west-1`)
**Valoare:** (deja setat în S3/AWS)

#### 8️⃣ **EMAIL_FROM**
**Ce face:** Adresa de la care se trimit email-urile (folosește adresa setată în S3/AWS)
**Valoare:**
```
noreply@bits-ai.io
```
**IMPORTANT:** Adresa trebuie să fie verificată în AWS SES

**În Render:** Dacă variabilele AWS sunt deja setate, adaugă doar:
- Click "+ New" → Key: `EMAIL_FROM` → Value: `noreply@bits-ai.io`

---

### **OPȚIUNE B: Resend (Recomandat - cel mai simplu)**

#### 5️⃣ **RESEND_API_KEY**
**Ce face:** API key pentru trimiterea email-urilor prin Resend
**Cum să-l obții:**
1. Mergi pe https://resend.com
2. Creează cont (gratuit până la 3,000 email-uri/lună)
3. Mergi la "API Keys" → "Create API Key"
4. Copiază key-ul (începe cu `re_`)

**În Render:** Click "+ New" → Key: `RESEND_API_KEY` → Value: (paste key-ul)

#### 6️⃣ **EMAIL_FROM**
**Ce face:** Adresa de la care se trimit email-urile
**Valoare:**
```
noreply@bits-ai.io
```
**IMPORTANT:** Trebuie să verifici domeniul în Resend (Settings → Domains)

**În Render:** Click "+ New" → Key: `EMAIL_FROM` → Value: `noreply@bits-ai.io`

---

---

### **OPȚIUNE C: SMTP (Dacă ai deja un serviciu SMTP)**

Dacă ai Gmail, SendGrid, sau alt serviciu SMTP, setează:

#### 5️⃣ **SMTP_HOST**
**Exemplu Gmail:** `smtp.gmail.com`  
**Exemplu SendGrid:** `smtp.sendgrid.net`

#### 6️⃣ **SMTP_USER**
**Exemplu:** `your-email@gmail.com`

#### 7️⃣ **SMTP_PASS**
**Pentru Gmail:** Folosește "App Password" (nu parola normală!)

#### 8️⃣ **SMTP_PORT**
**Pentru TLS:** `587`  
**Pentru SSL:** `465`

#### 9️⃣ **SMTP_SECURE**
**Pentru port 587:** `false`  
**Pentru port 465:** `true`

#### 🔟 **EMAIL_FROM**
**Exemplu:** `noreply@bits-ai.io`

---

## 📋 **CHECKLIST FINAL**

### **Pasul 1: Verifică că ai deja setate:**
- ✅ `DATABASE_URL` (din imagine, pare să fie setat)
- ✅ `TELEGRAM_*` variabilele (din imagine, sunt setate)
- ✅ `STRIPE_*` variabilele (din imagine, sunt setate)
- ✅ `SOLANA_RECEIVE_WALLET` (din imagine, este setat)

### **Pasul 2: Adaugă variabilele NOI (obligatorii):**
- [ ] `SESSION_SECRET` = (generează un secret)
- [ ] `CORS_ALLOWED_ORIGINS` = `https://bits-ai.io,https://www.bits-ai.io,https://edu.bits-ai.io`
- [ ] `FRONTEND_URL` = `https://bits-ai.io`
- [ ] `NODE_ENV` = `production`

### **Pasul 3: Adaugă variabilele pentru EMAIL (alege una):**
**OPȚIUNE A (AWS SES - Dacă ai deja email în S3/AWS):**
- [ ] Verifică că `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` sunt deja setate
- [ ] `EMAIL_FROM` = `noreply@bits-ai.io`

**SAU**

**OPȚIUNE B (Resend - Recomandat):**
- [ ] `RESEND_API_KEY` = (obține de la resend.com)
- [ ] `EMAIL_FROM` = `noreply@bits-ai.io`

**SAU**

**OPȚIUNE C (SMTP):**
- [ ] `SMTP_HOST` = (ex: `smtp.gmail.com`)
- [ ] `SMTP_USER` = (ex: `your-email@gmail.com`)
- [ ] `SMTP_PASS` = (password SMTP)
- [ ] `SMTP_PORT` = `587` sau `465`
- [ ] `SMTP_SECURE` = `false` sau `true`
- [ ] `EMAIL_FROM` = `noreply@bits-ai.io`

---

## 🎯 **REZUMAT ULTRA-SIMPLU**

**În Render, adaugă aceste 4 variabile OBLIGATORII:**
1. `SESSION_SECRET` = (generează un secret)
2. `CORS_ALLOWED_ORIGINS` = `https://bits-ai.io,https://www.bits-ai.io,https://edu.bits-ai.io`
3. `FRONTEND_URL` = `https://bits-ai.io`
4. `NODE_ENV` = `production`

**PLUS variabilele pentru EMAIL (alege una):**
- AWS SES: `EMAIL_FROM` (dacă AWS variabilele sunt deja setate)
- SAU Resend: `RESEND_API_KEY` + `EMAIL_FROM`
- SAU SMTP: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT`, `SMTP_SECURE`, `EMAIL_FROM`

---

## ⚠️ **IMPORTANT**

- **FĂRĂ** `SESSION_SECRET`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `NODE_ENV` → **Sistemul de login NU va funcționa**
- **FĂRĂ** variabilele de email → **Email-urile nu vor fi trimise**, dar sistemul va funcționa (doar va loga link-urile în console)

---

## 🔍 **După ce adaugi variabilele:**

1. **Redeploy** backend-server în Render (sau așteaptă auto-deploy)
2. **Verifică Logs** → Ar trebui să vezi că serverul pornește fără erori
3. **Testează** → Încearcă să creezi un cont nou pe frontend

