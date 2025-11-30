import React, { createContext, useContext, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

const SolanaContext = createContext();

export const useSolanaWallet = () => useContext(SolanaContext);

export const SolanaProvider = ({ children }) => {
  // Solana network (mainnet-beta for production)
  const network = WalletAdapterNetwork.Mainnet;
  
  // RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // Configure supported wallets (removed BackpackWalletAdapter - not available)
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <SolanaContext.Provider value={{}}>
          {children}
        </SolanaContext.Provider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaContext;

