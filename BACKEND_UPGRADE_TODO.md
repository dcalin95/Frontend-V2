# 🔧 TODO List - Backend Upgrade pentru Sistem de Autentificare Persistentă

## 📋 OVERVIEW
Acest document conține toate task-urile necesare pentru upgrade-ul backend-ului pentru a suporta:
- ✅ Autentificare persistentă (auto-login cu refresh token)
- ✅ Verificare IP/locație pentru securitate
- ✅ Autentificare biometrică (WebAuthn/TouchID/FaceID)
- ✅ Sistem de membri (isMember)

---

## 🔐 CATEGORIA 1: AUTENTIFICARE PERSISTENTĂ (Auto-Login)

### ✅ Task 1.1: Upgrade Endpoint `/api/auth/login`
**Status:** ⏳ NECESITĂ UPGRADE
**Prioritate:** 🔴 CRITIC

**Ce trebuie implementat:**
- [ ] Returnare `refreshToken` în response după login reușit
- [ ] Generare refresh token securizat (JWT sau token aleatoriu)
- [ ] Salvare refresh token în baza de date asociat cu user ID
- [ ] Salvare device fingerprint în baza de date
- [ ] Salvare IP și locație în baza de date pentru prima sesiune
- [ ] Setare expirare refresh token (recomandat: 30-90 zile)
- [ ] Returnare `isMember` în response

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "deviceFingerprint": "abc123...",
  "screenResolution": "1920x1080",
  "timezone": "Europe/Bucharest",
  "language": "ro",
  "ip": "192.168.1.1",
  "country": "Romania",
  "countryCode": "RO",
  "city": "Bucharest"
}
```

**Response Success:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "username": "username",
  "isMember": true,
  "emailVerified": true,
  "refreshToken": "refresh_token_here"
}
```

---

### ✅ Task 1.2: Creare/Upgrade Endpoint `/api/auth/auto-login`
**Status:** ⏳ NECESITĂ IMPLEMENTARE
**Prioritate:** 🔴 CRITIC

**Ce trebuie implementat:**
- [ ] Validare refresh token
- [ ] Verificare dacă refresh token nu este expirat
- [ ] Verificare device fingerprint cu cel salvat
- [ ] Verificare IP și locație cu ultima sesiune cunoscută
- [ ] Comparare IP/locație curentă cu ultima cunoscută
- [ ] Dacă IP/locația s-a schimbat semnificativ:
  - [ ] Setare flag `requiresVerification: true`
  - [ ] Opțional: solicitare parolă suplimentară
  - [ ] Logging pentru securitate
- [ ] Generare nou access token
- [ ] Actualizare ultima locație cunoscută în baza de date
- [ ] Returnare user data și tokens

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here",
  "deviceFingerprint": "abc123...",
  "ip": "192.168.1.1",
  "country": "Romania",
  "countryCode": "RO",
  "city": "Bucharest",
  "locationChanged": true
}
```

**Response Success:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "username": "username",
  "isMember": true,
  "emailVerified": true,
  "requiresVerification": false
}
```

**Response cu verificare necesară:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "username": "username",
  "isMember": true,
  "emailVerified": true,
  "requiresVerification": true,
  "message": "Login from new location detected. Additional verification required."
}
```

---

### ✅ Task 1.3: Upgrade Endpoint `/api/auth/signout`
**Status:** ⏳ NECESITĂ UPGRADE
**Prioritate:** 🟡 MEDIU

**Ce trebuie implementat:**
- [ ] Invalidare refresh token (ștergere din baza de date)
- [ ] Dacă `refreshToken` este trimis în request, invalidare acel token specific
- [ ] Dacă nu este trimis, invalidare toate refresh token-urile pentru user
- [ ] Ștergere sesiune (cookies)
- [ ] Logging pentru audit

**Request Body (opțional):**
```json
{
  "refreshToken": "refresh_token_here"
}
```

---

### ✅ Task 1.4: Upgrade Endpoint `/api/auth/me`
**Status:** ⏳ NECESITĂ UPGRADE
**Prioritate:** 🟡 MEDIU

**Ce trebuie implementat:**
- [ ] Returnare `isMember` în response
- [ ] Verificare sesiune validă (cookies)
- [ ] Returnare toate datele user necesare

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "username": "username",
  "isMember": true,
  "emailVerified": true
}
```

---

## 🌍 CATEGORIA 2: VERIFICARE IP/LOCAȚIE

### ✅ Task 2.1: Creare Tabel în Baza de Date pentru Sesiuni
**Status:** ⏳ NECESITĂ IMPLEMENTARE
**Prioritate:** 🔴 CRITIC

