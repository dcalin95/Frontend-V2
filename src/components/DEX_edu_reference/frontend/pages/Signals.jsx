/**
 * 📡 Signals Page — shell aligned with dashboard; logic unchanged.
 */

import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import SignalList from '../components/signals/SignalList';
import SignalsFilters from '../components/signals/SignalsFilters';
import Skeleton from '../components/common/Skeleton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useOtaEvmWalletAuthSync } from '../hooks/useOtaEvmWalletAuthSync';
import { useWallet } from '../../context/WalletContext.jsx';
import {
  ensureOtaWalletForApiIfNeeded,
  getOtaWalletAuthToken,
  getOtaWalletSessionStoredAddress,
  OTA_SESSION_INVALID_EVENT,
  OTA_SESSION_REFRESH_EVENT,
} from '../utils/otaWalletSession';
import '../styles/pages.css';
import '../styles/components/dashboard-page.css';
import '../styles/components/signals-page.css';

const SignalDetails = lazy(() => import('../components/signals/SignalDetails'));

const Signals = ({ userId }) => {
  const navigate = useNavigate();
  const { isConnected, walletAddress, walletType, signer } = useWallet();
  const otaSignalsUserId = useMemo(() => {
    if (isConnected && walletType === 'EVM' && walletAddress) {
      return String(walletAddress).toLowerCase();
    }
    return userId || null;
  }, [isConnected, walletAddress, walletType, userId]);
  useOtaEvmWalletAuthSync({ enabled: Boolean(otaSignalsUserId) });
  const [otaSessionReady, setOtaSessionReady] = useState(false);
  const [otaSessionError, setOtaSessionError] = useState(null);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    sortBy: 'newest'
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const needsEvmOtaSession = Boolean(isConnected && walletType === 'EVM' && walletAddress);
    const expectedWallet = needsEvmOtaSession ? String(walletAddress).toLowerCase() : null;

    const hasMatchingOtaToken = () => {
      if (!expectedWallet) return Boolean(otaSignalsUserId);
      const token = getOtaWalletAuthToken();
      const storedAddress = getOtaWalletSessionStoredAddress();
      return Boolean(token && storedAddress && String(storedAddress).toLowerCase() === expectedWallet);
    };

    const markReadyIfTokenArrives = () => {
      if (!cancelled && hasMatchingOtaToken()) {
        setOtaSessionReady(true);
        setOtaSessionError(null);
      }
    };

    const ensureCurrentSession = async () => {
      if (!signer) {
        setOtaSessionReady(false);
        return;
      }
      try {
        await ensureOtaWalletForApiIfNeeded(signer, expectedWallet);
        if (!cancelled) {
          setOtaSessionReady(hasMatchingOtaToken());
          setOtaSessionError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setOtaSessionReady(false);
          setOtaSessionError(err?.message || 'OTA wallet signature is required.');
        }
      }
    };

    const handleInvalidOtaSession = () => {
      if (cancelled) return;
      setOtaSessionReady(false);
      ensureCurrentSession();
    };

    setOtaSessionError(null);
    setOtaSessionReady(!needsEvmOtaSession && Boolean(otaSignalsUserId));

    if (!otaSignalsUserId) return undefined;
    if (!needsEvmOtaSession) return undefined;

    window.addEventListener(OTA_SESSION_INVALID_EVENT, handleInvalidOtaSession);
    window.addEventListener(OTA_SESSION_REFRESH_EVENT, markReadyIfTokenArrives);

    if (hasMatchingOtaToken()) {
      setOtaSessionReady(true);
      return () => {
        cancelled = true;
        window.removeEventListener(OTA_SESSION_INVALID_EVENT, handleInvalidOtaSession);
        window.removeEventListener(OTA_SESSION_REFRESH_EVENT, markReadyIfTokenArrives);
      };
    }

    if (!signer) {
      setOtaSessionReady(false);
      return () => {
        cancelled = true;
        window.removeEventListener(OTA_SESSION_INVALID_EVENT, handleInvalidOtaSession);
        window.removeEventListener(OTA_SESSION_REFRESH_EVENT, markReadyIfTokenArrives);
      };
    }

    ensureCurrentSession();

    return () => {
      cancelled = true;
      window.removeEventListener(OTA_SESSION_INVALID_EVENT, handleInvalidOtaSession);
      window.removeEventListener(OTA_SESSION_REFRESH_EVENT, markReadyIfTokenArrives);
    };
  }, [isConnected, otaSignalsUserId, signer, walletAddress, walletType]);

  const handleExecuteSignal = (signal) => {
    navigate('/dex-edu/trade', { state: { fromSignal: signal } });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (searchValue) => {
    setSearch(searchValue);
  };

  return (
    <div className="dashboard-page dashboard-page--cmd signals-page">
      <header className="signals-page-head">
        <h1 className="signals-page-title">Trading Signals</h1>
      </header>

      <div className="signals-page-body">
        <SignalsFilters onFilterChange={handleFilterChange} onSearchChange={handleSearchChange} />

        {!otaSessionReady && otaSignalsUserId ? (
          <div className="signal-list signal-list--premium">
            {otaSessionError ? (
              <p>{otaSessionError}</p>
            ) : (
              <LoadingSpinner message="Preparing OTA wallet session…" />
            )}
          </div>
        ) : (
          <SignalList
            userId={otaSessionReady ? otaSignalsUserId : null}
            filters={filters}
            search={search}
            onSelectSignal={(signal) => {
              setSelectedSignal(signal);
              setShowDetails(true);
            }}
            onExecuteSignal={handleExecuteSignal}
          />
        )}

        {showDetails && selectedSignal && (
          <Suspense fallback={<Skeleton variant="card" height={400} />}>
            <SignalDetails
              userId={otaSignalsUserId}
              signalId={selectedSignal.id}
              onClose={() => {
                setShowDetails(false);
                setSelectedSignal(null);
              }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default Signals;
