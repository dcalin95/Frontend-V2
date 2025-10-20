import {
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
} from "@solana/spl-token";

// 📍 Config - MAINNET
const SOLANA_RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-api.projectserum.com",
  "https://rpc.ankr.com/solana"
];
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // USDC mainnet mint
const RECEIVER_WALLET = new PublicKey("63u6aWZJdFd1vh6VfCya5DJkXTUEmHBbs14SiqHNt4GQ"); // adresa ta de primire USDC

// HTTP-only RPC call to avoid WebSocket issues
const callSolanaRPC = async (method, params = []) => {
  for (const endpoint of SOLANA_RPC_ENDPOINTS) {
    try {
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
      if (data.error) throw new Error(data.error.message);
      return data.result;
    } catch (error) {
      console.warn(`❌ RPC ${endpoint} failed:`, error.message);
      if (endpoint === SOLANA_RPC_ENDPOINTS[SOLANA_RPC_ENDPOINTS.length - 1]) {
        throw error; // Last endpoint failed
      }
    }
  }
};

const handleUSDCOnSolanaPayment = async ({ amount, bitsToReceive, walletAddress }) => {
  try {
    console.log("🟦 Solana USDC Payment started...");

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
    const latestBlockhash = await callSolanaRPC('getLatestBlockhash');
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = fromWallet;

    const signedTx = await provider.signTransaction(tx);
    
    // Send transaction via HTTP RPC
    const signature = await callSolanaRPC('sendRawTransaction', [
      signedTx.serialize().toString('base64'),
      { encoding: 'base64' }
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

