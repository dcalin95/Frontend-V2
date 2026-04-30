/**
 * 🚀 DEX App Component - Standalone DEX Application
 * 
 * Aplicație DEX complet separată pentru BitSwapDEX AI Trading:
 * - Propriul routing intern
 * - Propriul Layout (fără HeaderEdu/Sidebar existent)
 * - Propriul ErrorBoundary
 * - Funcționează independent de restul aplicației
 * 
 * @module DEXApp
 */

import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './common/Layout.jsx';
import { SeiWalletProvider } from './sei/context/SeiWalletContext';
import { StxWalletProvider } from './stx/context/StxWalletContext';
import { SolPairProvider } from './sol/context/SolPairContext';
import { StxPairProvider } from './stx/context/StxPairContext';
import { SeiPairProvider } from './sei/context/SeiPairContext';
import { ClobSeiMarketProvider } from './clob-sei/context/ClobSeiMarketContext';
import { useWallet } from '../../context/WalletContext';
import ErrorBoundary from './common/ErrorBoundary.jsx';
import LoadingSpinner from './common/LoadingSpinner.jsx';
import ProtectedRoute from './frontend/components/auth/ProtectedRoute';
import { DexAuthProvider } from './frontend/context/DexAuthContext';
import { ToastProvider } from './frontend/context/ToastContext';
import { OTARegistrationProvider } from './frontend/context/OTARegistrationContext';
import { HeaderTokenProvider } from './frontend/context/HeaderTokenContext';
// Import styles: design-system-v1 first (--ds-*), then global (imports design-tokens which aliases --token-* → --ds-*)
import './frontend/styles/design-system-v1.css'; // 🎨 Single source of truth for tokens
import './frontend/styles/dex-themes.css';      // 🎨 Teme globale: Sonnet / Claude
import './frontend/styles/global.css';
import './frontend/styles/components.css';
import './frontend/styles/pages.css';
import './frontend/styles/components/ota-profile-page.css'; // Profile (Sonnet-style) – load early so not overridden
import './frontend/styles/components/dex-layout-fixes.css'; // 🎯 Visual consistency fixes
import './frontend/styles/components/dex-mobile.css';        // 📱 Ecrane mici: overlay sidebar, fără overflow
import './frontend/styles/components/responsive-hardening.css'; // 📱 Responsive hardening: no overflow, tap targets, wrap

import { useDexAuth } from './frontend/context/DexAuthContext';

const DEX_BASE_PATH = '/dex-edu';

