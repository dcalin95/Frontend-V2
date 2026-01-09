/**
 * 🔌 Frontend API Services - Index
 * 
 * Central export pentru toate frontend API services:
 * - AI Trading API
 * - Strategy API
 * - Signal API
 * - Performance API
 * - Execution API
 * 
 * @module services
 */

// Import frontend-specific services (adaptate pentru frontend)
import aiTradingApiService from './aiTradingApiService';
import strategyApiService from './strategyApiService';
import signalApiService from './signalApiService';
import performanceApiService from './performanceApiService';
import executionApiService from './executionApiService';

// Re-export all services
export {
  aiTradingApiService,
  strategyApiService,
  signalApiService,
  performanceApiService,
  executionApiService
};

export default {
  aiTradingApiService,
  strategyApiService,
  signalApiService,
  performanceApiService,
  executionApiService
};

