/**
 * MangroveOrderABI – ABI minim pentru limit orders pe Mangrove v2 (Sei EVM).
 * MangroveOrder.take(): postează un ordin limit care:
 *   1. Încearcă să consume oferte din book (fill imediat la best price ≤ tick)
 *   2. Dacă rămâne volum nefilled și fillOrKill=false → postează rest ca resting limit order
 * Necesită msg.value (native SEI) ca provision/bounty pentru ordinul resting.
 *
 * @see https://docs.mangrove.exchange/dev/protocol/technical-references/makers/mangroveorder
 */

export const MangroveOrderABI = [
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
              { name: 'inbound_tkn',  type: 'address' },
              { name: 'tickSpacing',  type: 'uint256' },
            ],
          },
          { name: 'fillOrKill',  type: 'bool'    },
          { name: 'fillWants',   type: 'bool'    },
          { name: 'fillVolume',  type: 'uint256' },
          { name: 'tick',        type: 'int256'  },
          { name: 'expiryDate',  type: 'uint256' },
          { name: 'offerId',     type: 'uint256' },
          { name: 'data',        type: 'bytes32' },
        ],
      },
    ],
    name: 'take',
    outputs: [
      {
        name: 'res',
        type: 'tuple',
        components: [
          { name: 'takerGot',  type: 'uint256' },
          { name: 'takerGave', type: 'uint256' },
          { name: 'bounty',    type: 'uint256' },
          { name: 'feePaid',   type: 'uint256' },
          { name: 'offerId',   type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
];

export default MangroveOrderABI;
