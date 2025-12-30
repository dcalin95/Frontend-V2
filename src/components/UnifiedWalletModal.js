import React, { useState, useEffect, useMemo } from 'react';
import { useConnect, useAccount } from 'wagmi'; // 🔌 IMPORT CRITIC: Direct Connection Hook
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useWallet as useSolanaWalletAdapter } from '@solana/wallet-adapter-react';
import { useWallet } from '../context/WalletContext';
import { prepareForConnection, handleConnectionError } from '../utils/walletConnectionFix';
import { prioritizeEVMWallets, logDetectedWallets, forceFixPhantomHijack } from '../utils/walletFilter';
import walletConnectLogo from '../assets/icons/wallet-connect-logo.png'; 
import evmIcon from '../assets/icons/evm-logo.jpg'; // Import EVM logo
import solanaIcon from '../assets/icons/solana-logo.png'; // Import Solana logo
import binanceLogo from '../assets/exchanges/binance.png'; // Import Binance logo
import './UnifiedWalletModal.css';
import './UnifiedWalletModal.mobile.css';
import './UnifiedWalletModal.additions.css';

const UnifiedWalletModal = () => {
  const { showWalletModal, setShowWalletModal, hardReset, markConnectIntent } = useWallet();
  const { connect, disconnect: disconnectEVM, connectors } = useConnect(); // 🔌 Get direct connectors
  const { isConnected, address } = useAccount(); // 🔍 Monitor connection status
  const { open: openEvmModal } = useWeb3Modal();
  
  // 🛡️ Filter and prioritize EVM connectors (exclude Phantom and other non-EVM wallets)
  const filteredConnectors = useMemo(() => {
    const filtered = prioritizeEVMWallets(connectors);
    
    // Log detected wallets for debugging
    if (showWalletModal) {
      console.log('🛡️ [UnifiedWalletModal] ========== CONNECTOR FILTERING ==========');
      console.log('🛡️ [UnifiedWalletModal] ALL connectors:', connectors.map(c => `${c.name} (${c.id})`));
      logDetectedWallets();
      console.log('✅ [UnifiedWalletModal] FILTERED EVM connectors:', filtered.map(c => c.name));
      console.log('🛡️ [UnifiedWalletModal] ====================================');
    }
    
    return filtered;
  }, [connectors, showWalletModal]);
  const { 
    select: selectSolanaWallet, 
    connect: connectSolanaWallet,
    disconnect: disconnectSolanaWallet,
    wallets: solanaWallets,
    connected: isSolanaConnected,
    publicKey: solanaPublicKey,
    wallet: selectedSolanaWallet
  } = useSolanaWalletAdapter();
  
  const [selectedNetwork, setSelectedNetwork] = useState(null); // "EVM" | "SOLANA" | null
  const [isConnecting, setIsConnecting] = useState(false); // ⏳ New connecting state
  const [error, setError] = useState(null);
  const [connectionLock, setConnectionLock] = useState(false); // 🔒 CONNECTION GUARD

  // (Debug panel removed)

  // Check if Solana wallet is already connected when modal opens
  useEffect(() => {
    if (showWalletModal && isSolanaConnected && solanaPublicKey && selectedSolanaWallet) {
      console.log('✅ Solana wallet already connected:', {
        wallet: selectedSolanaWallet.adapter.name,
        publicKey: solanaPublicKey.toBase58()
      });
    }
  }, [showWalletModal, isSolanaConnected, solanaPublicKey, selectedSolanaWallet]);

  // 🎯 AUTO-CLOSE MODAL AFTER SUCCESSFUL CONNECTION
  useEffect(() => {
    // 🛑 CRITICAL: Only check EVM if we're on EVM network (not Solana)
    if (isConnecting && isConnected && address && selectedNetwork !== "SOLANA") {
      console.log('✅ [UnifiedWalletModal] EVM wallet connected successfully, closing modal...');
      unlockConnection();
      setError(null);
      
      // 🛑 CRITICAL: Ensure Solana is disconnected
      if (isSolanaConnected || solanaPublicKey) {
        console.log('🔌 [EVM] Disconnecting Solana after EVM connection...');
        try {
          if (typeof window !== 'undefined' && window.solana?.isPhantom) {
            window.solana.disconnect().catch(() => {});
          }
        } catch (e) {
          console.warn('⚠️ [EVM] Error disconnecting Solana:', e);
        }
      }
      
      // Close modal after a short delay to show success
      setTimeout(() => {
        setShowWalletModal(false);
        setSelectedNetwork(null);
      }, 500);
    }
    
    // 🛑 CRITICAL: Only check Solana if we're on Solana network (not EVM)
    if (isConnecting && isSolanaConnected && solanaPublicKey && selectedNetwork !== "EVM") {
      console.log('✅ [UnifiedWalletModal] Solana wallet connected successfully, closing modal...');
      unlockConnection();
      setError(null);
      
      // 🛑 CRITICAL: Ensure EVM is disconnected
      if (isConnected || address) {
        console.log('🔌 [Solana] Disconnecting EVM after Solana connection...');
        try {
          disconnectEVM().catch(() => {});
        } catch (e) {
          console.warn('⚠️ [Solana] Error disconnecting EVM:', e);
        }
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowWalletModal(false);
        setSelectedNetwork(null);
      }, 500);
    }
  }, [isConnecting, isConnected, address, isSolanaConnected, solanaPublicKey, selectedNetwork, setShowWalletModal, disconnectEVM]);

  if (!showWalletModal) return null;

  // 🔓 Helper function to unlock connection state
  const unlockConnection = () => {
    setIsConnecting(false);
    setConnectionLock(false);
  };

  const handleClose = () => {
    setShowWalletModal(false);
    setSelectedNetwork(null);
    setError(null);
    unlockConnection();
  };

  // 🎯 DIRECT CONNECT FUNCTION (Bypasses generic modal to avoid Phantom conflict)
  const connectToSpecificWallet = async (walletName) => {
    // 🔒 CONNECTION GUARD: Prevent overlapping connection attempts
    if (connectionLock) {
      console.warn('🛑 [UnifiedWalletModal] Connection already in progress, ignoring new request');
      setError('Connection already in progress. Please wait...');
      return;
    }
    
    try {
      setConnectionLock(true); // 🔒 LOCK
      setError(null);
      setIsConnecting(true);
      
      // 🛑 STEP 1: FIX PHANTOM HIJACK (if present)
      console.log('🔧 [UnifiedWalletModal] Checking for Phantom hijack...');
      forceFixPhantomHijack(); // This will swap window.ethereum if needed
      
      // 🛑 STEP 2: FORCE CLEAR ALL PENDING REQUESTS
      console.log('🧹 [UnifiedWalletModal] Clearing ALL pending wallet requests...');
      try {
        // 1. Clear all storage-based pending states
        sessionStorage.removeItem('wallet_pending_request');
        sessionStorage.removeItem('wagmi.connector');
        localStorage.removeItem('wagmi.recentConnectorId');
        
        // 2. Force reject any pending MetaMask/wallet requests
        if (window.ethereum) {
          try {
            // Send a dummy request to cancel any pending ones
            await window.ethereum.request({ 
              method: 'wallet_requestPermissions',
              params: [{ eth_accounts: {} }]
            }).catch(() => {}); // Ignore errors
          } catch (e) {}
        }
        
        // 3. Wait a bit to ensure clearing is complete
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('✅ [UnifiedWalletModal] All pending requests cleared');
      } catch (clearErr) {
        console.warn('⚠️ [UnifiedWalletModal] Error clearing pending:', clearErr);
      }
      
      await prepareForConnection();

      // debug logs removed (too noisy in prod)

      // 🔧 Helper: safely connect to a specific injected provider (Trust/Coinbase/Rainbow/etc.)
      const connectViaInjectedProvider = async ({
        label,
        providerPredicate,
        connectorPredicate,
        notDetectedMessage,
        ambiguousMessage,
      }) => {
        if (typeof window === 'undefined' || !window.ethereum) {
          setError(notDetectedMessage);
          unlockConnection();
          return true; // handled
        }

        const providers = Array.isArray(window.ethereum?.providers) ? window.ethereum.providers : null;
        const provider = providers ? providers.find(providerPredicate) : (providerPredicate(window.ethereum) ? window.ethereum : null);

        if (!provider) {
          setError(notDetectedMessage);
          unlockConnection();
          return true; // handled
        }

        // Mark explicit user intent (prevents WalletContext from treating this as auto-connect)
        if (typeof markConnectIntent === 'function') markConnectIntent();

        // Try provider request first (forces the right wallet popup)
        await provider.request({ method: 'eth_requestAccounts' });

        // Prefer an explicit connector if available (EIP-6963 / dedicated SDK)
        const explicit = connectors.find(connectorPredicate);
        if (explicit) {
          console.log(`🧩 [${label}] Using explicit connector: ${explicit.name} (${explicit.id})`);
          await connect({ connector: explicit });
          return true; // handled
        }

        // Fallback to injected connector ONLY if we can safely bind window.ethereum to this provider
        const injected = connectors.find(c => c.id === 'injected');
        if (!injected) {
          setError(ambiguousMessage);
          unlockConnection();
          return true; // handled
        }

        // In multi-provider environments, injected is ambiguous unless we can swap window.ethereum
        const canSwapEthereum = (() => {
          try {
            const desc = Object.getOwnPropertyDescriptor(window, 'ethereum');
            return !desc || !!desc.writable;
          } catch (_) {
            return false;
          }
        })();

        if (!canSwapEthereum) {
          setError(ambiguousMessage);
          unlockConnection();
          return true; // handled
        }

        const originalEthereum = window.ethereum;
        try {
          window.ethereum = provider;
          console.log(`🧩 [${label}] Using injected with temporary provider binding...`);
          await connect({ connector: injected });
        } finally {
          window.ethereum = originalEthereum;
        }

        return true; // handled
      };

      // Special handling for Trust Wallet - check if installed
      if (walletName.toLowerCase().includes('trust')) {
        try {
          const handled = await connectViaInjectedProvider({
            label: 'Trust',
            providerPredicate: (p) => !!p?.isTrust,
            connectorPredicate: (c) => String(c.id || '').toLowerCase().includes('trust') || String(c.name || '').toLowerCase().includes('trust'),
            notDetectedMessage: 'Trust Wallet is not detected. Please install/enable Trust Wallet extension and refresh.',
            ambiguousMessage: 'Trust Wallet detected but cannot bind it safely (multiple injected wallets). Please use Web3Modal → WalletConnect.',
          });
          if (handled) return;
        } catch (trustErr) {
          console.error('❌ Trust Wallet connection error:', trustErr);
          if (trustErr?.code === 4001) {
            unlockConnection();
            return;
          }
          setError(`Trust Wallet connection failed: ${trustErr?.message || 'Unknown error'}`);
          unlockConnection();
          return;
        }
      }

      // 🔵 Coinbase Wallet: prefer dedicated connector, fallback to provider binding if needed
      if (walletName === 'Coinbase') {
        try {
          // Prefer CoinbaseWalletSDK connector first (doesn't rely on injected ambiguity)
          const coinbaseSdk = connectors.find(c => c.id === 'coinbaseWalletSDK');
          if (coinbaseSdk) {
            console.log(`🪙 [Coinbase] Using coinbaseWalletSDK connector`);
            await connect({ connector: coinbaseSdk });
            return;
          }

          const handled = await connectViaInjectedProvider({
            label: 'Coinbase',
            providerPredicate: (p) => !!p?.isCoinbaseWallet,
            connectorPredicate: (c) => String(c.id || '').toLowerCase().includes('coinbase') || String(c.name || '').toLowerCase().includes('coinbase'),
            notDetectedMessage: 'Coinbase Wallet is not detected. Please install/enable Coinbase Wallet extension and refresh.',
            ambiguousMessage: 'Coinbase Wallet detected but cannot bind it safely (multiple injected wallets). Please use Web3Modal → WalletConnect.',
          });
          if (handled) return;
        } catch (coinbaseErr) {
          console.error('❌ Coinbase connection error:', coinbaseErr);
          if (coinbaseErr?.code === 4001) {
            unlockConnection();
            return;
          }
          setError(`Coinbase connection failed: ${coinbaseErr?.message || 'Unknown error'}`);
          unlockConnection();
          return;
        }
      }

      // 🌈 Rainbow: injected-only in most environments; bind to provider if detectable, otherwise recommend WalletConnect
      if (walletName === 'Rainbow') {
        try {
          const handled = await connectViaInjectedProvider({
            label: 'Rainbow',
            providerPredicate: (p) => !!p?.isRainbow || String(p?.name || '').toLowerCase().includes('rainbow'),
            connectorPredicate: (c) => String(c.id || '').toLowerCase().includes('rainbow') || String(c.name || '').toLowerCase().includes('rainbow'),
            notDetectedMessage: 'Rainbow Wallet provider was not found. Rainbow is best connected via Web3Modal → WalletConnect.',
            ambiguousMessage: 'Rainbow detected but cannot bind it safely (multiple injected wallets). Please use Web3Modal → WalletConnect.',
          });
          if (handled) return;
        } catch (rainbowErr) {
          console.error('❌ Rainbow connection error:', rainbowErr);
          if (rainbowErr?.code === 4001) {
            unlockConnection();
            return;
          }
          setError(`Rainbow connection failed: ${rainbowErr?.message || 'Unknown error'}`);
          unlockConnection();
          return;
        }
      }

      // 🛑 CRITICAL: Check if MetaMask is actually installed and NOT hijacked
      if (walletName === 'MetaMask') {
        const isPhantom = typeof window !== 'undefined' && !!window.ethereum?.isPhantom;
        const isMetaMask = typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
        const hasProviders = typeof window !== 'undefined' && !!window.ethereum?.providers;

        console.log(`🔍 [MetaMask Check] isMetaMask: ${isMetaMask}, isPhantom: ${isPhantom}, hasProviders: ${hasProviders}`);

        // If ONLY Phantom is present and it claims to be MetaMask (hijacking)
        // AND we don't have multiple providers (where MetaMask would be separate)
        if (isPhantom && !hasProviders) {
          setError(`MetaMask is not detected. Phantom has taken over your EVM connection. Please install MetaMask or disable "EVM Support" in Phantom settings.`);
          unlockConnection();
          return;
        }
      }

      // 🟡 BINANCE WEB3 WALLET: handle explicitly (Phantom can hijack injected provider)
      if (walletName === 'Binance') {
        try {
          if (typeof window === 'undefined' || !window.ethereum) {
            setError(`⚠️ Binance Web3 Wallet not detected.\n\n📱 Mobile: Open this site in Binance App Browser (Web3 tab)\n💻 Desktop: Install Binance Web3 Wallet extension\n\n🔗 Or use "WalletConnect" button to scan QR with Binance App`);
            unlockConnection();
            return;
          }

          const providers = Array.isArray(window.ethereum?.providers) ? window.ethereum.providers : null;
          const binanceProvider =
            (providers && providers.find(p =>
              // common flags/names seen in injected providers
              p?.isBinance || p?.isBinanceWallet || p?.isBinanceChain ||
              String(p?.name || '').toLowerCase().includes('binance')
            )) ||
            // fallback: some envs expose BinanceChain
            (typeof window !== 'undefined' ? window.BinanceChain : null);

          if (!binanceProvider) {
            setError(`⚠️ Binance Web3 Wallet provider not found.\n\n📱 MOBILE USERS:\n• Open Binance App → Web3 tab\n• Paste this site URL in browser\n• Try again\n\n💻 DESKTOP USERS:\n• Install Binance Wallet extension\n• Enable it in your browser\n• Unlock wallet & refresh page\n\n🔗 ALTERNATIVE:\n• Use "WalletConnect" button below\n• Scan QR with Binance App`);
            unlockConnection();
            return;
          }

          console.log('🟡 [Binance] Provider detected. Requesting accounts via Binance provider...');
          await binanceProvider.request({ method: 'eth_requestAccounts' });
          const binanceAccounts = await binanceProvider.request({ method: 'eth_accounts' }).catch(() => []);
          if (!binanceAccounts || binanceAccounts.length === 0) {
            setError('Binance is detected, but no accounts are available. Please unlock Binance Web3 Wallet and approve this site, then try again.');
            unlockConnection();
            return;
          }

          // Prefer explicit Binance connector (EIP-6963). Only fallback to injected if we can safely bind window.ethereum.
          const explicitBinanceConnector = connectors.find(
            c =>
              String(c.id || '').toLowerCase().includes('binance') ||
              String(c.name || '').toLowerCase().includes('binance')
          );

          if (explicitBinanceConnector) {
            console.log(`🟡 [Binance] Using explicit connector: ${explicitBinanceConnector.name} (${explicitBinanceConnector.id})`);
            try {
              await connect({ connector: explicitBinanceConnector });
              return; // Let the existing useEffect close modal when connected
            } catch (e) {
              const msg = String(e?.message || '');
              if (msg.toLowerCase().includes('no active wallet found')) {
                setError('Binance is detected, but Wagmi cannot bind it as an active wallet. Please use Web3Modal → WalletConnect, or temporarily disable other injected wallets (Trust/others) and refresh.');
                unlockConnection();
                return;
              }
              throw e;
            }
          }

          // Fallback: injected connector (ambiguous when multiple providers exist)
          const injectedConnector = connectors.find(c => c.id === 'injected');
          if (!injectedConnector) {
            setError('Binance connector not found. Please use WalletConnect/Web3Modal or install a compatible Binance Web3 Wallet extension.');
            unlockConnection();
            return;
          }

          // Try binding injected to Binance provider by swapping window.ethereum if possible
          const canSwapEthereum = (() => {
            try {
              const desc = Object.getOwnPropertyDescriptor(window, 'ethereum');
              return !desc || !!desc.writable;
            } catch (_) {
              return false;
            }
          })();

          if (!canSwapEthereum) {
            setError('Binance detected, but cannot bind injected provider safely. Please use Web3Modal/WalletConnect, or temporarily disable other injected wallets and refresh.');
            unlockConnection();
            return;
          }

          console.log(`🟡 [Binance] No explicit connector found. Using injected with temporary provider binding...`);
          const originalEthereum2 = window.ethereum;
          try {
            window.ethereum = binanceProvider;
            try {
              await connect({ connector: injectedConnector });
            } catch (e) {
              const msg = String(e?.message || '');
              if (msg.toLowerCase().includes('no active wallet found')) {
                setError('Binance provider is present, but injected connection is ambiguous (multiple wallets installed). Best option: Web3Modal → WalletConnect.');
                unlockConnection();
                return;
              }
              throw e;
            }
          } finally {
            window.ethereum = originalEthereum2;
          }

          return; // Let the existing useEffect close modal when connected
        } catch (binanceErr) {
          console.error('❌ [Binance] Connection error:', binanceErr);
          if (binanceErr?.code === 4001) {
            // User rejected
            unlockConnection();
            return;
          }
          // Enhanced error message with troubleshooting
          const errorMsg = binanceErr?.message || 'Unknown error';
          setError(`⚠️ Binance connection failed: ${errorMsg}\n\n🔧 TROUBLESHOOTING:\n\n📱 Mobile:\n• Open Binance App → Web3 tab\n• Use built-in browser\n• Make sure wallet is unlocked\n\n💻 Desktop:\n• Check if Binance Wallet extension is enabled\n• Unlock your wallet\n• Refresh page and try again\n\n🔗 Alternative:\n• Use "WalletConnect" button\n• Scan QR with Binance App`);
          unlockConnection();
          return;
        }
      }

      // For other wallets, find the specific connector
      const connector = filteredConnectors.find(c => {
        const id = c.id.toLowerCase();

        if (walletName === 'MetaMask') {
          const hasMultipleProviders =
            typeof window !== 'undefined' &&
            Array.isArray(window.ethereum?.providers) &&
            window.ethereum.providers.length > 1;

          // 🛑 CRITICAL: Only allow connectors that are explicitly MetaMask
          // EIP-6963 IDs: 'io.metamask', 'metamask'
          // We EXPLICITLY REJECT 'injected' if Phantom is around to avoid hijack
          const isExplicitMetaMask = id === 'io.metamask' || id === 'metamask';
          // 🛑 CRITICAL: If there are multiple injected providers, "injected" is ambiguous (Trust/Rabby/etc can hijack)
          // Only allow injected when it's the ONLY provider (simple environments).
          const isInjectedWithoutPhantom =
            id === 'injected' &&
            typeof window !== 'undefined' &&
            !window.ethereum?.isPhantom &&
            !hasMultipleProviders;
          
          if (isExplicitMetaMask || isInjectedWithoutPhantom) {
            console.log(`✅ [MetaMask] Found safe connector: ${c.name} (ID: ${c.id})`);
            return true;
          }
          return false;
        }
        
        if (walletName === 'Coinbase') {
          const hasEthereum = typeof window !== 'undefined' && window.ethereum;
          return c.id === 'coinbaseWalletSDK' || 
                 (c.id === 'injected' && hasEthereum && window.ethereum.isCoinbaseWallet && !window.ethereum.isPhantom) ||
                 (c.name.toLowerCase().includes('coinbase') && !c.name.toLowerCase().includes('phantom'));
        }
        
        if (walletName === 'WalletConnect') {
          return c.id === 'walletConnect' || c.name.toLowerCase().includes('walletconnect');
        }

        if (walletName === 'Binance') {
          // Prefer explicit Binance connectors (if any). Otherwise handled above.
          return id.includes('binance') || c.name.toLowerCase().includes('binance');
        }
        
        // For other wallets, match by name (exclude Phantom)
        const nameLower = c.name.toLowerCase();
        const walletNameLower = walletName.toLowerCase();
        return nameLower.includes(walletNameLower) && !nameLower.includes('phantom');
      });

      if (connector) {
        console.log(`🔌 Connecting directly to ${connector.name} (ID: ${connector.id})...`);
        
        // 🛑 CRITICAL: Final check - verify this is NOT Phantom
        const connectorName = (connector.name || '').toLowerCase();
        if (connectorName.includes('phantom') && !connectorName.includes('metamask')) {
          console.error(`❌ [CRITICAL] Connector is Phantom! Rejecting connection.`);
          setError(`Cannot connect to Phantom via EVM. Please use Solana network for Phantom.`);
          unlockConnection();
          return;
        }
        
        // 🛑 CRITICAL: If connector is "injected" and Phantom is present, REJECT completely
        if (connector.id === 'injected' && typeof window !== 'undefined' && window.ethereum?.isPhantom) {
          console.error(`❌ [CRITICAL] Cannot use "injected" connector when Phantom is present!`);
          setError(`Cannot connect via injected connector when Phantom is present. Please ensure MetaMask is installed and try again, or use Solana network for Phantom.`);
          unlockConnection();
          return;
        }
        
        try {
          // 🛑 CRITICAL: DO NOT call window.solana.disconnect() here!
          // Calling disconnect() on Phantom can trigger a popup or a re-connection event
          // Instead, we just proceed with EVM connection and ignore Solana state
          console.log(`✅ [EVM] Proceeding with EVM connection (ignoring Solana state to avoid Phantom popup)`);
          
          // 🛑 CRITICAL: Final verification before connect
          if (typeof window !== 'undefined' && window.ethereum?.isPhantom && !window.ethereum.isMetaMask) {
            console.error(`❌ [CRITICAL] Only Phantom detected, no MetaMask! Cannot connect via EVM.`);
            setError(`Cannot connect to Phantom via EVM. Please use Solana network for Phantom.`);
            unlockConnection();
            return;
          }
          
          // 🛑 CRITICAL: If connector is "injected" and Phantom is present, we MUST have MetaMask too
          if (connector.id === 'injected' && typeof window !== 'undefined' && window.ethereum?.isPhantom) {
            // Check if MetaMask is ALSO present
            if (!window.ethereum.isMetaMask) {
              console.error(`❌ [CRITICAL] Cannot use "injected" connector - only Phantom detected, no MetaMask!`);
              setError(`Cannot connect via injected connector. Only Phantom is detected. Please install MetaMask or use Solana network for Phantom.`);
              unlockConnection();
              return;
            }
            // MetaMask is present, but we should prefer EIP6963 connector if available
            console.warn(`⚠️ [MetaMask] Using "injected" connector but Phantom is also present - this might cause conflicts!`);
          }
          
          console.log(`🔌 [EVM] Calling connect({ connector: ${connector.name}, id: ${connector.id} })...`);
          
          // 🛑 CRITICAL: DO NOT try to disconnect Phantom from window.ethereum!
          // Calling window.ethereum.disconnect() OPENS Phantom popup even if not connected
          // Instead, just connect to MetaMask and let wagmi handle the provider selection
          console.log(`🛡️ [MetaMask] Skipping Phantom disconnect - will rely on connector to use MetaMask`);
          
          // debug logs removed (too noisy in prod)
          
          // 🛡️ [PHANTOM-KILLER] Final check before we let Wagmi handle it
          if (walletName === 'MetaMask' && typeof window !== 'undefined') {
            try {
              let targetProvider = null;
              
              // 1. Try to find the real MetaMask in the providers array (Standard EIP-6963)
              if (window.ethereum?.providers) {
                // Prefer the REAL MetaMask provider: it usually exposes the _metamask namespace.
                targetProvider =
                  window.ethereum.providers.find(p => p?._metamask && p.isMetaMask && !p.isPhantom) ||
                  window.ethereum.providers.find(p => p.isMetaMask && !p.isPhantom);
              } 
              // 2. Fallback to window.ethereum ONLY if it's NOT Phantom
              else if (window.ethereum?.isMetaMask && !window.ethereum?.isPhantom) {
                targetProvider = window.ethereum;
              }
              
              if (targetProvider) {
                console.log('🛡️ [MetaMask] Explicit MetaMask provider found. Forcing popup...');
                // Force MetaMask to open FIRST using its own request method
                // This bypasses Wagmi's logic which might be hijacked by Phantom
                await targetProvider.request({ method: 'eth_requestAccounts' });
                console.log('🛡️ [MetaMask] Explicit popup triggered.');
                
                // Now that MetaMask is open and connected, we can call connect({ connector })
                // Wagmi will see that MetaMask is already active
              } else {
                console.warn('⚠️ [MetaMask] Real MetaMask provider not found. Phantom might be overriding everything.');
                // If we don't have a reliable MetaMask provider, we STOP here to avoid Phantom popup
                if (window.ethereum?.isPhantom) {
                  setError("MetaMask is not detected. Phantom is blocking the connection. Please go to Phantom Settings > 'EVM Support' and disable it to use MetaMask.");
                  unlockConnection();
                  return;
                }
              }
            } catch (primeErr) {
              console.warn('⚠️ [MetaMask] Pre-connection check failed:', primeErr);
              if (primeErr.code === 4001) {
                unlockConnection();
                return; // User rejected MetaMask
              }
            }
          }
          
          console.log(`🔌 [EVM] Calling final Wagmi connect({ connector: ${connector.name} })...`);
          await connect({ connector });
          
          // debug logs removed (too noisy in prod)
          
          console.log(`✅ [UnifiedWalletModal] Connected to ${connector.name}`);
          
          // 🛑 CRITICAL: Verify after connection that we didn't connect to Phantom
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait for connection to settle
          if (typeof window !== 'undefined' && window.ethereum?.isPhantom && !window.ethereum.isMetaMask) {
            console.error(`❌ [CRITICAL] Connected to Phantom instead of MetaMask! Disconnecting...`);
            try {
              await disconnectEVM();
              setError(`Phantom was connected instead of MetaMask. Please use Solana network for Phantom.`);
              unlockConnection();
              return;
            } catch (e) {
              console.error(`❌ Error disconnecting Phantom:`, e);
            }
          }
          
          // 🔄 FORCE SWITCH TO BSC after connection (CRITICAL for BITS token)
          // Use the connected wallet provider, NOT window.ethereum (can be Phantom in multi-wallet setups).
          const evmProvider = (await (connector?.getProvider?.().catch(() => null))) || (typeof window !== 'undefined' ? window.ethereum : null);
          if (evmProvider) {
            try {
              // Wait a bit for connection to settle
              await new Promise(resolve => setTimeout(resolve, 500));
              
              const currentChainId = await evmProvider.request({ method: 'eth_chainId' });
              const bscChainId = '0x38'; // BSC Mainnet (56)
              
              console.log(`🔍 [UnifiedWalletModal] Current chain: ${currentChainId}, Target: ${bscChainId}`);
              
              if (currentChainId !== bscChainId) {
                console.log(`🔄 [UnifiedWalletModal] FORCING switch to BSC (${bscChainId})...`);
                try {
                  await evmProvider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: bscChainId }],
                  });
                  console.log(`✅ [UnifiedWalletModal] Successfully switched to BSC`);
                  
                  // Wait for chain switch to complete
                  await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (switchErr) {
                  if (switchErr.code === 4902) {
                    // Chain not added, add it
                    console.log(`➕ [UnifiedWalletModal] BSC not in wallet, adding it...`);
                    await evmProvider.request({
                      method: 'wallet_addEthereumChain',
                      params: [{
                        chainId: bscChainId,
                        chainName: 'Binance Smart Chain',
                        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                        rpcUrls: ['https://bsc-dataseed.binance.org/'],
                        blockExplorerUrls: ['https://bscscan.com'],
                      }],
                    });
                    console.log(`✅ [UnifiedWalletModal] Added and switched to BSC`);
                  } else if (switchErr.code === 4001) {
                    console.warn(`⚠️ [UnifiedWalletModal] User rejected BSC switch`);
                  } else {
                    console.warn(`⚠️ [UnifiedWalletModal] Failed to switch to BSC:`, switchErr);
                  }
                }
              } else {
                console.log(`✅ [UnifiedWalletModal] Already on BSC`);
              }
            } catch (err) {
              console.warn(`⚠️ [UnifiedWalletModal] Error checking/switching chain:`, err);
            }
          }
          
          // Modal will close automatically via useEffect when isConnected becomes true
          // Don't close here to allow useEffect to handle it
        } catch (connectErr) {
          console.error(`❌ Connection error for ${walletName}:`, connectErr);
          unlockConnection();
          if (connectErr.code === 4001) {
            // User rejected
        setShowWalletModal(false);
      } else {
            setError(`${walletName} connection failed. Please try again.`);
          }
        }
      } else {
        // 🛑 CRITICAL: DO NOT fallback to Web3Modal - it will open Phantom!
        // Instead, show clear error message
        console.error(`❌ [CRITICAL] Connector ${walletName} not found! Cannot connect.`);
        unlockConnection();
        
        if (walletName === 'MetaMask') {
          // Special error for MetaMask
          if (typeof window !== 'undefined' && window.ethereum?.isPhantom && !window.ethereum.isMetaMask) {
            setError(`MetaMask connector not found. Phantom is detected but MetaMask is not installed. Please install MetaMask extension first, or use Solana network for Phantom.`);
          } else {
            setError(`MetaMask connector not found. Please ensure MetaMask extension is installed and refresh the page.`);
          }
        } else {
          setError(`${walletName} connector not found. Please ensure the wallet extension is installed and refresh the page.`);
        }
      }
    } catch (err) {
      console.error(`❌ Connection to ${walletName} failed:`, err);
      unlockConnection();
      const errorInfo = await handleConnectionError(err);
      
      if (errorInfo.retry) {
        setError(`${walletName} connection failed. Try "Clear Cache & Retry" button below.`);
      } else if (errorInfo.reason === 'user_rejected') {
        setShowWalletModal(false);
      } else {
        setError(`${walletName} connection failed. Please try again.`);
      }
    }
  };

  const handleEvmConnect = async (preferredWallet = null) => {
    try {
      // ✅ Mark explicit user intent so WalletContext won't treat this as auto-connect
      if (typeof markConnectIntent === 'function') markConnectIntent();

      // 🛑 CRITICAL: Verify we're on EVM network, not Solana
      if (selectedNetwork !== "EVM" && selectedNetwork !== null) {
        console.error(`❌ [EVM] ERROR: selectedNetwork is not EVM! It is: ${selectedNetwork}`);
        setError(`Invalid network selection. Please select EVM first.`);
        return;
      }

      console.log(`🔌 [handleEvmConnect] Called with wallet: ${preferredWallet}`);
      
      // 🛑 CRITICAL: We NO LONGER call disconnect() on Solana here to avoid triggering Phantom popup
      // The application state will be updated naturally once EVM connects
      
      // If a specific wallet is requested, try direct connection first
      if (preferredWallet) {
        console.log(`🔌 [handleEvmConnect] Calling connectToSpecificWallet('${preferredWallet}')...`);
        await connectToSpecificWallet(preferredWallet);
        return;
      }

      // 🛑 CRITICAL: DO NOT open Web3Modal directly - it will open Phantom!
      // Instead, show error that user must select a specific wallet
      console.error('❌ [CRITICAL] handleEvmConnect called without preferredWallet - this should not happen!');
      setError('Please select a specific wallet from the list above.');
      unlockConnection();
    } catch (err) {
      console.error('[WalletModal] EVM connection error:', err);
      const errorInfo = await handleConnectionError(err);
      
      if (errorInfo.retry) {
        setError('EVM connection failed. Try "Clear Cache & Retry" button below.');
      } else if (errorInfo.reason === 'user_rejected') {
        setShowWalletModal(false);
      } else {
        setError('EVM connection failed. Please try again.');
      }
    } finally {
      unlockConnection();
    }
  };

  // Helper function to get installation link for each wallet
  const getWalletInstallLink = (walletName) => {
    const walletNameLower = walletName.toLowerCase();
    const installLinks = {
      'phantom': 'https://phantom.app/',
      'solflare': 'https://solflare.com/',
      'torus': 'https://wallet.web3auth.io/', // Torus migrated to Web3Auth
      'nightly': 'https://wallet.nightly.app/',
      'mathwallet': 'https://mathwallet.org/',
      'coin98': 'https://chromewebstore.google.com/detail/coin98-wallet-extension-c/aeachknmefphepccionboohckonoeemg',
      'clover': 'https://chrome.google.com/webstore/detail/clover-wallet/nhnkbkgjikgcigadomkphalanndcapjk',
      'coinbase': 'https://www.coinbase.com/wallet',
      'trust': 'https://trustwallet.com/',
      'metamask': 'https://metamask.io/',
      'rainbow': 'https://rainbow.me/',
      'binance': 'https://www.binance.com/en/web3wallet'
    };
    
    // Try exact match first
    if (installLinks[walletNameLower]) {
      return installLinks[walletNameLower];
    }
    
    // Try partial match
    for (const [key, value] of Object.entries(installLinks)) {
      if (walletNameLower.includes(key) || key.includes(walletNameLower)) {
        return value;
      }
    }
    
    // Default fallback
    return null;
  };

  const handleSolanaConnect = async (walletName) => {
    try {
      // 🛑 CRITICAL: Prevent any Web3Modal calls for Solana
      console.log(`🔌 [Solana] ===== STARTING SOLANA CONNECTION =====`);
      console.log(`🔌 [Solana] Wallet: ${walletName}`);
      console.log(`🔌 [Solana] Selected Network: ${selectedNetwork}`);
      
      // Declare walletNameLower once at the start
      const walletNameLower = walletName.toLowerCase();
      
      // 🛑 CRITICAL: Double-check we're not accidentally on EVM or WEB3 network
      if (selectedNetwork !== "SOLANA") {
        console.error(`❌ [Solana] ERROR: selectedNetwork is not SOLANA! It is: ${selectedNetwork}`);
        setError(`Invalid network selection. Please select Solana first.`);
        unlockConnection();
        return;
      }
      
      // 🛑 CRITICAL: Ensure we're not accidentally calling EVM functions
      if (typeof window !== 'undefined' && window.ethereum && !window.ethereum.isPhantom) {
        console.warn(`⚠️ [Solana] window.ethereum detected but we're connecting to Solana - this is OK`);
      }
      
      // 🛑 CRITICAL: Ensure Web3Modal is NOT opened for Solana
      console.log(`🛡️ [Solana] Ensuring Web3Modal is NOT opened for Solana connection...`);
      
      setError(null);
      setIsConnecting(true);
      
      console.log(`🔌 [Solana] Attempting to connect to: ${walletName}`);
      console.log(`🔌 [Solana] Available wallets:`, solanaWallets.map(w => w.adapter.name));
      
      const wallet = solanaWallets.find(w => w.adapter.name === walletName);
      if (!wallet) {
        console.error(`❌ [Solana] Wallet ${walletName} not found in list`);
        setError(`${walletName} wallet not found.`);
        unlockConnection();
        return;
      }

      // Check if already connected to this wallet
      if (isSolanaConnected && selectedSolanaWallet?.adapter?.name === walletName && solanaPublicKey) {
        console.log(`✅ [Solana] Already connected to ${walletName}:`, solanaPublicKey.toBase58());
        setShowWalletModal(false);
        setSelectedNetwork(null);
        unlockConnection();
        return;
      }

      // Check wallet state
      const isInstalled = wallet.readyState === 'Installed';
      const isLoadable = wallet.readyState === 'Loadable';
      const isNotDetected = wallet.readyState === 'NotDetected';
      
      console.log(`🔌 [Solana] Wallet state: ${wallet.readyState} (Installed: ${isInstalled}, Loadable: ${isLoadable}, NotDetected: ${isNotDetected})`);
      
      // For Phantom, also check window.solana directly
      if (walletName.toLowerCase() === 'phantom') {
        const hasPhantom = typeof window !== 'undefined' && (window.solana?.isPhantom || window.phantom?.solana);
        console.log(`🔌 [Phantom] Direct detection: window.solana=${!!window.solana}, window.phantom=${!!window.phantom}`);
        
        if (!hasPhantom && isNotDetected) {
          setError(`Phantom is not available. Please install the Phantom extension first.`);
          unlockConnection();
          return;
        }
      } else {
        // For all other wallets, check if they're available
        // If NotDetected, show helpful message with install link
        if (!isInstalled && !isLoadable && isNotDetected) {
          console.warn(`⚠️ [${walletName}] Wallet not detected - may not be installed`);
          const installLink = getWalletInstallLink(walletName);
          
          if (installLink) {
            setError(`${walletName} extension is not installed. Please install ${walletName} from ${installLink}, unlock it, refresh the page, and try again.`);
          } else {
            setError(`${walletName} is not available. Please install the ${walletName} extension first, unlock it, refresh the page, and try again.`);
          }
          unlockConnection();
          return;
        }
      }

      console.log(`🔌 [Solana] Connecting to ${walletName} (State: ${wallet.readyState})`);

      // ✅ CRITICAL FIX: connect via Solana Wallet Adapter so React state updates (connected/publicKey)
      // Also preserve user-gesture: call connectSolanaWallet() immediately, do not await anything before it.
      if (walletNameLower === 'phantom') {
        try {
          // Select wallet in adapter context (sync)
          selectSolanaWallet(wallet.adapter.name);
        } catch (_) {}

        // Call adapter connect immediately (this should trigger Phantom popup within user gesture)
        const solanaConnectPromise = connectSolanaWallet();

        // Cleanup EVM in background (do not await)
        try { if (isConnected || address) disconnectEVM().catch(() => {}); } catch (_) {}
        try {
          sessionStorage.removeItem('wallet_pending_request');
          sessionStorage.removeItem('wagmi.connector');
          localStorage.removeItem('wagmi.recentConnectorId');
        } catch (_) {}

        try {
          await solanaConnectPromise;

          // Some users only "unlock" Phantom (password) without approving site access.
          // Wait briefly for wallet-adapter state to update; then fallback to provider.connect as a second strategy.
          const waitForPk = async (timeoutMs = 2500) => {
            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
              const pkCandidate =
                selectedSolanaWallet?.adapter?.publicKey ||
                solanaPublicKey ||
                wallet?.adapter?.publicKey ||
                (typeof window !== 'undefined'
                  ? (window.phantom?.solana?.publicKey || window.solana?.publicKey)
                  : null);
              if (pkCandidate) return pkCandidate;
              await new Promise((r) => setTimeout(r, 150));
            }
            return null;
          };

          let pk = await waitForPk(2500);

          // Fallback: direct provider connect (can re-trigger approval popup)
          if (!pk && typeof window !== 'undefined') {
            const provider = window.phantom?.solana || window.solana;
            if (provider?.isPhantom && typeof provider.connect === 'function') {
              try {
                await provider.connect({ onlyIfTrusted: false });
              } catch (_) {
                // ignore: will show friendly error below
              }
              pk = await waitForPk(1500);
            }
          }

          if (!pk) {
            setError(
              'Phantom unlocked, but the site still did not receive a Solana public key. ' +
              'In Phantom, approve the connection for bits-ai.io (Allow/Connect). ' +
              'If it still won’t open, click "Force Reconnect (Solana)" below.'
            );
            unlockConnection();
            return;
          }

          // Success: close modal
          setShowWalletModal(false);
          setSelectedNetwork(null);
          unlockConnection();
          return;
        } catch (err) {
          const msg = err?.message || String(err);
          console.error('❌ [Phantom] Solana connect failed:', err);
          if (err?.code === 4001 || /reject|cancel/i.test(msg)) {
            unlockConnection();
            return;
          }
          setError(`Phantom (Solana) connection failed: ${msg}`);
          unlockConnection();
          return;
        }
      }

      // For non-Phantom wallets, continue with adapter flow below.
      
      // For other wallets, use adapter connection
      console.log(`🔌 [Solana] Selecting wallet: ${wallet.adapter.name}`);
      console.log(`🔌 [Solana] Wallet adapter:`, wallet.adapter);
      console.log(`🔌 [Solana] Wallet readyState:`, wallet.readyState);
      
      // Special handling for wallets that might have detection issues
      if (walletNameLower === 'clover' || walletNameLower === 'coin98' || walletNameLower === 'torus' || 
          walletNameLower === 'nightly' || walletNameLower === 'mathwallet') {
        console.log(`🟢 [${walletName}] Special handling for ${walletName} wallet...`);
        console.log(`🔍 [${walletName}] Wallet readyState: ${wallet.readyState}`);
        
        // If wallet is NotDetected, it's likely not installed
        // Prevent adapter from opening external sites by showing error early
        if (wallet.readyState === 'NotDetected') {
          console.warn(`⚠️ [${walletName}] ${walletName} not detected - likely not installed`);
          const installLink = getWalletInstallLink(walletName);
          
          // Special message for Torus (uses social login, not extension)
          if (walletNameLower === 'torus') {
            if (installLink) {
              setError(`Torus wallet is not available. Torus uses social login (Google, Facebook, Email) and has migrated to ${installLink}. Please visit the site to create an account, then try connecting again.`);
            } else {
              setError(`Torus wallet is not available. Torus uses social login (Google, Facebook, Email). Please visit wallet.web3auth.io to create an account, then try connecting again.`);
            }
          } else {
            if (installLink) {
              setError(`${walletName} extension is not installed. Please install ${walletName} from ${installLink}, unlock it, refresh the page, and try again.`);
            } else {
              setError(`${walletName} extension is not installed. Please install the ${walletName} extension, unlock it, refresh the page, and try again.`);
            }
          }
          unlockConnection();
          return; // Stop here to prevent adapter from opening external sites
        } else if (wallet.readyState === 'Loadable') {
          console.log(`⏳ [${walletName}] ${walletName} is loadable, waiting for it to be ready...`);
          // Wait a bit longer for wallet to be ready
          // Torus might need more time as it uses social login
          const waitTime = walletNameLower === 'torus' ? 2000 : 1500;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (wallet.readyState === 'Installed') {
          console.log(`✅ [${walletName}] ${walletName} is installed and ready`);
          // For Torus, even if "Installed", it might need account setup
          if (walletNameLower === 'torus') {
            console.log(`ℹ️ [Torus] Torus is detected - make sure you have a Web3Auth account set up`);
          }
        }
      }
      
      // Select the wallet (UI/state), but DO NOT rely on selectedSolanaWallet immediately (async state update)
      selectSolanaWallet(wallet.adapter.name);

      // ✅ CRITICAL FIX (Torus/others): connect the EXACT adapter the user clicked
      // This avoids a race condition where connectSolanaWallet() might connect the previously selected wallet (often Phantom).
      try {
        console.log(`🔌 [Solana] Connecting via adapter directly for: ${wallet.adapter.name}`);

        // Some adapters need a tiny delay after selection
        const needsMoreTime = ['clover', 'coin98', 'torus', 'nightly', 'mathwallet'].includes(walletNameLower);
        const waitTime = walletNameLower === 'torus' ? 800 : (needsMoreTime ? 300 : 100);
        await new Promise(resolve => setTimeout(resolve, waitTime));

        // 🛑 CRITICAL: Prevent infinite loading if Torus/Web3Auth popup is blocked or never resolves
        const connectTimeoutMs = walletNameLower === 'torus' ? 45000 : 20000;
        const connectWithTimeout = Promise.race([
          wallet.adapter.connect(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('WALLET_CONNECT_TIMEOUT')), connectTimeoutMs)
          ),
        ]);

        await connectWithTimeout;

        const pk = wallet.adapter.publicKey;
        if (!pk) {
          setError(`Connected to ${walletName} but publicKey is not available. Please try again.`);
          unlockConnection();
          return;
        }

        console.log(`✅ [Solana] Connected to ${walletName}. PublicKey: ${pk.toBase58()}`);

        setTimeout(() => {
          setShowWalletModal(false);
          setSelectedNetwork(null);
          unlockConnection();
        }, 500);
      } catch (connectError) {
        // Ensure we never stay stuck in the loading overlay
        unlockConnection();

        // Timeout hint (common with Torus: popup blocked / login not completed)
        const msg = String(connectError?.message || '');
        if (msg === 'WALLET_CONNECT_TIMEOUT') {
          setError(
            walletNameLower === 'torus'
              ? 'Torus connection timed out. Please allow popups, complete the Web3Auth login window, then try again.'
              : `${walletName} connection timed out. Please try again.`
          );
          return;
        }

        // Handle connection errors - LOG EVERYTHING
        console.error(`❌ Connection error for ${walletName}:`, connectError);
        console.error(`❌ Error details:`, {
          message: connectError?.message,
          code: connectError?.code,
          name: connectError?.name,
          stack: connectError?.stack,
          toString: connectError?.toString(),
          fullError: connectError
        });
        
        // Extract error message
        let errorMessage = 'Unknown error';
        if (connectError?.message) {
          errorMessage = connectError.message;
        } else if (connectError?.toString) {
          errorMessage = connectError.toString();
        } else if (typeof connectError === 'string') {
          errorMessage = connectError;
        }
        
        console.log(`🔍 [Solana] Extracted error message: "${errorMessage}"`);
        
        // Special handling for WalletNotReadyError (common with various wallets)
        if (errorMessage.includes('WalletNotReadyError') || errorMessage.includes('not ready') || 
            connectError?.name === 'WalletNotReadyError' || connectError?.constructor?.name === 'WalletNotReadyError') {
          console.warn(`⚠️ [Solana] WalletNotReadyError detected for ${walletName}`);
          
          const installLink = getWalletInstallLink(walletName);
          
          // For wallets that commonly have this issue, show helpful message with install link
          if (walletNameLower === 'clover' || walletNameLower === 'coin98' || walletNameLower === 'torus' || 
              walletNameLower === 'nightly' || walletNameLower === 'mathwallet') {
            console.error(`❌ [${walletName}] WalletNotReadyError - ${walletName} extension likely not installed or not ready`);
            
            // Special message for Torus (uses social login)
            if (walletNameLower === 'torus') {
              if (installLink) {
                setError(`Torus wallet is not ready. Torus uses social login (Google, Facebook, Email) and has migrated to ${installLink}. Please visit the site to create an account, then refresh the page and try connecting again. If the problem persists, Torus may not be fully compatible with this dApp.`);
              } else {
                setError(`Torus wallet is not ready. Torus uses social login (Google, Facebook, Email). Please visit wallet.web3auth.io to create an account, then refresh the page and try connecting again. If the problem persists, Torus may not be fully compatible with this dApp.`);
              }
            } else {
              if (installLink) {
                setError(`${walletName} extension is not installed or not ready. Please install ${walletName} from ${installLink}, unlock it, refresh the page, and try again. If the problem persists, ${walletName} may not be fully compatible with this dApp.`);
              } else {
                setError(`${walletName} extension is not installed or not ready. Please install the ${walletName} extension, unlock it, refresh the page, and try again. If the problem persists, ${walletName} may not be fully compatible with this dApp.`);
              }
            }
            unlockConnection();
            return;
          } else {
            // For other wallets, show generic message with install link if available
            if (installLink) {
              setError(`${walletName} wallet is not ready. Please ensure ${walletName} extension is installed from ${installLink}, unlocked, and refresh the page, then try again.`);
            } else {
              setError(`${walletName} wallet is not ready. Please ensure the ${walletName} extension is installed and unlocked, refresh the page, then try again.`);
            }
            unlockConnection();
            return;
          }
        }
        
        if (errorMessage.includes('User rejected') || connectError?.code === 4001 || errorMessage.includes('user rejected')) {
          // User rejected - don't show error
          console.log(`ℹ️ [Solana] User rejected connection`);
          setShowWalletModal(false);
          unlockConnection();
        } else if (errorMessage.includes('not installed') || errorMessage.includes('not found') || errorMessage.includes('not available')) {
          setError(`${walletName} extension not found. Please install it first.`);
          unlockConnection();
        } else if (walletNameLower === 'torus' && 
                   (errorMessage.includes('Unable to find any account') || errorMessage.includes('account') || 
                    errorMessage.includes('no account') || errorMessage.includes('account not found'))) {
          // Special handling for Torus - requires social login setup
          const installLink = getWalletInstallLink('torus');
          if (installLink) {
            setError(`Torus requires social login (Google, Facebook, Email). Please visit ${installLink} to create an account first, then refresh the page and try connecting again.`);
          } else {
            setError(`Torus requires social login (Google, Facebook, Email). Please visit wallet.web3auth.io to create an account first, then refresh the page and try connecting again.`);
          }
          unlockConnection();
        } else {
          // Show the actual error message
          const cleanMsg = errorMessage.includes('Unable to find any account') 
            ? 'Please complete the authentication process first.'
            : errorMessage;
          setError(`${walletName} connection failed: ${cleanMsg}`);
          unlockConnection();
        }
      }
    } catch (error) {
      console.error("❌ Error in handleSolanaConnect:", error);
      setError(`Failed to connect to ${walletName}. Please try again.`);
      unlockConnection();
    }
  };

  return (
    <div className="unified-wallet-modal-overlay" onClick={handleClose}>
      <div className="unified-wallet-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleClose}>✖</button>
        
        {isConnecting && (
          <div className="connecting-overlay">
            <div className="loading-spinner"></div>
            <p>Initializing connection...</p>
          </div>
        )}
        
        {!selectedNetwork ? (
          // Step 1: Network Selection
          <>
            <h2 className="modal-title">Select Network</h2>
            <p className="modal-subtitle">Choose which blockchain to connect</p>
            
            <div className="network-grid">
              <button 
                className="network-card evm-card"
                onClick={() => setSelectedNetwork("EVM")}
                title="Direct EVM wallet connections - Fast & secure"
              >
                <div className="network-icon-wrapper">
                  <img src={evmIcon} alt="EVM" className="network-icon-img" />
                </div>
                <div className="network-info">
                  <div className="network-name">EVM Direct</div>
                  <div className="network-chains">MetaMask, Trust, Coinbase</div>
                  <div className="network-chains">Rabby, Binance, Phantom EVM</div>
                  <div 
                    className="network-tooltip"
                    onMouseEnter={(e) => {
                      const tooltip = e.currentTarget.querySelector('.tooltip-content');
                      const icon = e.currentTarget.querySelector('.info-icon');
                      if (tooltip && icon) {
                        const iconRect = icon.getBoundingClientRect();
                        tooltip.style.left = `${iconRect.left + iconRect.width / 2}px`;
                        tooltip.style.top = `${iconRect.top - 8}px`;
                        tooltip.style.transform = 'translate(-50%, -100%)';
                      }
                    }}
                  >
                    <span className="info-icon">ℹ️</span>
                    <div className="tooltip-content">
                      <div className="tooltip-header">
                        <div className="tooltip-icons">
                          <span className="tooltip-icon">🔷</span>
                          <span className="tooltip-icon">💎</span>
                          <span className="tooltip-icon">🔵</span>
                        </div>
                        <strong>EVM Direct Connections</strong>
                      </div>
                      <div className="tooltip-body">
                        Connect directly to popular EVM wallets. Supports BSC, Ethereum, Polygon, Arbitrum, Optimism, Base, and Avalanche. Auto-switches to BSC after connection.
                        <br/><br/>
                        <strong>⚠️ Phantom EVM:</strong> Use this for Phantom's Ethereum/BSC support (window.ethereum.isPhantom).
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              <button 
                className="network-card solana-card"
                onClick={() => setSelectedNetwork("SOLANA")}
                title="Direct Solana wallet connections"
              >
                <div className="network-icon-wrapper">
                   <img src={solanaIcon} alt="Solana" className="network-icon-img" />
                </div>
                <div className="network-info">
                  <div className="network-name">Solana Direct</div>
                  <div className="network-chains">Phantom Solana, Solflare</div>
                  <div className="network-chains">Torus, Nightly, Math</div>
                  <div 
                    className="network-tooltip"
                    onMouseEnter={(e) => {
                      const tooltip = e.currentTarget.querySelector('.tooltip-content');
                      const icon = e.currentTarget.querySelector('.info-icon');
                      if (tooltip && icon) {
                        const iconRect = icon.getBoundingClientRect();
                        tooltip.style.left = `${iconRect.left + iconRect.width / 2}px`;
                        tooltip.style.top = `${iconRect.top - 8}px`;
                        tooltip.style.transform = 'translate(-50%, -100%)';
                      }
                    }}
                  >
                    <span className="info-icon">ℹ️</span>
                    <div className="tooltip-content">
                      <div className="tooltip-header">
                        <div className="tooltip-icons">
                          <span className="tooltip-icon">⚡</span>
                          <span className="tooltip-icon">💜</span>
                          <span className="tooltip-icon">🚀</span>
                        </div>
                        <strong>Solana Direct Connections</strong>
                      </div>
                      <div className="tooltip-body">
                        Connect directly to Solana wallets. Supports SPL tokens, Solana Pay, and fast transactions with low fees on Solana Mainnet.
                        <br/><br/>
                        <strong>⚠️ Phantom Solana:</strong> Use this for Phantom's Solana support (window.solana.isPhantom).
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              <button 
                className="network-card web3-card"
                onClick={() => {
                  // Open Web3Modal directly and close this custom modal to avoid overlap
                  try { if (typeof markConnectIntent === 'function') markConnectIntent(); } catch (_) {}
                  setShowWalletModal(false);
                  setSelectedNetwork(null);
                  window.setTimeout(() => {
                    openEvmModal().catch(() => {});
                  }, 50);
                }}
                title="All wallets via Web3Modal"
              >
                <div className="network-icon-wrapper">
                  <img src={walletConnectLogo} alt="Web3" className="network-icon-img" />
                </div>
                <div className="network-info">
                  <div className="network-name">Web3Modal</div>
                  <div className="network-chains">350+ Wallets</div>
                  <div className="network-chains">All Networks</div>
                  <div 
                    className="network-tooltip"
                    onMouseEnter={(e) => {
                      const tooltip = e.currentTarget.querySelector('.tooltip-content');
                      const icon = e.currentTarget.querySelector('.info-icon');
                      if (tooltip && icon) {
                        const iconRect = icon.getBoundingClientRect();
                        tooltip.style.left = `${iconRect.left + iconRect.width / 2}px`;
                        tooltip.style.top = `${iconRect.top - 8}px`;
                        tooltip.style.transform = 'translate(-50%, -100%)';
                      }
                    }}
                  >
                    <span className="info-icon">ℹ️</span>
                    <div className="tooltip-content">
                      <div className="tooltip-header">
                        <div className="tooltip-icons">
                          <span className="tooltip-icon">🔐</span>
                          <span className="tooltip-icon">🌐</span>
                          <span className="tooltip-icon">⭐</span>
                        </div>
                        <strong>Web3Modal - Universal Wallet</strong>
                      </div>
                      <div className="tooltip-body">
                        Access 350+ wallets including Ledger, Trezor, WalletConnect, and more. Supports all EVM chains and Solana. Best for hardware wallets and advanced users.
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </>
        ) : selectedNetwork === "EVM" ? (
          // Step 2a: EVM Wallet Selection
          <>
            <button className="back-btn" onClick={() => setSelectedNetwork(null)}>← Back</button>
            <h2 className="modal-title">Connect EVM Wallet</h2>
            <p className="modal-subtitle">Supports 7+ blockchains - Auto-switch enabled</p>

            
            
            <div className="wallet-list">
              {/* 🦊 [EIP-6963] Dinamic detected wallets */}
              {filteredConnectors
                .filter(c => c.id !== 'injected' && c.id !== 'walletConnect' && c.id !== 'coinbaseWalletSDK')
                .map((connector) => (
                  <button 
                    key={connector.id}
                    className="wallet-option"
                    onClick={() => {
                      if (isConnecting) return;
                      // We can connect directly via the connector object for EIP-6963 wallets
                      setError(null);
                      setIsConnecting(true);
                      if (typeof markConnectIntent === 'function') markConnectIntent();
                      connect({ connector });
                    }}
                  >
                    <img src={connector.icon || evmIcon} alt={connector.name} />
                    <span>{connector.name}</span>
                    <small className="detected-badge">Detected</small>
                  </button>
                ))
              }

              {/* Standard fallbacks if not detected via EIP-6963 */}
              {!filteredConnectors.some(c => c.id === 'io.metamask' || c.id === 'metamask') && (
                <button className="wallet-option" onClick={() => handleEvmConnect('MetaMask')}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" />
                  <span>MetaMask</span>
                </button>
              )}

              <button className="wallet-option" onClick={() => handleEvmConnect('WalletConnect')}>
                <img src={walletConnectLogo} alt="WalletConnect" />
                <span>WalletConnect</span>
              </button>

              {!filteredConnectors.some(c => c.id === 'coinbaseWalletSDK') && (
                <button className="wallet-option" onClick={() => handleEvmConnect('Coinbase')}>
                  <img src="https://avatars.githubusercontent.com/u/18060234?s=200&v=4" alt="Coinbase" />
                  <span>Coinbase Wallet</span>
                </button>
              )}

              <button className="wallet-option" onClick={() => handleEvmConnect('Binance')}>
                <img src={binanceLogo} alt="Binance Web3" />
                <span>Binance Web3</span>
              </button>
            </div>
          </>
        ) : (
          // Step 2b: Solana Wallet Selection
          <>
            <button className="back-btn" onClick={() => setSelectedNetwork(null)}>← Back</button>
            <h2 className="modal-title">Connect Solana Wallet</h2>
            <p className="modal-subtitle">Supports SPL tokens & Solana Pay</p>
            
            <div className="wallet-list">
              {(() => {
                // Debug: Log all wallets
                console.log(`🔍 [Solana] Total wallets in list: ${solanaWallets.length}`);
                console.log(`🔍 [Solana] All wallets:`, solanaWallets.map(w => ({
                  name: w.adapter.name,
                  readyState: w.readyState,
                  icon: w.adapter.icon
                })));
                
                // Filter Solana wallets
                const filterSolanaWallets = (w) => {
                  const walletName = w.adapter.name.toLowerCase();
                  const solanaWalletNames = ['phantom', 'solflare', 'solana', 'torus', 'nightly', 'mathwallet', 'coin98', 'clover'];
                  const evmWalletNames = ['trust', 'metamask', 'coinbase', 'rainbow', 'binance'];
                  
                  const isSolanaWallet = solanaWalletNames.some(name => walletName.includes(name));
                  const isEvmWallet = evmWalletNames.some(name => walletName.includes(name));
                  
                  // For Phantom, also check window.solana directly if readyState is NotDetected
                  if (walletName.includes('phantom')) {
                    const hasPhantom = typeof window !== 'undefined' && (window.solana?.isPhantom || window.phantom?.solana);
                    if (hasPhantom) {
                      console.log(`✅ [Solana] Phantom detected directly via window.solana`);
                      return true; // Show Phantom even if readyState is NotDetected
                    }
                  }
                  
                  // For Clover, always show it even if NotDetected (some wallets have detection issues)
                  if (walletName.includes('clover')) {
                    console.log(`✅ [Solana] Showing Clover wallet (detection may be unreliable, but user can try)`);
                    return isSolanaWallet && !isEvmWallet; // Show Clover regardless of readyState
                  }
                  
                  // Only show if it's a Solana wallet and not an EVM wallet
                  const shouldShow = (w.readyState === 'Installed' || w.readyState === 'Loadable' || w.readyState === 'NotDetected') && 
                                   isSolanaWallet && !isEvmWallet;
                  
                  if (shouldShow) {
                    console.log(`✅ [Solana] Showing wallet: ${w.adapter.name} (${w.readyState})`);
                  }
                  
                  return shouldShow;
                };
                
                // Separate wallets into INSTALLED and NOT INSTALLED
                const allFilteredWallets = solanaWallets.filter(filterSolanaWallets);
                const installedWallets = allFilteredWallets.filter(w => w.readyState === 'Installed');
                const otherWallets = allFilteredWallets.filter(w => w.readyState !== 'Installed');
                
                console.log(`🟢 [Solana] INSTALLED wallets: ${installedWallets.length}`, installedWallets.map(w => w.adapter.name));
                console.log(`📱 [Solana] OTHER wallets: ${otherWallets.length}`, otherWallets.map(w => w.adapter.name));
                
                // Render wallet button
                const renderWalletButton = (wallet) => (
                  <button 
                    key={wallet.adapter.name}
                    className={`wallet-option ${wallet.readyState === 'Installed' ? 'wallet-installed' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log(`🔌 [Solana] Clicked on wallet: ${wallet.adapter.name}`);
                      if (selectedNetwork !== "SOLANA") {
                        console.error(`❌ [Solana] Wrong network selected: ${selectedNetwork}`);
                        setError('Please select Solana network first');
                        return;
                      }
                      if (isConnecting) {
                        console.warn(`⚠️ [Solana] Already connecting, ignoring click`);
                        return;
                      }
                      handleSolanaConnect(wallet.adapter.name);
                    }}
                  >
                    <img src={wallet.adapter.icon} alt={wallet.adapter.name} />
                    <span>{wallet.adapter.name}</span>
                    {wallet.readyState === 'Installed' && <span className="wallet-badge">🟢 Ready</span>}
                  </button>
                );
                
                return (
                  <>
                    {installedWallets.length > 0 && (
                      <>
                        <div className="wallet-section-title">🟢 INSTALLED</div>
                        {installedWallets.map(renderWalletButton)}
                      </>
                    )}
                    {otherWallets.length > 0 && (
                      <>
                        {installedWallets.length > 0 && <div className="wallet-section-divider"></div>}
                        <div className="wallet-section-title">📱 ALL WALLETS</div>
                        {otherWallets.map(renderWalletButton)}
                      </>
                    )}
                  </>
                );
              })()}
              {solanaWallets
                .filter(w => {
                  const walletName = w.adapter.name.toLowerCase();
                  const solanaWalletNames = ['phantom', 'solflare', 'solana', 'torus', 'nightly', 'mathwallet', 'coin98', 'clover'];
                  const evmWalletNames = ['trust', 'metamask', 'coinbase', 'rainbow', 'binance'];
                  const isSolanaWallet = solanaWalletNames.some(name => walletName.includes(name));
                  const isEvmWallet = evmWalletNames.some(name => walletName.includes(name));
                  
                  // For Phantom, check window.solana directly
                  if (walletName.includes('phantom')) {
                    const hasPhantom = typeof window !== 'undefined' && (window.solana?.isPhantom || window.phantom?.solana);
                    if (hasPhantom) return false; // Don't show "no wallets" if Phantom exists
                  }
                  
                  return (w.readyState === 'Installed' || w.readyState === 'Loadable' || w.readyState === 'NotDetected') && 
                         isSolanaWallet && !isEvmWallet;
                }).length === 0 && (
                <div className="no-wallets">
                  <p>No Solana wallets detected</p>
                  <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" className="install-link">
                    Install Phantom →
                  </a>
                </div>
              )}
            </div>
          </>
        )}

        {/* 🔧 Error message */}
        {error && (
          <div className="wallet-error-box" style={{
            background: 'rgba(255, 100, 100, 0.1)',
            border: '1px solid rgba(255, 100, 100, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '16px',
            color: '#ff6464',
            fontSize: '0.9rem',
            textAlign: 'left',
            lineHeight: '1.5'
          }}>
            ⚠️ <span dangerouslySetInnerHTML={{ __html: error.replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #14F195; text-decoration: underline; word-break: break-all;">$1</a>') }} />
            {selectedNetwork === "SOLANA" && (
              <button
                type="button"
                className="wallet-reset-btn"
                style={{ marginTop: 12, width: "100%" }}
                onClick={async () => {
                  try {
                    // Force reconnect (helps when Phantom was only unlocked, not approved)
                    await disconnectSolanaWallet().catch(() => {});
                    await new Promise((r) => setTimeout(r, 200));
                    setError(null);
                    setIsConnecting(true);
                    await connectSolanaWallet();
                  } catch (e) {
                    setError(`Force reconnect failed: ${e?.message || String(e)}`);
                  } finally {
                    unlockConnection();
                  }
                }}
              >
                Force Reconnect (Solana)
              </button>
            )}
          </div>
        )}

        {/* 🔧 Disconnect Solana/Phantom Button (if connected) */}
        {isSolanaConnected && (
          <button
            onClick={async () => {
              try {
                console.log('🔌 [UnifiedWalletModal] Disconnecting Solana wallet...');
                await disconnectSolanaWallet();
                
                // Also disconnect via window.solana directly
                if (typeof window !== 'undefined' && window.solana?.isPhantom && window.solana.isConnected) {
                  try {
                    await window.solana.disconnect();
                    console.log('✅ [UnifiedWalletModal] Phantom disconnected via window.solana');
                  } catch (e) {
                    console.warn('⚠️ [UnifiedWalletModal] Phantom disconnect error:', e);
                  }
                }
                
                // Clear all Solana-related localStorage
                Object.keys(localStorage).forEach(key => {
                  if (key.toLowerCase().includes('solana') || key.toLowerCase().includes('phantom')) {
                    localStorage.removeItem(key);
                  }
                });
                
                console.log('✅ [UnifiedWalletModal] Solana wallet disconnected');
              } catch (e) {
                console.error('❌ [UnifiedWalletModal] Error disconnecting Solana:', e);
              }
            }}
            className="clear-cache-btn"
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(153, 69, 255, 0.15)',
              border: '1px solid rgba(153, 69, 255, 0.4)',
              borderRadius: '12px',
              color: '#9965ff',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            🔓 Disconnect Solana/Phantom
          </button>
        )}

        {/* 🔧 Clear Cache & Retry Button */}
        <button
          onClick={hardReset} // Use HARD RESET
          className="clear-cache-btn"
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(255, 50, 50, 0.15)',
            border: '1px solid rgba(255, 50, 50, 0.4)',
            borderRadius: '12px',
            color: '#ff6464',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          🧨 Total Connection Reset (Fix)
        </button>

        {/* Info text */}
        <p style={{fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '12px', textAlign: 'center', lineHeight: '1.4'}}>
          {isSolanaConnected ? 'Click "Disconnect Solana/Phantom" to disconnect. ' : ''}
          If you receive the "Request Pending" error or cannot connect, click the red button above.
        </p>
      </div>
    </div>
  );
};

export default UnifiedWalletModal;

