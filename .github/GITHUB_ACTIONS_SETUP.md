# 🚀 GitHub Actions - Deploy Automat Setup

## ✅ Ce face workflow-ul

Când faci **push pe branch-ul `main`**, workflow-ul:
1. ✅ Instalează dependențele
2. ✅ Rulează build-ul React
3. ✅ Verifică că build-ul reușește (dacă nu, se oprește aici)
4. ✅ Upload pe S3 bucket `bits-ai.io`
5. ✅ Invalidează cache-ul CloudFront automat

## 🔐 Configurare GitHub Secrets (OBLIGATORIU)

Pentru ca workflow-ul să funcționeze, trebuie să configurezi AWS credentials ca **GitHub Secrets**:

### Pasul 1: Deschide GitHub Repository Settings

1. Mergi pe repository-ul tău pe GitHub
2. Click pe **Settings** (tab-ul din partea de sus)
3. În meniul din stânga, click pe **Secrets and variables** → **Actions**

### Pasul 2: Adaugă AWS Credentials

Click pe **New repository secret** și adaugă următoarele secrets:

#### Secret 1: `AWS_ACCESS_KEY_ID`
- **Name:** `AWS_ACCESS_KEY_ID`
- **Value:** Access Key ID-ul tău AWS (din AWS IAM)

#### Secret 2: `AWS_SECRET_ACCESS_KEY`
- **Name:** `AWS_SECRET_ACCESS_KEY`
- **Value:** Secret Access Key-ul tău AWS (din AWS IAM)

#### Secret 3 (Opțional): `REACT_APP_TIKTOK_PIXEL_ID`
- **Name:** `REACT_APP_TIKTOK_PIXEL_ID`
- **Value:** ID-ul TikTok Pixel (dacă nu e deja setat în cod)

### Pasul 3: Verifică AWS IAM Permissions

Asigură-te că AWS user-ul are următoarele permisiuni:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::bits-ai.io",
        "arn:aws:s3:::bits-ai.io/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::*:distribution/E2TIH6RJTHIT1M"
    }
  ]
}
```

## 🧪 Testare

După ce ai configurat secrets-urile:

1. Fă o modificare mică în cod
2. Commit și push pe `main`:
   ```bash
   git add .
   git commit -m "test: GitHub Actions deploy"
   git push origin main
   ```

3. Mergi pe GitHub → **Actions** tab
4. Vei vedea workflow-ul rulând în timp real
5. Dacă totul e OK, vei vedea ✅ verde când se termină

## 🔄 Deploy Manual (din GitHub UI)

Poți declanșa deploy manual oricând:

1. Mergi pe **Actions** tab pe GitHub
2. Selectează workflow-ul **Deploy to S3 and CloudFront**
3. Click pe **Run workflow** (butonul din dreapta)
4. Selectează branch-ul (de obicei `main`)
5. Click **Run workflow**

## ⚠️ Important

- **NU** commit-ui AWS credentials în cod!
- **DOAR** folosește GitHub Secrets pentru credentials
- Build-ul se face înainte de deploy - dacă eșuează, nu se deploy-uiește
- Workflow-ul rulează **doar** pentru branch-ul `main` (pentru siguranță)

## 🐛 Troubleshooting

### Eroare: "AWS credentials not found"
- Verifică că ai adăugat `AWS_ACCESS_KEY_ID` și `AWS_SECRET_ACCESS_KEY` în GitHub Secrets

### Eroare: "Access Denied" la S3
- Verifică că AWS user-ul are permisiuni pentru S3 bucket `bits-ai.io`

### Eroare: "Access Denied" la CloudFront
- Verifică că AWS user-ul are permisiunea `cloudfront:CreateInvalidation`

### Build-ul eșuează
- Verifică log-urile din GitHub Actions pentru detalii
- Build-ul trebuie să reușească înainte ca deploy-ul să continue

## 📝 Notițe

- Workflow-ul rulează pe `ubuntu-latest` (Linux)
- Node.js versiunea folosită: `18`
- Cache-ul npm este activat pentru build-uri mai rapide
- CloudFront invalidation durează ~2-5 minute după deploy
