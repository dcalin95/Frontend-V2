# 🔧 Bitcoin Price Feeds Setup Guide - OraclePriceFeed

**Data:** 2025-01-09  
**Status:** ✅ **SETUP GUIDE COMPLETE** - Ready pentru Configuration

---

## 📊 Overview

Ghid complet pentru configurarea price feeds pentru Bitcoin (WBTC/BTCB) în OraclePriceFeed contract, folosind Chainlink, Band Protocol sau manual updates.

---

## ✅ Price Feed Options

### **1. Chainlink Price Feed** ✅ (RECOMMENDED)
**Status:** ✅ **SUPPORTED** - Cel mai sigur și de încredere  
**Provider:** Chainlink Data Feeds  
**Availability:** BSC Mainnet & Testnet

#### **Chainlink BTC/USD Price Feed Addresses:**

**BSC Mainnet:**
- BTC/USD: `0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf`
- Decimals: 8
- Update Interval: ~1 hour
- Confidence: 95% (recommended)

**BSC Testnet:**
- BTC/USD: `0x5741306c21795FdCBb9b265Ea0255F499DFe515C` (mock)
- Decimals: 8
- Update Interval: ~1 hour
- Confidence: 95% (recommended)

#### **Setup Chainlink Price Feed:**
```solidity
// Setup Chainlink BTC/USD price feed
oraclePriceFeed.setChainlinkBTCPriceFeed(0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf);

// Update Bitcoin price din Chainlink (automatic sau keeper)
oraclePriceFeed.updateBitcoinPriceFromChainlink();
```

**Benefits:**
- ✅ Decentralized și de încredere
- ✅ Automatic updates (fiecare oră)
- ✅ High confidence (95%)
- ✅ No manual intervention needed

---

### **2. Manual Price Updates** ✅ (FALLBACK)
**Status:** ✅ **SUPPORTED** - Pentru testing sau fallback  
**Provider:** Manual (oracle role)  
**Availability:** Anytime

#### **Setup Manual Price Feeds:**
```solidity
// Setup Bitcoin price manually (pentru ambele WBTC și BTCB)
// Price în USD, scaled by 1e18 (e.g., $43,000 = 43000 * 1e18)
uint256 btcPrice = 43000 * 1e18; // $43,000
uint256 confidence = 10000; // 100% confidence

oraclePriceFeed.updateBitcoinPrice(btcPrice, confidence);
```

**Benefits:**
- ✅ Quick setup pentru testing
- ✅ No external dependencies
- ✅ Full control

**Drawbacks:**
- ⚠️ Requires manual updates
- ⚠️ Lower confidence (depends on source)
- ⚠️ Not suitable pentru production (doar testing)

---

### **3. Band Protocol Price Feed** ⏸️ (OPTIONAL)
**Status:** ⏸️ **PLANNED** - Opțional, pentru redundancy  
**Provider:** Band Protocol  
**Availability:** BSC Mainnet

#### **Band Protocol BTC/USD Price Feed:**
- Address: TBD (check Band Protocol documentation)
- Decimals: 18
- Update Interval: Variable
- Confidence: 90% (recommended)

#### **Setup Band Protocol Price Feed:**
```solidity
// Setup Band Protocol price feed (TBD)
oraclePriceFeed.setBandPriceFeed(bandProtocolAddress);
```

**Benefits:**
- ✅ Additional redundancy
- ✅ Multi-source aggregation
- ✅ Lower cost (potentially)

**Drawbacks:**
- ⚠️ Less popular decât Chainlink
- ⚠️ Variable update intervals
- ⚠️ Requires additional setup

---

## 🔧 Setup Instructions

### **Step 1: Deploy OraclePriceFeed Contract** ✅

```bash
# Deploy OraclePriceFeed pe BSC Testnet/Mainnet
npx hardhat deploy --network bsc --tags OraclePriceFeed
```

**Constructor Parameters:**
- `_baseCurrency`: USDT/USDC address (pentru USD pairs)
- `_minConfidenceBps`: 8000 (80% minimum confidence)
- `_maxPriceAge`: 3600 (1 hour maximum age)
- `_minSources`: 1 (minimum sources pentru aggregation)

---

### **Step 2: Setup Chainlink BTC/USD Price Feed** ✅ (RECOMMENDED)

