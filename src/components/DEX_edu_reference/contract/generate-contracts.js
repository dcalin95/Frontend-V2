const fs = require("fs");
const path = require("path");

// ====================
// 🔗 Lista contractelor ACTIVE pe BSC Testnet
// ====================
const contracts = [
  { name: "BITS", address: "0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe", abi: "BitsABI" },
  { name: "Staking", address: "0xF1fd04dB28545C5d5d2f2a7709135839B22984de", abi: "stakingABI" },
  { name: "Node", address: "0xE6536756d73F0771D9a317F49453DE96541C352F", abi: "nodeABI" },
  { name: "AdditionalReward", address: "0x15473d61a9c8F866eb1a3a5b24e2B520acdb0Fc6", abi: "AdditionalRewardABI" },
  { name: "CellManager", address: "0x957B858cc0684c8a91ec3C7f8A9E3DA2Df9F3bC6", abi: "CellManagerABI" },
  { name: "TelegramRewardContract", address: "0x5b861fbB5b40a04eb943428d2bD395B4c87D837e", abi: "TelegramRewardContractABI" },
];

// 📁 Unde salvăm fișierele
const outputDir = path.join(__dirname);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 🛠️ Generează câte un fișier pentru fiecare contract
contracts.forEach(({ name, address, abi }) => {
  const filename = path.join(outputDir, `${name}.js`);
  const content = `import { ethers } from "ethers";
import ${abi} from '../abi/${abi}.js';

const ${name.toUpperCase()}_ADDRESS = "${address}";

export const get${name}Contract = (signerOrProvider) => {
  return new ethers.Contract(${name.toUpperCase()}_ADDRESS, ${abi}, signerOrProvider);
};`;

  fs.writeFileSync(filename, content, "utf-8");
  console.log(`✅ Contract ${name}.js creat cu succes.`);
});
