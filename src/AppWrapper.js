// 🧩 AppWrapper – Wrapping the entire app in context providers

import React, { useEffect } from "react";
import App from "./App";

// 🌐 Context Providers
import { WalletProvider } from "./context/WalletContext"; // EVM Provider (wagmi) - UNIFIED
import { SolanaProvider } from "./context/SolanaWalletContext"; // Solana Provider
import { ThemeProvider } from "./context/ThemeContext";
import { GeoLocationProvider } from "./context/GeoLocationContext"; // 🌍 GeoSystem
import { AuthProvider } from "./context/AuthContext"; // 🔐 Auth System
import { CellManagerProvider } from "./context/CellManagerContext"; // 📊 CellManager - Single source of truth
import { DEXThemeProvider, useDEXTheme } from "./components/DEX_edu_reference/frontend/context/DEXThemeContext";

const DexGlobalThemeMount = () => {
  const { theme } = useDEXTheme();

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const allowed = ["sonnet", "claude", "gemini"];
    const next = allowed.includes(theme) ? theme : "sonnet";
    const themeClasses = ["sonnet", "claude", "gemini", "default"].map((item) => `dex-theme-${item}`);

    document.documentElement.classList.remove(...themeClasses);
    document.body.classList.remove(...themeClasses);
    document.documentElement.classList.add(`dex-theme-${next}`);
    document.body.classList.add(`dex-theme-${next}`);
    document.documentElement.setAttribute("data-dex-theme", next);
    document.body.setAttribute("data-dex-theme", next);

    return () => {
      document.documentElement.classList.remove(...themeClasses);
      document.body.classList.remove(...themeClasses);
      document.documentElement.removeAttribute("data-dex-theme");
      document.body.removeAttribute("data-dex-theme");
    };
  }, [theme]);

  return <App />;
};

const AppWrapper = () => {
  return (
    <AuthProvider>
      <SolanaProvider>
        <WalletProvider>
          <GeoLocationProvider>
            <CellManagerProvider>
              <ThemeProvider>
                <DEXThemeProvider>
                  <DexGlobalThemeMount />
                </DEXThemeProvider>
              </ThemeProvider>
            </CellManagerProvider>
          </GeoLocationProvider>
        </WalletProvider>
      </SolanaProvider>
    </AuthProvider>
  );
};

export default AppWrapper;
