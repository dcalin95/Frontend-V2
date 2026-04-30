/**
 * 📋 SignalDetailsBasicInfo Component
 */

import React from 'react';
import { DetailsSection, DetailsField } from '../../common/DetailsSection';
import { formatPercentage } from '../../../utils/formatters';
import { getConfidenceLevelConfig } from '../../../utils/statusConfigs';

const SignalDetailsBasicInfo = ({ signal }) => {
  const confidence = signal.confidence !== undefined ? signal.confidence * 100 : null;
  const confidenceConfig = confidence !== null ? getConfidenceLevelConfig(signal.confidence) : null;

  return (
    <>
      <DetailsSection>
        <DetailsField label="Token" value={signal.token || 'N/A'} />
      </DetailsSection>

      {confidence !== null && (
        <DetailsSection title="Heuristic score; not a calibrated probability.">
          <DetailsField label="Decision score">
            <span className={`signal-confidence-${confidenceConfig.className}`}>
              {formatPercentage(confidence, 2)}
            </span>
          </DetailsField>
        </DetailsSection>
      )}

      {signal.priority !== undefined && (
        <DetailsSection>
          <DetailsField label="Priority" value={signal.priority || 'N/A'} />
        </DetailsSection>
      )}

      <DetailsSection>
        <DetailsField label="Validation Status">
          <span className={`signal-validation-${signal.valid !== false ? 'valid' : 'invalid'}`}>
            {signal.valid !== false ? 'Valid' : 'Invalid'}
          </span>
        </DetailsField>
      </DetailsSection>
    </>
  );
};

export default SignalDetailsBasicInfo;

