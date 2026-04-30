/**
 * ✅ Contract Verification Script
 * 
 * Script pentru verificarea contractelor pe BSCScan
 * 
 * NOTĂ: Acest script este pentru Hardhat. Pentru Remix Desktop,
 * folosește BSCScan manual verification.
 * 
 * Usage (Hardhat):
 *   npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
 */

const { run } = require("hardhat");

// Contract addresses (setează după deployment)
const CONTRACT_ADDRESSES = {
  BitSwapDEXWrapper: process.env.BITSWAP_DEX_WRAPPER_ADDRESS || "",
  OraclePriceFeed: process.env.ORACLE_PRICE_FEED_ADDRESS || ""
};

// Constructor arguments (setează după deployment)
const CONSTRUCTOR_ARGS = {
  BitSwapDEXWrapper: [
    "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap Router
    "0x000000000000000000000000000000000000dEaD", // Burn address
    process.env.TREASURY_ADDRESS || "", // Treasury address
    process.env.STAKERS_ADDRESS || ""   // Stakers address
  ],
  OraclePriceFeed: [] // No constructor args
};

async function main() {
  console.log("✅ Starting Contract Verification...");
  console.log("Network:", process.env.HARDHAT_NETWORK || "hardhat");
  
  // Verify BitSwapDEXWrapper
  if (CONTRACT_ADDRESSES.BitSwapDEXWrapper) {
    console.log("\n🔍 Verifying BitSwapDEXWrapper...");
    try {
      await run("verify:verify", {
        address: CONTRACT_ADDRESSES.BitSwapDEXWrapper,
        constructorArguments: CONSTRUCTOR_ARGS.BitSwapDEXWrapper
      });
      console.log("✅ BitSwapDEXWrapper verified!");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("ℹ️ BitSwapDEXWrapper already verified");
      } else {
        console.error("❌ Verification failed:", error.message);
      }
    }
  }
  
  // Verify OraclePriceFeed
  if (CONTRACT_ADDRESSES.OraclePriceFeed) {
    console.log("\n🔍 Verifying OraclePriceFeed...");
    try {
      await run("verify:verify", {
        address: CONTRACT_ADDRESSES.OraclePriceFeed,
        constructorArguments: CONSTRUCTOR_ARGS.OraclePriceFeed
      });
      console.log("✅ OraclePriceFeed verified!");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("ℹ️ OraclePriceFeed already verified");
      } else {
        console.error("❌ Verification failed:", error.message);
      }
    }
  }
  
  console.log("\n✅ Verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });

