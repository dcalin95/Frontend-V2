export const SOL_PERPS_MARKETS = [
  {
    symbol: 'SOL-PERP',
    base: 'SOL',
    quote: 'USD',
    supportedVenues: ['jupiter', 'drift', 'flash'],
  },
  {
    symbol: 'ETH-PERP',
    base: 'ETH',
    quote: 'USD',
    supportedVenues: ['jupiter', 'drift', 'flash'],
  },
  {
    symbol: 'BTC-PERP',
    base: 'BTC',
    quote: 'USD',
    supportedVenues: ['jupiter', 'drift', 'flash'],
  },
];

export const SOL_PERPS_PROVIDERS = [
  {
    id: 'jupiter',
    name: 'Jupiter Perps',
    status: 'adapter-planned',
    priority: 1,
    maxLeverageLabel: 'Up to 250x',
    executionModel: 'Request + keeper execution',
    collateralLabel: 'SOL longs, USDC shorts',
    marketsLabel: 'SOL, ETH, wBTC',
    docsUrl: 'https://docs.jup.ag/user-docs/trade/perps-and-jlp',
    capabilities: ['Long/short perps', 'Market orders', 'Limit orders', 'TP/SL'],
    integrationNote:
      'Best first venue because this SOL trade page already uses Jupiter for spot quotes and swaps.',
  },
  {
    id: 'drift',
    name: 'Drift Protocol',
    status: 'sdk-required',
    priority: 2,
    maxLeverageLabel: 'Venue risk limits',
    executionModel: 'Drift SDK transactions',
    collateralLabel: 'Cross-collateral account model',
    marketsLabel: 'Perps, spot margin, borrow/lend',
    docsUrl: 'https://docs.drift.trade/developers',
    capabilities: ['Perps', 'Spot margin', 'Orders', 'Positions', 'PnL and risk'],
    integrationNote:
      'Best venue for a full Binance Futures-like terminal once @drift-labs/sdk is added and wired.',
  },
  {
    id: 'flash',
    name: 'Flash Trade',
    status: 'sdk-required',
    priority: 3,
    maxLeverageLabel: 'Up to 100x',
    executionModel: 'Flash SDK / protocol instructions',
    collateralLabel: 'Protocol collateral model',
    marketsLabel: 'Perps and spot on Solana',
    docsUrl: 'https://docs.flash.trade/flash-trade',
    capabilities: ['Perps', 'Spot', 'TP/SL', 'Protocol SDK'],
    integrationNote:
      'Good secondary venue after Jupiter/Drift because it requires a separate SDK adapter path.',
  },
];

export function getSolPerpsProvider(providerId) {
  return SOL_PERPS_PROVIDERS.find((provider) => provider.id === providerId) || SOL_PERPS_PROVIDERS[0];
}
