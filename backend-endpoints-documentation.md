# Backend Endpoints Required for Solana Rewards Manager

## 🎯 Endpoint-uri necesare pentru funcționalitatea Admin Panel:

### 1. **GET /api/admin/solana-investments**
```javascript
// Returnează toate investițiile Solana din baza de date
// Headers: Authorization: Bearer {admin_token}

Response format:
[
  {
    "id": 123,
    "userWallet": "SolanaAddress...", // pentru SOL payments
    "wallet": "SolanaAddress...", // pentru USDC-Solana payments  
    "amount": 0.5,
    "bitsReceived": 75,
    "usdInvested": 75.0,
    "type": "SOL", // sau "USDC-Solana"
    "network": "Solana",
    "signature": "transaction_signature",
    "loyaltyEligible": true,
    "loyalty_processed": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### 2. **POST /api/admin/mark-solana-processed**
```javascript
// Marchează investiția ca procesată după trimiterea reward-ului
// Headers: Authorization: Bearer {admin_token}

Request body:
{
  "wallet": "SolanaAddress...",
  "txHash": "BSC_transaction_hash_for_makeInvestment",
  "bonusAmount": 7.50
}

Response:
{
  "success": true,
  "message": "Investment marked as processed",
  "updatedCount": 3 // numărul de investiții actualizate pentru acest wallet
}
```

## 🛠️ Implementare Backend (Node.js/Express example):

```javascript
// GET /api/admin/solana-investments
app.get('/api/admin/solana-investments', authenticateAdmin, async (req, res) => {
  try {
    const investments = await db.query(`
      SELECT * FROM transactions 
      WHERE network = 'Solana' 
      AND loyaltyEligible = true 
      ORDER BY created_at DESC
    `);
    
    res.json(investments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/mark-solana-processed  
app.post('/api/admin/mark-solana-processed', authenticateAdmin, async (req, res) => {
  try {
    const { wallet, txHash, bonusAmount } = req.body;
    
    const result = await db.query(`
      UPDATE transactions 
      SET loyalty_processed = true,
          loyalty_tx_hash = ?,
          loyalty_bonus_amount = ?,
          loyalty_processed_at = NOW()
      WHERE (userWallet = ? OR wallet = ?)
      AND network = 'Solana'
      AND loyaltyEligible = true
      AND loyalty_processed = false
    `, [txHash, bonusAmount, wallet, wallet]);
    
    res.json({
      success: true,
      message: "Investment marked as processed",
      updatedCount: result.affectedRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware pentru autentificare admin
function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
```

## 📊 Database Schema Updates:

Trebuie să adaugi coloanele în tabela `transactions`:

```sql
ALTER TABLE transactions ADD COLUMN loyalty_processed BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN loyalty_tx_hash VARCHAR(255);
ALTER TABLE transactions ADD COLUMN loyalty_bonus_amount DECIMAL(10,2);
ALTER TABLE transactions ADD COLUMN loyalty_processed_at TIMESTAMP NULL;
```

## 🚀 Flow complet:

1. **User face SOL/USDC payment** → se salvează cu `loyaltyEligible: true`
2. **Admin deschide Admin Panel** → tab "Solana Rewards"  
3. **SolanaRewardsManager** → fetch `/api/admin/solana-investments`
4. **Admin selectează investiții** → apasă "Process Rewards"
5. **Frontend apelează** `makeInvestment()` pe AdditionalReward.sol
6. **După confirmare** → POST `/api/admin/mark-solana-processed` 
7. **Backend marchează** `loyalty_processed = true`
8. **User poate face claim** pe rewards-hub normal

## ✅ Beneficii:

- **Control total** asupra procesării
- **Audit trail** complet cu tx hash-uri
- **Prevenirea dublării** reward-urilor  
- **Flexibilitate** în managementul bonus-urilor
- **UI intuitiv** pentru admin