**BSC Mainnet:**
```solidity
// Get OraclePriceFeed contract instance
OraclePriceFeed oracle = OraclePriceFeed(ORACLE_PRICE_FEED_ADDRESS);

// Setup Chainlink BTC/USD price feed
address chainlinkBTCUSD = 0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf;
oracle.setChainlinkBTCPriceFeed(chainlinkBTCUSD);

// Verify setup
address configuredFeed = oracle.chainlinkBTCPriceFeed();
require(configuredFeed == chainlinkBTCUSD, "Setup failed");
```

**BSC Testnet:**
```solidity
// BSC Testnet Chainlink BTC/USD (mock)
address chainlinkBTCUSD = 0x5741306c21795FdCBb9b265Ea0255F499DFe515C;
oracle.setChainlinkBTCPriceFeed(chainlinkBTCUSD);
```

---

### **Step 3: Authorize Oracle Role** ✅

```solidity
// Authorize keeper sau backend service pentru automatic updates
address keeper = 0x...; // Your keeper address
oracle.authorizeOracle(keeper, OraclePriceFeed.OracleRole.ORACLE);

// Verify authorization
require(oracle.isAuthorizedOracle(keeper), "Authorization failed");
```

---

### **Step 4: Setup Automatic Updates** ✅ (OPTIONAL - pentru keeper)

**Backend/Keeper Service:**
```javascript
// Update Bitcoin price din Chainlink (cron job sau keeper)
async function updateBitcoinPrice() {
  const oracle = await ethers.getContractAt('OraclePriceFeed', ORACLE_ADDRESS);
  const tx = await oracle.updateBitcoinPriceFromChainlink();
  await tx.wait();
  console.log('Bitcoin price updated from Chainlink');
}

// Run every hour (sau când Chainlink updates)
setInterval(updateBitcoinPrice, 3600000); // 1 hour
```

**Alternative - Manual Update:**
```solidity
// Manual update (dacă keeper nu e disponibil)
oracle.updateBitcoinPriceFromChainlink();
```

---

### **Step 5: Setup Fallback (Manual Updates)** ✅ (FALLBACK)

**Pentru testing sau fallback:**
```solidity
// Get BTC price din CoinGecko sau alt API (off-chain)
uint256 btcPriceUSD = 43000 * 1e18; // $43,000 (scaled by 1e18)
uint256 confidence = 8500; // 85% confidence (manual source)

// Update Bitcoin price manual
oracle.updateBitcoinPrice(btcPriceUSD, confidence);
```

**Backend Service pentru Manual Updates:**
```javascript
// Fetch BTC price din CoinGecko
async function fetchBTCPrice() {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
  const data = await response.json();
  return parseFloat(data.bitcoin.usd);
}

// Update OraclePriceFeed
async function updateBitcoinPriceManual() {
  const btcPrice = await fetchBTCPrice();
  const btcPriceScaled = ethers.utils.parseUnits(btcPrice.toString(), 18);
  const confidence = 8500; // 85% confidence
  
  const oracle = await ethers.getContractAt('OraclePriceFeed', ORACLE_ADDRESS);
  const tx = await oracle.updateBitcoinPrice(btcPriceScaled, confidence);
  await tx.wait();
  console.log(`Bitcoin price updated: $${btcPrice}`);
}
```

---

## 📊 Price Feed Configuration

### **Configuration Parameters:**

| Parameter | Value | Description |
|-----------|-------|-------------|
| **minConfidenceBps** | 8000 | Minimum confidence (80%) |
| **maxPriceAge** | 3600 | Maximum price age (1 hour) |
| **minSources** | 1 | Minimum sources pentru aggregation |
| **maxPriceDeviationBps** | 1000 | Max price deviation (10%) |

### **Bitcoin-Specific Configuration:**

| Token | Chainlink Feed | Decimals | Update Interval |
|-------|---------------|----------|-----------------|
| **WBTC** | BTC/USD | 8 | ~1 hour |
| **BTCB** | BTC/USD | 8 | ~1 hour |

**Note:** Ambele WBTC și BTCB folosesc același BTC/USD Chainlink feed (ambele sunt 1:1 cu Bitcoin).

---

## 🔍 Verification Steps

### **1. Verify Chainlink Setup:**
```solidity
// Check Chainlink BTC price feed address
address feed = oracle.chainlinkBTCPriceFeed();
require(feed != address(0), "Chainlink feed not set");

// Verify price feed contract exists
IChainlinkPriceFeed priceFeed = IChainlinkPriceFeed(feed);
string memory description = priceFeed.description();
require(bytes(description).length > 0, "Invalid price feed");
```

