/**
 * stxContractConfig.js – Adrese contracte Clarity pe Stacks.
 * Echivalent STX al contractMap (EVM). Frontend așteaptă adrese după deploy (user-vault, ai-trading-executor, etc.).
 */

/**
 * Adrese contracte (env sau placeholder). Actualizează după deploy pe Stacks mainnet.
 * Format Stacks: SP... sau contract principal (e.g. SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.user-vault)
 */
export const STX_CONTRACTS = {
  USER_VAULT: process.env.REACT_APP_STX_USER_VAULT_ADDRESS || '',
  AI_TRADING_EXECUTOR: process.env.REACT_APP_STX_AI_TRADING_EXECUTOR_ADDRESS || '',
  ACCESS_CONTROL: process.env.REACT_APP_STX_ACCESS_CONTROL_ADDRESS || '',
  DEX_WRAPPER: process.env.REACT_APP_STX_DEX_WRAPPER_ADDRESS || '',
  /** BITS pe Stacks (SIP-010) – pentru gating OTA și viitor „pay gas with BITS” (relayer). */
  BITS_TOKEN: process.env.REACT_APP_STX_BITS_TOKEN_ADDRESS || '',
};

/** Dacă true, UI poate oferi opțiunea „plătești gas cu BITS” (relayer plătește STX, user dă BITS). */
export const STX_PAY_GAS_WITH_BITS = process.env.REACT_APP_STX_PAY_GAS_WITH_BITS === 'true';

/**
 * Funcții contract user-vault (aliniat cu user-vault.clar refactor 2026-02).
 * Pentru call din frontend: @stacks/connect sau Leather.
 */
export const USER_VAULT_FUNCTIONS = {
  register: 'register',
  authorizeBot: 'authorize-bot',
  deauthorizeBot: 'deauthorize-bot',
  deposit: 'deposit',
  withdraw: 'withdraw',
  executeSwapForUser: 'execute-swap-for-user',
};

/**
 * Funcții ai-trading-executor (aliniat cu ai-trading-executor.clar refactor 2026-02).
 */
export const EXECUTOR_FUNCTIONS = {
  executeTrade: 'execute-trade',
  updateStopLoss: 'update-stop-loss',
  updateTakeProfit: 'update-take-profit',
};

/** Nume funcții owner user-vault (set după deploy). */
export const USER_VAULT_OWNER_FUNCTIONS = {
  setAccessControl: 'set-access-control',
  setAuthorizedExecutor: 'set-authorized-executor',
  setDexWrapper: 'set-dex-wrapper',
  setMinBitsForOta: 'set-min-bits-for-ota',
  pause: 'pause',
  unpause: 'unpause',
};

export default STX_CONTRACTS;
