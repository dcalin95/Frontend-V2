// 🧩 AppWrapper – Wrapping the entire app in context providers

import React from "react";
import App from "./App";

// 🌐 Context Providers
import { WalletProvider } from "./context/WalletContext"; // EVM Provider (wagmi) - UNIFIED
import { SolanaProvider } from "./context/SolanaWalletContext"; // Solana Provider
import { ThemeProvider } from "./context/ThemeContext";
import { GeoLocationProvider } from "./context/GeoLocationContext"; // 🌍 GeoSystem
import { AuthProvider } from "./context/AuthContext"; // 🔐 Auth System

const AppWrapper = () => {
  return (
    <AuthProvider>
      <WalletProvider>
        <SolanaProvider>
          <GeoLocationProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </GeoLocationProvider>
        </SolanaProvider>
      </WalletProvider>
    </AuthProvider>
  );
};

export default AppWrapper;
