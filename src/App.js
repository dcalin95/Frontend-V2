// 🌍 Global styles (must be first)
import "react-toastify/dist/ReactToastify.css";
import "./styles/GlobalStyles.css";
import "./toastStyle.css";

// 📚 Bitcoin Academy CSS - Imported here to avoid chunk loading issues
import "./components/BitcoinAcademy/BitcoinAcademy.css";
import "./components/BitcoinAcademy/BitcoinAcademy.mobile.css";
import "./components/BitcoinAcademy/pages/ProofOfTransfer.css";
import "./components/DEX_edu_reference/frontend/styles/design-system-v1.css";
import "./components/DEX_edu_reference/frontend/styles/dex-themes.css";
import "./components/DEX_edu_reference/frontend/styles/global.css";
import "./components/DEX_edu_reference/frontend/styles/components.css";
import "./components/DEX_edu_reference/frontend/styles/pages.css";
import "./styles/DEX/header.css";
 

// 🧠 Core React
import React, { useState, Suspense, lazy, useEffect } from "react";
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom"; // HashRouter for S3/CloudFront compatibility
import { ToastContainer } from "react-toastify";

// 🧩 Layout & UI
import Header from "./components/Header";
import Footer from "./components/Footer";
import BoostedBanner from "./components/BoostedBanner";
import HeaderWalletInfo from "./context/HeaderWalletInfo";
import StarfieldBackground from "./components/StarfieldBackground";
import SmartWalletModal from "./components/SmartWalletModal";
// import CustomCursor from "./components/CustomCursor"; // 🚫 DISABLED - Performance optimization
import ErrorBoundary from "./components/ErrorBoundary";
import SidebarMenu from "./SidebarMenu/SidebarMenu";
import InstallAppModal from "./components/PWA/InstallAppModal"; // 🚀 PWA Install Prompt
import HamburgerButton from "./HamburgerButton/HamburgerButton";
import ThemeChecker from "./components/ThemeChecker";
import GlobalPresaleCopilot from "./components/GlobalPresaleCopilot";
import MobileTelegramButton from "./components/MobileTelegramButton"; // 📱 Mobile-only Telegram button
import ScrollToTop from "./components/ScrollToTop"; // ✅ Scroll to top on navigation
import USBlocker from "./components/USBlock/USBlocker"; // 🚫 US Geo-Blocking
import USBlockedPage from "./components/USBlock/USBlockedPage"; // 🚫 US Blocked Page
import GeoNoticeBanner from "./components/GeoNoticeBanner"; // 🌍 Global Geo-Notice Banner
import ZoomRecommendationBanner from "./components/ZoomRecommendationBanner"; // 🔍 Zoom Recommendation Banner

// 🔄 State/Loading
import CosmicLoader from "./components/DEX/CosmicLoader";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

// 📱 Mobile
import MobileUI from "./components/MobileUI";
import { useScreenDetection } from "./hooks/useScreenDetection"; // 🎯 Advanced Screen Detection
import useDeviceDetect from "./hooks/useDeviceDetect";

// 📊 Analytics - Componente separate pentru ferestre popup
import MarketingDashboard from "./components/MarketingDashboard";
import CryptoAnalyticsDashboard from "./components/CryptoAnalyticsDashboard";
import PortfolioManager from "./components/PortfolioManager";
import AccessibilityPanel from "./components/AccessibilityPanel";

// 🎛 UI/UX Enhancements

import AIToolLauncher from "./components/AIToolLauncher";
import AIStandaloneLayout from "./components/AIStandaloneLayout";

// 📈 Google Analytics
import GoogleAnalyticsWrapper from "./components/GoogleAnalyticsWrapper";

// 📊 TikTok Analytics - Production hardened engagement-focused implementation
import { initTikTokPixel, trackPageView, trackStandardEvent, trackCustomEvent } from "./lib/tiktok";
import { startEngagementTimer, resetOnRouteChange, checkSiteThresholds, checkPresaleThresholds, getVisitorIdentity, getSessionId, shouldFireReturnVisit, getSessionActiveSeconds } from "./lib/engagement";

