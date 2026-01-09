/**
 * 🔧 Setup Manual Bitcoin Price Feed Script
 * 
 * Script pentru configurarea manuală a Bitcoin price feeds (pentru testing)
 * Folosește CoinGecko API pentru a obține prețul BTC
 * 
 * Usage:
 *   npx hardhat run scripts/setupManualBTC.js --network bscTestnet
 */

const { ethers } = require("hardhat");
const axios = require("axios"); // sau fetch, dacă e disponibil

// OraclePriceFeed contract address (trebuie setat după deployment)
const ORACLE_PRICE_FEED_ADDRESS = process.env.ORACLE_PRICE_FEED_ADDRESS || "";

// CoinGecko API pentru BTC price
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";

async function fetchBTCPriceFromCoinGecko() {
  try {
    const response = await axios.get(COINGECKO_API_URL);
    const price = response.data.bitcoin.usd;
    console.log(`📊 BTC price from CoinGecko: $${price}`);
    return price;
  } catch (error) {
    console.error("❌ Failed to fetch BTC price from CoinGecko:", error.message);
    throw error;
  }
}

async function main() {
  console.log("🔧 Setup Manual Bitcoin Price Feed...");
  console.log("Network:", network.name);
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  
  // Get OraclePriceFeed contract
  if (!ORACLE_PRICE_FEED_ADDRESS) {
    throw new Error("ORACLE_PRICE_FEED_ADDRESS not set in .env");
  }
  
  const OraclePriceFeed = await ethers.getContractFactory("OraclePriceFeed");
  const oracle = OraclePriceFeed.attach(ORACLE_PRICE_FEED_ADDRESS);
  
  console.log("OraclePriceFeed address:", ORACLE_PRICE_FEED_ADDRESS);
  
  // Fetch BTC price din CoinGecko
  console.log("\n📊 Fetching BTC price from CoinGecko...");
  const btcPriceUSD = await fetchBTCPriceFromCoinGecko();
  
  // Convert to scaled value (18 decimals)
  const btcPriceScaled = ethers.utils.parseUnits(btcPriceUSD.toString(), 18);
  console.log(`BTC price scaled: ${btcPriceScaled.toString()}`);
  
  // Confidence level pentru manual update (85% - manual source)
  const confidence = 8500; // 85%
  console.log("Confidence level:", confidence / 100, "%");
  
  // Update Bitcoin price în OraclePriceFeed
  console.log("\n📋 Updating Bitcoin price în OraclePriceFeed...");
  const tx = await oracle.updateBitcoinPrice(btcPriceScaled, confidence);
  console.log("Transaction hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ Bitcoin price updated!");
  
  // Verify update
  console.log("\n📊 Verifying Bitcoin price...");
  const btcPriceFromOracle = await oracle.getBitcoinPriceUSD();
  const btcPriceFormatted = ethers.utils.formatUnits(btcPriceFromOracle, 18);
  console.log(`Bitcoin price from oracle: $${btcPriceFormatted}`);
  
  // Verify WBTC and BTCB prices
  console.log("\n📊 Verifying WBTC and BTCB prices...");
  const { WBTC_BSC, BTCB_BSC } = require("../constants/BitcoinTokens");
  
  const wbtcPriceData = await oracle.getPrice(WBTC_BSC);
  const btcbPriceData = await oracle.getPrice(BTCB_BSC);
  
  console.log("WBTC Price:", ethers.utils.formatUnits(wbtcPriceData.price, 18));
  console.log("WBTC Timestamp:", new Date(wbtcPriceData.timestamp * 1000).toISOString());
  console.log("WBTC Confidence:", wbtcPriceData.confidence / 100, "%");
  console.log("WBTC Valid:", wbtcPriceData.isValid);
  
  console.log("BTCB Price:", ethers.utils.formatUnits(btcbPriceData.price, 18));
  console.log("BTCB Timestamp:", new Date(btcbPriceData.timestamp * 1000).toISOString());
  console.log("BTCB Confidence:", btcbPriceData.confidence / 100, "%");
  console.log("BTCB Valid:", btcbPriceData.isValid);
  
  if (wbtcPriceData.isValid && btcbPriceData.isValid) {
    console.log("\n✅ Setup complete! Bitcoin prices are valid.");
  } else {
    console.log("\n⚠️ Warning: Bitcoin prices may not be valid (check maxPriceAge)");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });

