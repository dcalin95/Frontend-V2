/* eslint-disable */
/**
 * 🔐 OTAAccessControl.jsx - OTA Access Control
 * 
 * Component pentru controlul accesului la OTA:
 * - BITS token verification
 * - User authentication check
 * - Privileges display
 * - Access level management
 * - Multi-chain access control
 * 
 * @module OTAAccessControl
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw, Lock, Power, Target } from 'lucide-react';
import OTALogo from '../frontend/components/ai-trading/OTALogo';
import { OPENAI_TRADING_AGENT_NAME } from '../frontend/utils/aiTradingConstants';
import LoadingSpinner from '../frontend/components/common/LoadingSpinner';
import { useDexAuth } from '../frontend/context/DexAuthContext';
import { useOTARegistrationContext } from '../frontend/context/OTARegistrationContext';
import { useContractDeploymentStatus } from '../frontend/hooks/useContractDeploymentStatus';
import { isContractsNotDeployed, getContractDeploymentMessage } from '../frontend/utils/contractDeploymentUtils';
import { toast } from 'react-toastify';
import { logWithPrefix, errorWithPrefix } from '../frontend/utils/logger';
import { getApiBaseUrl, API_ENDPOINTS } from '../config/apiEndpoints.js';
import { useWallet as useUnifiedWallet } from '../context/WalletContext.jsx';
/** API base URL (backend /api). SSOT: apiEndpoints → runtimeConfig. */
const API_BASE_URL = getApiBaseUrl();
import '../frontend/styles/components/ota-access-control.css';

// Must match on-chain `UserVault.minBITSForOTA` (BSC mainnet deployment).
const MIN_BITS_REQUIRED = 5000;

const OTAAccessControl = React.memo(({ className = '' }) => {
  const { walletAddress, associatedWalletAddress, isAuthenticated } = useDexAuth();
  const unifiedWallet = useUnifiedWallet();
  const {
    isRegistered,
    isLoading,
    bitsBalance,
    bitsBalanceLoading,
    registrationStatus,
    privileges,
    botAuthorizations,
    isRegistering,
    error,
    register: registerHandler,
    refresh
  } = useOTARegistrationContext();
  const contractStatus = useContractDeploymentStatus();

  // Real wallet only from context. No prescribed wallet.
  // For on-chain checks we accept ONLY a real connected EVM wallet from WalletContext.
  const effectiveWalletAddress = useMemo(() => {
    if (unifiedWallet?.isConnected && unifiedWallet?.walletType === 'EVM' && unifiedWallet?.walletAddress) {
      return unifiedWallet.walletAddress;
    }
    return null;
  }, [unifiedWallet?.isConnected, unifiedWallet?.walletType, unifiedWallet?.walletAddress]);

  const hasSolanaWalletOnly = useMemo(() => {
    return !!(
      unifiedWallet?.isConnected &&
      unifiedWallet?.walletType === 'SOLANA' &&
      unifiedWallet?.walletAddress &&
      !effectiveWalletAddress
    );
  }, [effectiveWalletAddress, unifiedWallet?.isConnected, unifiedWallet?.walletType, unifiedWallet?.walletAddress]);

  const [registerError, setRegisterError] = useState(null);
  const [circuitBreakerState, setCircuitBreakerState] = useState(null);
  const [isResettingCircuitBreaker, setIsResettingCircuitBreaker] = useState(false);

  // Handle register button click
  const handleRegister = async () => {
    if (!effectiveWalletAddress || !isAuthenticated) {
      toast.error('Please connect your EVM wallet first. OTA access requires MetaMask or another EVM wallet on BSC.');
      return;
    }

    try {
      setRegisterError(null);
      
      // Check if contracts are deployed
      if (contractStatus.isNotDeployed) {
        toast.info(contractStatus.message, {
          autoClose: 5000
        });
        setRegisterError('Smart contracts not deployed yet. OTA registration will be available soon.');
        return;
      }
      
      // Step 1: Show info about what will happen
      toast.info('Preparing on-chain registration transaction...', { autoClose: 3000 });
      
      // Step 2: Register on-chain (this will open MetaMask)
      // This calls UserVault.register() on the blockchain - NOT database!
      await registerHandler();
      
      // Step 3: Success
      toast.success('Successfully registered for OTA on-chain! Your registration is now recorded on the blockchain.');
      await refresh(); // Refresh status after registration
    } catch (err) {
      const errorMsg = err.message || 'Failed to register';
      setRegisterError(errorMsg);
      errorWithPrefix('OTAAccessControl', 'Error registering:', err);
      
      // Show detailed error message
      if (isContractsNotDeployed(errorMsg)) {
        toast.info(contractStatus.message, {
          autoClose: 5000
        });
      } else if (errorMsg.includes('user rejected') || errorMsg.includes('cancelled')) {
        toast.error('Transaction cancelled. Please approve the transaction in MetaMask to complete registration.');
      } else if (errorMsg.includes('insufficient')) {
        toast.error(`Insufficient BITS balance. You need at least ${MIN_BITS_REQUIRED.toLocaleString()} BITS to register.`);
      } else if (errorMsg.includes('429') || errorMsg.includes('Too many')) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else {
        toast.error(`Registration failed: ${errorMsg}`);
      }
    }
  };

  const handleConnectEvmForOta = async () => {
    try {
      await unifiedWallet?.connectWallet?.('evm');
    } catch (err) {
      errorWithPrefix('OTAAccessControl', 'Error opening EVM wallet modal:', err);
      toast.error('Could not open the EVM wallet selector. Please try again from the wallet button in the header.');
    }
  };

  // Check circuit breaker state via GET /ready (lightweight; avoids burning /analyze and CoinGecko rate limit)
  // 8s timeout: Render free tier sleep → ERR_CONNECTION_CLOSED; avoid a long block.
  useEffect(() => {
    const READY_TIMEOUT_MS = 8000;
    const checkCircuitBreaker = async () => {
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), READY_TIMEOUT_MS);
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OTA_READY}`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal
        });
        clearTimeout(to);
        const data = response.ok ? await response.json() : {};
        const cb = data?.checks?.circuitBreaker;
        setCircuitBreakerState(cb === 'OPEN' ? 'OPEN' : 'CLOSED');
      } catch (_) {
        clearTimeout(to);
        setCircuitBreakerState('CLOSED');
      }
    };

    if (isAuthenticated) {
      checkCircuitBreaker();
      const interval = setInterval(checkCircuitBreaker, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Handle circuit breaker reset
  const handleResetCircuitBreaker = async () => {
    if (isResettingCircuitBreaker) return;

    try {
      setIsResettingCircuitBreaker(true);
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.OTA_CIRCUIT_BREAKER_RESET}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to reset circuit breaker');
      }

      const result = await response.json();
      setCircuitBreakerState('CLOSED');
      toast.success('Circuit breaker reset successfully!');
      logWithPrefix('OTAAccessControl', 'Circuit breaker reset:', result);
    } catch (err) {
      errorWithPrefix('OTAAccessControl', 'Error resetting circuit breaker:', err);
      toast.error('Failed to reset circuit breaker');
    } finally {
      setIsResettingCircuitBreaker(false);
    }
  };

  // Evaluate access status (includes on-chain registration)
  const accessChecks = useMemo(() => {
    const checks = {
      walletConnected: !!effectiveWalletAddress,
      authenticated: isAuthenticated,
      bitsRequirement: bitsBalance !== null && bitsBalance >= MIN_BITS_REQUIRED,
      onChainRegistered: isRegistered // NEW: On-chain registration check
    };

    // Access requires: auth + BITS + on-chain registration
    // Wallet is required only if user wants to register or check BITS balance
    // But if user is authenticated, they can at least see their status
    const hasAccess = checks.authenticated && 
                      checks.bitsRequirement && 
                      checks.onChainRegistered &&
                      checks.walletConnected; // Wallet still needed for on-chain registration

    return { hasAccess, checks };
  }, [effectiveWalletAddress, isAuthenticated, bitsBalance, isRegistered]);

  const accessLevel = useMemo(() => {
    if (!accessChecks.hasAccess) return 'none';
    if (bitsBalance >= 5000) return 'premium';
    if (bitsBalance >= 100) return 'standard';
    return 'basic';
  }, [accessChecks.hasAccess, bitsBalance]);

  const accessLevelLabel = useMemo(() => {
    switch (accessLevel) {
      case 'premium': return 'Premium Access';
      case 'standard': return 'Standard Access';
      case 'basic': return 'Basic Access';
      default: return 'No Access';
    }
  }, [accessLevel]);

  const loading = isLoading || bitsBalanceLoading;

  return (
    <div className={`ota-access-control ${className}`}>
      <header className="ota-access-control-header">
        <div className="ota-access-control-header-left ota-title-row">
          <OTALogo size="sm" animated={circuitBreakerState === 'CLOSED'} className="ota-access-control-title-logo" aria-hidden />
          <h2 className="ota-access-control-title">OTA Access Control</h2>
        </div>
        <div className="ota-access-control-actions">
          {effectiveWalletAddress && (
            <button
              type="button"
              className="ota-access-control-refresh-btn"
              onClick={refresh}
              disabled={loading || isRegistering}
              title="Refresh access status"
            >
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              Refresh
            </button>
          )}
          {circuitBreakerState === 'OPEN' && (
            <button
              type="button"
              className="ota-access-control-reset-btn"
              onClick={handleResetCircuitBreaker}
              disabled={isResettingCircuitBreaker}
              title="Reset OpenAI circuit breaker"
            >
              <Power size={14} className={isResettingCircuitBreaker ? 'spinning' : ''} />
              {isResettingCircuitBreaker ? 'Resetting...' : 'Reset Circuit'}
            </button>
          )}
        </div>
      </header>

      <p className="ota-access-control-description" role="region" aria-label="OTA Access Control Description">
        Verify your access to {OPENAI_TRADING_AGENT_NAME}: wallet, authentication, BITS balance, and on-chain registration.
      </p>

      <div className="ota-access-control-content">
        {loading && !bitsBalance && (
          <div className="ota-access-control-loading">
            <LoadingSpinner message="Checking access..." size="small" />
          </div>
        )}

        {/* Status pill + level */}
        <div className="ota-access-control-status-row">
          <div className={`ota-access-control-status-pill ${accessChecks.hasAccess ? 'granted' : 'denied'}`}>
            {accessChecks.hasAccess ? <CheckCircle size={20} /> : <XCircle size={20} />}
            <span>{accessChecks.hasAccess ? 'Access Granted' : 'Access Denied'}</span>
          </div>
          <span className="ota-access-control-status-level-pill">{accessLevelLabel}</span>
        </div>

        {/* Requirements grid */}
        <div className="ota-access-control-checks" role="region" aria-label="Access Requirements">
          <h3 className="ota-access-control-checks-title">Access Requirements</h3>
          <div className="ota-access-control-checks-grid">
          <div className="ota-access-control-check-item">
            <div className="ota-access-control-check-status">
              {accessChecks.checks.walletConnected ? (
                <CheckCircle size={18} className="check-passed" />
              ) : (
                <XCircle size={18} className="check-failed" />
              )}
            </div>
            <div className="ota-access-control-check-info">
              <span className="ota-access-control-check-name">EVM Wallet Connected</span>
              <span className="ota-access-control-check-detail">
                {effectiveWalletAddress
                  ? `${effectiveWalletAddress.slice(0, 6)}...${effectiveWalletAddress.slice(-4)}`
                  : (hasSolanaWalletOnly
                      ? `Solana connected: ${unifiedWallet.walletAddress.slice(0, 6)}...${unifiedWallet.walletAddress.slice(-4)}; OTA requires EVM`
                  : (associatedWalletAddress
                      ? `Not connected (associated: ${associatedWalletAddress.slice(0, 6)}...${associatedWalletAddress.slice(-4)})`
                      : 'Not connected'))}
              </span>
            </div>
          </div>

          <div className="ota-access-control-check-item">
            <div className="ota-access-control-check-status">
              {accessChecks.checks.authenticated ? (
                <CheckCircle size={18} className="check-passed" />
              ) : (
                <XCircle size={18} className="check-failed" />
              )}
            </div>
            <div className="ota-access-control-check-info">
              <span className="ota-access-control-check-name">Authenticated</span>
              <span className="ota-access-control-check-detail">
                {isAuthenticated ? 'User authenticated' : 'Not authenticated'}
              </span>
            </div>
          </div>

          <div className="ota-access-control-check-item">
            <div className="ota-access-control-check-status">
              {accessChecks.checks.bitsRequirement ? (
                <CheckCircle size={18} className="check-passed" />
              ) : (
                <XCircle size={18} className="check-failed" />
              )}
            </div>
            <div className="ota-access-control-check-info">
              <span className="ota-access-control-check-name">BITS Token Requirement</span>
              <span className="ota-access-control-check-detail">
                {bitsBalance === null 
                  ? (loading ? 'Checking balance...' : (hasSolanaWalletOnly ? 'Waiting for EVM wallet on BSC' : 'Not checked'))
                  : `${bitsBalance.toLocaleString()} BITS (Min: ${MIN_BITS_REQUIRED})`}
              </span>
            </div>
          </div>

          {/* NEW: On-chain Registration Check */}
          <div className="ota-access-control-check-item">
            <div className="ota-access-control-check-status">
              {accessChecks.checks.onChainRegistered ? (
                <CheckCircle size={18} className="check-passed" />
              ) : (
                <Lock size={18} className="check-failed" />
              )}
            </div>
            <div className="ota-access-control-check-info">
              <span className="ota-access-control-check-name">On-Chain Registration</span>
              <span className="ota-access-control-check-detail">
                {isLoading 
                  ? 'Checking registration...' 
                  : (isRegistered 
                      ? 'Registered on-chain' 
                      : 'Not registered on-chain')}
              </span>
            </div>
          </div>
          </div>
        </div>

        {/* BITS Balance Display */}
        {bitsBalance !== null && (
          <div className="ota-access-control-balance">
            <div className="ota-access-control-balance-label">Current BITS Balance</div>
            <div className="ota-access-control-balance-value">
              {bitsBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BITS
            </div>
          </div>
        )}

        {hasSolanaWalletOnly && isAuthenticated && !loading && (
          <div className="ota-access-control-register ota-access-control-register-enhanced">
            <div style={{
              marginBottom: '12px',
              padding: '12px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: '8px',
              fontSize: '13px',
              lineHeight: '1.5',
              color: 'rgba(255, 255, 255, 0.88)'
            }}>
              <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '6px' }}>
                Solana wallet connected
              </strong>
              Phantom is connected for Solana flows. OTA full access checks BITS and registration on BSC, so connect MetaMask or another EVM wallet that holds at least {MIN_BITS_REQUIRED.toLocaleString()} BITS.
            </div>
            <button
              className="ota-access-control-register-btn"
              onClick={handleConnectEvmForOta}
              type="button"
              title="Open the EVM wallet selector for OTA access"
            >
              <Lock size={18} />
              <span>Connect MetaMask for OTA</span>
              <Power size={18} />
            </button>
          </div>
        )}

        {/* Register Button (if not registered) - Enhanced CTA */}
        {!isRegistered && effectiveWalletAddress && isAuthenticated && !loading && (
          <div className="ota-access-control-register ota-access-control-register-enhanced">
            {/* Show coming soon message if contracts not deployed yet */}
            {contractStatus.isNotDeployed ? (
              <div style={{ 
                marginBottom: '12px', 
                padding: '16px', 
                background: 'rgba(20, 241, 149, 0.1)', 
                border: '1px solid rgba(20, 241, 149, 0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                <strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#14f195' }}>
                  {contractStatus.title}
                </strong>
                <div style={{ fontSize: '12px', opacity: 0.95, marginBottom: '10px' }}>
                  {contractStatus.detailedMessage}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.85, padding: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px', marginTop: '8px' }}>
                  <strong>What's Next:</strong><br/>
                  {contractStatus.whatsNext}
                </div>
              </div>
            ) : (
              <>
                {/* Progress Steps Visualization */}
                <div className="ota-access-control-progress-steps">
                  <div className={`ota-access-control-progress-step ${isAuthenticated ? 'completed' : 'active'}`}>
                    <div className="ota-access-control-progress-step-circle">
                      {isAuthenticated ? '✓' : '1'}
                    </div>
                    <div className="ota-access-control-progress-step-label">Authenticate</div>
                  </div>
                  <div className={`ota-access-control-progress-step ${walletAddress ? 'completed' : (isAuthenticated ? 'active' : '')}`}>
                    <div className="ota-access-control-progress-step-circle">
                      {walletAddress ? '✓' : '2'}
                    </div>
                    <div className="ota-access-control-progress-step-label">Connect Wallet</div>
                  </div>
                  <div className={`ota-access-control-progress-step ${isRegistered ? 'completed' : (walletAddress ? 'active' : '')}`}>
                    <div className="ota-access-control-progress-step-circle">
                      {isRegistered ? '✓' : '3'}
                    </div>
                    <div className="ota-access-control-progress-step-label">Register On-Chain</div>
                  </div>
                </div>

                {/* Benefits Visualization */}
                <div className="ota-access-control-benefits">
                  <div className="ota-access-control-benefit-item">
                    <div className="ota-access-control-benefit-icon">
                      <Power size={20} />
                    </div>
                    <div className="ota-access-control-benefit-label">Full OTA Access</div>
                  </div>
                  <div className="ota-access-control-benefit-item">
                    <div className="ota-access-control-benefit-icon">
                      <Target size={20} />
                    </div>
                    <div className="ota-access-control-benefit-label">AI Trading</div>
                  </div>
                  <div className="ota-access-control-benefit-item">
                    <div className="ota-access-control-benefit-icon">
                      <Shield size={20} />
                    </div>
                    <div className="ota-access-control-benefit-label">On-Chain Security</div>
                  </div>
                </div>

                <div style={{ 
                  marginBottom: '12px', 
                  padding: '12px', 
                  background: 'rgba(20, 241, 149, 0.1)', 
                  borderRadius: '8px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>
                  <strong style={{ color: '#14f195', display: 'block', marginBottom: '6px' }}>
                    📝 How OTA Registration Works:
                  </strong>
                  <ol style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Click "Register for OTA" button below</li>
                    <li>MetaMask will open asking you to confirm the transaction</li>
                    <li>Approve the transaction in MetaMask</li>
                    <li>Wait for blockchain confirmation (~15-30 seconds)</li>
                    <li>Your registration is recorded on-chain (UserVault smart contract)</li>
                  </ol>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    ⚠️ <strong>Note:</strong> This is an on-chain transaction, NOT a database entry. You need BNB for gas fees.
                  </div>
                </div>
              </>
            )}
            <button
              className="ota-access-control-register-btn"
              onClick={handleRegister}
              disabled={isRegistering || contractStatus.isNotDeployed}
              title={contractStatus.isNotDeployed
                ? contractStatus.tooltip
                : 'Register on-chain for OTA. MetaMask will open to confirm the transaction.'}
            >
              {isRegistering ? (
                <>
                  <LoadingSpinner message="" size="small" />
                  Registering on-chain... (Check MetaMask)
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Register for OTA (On-Chain)</span>
                  <Power size={18} />
                </>
              )}
            </button>
            {registerError && (
              <div className="ota-access-control-error" style={{ marginTop: '12px' }}>
                <AlertTriangle size={14} />
                <div>
                  <strong>Registration Error:</strong>
                  <div style={{ marginTop: '4px', fontSize: '13px' }}>{registerError}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Privileges Display (if registered) */}
        {isRegistered && privileges && (
          <div className="ota-access-control-privileges">
            <h4 className="ota-access-control-privileges-title">Your Privileges</h4>
            <div className="ota-access-control-privilege-item">
              <span>Pay Gas with BITS:</span>
              <span>{privileges.payGasWithBITS ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="ota-access-control-privilege-item">
              <span>Advanced OTA Access:</span>
              <span>{privileges.accessAdvancedOTA ? 'Enabled' : 'Disabled'}</span>
            </div>
            {privileges.cashbackRate && (
              <div className="ota-access-control-privilege-item">
                <span>Cashback Rate:</span>
                <span>{privileges.cashbackRate}%</span>
              </div>
            )}
          </div>
        )}

        {/* Circuit Breaker Warning – from CSS */}
        {circuitBreakerState === 'OPEN' && (
          <div className="ota-access-control-warning ota-access-control-warning-circuit">
            <AlertTriangle size={18} />
            <div>
              <strong>OpenAI Circuit Breaker Open</strong>
              <p>
                OpenAI service is temporarily unavailable. The circuit breaker will reset automatically after 60 seconds, or you can reset it manually using the button above.
              </p>
            </div>
          </div>
        )}

        {/* Warning for no access – box size = content (inline so it always applies) */}
        {!accessChecks.hasAccess && !loading && (
          <div
            className="ota-access-control-warning"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '6px 10px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '6px',
              fontSize: '13px',
              lineHeight: 1.4,
              color: '#f59e0b'
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Access Required</strong>
              <p style={{ margin: 0 }}>
                {contractStatus.isNotDeployed ? (
                  <>
                    <strong style={{ color: '#14f195' }}>{contractStatus.title}</strong><br/>
                    {contractStatus.detailedMessage}
                  </>
                ) : (
                  <>
                    {!accessChecks.checks.authenticated && 'Please authenticate with DEX (Login/Register). '}
                    {!accessChecks.checks.walletConnected && accessChecks.checks.authenticated && (
                      hasSolanaWalletOnly
                        ? 'Phantom/Solana is connected, but OTA access requires an EVM wallet on BSC to check BITS and register on-chain. '
                        : 'Connect MetaMask or another EVM wallet on BSC to check BITS balance and register on-chain. '
                    )}
                    {accessChecks.checks.walletConnected && !accessChecks.checks.bitsRequirement && `Ensure you have at least ${MIN_BITS_REQUIRED} BITS tokens in your wallet. `}
                    {accessChecks.checks.walletConnected && accessChecks.checks.bitsRequirement && !accessChecks.checks.onChainRegistered && 'Register on-chain to access OTA features. '}
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

OTAAccessControl.displayName = 'OTAAccessControl';

export default OTAAccessControl;
