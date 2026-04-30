/**
 * 🧪 OTA Services Test - Test all OTA API Services
 * 
 * Tests pentru toate serviciile OTA API:
 * - otaBacktestService
 * - otaStrategyService
 * - otaModelInferenceService
 * - otaBanditService
 * - otaMetaControllerService
 * 
 * Run with: npm test -- otaServices.test.js
 */

import {
  otaBacktestService,
  otaStrategyService,
  otaModelInferenceService,
  otaBanditService,
  otaMetaControllerService
} from '../index';

// Mock fetch globally
global.fetch = jest.fn();

describe('OTA Services - Import & Structure Tests', () => {
  describe('otaBacktestService', () => {
    test('should export otaBacktestService', () => {
      expect(otaBacktestService).toBeDefined();
    });

    test('should have runBacktest function', () => {
      expect(typeof otaBacktestService.runBacktest).toBe('function');
    });

    test('should have getBacktestMetrics function', () => {
      expect(typeof otaBacktestService.getBacktestMetrics).toBe('function');
    });
  });

  describe('otaStrategyService', () => {
    test('should export otaStrategyService', () => {
      expect(otaStrategyService).toBeDefined();
    });

    test('should have listStrategies function', () => {
      expect(typeof otaStrategyService.listStrategies).toBe('function');
    });

    test('should have executeStrategy function', () => {
      expect(typeof otaStrategyService.executeStrategy).toBe('function');
    });

    test('should have getStrategyStatus function', () => {
      expect(typeof otaStrategyService.getStrategyStatus).toBe('function');
    });
  });

  describe('otaModelInferenceService', () => {
    test('should export otaModelInferenceService', () => {
      expect(otaModelInferenceService).toBeDefined();
    });

    test('should have getModelInferenceStatus function', () => {
      expect(typeof otaModelInferenceService.getModelInferenceStatus).toBe('function');
    });

    test('should have predictRegime function', () => {
      expect(typeof otaModelInferenceService.predictRegime).toBe('function');
    });

    test('should have predictReturn function', () => {
      expect(typeof otaModelInferenceService.predictReturn).toBe('function');
    });
  });

  describe('otaBanditService', () => {
    test('should export otaBanditService', () => {
      expect(otaBanditService).toBeDefined();
    });

    test('should have getBanditStatistics function', () => {
      expect(typeof otaBanditService.getBanditStatistics).toBe('function');
    });

    test('should have selectStrategy function', () => {
      expect(typeof otaBanditService.selectStrategy).toBe('function');
    });

    test('should have recordReward function', () => {
      expect(typeof otaBanditService.recordReward).toBe('function');
    });

    test('should have resetStatistics function', () => {
      expect(typeof otaBanditService.resetStatistics).toBe('function');
    });
  });

  describe('otaMetaControllerService', () => {
    test('should export otaMetaControllerService', () => {
      expect(otaMetaControllerService).toBeDefined();
    });

    test('should have getMetaControllerStatus function', () => {
      expect(typeof otaMetaControllerService.getMetaControllerStatus).toBe('function');
    });

    test('should have makeDecision function', () => {
      expect(typeof otaMetaControllerService.makeDecision).toBe('function');
    });

    test('should have recordOutcome function', () => {
      expect(typeof otaMetaControllerService.recordOutcome).toBe('function');
    });
  });
});

describe('OTA Services - Parameter Validation', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('otaBacktestService.runBacktest', () => {
    test('should throw error if strategy is missing', async () => {
      await expect(otaBacktestService.runBacktest({})).rejects.toThrow('strategy is required');
    });
  });

  describe('otaStrategyService.executeStrategy', () => {
    test('should throw error if strategyName is missing', async () => {
      // Should throw before API call due to local validation
      await expect(otaStrategyService.executeStrategy({ token: 'BTC' })).rejects.toThrow('strategyName and token are required');
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should throw error if token is missing', async () => {
      // Note: This validates locally before API call, so should throw immediately
      await expect(otaStrategyService.executeStrategy({ strategyName: 'trend-following' })).rejects.toThrow(/strategyName and token are required/);
      // Verify fetch was not called
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('otaModelInferenceService.predictRegime', () => {
    test('should throw error if token is missing', async () => {
      await expect(otaModelInferenceService.predictRegime({})).rejects.toThrow('token is required');
    });
  });

  describe('otaModelInferenceService.predictReturn', () => {
    test('should throw error if token is missing', async () => {
      await expect(otaModelInferenceService.predictReturn({})).rejects.toThrow('token is required');
    });
  });

  describe('otaBanditService.recordReward', () => {
    test('should throw error if strategy is missing', async () => {
      await expect(otaBanditService.recordReward({ reward: 0.5 })).rejects.toThrow('strategy and reward are required');
    });

    test('should throw error if reward is missing', async () => {
      await expect(otaBanditService.recordReward({ strategy: 'trend-following' })).rejects.toThrow('strategy and reward are required');
    });
  });

  describe('otaMetaControllerService.makeDecision', () => {
    test('should throw error if context is missing', async () => {
      await expect(otaMetaControllerService.makeDecision({})).rejects.toThrow('context with token is required');
    });

    test('should throw error if context.token is missing', async () => {
      await expect(otaMetaControllerService.makeDecision({ context: {} })).rejects.toThrow('context with token is required');
    });
  });

  describe('otaMetaControllerService.recordOutcome', () => {
    test('should throw error if tradeResult is missing', async () => {
      await expect(otaMetaControllerService.recordOutcome({})).rejects.toThrow('tradeResult is required');
    });
  });
});
