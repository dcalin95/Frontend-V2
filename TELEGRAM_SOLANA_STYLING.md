# 🎨 Telegram Notification Styling pentru Solana

## 📋 Cerințe

Când primești o notificare de tip `presale_buy` cu `network: 'Solana'`, mesajul trebuie să fie stilizat frumos și să afișeze:

1. **Logo Solana** (emoji sau text stilizat: ◎ SOL sau 🟣 Solana)
2. **Wallet Solana** (de pe care s-a făcut plata)
3. **Wallet EVM** (destinație pentru BITS)
4. **Diferențiere clară** între cele două wallet-uri

---

## 📦 Payload trimis de frontend

```json
{
  "event": "presale_buy",
  "status": "success",
  "network": "Solana",
  "wallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",  // Solana wallet (payment source)
  "solanaWallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",  // Same as wallet for Solana
  "evmWallet": "0x4CCA7bf2...6E21f408",  // EVM wallet (BITS destination)
  "amount": "10010.00 BITS ($10)",
  "currency": "BITS",
  "txHash": "vH4Nh4UeEe4U3tnibJMd33y8DmFhiqptiVUdtY9xe1crWWdg4CJD5qB6dGJQgGzGcUo5RTboXx3vZfSKmsGXXNu",
  "explorer": "https://solscan.io/tx/vH4Nh4UeEe4U3tnibJMd33y8DmFhiqptiVUdtY9xe1crWWdg4CJD5qB6dGJQgGzGcUo5RTboXx3vZfSKmsGXXNu",
  "details": "Purchased 10010.00 BITS for $10",
  "timestamp": 1704057453000
}
```

---

## ✨ Format mesaj Telegram recomandat

```
💎 New $BITS Investment Completed

🚀 Transaction Details
   10,010 $BITS purchased
   Investment: $10 USD
   Network: ◎ Solana

📤 Payment Source (Solana)
   7xKXtg2CW8...JosgAsU

📥 BITS Delivery Wallet (BSC)
   0x4CCA7bf2...6E21f408

🔍 Verification
   https://solscan.io/tx/vH4Nh4UeEe...
   12/31/2025, 20:17:33 UTC

✅ Confirmed on blockchain
```

---

## 🔧 Implementare Backend

### Identificare tranzacție Solana

```javascript
if (req.body.network === 'Solana' && req.body.solanaWallet && req.body.evmWallet) {
  // Solana payment - show both wallets
  const solanaWallet = req.body.solanaWallet;
  const evmWallet = req.body.evmWallet;
  
  const message = `
💎 New $BITS Investment Completed

🚀 Transaction Details
   ${formatBits(req.body.bits)} $BITS purchased
   Investment: $${req.body.usd} USD
   Network: ◎ Solana

📤 Payment Source (Solana)
   ${shortAddress(solanaWallet)}

📥 BITS Delivery Wallet (BSC)
   ${shortAddress(evmWallet)}

🔍 Verification
   ${req.body.explorer}
   ${formatDate(req.body.timestamp)}

✅ Confirmed on blockchain
  `;
  
  await sendToTelegram(message);
}
```

### Helper functions

```javascript
function shortAddress(addr) {
  if (!addr) return '—';
  return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
}

function formatBits(bits) {
  return parseFloat(bits).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatDate(timestamp) {
  return new Date(timestamp).toUTCString();
}
```

---

## 🎯 Note importante

1. **`wallet`** = wallet-ul principal (pentru Solana = adresa Solana)
2. **`solanaWallet`** = adresa Solana (sursă plată)
3. **`evmWallet`** = adresa EVM/BSC (destinație BITS)
4. Pentru plăți BNB/EVM, `solanaWallet` va fi `null` sau absent
5. Logo Solana: folosește `◎` (U+25CE) sau emoji 🟣

---

## 📝 Checklist

- [ ] Backend detectează `network === 'Solana'`
- [ ] Backend extrage `solanaWallet` și `evmWallet`
- [ ] Mesaj Telegram afișează ambele wallet-uri
- [ ] Mesaj Telegram are logo Solana (◎ sau 🟣)
- [ ] Mesaj specifică clar: "Payment Source" și "BITS Delivery Wallet"
- [ ] Link explorer folosește `solscan.io` pentru Solana
- [ ] Formatting frumos cu emojis și alignment

---

## 🧪 Test

Trimite un POST la `/bits/webhook` cu payload-ul de mai sus și verifică dacă mesajul apare corect în Telegram.

