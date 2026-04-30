/**
 * ⚙️ Vite Configuration
 * 
 * Vite configuration pentru BitSwapDEX AI Trading Frontend
 * 
 * @module vite.config
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@pages': path.resolve(__dirname, './pages'),
      '@hooks': path.resolve(__dirname, './hooks'),
      '@utils': path.resolve(__dirname, './utils'),
      '@services': path.resolve(__dirname, './services'),
      '@styles': path.resolve(__dirname, './styles')
    }
  },

  server: {
    port: 5174, // Port diferit de frontend-ul principal
    open: true,
    proxy: {
      '/api': {
        // Backend-server is deployed on Render
        target: process.env.REACT_APP_BACKEND_URL || 'https://backend-server-eu.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts'],
          'utils-vendor': ['date-fns', 'lucide-react']
        }
      }
    }
  },

  define: {
    'process.env': process.env
  }
});