### **2. Verify Bitcoin Price:**
```solidity
// Get Bitcoin price în USD
uint256 btcPrice = oracle.getBitcoinPriceUSD();
require(btcPrice > 0, "Bitcoin price not available");

// Verify price validity
(bool isValid) = oracle.getPrice(BitcoinTokens.WBTC_BSC);
require(isValid, "WBTC price not valid");

(bool isValid) = oracle.getPrice(BitcoinTokens.BTCB_BSC);
require(isValid, "BTCB price not valid");
```

### **3. Test Price Updates:**
```solidity
// Test Chainlink update
bool success = oracle.updateBitcoinPriceFromChainlink();
require(success, "Chainlink update failed");

// Verify updated price
(uint256 price, uint256 timestamp, , bool isValid) = oracle.getPrice(BitcoinTokens.WBTC_BSC);
require(isValid, "Price update failed");
require(timestamp > 0, "Invalid timestamp");
```

---

## 🔄 Automatic Update Setup

### **Option 1: Keeper Network** ✅ (RECOMMENDED)

**Gelato Network sau similar:**
```javascript
// Gelato resolver pentru automatic execution
async function resolver() {
  const oracle = await ethers.getContractAt('OraclePriceFeed', ORACLE_ADDRESS);
  const lastUpdate = await oracle.prices(BITCOIN_TOKENS.WBTC_BSC).timestamp;
  const maxAge = await oracle.maxPriceAge();
  
  // Trigger update dacă price e stale
  return block.timestamp > lastUpdate + maxAge;
}

// Gelato task
const task = await gelato.createTask({
  execAddress: ORACLE_ADDRESS,
  execSelector: oracle.interface.getSighash('updateBitcoinPriceFromChainlink'),
  resolverAddress: RESOLVER_ADDRESS,
  resolverData: resolver(),
  interval: 3600 // 1 hour
});
```

### **Option 2: Backend Cron Job** ✅

**Node.js Cron Job:**
```javascript
const cron = require('node-cron');
const { ethers } = require('ethers');

// Update Bitcoin price din Chainlink (every hour)
cron.schedule('0 * * * *', async () => {
  try {
    const oracle = await ethers.getContractAt('OraclePriceFeed', ORACLE_ADDRESS);
    const tx = await oracle.updateBitcoinPriceFromChainlink();
    await tx.wait();
    console.log(`✅ Bitcoin price updated at ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`❌ Failed to update Bitcoin price:`, error);
    
    // Fallback: Manual update din CoinGecko
    try {
      const btcPrice = await fetchBTCPriceFromCoinGecko();
      const btcPriceScaled = ethers.utils.parseUnits(btcPrice.toString(), 18);
      const tx = await oracle.updateBitcoinPrice(btcPriceScaled, 8500);
      await tx.wait();
      console.log(`✅ Bitcoin price updated manually: $${btcPrice}`);
    } catch (fallbackError) {
      console.error(`❌ Fallback update failed:`, fallbackError);
    }
  }
});
```

---

## 📝 Integration cu Backend

### **Backend Service pentru Price Feed Management:**

```javascript
// services/priceFeedService.js
const { ethers } = require('ethers');
const OraclePriceFeed = require('../contracts/OraclePriceFeed.json');

class PriceFeedService {
  constructor(provider, oracleAddress, signer) {
    this.oracle = new ethers.Contract(oracleAddress, OraclePriceFeed.abi, signer);
    this.provider = provider;
  }
  
  /**
   * Setup Chainlink BTC/USD price feed
   */
  async setupChainlinkBTCFeed(chainlinkAddress) {
    const tx = await this.oracle.setChainlinkBTCPriceFeed(chainlinkAddress);
    await tx.wait();
    return tx.hash;
  }
  
