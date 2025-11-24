/**
 * Neural Intelligence Module
 * 
 * Central export point for the Neural Intelligence AI trading system.
 * This module is fully self-contained and can be moved to any React project.
 * 
 * Usage:
 *   import { NeuralIntelligencePage } from './NeuralIntelligence';
 * 
 * Dependencies:
 *   - React (hooks: useState, useEffect, useContext)
 *   - react-toastify (for notifications)
 *   - lucide-react (for icons)
 *   - WalletContext (from parent app - can be adapted)
 * 
 * @module NeuralIntelligence
 */

// Main Page
export { default as NeuralIntelligencePage } from './NeuralIntelligencePage';

// Components (if you want to use them separately)
export { default as StatusCard } from './components/StatusCard';
export { default as StrategiesCard } from './components/StrategiesCard';
export { default as SignalsActivityCard } from './components/SignalsActivityCard';
export { default as SystemDocumentation } from './components/SystemDocumentation';
export { default as WealthEngineTester } from './components/WealthEngineTester';

// API Layer (for direct access)
export * as NeuralAPI from './api/neuralIntelligence';

// Mock Data (for testing)
export * as MockData from './data/mockSignals';

