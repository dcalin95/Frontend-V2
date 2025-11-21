import React, { createContext, useContext, useState, useEffect } from "react";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { WagmiProvider, useAccount, useDisconnect, useBalance, useSwitchChain } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config, projectId, chains } from "./wagmiConfig";
import { formatEther } from "viem";

// Inițializare Web3Modal (AppKit)
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00FFA3',
    '--w3m-border-radius-master': '12px',
    '--w3m-font-family': 'Inter, sans-serif'
  }
});

const queryClient = new QueryClient();

// Contextul nostru (pentru a păstra compatibilitatea cu restul aplicației)
const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

// Componenta internă care are acces la hook-urile Wagmi
const InnerWalletProvider = ({ children }) => {
  const { address, isConnected, connector, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({ address });
  const { switchChain } = useSwitchChain();
  
  // State-uri compatibile cu vechea implementare
  const [walletAddress, setWalletAddress] = useState(null);
  const [ethBalance, setEthBalance] = useState("0");
  const [walletType, setWalletType] = useState(null);
  const [network, setNetwork] = useState(null);

  // Sincronizare Wagmi -> State Local (pentru compatibilitate)
  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
      setWalletType(connector?.name || "WalletConnect");
      setNetwork(chainId === 56 ? "Binance Smart Chain" : "Ethereum"); // Simplificat
    } else {
      setWalletAddress(null);
      setWalletType(null);
      setNetwork(null);
    }
  }, [isConnected, address, connector, chainId]);

  useEffect(() => {
    if (balanceData) {
      setEthBalance(parseFloat(balanceData.formatted).toFixed(4));
    }
  }, [balanceData]);

  // Funcția "connectWallet" acum doar deschide modalul AppKit
  const connectWallet = () => {
    // Deschide modalul oficial
    const modal = document.querySelector('w3m-button');
    if (modal) {
        modal.click();
    } else {
        // Fallback: folosim hook-ul useWeb3Modal dacă am avea acces la el aici, 
        // dar w3m-button este cea mai sigură metodă fără extra imports
        document.dispatchEvent(new CustomEvent('w3m_open')); 
        // Sau pur și simplu cerem userului să apese butonul din UI
        import("@web3modal/wagmi/react").then(({ useWeb3Modal }) => {
             // Nu putem folosi hook-uri condițional, deci ne bazăm pe butonul din UI
             // sau pe faptul că userul va interacționa cu elementele native
        });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <WalletContext.Provider
      value={{
        // Valori
        walletAddress,
        isConnected,
        ethBalance,
        walletType,
        network,
        provider: connector, // Wagmi connector

        // Funcții (Compatibilitate)
        connectWallet, // Acum deschide modalul
        disconnectWallet: handleDisconnect,
        
        // Funcții specifice vechi (mapate la noul flow)
        connectViaMetamask: connectWallet, 
        connectViaPhantom: connectWallet,
        connectViaWeb3Auth: connectWallet,
        connectViaWalletConnect: connectWallet,
        
        // Extra Wagmi
        switchNetwork: (chainId) => switchChain({ chainId }),
        chainId
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Provider-ul principal care învelește aplicația
export const ModernWalletProvider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <InnerWalletProvider>
          {children}
        </InnerWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default WalletContext;