const STANDALONE_TOOL_PATHS = {
  "/ai-marketing": "marketing",
  "/ai-crypto": "crypto",
  "/ai-portfolio-standalone": "portfolio",
  "/accessibility": "accessibility",
};

const STANDALONE_TOOL_COMPONENTS = {
  marketing: MarketingDashboard,
  crypto: CryptoAnalyticsDashboard,
  portfolio: PortfolioManager,
  accessibility: AccessibilityPanel,
};

const GlobalRouteOverlays = () => {
  const location = useLocation();

  if (location.pathname.startsWith('/dex-edu')) {
    return <SmartWalletModal />;
  }

  return (
    <>
      <AIToolLauncher />
      <GlobalPresaleCopilot />
      <SmartWalletModal />
    </>
  );
};

// 📄 Lazy Loaded Pages
// Resilient lazy loader to handle chunk cache mismatch after S3/CloudFront deploys
const lazyWithRetry = (importer) => lazy(() => new Promise((resolve, reject) => {
  const attempt = (retries) => {
    importer()
      .then(resolve)
      .catch((err) => {
        const message = String((err && err.message) || err || "");
        // Handle both JS and CSS chunk loading errors
        const chunkFailed = /ChunkLoadError|Loading chunk [0-9]+ failed|Loading CSS chunk [0-9]+ failed/i.test(message);
        if (chunkFailed && typeof window !== "undefined") {
          const key = "__lazy_reload_once__";
          if (!sessionStorage.getItem(key)) {
            try { sessionStorage.setItem(key, "1"); } catch (_) {}
            // Clear all caches before reload
            if ('caches' in window) {
              caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
            }
            window.location.reload();
            return;
          }
        }
        if (retries <= 0) return reject(err);
        setTimeout(() => attempt(retries - 1), 800);
      });
  };
  attempt(1);
}));

const Home = lazyWithRetry(() => import("./components/Home"));
const Whitepaper = lazyWithRetry(() => import("./components/Whitepaper"));
const About = lazyWithRetry(() => import("./components/About"));
const HowToBuy = lazyWithRetry(() => import("./components/HowToBuy"));
const TokenomicsPage = lazyWithRetry(() => import("./components/TokenomicsPage"));
const HowItWorks = lazyWithRetry(() => import("./components/HowItWorks"));
const Roadmap = lazyWithRetry(() => import("./components/Roadmap"));
const StakingPage = lazyWithRetry(() => import("./Staking/StakingPage"));
const StakeWithNFTPreOrder = lazyWithRetry(() => import("./components/Staking/StakeWithNFTPreOrder"));
const Scheme = lazyWithRetry(() => import("./components/Scheme/Scheme"));
const AIBitSwapDEXAssistant = lazyWithRetry(() => import("./openai/AIAssistantBox"));
const PresaleDashboard = lazyWithRetry(() => import("./Presale/Timer/PresaleDashboard"));
const AdminPanel = lazyWithRetry(() => import("./Presale/Timer/logic/AdminPanel"));
const SidebarDashboard = lazyWithRetry(() => import("./SidebarMenu/SidebarDashboard"));
const PresaleHistory = lazyWithRetry(() => import("./Presale/Timer/PresaleHistory"));

const PresalePage = lazyWithRetry(() => import("./Presale/PresalePage"));

// 🔐 Auth & AI Hub
const Login = lazyWithRetry(() => import("./components/Login"));
const VerifyEmail = lazyWithRetry(() => import("./components/VerifyEmail"));
const ResetPassword = lazyWithRetry(() => import("./components/ResetPassword"));
const StressTest = lazyWithRetry(() => import("./components/AIHub/StressTest"));
const LieDetector = lazyWithRetry(() => import("./components/AIHub/LieDetector"));
const SmartAudit = lazyWithRetry(() => import("./components/AIHub/SmartAudit"));
const GemHunter = lazyWithRetry(() => import("./components/AIHub/GemHunter")); // 💎 New Tool
const AIHub = lazyWithRetry(() => import("./components/AIHub/AIHub"));
const MarketOracle = lazyWithRetry(() => import("./components/AIHub/MarketOracle"));
const AdminNeuralLink = lazyWithRetry(() => import("./components/AIHub/AdminNeuralLink"));
const PaymentBox = lazyWithRetry(() => import("./Presale/PaymentBox/PaymentBox"));

