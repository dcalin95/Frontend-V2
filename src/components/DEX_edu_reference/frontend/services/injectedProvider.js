/**
 * Injected wallet provider selection.
 * DELEGĂ la SSOT unic: evmProviderResolver.js
 * @module injectedProvider
 */

import { pickEvmProvider } from '../../utils/evmProviderResolver.js';

/**
 * Get the injected EIP-1193 provider to use for signing/requests.
 * Respectă wallet-ul selectat de user (localStorage bits_evm_preferred_connector_name).
 * Folosește EIP-6963 când e disponibil.
 * @returns {object|null} EIP-1193 provider or null
 */
export function getInjectedProvider() {
  return pickEvmProvider();
}
