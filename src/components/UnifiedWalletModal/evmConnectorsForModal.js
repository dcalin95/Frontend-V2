import { filterEVMConnectors } from '../../utils/walletFilter';

const PREFER_SCORE = {
  metamask: 0,
  coinbase: 1,
  walletconnect: 2,
  trust: 3,
  binance: 4,
  injected: 8,
};

function normalizeWalletId(c) {
  const name = String(c?.name || '').toLowerCase().replace(/\s+/g, '');
  const id = String(c?.id || '').toLowerCase().replace(/\s+/g, '');
  if (id === 'io.metamask') return 'metamask';
  if (id === 'com.trustwallet.app' || id.includes('trustwallet')) return 'trust';
  if (id === 'binance-web3') return 'binance';
  if (name.includes('phantom') || id.includes('phantom')) return 'phantom';
  if (name.includes('metamask') || id.includes('metamask')) return 'metamask';
  if (name.includes('coinbase') || id.includes('coinbase')) return 'coinbase';
  if (name.includes('walletconnect') || id.includes('walletconnect')) return 'walletconnect';
  if (name.includes('trust') || id.includes('trust')) return 'trust';
  if (name.includes('binance') || id.includes('binance')) return 'binance';
  if (name.includes('injected') || id.includes('injected')) return 'injected';
  return null;
}

function preferScore(c) {
  const id = normalizeWalletId(c);
  if (id && PREFER_SCORE[id] !== undefined) return PREFER_SCORE[id];
  return 9;
}

export function getSortedEvmConnectorsForModal(connectors) {
  const list = filterEVMConnectors(Array.isArray(connectors) ? connectors : []);
  const eth = typeof window !== 'undefined' ? window.ethereum : null;
  const providers = eth?.providers ?? (eth ? [eth] : []);
  const hasMetaMaskExt = providers.some((p) => p?.isMetaMask && !p?.isPhantom && !p?.isTrust) || (!!eth?.isMetaMask && !eth?.isPhantom && !eth?.isTrust);
  const hasTrust = providers.some((p) => p?.isTrust) || (!!eth?.isTrust && !eth?.isPhantom);
  const isMobileViewport = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  const hasBinance = typeof window !== 'undefined' && !!window.binancew3w?.ethereum?.request;
  const genericInjected = list.find((c) => String(c?.id || '').toLowerCase() === 'injected' && !String(c?.name || '').toLowerCase().includes('binance'));
  const map = new Map();

  for (const c of list) {
    const name = String(c?.name || '').trim();
    if (!name) continue;
    const stableId = normalizeWalletId(c);
    if (stableId === 'phantom') continue;
    if (stableId === 'binance' && !hasBinance) continue;
    const existing = map.get(stableId);
    if (!existing || preferScore(c) < preferScore(existing)) map.set(stableId, c);
  }

  const output = Array.from(map.entries())
    .sort(([idA, a], [idB, b]) => {
      const ra = PREFER_SCORE[idA] ?? preferScore(a);
      const rb = PREFER_SCORE[idB] ?? preferScore(b);
      if (ra !== rb) return ra - rb;
      return String(a?.name || '').localeCompare(String(b?.name || ''));
    })
    .map(([stableId, connector]) => {
      const preferredProvider =
        stableId === 'metamask' ? 'metamask' :
        stableId === 'trust' ? 'trust' :
        stableId === 'coinbase' ? 'coinbase' :
        stableId === 'binance' ? 'binance' :
        null;
      const displayName =
        preferredProvider === 'metamask' ? 'MetaMask' :
        preferredProvider === 'trust' ? 'Trust Wallet' :
        preferredProvider === 'coinbase' ? 'Coinbase Wallet' :
        preferredProvider === 'binance' ? 'Binance Web3 Wallet' :
        null;
      return { connector, displayName, preferredProvider };
    });

  if (genericInjected) {
    if (hasMetaMaskExt && !output.some((i) => i.preferredProvider === 'metamask')) {
      output.push({ connector: genericInjected, displayName: 'MetaMask', preferredProvider: 'metamask' });
    }
    if (hasTrust && !output.some((i) => i.preferredProvider === 'trust')) {
      output.push({ connector: genericInjected, displayName: 'Trust Wallet', preferredProvider: 'trust' });
    }
    if (providers.some((p) => p?.isCoinbaseWallet) && !output.some((i) => i.preferredProvider === 'coinbase')) {
      output.push({ connector: genericInjected, displayName: 'Coinbase Wallet', preferredProvider: 'coinbase' });
    }
  }

  if (!hasTrust && isMobileViewport) {
    const wc = list.find((c) => {
      const name = String(c?.name || '').toLowerCase();
      const id = String(c?.id || '').toLowerCase();
      return name.includes('walletconnect') || id.includes('walletconnect');
    });
    if (wc) output.push({ connector: wc, displayName: 'Trust Wallet (WalletConnect)', preferredProvider: 'trust' });
  }

  return output.sort((a, b) => {
    const aId = String(a?.preferredProvider || '').toLowerCase();
    const bId = String(b?.preferredProvider || '').toLowerCase();
    const ra = PREFER_SCORE[aId] ?? preferScore(a?.connector);
    const rb = PREFER_SCORE[bId] ?? preferScore(b?.connector);
    if (ra !== rb) return ra - rb;
    return String(a?.displayName || a?.connector?.name || '').localeCompare(String(b?.displayName || b?.connector?.name || ''));
  });
}

export function getWalletIcon(connectorName) {
  const name = String(connectorName || '').toLowerCase().replace(/\s+/g, '');
  if (name.includes('metamask')) return '🦊';
  if (name.includes('walletconnect')) return '🔗';
  if (name.includes('coinbase')) return '🔵';
  if (name.includes('trust')) return '🔷';
  if (name.includes('binance')) return '🟡';
  if (name.includes('injected')) return '💼';
  return '🔐';
}