**Structură tabel `user_sessions`:**
```sql
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  device_fingerprint VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  country VARCHAR(100),
  country_code VARCHAR(2),
  city VARCHAR(100),
  last_location_ip VARCHAR(45),
  last_location_country VARCHAR(100),
  last_location_country_code VARCHAR(2),
  last_location_city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_token ON user_sessions(refresh_token);
CREATE INDEX idx_user_id ON user_sessions(user_id);
CREATE INDEX idx_expires_at ON user_sessions(expires_at);
```

---

### ✅ Task 2.2: Implementare Logică de Comparare IP/Locație
**Status:** ⏳ NECESITĂ IMPLEMENTARE
**Prioritate:** 🔴 CRITIC

**Funcție helper pentru comparare:**
```javascript
function hasLocationChanged(currentLocation, lastLocation) {
  if (!lastLocation) return false;
  
  // Schimbare țară = schimbare semnificativă
  if (currentLocation.countryCode !== lastLocation.countryCode) {
    return true;
  }
  
  // Schimbare IP = schimbare semnificativă
  if (currentLocation.ip !== lastLocation.ip) {
    return true;
  }
  
  return false;
}
```

**Ce trebuie implementat:**
- [ ] Funcție pentru comparare locație
- [ ] Logging pentru schimbări de locație
- [ ] Opțional: Whitelist IP-uri/locații de încredere
- [ ] Opțional: Rate limiting pentru auto-login attempts

---

### ✅ Task 2.3: Implementare Audit Log pentru Securitate
**Status:** ⏳ NECESITĂ IMPLEMENTARE
**Prioritate:** 🟡 MEDIU

**Structură tabel `security_audit_log`:**
```sql
CREATE TABLE security_audit_log (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  event_type VARCHAR(50) NOT NULL, -- 'login', 'auto_login', 'location_change', 'failed_attempt'
  ip_address VARCHAR(45),
  country VARCHAR(100),
  country_code VARCHAR(2),
  city VARCHAR(100),
  device_fingerprint VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_id_audit ON security_audit_log(user_id);
CREATE INDEX idx_event_type ON security_audit_log(event_type);
CREATE INDEX idx_created_at ON security_audit_log(created_at);
```

**Ce trebuie logat:**
- [ ] Toate încercările de auto-login
- [ ] Schimbări de locație/IP
- [ ] Failed auto-login attempts
- [ ] Refresh token invalidat

---

## 🔐 CATEGORIA 3: AUTENTIFICARE BIOMETRICĂ (WebAuthn)

### ✅ Task 3.1: Creare Endpoint `/api/auth/biometric/register-challenge`
**Status:** ⏳ NECESITĂ IMPLEMENTARE
**Prioritate:** 🟡 MEDIU

**Ce trebuie implementat:**
- [ ] Verificare user autentificat (session/cookies)
- [ ] Generare challenge aleatoriu (32 bytes)
- [ ] Salvare challenge temporar în cache/Redis (expirare 5 minute)
- [ ] Returnare challenge și userId pentru WebAuthn

**Request Body:**
```json
{
  "userId": "user_id",
  "username": "user@example.com"
}
```

**Response:**
```json
{
  "challenge": "base64_encoded_challenge",
  "userId": "user_id"
}
```

---

### ✅ Task 3.2: Creare Endpoint `/api/auth/biometric/register`
**Status:** ⏳ NECESITĂ IMPLEMENTARE
**Prioritate:** 🟡 MEDIU

**Ce trebuie implementat:**
- [ ] Verificare user autentificat
- [ ] Validare challenge (verificare că există în cache)
- [ ] Verificare attestation object (WebAuthn library)
- [ ] Salvare credential public key în baza de date
- [ ] Asociere credential cu user ID
- [ ] Ștergere challenge din cache după utilizare

**Structură tabel `biometric_credentials`:**
```sql
CREATE TABLE biometric_credentials (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  credential_id VARCHAR(500) NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_credential_id ON biometric_credentials(credential_id);
CREATE INDEX idx_user_id_biometric ON biometric_credentials(user_id);
```

**Request Body:**
```json
{
  "credential": {
    "id": "credential_id",
    "rawId": [1, 2, 3, ...],
    "response": {
      "attestationObject": [1, 2, 3, ...],
      "clientDataJSON": [1, 2, 3, ...]
    },
    "type": "public-key"
  },
  "userId": "user_id"
}
```

**Response:**
```json
{
  "success": true,
  "credentialId": "credential_id",
  "message": "Biometric credential registered successfully"
}
```