// Lazy load pages din frontend/ (scheletul complet copiat din Proiect)
const Dashboard = lazy(() => import('./frontend/pages/Dashboard'));
const Swap = lazy(() => import('./frontend/pages/Swap'));
const Trade = lazy(() =>
  import('./frontend/pages/Trade').catch(err => {
    console.error('Failed to load Trade:', err);
    const msg = err?.message || String(err);
    return { default: () => <div className="p-4 text-red-600" role="alert">Error loading Trade page. {msg}</div> };
  })
);
const Signals = lazy(() => import('./frontend/pages/Signals'));
// OTA Auth & Profile: one profile = OTAProfilePage at /dex-edu/profile (Profile.jsx is no longer used in routes).
// Unified login/register area: one page (Wallet + Email + Register + OAuth).
const chunkLoadFail = (label) => () => (
  <div className="p-4 text-amber-200 bg-black/80 rounded-lg max-w-lg mx-auto mt-8" role="alert">
    <p className="font-semibold mb-2">Could not load the "{label}" module.</p>
    <p className="text-sm text-zinc-400">
      Likely cache or an old deploy: press <kbd className="px-1 bg-zinc-800 rounded">Ctrl+F5</kbd> (reload without cache), or clear site data for the domain, then try again.
    </p>
  </div>
);
const UnifiedAuthPage = lazy(() =>
  import('./frontend/pages/UnifiedAuthPage').catch((err) => {
    console.error('UnifiedAuthPage chunk:', err);
    return { default: chunkLoadFail('login / register') };
  })
);
const OTAForgotPasswordPage = lazy(() =>
  import('./frontend/pages/OTAForgotPasswordPage').catch((err) => {
    console.error('OTAForgotPasswordPage chunk:', err);
    return { default: chunkLoadFail('forgot password') };
  })
);
const OTAResetPasswordPage = lazy(() =>
  import('./frontend/pages/OTAResetPasswordPage').catch((err) => {
    console.error('OTAResetPasswordPage chunk:', err);
    return { default: chunkLoadFail('reset password') };
  })
);
const OTAProfilePage = lazy(() => import('./frontend/pages/OTAProfilePage'));
const OTAPage = lazy(() => import('./frontend/pages/OTAPage'));
const OTASeiPage = lazy(() => import('./frontend/pages/OTASeiPage'));
const OTAStxPage = lazy(() => import('./frontend/pages/OTAStxPage'));
const OTATradePage = lazy(() => import('./frontend/pages/OTATradePage'));
const OTAChatPage = lazy(() => import('./frontend/pages/OTAChatPage'));
const RenderLogsPage = lazy(() => import('./frontend/pages/RenderLogsPage'));
const OTAShortOpsPage = lazy(() => import('./frontend/pages/OTAShortOpsPage'));
const OpenOrdersPage = lazy(() => import('./frontend/pages/OpenOrdersPage'));
const OrderHistoryPage = lazy(() => import('./frontend/pages/OrderHistoryPage'));
const LeveragePage = lazy(() => import('./frontend/pages/LeveragePage'));
const PersonalAccountPage = lazy(() => import('./frontend/pages/PersonalAccountPage'));
const TradeCostAnalyticsPage = lazy(() => import('./frontend/pages/TradeCostAnalyticsPage'));
// SEI Trade – flux separat (SeiWalletContext, fără wagmi)
const SeiLayout = lazy(() => import('./sei/SeiLayout'));
const SeiTradePage = lazy(() => import('./frontend/pages/SeiTradePage'));
const SeiSwapPage = lazy(() => import('./frontend/pages/SeiSwapPage'));
// STX Trade – flux separat (StxWalletContext, Leather/Hiro)
const StxLayout = lazy(() =>
  import('./stx/StxLayout').catch(err => {
    console.error('Failed to load StxLayout:', err);
    return { default: () => <div className="p-4 text-red-600" role="alert">Error loading STX layout. Check console.</div> };
  })
);
const StxTradePage = lazy(() => import('./frontend/pages/StxTradePage'));
const StxSwapPage = lazy(() => import('./frontend/pages/StxSwapPage'));
// SOL Trade – flux separat (WalletContext + SolanaProvider din App)
const SolLayout = lazy(() =>
  import('./sol/SolLayout').catch(err => {
    console.error('Failed to load SolLayout:', err);
    return { default: () => <div className="p-4 text-red-600" role="alert">Error loading SOL layout. Check console.</div> };
  })
);
const SolTradePage = lazy(() => import('./frontend/pages/SolTradePage'));
const SolSwapPage = lazy(() => import('./frontend/pages/SolSwapPage'));
// CLOB SEI – order book Mangrove (Oxium-style), fără contracte noi
const ClobSeiTradePage = lazy(() => import('./frontend/pages/ClobSeiTradePage'));
const SiteAdminPage = lazy(() => import('./frontend/pages/SiteAdminPage'));
const ComplaintsPage = lazy(() => import('./frontend/pages/ComplaintsPage'));

// Real user only: user?.id || user?.walletAddress from auth. When not logged in, userId is null; pages handle null.

// Loading fallback – visible on black background while content loads
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '50vh',
    background: '#000',
    color: '#a1a1aa',
    gap: 12
  }}>
    <LoadingSpinner message="Loading..." />
  </div>
);

