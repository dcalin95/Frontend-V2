import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { createWeb3Modal, useWeb3Modal } from "@web3modal/wagmi/react";
import { WagmiProvider, useAccount, useDisconnect, useBalance, useSwitchChain, useReadContract, useWalletClient } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config, projectId } from "./wagmiConfig";
import { formatEther } from "viem";
import { providers } from "ethers";
import BitsABI from '../abi/BitsABI.js';
import { CONTRACT_MAP } from '../contract/contractMap';

// Adresa Contractului BITS Token (BSC Mainnet)
const BITS_TOKEN_ADDRESS = CONTRACT_MAP.BITS_TOKEN.address;

// 🎨 Web3Modal (AppKit) Initialization - Modern Interface
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00FFA3', // Brand Color
    '--w3m-border-radius-master': '12px',
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-z-index': 99999
  }
});

const queryClient = new QueryClient();

// Create context
const WalletContext = createContext();

// Hook to use the context
export const useWallet = () => useContext(WalletContext);

// Internal component linking Wagmi to your app
const InnerWalletProvider = ({ children }) => {
  const { address, isConnected, connector, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balanceData, isError, isLoading } = useBalance({ 
    address,
    watch: true, // Watch for changes
  });
  const { switchChain } = useSwitchChain();
  const { open } = useWeb3Modal();

  // Debug logs
  console.log("🔍 [Wallet Debug] Address:", address);
  console.log("🔍 [Wallet Debug] Chain ID:", chainId);
  console.log("🔍 [Wallet Debug] Balance Loading:", isLoading);
  console.log("🔍 [Wallet Debug] Balance Error:", isError);

  // Reading BITS Token Balance (Wagmi v2)
  const { data: bitsRawBalance, error: bitsError, isLoading: bitsLoading } = useReadContract({
    address: BITS_TOKEN_ADDRESS,
    abi: BitsABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
      refetchInterval: 15000
    }
  });

  // 🚀 Hook to convert WalletClient to Ethers Signer
  function clientToSigner(client) {
    if (!client || !client.account || !client.chain || !client.transport) {
      console.warn("⚠️ [clientToSigner] Invalid client:", client);
      return null;
    }
    const { account, chain, transport } = client;
    const network = {
      chainId: chain.id,
      name: chain.name,
      ensAddress: chain.contracts?.ensRegistry?.address,
    };
    const provider = new providers.Web3Provider(transport, network);
    const signer = provider.getSigner(account.address);
    return signer;
  }

  // 🚀 Use Wallet Client to generate Signer
  const { data: walletClient } = useWalletClient({ chainId });

  const signer = useMemo(() => {
    if (!walletClient) return null;
    return clientToSigner(walletClient);
  }, [walletClient]);

  // Debug logs for BITS balance
  useEffect(() => {
    if (address) {
       console.log("🔍 [WalletContext] Reading BITS from:", BITS_TOKEN_ADDRESS);
       console.log("🔍 [WalletContext] User address:", address);
       console.log("🔍 [WalletContext] Raw BITS data:", bitsRawBalance);
       if (bitsError) console.error("❌ [WalletContext] BITS Read Error:", bitsError);
    }
  }, [bitsRawBalance, bitsError, address]);
  
  // Compatibility states for legacy code
  const [walletAddress, setWalletAddress] = useState(null);
  const [ethBalance, setEthBalance] = useState("0");
  const [nativeSymbol, setNativeSymbol] = useState("ETH"); // Simbol dinamic (BNB, ETH)
  const [bitsBalance, setBitsBalance] = useState(0); // Placeholder for now
  const [walletType, setWalletType] = useState(null);
  const [network, setNetwork] = useState(null);
  const [walletIcon, setWalletIcon] = useState(null);
  const [walletName, setWalletName] = useState(null);

  // Automatic sync: Wagmi -> Local State
  useEffect(() => {
    if (isConnected && address) {
      console.log("✅ [ModernWallet] Connected:", address);
      console.log("✅ [ModernWallet] Chain ID:", chainId);
      console.log("✅ [ModernWallet] Connector:", connector?.name);
      setWalletAddress(address);
      setWalletType(connector?.name || "WalletConnect");
      setWalletName(connector?.name || "Wallet");
      
      // Set icon (simple fallback)
      if (connector?.name?.toLowerCase().includes("metamask")) {
        setWalletIcon("https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg");
      } else if (connector?.name?.toLowerCase().includes("walletconnect")) {
        setWalletIcon("https://docs.walletconnect.com/img/walletconnect-logo.png");
      } else {
        setWalletIcon(null);
      }

      // Set network (simplified)
      if (chainId === 56) setNetwork("Binance Smart Chain");
      else if (chainId === 1) setNetwork("Ethereum");
      else setNetwork(`Chain ID: ${chainId}`);

    } else {
      setWalletAddress(null);
      setWalletType(null);
      setWalletName(null);
      setNetwork(null);
      setEthBalance("0");
    }
  }, [isConnected, address, connector, chainId]);

  // Balance Sync (Native Token - BNB/ETH)
  useEffect(() => {
    console.log("🔍 [Balance Debug] balanceData object:", balanceData);
    if (balanceData) {
      console.log("💰 [Balance Debug] Formatted:", balanceData.formatted);
      console.log("💰 [Balance Debug] Symbol:", balanceData.symbol);
      console.log("💰 [Balance Debug] Value (raw):", balanceData.value);
      if (balanceData.formatted) {
        const val = parseFloat(balanceData.formatted);
        console.log("✅ [Balance Debug] Parsed float:", val);
        setEthBalance(isNaN(val) ? "0.0000" : val.toFixed(4));
        setNativeSymbol(balanceData.symbol);
      } else {
        console.warn("⚠️ [Balance Debug] formatted is undefined/null");
      }
    } else {
      console.warn("⚠️ [Balance Debug] balanceData is null/undefined");
    }
  }, [balanceData]);

  // Balance Sync (BITS Token)
  useEffect(() => {
    if (bitsRawBalance) {
      const formattedBits = parseFloat(formatEther(bitsRawBalance)).toFixed(2);
      setBitsBalance(formattedBits);
    } else {
      setBitsBalance(0);
    }
  }, [bitsRawBalance]);

  // 🚀 Magic Function: Opens AppKit Modal
  // Replaces all legacy connection functions
  const connectWallet = async () => {
    try {
      await open();
    } catch (err) {
      console.error("Failed to open Web3Modal", err);
    }
  };

  // Compatibility functions (mapped to connectWallet)
  const connectViaMetamask = connectWallet;
  const connectViaPhantom = connectWallet;
  const connectViaWeb3Auth = connectWallet;
  const connectViaWalletConnect = connectWallet;
  const connectViaCoinbase = connectWallet;
  const connectViaRainbow = connectWallet;

  return (
    <WalletContext.Provider
      value={{
        // Properties
        walletAddress,
        isConnected,
        ethBalance,
        nativeSymbol, // Exportăm simbolul
        bitsBalance,
        walletType,
        walletName,
        walletIcon,
        network,
        provider: connector, // Expose current connector
        signer, // Adapter for ethers.js signer

        // Functions
        connectWallet,
        disconnectWallet: disconnect,
        
        // Legacy Functions (Mapped)
        connectViaMetamask,
        connectViaPhantom,
        connectViaWeb3Auth,
        connectViaWalletConnect,
        connectViaCoinbase,
        connectViaRainbow,

        // New Utility Functions
        switchNetwork: (id) => switchChain({ chainId: id }),
        chainId
      }}
    >
      {children}
      {/* Hidden button to trigger programmatic modal open */}
      <div style={{ display: 'none' }}>
        <w3m-button />
      </div>
    </WalletContext.Provider>
  );
};

export const WalletProvider = ({ children }) => {
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
