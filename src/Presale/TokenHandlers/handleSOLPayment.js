// src/Presale/TokenHandlers/handleSOLPayment.js

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { SOLANA_CONFIG } from "../../contract/solanaConfig";
import { getBackendUrl } from "../../utils/getBackendUrl";
import { notifyPresaleBuy } from "../../utils/telegramNotify";
import { trackTikTokEvent } from "../../utils/tiktok";

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
  // 🎨 Dispatch events for UI progress tracking
  const dispatchProgress = (stepIndex, title, details = [], error = null) => {
    window.dispatchEvent(new CustomEvent('sol-payment-progress', {
      detail: { stepIndex, title, details, error }
    }));
  };

  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║          🚀 SOL PAYMENT HANDLER v2.0 (FIXED)                  ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("📥 [INPUT PARAMS]:");
  console.log("   - amount:", amount, "SOL");
  console.log("   - bitsToReceive:", bitsToReceive);
  console.log("   - walletAddress (EVM):", walletAddress);
  console.log("   - usdInvestedFromUI:", usdInvestedFromUI);
  console.log("   - bonusAmount:", bonusAmount);
  console.log("   - bonusPercentage:", bonusPercentage);
  console.log("   - referralCode:", referralCode);
  console.log("───────────────────────────────────────────────────────────────");
  
  // RPC endpoints (primary + fallback). We DO NOT switch mid-confirm.
  // IMPORTANT: In production, NEVER use devnet/testnet for real payments even if env is misconfigured.
  const isNonMainnetSolanaUrl = (u) => {
    const s = String(u || "").toLowerCase();
    return s.includes("devnet") || s.includes("testnet");
  };

  const envPrimary = process.env.REACT_APP_SOL_RPC_HTTP;
  const envFallback = process.env.REACT_APP_SOL_RPC_HTTP_FALLBACK;
  const cfgPrimary = SOLANA_CONFIG.rpcHttp || "https://mainnet.helius-rpc.com/?api-key=e09cf31a-1745-4314-847f-0999aa459705";

  const PRIMARY_RPC =
    (process.env.NODE_ENV === "production" && isNonMainnetSolanaUrl(envPrimary))
      ? cfgPrimary
      : (envPrimary || cfgPrimary);

  const FALLBACK_RPC =
    (process.env.NODE_ENV === "production" && isNonMainnetSolanaUrl(envFallback))
      ? "https://solana-mainnet.g.alchemy.com/v2/rc1AaZiEAYjKj4SOP3tuP"
      : (envFallback || "https://solana-mainnet.g.alchemy.com/v2/rc1AaZiEAYjKj4SOP3tuP");
  
  try {
    // Audit metrics (single-line log at end)
    const audit = {
      chosenRpc: null,
      signature: null,
      blockhash: null,
      lastValidBlockHeight: null,
      commitment: "confirmed",
      sendAttempts: 0,
      confirmSeconds: 0,
      finalStatus: "unknown",
    };

    console.log("🔍 [STEP 1/10] Checking Solana wallet...");
    dispatchProgress(0, 'Checking Solana Wallet', ['Verifying Phantom wallet connection...']);

    if (!window.solana || !window.solana.isPhantom) {
      console.error("❌ Phantom Wallet not detected");
      dispatchProgress(0, 'Checking Solana Wallet', [], 'Phantom Wallet not detected. Please install Phantom extension.');
      throw new Error("⚠️ Phantom Wallet not detected.");
    }
    console.log("✅ Phantom wallet detected");

    console.log("🔍 [STEP 2/10] Connecting to Solana network...");
    dispatchProgress(1, 'Connecting to Solana Network', [
      'Using Helius Premium RPC',
      'Commitment: confirmed'
    ]);
    
    // Use PRIMARY as the transaction lifecycle RPC (send+confirm on the SAME endpoint)
    let connection = new Connection(PRIMARY_RPC, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 120000
    });
    console.log("   - Primary RPC:", PRIMARY_RPC);
    console.log("   - Fallback RPC:", FALLBACK_RPC);
    
    console.log("🔍 [STEP 3/10] Connecting Phantom wallet...");
    dispatchProgress(2, 'Connecting Phantom Wallet', ['Requesting wallet connection...']);
    
    const { publicKey } = await window.solana.connect();
    console.log("✅ Phantom connected:");
    console.log("   - Public Key:", publicKey.toBase58());
    console.log("   - Destination:", DESTINATION_WALLET.toBase58());
    
    dispatchProgress(2, 'Connecting Phantom Wallet', [
      `Your wallet: ${publicKey.toBase58().substring(0, 8)}...`,
      `Destination: ${DESTINATION_WALLET.toBase58().substring(0, 8)}...`
    ]);

    console.log("🔍 [STEP 4/10] Calculating lamports...");
    const lamports = Math.floor(amount * 1e9);
    console.log("   - Amount SOL:", amount);
    console.log("   - Lamports:", lamports);
    
    dispatchProgress(3, 'Calculating Transaction Amount', [
      `Amount: ${amount} SOL`,
      `Lamports: ${lamports.toLocaleString()}`
    ]);

    // ============================================================
    // CRITICAL: Get a FRESH *SAFE* blockhash RIGHT BEFORE signing.
    // Some RPCs can occasionally return a near-expired / stale lastValidBlockHeight.
    // We sanity-check and, if needed, switch to FALLBACK *before signing*.
    // ============================================================
    const getSafeBlockhash = async (conn, label) => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        const bh = await conn.getLatestBlockhash("processed");
        const h = await conn.getBlockHeight("processed");
        const remaining = bh.lastValidBlockHeight - h;
        console.log(`🧱 [Blockhash ${label}] attempt ${attempt}/3: current=${h} lastValid=${bh.lastValidBlockHeight} remaining=${remaining}`);
        if (remaining >= 80) return { blockhashData: bh, currentBlockHeight: h, blocksRemaining: remaining };
        // Small delay and retry (helps if RPC served stale cache)
        await new Promise((r) => setTimeout(r, 350));
      }
      throw new Error(`UNSAFE_BLOCKHASH_FROM_${label}`);
    };

    console.log("🔍 [STEP 5/10] Getting FRESH blockhash (right before signing)...");
    dispatchProgress(4, 'Getting Fresh Blockhash', ['Fetching latest blockhash...', 'Sanity-checking freshness...']);

    let blockhashData;
    let currentBlockHeight;
    let blocksRemaining;
    try {
      const res = await getSafeBlockhash(connection, "PRIMARY");
      blockhashData = res.blockhashData;
      currentBlockHeight = res.currentBlockHeight;
      blocksRemaining = res.blocksRemaining;
    } catch (e) {
      console.warn("⚠️ Primary RPC returned unsafe blockhash. Switching to FALLBACK before signing...");
      dispatchProgress(4, 'Getting Fresh Blockhash', [
        '⚠️ Primary RPC blockhash looks unsafe',
        'Switching to fallback RPC...'
      ]);
      connection = new Connection(FALLBACK_RPC, {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 120000
      });
      const res = await getSafeBlockhash(connection, "FALLBACK");
      blockhashData = res.blockhashData;
      currentBlockHeight = res.currentBlockHeight;
      blocksRemaining = res.blocksRemaining;
    }

    audit.blockhash = blockhashData.blockhash;
    audit.lastValidBlockHeight = blockhashData.lastValidBlockHeight;
    console.log("✅ Fresh blockhash obtained:");
    console.log("   - Blockhash:", blockhashData.blockhash.substring(0, 12) + "...");
    console.log("   - Last valid block height:", blockhashData.lastValidBlockHeight);
    console.log("   - Blocks remaining:", blocksRemaining);
    console.log("   - RPC used for signing lifecycle:", connection.rpcEndpoint);
    
    // Create transaction with fresh blockhash
    console.log("🔍 [STEP 6/10] Creating transaction...");
    dispatchProgress(5, 'Creating Transaction', ['Building transfer transaction...']);
    
    let tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: DESTINATION_WALLET,
        lamports,
      })
    );
    tx.feePayer = publicKey;
    tx.recentBlockhash = blockhashData.blockhash;
    
    dispatchProgress(5, 'Creating Transaction', [
      `Fee payer: ${publicKey.toBase58().substring(0, 8)}...`,
      `Blockhash: ${blockhashData.blockhash.substring(0, 12)}...`
    ]);

    // ============================================================
    // SIGNING - May take 30-60s with Ledger
    // ============================================================
    console.log("🔍 [STEP 7/10] Requesting signature from wallet...");
    console.log("⏳ Waiting for signature (this may take 30-60s with Ledger)...");
    dispatchProgress(6, 'Signing Transaction', [
      'Please approve in your wallet...',
      'This may take 30-60s with Ledger'
    ]);
    
    const signStartTime = Date.now();
    let signedTx;
    try {
      signedTx = await window.solana.signTransaction(tx);
      const signDuration = ((Date.now() - signStartTime) / 1000).toFixed(1);
      console.log(`✅ Transaction signed! (took ${signDuration}s)`);
      
      dispatchProgress(6, 'Signing Transaction', [
        `✅ Signed in ${signDuration}s`,
        'Checking blockhash validity...'
      ]);
    } catch (signError) {
      console.error("❌ Signing failed:", signError);
      dispatchProgress(6, 'Signing Transaction', [], 'User rejected or signing failed');
      throw new Error("Transaction signing was rejected or failed");
    }
    
    // ============================================================
    // CRITICAL: Check if blockhash is STILL VALID after signing
    // If signing took too long, blockhash may have expired
    // ============================================================
    console.log("🔍 [STEP 8/10] Validating blockhash after signing...");
    dispatchProgress(7, 'Validating Blockhash', ['Checking if blockhash is still valid...']);
    
    const signDurationMs = Date.now() - signStartTime;
    // currentBlockHeight/blocksRemaining already computed in getSafeBlockhash above
    
    console.log("   - Signing took:", (signDurationMs / 1000).toFixed(1), "s");
    console.log("   - Current block height:", currentBlockHeight);
    console.log("   - Last valid block height:", blockhashData.lastValidBlockHeight);
    console.log("   - Blocks remaining:", blocksRemaining);
    
    // Ledger signing can take 30-90s. Even if blocksRemaining isn't "almost zero",
    // the blockhash window may be too short to survive propagation + confirmation.
    const RESIGN_IF_SIGNING_MS_OVER = 30000; // 30s
    const RESIGN_IF_BLOCKS_BELOW = 120; // ~45-60s safety window (varies by cluster)
    const shouldResign =
      signDurationMs > RESIGN_IF_SIGNING_MS_OVER || blocksRemaining < RESIGN_IF_BLOCKS_BELOW;

    // If signing was slow OR remaining blocks are low, get fresh blockhash and re-sign.
    if (shouldResign) {
      console.warn(
        "⚠️ Blockhash may expire before confirmation. Re-signing with fresh blockhash...",
        { signDurationMs, blocksRemaining }
      );
      
      dispatchProgress(7, 'Validating Blockhash', [
        '⚠️ Blockhash may expire before confirmation',
        `Signing time: ${(signDurationMs / 1000).toFixed(1)}s`,
        `Blocks remaining: ${blocksRemaining}`,
        'Getting fresh blockhash...',
        'Please sign again in your wallet'
      ]);
      
      // Get fresh blockhash
      blockhashData = await connection.getLatestBlockhash('processed');
      audit.blockhash = blockhashData.blockhash;
      audit.lastValidBlockHeight = blockhashData.lastValidBlockHeight;
      console.log("   - NEW blockhash:", blockhashData.blockhash.substring(0, 12) + "...");
      console.log("   - NEW last valid height:", blockhashData.lastValidBlockHeight);

      // Create new transaction with fresh blockhash
      tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: DESTINATION_WALLET,
          lamports,
        })
      );
      tx.feePayer = publicKey;
      tx.recentBlockhash = blockhashData.blockhash;
      
      // Request signature again
      console.log("⏳ Requesting RE-SIGNATURE with fresh blockhash...");
      const resignStartTime = Date.now();
      
      try {
        signedTx = await window.solana.signTransaction(tx);
        const resignDuration = ((Date.now() - resignStartTime) / 1000).toFixed(1);
        console.log(`✅ RE-SIGNED successfully! (took ${resignDuration}s)`);
        
        dispatchProgress(7, 'Validating Blockhash', [
          `✅ Re-signed in ${resignDuration}s`,
          'Ready with fresh blockhash'
        ]);
      } catch (resignError) {
        console.error("❌ Re-signing failed:", resignError);
        dispatchProgress(7, 'Validating Blockhash', [], 'Re-signing failed');
        throw new Error("Re-signing with fresh blockhash failed");
      }
    } else {
      console.log("✅ Blockhash still valid with", blocksRemaining, "blocks remaining");
      dispatchProgress(7, 'Validating Blockhash', [
        '✅ Blockhash valid',
        `${blocksRemaining} blocks remaining`
      ]);
    }

    // ============================================================
    // BROADCAST - Send via ONE chosen RPC endpoint.
    // If primary send fails, fallback is used, and confirmation will stay on fallback.
    // ============================================================
    console.log("🔍 [STEP 9/10] Broadcasting transaction...");
    dispatchProgress(8, 'Broadcasting Transaction', [
      'Sending transaction...',
      'Skip preflight: enabled'
    ]);
    
    const rawTx = signedTx.serialize();
    console.log("   - Raw TX size:", rawTx.length, "bytes");
    
    let signature;
    let txRpcUrl = PRIMARY_RPC;
    let txConnection = connection;
    const txCommitment = "confirmed";

    // Safer send strategy:
    // - Attempt #1 with preflight (better diagnostics)
    // - If simulation fails / node rejects preflight, retry with skipPreflight=true
    const sendWithStrategy = async (conn, raw) => {
      // Attempt #1: preflight ON (skipPreflight false)
      audit.sendAttempts += 1;
      try {
        return await conn.sendRawTransaction(raw, {
          skipPreflight: false,
          preflightCommitment: 'processed',
          maxRetries: 3
        });
      } catch (e1) {
        const msg = String(e1?.message || e1);
        // Retry #2: skip preflight (Ledger compatibility / flaky simulations)
        audit.sendAttempts += 1;
        if (/simulation failed|blockhash not found|preflight/i.test(msg)) {
          return await conn.sendRawTransaction(raw, {
            skipPreflight: true,
            preflightCommitment: 'processed',
            maxRetries: 5
          });
        }
        throw e1;
      }
    };

    try {
      console.log("📡 Broadcasting via PRIMARY RPC...");
      signature = await sendWithStrategy(txConnection, rawTx);
      console.log("✅ Broadcast successful (PRIMARY). Signature:", signature);
    } catch (primaryErr) {
      console.warn("⚠️ PRIMARY broadcast failed:", primaryErr?.message || primaryErr);
      console.warn("📡 Retrying broadcast via FALLBACK RPC (and freezing lifecycle to fallback)...");

      txRpcUrl = FALLBACK_RPC;
      txConnection = new Connection(FALLBACK_RPC, {
        commitment: txCommitment,
        confirmTransactionInitialTimeout: 120000
      });

      try {
        signature = await sendWithStrategy(txConnection, rawTx);
        console.log("✅ Broadcast successful (FALLBACK). Signature:", signature);
      } catch (fallbackErr) {
        console.error("❌ Broadcast failed on both PRIMARY and FALLBACK");
        dispatchProgress(8, 'Broadcasting Transaction', [], `Failed to broadcast: ${fallbackErr?.message || fallbackErr}`);
        throw new Error(`Failed to broadcast transaction: ${fallbackErr?.message || fallbackErr}`);
      }
    }

    audit.chosenRpc = txRpcUrl;
    audit.signature = signature;

    console.log("🧾 [TX DEBUG] RPC (frozen):", txRpcUrl);
    console.log("🧾 [TX DEBUG] signature:", signature);
    console.log("🧾 [TX DEBUG] blockhash:", blockhashData.blockhash);
    console.log("🧾 [TX DEBUG] lastValidBlockHeight:", blockhashData.lastValidBlockHeight);
    console.log("🧾 [TX DEBUG] commitment:", txCommitment);
    
    console.log("✅ ✅ ✅ BROADCAST SUCCESSFUL! ✅ ✅ ✅");
    console.log("   - Signature:", signature);
    console.log("   - 🌐 View on Solscan: https://solscan.io/tx/" + signature);
    
    dispatchProgress(8, 'Broadcasting Transaction', [
      `✅ Broadcast successful!`,
      `Signature: ${signature.substring(0, 12)}...`,
      `View on Solscan ↗`
    ]);

    // ============================================================
    // CONFIRM (deterministic):
    // - Confirm using the SAME RPC used for send (txConnection).
    // - Use blockhash + lastValidBlockHeight.
    // - Timeout 180s.
    // ============================================================
    console.log("🔍 [STEP 10/10] Confirming transaction...");
    dispatchProgress(9, 'Confirming Transaction', [
      'Checking transaction status...',
      `RPC: ${txRpcUrl.substring(0, 40)}...`,
      'Mode: single-RPC confirm (frozen)'
    ]);
    
    let transactionConfirmed = false;
    const confirmStart = Date.now();
    const confirmTimeoutMs = 180000; // 180 seconds max
    let pollCount = 0;
    let txExistsOnChain = false;

    // Status checks: allow multiple RPCs for faster visibility, but DO NOT switch the send/confirm lifecycle RPC.
    // This only queries signature status elsewhere for better UX/reliability.
    const STATUS_RPCS = Array.from(
      new Set([txRpcUrl, PRIMARY_RPC, FALLBACK_RPC].filter(Boolean))
    );
    const statusConnections = new Map();
    const getStatusConnection = (rpcUrl) => {
      if (!statusConnections.has(rpcUrl)) {
        statusConnections.set(
          rpcUrl,
          new Connection(rpcUrl, {
            commitment: txCommitment,
            confirmTransactionInitialTimeout: 120000,
          })
        );
      }
      return statusConnections.get(rpcUrl);
    };

    const raceSignatureStatus = async () => {
      // Promise.any needs at least 1 promise; STATUS_RPCS is always >= 1 due to txRpcUrl
      return await Promise.any(
        STATUS_RPCS.map(async (rpcUrl) => {
          const conn = getStatusConnection(rpcUrl);
          const res = await conn.getSignatureStatuses([signature], {
            searchTransactionHistory: true,
          });
          return { rpcUrl, status: res?.value?.[0] || null };
        })
      );
    };

    // Rebroadcast: helps when tx is valid but not propagating quickly.
    const rebroadcast = async (reason = "periodic") => {
      try {
        console.log(`📣 Rebroadcasting raw TX (${reason}) on frozen RPC...`);
        // Use skipPreflight for rebroadcast to maximize propagation odds.
        await txConnection.sendRawTransaction(rawTx, {
          skipPreflight: true,
          preflightCommitment: "processed",
          maxRetries: 3,
        });
    } catch (e) {
        console.warn("⚠️ Rebroadcast failed (non-fatal):", e?.message || e);
      }
    };
    
    // Quick check: does tx exist (race across RPCs for faster visibility)?
    console.log("🔎 Quick check (multi-RPC): does transaction exist?");
    for (let quickCheck = 0; quickCheck < 5; quickCheck++) {
      try {
        const { rpcUrl, status } = await raceSignatureStatus();
        
        if (status) {
          console.log("✅ Transaction EXISTS on-chain! Status:", status.confirmationStatus, "RPC:", rpcUrl);
          txExistsOnChain = true;
          
          if (status.confirmationStatus === "processed" || 
              status.confirmationStatus === "confirmed" || 
              status.confirmationStatus === "finalized") {
            transactionConfirmed = true;
            console.log("🎉 Already confirmed!");
          }
          break;
        }
        
        console.log(`   Quick check ${quickCheck + 1}/5: not found yet, waiting 2s...`);
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.warn("   Quick check error:", e?.message || e);
      }
    }
    
    if (!txExistsOnChain) {
      // Do NOT hard-fail here: propagation can be slow even when the tx is valid.
      // We'll continue polling until timeout or blockhash expiry.
      console.warn("⚠️ Transaction not visible yet after 10s on chosen RPC; continuing polling...");
      dispatchProgress(9, 'Confirming Transaction', [
        '⚠️ Not visible yet on RPC',
        'Continuing to poll...'
      ]);
    }

    // First, attempt confirmTransaction on the SAME RPC (may throw; we still keep polling on same RPC).
    try {
      console.log("📡 confirmTransaction() (same RPC)...");
      await txConnection.confirmTransaction(
        { signature, blockhash: blockhashData.blockhash, lastValidBlockHeight: blockhashData.lastValidBlockHeight },
        "confirmed"
      );
      console.log("ℹ️ confirmTransaction finished (status may still be pending); continuing with polling.");
    } catch (e) {
      console.warn("⚠️ confirmTransaction error (will continue polling):", e?.message || e);
    }

    // POLLING: Wait for confirmation until timeout or expiry.
    // - Status is queried across multiple RPCs (read-only).
    // - Expiry is checked on the frozen lifecycle RPC.
    // - Rebroadcast periodically if not visible/confirmed.
    while (!transactionConfirmed && (Date.now() - confirmStart) < confirmTimeoutMs) {
      pollCount++;
      const elapsed = Math.floor((Date.now() - confirmStart) / 1000);
      
      try {
        const { rpcUrl: statusRpcUrl, status } = await raceSignatureStatus();

        // Detect expiry explicitly for actionable errors
        try {
          const bh = await txConnection.getBlockHeight("processed");
          if (bh > blockhashData.lastValidBlockHeight) {
            throw new Error(`BLOCKHASH_EXPIRED: currentBlockHeight=${bh} > lastValidBlockHeight=${blockhashData.lastValidBlockHeight}`);
          }
        } catch (bhErr) {
          const msg = String(bhErr?.message || bhErr);
          if (msg.startsWith("BLOCKHASH_EXPIRED")) throw bhErr;
        }
        
        console.log(`🔍 [Poll #${pollCount} at ${elapsed}s] Status:`, status?.confirmationStatus || 'pending');
        
        dispatchProgress(9, 'Confirming Transaction', [
          `Polling... (${elapsed}s)`,
          `RPC (send frozen): ${txRpcUrl.includes('alchemy') ? 'Alchemy' : 'Primary'}`,
          `RPC (status): ${statusRpcUrl.includes('alchemy') ? 'Alchemy' : (statusRpcUrl.includes('helius') ? 'Helius' : 'Other')}`,
          `Status: ${status?.confirmationStatus || 'pending'}`,
          `Poll #${pollCount}`
        ]);

        // If still not visible/confirmed, rebroadcast every ~10s (5 polls * 2s)
        if (pollCount % 5 === 0 && (!status || !status.confirmationStatus)) {
          await rebroadcast(`poll#${pollCount}`);
        }
        
        if (status?.confirmationStatus === "processed" || 
            status?.confirmationStatus === "confirmed" || 
            status?.confirmationStatus === "finalized") {
          console.log("✅ ✅ ✅ TRANSACTION CONFIRMED! ✅ ✅ ✅");
          console.log(`   - Level: ${status.confirmationStatus}`);
          console.log(`   - Confirmed after ${elapsed}s`);
          transactionConfirmed = true;
          audit.finalStatus = status.confirmationStatus;
          
          dispatchProgress(9, 'Confirming Transaction', [
            '✅ Transaction confirmed!',
            `Level: ${status.confirmationStatus}`,
            `Time: ${elapsed}s`
          ]);
          break;
    }
    
        if (status?.err) {
          console.error("❌ Transaction FAILED on-chain:", JSON.stringify(status.err));
          dispatchProgress(9, 'Confirming Transaction', [], `Transaction failed: ${JSON.stringify(status.err)}`);
          audit.finalStatus = "failed";
          throw new Error(`Transaction failed on-chain: ${JSON.stringify(status.err)}`);
        }
        
      } catch (pollError) {
        const msg = String(pollError?.message || pollError);
        if (msg.startsWith("BLOCKHASH_EXPIRED")) {
          dispatchProgress(9, 'Confirming Transaction', [], `Transaction expired (blockhash): ${msg}`);
          audit.finalStatus = "blockhash_expired";
          throw new Error(`Transaction expired (blockhash). Please retry payment. ${msg}`);
        }
        if (pollError.message.includes("failed on-chain")) {
          throw pollError;
        }
        console.warn(`⚠️ Poll error:`, pollError.message);
      }
      
      await new Promise(r => setTimeout(r, 2000));
    }
    
    if (!transactionConfirmed) {
      console.error("❌ Confirmation timeout after 180 seconds");
      console.error("   Transaction exists but not yet confirmed.");
      console.error("   Check Solscan: https://solscan.io/tx/" + signature);
      
      dispatchProgress(9, 'Confirming Transaction', [], 
        `Timeout waiting for confirmation. Check Solscan: https://solscan.io/tx/${signature}`);
      
      audit.finalStatus = "timeout";
      throw new Error(`Confirmation timeout. Check Solscan: https://solscan.io/tx/${signature}`);
    }

    audit.confirmSeconds = Math.round((Date.now() - confirmStart) / 1000);
    // Single-line audit log (copy/paste friendly)
    console.log(
      `[SOL_TX_AUDIT] chosenRpc=${audit.chosenRpc} signature=${audit.signature} blockhash=${audit.blockhash} lastValidBlockHeight=${audit.lastValidBlockHeight} commitment=${audit.commitment} sendAttempts=${audit.sendAttempts} confirmSeconds=${audit.confirmSeconds} finalStatus=${audit.finalStatus}`
    );

    // ============================================================
    // SUCCESS - Save to backend and localStorage
    // ============================================================
    console.log("╔════════════════════════════════════════════════════════════════╗");
    console.log("║          ✅ SOL PAYMENT COMPLETED SUCCESSFULLY               ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");
    
    // Dispatch success event
    window.dispatchEvent(new CustomEvent('sol-payment-success', {
      detail: { signature, amount, bitsToReceive }
    }));
    
    // 🎯 TikTok CompletePayment event - SOL payment successful
    const usdValue = usdInvestedFromUI || (amount * 150); // Fallback: ~$150 per SOL if not provided
    trackTikTokEvent('CompletePayment', {
      content_type: 'product',
      content_name: 'BITS Token Purchase',
      payment_method: 'SOL',
      value: Math.round(usdValue),
      currency: 'USD',
      }, { retry: true, walletAddress: walletAddress });
    
    // Save to localStorage
    try {
      const historyKey = 'presale_sol_tx_history';
      const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
      existing.push({
        signature,
        amount,
        bitsToReceive,
        walletAddress,
        timestamp: new Date().toISOString(),
        status: 'confirmed'
      });
      localStorage.setItem(historyKey, JSON.stringify(existing.slice(-50)));
      console.log("✅ Saved to localStorage");
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
    
    // Send to backend
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/solana/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: signature,                    // Backend expects "signature"
          solanaFrom: publicKey.toBase58(),       // Backend expects "solanaFrom"
          userWallet: walletAddress,              // Backend expects "userWallet" (EVM)
          amount: amount,                         // Backend expects "amount"
          bitsReceived: bitsToReceive,            // Backend expects "bitsReceived"
          usdInvested: usdInvestedFromUI,         // Backend expects "usdInvested"
          bonusPercentage: bonusPercentage,
          bonusBits: bonusAmount,                 // Backend expects "bonusBits"
          referralCode: referralCode
        })
    });

    if (response.ok) {
        console.log("✅ Saved to backend");
    } else {
        console.warn("⚠️ Backend returned:", response.status);
      }
    } catch (e) {
      console.warn("Could not save to backend:", e);
    }
    
    // 📢 TELEGRAM NOTIFICATION - Send to Telegram group
    try {
      await notifyPresaleBuy({
        wallet: publicKey.toBase58(), // Primary wallet (Solana - where payment came from)
        solanaWallet: publicKey.toBase58(), // Solana wallet (payment source)
        evmWallet: walletAddress, // EVM wallet (BITS delivery destination)
        bits: parseFloat(bitsToReceive).toFixed(2),
        usd: Math.round(usdInvestedFromUI),
        network: 'Solana',
        txHash: signature
      });
      console.log("✅ Telegram notification sent");
    } catch (e) {
      console.warn("Could not send Telegram notification:", e);
    }

    return {
      success: true,
      txHash: signature,
      signature,
      amount,
      bitsToReceive,
      explorerUrl: `https://solscan.io/tx/${signature}`
    };
    
    } catch (error) {
    // Best-effort audit log on failure too
    console.log(`[SOL_TX_AUDIT] finalStatus=error message=${error?.message || 'unknown'}`);
    console.error("╔════════════════════════════════════════════════════════════════╗");
    console.error("║          ❌ SOL PAYMENT FAILED                                ║");
    console.error("╚════════════════════════════════════════════════════════════════╝");
    console.error("   - Error:", error.message);
    
    // Dispatch error event
    window.dispatchEvent(new CustomEvent('sol-payment-error', {
      detail: { error: error.message }
    }));
    
    throw error;
  }
};

export default handleSOLPayment;
