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

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import { DexAuthProvider, useDexAuth } from './context/DexAuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Skeleton from './components/common/Skeleton';

// Lazy load pages for better code splitting. Strategies, Performance, Execution șterse (nu ≥50% utile pentru trading).
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Signals = lazy(() => import('./pages/Signals'));

// Styles
import './styles/global.css';
import './styles/components.css';
import './styles/pages.css';

/**
 * App Routes Component (wrapped with auth)
 */
function AppRoutes() {
  const { user } = useDexAuth();

  // For OTA/execution/performance APIs backend expects wallet address (user_id in ota.* tables). Prefer wallet.
  const userId = (user?.walletAddress || user?.id) ?? null;

  return (
    <Layout>
      <Suspense fallback={<Skeleton variant="page" />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Protected Routes - Require Authentication */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Dashboard userId={userId} />
              </ProtectedRoute>
            } 
          />
          <Route path="/strategies" element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="/signals" 
            element={
              <ProtectedRoute requireAuth={true}>
                <Signals userId={userId} />
              </ProtectedRoute>
            } 
          />
          <Route path="/performance" element={<Navigate to="/dashboard" replace />} />
          <Route path="/execution" element={<Navigate to="/dashboard" replace />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

/**
 * Main App Component
 */
function App() {
  return (
    <ErrorBoundary>
      <DexAuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </DexAuthProvider>
    </ErrorBoundary>
  );
}

export default App;

