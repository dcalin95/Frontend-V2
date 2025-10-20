# 🚀 CellManager.sol - Ghid Complet de Configurare Post-Deployment

## 📋 **Setări Obligatorii După Deployment**

După ce ai deploiat contractul `CellManager.sol`, trebuie să configurezi următoarele setări pentru ca sistemul să funcționeze corect:

### 1. 🪙 **Configurarea Token-ului BITS**

```solidity
function setBitsToken(address newToken) external onlyOwner
```

**Exemplu:**
```javascript
// Adresa token-ului BITS pe BSC Testnet
const BITS_TOKEN_ADDRESS = "0x19e32912f9074F20F904dFe6007cA8e632F23348";
await cellManager.setBitsToken(BITS_TOKEN_ADDRESS);
```

### 2. 📊 **Configurarea Oracle-urilor de Preț**

#### A. Oracle BNB/USD (Obligatoriu pentru plăți în BNB)

```solidity
function setBNBUsdFeed(address feed) external onlyOwner
```

**Adrese Oracle Chainlink pe BSC:**
- **Mainnet:** `0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE`
- **Testnet:** `0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526`

```javascript
// BSC Testnet
await cellManager.setBNBUsdFeed("0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526");
```

#### B. Oracle-uri pentru Token-uri ERC20 (Opțional)

```solidity
function setTokenUsdFeed(address token, address feed) external onlyOwner
```

**Exemple pentru BSC Testnet:**
```javascript
// USDT/USD
await cellManager.setTokenUsdFeed(
    "0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684", // USDT Testnet
    "0xEca2605f0BCF2BA5966372C99837b1F182d3D620"  // USDT/USD Oracle
);

// USDC/USD  
await cellManager.setTokenUsdFeed(
    "0x64544969ed7EBf5f083679233325356EbE738930", // USDC Testnet
    "0x90c069C4538adAc136E051052E14c1cD799C41B7"  // USDC/USD Oracle
);
```

### 3. 💰 **Configurarea Prețurilor Fallback**

În caz că oracle-urile nu funcționează, setează prețuri fallback:

```solidity
function setFallbackBNBPrice(uint256 price1e18) external onlyOwner
function setFallbackTokenPrice(address token, uint256 price1e18) external onlyOwner
```

**Exemple:**
```javascript
// BNB = $300 (300 * 1e18)
await cellManager.setFallbackBNBPrice(ethers.utils.parseEther("300"));

// USDT = $1 (1 * 1e18)
await cellManager.setFallbackTokenPrice(
    "0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684", // USDT
    ethers.utils.parseEther("1")
);
```

### 4. ⏰ **Configurarea Threshold-ului pentru Oracle-uri**

```solidity
function setFeedStalenessThreshold(uint256 seconds_) external onlyOwner
```

**Exemplu:**
```javascript
// 5 minute threshold (300 secunde)
await cellManager.setFeedStalenessThreshold(300);
```

### 5. 🎯 **Adăugarea Primei Celule**

```solidity
function addCell(uint256 standardPrice, uint256 privilegedPrice, uint256 supply) external onlyOwner
```

**Parametri:**
- `standardPrice`: Preț în **milicents** (USD * 1000)
- `privilegedPrice`: Preț privilegiat în **milicents** 
- `supply`: Supply de BITS în **unități logice** (nu wei)

**Exemple de prețuri:**
- `$0.001/BITS` = `1` milicent
- `$0.010/BITS` = `10` milicents  
- `$0.055/BITS` = `55` milicents
- `$0.100/BITS` = `100` milicents

```javascript
// Exemplu: $0.055/BITS standard, $0.049/BITS privilegiat, 1M BITS supply
await cellManager.addCell(
    55,        // $0.055 standard
    49,        // $0.049 privilegiat (10% discount)
    1000000    // 1,000,000 BITS
);
```

### 6. 🔐 **Configurarea Wallet-urilor Privilegiate (Opțional)**

```solidity
function setWalletPrivilegedAccess(address wallet, bool hasAccess) external onlyOwner
```

```javascript
// Acordă acces privilegiat unui wallet
await cellManager.setWalletPrivilegedAccess("0x742d35Cc6634C0532925a3b8D8C9C0532925a3b8", true);
```

