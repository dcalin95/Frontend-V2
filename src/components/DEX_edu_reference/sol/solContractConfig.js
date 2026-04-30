/**
 * solContractConfig.js – Adrese programe (Anchor) pe Solana.
 * Echivalent SOL al contractMap (EVM). Frontend așteaptă program IDs după deploy.
 */

/**
 * Program IDs (env sau placeholder). Actualizează după deploy pe Solana mainnet.
 * Format Solana: Pubkey (base58).
 */
export const SOL_CONTRACTS = {
  USER_VAULT: process.env.REACT_APP_SOL_USER_VAULT_PROGRAM_ID || '',
  AI_TRADING_EXECUTOR: process.env.REACT_APP_SOL_AI_TRADING_EXECUTOR_PROGRAM_ID || '',
  ACCESS_CONTROL: process.env.REACT_APP_SOL_ACCESS_CONTROL_PROGRAM_ID || '',
  DEX_WRAPPER: process.env.REACT_APP_SOL_DEX_WRAPPER_PROGRAM_ID || '',
};

/**
 * Instructiuni user-vault (aliniat cu user-vault Anchor).
 */
export const USER_VAULT_IX = {
  initialize: 'initialize',
  register: 'register',
  authorizeBot: 'authorize_bot',
  deposit: 'deposit',
  withdraw: 'withdraw',
};

/**
 * Instructiuni ai-trading-executor (aliniat cu ai-trading-executor Anchor).
 */
export const EXECUTOR_IX = {
  initialize: 'initialize',
  executeTrade: 'execute_trade',
  updateStopLoss: 'update_stop_loss',
  updateTakeProfit: 'update_take_profit',
};

export default SOL_CONTRACTS;
