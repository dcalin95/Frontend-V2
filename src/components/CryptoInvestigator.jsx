import React from 'react';
import { useNavigate } from 'react-router-dom';
import InvestigatorWorkspace from './DEX_edu_reference/frontend/components/ai-trading/InvestigatorWorkspace';

export default function CryptoInvestigator() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dex-edu/ota/short-ops?tab=long');
  };

  return (
    <InvestigatorWorkspace
      mode="standalone"
      scopeKey="investigator-route"
      onBack={handleBack}
    />
  );
}
