/**
 * MangroveABI – ABI minim pentru market orders pe Mangrove v2 (Sei EVM).
 * Funcție: marketOrderByVolume – taker consumă oferte din order book.
 * @see https://docs.mangrove.exchange/dev/protocol/technical-references/market-order
 *
 * OLKey = (outbound_tkn, inbound_tkn, tickSpacing)
 * - Ask side: outbound=base, inbound=quote (taker buys base, pays quote)
 * - Bid side: outbound=quote, inbound=base (taker sells base, receives quote)
 */

export const MangroveABI = [
  {
    inputs: [
      {
        name: 'olKey',
        type: 'tuple',
        components: [
          { name: 'outbound_tkn', type: 'address' },
          { name: 'inbound_tkn', type: 'address' },
          { name: 'tickSpacing',  type: 'uint256' },
        ],
      },
      { name: 'takerWants', type: 'uint256' },
      { name: 'takerGives', type: 'uint256' },
      { name: 'fillWants',  type: 'bool'    },
    ],
    name: 'marketOrderByVolume',
    outputs: [
      { name: 'takerGot',  type: 'uint256' },
      { name: 'takerGave', type: 'uint256' },
      { name: 'bounty',    type: 'uint256' },
      { name: 'feePaid',   type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export default MangroveABI;
