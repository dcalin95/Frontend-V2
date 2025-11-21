import React, { useEffect, useState } from "react";
import { createConfig, http, useAccount, useConnect, useDisconnect, WagmiProvider } from "wagmi";
import { mainnet, bsc } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";

// ⚙️ CONFIGURARE WALLET CONNECT (Modern Setup)
// NOTĂ: În producție, obține un projectId gratuit de pe https://cloud.walletconnect.com
const projectId = "a699c0c2623f235c0373506d45f16284"; // Project ID de test (public)

const metadata = {
  name: "BitSwapDEX AI",
  description: "AI-Powered Decentralized Exchange",
  url: "https://bits-ai.io",
  icons: ["https://bits-ai.io/logo.png"]
};

const chains = [mainnet, bsc];

// Configurare Wagmi folosind helper-ul Web3Modal pentru simplitate maximă
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

// Inițializare modal Web3
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true, // Opțional
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00FFA3', // Solana Green
    '--w3m-border-radius-master': '12px'
  }
});

const queryClient = new QueryClient();

// 🧩 COMPONENTA INTERNĂ (Logica de conectare)
const WalletConnectLogic = () => {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const [statusMsg, setStatusMsg] = useState("");

  // 3. Detectare automată Mobil vs Desktop
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // 5. Salvare date după conectare
  useEffect(() => {
    if (isConnected && address) {
      saveWalletData();
    }
  }, [isConnected, address]);

  const saveWalletData = async () => {
    const walletData = {
      walletAddress: address,
      platform: isMobile ? "mobile" : "desktop",
      provider: connector?.name || "WalletConnect",
      timestamp: new Date().toISOString()
    };

    // Salvare în LocalStorage
    localStorage.setItem("modern_wallet_data", JSON.stringify(walletData));
    
    setStatusMsg(`✅ Connected! Address saved: ${address.slice(0,6)}...${address.slice(-4)}`);

    // 7. Mock Backend Call
    try {
        // e.g.: await fetch('/api/save-wallet', { method: 'POST', body: JSON.stringify(walletData) ... })
        console.log("🔥 [Backend Mock] Data sent:", walletData);
    } catch (e) {
        console.error("Backend error", e);
    }
  };

  // Opens Web3Modal (automatically handles Deep Link on mobile and QR on desktop)
  const handleConnect = async () => {
    // Web3Modal opens automatically via the internal hook of the <w3m-button /> button
    // or we can use useWeb3Modal() if we want a custom button.
    // For simplicity and modernity, we use their native component or custom button that triggers the modal.
    document.querySelector("w3m-button")?.click(); 
  };

  return (
    <div style={{
      padding: "20px",
      background: "rgba(10, 10, 20, 0.9)",
      border: "1px solid #00FFA3",
      borderRadius: "16px",
      color: "white",
      maxWidth: "400px",
      margin: "20px auto",
      textAlign: "center",
      fontFamily: "'Inter', sans-serif"
    }}>
      <h3 style={{ color: "#00FFA3", marginBottom: "15px" }}>🔥 WalletConnect v2 Test</h3>
      
      <div style={{ marginBottom: "20px", fontSize: "14px", color: "#aaa" }}>
        Detected Platform: <strong style={{ color: "white" }}>{isMobile ? "📱 Mobile" : "💻 Desktop"}</strong>
      </div>

      {!isConnected ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          {/* Official Web3Modal Button - Handles everything automatically */}
          <w3m-button />
        </div>
      ) : (
        <div>
          <div style={{ 
            background: "rgba(0, 255, 163, 0.1)", 
            padding: "10px", 
            borderRadius: "8px",
            marginBottom: "15px",
            border: "1px solid rgba(0, 255, 163, 0.3)"
          }}>
            <div style={{ fontSize: "12px", color: "#aaa" }}>Connected Address:</div>
            <div style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: "bold" }}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </div>

          <div style={{ fontSize: "12px", color: "#00FFA3", marginBottom: "15px" }}>
            {statusMsg}
          </div>

          <button 
            onClick={() => disconnect()}
            style={{
              background: "#ff4d4d",
              border: "none",
              color: "white",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

// 📦 WRAPPER (Provider Setup)
// Aceasta este componenta pe care o exporți și o folosești în App.js
const WalletTestConnect = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletConnectLogic />
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default WalletTestConnect;

