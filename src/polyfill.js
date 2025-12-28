// src/polyfill.js
import { Buffer } from "buffer";
window.Buffer = Buffer;

// 🛡️ Global Error Handling for MetaMask/Extension runtime errors
// This prevents the annoying "Uncaught Runtime Error" overlay in development for known extension issues.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    const isMetaMaskError = msg.includes('Failed to connect to MetaMask') || 
                            msg.includes('Internal JSON-RPC error') ||
                            msg.includes('User rejected the request');
    
    if (isMetaMaskError) {
      console.warn('🛑 [Global] Caught and suppressed MetaMask extension error:', msg);
      // Prevent the error from reaching the browser's default handler (and the React error overlay)
      event.preventDefault();
      event.stopPropagation();
    }
  });

  // Catch normal errors too
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (msg.includes('Failed to connect to MetaMask')) {
      console.warn('🛑 [Global] Caught and suppressed MetaMask sync error:', msg);
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

