import { ethers } from 'ethers';
import { CONTRACT_MAP } from '../contract/contractMap';
import BitsABI from '../abi/BitsABI.js';

// Treasury wallet address where certificate fees are sent
export const BITS_TREASURY_WALLET = "0x4cca7bf2aef7a432d06513f7b02c2f316e21f408";

// Get BITS token metadata from contract
export const getBitsTokenInfo = async (signer) => {
  try {
    const bitsContract = new ethers.Contract(
      CONTRACT_MAP.BITS_TOKEN.address,
      BitsABI,
      signer || new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/')
    );

    const [name, symbol, decimals] = await Promise.all([
      bitsContract.name(),
      bitsContract.symbol(),
      bitsContract.decimals()
    ]);

    return {
      name: String(name || 'BITS Token'),
      symbol: String(symbol || 'BITS'),
      decimals: Number(decimals || 18),
      address: CONTRACT_MAP.BITS_TOKEN.address
    };
  } catch (error) {
    console.warn('Failed to fetch BITS token info:', error);
    return {
      name: 'BITS Token',
      symbol: 'BITS',
      decimals: 18,
      address: CONTRACT_MAP.BITS_TOKEN.address
    };
  }
};

export const sendBitsToTreasury = async (signer, amount) => {
  try {
    if (!signer) throw new Error("Wallet not connected");

    // Get BITS Contract
    const bitsContract = new ethers.Contract(
      CONTRACT_MAP.BITS_TOKEN.address,
      BitsABI,
      signer
    );

    // Convert amount to Wei (18 decimals)
    const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);

    console.log(`💸 Initiating payment of ${amount} BITS to ${BITS_TREASURY_WALLET}`);

    // Call transfer with explicit metadata for wallet displays
    const tx = await bitsContract.transfer(BITS_TREASURY_WALLET, amountInWei, {
      gasLimit: 100000,
      // Some wallets read metadata from the transaction
      // Note: This doesn't change on-chain behavior, but helps wallet UIs
    });
    
    console.log("⏳ Transaction sent:", tx.hash);
    
    // Wait for confirmation
    await tx.wait();
    
    console.log("✅ Payment successful!");
    return { success: true, hash: tx.hash };

  } catch (error) {
    console.error("❌ Payment failed:", error);
    return { success: false, error: error.message };
  }
};

