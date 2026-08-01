import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import InvestigatorWorkspace from '../components/ai-trading/InvestigatorWorkspace';
import { useWallet } from '../hooks/useWallet';

export default function InvestigatorPage() {
  const navigate = useNavigate();
  const { walletAddress } = useWallet();
  const returnToDashboard = useCallback(() => navigate('/dex-edu/dashboard'), [navigate]);

  return (
    <InvestigatorWorkspace
      mode="standalone"
      scopeKey={walletAddress || 'anon'}
      onBack={returnToDashboard}
    />
  );
}