---

### ✅ Task 3.3: Creare Endpoint `/api/auth/biometric/auth-challenge`
**Status:** ⏳ NECESITĂ IMPLEMENTARE
**Prioritate:** 🟡 MEDIU

**Ce trebuie implementat:**
- [ ] Verificare dacă credentialId există în baza de date
- [ ] Generare challenge aleatoriu
- [ ] Salvare challenge temporar în cache
- [ ] Returnare challenge și allowCredentials pentru WebAuthn

**Request Body:**
```json
{
  "credentialId": "credential_id",
  "userId": "user_id"
}
```

**Response:**
```json
{
  "challenge": "base64_encoded_challenge",
  "allowCredentials": [
    {
      "id": [1, 2, 3, ...],
      "type": "public-key",
      "transports": ["internal"]
    }
  ]
}
```

---

### ✅ Task 3.4: Creare Endpoint `/api/auth/biometric/verify`
**Status:** ⏳ NECESITĂ IMPLEMENTARE
**Prioritate:** 🔴 CRITIC

**Ce trebuie implementat:**
- [ ] Validare challenge (verificare că există în cache)
- [ ] Verificare assertion (WebAuthn library)
- [ ] Verificare signature cu public key salvat
- [ ] Verificare counter (anti-replay attack)
- [ ] Actualizare counter în baza de date
- [ ] Generare access token și refresh token
- [ ] Creare sesiune (cookies)
- [ ] Salvare IP și locație pentru sesiune
- [ ] Returnare user data și tokens
- [ ] Ștergere challenge din cache

**Request Body:**
```json
{
  "credentialId": "credential_id",
  "response": {
    "authenticatorData": [1, 2, 3, ...],
    "clientDataJSON": [1, 2, 3, ...],
    "signature": [1, 2, 3, ...],
    "userHandle": [1, 2, 3, ...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "isMember": true,
    "emailVerified": true
  },
  "refreshToken": "refresh_token_here"
}
```

---

### ✅ Task 3.5: Instalare și Configurare WebAuthn Library
**Status:** ⏳ NECESITĂ IMPLEMENTARE
**Prioritate:** 🔴 CRITIC

**Pentru Node.js:**
- [ ] Instalare `@simplewebauthn/server` sau `fido2-lib`
- [ ] Configurare RP ID (relying party ID) = domeniul tău
- [ ] Configurare origin (ex: `https://bits-ai.io`)
- [ ] Configurare challenge storage (Redis sau in-memory cache)

**Exemplu configurare:**
```javascript
const { generateRegistrationOptions, verifyRegistrationResponse } = require('@simplewebauthn/server');

const rpID = 'bits-ai.io';
const origin = `https://${rpID}`;
```

---

## 👥 CATEGORIA 4: SISTEM DE MEMBRI

### ✅ Task 4.1: Upgrade Tabel `users` pentru Membri
**Status:** ⏳ NECESITĂ UPGRADE
**Prioritate:** 🟡 MEDIU

**Adăugare coloană:**
```sql
ALTER TABLE users ADD COLUMN is_member BOOLEAN DEFAULT false;
CREATE INDEX idx_is_member ON users(is_member);
```

---

### ✅ Task 4.2: Endpoint pentru Upgrade la Membru
**Status:** ⏳ NECESITĂ IMPLEMENTARE (opțional)
**Prioritate:** 🟢 LOW

**Ce trebuie implementat:**
- [ ] Endpoint pentru upgrade la membru
- [ ] Verificare condiții (plata, staking, etc.)
- [ ] Actualizare `isMember = true`
- [ ] Logging

---

## 🔧 CATEGORIA 5: INFRASTRUCTURĂ ȘI SECURITATE

### ✅ Task 5.0: Verificare Variabile de Mediu
**Status:** ⏳ NECESITĂ VERIFICARE
**Prioritate:** 🔴 CRITIC

**Variabile necesare (verifică în `BACKEND_ENV_VARIABLES.md`):**
- [ ] `SESSION_SECRET` - pentru sesiuni (cookies)
- [ ] `CORS_ALLOWED_ORIGINS` - origin-uri permise
- [ ] `FRONTEND_URL` - URL frontend
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` - connection string PostgreSQL
- [ ] `REDIS_URL` - (opțional) pentru cache challenges
- [ ] `JWT_SECRET` - pentru generare tokens (dacă folosești JWT)
- [ ] `JWT_REFRESH_SECRET` - pentru refresh tokens (dacă folosești JWT)

---

## 🔧 CATEGORIA 5: INFRASTRUCTURĂ ȘI SECURITATE

