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
const SolanaAutoConnect = ({ children }) => {
  const { connected, publicKey, wallet } = useWallet();

  // Restore connection from localStorage on mount - DISABLED to prevent auto-connect
  // User must manually connect via the wallet modal
  useEffect(() => {
    // Auto-connect disabled - user must manually select and connect
    // This prevents Phantom from auto-connecting when user wants to use MetaMask
    console.log('ℹ️ [SolanaAutoConnect] Auto-connect disabled - user must manually connect');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Save connection state when connected - DISABLED as per security policy
  // Wallets should not be persisted in localStorage
  useEffect(() => {
    if (connected && publicKey && wallet) {
      console.log('✅ Solana wallet connected:', publicKey.toBase58());
    }
  }, [connected, publicKey, wallet]);

  return <>{children}</>;
};

export const SolanaProvider = ({ children }) => {
  // Solana network (mainnet-beta for production)
  const network = WalletAdapterNetwork.Mainnet;
  
  // RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // Configure supported Solana wallets
  // Ledger removed - requires hardware wallet connected, can be accessed through Phantom/Solflare
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new NightlyWalletAdapter(),
      new MathWalletAdapter(),
      new Coin98WalletAdapter(),
      new CloverWalletAdapter(),
      // LedgerWalletAdapter - requires hardware wallet, commented out
      // new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
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

