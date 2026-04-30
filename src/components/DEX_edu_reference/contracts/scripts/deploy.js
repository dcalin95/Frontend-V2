/**
 * 🚀 Deployment Script pentru BitSwapDEX Contracts
 * 
 * Script pentru deployment automat al contractelor
 * 
 * NOTĂ: Acest script este pentru Hardhat. Pentru Remix Desktop,
 * folosește "Deploy & Run Transactions" tab direct.
 * 
 * Usage (Hardhat):
 *   npx hardhat run scripts/deploy.js --network bscTestnet
 *   npx hardhat run scripts/deploy.js --network bsc
 */

const { ethers } = require("hardhat");

// Contract addresses (setează după deployment)
const DEPLOYED_ADDRESSES = {
  BitSwapDEXWrapper: "",
  OraclePriceFeed: "",
  AITradingExecutor: "",
  SmartOffersManager: "",
  TreasuryManagement: "",
  StakingRewards: "",
  UserVault: "",
  FeeDistributionAutomation: ""
};

// Configuration
const CONFIG = {
  // PancakeSwap Router (BSC Mainnet)
  PANCAKESWAP_ROUTER_MAINNET: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  PANCAKESWAP_ROUTER_TESTNET: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
  
  // Addresses
  BURN_ADDRESS: "0x000000000000000000000000000000000000dEaD",
  TREASURY_ADDRESS: process.env.TREASURY_ADDRESS || "", // Setează în .env
  STAKERS_ADDRESS: process.env.STAKERS_ADDRESS || "", // Setează în .env
  
  // Protocol Fee (0.1% = 100 basis points)
  PROTOCOL_FEE_BPS: 100,
  
  // Fee Distribution (50% burn, 30% stakers, 20% treasury)
  FEE_DISTRIBUTION: {
    burn: 50,
    stakers: 30,
    treasury: 20
  }
};

async function main() {
  console.log("🚀 Starting BitSwapDEX Contracts Deployment...");
  console.log("Network:", network.name);
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "BNB");
  
  // Determine network
  const isMainnet = network.name === "bsc" || network.name === "bscMainnet";
  const pancakeswapRouter = isMainnet 
    ? CONFIG.PANCAKESWAP_ROUTER_MAINNET 
    : CONFIG.PANCAKESWAP_ROUTER_TESTNET;
  
  console.log("\n📋 Configuration:");
  console.log("- PancakeSwap Router:", pancakeswapRouter);
  console.log("- Burn Address:", CONFIG.BURN_ADDRESS);
  console.log("- Treasury Address:", CONFIG.TREASURY_ADDRESS || "⚠️ NOT SET");
  console.log("- Stakers Address:", CONFIG.STAKERS_ADDRESS || "⚠️ NOT SET");
  
  // ===== 1. Deploy OraclePriceFeed =====
  console.log("\n📊 Deploying OraclePriceFeed...");
  const OraclePriceFeed = await ethers.getContractFactory("OraclePriceFeed");
  const oracle = await OraclePriceFeed.deploy();
  await oracle.deployed();
  DEPLOYED_ADDRESSES.OraclePriceFeed = oracle.address;
  console.log("✅ OraclePriceFeed deployed to:", oracle.address);
  
  // ===== 2. Deploy BitSwapDEXWrapper =====
  console.log("\n🔄 Deploying BitSwapDEXWrapper...");
  
  if (!CONFIG.TREASURY_ADDRESS || !CONFIG.STAKERS_ADDRESS) {
    throw new Error("TREASURY_ADDRESS și STAKERS_ADDRESS trebuie setate în .env");
  }
  
  const BitSwapDEXWrapper = await ethers.getContractFactory("BitSwapDEXWrapper");
  const wrapper = await BitSwapDEXWrapper.deploy(
    pancakeswapRouter,
    CONFIG.BURN_ADDRESS,
    CONFIG.TREASURY_ADDRESS,
    CONFIG.STAKERS_ADDRESS
  );
  await wrapper.deployed();
  DEPLOYED_ADDRESSES.BitSwapDEXWrapper = wrapper.address;
  console.log("✅ BitSwapDEXWrapper deployed to:", wrapper.address);
  
  // Configure wrapper
  console.log("\n⚙️ Configuring BitSwapDEXWrapper...");
  await wrapper.setProtocolFee(CONFIG.PROTOCOL_FEE_BPS);
  await wrapper.setFeeDistribution(
    CONFIG.FEE_DISTRIBUTION.burn,
    CONFIG.FEE_DISTRIBUTION.stakers,
    CONFIG.FEE_DISTRIBUTION.treasury
  );
  console.log("✅ BitSwapDEXWrapper configured");
  
  // ===== 3. Deploy OraclePriceFeed Chainlink Setup =====
  console.log("\n🔗 Setting up Chainlink BTC/USD price feed...");
  const chainlinkBTCFeed = isMainnet
    ? "0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf" // BSC Mainnet
    : "0x5741306c21795FdCBb9b265Ea0255F499DFe515C"; // BSC Testnet (Mock)
  
  await oracle.setChainlinkBTCPriceFeed(chainlinkBTCFeed);
  console.log("✅ Chainlink BTC/USD price feed configured");
  
  // ===== 4. Summary =====
  console.log("\n📋 Deployment Summary:");
  console.log("=".repeat(50));
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);
  console.log("\nDeployed Contracts:");
  console.log("- OraclePriceFeed:", DEPLOYED_ADDRESSES.OraclePriceFeed);
  console.log("- BitSwapDEXWrapper:", DEPLOYED_ADDRESSES.BitSwapDEXWrapper);
  console.log("\nConfiguration:");
  console.log("- Protocol Fee:", CONFIG.PROTOCOL_FEE_BPS, "bps (0.1%)");
  console.log("- Fee Distribution:", 
    `${CONFIG.FEE_DISTRIBUTION.burn}% burn, ` +
    `${CONFIG.FEE_DISTRIBUTION.stakers}% stakers, ` +
    `${CONFIG.FEE_DISTRIBUTION.treasury}% treasury`
  );
  console.log("=".repeat(50));
  
  // Save addresses to file (opțional)
  console.log("\n💾 Save these addresses pentru viitor:");
  console.log(JSON.stringify(DEPLOYED_ADDRESSES, null, 2));
  
  console.log("\n✅ Deployment complete!");
  console.log("\n📝 Next Steps:");
  console.log("1. Verify contracts pe BSCScan");
  console.log("2. Test contract functions");
  console.log("3. Update frontend cu contract addresses");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

