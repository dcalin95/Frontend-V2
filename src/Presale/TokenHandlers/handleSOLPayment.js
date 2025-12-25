// src/Presale/TokenHandlers/handleSOLPayment.js

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { SOLANA_CONFIG } from "../../contract/solanaConfig";
import { getBackendUrl } from "../../utils/getBackendUrl";

const SOLANA_NETWORK = SOLANA_CONFIG.rpcHttp;
const SOLANA_WS = SOLANA_CONFIG.rpcWs;
const DESTINATION_WALLET = new PublicKey(SOLANA_CONFIG.destinationWallet);

const handleSOLPayment = async ({
  amount,
  bitsToReceive,
  walletAddress,
  referralCode,
  usdInvested: usdInvestedFromUI,
  bonusAmount,
  bonusPercentage,
}) => {
  try {
    console.log("🟣 [handleSOLPayment] Start SOL payment...");

    if (!window.solana || !window.solana.isPhantom) {
      throw new Error("⚠️ Phantom Wallet not detected.");
    }

    // 🔥 Conectăm Phantom (dacă nu e conectat deja)
    const connection = new Connection(SOLANA_NETWORK, { commitment: "confirmed", wsEndpoint: SOLANA_WS });
    const { publicKey } = await window.solana.connect();
    console.log("👛 Phantom publicKey:", publicKey.toBase58());

    // 🔥 Calculăm suma în lamports (1 SOL = 10^9 lamports)
    const lamports = Math.floor(amount * 1e9);
    console.log("💸 Lamports to send:", lamports);

    // 🔥 Creăm tranzacția de transfer
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: DESTINATION_WALLET,
        lamports,
      })
    );

    tx.feePayer = publicKey;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    // 🔥 Semnăm tranzacția
    const signedTx = await window.solana.signTransaction(tx);
    console.log("✍️ Transaction signed");

    // 🔥 Trimitem tranzacția pe rețea (cu retry & fără skipPreflight)
    const rawTx = signedTx.serialize();
    const signature = await connection.sendRawTransaction(rawTx, { skipPreflight: false, maxRetries: 5 });
    console.log("📤 Transaction submitted:", signature);

    // 🔥 Confirmare robustă (noua semnătură confirmTransaction + fallback polling)
    try {
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
      console.log("✅ Transaction confirmed on chain:", signature);
    } catch (e) {
      console.warn("⏳ confirmTransaction timed out, falling back to polling statuses...");
      const start = Date.now();
      const timeoutMs = 90000; // 90s fallback
      while (Date.now() - start < timeoutMs) {
        const st = await connection.getSignatureStatuses([signature]);
        const status = st?.value?.[0];
        if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
          console.log("✅ Transaction confirmed via polling:", signature);
          break;
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // 🔥 Trimitem informația către backend (INCLUDE USD FOR LOYALTY BONUS)
    const backendURL = getBackendUrl();
    
    // Prefer USD computed in UI (same basis as BNB flow), fallback to CoinGecko if missing.
    let usdInvested = Number(usdInvestedFromUI);
    if (!Number.isFinite(usdInvested) || usdInvested <= 0) {
      let estimatedSOLPrice = 150;
      try {
        const coingecko = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        if (coingecko.ok) {
          const data = await coingecko.json();
          const live = Number(data?.solana?.usd);
          if (Number.isFinite(live) && live > 0) estimatedSOLPrice = live;
        }
      } catch (e) {
        console.warn('⚠️ [handleSOLPayment] Could not fetch SOL price from CoinGecko, using fallback 150 USD');
      }
      usdInvested = amount * estimatedSOLPrice;
    }
    
    console.log("🎁 [SOL LOYALTY] Estimated USD investment for bonus:", usdInvested);
    
    // ✅ IMPORTANT:
    // - walletAddress = user BSC/EVM wallet (0x...) where BITS should be delivered / referral should be attributed
    // - publicKey = user Solana wallet (sender) used only as proof-of-payment
    const response = await fetch(`${backendURL}/api/solana/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // 🚀 Use EVM wallet as the "userWallet" so backend can attribute & (optionally) fulfil on BSC
        userWallet: walletAddress,
        // 🟣 Keep Solana sender for audit/debug (backend should store if it supports it)
        solanaFrom: publicKey.toBase58(),
        amount,
        bitsReceived: Number(bitsToReceive),
        signature,
        type: "buy_bits",
        network: "Solana",
        bonusPercentage: Number.isFinite(Number(bonusPercentage)) ? Number(bonusPercentage) : 0,
        bonusBits: Number.isFinite(Number(bonusAmount)) ? Number(bonusAmount) : 0,
        // 🎯 Referral support (invite rewards)
        referralCode: referralCode || null,
        // ✅ Backend now does automatic fulfilment (verify SOL tx on-chain + send BITS from treasury)
        // 🎁 CRITICAL: Add USD investment for cross-chain loyalty bonus processing
        usdInvested: usdInvested,
        loyaltyEligible: true,
        note: "SOL payment - requires backend cross-chain processing for AdditionalReward.sol",
      }),
    });

    if (response.ok) {
      console.log("💾 Transaction saved to backend successfully.");
    } else {
      console.warn("⚠️ Failed to save transaction to backend.");
    }

    return signature;
  } catch (err) {
    console.error("❌ [handleSOLPayment] Error:", err);
    alert("❌ SOL payment failed: " + err.message);
    throw err;
  }
};

export default handleSOLPayment;
