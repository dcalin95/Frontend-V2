// Deploy script for MindMirrorNFT contract
// Run: npx hardhat run scripts/deploy-mind-nft.js --network bscTestnet

const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting MindMirrorNFT deployment...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "BNB");
  
  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    console.error("❌ Insufficient BNB balance! Need at least 0.01 BNB for gas fees.");
    console.log("💡 Get testnet BNB from: https://testnet.binance.org/faucet-smart");
    return;
  }
  
  // Deploy contract
  console.log("🔨 Deploying MindMirrorNFT contract...");
  
  const MindMirrorNFT = await ethers.getContractFactory("MindMirrorNFT");
  const mindNFT = await MindMirrorNFT.deploy();
  
  console.log("⏳ Waiting for deployment transaction...");
  await mindNFT.deployed();
  
  console.log("✅ MindMirrorNFT deployed successfully!");
  console.log("📍 Contract Address:", mindNFT.address);
  console.log("🔗 BSCScan URL: https://testnet.bscscan.com/address/" + mindNFT.address);
  console.log("📄 Transaction Hash:", mindNFT.deployTransaction.hash);
  
  // Verify contract info
  console.log("\n🔍 Verifying contract details...");
  const name = await mindNFT.name();
  const symbol = await mindNFT.symbol();
  const nextTokenId = await mindNFT.nextTokenId();
  
  console.log("📝 Contract Name:", name);
  console.log("🏷️ Contract Symbol:", symbol);
  console.log("🆔 Next Token ID:", nextTokenId.toString());
  
  // Wait for block confirmations
  console.log("\n⏳ Waiting for 5 block confirmations...");
  await mindNFT.deployTransaction.wait(5);
  
  console.log("✅ Contract confirmed on blockchain!");
  
  // Instructions for next steps
  console.log("\n" + "=".repeat(60));
  console.log("🎯 NEXT STEPS:");
  console.log("=".repeat(60));
  console.log("1. Update contract address in your React app:");
  console.log("   📁 src/contract/MindMirrorNFT.js");
  console.log(`   testnet: { address: "${mindNFT.address}" }`);
  console.log("");
  console.log("2. Configure an authenticated backend IPFS upload service.");
  console.log("   Never put Pinata credentials in REACT_APP_* variables or a browser bundle.");
  console.log("");
  console.log("3. Test minting at: http://localhost:3000/mind-mirror");
  console.log("");
  console.log("🔗 View contract: https://testnet.bscscan.com/address/" + mindNFT.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
