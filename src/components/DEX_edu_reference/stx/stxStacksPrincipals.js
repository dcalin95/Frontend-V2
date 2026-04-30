/**
 * Mapare simbol → contract principal SIP-010 (Stacks).
 * Toate valorile vin din env (fără adrese hardcodate în cod).
 * Format așteptat: SP....deployer.contract-name (un singur punct între adresă și nume contract).
 * @module stxStacksPrincipals
 */

import { STX_CONTRACTS } from './stxContractConfig';

/**
 * @param {string} fullId - ex. SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token
 * @returns {{ address: string, contractName: string }}
 */
export function parseStacksContractId(fullId) {
  if (!fullId || typeof fullId !== 'string') {
    throw new Error('Invalid Stacks contract id (empty).');
  }
  const dot = fullId.lastIndexOf('.');
  if (dot <= 0 || dot === fullId.length - 1) {
    throw new Error(
      `Invalid Stacks contract id "${fullId}". Expected "SP....deployer.contract-name".`
    );
  }
  return {
    address: fullId.slice(0, dot),
    contractName: fullId.slice(dot + 1),
  };
}

/**
 * Principalii SIP-010 pentru swap (dex-wrapper.swap așteaptă principal pentru token-in/out).
 * STX „nativ” în UI trebuie mapat la un SIP-010 wrapped STX din env dacă perechea folosește simbolul STX.
 */
export const STX_SIP10_ENV_KEYS = {
  STX: process.env.REACT_APP_STX_SIP010_STX || '',
  USDA: process.env.REACT_APP_STX_SIP010_USDA || '',
  sBTC: process.env.REACT_APP_STX_SIP010_SBTC || '',
  xBTC: process.env.REACT_APP_STX_SIP010_XBTC || '',
  ALEX: process.env.REACT_APP_STX_SIP010_ALEX || '',
};

/**
 * @param {string} symbol - STX, USDA, sBTC, ...
 * @returns {string} full contract id sau ''
 */
export function getSip10FullContractIdForSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') return '';
  const key = symbol.trim().toUpperCase();
  return STX_SIP10_ENV_KEYS[key] || '';
}

/**
 * Verifică dacă env-ul permite swap local prin dex-wrapper (fără a apela rețeaua).
 * Backend care returnează doar `txForSigning` poate funcționa fără aceste variabile în frontend.
 *
 * @param {string} baseSymbol - ex. STX
 * @param {string} quoteSymbol - ex. USDA
 * @returns {{ ready: boolean, missing: string[] }}
 */
export function getStxSwapEnvReadiness(baseSymbol, quoteSymbol) {
  const missing = [];
  const wrapper = (STX_CONTRACTS.DEX_WRAPPER || STX_CONTRACTS.AI_TRADING_EXECUTOR || '').trim();
  if (!wrapper) {
    missing.push('REACT_APP_STX_DEX_WRAPPER_ADDRESS or REACT_APP_STX_AI_TRADING_EXECUTOR_ADDRESS');
  }
  const b = baseSymbol ? String(baseSymbol).trim().toUpperCase() : '';
  const q = quoteSymbol ? String(quoteSymbol).trim().toUpperCase() : '';
  if (b && !getSip10FullContractIdForSymbol(b)) {
    missing.push(`REACT_APP_STX_SIP010_${b}`);
  }
  if (q && !getSip10FullContractIdForSymbol(q)) {
    missing.push(`REACT_APP_STX_SIP010_${q}`);
  }
  return { ready: missing.length === 0, missing };
}
