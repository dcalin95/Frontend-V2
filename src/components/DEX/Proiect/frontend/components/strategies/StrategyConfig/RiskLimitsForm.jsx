/**
 * ⚠️ RiskLimitsForm Component - Risk Limits Form Section
 */

import React from 'react';
import { FormSection, FormField } from '../../common/FormField';

const RiskLimitsForm = ({ formData, formErrors, onChange }) => {
  const riskLimits = formData.config?.riskLimits || {};

  return (
    <FormSection title="Risk Limits">
      <FormField
        label="Max % Per Trade"
        name="config.riskLimits.maxPercentPerTrade"
        type="number"
        value={riskLimits.maxPercentPerTrade || 5.0}
        onChange={onChange}
        error={formErrors['config.riskLimits.maxPercentPerTrade']}
        min={0}
        max={100}
        step={0.1}
      />

      <FormField
        label="Daily Loss Limit (%)"
        name="config.riskLimits.dailyLossLimit"
        type="number"
        value={riskLimits.dailyLossLimit || 10.0}
        onChange={onChange}
        error={formErrors['config.riskLimits.dailyLossLimit']}
        min={0}
        max={100}
        step={0.1}
      />

      <FormField
        label="Max Drawdown (%)"
        name="config.riskLimits.maxDrawdown"
        type="number"
        value={riskLimits.maxDrawdown || 20.0}
        onChange={onChange}
        error={formErrors['config.riskLimits.maxDrawdown']}
        min={0}
        max={100}
        step={0.1}
      />

      <FormField
        label="Max Open Positions"
        name="config.riskLimits.maxOpenPositions"
        type="number"
        value={riskLimits.maxOpenPositions || 5}
        onChange={onChange}
        error={formErrors['config.riskLimits.maxOpenPositions']}
        min={1}
        max={20}
      />

      <FormField
        label="Stop Loss Default (%)"
        name="config.riskLimits.stopLossDefault"
        type="number"
        value={riskLimits.stopLossDefault || 3.0}
        onChange={onChange}
        error={formErrors['config.riskLimits.stopLossDefault']}
        min={0}
        max={100}
        step={0.1}
      />

      <FormField
        label="Take Profit Default (%)"
        name="config.riskLimits.takeProfitDefault"
        type="number"
        value={riskLimits.takeProfitDefault || 6.0}
        onChange={onChange}
        error={formErrors['config.riskLimits.takeProfitDefault']}
        min={0}
        max={100}
        step={0.1}
      />

      <FormField
        label="Min Confidence"
        name="config.riskLimits.minConfidence"
        type="number"
        value={riskLimits.minConfidence || 0.65}
        onChange={onChange}
        error={formErrors['config.riskLimits.minConfidence']}
        min={0}
        max={1}
        step={0.01}
      />
    </FormSection>
  );
};

export default RiskLimitsForm;

