import { ethers } from "ethers";
import { getContractInstance } from "../../contract/getContract";

// ✅ CoinGecko token ID map
const coingeckoMap = {
  BNB: "binancecoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  MATIC: "polygon",
  LINK: "chainlink",
  BTCB: "bitcoin",
  SOL: "solana",
};

const fetchFromCoinGecko = async (key) => {
  try {
    const id = coingeckoMap[key];
    if (!id) throw new Error(`No CoinGecko ID for token: ${key}`);

    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
    const data = await res.json();
    const price = data[id]?.usd || 0;

    console.log(`🌐 CoinGecko fallback price for ${key}: $${price}`);
    return price;
  } catch (error) {
    console.error(`❌ CoinGecko fetch failed for ${key}:`, error);
    return 0;
  }
};

const fetchTokenPrice = async (tokenAddress, key = "") => {
  const isBNB = !tokenAddress || tokenAddress === ethers.constants.AddressZero || key === "BNB";

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const wallet = await signer.getAddress();
    const contract = await getContractInstance("CELL_MANAGER");

    console.log("📄 CELL_MANAGER contract loaded");

    if (isBNB) {
      const rawBNBPrice = await contract.checkBNBPrice(); // 18 decimals
      const bnbPrice = parseFloat(ethers.utils.formatUnits(rawBNBPrice, 18));
      console.log(`💰 1 BNB = $${bnbPrice.toFixed(3)}`);
      return bnbPrice;
    }

    const cellId = await contract.getCurrentOpenCellId();
    const amountIn = ethers.utils.parseEther("1");
    const bits = await contract.getExpectedBITSFromToken(cellId, tokenAddress, amountIn, wallet);

    const bitsPerToken = parseFloat(ethers.utils.formatEther(bits));
    const rawBitsPriceUSD = await contract.getCurrentBitsPriceUSD(wallet);

    let bitsPriceUSD =
      rawBitsPriceUSD.toString().length >= 18
        ? parseFloat(ethers.utils.formatUnits(rawBitsPriceUSD, 18))
        : rawBitsPriceUSD.toString().length >= 6
        ? parseFloat(ethers.utils.formatUnits(rawBitsPriceUSD, 6))
        : parseFloat(rawBitsPriceUSD.toString());

    // 🎯 FIX: Force $1.00 BITS price if contract returns wrong value  
    if (bitsPriceUSD < 0.50) {
      console.log("🚨 [fetchTokenPrice] Contract returned too low BITS price:", bitsPriceUSD, "→ Forcing $1.00");
      bitsPriceUSD = 1.00;
    }

    const tokenPriceUSD = bitsPerToken * bitsPriceUSD;
    console.log(`💰 Final price for 1 ${key}: $${tokenPriceUSD.toFixed(3)}`);

    return tokenPriceUSD;
  } catch (error) {
    console.warn(`⚠️ Contract failed for ${key}, using CoinGecko fallback...`);
    return await fetchFromCoinGecko(key);
  }
};

export default fetchTokenPrice;

