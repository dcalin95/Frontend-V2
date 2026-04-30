/**
 * ABI minim pentru MgvReader (Mangrove) – citire order book.
 * Pentru ABI complet: @mangrovedao/mangrove-deployments sau mangrove-core/periphery/MgvReader.sol
 *
 * OLKey = (outbound_tkn, inbound_tkn, tickSpacing)
 * offerList(olKey, fromId, maxOffers) => (nextId, offerIds[], offers[], offerDetails[])
 */

export const OLKeyFragment = {
  name: 'OLKey',
  type: 'tuple',
  components: [
    { name: 'outbound_tkn', type: 'address' },
    { name: 'inbound_tkn', type: 'address' },
    { name: 'tickSpacing', type: 'uint256' },
  ],
};

export const MgvReaderABI = [
  {
    inputs: [
      { internalType: 'tuple', name: 'olKey', type: 'tuple', components: [{ name: 'outbound_tkn', type: 'address' }, { name: 'inbound_tkn', type: 'address' }, { name: 'tickSpacing', type: 'uint256' }] },
      { internalType: 'uint256', name: 'fromId', type: 'uint256' },
      { internalType: 'uint256', name: 'maxOffers', type: 'uint256' },
    ],
    name: 'offerList',
    outputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'uint256[]', name: '', type: 'uint256[]' },
      { internalType: 'tuple[]', name: '', type: 'tuple[]', components: [
        { name: 'gives', type: 'uint256' },
        { name: 'gasreq', type: 'uint256' },
        { name: 'gasprice', type: 'uint256' },
        { name: 'tick', type: 'int256' },
      ] },
      { internalType: 'tuple[]', name: '', type: 'tuple[]', components: [
        { name: 'gasreq', type: 'uint256' },
        { name: 'gasprice', type: 'uint256' },
        { name: 'provision', type: 'uint256' },
      ] },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'tuple', name: 'olKey', type: 'tuple', components: [{ name: 'outbound_tkn', type: 'address' }, { name: 'inbound_tkn', type: 'address' }, { name: 'tickSpacing', type: 'uint256' }] },
    ],
    name: 'isEmptyOB',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];

export default MgvReaderABI;
