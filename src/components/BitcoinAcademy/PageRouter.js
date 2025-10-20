import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionLayout from './components/SectionLayout';

// Educational Pages - Bitcoin Fundamentals
import SatoshiNakamoto from './pages/SatoshiNakamoto';
import BlockchainTechnology from './pages/BlockchainTechnology';
import ProofOfWork from './pages/ProofOfWork';
import BitcoinMining from './pages/BitcoinMining';
import BitcoinHalving from './pages/BitcoinHalving';
import LightningNetwork from './pages/LightningNetwork';

// Bitcoin + Stacks Pages
import ProofOfTransfer from './pages/ProofOfTransfer';
import Sip010Tokens from './pages/Sip010Tokens';
import SbtcXbtc from './pages/SbtcXbtc';
import DefiOnBitcoin from './pages/DefiOnBitcoin';

// DEX & Liquidity Pages
import WhatIsDex from './pages/WhatIsDex';
import AmmExplained from './pages/AmmExplained';
import AiPoolOptimization from './pages/AiPoolOptimization';
import CrossChainSwaps from './pages/CrossChainSwaps';

// AI in DeFi Pages
import AiPricePrediction from './pages/AiPricePrediction';
import LiquidityAi from './pages/LiquidityAi';
import SentimentAnalysis from './pages/SentimentAnalysis';

// Security & Custody Pages
import HardwareWallets from './pages/HardwareWallets';
import AiFraudDetection from './pages/AiFraudDetection';

// Future Pages
import BitcoinOrdinals from './pages/BitcoinOrdinals';
import BitcoinDaos from './pages/BitcoinDaos';
import Layer2Solutions from './pages/Layer2Solutions';
import HalvingEffects from './pages/HalvingEffects';
import AiGovernance from './pages/AiGovernance';

const PageRouter = ({ currentPage, onBack, onNext }) => {
  const pageOrder = [
    // Bitcoin Fundamentals
    'satoshi-nakamoto',
    'blockchain-technology',
    'proof-of-work',
    'bitcoin-mining',
    'bitcoin-halving',
    'lightning-network',
    // Bitcoin + Stacks
    'proof-of-transfer',
    'sip-010-tokens',
    'sbtc-xbtc',
    'defi-on-bitcoin',
    // DEX & Liquidity
    'what-is-dex',
    'amm-explained',
    'ai-pool-optimization',
    'cross-chain-swaps',
    // AI in DeFi
    'ai-price-prediction',
    'liquidity-ai',
    'sentiment-analysis',
    // Security & Custody
    'hardware-wallets',
    'ai-fraud-detection',
    // Future of Bitcoin & DeFi
    'bitcoin-ordinals',
    'bitcoin-daos',
    'layer2-solutions',
    'halving-effects',
    'ai-governance'
  ];

  const currentIndex = pageOrder.indexOf(currentPage);
  const nextPage = currentIndex < pageOrder.length - 1 ? pageOrder[currentIndex + 1] : null;
  const prevPage = currentIndex > 0 ? pageOrder[currentIndex - 1] : null;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };

  // Scroll to top whenever currentPage changes
  useEffect(() => {
    scrollToTop();
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      // Bitcoin Fundamentals
      case 'satoshi-nakamoto':
        return <SatoshiNakamoto />;
      case 'blockchain-technology':
        return <BlockchainTechnology />;
      case 'proof-of-work':
        return <ProofOfWork />;
      case 'bitcoin-mining':
        return <BitcoinMining />;
      case 'bitcoin-halving':
        return <BitcoinHalving />;
      case 'lightning-network':
        return <LightningNetwork />;
      // Bitcoin + Stacks
      case 'proof-of-transfer':
        return <ProofOfTransfer />;
      case 'sip-010-tokens':
        return <Sip010Tokens />;
      case 'sbtc-xbtc':
        return <SbtcXbtc />;
      case 'defi-on-bitcoin':
        return <DefiOnBitcoin />;
      // DEX & Liquidity
      case 'what-is-dex':
        return <WhatIsDex />;
      case 'amm-explained':
        return <AmmExplained />;
      case 'ai-pool-optimization':
        return <AiPoolOptimization />;
      case 'cross-chain-swaps':
        return <CrossChainSwaps />;
      // AI in DeFi
      case 'ai-price-prediction':
        return <AiPricePrediction />;
      case 'liquidity-ai':
        return <LiquidityAi />;
      case 'sentiment-analysis':
        return <SentimentAnalysis />;
      // Security & Custody
      case 'hardware-wallets':
        return <HardwareWallets />;
      case 'ai-fraud-detection':
        return <AiFraudDetection />;
      // Future of Bitcoin & DeFi
      case 'bitcoin-ordinals':
        return <BitcoinOrdinals />;
      case 'bitcoin-daos':
        return <BitcoinDaos />;
      case 'layer2-solutions':
        return <Layer2Solutions />;
      case 'halving-effects':
        return <HalvingEffects />;
      case 'ai-governance':
        return <AiGovernance />;
      default:
        return <div>Page not found</div>;
    }
  };

  const handleNext = () => {
    if (nextPage) {
      onNext(nextPage);
      setTimeout(scrollToTop, 100);
    }
  };

  const handlePrev = () => {
    if (prevPage) {
      onNext(prevPage);
      setTimeout(scrollToTop, 100);
    }
  };

  const handleBack = () => {
    onBack();
    setTimeout(scrollToTop, 100);
  };

  return (
    <SectionLayout
      onBack={handleBack}
      onNext={nextPage ? handleNext : undefined}
      onPrev={prevPage ? handlePrev : undefined}
      progress={(currentIndex + 1) / pageOrder.length * 100}
      pageTitle={currentPage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
          className="page-content"
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </SectionLayout>
  );
};

export default PageRouter;