### ✅ Task 5.1: Configurare Redis/Cache pentru Challenges
**Status:** ⏳ NECESITĂ IMPLEMENTARE
**Prioritate:** 🟡 MEDIU

**Ce trebuie implementat:**
- [ ] Configurare Redis pentru stocare challenges
- [ ] TTL pentru challenges (5 minute)
- [ ] Fallback la in-memory cache dacă Redis nu este disponibil

---

### ✅ Task 5.2: Rate Limiting pentru Auto-Login
**Status:** ⏳ NECESITĂ IMPLEMENTARE
**Prioritate:** 🟡 MEDIU

**Ce trebuie implementat:**
- [ ] Rate limiting pentru `/api/auth/auto-login` (max 5 attempts/minut per IP)
- [ ] Rate limiting pentru `/api/auth/biometric/*` (max 10 attempts/minut per user)
- [ ] Blocking temporar pentru failed attempts

---

### ✅ Task 5.3: Cleanup Job pentru Refresh Tokens Expirate
**Status:** ⏳ NECESITĂ IMPLEMENTARE
**Prioritate:** 🟢 LOW

**Ce trebuie implementat:**
- [ ] Cron job pentru ștergere refresh tokens expirate
- [ ] Ștergere sesiuni inactive (peste 90 zile)
- [ ] Cleanup audit logs vechi (peste 1 an)

---

## 📝 CATEGORIA 6: TESTARE ȘI DOCUMENTAȚIE

### ✅ Task 6.1: Testare Endpoint-uri
**Status:** ⏳ NECESITĂ IMPLEMENTARE
**Prioritate:** 🟡 MEDIU

**Ce trebuie testat:**
- [ ] Testare `/api/auth/login` cu device info
- [ ] Testare `/api/auth/auto-login` cu refresh token valid
- [ ] Testare `/api/auth/auto-login` cu refresh token expirat
- [ ] Testare `/api/auth/auto-login` cu IP/locație schimbată
- [ ] Testare flow complet biometric (register → authenticate)
- [ ] Testare edge cases (token invalid, device changed, etc.)

---

### ✅ Task 6.2: Documentație API
**Status:** ⏳ NECESITĂ IMPLEMENTARE
**Prioritate:** 🟢 LOW

**Ce trebuie documentat:**
- [ ] Documentație Swagger/OpenAPI pentru toate endpoint-urile
- [ ] Exemple de request/response
- [ ] Coduri de eroare
- [ ] Rate limits

---

## 🎯 PRIORITIZARE

### 🔴 CRITIC (Implementare Imediată)
1. Task 1.1: Upgrade `/api/auth/login` cu refresh token
2. Task 1.2: Creare `/api/auth/auto-login` cu verificare IP/locație
3. Task 2.1: Creare tabel `user_sessions`
4. Task 2.2: Logică comparare IP/locație
5. Task 3.4: Endpoint `/api/auth/biometric/verify`
6. Task 3.5: Instalare WebAuthn library

### 🟡 MEDIU (Implementare în 1-2 săptămâni)
7. Task 1.3: Upgrade `/api/auth/signout`
8. Task 1.4: Upgrade `/api/auth/me`
9. Task 2.3: Audit log pentru securitate
10. Task 3.1-3.3: Endpoint-uri biometric (register-challenge, register, auth-challenge)
11. Task 5.1: Configurare Redis/Cache
12. Task 5.2: Rate limiting

### 🟢 LOW (Implementare Opțională)
13. Task 4.1-4.2: Sistem membri (dacă nu există deja)
14. Task 5.3: Cleanup job
15. Task 6.1-6.2: Testare și documentație

---

## 📊 ESTIMARE TIMP

- **CRITIC:** ~2-3 zile
- **MEDIU:** ~1 săptămână
- **LOW:** ~2-3 zile

**TOTAL:** ~2-3 săptămâni pentru implementare completă

---

## ✅ CHECKLIST FINAL

După implementare, verifică:
- [ ] Toate endpoint-urile returnează răspunsuri corecte
- [ ] Refresh tokens sunt generate și validate corect
- [ ] IP/locația este verificată și comparată
- [ ] Autentificarea biometrică funcționează end-to-end
- [ ] Rate limiting este activ
- [ ] Audit logs sunt populate
- [ ] Cleanup jobs rulează periodic
- [ ] Documentația este actualizată

---

**Notă:** Acest TODO list este bazat pe implementarea frontend existentă. Toate endpoint-urile și structurile de date trebuie să se alinieze cu ce trimite frontend-ul.

