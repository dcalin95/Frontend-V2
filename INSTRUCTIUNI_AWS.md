# 🔑 CREAREA CORECTĂ A AWS ACCESS KEY

## PASUL 1: Șterge cheia existentă (dacă nu ai salvat Secret Key)

1. Bifează checkbox-ul lângă `AKIASCBGTJMJ2UNA517U`
2. Click pe `Actions` → `Delete`
3. Confirmă ștergerea

---

## PASUL 2: Creează cheie nouă

1. Click pe butonul **"Create access key"** (în partea de sus, dreapta)
2. **Alege use case:** "Command Line Interface (CLI)"
3. Bifează: ☑ "I understand the above recommendation..."
4. Click **"Next"**
5. (Opțional) Pune un tag/descriere: "BitSwap CLI Deploy"
6. Click **"Create access key"**

---

## PASUL 3: SALVEAZĂ CREDENȚIALELE! ⚠️

### Vei vedea un ecran cu:

```
✅ Access key created successfully

Access key: AKIA.....................
Secret access key: wJalr.............................

⚠️ This is the only time you can view or download the secret access key.
```

### **COPIAZĂ AMBELE:**

1. **Access Key ID** → Salvează într-un notepad
2. **Secret Access Key** → Salvează într-un notepad

**SAU** click pe **"Download .csv file"** → salvează fișierul în siguranță!

---

## PASUL 4: Configurează AWS CLI

```bash
aws configure

AWS Access Key ID [None]: PASTE_ACCESS_KEY_HERE
AWS Secret Access Key [None]: PASTE_SECRET_KEY_HERE
Default region name [None]: us-east-1
Default output format [None]: json
```

---

## ✅ TESTEAZĂ:

```bash
aws sts get-caller-identity
```

Ar trebui să vezi:
```json
{
    "UserId": "AIDA...",
    "Account": "897729121043",
    "Arn": "arn:aws:iam::897729121043:user/..."
}
```

---

🚀 **GATA! ACUM POȚI RULA:** `deploy-s3.bat`

