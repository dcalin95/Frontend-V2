import {
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
} from "@solana/spl-token";
import { SOLANA_CONFIG } from "../../contract/solanaConfig";

// 📍 Config - MAINNET
// ✅ Remove ProjectSerum completely (timeouts / reliability issues)
// ✅ Keep primary + fallback, and freeze selection for the whole lifecycle.
// IMPORTANT: In production, NEVER use devnet/testnet for real payments even if env is misconfigured.
const isNonMainnetSolanaUrl = (u) => {
  const s = String(u || "").toLowerCase();
  return s.includes("devnet") || s.includes("testnet");
};

const envPrimary = process.env.REACT_APP_SOL_RPC_HTTP;
const envFallback = process.env.REACT_APP_SOL_RPC_HTTP_FALLBACK;
const cfgPrimary = SOLANA_CONFIG.rpcHttp || "https://api.mainnet-beta.solana.com";

const SOLANA_RPC_PRIMARY =
  (process.env.NODE_ENV === "production" && isNonMainnetSolanaUrl(envPrimary))
    ? cfgPrimary
    : (envPrimary || cfgPrimary);

const SOLANA_RPC_FALLBACK =
  (process.env.NODE_ENV === "production" && isNonMainnetSolanaUrl(envFallback))
    ? "https://rpc.ankr.com/solana"
    : (envFallback || "https://rpc.ankr.com/solana");
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // USDC mainnet mint
const RECEIVER_WALLET = new PublicKey("63u6aWZJdFd1vh6VfCya5DJkXTUEmHBbs14SiqHNt4GQ"); // adresa ta de primire USDC

// HTTP-only RPC call to avoid WebSocket issues
const rpcPost = async (endpoint, method, params = []) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });
  const data = await response.json();
  if (data?.error) throw new Error(data.error.message);
  return data.result;
};

const pickSolanaRpcEndpoint = async () => {
  const candidates = [SOLANA_RPC_PRIMARY, SOLANA_RPC_FALLBACK].filter(Boolean);
  for (const endpoint of candidates) {
    try {
      // lightweight health probe
      await rpcPost(endpoint, 'getLatestBlockhash', [{ commitment: 'processed' }]);
      console.log(`✅ [USDC-Solana] Using RPC (frozen): ${endpoint}`);
      return endpoint;
    } catch (e) {
      console.warn(`⚠️ [USDC-Solana] RPC failed: ${endpoint} - ${e?.message || e}`);
    }
  }
  throw new Error('No healthy Solana RPC endpoints available');
};

const handleUSDCOnSolanaPayment = async ({ amount, bitsToReceive, walletAddress }) => {
  try {
    console.log("🟦 Solana USDC Payment started...");
    const rpcEndpoint = await pickSolanaRpcEndpoint();

    // Development mode bypass
    if (process.env.NODE_ENV === 'development') {
      console.log("🧪 DEVELOPMENT MODE: Simulating USDC-Solana payment");
      const mockTxHash = `sim_usdc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Still send to backend for testing
      const base = process.env.REACT_APP_BACKEND_URL || '';
      await fetch(`${base}/api/payments/record-solana`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: mockTxHash,
          token: "USDC-Solana",
          amount,
          bitsToReceive,
          wallet: walletAddress,
        }),
      });

      return mockTxHash;
    }

    if (!window.solana || !window.solana.isPhantom) {
      alert("Phantom wallet not found.");
      return;
    }

    const provider = window.solana;
    await provider.connect(); // asigură-te că Phantom e conectat

    const fromWallet = provider.publicKey;

    const fromTokenAccount = await getAssociatedTokenAddress(USDC_MINT, fromWallet);
    const toTokenAccount = await getAssociatedTokenAddress(USDC_MINT, RECEIVER_WALLET);

    const tx = new Transaction().add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromWallet,
        amount * 10 ** 6 // USDC are 6 zecimale
      )
    );

    // Get latest blockhash via HTTP RPC
    const latestBlockhash = await rpcPost(rpcEndpoint, 'getLatestBlockhash', [{ commitment: 'confirmed' }]);
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = fromWallet;

    const signedTx = await provider.signTransaction(tx);
    
    // Send transaction via HTTP RPC
    const signature = await rpcPost(rpcEndpoint, 'sendRawTransaction', [
      signedTx.serialize().toString('base64'),
      { encoding: 'base64', skipPreflight: true, preflightCommitment: 'processed', maxRetries: 5 }
    ]);

    console.log("✅ USDC transfer TX:", signature);

    // ⛳ Trimite detaliile în backend (INCLUDE USD FOR LOYALTY BONUS)
    const base = process.env.REACT_APP_BACKEND_URL || '';
    
    // 🎁 USDC is stablecoin, so amount IS the USD value
    const usdInvested = amount; // USDC = 1:1 USD
    
    console.log("🎁 [USDC-Solana LOYALTY] USD investment for bonus:", usdInvested);
    
    await fetch(`${base}/api/payments/record-solana`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txHash: signature,
        token: "USDC-Solana",
        amount,
        bitsToReceive,
        wallet: walletAddress,
        // 🎁 CRITICAL: Add USD investment for cross-chain loyalty bonus processing
        usdInvested: usdInvested,
        loyaltyEligible: true,
        note: "USDC-Solana payment - requires backend cross-chain processing for AdditionalReward.sol",
      }),
    });

    return signature;
  } catch (err) {
    console.error("❌ USDC-Solana Payment failed:", err);
    alert(`USDC-Solana payment failed: ${err.message}`);
    throw err;
  }
};

export default handleUSDCOnSolanaPayment;

