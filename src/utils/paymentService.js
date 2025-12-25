import { ethers } from 'ethers';
import { CONTRACT_MAP } from '../contract/contractMap';
import BitsABI from '../abi/BitsABI.js';

// Treasury wallet address where certificate fees are sent
export const BITS_TREASURY_WALLET = "0x4cca7bf2aef7a432d06513f7b02c2f316e21f408";

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

    // Execute Transfer
    const tx = await bitsContract.transfer(BITS_TREASURY_WALLET, amountInWei);
    
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

