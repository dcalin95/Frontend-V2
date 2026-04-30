/**
 * Token icon URLs - SINGLE SOURCE OF TRUTH
 * Logouri oficiale, clare și sharp. Sursa principală: CoinGecko (large PNG).
 * @module tokenIconMap
 */

/** CoinGecko CDN – iconițe oficiale, rezoluție mare (sharp) */
const CG = 'https://assets.coingecko.com/coins/images';

export const tokenIconMap = {
  BTC: `${CG}/1/large/bitcoin.png`,
  BITCOIN: `${CG}/1/large/bitcoin.png`,
  ETH: `${CG}/279/large/ethereum.png`,
  ETHEREUM: `${CG}/279/large/ethereum.png`,
  WETH: `${CG}/279/large/ethereum.png`,
  USDT: `${CG}/325/large/Tether.png`,
  USDC: `${CG}/6319/large/usdc.png`,
  BNB: `${CG}/825/large/bnb-icon2_2x.png`,
  BINANCE: `${CG}/825/large/bnb-icon2_2x.png`,
  WBNB: `${CG}/825/large/bnb-icon2_2x.png`,
  SOL: `${CG}/4128/large/solana.png`,
  SOLANA: `${CG}/4128/large/solana.png`,
  STX: `${CG}/2069/large/Stacks_Logo_png.png`,
  STACKS: `${CG}/2069/large/Stacks_Logo_png.png`,
  MATIC: `${CG}/4713/large/matic-token-icon.png`,
  POLYGON: `${CG}/4713/large/matic-token-icon.png`,
  ADA: `${CG}/975/large/cardano.png`,
  CARDANO: `${CG}/975/large/cardano.png`,
  LINK: `${CG}/877/large/chainlink-new-logo.png`,
  CAKE: `${CG}/12632/large/pancakeswap-cake-logo_%281%29.png`,
  DOGE: `${CG}/5/large/dogecoin.png`,
  SHIB: `${CG}/11939/large/shiba.png`,
  BUSD: `${CG}/9576/large/BUSD.png`,
  ATOM: `${CG}/1481/large/cosmos_hub.png`,
  COSMOS: `${CG}/1481/large/cosmos_hub.png`,
  AVAX: `${CG}/12559/large/Avalanche_Circle_RedWhite_Trans.png`,
  AVALANCHE: `${CG}/12559/large/Avalanche_Circle_RedWhite_Trans.png`,
  // SEI – logo oficial de pe docs.sei.io (Brand Kit)
  SEI: 'https://docs.sei.io/assets/sei-brand-assets/sei_red_symbol.svg',
  // Stablecoins Euro
  EURS: `${CG}/8032/large/EURS_300x300.png`,
  EURC: `${CG}/26045/large/euro-coin.png`,
  // Commodities CFD (imagini oficiale CoinGecko `large`, aceeași sursă ca restul mapării)
  XAU: `${CG}/10481/large/Tether_Gold.png`, // XAU/USD în UI — logo XAUT (aur tokenized, CoinGecko)
  XAUT: `${CG}/10481/large/Tether_Gold.png`,
  /** WTI/OIL în UI — imagine „Brent crude” (token listat CoinGecko `brent-on-sol`, reprezentare vizuală petrol) */
  OIL: 'https://coin-images.coingecko.com/coins/images/102172779/large/Brent_crude.jpg',
  WTI: 'https://coin-images.coingecko.com/coins/images/102172779/large/Brent_crude.jpg',
  BRENT: 'https://coin-images.coingecko.com/coins/images/102172779/large/Brent_crude.jpg',
  // Fiat currencies – flag icons (flagcdn.com, domeniu public)
  EUR: 'https://flagcdn.com/w40/eu.png',
  USD: 'https://flagcdn.com/w40/us.png',
  XRP: `${CG}/44/large/xrp-symbol-white-128.png`,
  // BITS: logo aplicație (public/logo.png → /logo.png)
  BITS: '/logo.png',
};
