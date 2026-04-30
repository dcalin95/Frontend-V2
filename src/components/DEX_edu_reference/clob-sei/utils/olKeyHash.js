/**
 * OLKey hash — trebuie să coincidă cu `OfferKey.hash` / encoding-ul din Mangrove v2.
 * Folosit pentru MangroveOrder.ownerOf(bytes32 olKeyHash, uint256 offerId).
 */
import { ethers } from 'ethers';

/**
 * @param {string} outboundTkn
 * @param {string} inboundTkn
 * @param {number|bigint} tickSpacing
 * @returns {string} bytes32 hex
 */
export function computeOlKeyHash(outboundTkn, inboundTkn, tickSpacing) {
  const ts = ethers.BigNumber.from(tickSpacing);
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ['tuple(address outbound_tkn, address inbound_tkn, uint256 tickSpacing)'],
    [[outboundTkn, inboundTkn, ts]],
  );
  return ethers.utils.keccak256(encoded);
}
