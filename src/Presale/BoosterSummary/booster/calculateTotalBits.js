import { ethers } from "ethers";

/**
 * Returnează totalul de $BITS deținut de un wallet, folosind adresa tokenului din Node.sol.
 *
 * @param {string} walletAddress - Adresa utilizatorului
 * @param {Contract} nodeContract - Instanța contractului Node.sol
 * @returns {Promise<number>} - Total $BITS (float)
 */
const calculateTotalBits = async (walletAddress, nodeContract) => {
  if (!walletAddress || !nodeContract) {
    console.warn("⚠️ Wallet address sau Node contract lipsă.");
    return 0;
  }

  try {
    // Obține adresa tokenului $BITS din contractul Node
    const bitsTokenAddress = await nodeContract.bitsToken();

    // Creează instanța ERC20 minimală
    const bitsContract = new ethers.Contract(
      bitsTokenAddress,
      ["function balanceOf(address) view returns (uint256)"],
      nodeContract.provider
    );

    // Fetch balanța utilizatorului
    const rawBalance = await bitsContract.balanceOf(walletAddress);
    const balanceFormatted = parseFloat(ethers.utils.formatUnits(rawBalance, 18));

    return balanceFormatted;
  } catch (err) {
    console.error("❌ [calculateTotalBits] Eroare:", err);
    return 0;
  }
};

export default calculateTotalBits;
