/**
 * 🚀 App Component - Main Application Component
 * 
 * Main application component pentru BitSwapDEX AI Trading Frontend:
 * - Routing
 * - Layout
 * - Error boundary
 * - Context providers
 * 
 * @module App
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import Dashboard from './pages/Dashboard';
import Strategies from './pages/Strategies';
import Signals from './pages/Signals';
import Performance from './pages/Performance';
import Execution from './pages/Execution';

// Styles
import './styles/global.css';
import './styles/components.css';
import './styles/pages.css';

// Temporary: Mock userId pentru development
// În production, va veni din authentication
const MOCK_USER_ID = process.env.REACT_APP_MOCK_USER_ID || 'user-123';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="/dashboard" 
              element={<Dashboard userId={MOCK_USER_ID} />} 
            />
            <Route 
              path="/strategies" 
              element={<Strategies userId={MOCK_USER_ID} />} 
            />
            <Route 
              path="/signals" 
              element={<Signals userId={MOCK_USER_ID} />} 
            />
            <Route 
              path="/performance" 
              element={<Performance userId={MOCK_USER_ID} />} 
            />
            <Route 
              path="/execution" 
              element={<Execution userId={MOCK_USER_ID} />} 
            />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