  /**
   * Update Bitcoin price din Chainlink
   */
  async updateFromChainlink() {
    try {
      const tx = await this.oracle.updateBitcoinPriceFromChainlink();
      await tx.wait();
      return { success: true, txHash: tx.hash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update Bitcoin price manual (fallback)
   */
  async updateManual(btcPriceUSD, confidence = 8500) {
    const btcPriceScaled = ethers.utils.parseUnits(btcPriceUSD.toString(), 18);
    const tx = await this.oracle.updateBitcoinPrice(btcPriceScaled, confidence);
    await tx.wait();
    return tx.hash;
  }
  
  /**
   * Get Bitcoin price din oracle
   */
  async getBitcoinPrice() {
    try {
      const price = await this.oracle.getBitcoinPriceUSD();
      return {
        price: ethers.utils.formatUnits(price, 18),
        priceRaw: price.toString(),
        source: 'oracle'
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  /**
   * Check price validity
   */
  async isBitcoinPriceValid() {
    try {
      const wbtcPrice = await this.oracle.getPrice(BitcoinTokens.WBTC_BSC);
      return wbtcPrice.isValid;
    } catch (error) {
      return false;
    }
  }
}
```

---

## ⚠️ Important Notes

### **1. Chainlink Price Feed Limitations:**
- ⚠️ Chainlink updates ~1 time per hour (nu real-time)
- ⚠️ Gas cost pentru fiecare update (~50,000-100,000 gas)
- ⚠️ Requires LINK tokens pentru payment (dacă e keeper network)

### **2. Price Staleness:**
- ⚠️ Price-urile Chainlink pot fi stale (maxPriceAge = 1 hour)
- ⚠️ Verifică `maxPriceAge` înainte de utilizare
- ⚠️ Folosește `_isValidPrice()` pentru validation

### **3. Multi-Source Aggregation:**
- ✅ Poți folosi multiple sources (Chainlink + Band + Manual)
- ✅ Aggregate prices pentru mai mare confidence
- ✅ Use `aggregatePrices()` pentru aggregation

---

## ✅ Testing Checklist

### **Unit Tests:**
- [ ] Test Chainlink price feed setup
- [ ] Test `updateBitcoinPriceFromChainlink()`
- [ ] Test `getBitcoinPriceUSD()` cu Chainlink
- [ ] Test `getBitcoinPriceUSD()` fallback (manual price)
- [ ] Test price staleness validation
- [ ] Test confidence levels

### **Integration Tests:**
- [ ] Test Chainlink integration (mock feed)
- [ ] Test automatic updates (keeper/cron)
- [ ] Test fallback manual updates
- [ ] Test price aggregation (multiple sources)
- [ ] Test stop loss/take profit cu Bitcoin price

### **End-to-End Tests:**
- [ ] Test complete flow: Chainlink update → Get price → Use în trade
- [ ] Test price staleness handling
- [ ] Test fallback mechanism (Chainlink → Manual)
- [ ] Test price deviation protection

---

## 🚀 Quick Start

### **1. Setup Chainlink (Production):**
```bash
# Deploy OraclePriceFeed
npx hardhat deploy --network bsc

# Setup Chainlink BTC/USD feed
npx hardhat run scripts/setupChainlinkBTC.js --network bsc
```

### **2. Setup Manual (Testing):**
```bash
# Deploy OraclePriceFeed
npx hardhat deploy --network bscTestnet

# Setup manual price (pentru testing)
npx hardhat run scripts/setupManualBTC.js --network bscTestnet
```

### **3. Verify Setup:**
```bash
# Verify price feeds
npx hardhat run scripts/verifyPriceFeeds.js --network bsc
```

---

## 📚 Resources

### **Chainlink Documentation:**
- [Chainlink Data Feeds](https://docs.chain.link/data-feeds)
- [Chainlink BSC Feeds](https://docs.chain.link/data-feeds/price-feeds/addresses?network=bnb)
- [Chainlink AggregatorV3Interface](https://docs.chain.link/data-feeds/api-reference)

### **Band Protocol:**
- [Band Protocol Documentation](https://docs.bandchain.org/)
- [Band Protocol BSC Integration](https://docs.bandchain.org/developers/band-standard-dataset/using-band-protocol-on-binance-smart-chain)

### **Price Feed Addresses:**
- [Chainlink BSC Mainnet Feeds](https://docs.chain.link/data-feeds/price-feeds/addresses?network=bnb)
- [Chainlink BSC Testnet Feeds](https://docs.chain.link/data-feeds/price-feeds/addresses?network=bnb-testnet)

---

**Last Updated:** 2025-01-09  
**Status:** ✅ **SETUP GUIDE COMPLETE** - Ready pentru Configuration!

**Next Steps:** Setup Chainlink price feed pentru Bitcoin! 🚀

