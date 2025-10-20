import { useState, useEffect, useCallback } from 'react';
import { AB_TESTING_CONFIG } from '../config/analytics';

// A/B Testing Hook
export const useABTesting = (experimentId) => {
  const [variant, setVariant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get experiment configuration
  const getExperimentConfig = useCallback((id) => {
    return AB_TESTING_CONFIG.experiments[id] || null;
  }, []);

  // Generate consistent variant for user
  const getVariantForUser = useCallback((experiment, userId = null) => {
    if (!experiment || !experiment.variants || experiment.variants.length === 0) {
      return experiment?.default || null;
    }

    // Use user ID if available, otherwise use session ID
    const seed = userId || sessionStorage.getItem('sessionId') || Date.now().toString();
    
    // Simple hash function for consistent assignment
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Ensure positive number and get variant index
    const positiveHash = Math.abs(hash);
    const variantIndex = positiveHash % experiment.variants.length;
    
    return experiment.variants[variantIndex];
  }, []);

  // Initialize experiment
  useEffect(() => {
    if (!AB_TESTING_CONFIG.enabled) {
      setVariant(null);
      setIsLoading(false);
      return;
    }

    const experiment = getExperimentConfig(experimentId);
    if (!experiment) {
      setVariant(null);
      setIsLoading(false);
      return;
    }

    // Check if variant is already assigned
    const storedVariant = localStorage.getItem(`ab_test_${experimentId}`);
    if (storedVariant && experiment.variants.includes(storedVariant)) {
      setVariant(storedVariant);
      setIsLoading(false);
      return;
    }

    // Generate session ID if not exists
    if (!sessionStorage.getItem('sessionId')) {
      sessionStorage.setItem('sessionId', Date.now().toString());
    }

    // Assign variant
    const assignedVariant = getVariantForUser(experiment);
    if (assignedVariant) {
      localStorage.setItem(`ab_test_${experimentId}`, assignedVariant);
      setVariant(assignedVariant);
    } else {
      setVariant(experiment.default);
    }

    setIsLoading(false);
  }, [experimentId, getExperimentConfig, getVariantForUser]);

  // Track experiment view
  const trackExperimentView = useCallback(() => {
    if (!variant || !AB_TESTING_CONFIG.enabled) return;

    // Track experiment view in analytics
    if (window.gtag) {
      window.gtag('event', 'experiment_view', {
        experiment_id: experimentId,
        variant: variant,
        non_interaction: true,
      });
    }

    // Track in custom analytics
    if (window.trackEvent) {
      window.trackEvent('experiment_view', {
        experiment_id: experimentId,
        variant: variant,
      });
    }
  }, [experimentId, variant]);

  // Track experiment conversion
  const trackExperimentConversion = useCallback((conversionType = 'general', value = 1) => {
    if (!variant || !AB_TESTING_CONFIG.enabled) return;

    // Track conversion in analytics
    if (window.gtag) {
      window.gtag('event', 'experiment_conversion', {
        experiment_id: experimentId,
        variant: variant,
        conversion_type: conversionType,
        value: value,
      });
    }

    // Track in custom analytics
    if (window.trackEvent) {
      window.trackEvent('experiment_conversion', {
        experiment_id: experimentId,
        variant: variant,
        conversion_type: conversionType,
        value: value,
      });
    }
  }, [experimentId, variant]);

  // Get experiment data
  const getExperimentData = useCallback(() => {
    const experiment = getExperimentConfig(experimentId);
    return {
      id: experimentId,
      variant,
      isLoading,
      isEnabled: AB_TESTING_CONFIG.enabled,
      config: experiment,
    };
  }, [experimentId, variant, isLoading, getExperimentConfig]);

  return {
    variant,
    isLoading,
    isEnabled: AB_TESTING_CONFIG.enabled,
    trackExperimentView,
    trackExperimentConversion,
    getExperimentData,
  };
};

// Hook for button color experiment
export const useButtonColorExperiment = () => {
  const { variant, isLoading, trackExperimentView, trackExperimentConversion } = useABTesting('button_color_test');

  useEffect(() => {
    if (!isLoading && variant) {
      trackExperimentView();
    }
  }, [isLoading, variant, trackExperimentView]);

  const getButtonColor = useCallback(() => {
    switch (variant) {
      case 'blue':
        return '#00d4ff';
      case 'green':
        return '#00ff88';
      case 'purple':
        return '#8b5cf6';
      default:
        return '#00d4ff';
    }
  }, [variant]);

  const trackButtonClick = useCallback(() => {
    trackExperimentConversion('button_click', 1);
  }, [trackExperimentConversion]);

  return {
    buttonColor: getButtonColor(),
    isLoading,
    trackButtonClick,
  };
};

// Hook for header layout experiment
export const useHeaderLayoutExperiment = () => {
  const { variant, isLoading, trackExperimentView, trackExperimentConversion } = useABTesting('header_layout_test');

  useEffect(() => {
    if (!isLoading && variant) {
      trackExperimentView();
    }
  }, [isLoading, variant, trackExperimentView]);

  const isCompactLayout = variant === 'compact';

  const trackHeaderInteraction = useCallback((interactionType) => {
    trackExperimentConversion(`header_${interactionType}`, 1);
  }, [trackExperimentConversion]);

  return {
    isCompactLayout,
    isLoading,
    trackHeaderInteraction,
  };
};

// Hook for new features experiment
export const useNewFeaturesExperiment = () => {
  const { variant, isLoading, trackExperimentView, trackExperimentConversion } = useABTesting('new_features_test');

  useEffect(() => {
    if (!isLoading && variant) {
      trackExperimentView();
    }
  }, [isLoading, variant, trackExperimentView]);

  const areNewFeaturesEnabled = variant === 'enabled';

  const trackFeatureUsage = useCallback((featureName) => {
    trackExperimentConversion(`feature_usage_${featureName}`, 1);
  }, [trackExperimentConversion]);

  return {
    areNewFeaturesEnabled,
    isLoading,
    trackFeatureUsage,
  };
};

// Utility function to get all active experiments
export const getActiveExperiments = () => {
  if (!AB_TESTING_CONFIG.enabled) return [];

  return Object.keys(AB_TESTING_CONFIG.experiments).map(experimentId => {
    const storedVariant = localStorage.getItem(`ab_test_${experimentId}`);
    const experiment = AB_TESTING_CONFIG.experiments[experimentId];
    
    return {
      id: experimentId,
      variant: storedVariant || experiment.default,
      config: experiment,
    };
  });
};

// Utility function to reset all experiments
export const resetAllExperiments = () => {
  Object.keys(AB_TESTING_CONFIG.experiments).forEach(experimentId => {
    localStorage.removeItem(`ab_test_${experimentId}`);
  });
  sessionStorage.removeItem('sessionId');
  window.location.reload();
}; 