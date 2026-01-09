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

// Create root și render app
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

