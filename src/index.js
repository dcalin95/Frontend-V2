// 🧱 Polyfill pentru compatibilitate globală
import './polyfill';

// ⚛️ Core React
import React from 'react';
import ReactDOM from 'react-dom/client';

// 🎨 Stiluri globale
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// 🧩 Wrapping App
import AppWrapper from './AppWrapper';

// 🔧 Wallet Browser Optimization - DISABLED for desktop
// import './utils/walletBrowserDetection';

// 📊 Măsurare performanță
import reportWebVitals from './reportWebVitals';

// 🔗 Montare aplicație în DOM
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);

// 📈 Trimite date de performanță (opțional)
reportWebVitals();
