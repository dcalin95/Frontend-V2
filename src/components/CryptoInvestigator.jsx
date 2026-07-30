import React from 'react';
import InvestigatorWorkspace from './DEX_edu_reference/frontend/components/ai-trading/InvestigatorWorkspace';

export default function CryptoInvestigator({ onNavigateBack }) {
  const handleBack = () => {
    if (onNavigateBack) {
      onNavigateBack('/dex-edu/ota/short-ops?tab=long');
      return;
    }
    window.location.assign('/dex-edu/ota/short-ops?tab=long');
  };

  return (
    <InvestigatorWorkspace
      mode="standalone"
      scopeKey="investigator-route"
      onBack={handleBack}
    />
  );
}