// DEX Routes: RELATIVE paths only. In this mounted copy the inner <Routes> matches the remainder after /dex-edu/.
// (e.g. "dashboard", "ota/sei"). Full paths like path="/dex/dashboard" do NOT match and nothing renders.
function DEXRoutes() {
  const { user, walletAddress } = useDexAuth();
  /** OTA / analytics / vault: backend așteaptă adresa wallet ca userId — preferă wallet înainte de id cont. */
  const userId = (user?.walletAddress || user?.id) ?? null;
  const signalsUserId = userId || walletAddress || null;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<Navigate to={`${DEX_BASE_PATH}/dashboard`} replace />} />
        <Route path="dashboard" element={<Dashboard userId={userId || walletAddress} />} />
        <Route path="swap" element={<Swap />} />
        <Route path="trade" element={<Trade />} />
        <Route path="open-orders" element={<OpenOrdersPage />} />
        <Route path="order-history" element={<OrderHistoryPage />} />
        <Route path="account" element={<ProtectedRoute requireAuth={true} showLoginModal={true} authVariant="email"><ErrorBoundary><PersonalAccountPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="account/analytics" element={<ProtectedRoute requireAuth={true} showLoginModal={true} authVariant="email"><ErrorBoundary><TradeCostAnalyticsPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="leverage" element={<LeveragePage />} />
        <Route path="leverage/cfd" element={<LeveragePage />} />
        <Route path="strategies" element={<Navigate to={`${DEX_BASE_PATH}/dashboard`} replace />} />
        <Route path="signals" element={<Signals userId={signalsUserId} />} />
        <Route path="performance" element={<Navigate to={`${DEX_BASE_PATH}/dashboard`} replace />} />
        <Route path="execution" element={<Navigate to={`${DEX_BASE_PATH}/dashboard`} replace />} />
        {/* One profile: /dex-edu/profile = full page (OTAProfilePage); /dex-edu/ota/profile redirect */}
        <Route path="profile" element={<ProtectedRoute requireAuth={true} showLoginModal={true} authVariant="email"><ErrorBoundary><OTAProfilePage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="ota" element={<ProtectedRoute requireAuth={true} authVariant="email"><ErrorBoundary><OTAPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="ota/login" element={<UnifiedAuthPage defaultTab="login" />} />
        <Route path="ota/register" element={<UnifiedAuthPage defaultTab="register" />} />
        <Route path="ota/forgot-password" element={<OTAForgotPasswordPage />} />
        <Route path="ota/reset-password" element={<OTAResetPasswordPage />} />
        <Route path="ota/profile" element={<Navigate to={`${DEX_BASE_PATH}/profile`} replace />} />
        <Route path="ota/trade" element={<ProtectedRoute requireAuth={true} authVariant="email"><ErrorBoundary><OTATradePage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="ota/chat" element={<ProtectedRoute requireAuth={true} authVariant="email"><ErrorBoundary><OTAChatPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="ota/logs" element={<ProtectedRoute requireAuth={true} authVariant="email"><ErrorBoundary><RenderLogsPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="ota/short-ops" element={<ProtectedRoute requireAuth={true} authVariant="email"><ErrorBoundary><OTAShortOpsPage /></ErrorBoundary></ProtectedRoute>} />
        {/* Alias: bookmark-uri / linkuri vechi cu underscore */}
        <Route path="ota/short_ops" element={<Navigate to={`${DEX_BASE_PATH}/ota/short-ops`} replace />} />
        <Route path="ota/futures" element={<Navigate to={`${DEX_BASE_PATH}/ota/short-ops`} replace />} />
        <Route path="ota/sei" element={<ProtectedRoute requireAuth={true} authVariant="email"><ErrorBoundary><OTASeiPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="ota/stx" element={<ProtectedRoute requireAuth={true} authVariant="email"><ErrorBoundary><OTAStxPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="sei" element={<ErrorBoundary><SeiLayout /></ErrorBoundary>}>
          <Route index element={<Navigate to={`${DEX_BASE_PATH}/sei/trade`} replace />} />
          <Route path="trade" element={<SeiTradePage />} />
          <Route path="swap" element={<SeiSwapPage />} />
        </Route>
        <Route path="stx" element={<ErrorBoundary><StxLayout /></ErrorBoundary>}>
          <Route index element={<Navigate to={`${DEX_BASE_PATH}/stx/trade`} replace />} />
          <Route path="trade" element={<StxTradePage />} />
          <Route path="swap" element={<StxSwapPage />} />
        </Route>
        <Route path="sol" element={<ErrorBoundary><SolLayout /></ErrorBoundary>}>
          <Route index element={<Navigate to={`${DEX_BASE_PATH}/sol/trade`} replace />} />
          <Route path="trade" element={<SolTradePage />} />
          <Route path="swap" element={<SolSwapPage />} />
        </Route>
        <Route path="clob-sei" element={<ErrorBoundary><ClobSeiTradePage /></ErrorBoundary>} />
        {/* Legacy-style: open without DEX login; gate = admin password (+ optional allowlist in SiteAdminPage). */}
        <Route
          path="site-admin"
          element={
            <ProtectedRoute requireAuth={false} showLoginModal={false} authVariant="email">
              <ErrorBoundary>
                <SiteAdminPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route path="complaints" element={<ErrorBoundary><ComplaintsPage /></ErrorBoundary>} />
        <Route path="*" element={<Navigate to={`${DEX_BASE_PATH}/dashboard`} replace />} />
      </Routes>
    </Suspense>
  );
}

function DEXApp() {
  const { walletType } = useWallet() || {};
  const navigate = useNavigate();
  const location = useLocation();
  // Chain selection state: 'evm' | 'solana' | 'stacks' | 'sei'
  const [selectedChain, setSelectedChain] = useState('evm');

  // Let the imported DEX own its global visual layer while this app is mounted.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.classList.add('dex-edu-active');
    return () => {
      document.body.classList.remove('dex-edu-active');
    };
  }, []);

  // Sync selectedChain with URL: EVM / SEI / STX / SOL – 4 rețele distincte în Header
  useEffect(() => {
    const p = location.pathname || '';
    if (p.startsWith(`${DEX_BASE_PATH}/sei`) || p.startsWith(`${DEX_BASE_PATH}/clob-sei`) || p.startsWith(`${DEX_BASE_PATH}/ota/sei`)) {
      setSelectedChain('sei');
    } else if (p.startsWith(`${DEX_BASE_PATH}/stx`) || p.startsWith(`${DEX_BASE_PATH}/ota/stx`)) {
      setSelectedChain('stacks');
    } else if (p.startsWith(`${DEX_BASE_PATH}/sol`)) {
      setSelectedChain('solana');
    } else if (p.startsWith(`${DEX_BASE_PATH}/`) && !p.startsWith(`${DEX_BASE_PATH}/sei`) && !p.startsWith(`${DEX_BASE_PATH}/stx`) && !p.startsWith(`${DEX_BASE_PATH}/sol`) && !p.startsWith(`${DEX_BASE_PATH}/ota`)) {
      setSelectedChain('evm');
    }
  }, [location.pathname]);

  // Sync selectedChain with connected wallet: when user connects Solana, show SOL in header toggle
  useEffect(() => {
    if (walletType === 'SOLANA' && selectedChain !== 'solana') {
      setSelectedChain('solana');
    }
  }, [walletType]);

  const handleChainChange = (chain) => {
    setSelectedChain(chain);
    if (chain === 'sei') {
      navigate(`${DEX_BASE_PATH}/sei`);
    } else if (chain === 'stacks') {
      navigate(`${DEX_BASE_PATH}/stx`);
    } else if (chain === 'solana') {
      navigate(`${DEX_BASE_PATH}/sol`);
    } else if (chain === 'evm') {
      navigate(`${DEX_BASE_PATH}/trade`);
    }
  };

  // Chain-specific placeholder panels (Solana/Stacks/SEI) are not rendered in layout
  // to avoid raw placeholder text on dashboard. EVM content comes from DEXRoutes only.
  const renderChainComponents = () => {
    return null;
  };

  // OTA Components wrapper - must be inside DexAuthProvider
  // NOTE: OTA panels are now rendered in Dashboard only (see frontend/pages/Dashboard.jsx)

  return (
    <ErrorBoundary>
      <DexAuthProvider>
        <ToastProvider>
          <OTARegistrationProvider>
            <SeiWalletProvider>
              <StxWalletProvider>
                <SolPairProvider>
                  <StxPairProvider>
                    <SeiPairProvider>
                      <ClobSeiMarketProvider>
                        <HeaderTokenProvider>
                          <Layout selectedChain={selectedChain} onChainChange={handleChainChange}>
                            <DEXRoutes />
                          </Layout>
                        </HeaderTokenProvider>
                      </ClobSeiMarketProvider>
                    </SeiPairProvider>
                  </StxPairProvider>
                </SolPairProvider>
              </StxWalletProvider>
            </SeiWalletProvider>
          </OTARegistrationProvider>
        </ToastProvider>
      </DexAuthProvider>
    </ErrorBoundary>
  );
}

export default DEXApp;
