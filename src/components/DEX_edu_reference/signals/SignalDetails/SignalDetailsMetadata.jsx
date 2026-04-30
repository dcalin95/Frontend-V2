/**
 * 📊 SignalDetailsMetadata Component
 */

import React from 'react';
import { DetailsSection, DetailsField } from '../../common/DetailsSection';
import { formatDate, formatRelativeTime } from '../../utils/DEX/formatters';

const SignalDetailsMetadata = ({ signal }) => {
  return (
    <DetailsSection title="Metadata">
      {signal.createdAt && (
        <DetailsField
          label="Created"
          value={formatDate(signal.createdAt, 'datetime')}
        />
      )}
      {signal.updatedAt && (
        <DetailsField
          label="Updated"
          value={formatRelativeTime(signal.updatedAt)}
        />
      )}
      {signal.reasoning && (
        <div className="signal-reasoning">
          <h4>Reasoning:</h4>
          <p>{signal.reasoning}</p>
        </div>
      )}
    </DetailsSection>
  );
};

export default SignalDetailsMetadata;