// 📱 Mobile versions
const PresaleMobile = lazyWithRetry(() => import("./mobile/PresaleMobile"));
const StakingPageMobile = lazyWithRetry(() => import("./mobile/StakingPageMobile"));
const RewardsHubMobile = lazyWithRetry(() => import("./mobile/RewardsHubMobile"));

const RewardsHub = lazyWithRetry(() => import("./components/RewardsHub"));
// const RewardDashboard = lazy(() => import("./components/RewardsDashboard/RewardsDashboard"));
const BITSAnalytics = lazyWithRetry(() => import("./Presale/BITSAnalytics/BITSAnalytics"));
const InvitePage = lazyWithRetry(() => import("./components/Invite/InvitePage"));
const BitcoinAcademy = lazyWithRetry(() => import("./components/BitcoinAcademy"));
const ProofOfTransferPage = lazyWithRetry(() => import("./components/BitcoinAcademy/pages/ProofOfTransferPage"));
const EducationPage = lazyWithRetry(() => import("./components/EducationPageModern"));
const BitcoinMempoolPage = lazyWithRetry(() => import("./components/Education/BitcoinMempoolPage"));
const StacksMempoolPage = lazyWithRetry(() => import("./components/Education/StacksMempoolPage"));
const AISystemStatusPage = lazyWithRetry(() => import("./components/Education/AISystemStatusPage"));
const WelcomePage = lazyWithRetry(() => import("./components/WelcomePage"));
const OrbitPage = lazyWithRetry(() => import("./components/OrbitPage"));
const AIPortfolioPage = lazyWithRetry(() => import("./components/AIPortfolioPage"));
const AIPortfolioPageRefactored = lazyWithRetry(() => import("./components/AIPortfolioPageRefactored"));
const Claude4AIPortfolioDemo = lazyWithRetry(() => import("./ai-portfolio/Claude4AIPortfolioDemo"));
const AIPortfolioAnalyticsRefactored = lazyWithRetry(() => import("./ai-portfolio/AIPortfolioAnalyticsRefactored"));
const PaperTradingPage = lazyWithRetry(() => import("./papertrade/PaperTradingPage"));
const STXPaperTrade = lazyWithRetry(() => import("./papertrade/STXPaperTrade"));
const TokenPaperTrade = lazyWithRetry(() => import("./papertrade/TokenPaperTrade"));

const TermsPart1 = lazyWithRetry(() => import("./Legal/TermsPart1"));
const TermsPart2 = lazyWithRetry(() => import("./Legal/TermsPart2"));
const TermsPart3 = lazyWithRetry(() => import("./Legal/TermsPart3"));
const Privacy = lazyWithRetry(() => import("./Legal/Privacy"));
const ContactPage = lazyWithRetry(() => import("./components/contact/ContactPage"));

const MindMirror = lazyWithRetry(() => import("./mindmirror/MindMirrorDashboard"));
const ThankYouPage = lazyWithRetry(() => import("./components/ThankYouPage"));
const RegisteredUsers = lazyWithRetry(() => import("./components/Admin/RegisteredUsers")); // Import nou
const SwapPage = lazyWithRetry(() => import("./components/DEX/SwapPage")); // 🔄 Import DEX Demo
const SwapPageMobile = lazyWithRetry(() => import("./components/DEX/SwapPageMobile")); // 📱 Import DEX Mobile
const TradePage = lazyWithRetry(() => import("./components/DEX/Trade")); // 📊 Import TradePage (Oxium-like)
const DexEduReferencePage = lazyWithRetry(() => import("./components/DEX_edu_reference/DEXApp")); // DEX copied from frontend-edu


