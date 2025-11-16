// 🌍 Global styles (must be first)
import "react-toastify/dist/ReactToastify.css";
import "./styles/GlobalStyles.css";
import "./toastStyle.css";
 

// 🧠 Core React
import React, { useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

// 🧩 Layout & UI
import Header from "./components/Header";
import Footer from "./components/Footer";
import BoostedBanner from "./components/BoostedBanner";
import HeaderWalletInfo from "./context/HeaderWalletInfo";
import StarfieldBackground from "./components/StarfieldBackground";
// import CustomCursor from "./components/CustomCursor"; // 🚫 DISABLED - Performance optimization
import ErrorBoundary from "./components/ErrorBoundary";
import SidebarMenu from "./SidebarMenu/SidebarMenu";
import HamburgerButton from "./HamburgerButton/HamburgerButton";
import ThemeChecker from "./components/ThemeChecker";

// 🔄 State/Loading
import LoadingSpinner from "./components/LoadingSpinner";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

// 📱 Mobile
import MobileUI from "./components/MobileUI";

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

// 📄 Lazy Loaded Pages
// Resilient lazy loader to handle chunk cache mismatch after S3/CloudFront deploys
const lazyWithRetry = (importer) => lazy(() => new Promise((resolve, reject) => {
  const attempt = (retries) => {
    importer()
      .then(resolve)
      .catch((err) => {
        const message = String((err && err.message) || err || "");
        const chunkFailed = /ChunkLoadError|Loading chunk [0-9]+ failed/i.test(message);
        if (chunkFailed && typeof window !== "undefined") {
          const key = "__lazy_reload_once__";
          if (!sessionStorage.getItem(key)) {
            try { sessionStorage.setItem(key, "1"); } catch (_) {}
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
const Whitepaper = lazy(() => import("./components/Whitepaper"));
const About = lazy(() => import("./components/About"));
const HowToBuy = lazy(() => import("./components/HowToBuy"));
const TokenomicsPage = lazy(() => import("./components/TokenomicsPage"));
const HowItWorks = lazy(() => import("./components/HowItWorks"));
const Roadmap = lazy(() => import("./components/Roadmap"));
const StakingPage = lazy(() => import("./Staking/StakingPage"));
const StakeWithNFTPreOrder = lazy(() => import("./components/Staking/StakeWithNFTPreOrder"));
const Scheme = lazy(() => import("./components/Scheme/Scheme"));
const AIBitSwapDEXAssistant = lazy(() => import("./openai/AIAssistantBox"));
const PresaleDashboard = lazy(() => import("./Presale/Timer/PresaleDashboard"));
const AdminPanel = lazy(() => import("./Presale/Timer/logic/AdminPanel"));
const SidebarDashboard = lazy(() => import("./SidebarMenu/SidebarDashboard"));
const PresaleHistory = lazy(() => import("./Presale/Timer/PresaleHistory"));

const PresalePage = lazy(() => import("./Presale/PresalePage"));
const PaymentBox = lazy(() => import("./Presale/PaymentBox/PaymentBox"));

const RewardsHub = lazy(() => import("./components/RewardsHub"));
// const RewardDashboard = lazy(() => import("./components/RewardsDashboard/RewardsDashboard"));
const BITSAnalytics = lazy(() => import("./Presale/BITSAnalytics/BITSAnalytics"));
const InvitePage = lazy(() => import("./components/Invite/InvitePage"));
const BitcoinAcademy = lazy(() => import("./components/BitcoinAcademy"));
const ProofOfTransferPage = lazy(() => import("./components/BitcoinAcademy/pages/ProofOfTransferPage"));
const EducationPage = lazyWithRetry(() => import("./components/EducationPageModern"));
const WelcomePage = lazy(() => import("./components/WelcomePage"));
const OrbitPage = lazy(() => import("./components/OrbitPage"));
const AIPortfolioPage = lazy(() => import("./components/AIPortfolioPage"));
const AIPortfolioPageRefactored = lazy(() => import("./components/AIPortfolioPageRefactored"));
const Claude4AIPortfolioDemo = lazy(() => import("./ai-portfolio/Claude4AIPortfolioDemo"));
const AIPortfolioAnalyticsRefactored = lazy(() => import("./ai-portfolio/AIPortfolioAnalyticsRefactored"));
const PaperTradingPage = lazy(() => import("./papertrade/PaperTradingPage"));
const STXPaperTrade = lazy(() => import("./papertrade/STXPaperTrade"));
const TokenPaperTrade = lazy(() => import("./papertrade/TokenPaperTrade"));

const TermsPart1 = lazy(() => import("./Legal/TermsPart1"));
const TermsPart2 = lazy(() => import("./Legal/TermsPart2"));
const TermsPart3 = lazy(() => import("./Legal/TermsPart3"));
const Privacy = lazy(() => import("./Legal/Privacy"));
const ContactPage = lazy(() => import("./components/contact/ContactPage"));

const WalletTestComponent = lazy(() => import("./context/wallet/WalletTestComponent"));
const MindMirror = lazy(() => import("./mindmirror/MindMirrorDashboard"));
const ThankYouPage = lazy(() => import("./components/ThankYouPage"));


const App = () => {
  const [amountPay, setAmountPay] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState("home");

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

  const toggleMenu = () => setMenuOpen((prev) => !prev);

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

      <Router>
        <GoogleAnalyticsWrapper>
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* ===== PAGINI STANDALONE (FĂRĂ HEADER/FOOTER/SIDEBAR) ===== */}
                <Route
                  path="/ai-marketing"
                  element={
                    <AIStandaloneLayout
                      title="AI Marketing Suite"
                      description="Automated campaigns, analytics, and real-time insights for growth teams."
                    >
                      <MarketingDashboard standalone />
                    </AIStandaloneLayout>
                  }
                />
                <Route
                  path="/ai-crypto"
                  element={
                    <AIStandaloneLayout
                      title="AI Crypto Intelligence"
                      description="Live market monitoring, predictive analytics, and trading signals."
                    >
                      <CryptoAnalyticsDashboard standalone />
                    </AIStandaloneLayout>
                  }
                />
                <Route
                  path="/ai-portfolio-analytics"
                  element={
                    <AIStandaloneLayout
                      title="AI Portfolio Analytics"
                      description="Advanced neural analytics, simulations, and strategy insights."
                    >
                      <AIPortfolioAnalyticsRefactored />
                    </AIStandaloneLayout>
                  }
                />
                <Route
                  path="/ai-portfolio-standalone"
                  element={
                    <AIStandaloneLayout
                      title="AI Portfolio Manager"
                      description="Multi-asset optimization, risk controls, and allocation recommendations."
                    >
                      <PortfolioManager standalone />
                    </AIStandaloneLayout>
                  }
                />
                <Route
                  path="/accessibility"
                  element={
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
                  }
                />

                {/* ===== TOATE RUTELE CU LAYOUT COMPLET (Header + Sidebar + Overlay System) ===== */}
                <Route 
                  path="/*" 
                  element={
                    <MobileUI>
                      <div className="app-container">
                        {/* <CustomCursor /> */} {/* 🚫 DISABLED - Caused slow mouse movement */}
                        <StarfieldBackground />
                        <Header />
                        <BoostedBanner />
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
                          toggleMenu={toggleMenu}
                        />

                        <div className="content-container">
                          <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/home" element={<Home />} />
                      <Route path="/whitepaper" element={<Whitepaper />} />
                      <Route path="/how-to-buy" element={<HowToBuy />} />
                      <Route path="/staking" element={<StakingPage />} />
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
                      <Route path="/ai-assistant" element={<AIBitSwapDEXAssistant />} />
                      <Route path="/presale" element={<PresalePage />} />
                      <Route path="/rewards-hub" element={<RewardsHub />} />
                      {/* <Route path="/reward-dashboard" element={<RewardDashboard />} /> */}
                      <Route path="/bits-analytics" element={<BITSAnalytics />} />
                      <Route path="/bitcoin-academy" element={<BitcoinAcademy />} />
                      <Route path="/proof-of-transfer" element={<ProofOfTransferPage />} />
                      <Route path="/education" element={<EducationPage />} />
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
                      <Route path="/wallet-test" element={<WalletTestComponent />} />
                      <Route path="/mind-mirror" element={<MindMirror />} />
                      <Route path="/thank-you" element={<ThankYouPage />} />
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
                        </div>

                        <Footer />
                        <PWAInstallPrompt />
                      </div>
                      
                      {/* Launcher AI Tools */}
                      <AIToolLauncher />
                    </MobileUI>
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
