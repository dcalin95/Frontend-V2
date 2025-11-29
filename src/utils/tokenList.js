// Token List - BSC Mainnet
import bitsLogo from '../assets/logo.png';

export const TOKENS = {
  BNB: {
    symbol: 'BNB',
    name: 'Binance Coin',
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
    decimals: 18,
    logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.svg?v=029',
    isNative: true,
    isPresale: true, // 🎯 Supported in Presale
  },
  ETH: { // Binance-Peg Ethereum Token
    symbol: 'ETH',
    name: 'Ethereum (BSC)',
    address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    decimals: 18,
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=029',
    isNative: false,
    isPresale: true, // 🎯 Supported in Presale
  },
  BTC: { // Binance-Peg Bitcoin Token
    symbol: 'BTC',
    name: 'Bitcoin (BSC)',
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    decimals: 18,
    logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=029',
    isNative: false,
    isPresale: true, // 🎯 Supported in Presale (BTCB)
  },
  SOL: { // Binance-Peg Solana Token
    symbol: 'SOL',
    name: 'Solana (BSC)',
    address: '0x570A5D26f7765Ecb712C0924E4De545B89fD43dF',
    decimals: 18,
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=029',
    isNative: false,
    isPresale: false, // ❌ NOT in Presale (uses Solana chain)
  },
  BITS: {
    symbol: 'BITS',
    name: 'BitSwapDEX Token',
    address: '0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe',
    decimals: 18,
    logo: bitsLogo,
    isNative: false,
    isPresale: false, // ❌ BITS is the OUTPUT, not input for presale
  },
  EUR: { // Virtual Stripe Token
    symbol: 'EUR',
    name: 'Card Payment',
    address: '0x0000000000000000000000000000000000000000', // Virtual
    decimals: 2, // Fiat usually 2 decimals
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/1024px-MasterCard_Logo.svg.png',
    logo2: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Former_Visa_%28company%29_logo.svg/1024px-Former_Visa_%28company%29_logo.svg.png',
    isNative: false,
    isFiat: true
  },
  BUSD: {
    symbol: 'BUSD',
    name: 'Binance USD',
    address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    decimals: 18,
    logo: 'https://cryptologos.cc/logos/binance-usd-busd-logo.svg?v=029',
    isNative: false,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0x55d398326f99059fF775485246999027B3197955',
    decimals: 18,
    logo: 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=029',
    isNative: false,
    isPresale: true, // 🎯 Supported in Presale
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    decimals: 18,
    logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=029',
    isNative: false,
    isPresale: true, // 🎯 Supported in Presale
  },
  MATIC: {
    symbol: 'MATIC',
    name: 'Polygon (BSC)',
    address: '0xCC42724C6683B7E57334c4E856f4c9965ED682bD',
    decimals: 18,
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.svg?v=029',
    isNative: false,
    isPresale: true, // 🎯 Supported in Presale
  },
  LINK: {
    symbol: 'LINK',
    name: 'Chainlink',
    address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD',
    decimals: 18,
    logo: 'https://cryptologos.cc/logos/chainlink-link-logo.svg?v=029',
    isNative: false,
    isPresale: true, // 🎯 Supported in Presale
  },
  CAKE: {
    symbol: 'CAKE',
    name: 'PancakeSwap Token',
    address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    decimals: 18,
    logo: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.svg?v=029',
    isNative: false,
  },
};

export const TOKEN_LIST = Object.values(TOKENS);

// Helper: Get token by symbol
export const getToken = (symbol) => TOKENS[symbol] || null;

// Helper: Get token by address
export const getTokenByAddress = (address) => {
  return TOKEN_LIST.find(token => token.address.toLowerCase() === address.toLowerCase()) || null;
};

// Helper: Get swap path (for PancakeSwap Router)
export const getSwapPath = (fromToken, toToken) => {
  const from = getToken(fromToken);
  const to = getToken(toToken);
  
  if (!from || !to) return [];
  
  // If either is BNB/WBNB, direct swap
  if (from.isNative || to.isNative) {
    return [from.address, to.address];
  }
  
  // Otherwise, route through WBNB
  // Most liquidity is against WBNB
  return [from.address, TOKENS.BNB.address, to.address];
};

export default TOKENS;
