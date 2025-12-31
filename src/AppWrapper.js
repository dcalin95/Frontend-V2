// 🧩 AppWrapper – Wrapping the entire app in context providers

import React from "react";
import App from "./App";

// 🌐 Context Providers
import { WalletProvider } from "./context/WalletContext"; // EVM Provider (wagmi) - UNIFIED
import { SolanaProvider } from "./context/SolanaWalletContext"; // Solana Provider
import { ThemeProvider } from "./context/ThemeContext";
import { GeoLocationProvider } from "./context/GeoLocationContext"; // 🌍 GeoSystem
import { AuthProvider } from "./context/AuthContext"; // 🔐 Auth System
import { CellManagerProvider } from "./context/CellManagerContext"; // 📊 CellManager - Single source of truth

const AppWrapper = () => {
  return (
    <AuthProvider>
      <SolanaProvider>
        <WalletProvider>
          <GeoLocationProvider>
            <CellManagerProvider>
              <ThemeProvider>
                <App />
              </ThemeProvider>
            </CellManagerProvider>
          </GeoLocationProvider>
        </WalletProvider>
      </SolanaProvider>
    </AuthProvider>
  );
};

export default AppWrapper;
