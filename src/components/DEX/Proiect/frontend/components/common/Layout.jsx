/**
 * 🎨 Layout Component - Main Layout pentru Frontend
 * 
 * Main layout component pentru BitSwapDEX AI Trading Frontend:
 * - Header
 * - Sidebar
 * - Main content area
 * - Responsive design
 * 
 * @module Layout
 */

/**
 * 🎨 Layout Component - Main Layout pentru Frontend
 * 
 * Main layout component pentru BitSwapDEX AI Trading Frontend:
 * - Header
 * - Sidebar
 * - Main content area
 * - Responsive design
 * 
 * @module Layout
 */

import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import '../../styles/layout.css';

const Layout = ({ children }) => {
  return (
    <div className="ai-trading-layout">
      <Header />
      <div className="ai-trading-content-wrapper">
        <Sidebar />
        <main className="ai-trading-main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

