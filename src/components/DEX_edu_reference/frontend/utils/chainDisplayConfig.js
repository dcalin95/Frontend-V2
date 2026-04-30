/**
 * Chain display config for wallet table and headers
 * chainId → { label, color, logo } – used for network badges and icons
 * Per DEX_UI_LANGUAGE: labels in English
 * Logos: CoinGecko (tokenIconMap sources) + cryptologos.cc + asset_platforms
 */
const CG = 'https://assets.coingecko.com/coins/images';
const CG_PLATFORMS = 'https://assets.coingecko.com/asset_platforms/images';
const CLOB_SEI_CHAIN_ID = parseInt(process.env.REACT_APP_CLOB_SEI_CHAIN_ID || '1329', 10);

export const EVM_CHAIN_DISPLAY = {
  1: { label: 'Ethereum', color: '#627EEA', logo: `${CG}/279/large/ethereum.png` },
  5: { label: 'Goerli', color: '#627EEA', logo: `${CG}/279/large/ethereum.png` },
  56: { label: 'BSC', color: '#F3BA2F', logo: `${CG}/825/large/bnb-icon2_2x.png` },
  97: { label: 'BSC Testnet', color: '#F3BA2F', logo: `${CG}/825/large/bnb-icon2_2x.png` },
  137: { label: 'Polygon', color: '#8247E5', logo: `${CG}/4713/large/matic-token-icon.png` },
  42161: { label: 'Arbitrum', color: '#28A0F0', logo: `${CG_PLATFORMS}/33/small/AO_logomark.png` },
  8453: { label: 'Base', color: '#0052FF', logo: `${CG_PLATFORMS}/131/small/base.jpeg` },
  43114: { label: 'Avalanche', color: '#E84142', logo: `${CG_PLATFORMS}/12/small/avalanche.png` },
  250: { label: 'Fantom', color: '#1969FF', logo: 'https://cryptologos.cc/logos/fantom-ftm-logo.svg?v=029' },
  59144: { label: 'Linea', color: '#61DAFB', logo: 'https://cryptologos.cc/logos/linea-linea-logo.svg?v=029' },
  10: { label: 'Optimism', color: '#FF0420', logo: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg?v=029' },
  324: { label: 'zkSync', color: '#8C8DFC', logo: 'https://cryptologos.cc/logos/zksync-era-logo.svg?v=029' },
  [CLOB_SEI_CHAIN_ID]: { label: 'Sei EVM', color: '#5C5CFF', logo: 'https://docs.sei.io/assets/sei-brand-assets/sei_red_symbol.svg' },
};

export const WALLET_TYPE_DISPLAY = {
  EVM: { label: 'EVM', color: '#4facfe', logo: `${CG}/279/large/ethereum.png` },
  SOLANA: { label: 'Solana', color: '#14F195', logo: `${CG}/4128/large/solana.png` },
};

export function getChainDisplay(chainId) {
  const numId = chainId != null ? parseInt(chainId, 10) : null;
  if (numId == null || isNaN(numId)) return null;
  return EVM_CHAIN_DISPLAY[numId] || { label: `Chain ${numId}`, color: '#64748b', logo: null };
}

export function getWalletTypeDisplay(walletType) {
  const t = (walletType || 'EVM').toUpperCase();
  return WALLET_TYPE_DISPLAY[t] || WALLET_TYPE_DISPLAY.EVM;
}
