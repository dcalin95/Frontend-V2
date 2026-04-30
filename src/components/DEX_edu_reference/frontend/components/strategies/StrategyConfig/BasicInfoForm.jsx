/**
 * 📋 BasicInfoForm Component - Basic Strategy Information Form
 */

import React from 'react';
import { FormField } from '../../common/FormField';
import { STRATEGY_TYPES, RISK_LEVELS } from '../../../utils/constants';

const BasicInfoForm = ({ formData, formErrors, onChange }) => {
  const strategyTypeOptions = Object.values(STRATEGY_TYPES).map(type => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1)
  }));

  const riskLevelOptions = Object.values(RISK_LEVELS).map(level => ({
    value: level,
    label: level.charAt(0).toUpperCase() + level.slice(1)
  }));

  return (
    <>
      <FormField
        label="Strategy Name"
        name="name"
        type="text"
        value={formData.name || ''}
        onChange={onChange}
        error={formErrors.name}
        placeholder="Enter strategy name"
        required
      />

      <FormField
        label="Strategy Type"
        name="type"
        type="select"
        value={formData.type || 'custom'}
        onChange={onChange}
        error={formErrors.type}
        options={strategyTypeOptions}
      />

      <FormField
        label="Risk Level"
        name="riskLevel"
        type="select"
        value={formData.riskLevel || 'balanced'}
        onChange={onChange}
        error={formErrors.riskLevel}
        options={riskLevelOptions}
      />
    </>
  );
};

export default BasicInfoForm;

