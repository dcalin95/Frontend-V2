# 🧪 Cum să testezi GitHub Actions Workflow

## ✅ Ce am testat eu (local)

- ✅ Sintaxa YAML este corectă
- ✅ Build-ul React funcționează
- ✅ Fișierul workflow este valid

## 🚀 Testare Efectivă (pe GitHub)

### Opțiunea 1: Test cu Push pe Main (Recomandat)

1. **Commit workflow-ul:**
   ```bash
   git add .github/workflows/deploy.yml
   git add .github/
   git commit -m "feat: add GitHub Actions auto deploy workflow"
   git push origin main
   ```

2. **Merge pe GitHub:**
   - Click pe repository-ul tău pe GitHub
   - Click pe tab-ul **Actions** (lângă Code, Issues, etc.)
   - Vei vedea workflow-ul **"Deploy to S3 and CloudFront"** rulând

3. **Verifică progresul:**
   - Click pe workflow-ul rulând
   - Vei vedea fiecare step în timp real
   - ✅ Verde = succes
   - ❌ Roșu = eroare (click pentru detalii)

### Opțiunea 2: Test Manual (Workflow Dispatch)

1. **După ce ai făcut push pe main:**
   - Mergi pe GitHub → **Actions** tab
   - Selectează workflow-ul **"Deploy to S3 and CloudFront"**
   - Click pe **Run workflow** (butonul din dreapta sus)
   - Selectează branch-ul `main`
   - Click **Run workflow**

2. **Workflow-ul se va rula manual** fără să faci push

## ⚠️ IMPORTANT: Setup AWS Secrets înainte de testare!

Workflow-ul va **eșua** dacă nu ai configurat AWS Secrets:

1. **GitHub Repository → Settings**
2. **Secrets and variables → Actions**
3. **New repository secret:**
   - `AWS_ACCESS_KEY_ID` = [access key-ul tău]
   - `AWS_SECRET_ACCESS_KEY` = [secret key-ul tău]

## 🔍 Ce să verifici în GitHub Actions

După ce rulezi workflow-ul:

1. **Checkout code** ✅ (trebuie să reușească)
2. **Setup Node.js** ✅
3. **Install dependencies** ✅
4. **Run build** ✅ (dacă eșuează aici, workflow-ul se oprește)
5. **Configure AWS credentials** ✅ (necesită secrets)
6. **Deploy to S3** ✅ (necesită AWS permissions)
7. **Invalidate CloudFront** ✅

## 🐛 Dacă workflow-ul eșuează

### Eroare: "AWS credentials not found"
- Verifică că ai setat `AWS_ACCESS_KEY_ID` și `AWS_SECRET_ACCESS_KEY` în GitHub Secrets

### Eroare: "Build failed"
- Verifică log-urile din step-ul "Run build"
- Poate fi o problemă cu dependențele sau codul

### Eroare: "Access Denied" la S3
- Verifică că AWS user-ul are permisiuni pentru bucket-ul `bits-ai.io`

## 📝 Testare Rapidă (Fără Deploy Real)

Poți testa doar build-ul fără să deploy-ui:

1. Comentează temporary step-urile de deploy în `.github/workflows/deploy.yml`
2. Sau creează un branch de test și modifică workflow-ul să nu deploy-ui pe S3

## ✅ Checklist înainte de testare

- [ ] Workflow file este commit-uit pe `main`
- [ ] AWS Secrets sunt configurate în GitHub
- [ ] AWS user-ul are permisiuni pentru S3 și CloudFront
- [ ] Build-ul funcționează local (testat cu `npm run build`)
