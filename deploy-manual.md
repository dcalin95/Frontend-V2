# 🚀 BitSwapDEX - Deploy Manual în S3

## PASUL 1: Build Frontend

```bash
npm run build
```

**Verifică că build-ul a reușit:**
```bash
dir build
```

---

## PASUL 2: Verifică ce va fi urcat (DRY RUN)

```bash
aws s3 sync build\ s3://bits-ai.io --dryrun
```

**→ Această comandă DOAR afișează ce ar fi urcat, NU urcă nimic!**

---

## PASUL 3: Decizie - UPLOAD

### Opțiunea A: Urcă DOAR fișierele noi/modificate
```bash
aws s3 sync build\ s3://bits-ai.io
```

### Opțiunea B: Urcă + Șterge fișierele vechi din S3
```bash
aws s3 sync build\ s3://bits-ai.io --delete
```

### Opțiunea C: Urcă cu cache control (recomandat)
```bash
aws s3 sync build\ s3://bits-ai.io --delete --cache-control "max-age=31536000,public"
```

---

## PASUL 4: Verifică rezultatul

```bash
aws s3 ls s3://bits-ai.io --recursive --human-readable
```

---

## COMENZI UTILE

### Vezi ce este deja în S3:
```bash
aws s3 ls s3://bits-ai.io --recursive
```

### Șterge tot din S3 (⚠️ PERICULOS!):
```bash
aws s3 rm s3://bits-ai.io --recursive
```

### Copiază un singur fișier:
```bash
aws s3 cp build\index.html s3://bits-ai.io/index.html
```

### Descarcă tot din S3 (backup):
```bash
aws s3 sync s3://bits-ai.io backup-local\
```

---

## 🔥 INVALIDARE CLOUDFRONT (dacă ai)

Dacă folosești CloudFront, după upload invalidează cache-ul:

```bash
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## ✅ CHECKLIST DEPLOY

- [ ] Build reușit (`npm run build`)
- [ ] Dry run verificat (`--dryrun`)
- [ ] Upload executat (`aws s3 sync`)
- [ ] Verificat în S3 Console
- [ ] Testat site-ul în browser
- [ ] Invalidat CloudFront (dacă e cazul)

---

🚀 **DEPLOY COMPLET!**

