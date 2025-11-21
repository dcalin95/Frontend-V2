// 🧩 AppWrapper – Wrapping the entire app in context providers

import React from "react";
import App from "./App";

// 🌐 Context Providers
import { WalletProvider } from "./context/WalletContext"; // EVM Provider (wagmi)
import { SolanaProvider } from "./context/SolanaWalletContext"; // Solana Provider
import { UnifiedWalletProvider } from "./context/UnifiedWalletContext"; // Unified Logic
import { ThemeProvider } from "./context/ThemeContext";

const AppWrapper = () => {
  return (
    <WalletProvider>
      <SolanaProvider>
        <UnifiedWalletProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </UnifiedWalletProvider>
      </SolanaProvider>
    </WalletProvider>
  );
};

export default AppWrapper;
