// Claude 4 AI Portfolio - Neural Analytics & Quantum Intelligence
// Export pentru toate componentele Claude 4 AI Portfolio

// Main component - Claude 4 Quantum Intelligence
export { default as Claude4AIPortfolioQuantumIntelligence } from './Claude4AIPortfolioQuantumIntelligence';

// Demo component cu layout complet
export { default as Claude4AIPortfolioDemo } from './Claude4AIPortfolioDemo';

// Hook pentru blockchain data (re-export from existing hook)
export { default as useBlockchainPortfolioData } from './hooks/useBlockchainPortfolioData';

// Legacy components pentru compatibilitate
export { default as AIPortfolioBuilder } from './AIPortfolioBuilder';
export { default as AIPortfolioBuilderModern } from './AIPortfolioBuilderModern'; 
export { default as AIPortfolioAnalyticsRefactored } from './AIPortfolioAnalyticsRefactored';

// CSS imports (optional - pot fi importate direct în componente)
// import './Claude4QuantumStyles.css';
// import './ModernAIStyles.css';
// import './EnhancedAIStyles.css';
// import './styles.css';

/**
 * Usage Examples:
 * 
 * Basic Claude 4 component:
 * import { Claude4AIPortfolioQuantumIntelligence } from './ai-portfolio';
 * 
 * Full demo page:
 * import { Claude4AIPortfolioDemo } from './ai-portfolio';
 * 
 * Only blockchain data hook:
 * import { useBlockchainPortfolioData } from './ai-portfolio';
 */

// Default export - cele mai avansate componente
export default {
  Claude4AIPortfolioQuantumIntelligence,
  Claude4AIPortfolioDemo,
  useBlockchainPortfolioData
};

