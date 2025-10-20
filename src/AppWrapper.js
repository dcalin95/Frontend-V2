// 🧩 AppWrapper – Wrapping the entire app in context providers

import React from "react";
import App from "./App";

// 🌐 Context Providers
import { WalletProvider } from "./context/WalletContext";
import { ThemeProvider } from "./context/ThemeContext";

const AppWrapper = () => {
  return (
    <WalletProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </WalletProvider>
  );
};

export default AppWrapper;
