/**
 * 🎣 useStrategyForm Hook - Strategy Form Logic
 */

import { useState, useEffect } from 'react';
import { validateStrategyConfig } from '../../utils/DEX/validators';

export const useStrategyForm = (strategy, defaultConfig = {}) => {
  const [formData, setFormData] = useState({
    name: strategy?.name || '',
    type: strategy?.type || 'custom',
    riskLevel: strategy?.riskLevel || 'balanced',
    config: strategy?.config || {
      riskLimits: {
        maxPercentPerTrade: 5.0,
        maxOpenPositions: 5,
        dailyLossLimit: 10.0,
        stopLossDefault: 3.0,
        takeProfitDefault: 6.0,
        maxDrawdown: 20.0,
        minConfidence: 0.65
      },
      ...defaultConfig
    }
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (strategy) {
      setFormData({
        name: strategy.name || '',
        type: strategy.type || 'custom',
        riskLevel: strategy.riskLevel || 'balanced',
        config: strategy.config || {
          riskLimits: {
            maxPercentPerTrade: 5.0,
            dailyLossLimit: 10.0,
            maxDrawdown: 20.0
          }
        }
      });
    }
  }, [strategy]);

  const handleInputChange = (field, value) => {
    if (field.startsWith('config.')) {
      const configPath = field.split('.');
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [configPath[1]]: {
            ...(prev.config[configPath[1]] || {}),
            [configPath[2]]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const validation = validateStrategyConfig(formData);
    if (!validation.valid) {
      setFormErrors(validation.errors.reduce((acc, err) => {
        acc[err.field] = err.message;
        return acc;
      }, {}));
      return false;
    }
    setFormErrors({});
    return true;
  };

  const reset = () => {
    setFormData({
      name: '',
      type: 'custom',
      riskLevel: 'balanced',
      config: {
        riskLimits: {
          maxPercentPerTrade: 5.0,
          maxOpenPositions: 5,
          dailyLossLimit: 10.0,
          stopLossDefault: 3.0,
          takeProfitDefault: 6.0,
          maxDrawdown: 20.0,
          minConfidence: 0.65
        }
      }
    });
    setFormErrors({});
  };

  return {
    formData,
    formErrors,
    handleInputChange,
    validate,
    reset,
    setFormErrors
  };
};

