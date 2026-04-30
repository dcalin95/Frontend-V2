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
import authApiService from './authApiService';
import otaContractService from './otaContractService';
import tokenRegistry from './tokenRegistry';

// OTA API Services (Fazele 0-3)
import otaBacktestService from './otaBacktestService';
import otaStrategyService from './otaStrategyService';
import otaModelInferenceService from './otaModelInferenceService';
import otaBanditService from './otaBanditService';
import otaMetaControllerService from './otaMetaControllerService';

// Re-export all services
export {
  aiTradingApiService,
  strategyApiService,
  signalApiService,
  performanceApiService,
  executionApiService,
  authApiService,
  otaContractService,
  tokenRegistry,
  // OTA Services
  otaBacktestService,
  otaStrategyService,
  otaModelInferenceService,
  otaBanditService,
  otaMetaControllerService
};

export default {
  aiTradingApiService,
  strategyApiService,
  signalApiService,
  performanceApiService,
  executionApiService,
  authApiService,
  otaContractService,
  tokenRegistry,
  // OTA Services
  otaBacktestService,
  otaStrategyService,
  otaModelInferenceService,
  otaBanditService,
  otaMetaControllerService
};

