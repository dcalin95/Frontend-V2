// 📄 Script pentru compensare BITS
const { ethers } = require("hardhat");

const BITS_ADDRESS = "0xf14e5c448e88B24cF7814aeb0B9e437C23CbeEd9";
const USER = "0xe327fab2a5E4E126239F7A68C930d1a0f4ab9FB2";
const EXPECTED_BITS = ethers.utils.parseUnits("5.969", 18); // 5.969 BITS în wei

async function main() {
  const [deployer] = await ethers.getSigners();
  const bits = await ethers.getContractAt("IERC20", BITS_ADDRESS);

  const balance = await bits.balanceOf(USER);
  console.log("🔎 User balance:", ethers.utils.formatUnits(balance, 18));

  if (balance.lt(EXPECTED_BITS)) {
    const missing = EXPECTED_BITS.sub(balance);
    console.log("⚠️ Sending missing BITS:", ethers.utils.formatUnits(missing, 18));

    const tx = await bits.transfer(USER, missing);
    await tx.wait();
    console.log("✅ BITS compensat:", tx.hash);
  } else {
    console.log("✅ User already has expected BITS.");
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
