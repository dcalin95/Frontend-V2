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

// 🔧 KILL SWITCH: UNREGISTER ALL SERVICE WORKERS IMMEDIATELY
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('💀 Killing Service Worker:', registration);
      registration.unregister();
    }
  }).catch(err => console.log('SW cleanup failed (harmless):', err));
}

// 🔗 Montare aplicație în DOM
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);

// 📈 Trimite date de performanță (opțional)
reportWebVitals();
