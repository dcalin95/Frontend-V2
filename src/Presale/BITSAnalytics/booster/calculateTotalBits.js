import { ethers } from "ethers";
import { CONTRACT_MAP } from "../../../contract/contractMap";

/**
 * Returnează totalul de $BITS deținut de un wallet, folosind direct contractul BITS din CONTRACT_MAP.
 *
 * @param {string} walletAddress - Adresa utilizatorului
 * @param {Contract} nodeContract - Instanța contractului Node.sol (pentru provider)
 * @returns {Promise<number>} - Total $BITS (float)
 */
const calculateTotalBits = async (walletAddress, nodeContract) => {
  if (!walletAddress || !nodeContract) {
    console.warn("⚠️ [calculateTotalBits] Wallet address sau Node contract lipsă.");
    return 0;
  }

  try {
    // Folosește direct adresa BITS din CONTRACT_MAP
    const bitsContract = new ethers.Contract(
      CONTRACT_MAP.BITS_TOKEN.address,
      CONTRACT_MAP.BITS_TOKEN.abi,
      nodeContract.provider || nodeContract.signer
    );

    // Fetch balanța utilizatorului
    const rawBalance = await bitsContract.balanceOf(walletAddress);
    const balanceFormatted = parseFloat(ethers.utils.formatUnits(rawBalance, 18));
    
    // console.log("✅ [calculateTotalBits] Balance:", balanceFormatted, "$BITS");
    return balanceFormatted;
  } catch (err) {
    console.error("❌ [calculateTotalBits] Error:", err.message);
    return 0;
  }
};

export default calculateTotalBits;