### 7. 📦 **Configurarea Modului de Distribuție**

```solidity
enum DistributionMode { Automatic, Manual, Locked }
function setDistributionMode(DistributionMode mode) external onlyOwner
```

**Moduri disponibile:**
- `Automatic (0)`: BITS se trimit automat la cumpărare
- `Manual (1)`: BITS se acumulează, utilizatorii fac claim manual
- `Locked (2)`: BITS nu se distribuie deloc

```javascript
// Setează distribuție automată
await cellManager.setDistributionMode(0);
```

### 8. 💎 **Alimentarea Contractului cu BITS (Pentru Distribuție)**

Dacă folosești modul `Automatic` sau `Manual`, contractul trebuie să aibă BITS pentru distribuție:

```javascript
// Transfer BITS către CellManager
const bitsToken = new ethers.Contract(BITS_TOKEN_ADDRESS, BITS_ABI, signer);
await bitsToken.transfer(cellManagerAddress, ethers.utils.parseUnits("10000000", 18)); // 10M BITS
```

---

## 🔧 **Script Complet de Configurare**

```javascript
async function configureCellManager(cellManagerAddress, signer) {
    const cellManager = new ethers.Contract(cellManagerAddress, CELL_MANAGER_ABI, signer);
    
    console.log("🚀 Starting CellManager configuration...");
    
    // 1. Set BITS Token
    await cellManager.setBitsToken("0x19e32912f9074F20F904dFe6007cA8e632F23348");
    console.log("✅ BITS token set");
    
    // 2. Set BNB/USD Oracle
    await cellManager.setBNBUsdFeed("0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526");
    console.log("✅ BNB/USD oracle set");
    
    // 3. Set fallback prices
    await cellManager.setFallbackBNBPrice(ethers.utils.parseEther("300"));
    console.log("✅ Fallback BNB price set");
    
    // 4. Set staleness threshold
    await cellManager.setFeedStalenessThreshold(300); // 5 minutes
    console.log("✅ Staleness threshold set");
    
    // 5. Set distribution mode
    await cellManager.setDistributionMode(0); // Automatic
    console.log("✅ Distribution mode set to Automatic");
    
    // 6. Add first cell
    await cellManager.addCell(55, 49, 1000000); // $0.055, $0.049, 1M BITS
    console.log("✅ First cell added");
    
    console.log("🎉 CellManager configuration completed!");
}
```

---

## ⚠️ **Verificări Post-Configurare**

După configurare, verifică că totul funcționează:

```javascript
// Verifică configurația
const currentCellId = await cellManager.getCurrentOpenCellId();
const cell = await cellManager.getCell(currentCellId);
const bitsToken = await cellManager.bitsToken();
const bnbFeed = await cellManager.bnbUsdFeed();

console.log("Current Cell ID:", currentCellId.toString());
console.log("Cell Supply:", cell.supply.toString());
console.log("BITS Token:", bitsToken);
console.log("BNB Feed:", bnbFeed);
```

---

## 🚨 **Probleme Comune și Soluții**

### **Problema: "Cannot read price from CellManager"**
**Soluție:** Verifică că ai setat oracle-ul BNB/USD și prețurile fallback.

### **Problema: "Cell not configured"**
**Soluție:** Adaugă o celulă cu `addCell()`.

### **Problema: "Contract BITS low"**
**Soluție:** Transferă BITS către contract pentru distribuție.

### **Problema: Oracle-ul returnează preț 0**
**Soluție:** Verifică că adresa oracle-ului este corectă și setează preț fallback.

---

## 📝 **Checklist Final**

- [ ] ✅ BITS token setat
- [ ] ✅ Oracle BNB/USD setat  
- [ ] ✅ Prețuri fallback setate
- [ ] ✅ Threshold staleness setat
- [ ] ✅ Mod distribuție setat
- [ ] ✅ Prima celulă adăugată
- [ ] ✅ Contract alimentat cu BITS (dacă distribuție automată)
- [ ] ✅ Wallet-uri privilegiate setate (dacă necesar)
- [ ] ✅ Verificări post-configurare efectuate

**🎯 După acești pași, CellManager-ul tău va fi complet funcțional!**





