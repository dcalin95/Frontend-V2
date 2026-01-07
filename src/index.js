// 🧱 Polyfill pentru compatibilitate globală
import './polyfill';

// ⚛️ Core React
import React from 'react';
import ReactDOM from 'react-dom/client';

// 🎨 Stiluri globale
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './Presale/CrystalClear.css'; // 💎 Crystal clear text - NO BLUR, NO SHADOWS

// 🧩 Wrapping App
import AppWrapper from './AppWrapper';
import reportWebVitals from './reportWebVitals';

// 🚫 DISABLE ALL console.log IN PRODUCTION (Performance Optimization)
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

// 🔗 Montare aplicație în DOM
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <AppWrapper />
    </React.StrictMode>
  );
} catch (error) {
  console.error('🚨 Fatal error mounting React app:', error);
  document.body.innerHTML = `
    <div style="padding: 40px; color: #fff; background: #000; font-family: monospace; text-align: center;">
      <h1>🚨 Application Error</h1>
      <p>${error?.message || 'Unknown error'}</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px; cursor: pointer;">
        Reload Page
      </button>
    </div>
  `;
}

// 📈 Trimite date de performanță (opțional)
reportWebVitals();
