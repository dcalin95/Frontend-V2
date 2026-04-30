/**
 * seiContractConfig.js – Adrese și tipuri de msg pentru contracte CosmWasm pe SEI.
 * Echivalent SEI al contractMap (EVM). Fără ABI; doar adrese + structuri ExecuteMsg/QueryMsg.
 */

/**
 * Adrese contracte (env sau placeholder). Actualizează după deploy pe pacific-1.
 */
export const SEI_CONTRACTS = {
  SWAP_EXECUTOR: process.env.REACT_APP_SEI_SWAP_EXECUTOR_ADDRESS || '',
  USER_VAULT: process.env.REACT_APP_SEI_USER_VAULT_ADDRESS || '',
  ACCESS_CONTROL: process.env.REACT_APP_SEI_ACCESS_CONTROL_ADDRESS || '',
  OTA_EXECUTOR: process.env.REACT_APP_SEI_OTA_EXECUTOR_ADDRESS || '',
};

/**
 * Msg-uri pentru sei_swap_executor (aliniat cu msg.rs din contract).
 * Folosit de seiContractService pentru execute și query.
 */
export const SWAP_EXECUTOR_MSGS = {
  executeSwap: (params) => ({
    execute_swap: {
      token_in: params.tokenIn,
      token_out: params.tokenOut,
      amount_in: params.amountIn,
      min_amount_out: params.minAmountOut,
    },
  }),
  queryConfig: () => ({ config: {} }),
  queryIsWhitelisted: (address) => ({ is_whitelisted: { address } }),
};

export default SEI_CONTRACTS;