// 🧠 Main Layout Component
const MainLayout = ({ children, isMobile, menuOpen, setMenuOpen, headerMenuOpen, setHeaderMenuOpen, currentSection, handleSidebarSelect, toggleSidebarMenu, toggleHeaderMenu }) => {
  const location = useLocation();
  const isDexDemo = location.pathname === '/dex';
  const isTradePage = location.pathname === '/dex/trade';
  const isDexEduReference = location.pathname.startsWith('/dex-edu');
  const isPresalePage = location.pathname === '/presale';

  // If it's the DEX Demo page or TradePage, render ONLY the children without the wrapper
  if (isDexDemo || isTradePage || isDexEduReference) {
    return (
      <div
        className="content-container-standalone"
        style={{
          width: '100%',
          minHeight: '100vh',
          overflowX: 'hidden',
          overflowY: 'auto',
          background: '#050508',
          padding: 0,
          margin: 0,
        }}
      >
        {children}
      </div>
    );
  }

  // Standard Layout for all other pages
  return (
    <div className="app-container">
      {/* <CustomCursor /> */}
      {/* 📱 PWA Install Prompt - Runs automatically */}
      <InstallAppModal />
      <StarfieldBackground />
      <ZoomRecommendationBanner /> {/* 🔍 Zoom Recommendation Banner - Shows once if zoom is not 85% */}
      <Header 
        isMenuOpen={headerMenuOpen} 
        toggleMenu={toggleHeaderMenu} 
      />
      {!isPresalePage && <BoostedBanner />}
      <div className="header-spacer"></div>
      <HeaderWalletInfo />
      <ThemeChecker />

      <SidebarMenu
        isMenuOpen={menuOpen}
        setCurrentSection={handleSidebarSelect}
        currentSection={currentSection}
      />
      <HamburgerButton
        isMenuOpen={menuOpen}
        toggleMenu={toggleSidebarMenu}
      />

      <div className="content-container">
        {children}
      </div>

      <Footer />
      <PWAInstallPrompt />
      
      {/* 📱 Mobile-only Telegram button (positioned above PresaleCopilot) */}
      <MobileTelegramButton />
    </div>
  );
};

// 📊 TikTok Engagement Tracker Component (for SPA hash routing + engagement)
const TikTokEngagementTracker = () => {
  const location = useLocation();
  const prevPathRef = React.useRef(null);
  const isInitialMount = React.useRef(true);
  const thresholdCheckInterval = React.useRef(null);

  // Initialize pixel and engagement tracking on mount
  React.useEffect(() => {
    // Initialize visitor identity once at session start (before pixel init)
    getVisitorIdentity(); // This will initialize and cache identity
    
    // Initialize TikTok Pixel (after consent check)
    initTikTokPixel().then(() => {
      // Start engagement timer
      startEngagementTimer();
      
      // Check return visit (once per day) - delayed to ensure pixel is ready
      // CRITICAL: ViewContent is appropriate here (real content exposure - return visit)
      setTimeout(() => {
        if (shouldFireReturnVisit()) {
          const identity = getVisitorIdentity();
          trackStandardEvent('ViewContent', {
            content_type: 'return',
            content_name: `return_visit_day_${identity.distinct_day_count}`,
            page_path: location.pathname || location.hash?.replace('#', '') || '/',
            is_returning: true,
            distinct_day_count: identity.distinct_day_count,
            days_since_first_seen: identity.days_since_first_seen,
          });
        }
      }, 500);
      
      // Check site-wide thresholds every 5 seconds (optimized - only if pixel ready)
      // CRITICAL: Use CUSTOM EVENTS (SiteEngaged30s, SiteEngaged90s) for TikTok Custom Conversions
      thresholdCheckInterval.current = setInterval(() => {
        // Only check if pixel is ready to avoid unnecessary work
        if (window.ttq && (typeof window.ttq.track === 'function' || Array.isArray(window.ttq))) {
          checkSiteThresholds((threshold, type) => {
            const identity = getVisitorIdentity();
            const sessionId = getSessionId();
            const activeSeconds = getSessionActiveSeconds();
            
            // Use CUSTOM EVENT for time-based engagement (compatible with TikTok Custom Conversions)
            trackCustomEvent(`SiteEngaged${threshold}s`, {
              active_seconds: activeSeconds,
              page_path: location.pathname || location.hash?.replace('#', '') || '/',
              session_id: sessionId,
              is_returning: identity.is_returning,
              distinct_day_count: identity.distinct_day_count,
              days_since_first_seen: identity.days_since_first_seen,
              visit_count: identity.visit_count,
            });
          });
        }
      }, 5000);
    });

    return () => {
      if (thresholdCheckInterval.current) {
        clearInterval(thresholdCheckInterval.current);
      }
    };
  }, []);

  // Track page views on route change
  React.useEffect(() => {
    // Get full path including hash (e.g., '/presale' from '#/presale')
    const hashPath = location.hash ? location.hash.replace('#', '') : '';
    const currentPath = hashPath || location.pathname || '/';
    
    // Track initial pageview on mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevPathRef.current = currentPath;
      
      // Small delay to ensure pixel is ready
      setTimeout(() => {
        const identity = getVisitorIdentity();
        const sessionId = getSessionId();
        
        trackPageView(currentPath, {
          page_url: window.location.href,
          page_title: document.title || 'Bits AI',
          session_id: sessionId,
          is_returning: identity.is_returning,
          distinct_day_count: identity.distinct_day_count,
          days_since_first_seen: identity.days_since_first_seen,
          visit_count: identity.visit_count,
        });
      }, 100);
      
      return;
    }
    
    // Only track if path changed (avoid duplicate)
    if (prevPathRef.current !== currentPath) {
      prevPathRef.current = currentPath;
      
      // Reset page engagement timer on route change
      resetOnRouteChange();
      
      // Track pageview with visitor data
      const identity = getVisitorIdentity();
      const sessionId = getSessionId();
      
      trackPageView(currentPath, {
        page_url: window.location.href,
        page_title: document.title || 'Bits AI',
        session_id: sessionId,
        is_returning: identity.is_returning,
        distinct_day_count: identity.distinct_day_count,
        days_since_first_seen: identity.days_since_first_seen,
        visit_count: identity.visit_count,
      });
    }
  }, [location.pathname, location.hash]);

  return null; // This component doesn't render anything
};

