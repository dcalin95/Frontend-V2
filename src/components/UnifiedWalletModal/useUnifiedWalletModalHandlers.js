import { useCallback } from 'react';
import { useConnect } from 'wagmi';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWallet } from '../../context/WalletContext';
import { forceFixPhantomHijack, forcePickEvmInjectedProvider } from '../../utils/walletFilter';
import { STORAGE_KEYS, MODAL_LABELS } from './constants';
import { mapWagmiErrorToMessage } from './mapWagmiErrorToMessage';

export function useUnifiedWalletModalHandlers(setShowWalletModal, setError, setConnecting, setInfoMessage) {
  const { connect, connectors } = useConnect();
  const { walletModalOpenChain: openChain } = useWallet();
  const { select: selectSolanaWallet, connect: connectSolana } = useSolanaWallet();

  const handleClose = useCallback(() => {
    setShowWalletModal(false);
    setError(null);
    setConnecting(false);
    if (setInfoMessage) setInfoMessage(null);
  }, [setShowWalletModal, setError, setConnecting, setInfoMessage]);

  const pickPreferredConnector = useCallback((requestedProvider, fallbackConnector) => {
    const pref = String(requestedProvider || '').toLowerCase();
    if (!pref) return fallbackConnector;
    const list = Array.isArray(connectors) ? connectors : [];
    const byRdns = (rdns) => list.find((c) => String(c?.id || '') === rdns) || null;
    const genericInjected = list.find((c) => String(c?.id || '') === 'injected') || null;

    if (pref === 'metamask') return byRdns('io.metamask') || genericInjected || fallbackConnector;
    if (pref === 'trust') return byRdns('com.trustwallet.app') || genericInjected || fallbackConnector;
    if (pref === 'coinbase') {
      const byCb = list.find((c) => String(c?.name || '').toLowerCase().includes('coinbase'));
      return byRdns('com.coinbase.wallet') || byCb || genericInjected || fallbackConnector;
    }
    if (pref === 'binance') return byRdns('binance-web3') || fallbackConnector;
    return fallbackConnector;
  }, [connectors]);

  const handleEvmConnect = useCallback(async (connector, preferredProvider = null) => {
    setError(null);
    setConnecting(true);
    try {
      try {
        forceFixPhantomHijack();
      } catch (_) {}

      try {
        const pref = String(preferredProvider || '').toLowerCase();
        if (pref === 'metamask') forcePickEvmInjectedProvider('metamask');
        else if (pref === 'trust') forcePickEvmInjectedProvider('trust');
        else if (pref === 'coinbase') forcePickEvmInjectedProvider('coinbase');
        else if (pref === 'binance') forcePickEvmInjectedProvider('binance');
      } catch (_) {}

      if (String(connector?.name || '').toLowerCase().includes('trust') || String(connector?.id || '').toLowerCase().includes('trust') || preferredProvider === 'trust') {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      const connectorToUse = pickPreferredConnector(preferredProvider, connector);
      const nameForStorage =
        preferredProvider === 'metamask'
          ? 'MetaMask'
          : preferredProvider === 'trust'
            ? 'Trust Wallet'
            : preferredProvider === 'coinbase'
              ? 'Coinbase Wallet'
              : preferredProvider === 'binance'
                ? 'Binance Web3 Wallet'
                : connectorToUse?.name || connector?.name || '';

      try {
        localStorage.setItem(STORAGE_KEYS.PREFERRED_CONNECTOR_ID, connectorToUse?.id || connector?.id || '');
        localStorage.setItem(STORAGE_KEYS.PREFERRED_CONNECTOR_NAME, nameForStorage);
      } catch (_) {}

      await connect({ connector: connectorToUse || connector });
      setShowWalletModal(false);
    } catch (err) {
      const userMsg = mapWagmiErrorToMessage(err);
      if (userMsg === null) {
        setShowWalletModal(false);
        return;
      }
      const rawMsg = err?.shortMessage || err?.message || (typeof err === 'string' ? err : null) || '';
      const eth = typeof window !== 'undefined' ? window.ethereum : null;
      const ethInfo = eth ? ` metaMask=${!!eth.isMetaMask} trust=${!!eth.isTrust} coinbase=${!!eth.isCoinbaseWallet} phantom=${!!eth.isPhantom} hasProviders=${!!(eth.providers && Array.isArray(eth.providers))}` : ' NONE';
      console.error('[WalletModal] Connection error:', rawMsg || err, `connector=${connector?.name || connector?.id}`, ethInfo);
      const isWalletConnect = String(connector?.name || connector?.id || '').toLowerCase().includes('walletconnect');
      const finalMsg = (isWalletConnect && userMsg === MODAL_LABELS.EVM_ERROR_GENERIC) ? MODAL_LABELS.WALLETCONNECT_NOT_INSTALLED : userMsg;
      setError(finalMsg);
    } finally {
      setConnecting(false);
    }
  }, [connect, pickPreferredConnector, setShowWalletModal, setError, setConnecting]);

  const handleSolanaConnect = useCallback(async (walletName) => {
    setError(null);
    if (setInfoMessage) setInfoMessage(null);
    if (openChain && openChain !== 'solana' && setInfoMessage) {
      setInfoMessage(MODAL_LABELS.SOLANA_SWITCH_HINT);
    }
    setConnecting(true);
    try {
      selectSolanaWallet(walletName);
      await new Promise((resolve) => setTimeout(resolve, 80));
      await connectSolana();
      setShowWalletModal(false);
    } catch (err) {
      const msg = err?.message || '';
      const name = err?.name || '';
      console.error('[WalletModal] Solana connection error:', name, msg, err);
      if (err?.code === 4001 || String(msg).toLowerCase().includes('user rejected')) {
        setShowWalletModal(false);
        return;
      }
      if (name === 'WalletNotSelectedError') {
        setError(MODAL_LABELS.SOLANA_NOT_SELECTED);
        return;
      }
      if (name === 'WalletNotReadyError') {
        setError(MODAL_LABELS.SOLANA_NOT_INSTALLED);
        return;
      }
      setError(MODAL_LABELS.SOLANA_ERROR);
    } finally {
      setConnecting(false);
    }
  }, [openChain, selectSolanaWallet, connectSolana, setShowWalletModal, setError, setConnecting, setInfoMessage]);

  return { handleClose, handleEvmConnect, handleSolanaConnect };
}
