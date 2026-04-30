/**
 * Tipuri pentru jurnal leverage (documentare JSDoc; runtime = obiecte plain).
 * @typedef {Object} LeverageActivityEntry
 * @property {'live' | 'demo'} scope
 * @property {string} kind
 * @property {'submitted' | 'confirmed' | 'rejected' | 'reverted' | 'failed'} phase
 * @property {string} [at] ISO
 * @property {string} [txHash]
 * @property {string} [positionId]
 * @property {string} [amountLabel]
 * @property {string} [side]
 * @property {string} [errorSummary]
 * @property {string} [assetLabel]
 */

export const LEVERAGE_ACTIVITY_KIND = {
  SPOT_OPEN: 'spot_open',
  SPOT_CLOSE: 'spot_close',
  CFD_OPEN: 'cfd_open',
  CFD_CLOSE: 'cfd_close',
  COLLATERAL_ADD: 'collateral_add',
  COLLATERAL_REMOVE: 'collateral_remove',
  DEMO_SPOT_OPEN: 'demo_spot_open',
  DEMO_SPOT_CLOSE: 'demo_spot_close',
  DEMO_CFD_OPEN: 'demo_cfd_open',
  DEMO_CFD_CLOSE: 'demo_cfd_close',
};

