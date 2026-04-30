/**
 * 🔧 Contract Deployment Utilities
 * 
 * Utilities pentru verificarea statusului deploy-ului contractelor:
 * - Detectare dacă contractele sunt deployate
 * - Mesaje standardizate
 * - Helpers pentru error handling
 * 
 * @module contractDeploymentUtils
 */

/**
 * Verifică dacă un mesaj de eroare indică că contractele nu sunt deployate
 * @param {string|Error} error - Mesajul de eroare sau obiectul Error
 * @returns {boolean} true dacă contractele nu sunt deployate
 */
export const isContractsNotDeployed = (error) => {
  if (!error) return false;
  
  const errorMsg = typeof error === 'string' ? error : (error.message || error.toString() || '');
  const errorLower = errorMsg.toLowerCase();
  
  return (
    errorLower.includes('not configured') ||
    errorLower.includes('uservault_address') ||
    errorLower.includes('503') ||
    errorLower.includes('service unavailable')
  );
};

/**
 * Mesaje standardizate pentru contracte ne-deployate
 */
export const CONTRACT_DEPLOYMENT_MESSAGES = {
  COMING_SOON: 'OTA registration is not available: required smart contracts are not deployed on BSC.',
  COMING_SOON_DETAILED: 'OTA registration is not available. The UserVault contract (and related contracts) must be deployed on BSC before you can register on-chain.',
  COMING_SOON_WITH_NEXT: 'OTA registration is not available. The UserVault contract must be deployed on BSC first.',
  WHATS_NEXT: 'After UserVault is deployed on BSC, you can register for OTA and use AI trading features.',
  TITLE: 'OTA Registration unavailable',
  ACCESS_TITLE: 'Registration unavailable:',
  TOOLTIP: 'OTA registration requires smart contracts to be deployed on BSC.'
};

/**
 * Returnează mesajul potrivit pentru contracte ne-deployate
 * @param {string} type - Tipul mesajului ('short' | 'detailed' | 'title' | 'tooltip')
 * @returns {string} Mesajul formatat
 */
export const getContractDeploymentMessage = (type = 'short') => {
  switch (type) {
    case 'short':
      return CONTRACT_DEPLOYMENT_MESSAGES.COMING_SOON;
    case 'detailed':
      return CONTRACT_DEPLOYMENT_MESSAGES.COMING_SOON_DETAILED;
    case 'title':
      return CONTRACT_DEPLOYMENT_MESSAGES.TITLE;
    case 'tooltip':
      return CONTRACT_DEPLOYMENT_MESSAGES.TOOLTIP;
    case 'whats_next':
      return CONTRACT_DEPLOYMENT_MESSAGES.WHATS_NEXT;
    default:
      return CONTRACT_DEPLOYMENT_MESSAGES.COMING_SOON;
  }
};

/**
 * Verifică dacă un error trebuie să fie ignorat (nu logat) pentru contracte ne-deployate
 * @param {string|Error} error - Mesajul de eroare sau obiectul Error
 * @returns {boolean} true dacă eroarea trebuie ignorată
 */
export const shouldIgnoreContractError = (error) => {
  return isContractsNotDeployed(error);
};
