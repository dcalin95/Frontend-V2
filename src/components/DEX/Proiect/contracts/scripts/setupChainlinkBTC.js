/**
 * 🔧 Setup Chainlink BTC/USD Price Feed Script
 * 
 * Script pentru configurarea Chainlink BTC/USD price feed în OraclePriceFeed contract
 * 
 * Usage:
 *   npx hardhat run scripts/setupChainlinkBTC.js --network bsc
 *   npx hardhat run scripts/setupChainlinkBTC.js --network bscTestnet
 */

const { ethers } = require("hardhat");

// Chainlink BTC/USD Price Feed Addresses
const CHAINLINK_BTC_USD_MAINNET = "0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf";
const CHAINLINK_BTC_USD_TESTNET = "0x5741306c21795FdCBb9b265Ea0255F499DFe515C"; // Mock

// OraclePriceFeed contract address (trebuie setat după deployment)
const ORACLE_PRICE_FEED_ADDRESS = process.env.ORACLE_PRICE_FEED_ADDRESS || "";

async function main() {
  console.log("🔧 Setup Chainlink BTC/USD Price Feed...");
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
  
  // Determine Chainlink feed address based on network
  const chainlinkBTCFeed = network.name === "bsc" || network.name === "bscMainnet"
    ? CHAINLINK_BTC_USD_MAINNET
    : CHAINLINK_BTC_USD_TESTNET;
  
  console.log("Chainlink BTC/USD Feed:", chainlinkBTCFeed);
  
  // Setup Chainlink BTC/USD price feed
  console.log("\n📋 Setting up Chainlink BTC/USD price feed...");
  const tx = await oracle.setChainlinkBTCPriceFeed(chainlinkBTCFeed);
  console.log("Transaction hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ Chainlink BTC/USD price feed setup complete!");
  
  // Verify setup
  const configuredFeed = await oracle.chainlinkBTCPriceFeed();
  console.log("Configured feed:", configuredFeed);
  
  if (configuredFeed.toLowerCase() === chainlinkBTCFeed.toLowerCase()) {
    console.log("✅ Verification passed!");
  } else {
    console.log("❌ Verification failed!");
    process.exit(1);
  }
  
  // Test Chainlink price fetch (dacă e disponibil)
  console.log("\n📊 Testing Chainlink price fetch...");
  try {
    const success = await oracle.updateBitcoinPriceFromChainlink();
    if (success) {
      console.log("✅ Successfully updated Bitcoin price from Chainlink!");
      
      // Get updated price
      const btcPrice = await oracle.getBitcoinPriceUSD();
      const btcPriceFormatted = ethers.utils.formatUnits(btcPrice, 18);
      console.log(`Bitcoin price: $${btcPriceFormatted}`);
    } else {
      console.log("⚠️ Chainlink update returned false (may be testnet mock)");
    }
  } catch (error) {
    console.log("⚠️ Chainlink update failed (may be testnet mock):", error.message);
    console.log("💡 This is normal on testnet - use manual updates for testing");
  }
  
  // Verify WBTC and BTCB prices
  console.log("\n📊 Verifying WBTC and BTCB prices...");
  const wbtcPrice = await oracle.getPrice(require("../constants/BitcoinTokens").WBTC_BSC);
  const btcbPrice = await oracle.getPrice(require("../constants/BitcoinTokens").BTCB_BSC);
  
  console.log("WBTC Price:", ethers.utils.formatUnits(wbtcPrice.price, 18));
  console.log("WBTC Valid:", wbtcPrice.isValid);
  console.log("BTCB Price:", ethers.utils.formatUnits(btcbPrice.price, 18));
  console.log("BTCB Valid:", btcbPrice.isValid);
  
  console.log("\n✅ Setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });

