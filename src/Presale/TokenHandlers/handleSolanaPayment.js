import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
/* global BigInt */


import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";

// Devnet info
const SOLANA_RPC = process.env.REACT_APP_SOL_RPC_HTTP || "https://api.devnet.solana.com";
const SOLANA_WS = process.env.REACT_APP_SOL_RPC_WS || "wss://api.devnet.solana.com";
const USDC_MINT = new PublicKey("HBUpnm43PjQdWJoFFLeUWbG8raduosdkmz8tg1C4mvGT");
const DESTINATION_WALLET = new PublicKey("63u6aWZJdFd1vh6VfCya5DJkXTUEmHBbs14SiqHNt4GQ");

const handleUSDCOnSolanaPayment = async ({
  amount,
  bitsToReceive,
  walletAddress,
}) => {
  try {
    console.log("💳 USDC (SPL) transfer started...");

    if (!window.solana || !window.solana.isPhantom) {
      throw new Error("Phantom wallet is not available.");
    }

    const connection = new Connection(SOLANA_RPC, { commitment: "confirmed", wsEndpoint: SOLANA_WS });
    const { publicKey } = await window.solana.connect();

    const fromATA = await getAssociatedTokenAddress(
      USDC_MINT,
      publicKey
    );

    const toATA = await getAssociatedTokenAddress(
      USDC_MINT,
      DESTINATION_WALLET
    );

    const decimals = 9; // ← conform tokenului tău
    const amountInUnits = BigInt(Math.floor(amount * 10 ** decimals)); // safe conversion

    const tx = new Transaction().add(
      createTransferInstruction(
        fromATA,
        toATA,
        publicKey,
        amountInUnits,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    tx.feePayer = publicKey;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    const signed = await window.solana.signTransaction(tx);
    const raw = signed.serialize();
    const sig = await connection.sendRawTransaction(raw, { skipPreflight: false, maxRetries: 5 });
    try {
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
    } catch (e) {
      const start = Date.now();
      const timeoutMs = 90000;
      while (Date.now() - start < timeoutMs) {
        const st = await connection.getSignatureStatuses([sig]);
        const status = st?.value?.[0];
        if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") break;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    console.log("✅ USDC Transfer TX:", sig);

    // 🔁 Trimite la backend (INCLUDE USD FOR LOYALTY BONUS)
    const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
    
    // 🎁 USDC is stablecoin, so amount IS the USD value  
    const usdInvested = amount; // USDC = 1:1 USD
    
    console.log("🎁 [USDC-Solana LOYALTY] USD investment for bonus:", usdInvested);
    
    await fetch(`${backendURL}/api/solana/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txHash: sig,
        amount,
        from: publicKey.toBase58(),
        to: DESTINATION_WALLET.toBase58(),
        bitsToReceive,
        type: "USDC-Solana",
        network: "Solana",
        // 🎁 CRITICAL: Add USD investment for cross-chain loyalty bonus processing
        usdInvested: usdInvested,
        loyaltyEligible: true,
        note: "USDC-Solana payment - requires backend cross-chain processing for AdditionalReward.sol",
      }),
    });

    return sig;
  } catch (err) {
    console.error("❌ USDC on Solana error:", err);
    alert("USDC payment failed: " + err.message);
    throw err;
  }
};

export default handleUSDCOnSolanaPayment;
