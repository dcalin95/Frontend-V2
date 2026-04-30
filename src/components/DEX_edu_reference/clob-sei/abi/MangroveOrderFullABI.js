/**
 * MangroveOrder — take + ownerOf + retractOffer + evenimente utile pentru istoric.
 * SSOT deployment: MANGROVE_SEI.MangroveOrder (Sei EVM).
 * @see https://docs.mangrove.exchange/dev/limit-orders
 */

export const MangroveOrderFullABI = [
  {
    inputs: [
      {
        name: 'tko',
        type: 'tuple',
        components: [
          {
            name: 'olKey',
            type: 'tuple',
            components: [
              { name: 'outbound_tkn', type: 'address' },
              { name: 'inbound_tkn', type: 'address' },
              { name: 'tickSpacing', type: 'uint256' },
            ],
          },
          { name: 'fillOrKill', type: 'bool' },
          { name: 'fillWants', type: 'bool' },
          { name: 'fillVolume', type: 'uint256' },
          { name: 'tick', type: 'int256' },
          { name: 'expiryDate', type: 'uint256' },
          { name: 'offerId', type: 'uint256' },
          { name: 'data', type: 'bytes32' },
        ],
      },
    ],
    name: 'take',
    outputs: [
      {
        name: 'res',
        type: 'tuple',
        components: [
          { name: 'takerGot', type: 'uint256' },
          { name: 'takerGave', type: 'uint256' },
          { name: 'bounty', type: 'uint256' },
          { name: 'feePaid', type: 'uint256' },
          { name: 'offerId', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: 'olKey',
        type: 'tuple',
        components: [
          { name: 'outbound_tkn', type: 'address' },
          { name: 'inbound_tkn', type: 'address' },
          { name: 'tickSpacing', type: 'uint256' },
        ],
      },
      { name: 'offerId', type: 'uint256' },
      { name: 'deprovision', type: 'bool' },
    ],
    name: 'retractOffer',
    outputs: [{ name: 'freeWei', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'olKeyHash', type: 'bytes32' },
      { name: 'offerId', type: 'uint256' },
    ],
    name: 'ownerOf',
    outputs: [{ name: 'owner', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    name: 'NewOwnedOffer',
    type: 'event',
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'olKeyHash', type: 'bytes32' },
      { indexed: true, name: 'offerId', type: 'uint256' },
    ],
  },
  {
    anonymous: false,
    name: 'MangroveOrderStart',
    type: 'event',
    inputs: [
      { indexed: true, name: 'olKeyHash', type: 'bytes32' },
      { indexed: true, name: 'taker', type: 'address' },
      { name: 'tick', type: 'int256' },
      { name: 'orderType', type: 'uint8' },
      { name: 'fillVolume', type: 'uint256' },
    ],
  },
];

export default MangroveOrderFullABI;
