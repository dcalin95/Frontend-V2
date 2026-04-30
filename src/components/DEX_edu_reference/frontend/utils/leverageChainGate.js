/**
 * Stare UI pentru rețeaua wallet vs rețeaua așteptată (Leverage live pe BSC din contractMap).
 */

/**
 * @param {boolean} isConnected
 * @param {number | null | undefined} connectedChainId undefined = încă nu am citit; null = citire eșuată
 * @param {number} expectedChainId
 * @param {string} expectedChainName
 */
export function buildLeverageChainGate(
  isConnected,
  connectedChainId,
  expectedChainId,
  expectedChainName,
) {
  return {
    connectedChainId,
    expectedLeverageChainId: expectedChainId,
    expectedLeverageChainName: expectedChainName,
    isWrongChain:
      !!isConnected &&
      typeof connectedChainId === 'number' &&
      connectedChainId !== expectedChainId,
    chainPending: !!isConnected && connectedChainId === undefined,
    chainReadFailed: !!isConnected && connectedChainId === null,
  };
}
