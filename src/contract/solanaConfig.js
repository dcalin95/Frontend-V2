// Centralized Solana configuration (single source of truth)
// Keep Solana addresses/config here, not scattered across handlers/components.

export const SOLANA_CONFIG = {
  // RPC endpoints (default: mainnet)
  rpcHttp: process.env.REACT_APP_SOL_RPC_HTTP || "https://api.mainnet-beta.solana.com",
  rpcWs: process.env.REACT_APP_SOL_RPC_WS || "wss://api.mainnet-beta.solana.com",

  // Where SOL payments are sent (your Solana treasury/destination wallet)
  // IMPORTANT: set this in frontend .env as REACT_APP_SOL_DESTINATION_WALLET for production.
  destinationWallet:
    process.env.REACT_APP_SOL_DESTINATION_WALLET ||
    // Your mainnet receive wallet
    "3phi3ycJnNDh5xndAX5u4f7qXcxwWmgTfxkVt6wgoyTe",

  // Optional: if/when you deploy a Solana program later, store its address here.
  programId: process.env.REACT_APP_SOL_PROGRAM_ID || null
};


