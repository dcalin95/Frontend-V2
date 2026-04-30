/**
 * 📦 Entry Point - React Application Entry Point
 * 
 * React application entry point pentru BitSwapDEX AI Trading Frontend
 * 
 * @module index
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import UnifiedWalletModal from '../../../components/UnifiedWalletModal/UnifiedWalletModal';
import { WalletProvider } from '../context/WalletContext.jsx';
import { SolanaProvider } from '../context/SolanaWalletContext.jsx';

// Create root și render app
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <SolanaProvider>
      <WalletProvider>
        <App />
        <UnifiedWalletModal />
      </WalletProvider>
    </SolanaProvider>
  </React.StrictMode>
);

