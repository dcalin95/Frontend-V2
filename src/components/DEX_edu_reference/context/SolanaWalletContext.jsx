import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  NightlyWalletAdapter,
  MathWalletAdapter,
  Coin98WalletAdapter,
  CloverWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

const SolanaContext = createContext();

export const useSolanaWallet = () => useContext(SolanaContext);

// Internal component to handle auto-connect persistence
// 🛑 CRITICAL: Disabled to prevent Phantom from auto-opening
const SolanaAutoConnect = ({ children }) => {
  // 🛑 DISABLED: Do NOT use useWallet() here - it can trigger Phantom auto-connect
  // const { connected, publicKey, wallet } = useWallet();

  // 🛑 DISABLED: No auto-connect logic
  // useEffect(() => {
  //   if (connected && publicKey && wallet) {
  //     console.log('✅ [Solana] Wallet connected:', publicKey.toBase58());
  //   }
  // }, [connected, publicKey, wallet]);

  return <>{children}</>;
};

export const SolanaProvider = ({ children }) => {
  // Solana network (mainnet-beta for production)
  const network = WalletAdapterNetwork.Mainnet;
  
  // 🚀 IMPROVED: Use high-performance RPC endpoints (fallback chain)
  // Priority: Paid RPCs > Public RPCs with better rate limits
  const endpoint = useMemo(() => {
    // Try multiple endpoints for better reliability
    const endpoints = [
      'https://solana-mainnet.g.alchemy.com/v2/demo', // Alchemy (demo key - replace with your own)
      'https://api.mainnet-beta.solana.com',           // Official Solana RPC
      'https://solana-mainnet.rpc.extrnode.com',       // ExtrNode (good uptime)
      'https://rpc.ankr.com/solana',                   // Ankr (reliable)
      clusterApiUrl(network)                           // Fallback to default
    ];
    
    // Return first endpoint (you can add health checks here if needed)
    return endpoints[1]; // Using official Solana RPC for stability
  }, [network]);
  
  // 🛑 CRITICAL: Never auto-connect - prevents Phantom from opening on refresh
  // User MUST explicitly click "Connect Wallet" button
  const shouldAutoConnect = false;

  // Keep an explicit Phantom adapter so the SOL wallet modal still shows a Phantom
  // option when Standard Wallet discovery is unavailable in a browser profile.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),       // 🟣 Primary Solana wallet
      new SolflareWalletAdapter(),     // 🟠 Alternative
      new TorusWalletAdapter(),        // 🔵 Web-based
      new NightlyWalletAdapter(),      // 🌙 Mobile-friendly
      new MathWalletAdapter(),         // 🧮 Multi-chain
      new Coin98WalletAdapter(),       // 💰 Popular in Asia
      new CloverWalletAdapter(),       // 🍀 Multi-chain
    ],
    []
  );

  return (
    <ConnectionProvider 
      endpoint={endpoint}
      config={{
        commitment: 'confirmed',           // Faster than 'finalized', safer than 'processed'
        confirmTransactionInitialTimeout: 60000, // 60s timeout for tx confirmation
        wsEndpoint: undefined,             // Let it auto-derive from endpoint
      }}
    >
      <SolanaWalletProvider 
        wallets={wallets} 
        autoConnect={shouldAutoConnect}
        onError={(error) => {
          console.error('🔴 [SolanaWalletProvider] Error:', error);
          // Don't show error to user for connection rejections (code 4001)
          if (error?.code !== 4001) {
            console.error('🔴 [SolanaWalletProvider] Non-rejection error:', error.message);
          }
        }}
      >
        <SolanaAutoConnect>
          <SolanaContext.Provider value={{}}>
            {children}
          </SolanaContext.Provider>
        </SolanaAutoConnect>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaContext;