const App = () => {
  // 🎯 Advanced Screen Detection - Initialize globally
  useScreenDetection();
  
  
  const [amountPay, setAmountPay] = useState(0);
  const [menuOpen, setMenuOpen] = useState(true); // Sidebar menu
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false); // Header mobile menu
  const [currentSection, setCurrentSection] = useState("home");
  const isMobile = useDeviceDetect();

  const renderToastContainer = () => (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      theme="dark"
      className="bits-toast-container"
      toastClassName="bits-toast"
    />
  );

  const standaloneToolId = (() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const queryTool = params.get("ai_tool");
    if (queryTool) return queryTool;
    const normalizedPath = window.location.pathname.replace(/\/$/, "") || "/";
    return STANDALONE_TOOL_PATHS[normalizedPath] || null;
  })();

  if (standaloneToolId && STANDALONE_TOOL_COMPONENTS[standaloneToolId]) {
    const StandaloneComponent = STANDALONE_TOOL_COMPONENTS[standaloneToolId];
    return (
      <>
        {renderToastContainer()}
        <div
          className="dashboard-standalone-override"
          style={{
            minHeight: "100vh",
            background: "#000",
            padding: "20px",
          }}
        >
          <StandaloneComponent standalone />
        </div>
      </>
    );
  }

  // Mutually exclusive toggle logic
  const toggleSidebarMenu = () => {
    setMenuOpen((prev) => !prev);
    setHeaderMenuOpen(false); // Ensure header menu is closed
  };

  const toggleHeaderMenu = () => {
    setHeaderMenuOpen((prev) => !prev);
    setMenuOpen(false); // Ensure sidebar menu is closed
  };

  const handleSidebarSelect = (section) => {
    setCurrentSection(section);
    setMenuOpen(false);

    if (typeof window !== "undefined" && window.trackGoogleAnalytics) {
      window.trackGoogleAnalytics.trackEngagement("navigation", {
        section,
        navigation_type: "sidebar",
      });
    }
  };

  return (
    <>
      {renderToastContainer()}

      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TikTokEngagementTracker /> {/* 📊 TikTok Engagement tracking (PageView + Active Time + Return Visits) */}
        <ScrollToTop /> {/* ✅ Scroll to top on every route change */}
        <GoogleAnalyticsWrapper>
          <ErrorBoundary>
                    <Suspense fallback={<CosmicLoader />}>
              <Routes>
                {/* 🚫 ===== US BLOCKED PAGE (NO GEO-BLOCKING APPLIED HERE) ===== */}
                <Route path="/us-blocked" element={<USBlockedPage />} />

                {/* ===== PAGINI STANDALONE (FĂRĂ HEADER/FOOTER/SIDEBAR) ===== */}
                <Route
                  path="/ai-marketing"
                  element={
                    <USBlocker>
                      <AIStandaloneLayout
                        title="AI Marketing Suite"
                        description="Automated campaigns, analytics, and real-time insights for growth teams."
                      >
                        <MarketingDashboard standalone />
                      </AIStandaloneLayout>
                    </USBlocker>
                  }
                />
                <Route
                  path="/ai-crypto"
                  element={
                    <USBlocker>
                      <AIStandaloneLayout
                        title="AI Crypto Intelligence"
                        description="Live market monitoring, predictive analytics, and trading signals."
                      >
                        <CryptoAnalyticsDashboard standalone />
                      </AIStandaloneLayout>
                    </USBlocker>
                  }
                />
                <Route
                  path="/ai-portfolio-analytics"
                  element={
                    <USBlocker>
                      <AIStandaloneLayout
                        title="AI Portfolio Analytics"
                        description="Advanced neural analytics, simulations, and strategy insights."
                      >
                        <AIPortfolioAnalyticsRefactored />
                      </AIStandaloneLayout>
                    </USBlocker>
                  }
                />
                <Route
                  path="/ai-portfolio-standalone"
                  element={
                    <USBlocker>
                      <AIStandaloneLayout
                        title="AI Portfolio Manager"
                        description="Multi-asset optimization, risk controls, and allocation recommendations."
                      >
                        <PortfolioManager standalone />
                      </AIStandaloneLayout>
                    </USBlocker>
                  }
                />
                <Route
                  path="/accessibility"
                  element={
                    <USBlocker>
                      <AIStandaloneLayout
                        title="AI Accessibility Hub"
                        description="Adaptive UI settings, behavior insights, and personalized recommendations."
                      >
                        <AccessibilityPanel
                          isOpen
                          standalone
                          onClose={() => {
                            if (window.history.length > 1) {
                              window.history.back();
                            } else {
                              window.location.href = '/';
                            }
                          }}
                        />
                      </AIStandaloneLayout>
                    </USBlocker>
                  }
                />

                {/* ===== TOATE RUTELE CU LAYOUT COMPLET (Header + Sidebar + Overlay System) ===== */}
                <Route 
                  path="/*" 
                  element={
                    <USBlocker>
                      <MobileUI>
                        <MainLayout
                          isMobile={isMobile}
                          menuOpen={menuOpen}
                          setMenuOpen={setMenuOpen}
                          headerMenuOpen={headerMenuOpen}
                          setHeaderMenuOpen={setHeaderMenuOpen}
                          currentSection={currentSection}
                          handleSidebarSelect={handleSidebarSelect}
                          toggleSidebarMenu={toggleSidebarMenu}
                          toggleHeaderMenu={toggleHeaderMenu}
                        >
                          <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/home" element={<Home />} />
                      <Route path="/whitepaper" element={<Whitepaper />} />
                      <Route path="/how-to-buy" element={<HowToBuy />} />
                      <Route path="/staking-old" element={<StakingPage />} />
                      <Route path="/smart-staking" element={<StakeWithNFTPreOrder />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/tokenomics" element={<TokenomicsPage />} />
                      <Route path="/how-it-works" element={<HowItWorks />} />
                      <Route path="/roadmap" element={<Roadmap />} />
                      <Route path="/scheme-test" element={<Scheme />} />
                      <Route path="/ai-portfolio" element={<AIPortfolioPage />} />
                      <Route path="/ai-portfolio-v2" element={<AIPortfolioPageRefactored />} />
                      <Route path="/ai-portfolio-claude4" element={<Claude4AIPortfolioDemo />} />
                      
                      <Route path="/paper-trading" element={<PaperTradingPage />} />
                      <Route path="/paper-trade/stx" element={<STXPaperTrade />} />
                      <Route path="/paper-trade/:symbol" element={<TokenPaperTrade />} />
                      <Route path="/investigator" element={<Navigate to="/dex-edu/investigator" replace />} />
                      <Route path="/ai-assistant" element={<Navigate to="/presale" replace />} />
                      <Route path="/presale" element={isMobile ? <PresaleMobile /> : <PresalePage />} />
                      <Route path="/staking" element={isMobile ? <StakingPageMobile /> : <StakingPage />} />
                      <Route path="/rewards-hub" element={isMobile ? <RewardsHubMobile /> : <RewardsHub />} />
                      {/* <Route path="/reward-dashboard" element={<RewardDashboard />} /> */}
                      <Route path="/bits-analytics" element={<BITSAnalytics />} />
                      <Route path="/bitcoin-academy" element={<BitcoinAcademy />} />
                      <Route path="/proof-of-transfer" element={<ProofOfTransferPage />} />
                      <Route path="/education" element={<EducationPage />} />
                      <Route path="/education/bitcoin-mempool" element={<BitcoinMempoolPage />} />
                      <Route path="/education/stacks-mempool" element={<StacksMempoolPage />} />
                      <Route path="/education/ai-system-status" element={<AISystemStatusPage />} />
                      <Route path="/orbit" element={<OrbitPage />} />
                      <Route path="/welcome" element={<WelcomePage />} />
                      <Route path="/admin-test" element={<AdminPanel />} />
                      <Route path="/test-dashboard" element={<PresaleDashboard />} />
                      <Route path="/dashboard" element={<SidebarDashboard />} />
                      <Route path="/admin/history" element={<PresaleHistory />} />
                      <Route path="/invite" element={<InvitePage />} />
                      <Route
                        path="/terms"
                        element={
                          <>
                            <TermsPart1 />
                            <TermsPart2 />
                            <TermsPart3 />
                          </>
                        }
                      />
                      <Route path="/privacy-policy" element={<Privacy />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/mind-mirror" element={<MindMirror />} />
                      <Route path="/thank-you" element={<ThankYouPage />} />
                      <Route path="/admin/users" element={<RegisteredUsers />} /> {/* Rută secretă */}
                      
                      {/* 🔐 Login & AI Hub */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/ai-hub" element={<AIHub />} />
                      <Route path="/ai-hub/market-oracle" element={<MarketOracle />} />
                      <Route path="/ai-hub/portfolio-stress" element={<StressTest />} />
                      <Route path="/ai-hub/lie-detector" element={<LieDetector />} />
                      <Route path="/ai-hub/smart-audit" element={<SmartAudit />} />
                      <Route path="/ai-hub/gem-hunter" element={<GemHunter />} />
                      <Route path="/ai-hub/admin-neural" element={<AdminNeuralLink />} />
                      <Route path="/dex" element={isMobile ? <SwapPageMobile /> : <SwapPage />} /> {/* 🔄 Rută DEX */}
                      <Route path="/dex/trade" element={<TradePage />} /> {/* 📊 Rută TradePage (Oxium-like) */}
                      <Route path="/dex-edu/*" element={<DexEduReferencePage />} /> {/* DEX copy from frontend-edu */}
                      <Route
                        path="/test-payment"
                        element={
                          <PaymentBox
                            selectedToken="BNB"
                            selectedChain="BSC"
                            amountPay={amountPay}
                            setAmountPay={setAmountPay}
                            tokenPrices={{ BNB: { price: 650 } }}
                            pricesLoading={false}
                          />
                        }
                      />
                          </Routes>
                      </MainLayout>
                      
                      <GlobalRouteOverlays />
                    </MobileUI>
                    </USBlocker>
                  }
                />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </GoogleAnalyticsWrapper>
      </Router>
    </>
  );
};

export default App;
