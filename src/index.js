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
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);

// 📈 Trimite date de performanță (opțional)
reportWebVitals();
