import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  // PhantomWalletAdapter, // ❌ REMOVED: Phantom is auto-detected as Standard Wallet by browser extension
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
const SolanaAutoConnect = ({ children }) => {
  const { connected, publicKey, wallet } = useWallet();

  // Log only when wallet connects (not on every mount)
  useEffect(() => {
    if (connected && publicKey && wallet) {
      console.log('✅ [Solana] Wallet connected:', publicKey.toBase58());
    }
  }, [connected, publicKey, wallet]);

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

  // Configure supported Solana wallets
  // ⚠️ NOTE: Phantom is NOT included here because it's auto-detected as Standard Wallet by browser extension
  // Phantom will be automatically available through window.solana or window.phantom.solana
  const wallets = useMemo(
    () => [
      // new PhantomWalletAdapter(),  // ❌ REMOVED: Auto-detected as Standard Wallet (see warning in console)
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

