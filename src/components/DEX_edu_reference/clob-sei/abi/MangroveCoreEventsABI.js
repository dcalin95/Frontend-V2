/**
 * Evenimente Mangrove core (HasMgvEvents din mangrove-core / MgvLib.sol).
 * SSOT: https://github.com/mangrovedao/mangrove-core/blob/develop/src/core/MgvLib.sol
 * Adresa contract: MANGROVE_SEI.Mangrove — folosit doar pentru eth_getLogs + parseLog.
 *
 * Tick în Solidity e tip Tick — în ABI JSON folosit ca int256 pentru OrderStart.maxTick.
 */
export const MangroveCoreEventsABI = [
  {
    anonymous: false,
    name: 'OrderStart',
    type: 'event',
    inputs: [
      { indexed: true, name: 'olKeyHash', type: 'bytes32' },
      { indexed: true, name: 'taker', type: 'address' },
      { indexed: false, name: 'maxTick', type: 'int256' },
      { indexed: false, name: 'fillVolume', type: 'uint256' },
      { indexed: false, name: 'fillWants', type: 'bool' },
    ],
  },
  {
    anonymous: false,
    name: 'OrderComplete',
    type: 'event',
    inputs: [
      { indexed: true, name: 'olKeyHash', type: 'bytes32' },
      { indexed: true, name: 'taker', type: 'address' },
      { indexed: false, name: 'fee', type: 'uint256' },
    ],
  },
  {
    anonymous: false,
    name: 'OfferSuccess',
    type: 'event',
    inputs: [
      { indexed: true, name: 'olKeyHash', type: 'bytes32' },
      { indexed: true, name: 'taker', type: 'address' },
      { indexed: true, name: 'id', type: 'uint256' },
      { indexed: false, name: 'takerWants', type: 'uint256' },
      { indexed: false, name: 'takerGives', type: 'uint256' },
    ],
  },
  {
    anonymous: false,
    name: 'OfferSuccessWithPosthookData',
    type: 'event',
    inputs: [
      { indexed: true, name: 'olKeyHash', type: 'bytes32' },
      { indexed: true, name: 'taker', type: 'address' },
      { indexed: true, name: 'id', type: 'uint256' },
      { indexed: false, name: 'takerWants', type: 'uint256' },
      { indexed: false, name: 'takerGives', type: 'uint256' },
      { indexed: false, name: 'posthookData', type: 'bytes32' },
    ],
  },
  {
    anonymous: false,
    name: 'OfferFail',
    type: 'event',
    inputs: [
      { indexed: true, name: 'olKeyHash', type: 'bytes32' },
      { indexed: true, name: 'taker', type: 'address' },
      { indexed: true, name: 'id', type: 'uint256' },
      { indexed: false, name: 'takerWants', type: 'uint256' },
      { indexed: false, name: 'takerGives', type: 'uint256' },
      { indexed: false, name: 'penalty', type: 'uint256' },
      { indexed: false, name: 'mgvData', type: 'bytes32' },
    ],
  },
  {
    anonymous: false,
    name: 'OfferFailWithPosthookData',
    type: 'event',
    inputs: [
      { indexed: true, name: 'olKeyHash', type: 'bytes32' },
      { indexed: true, name: 'taker', type: 'address' },
      { indexed: true, name: 'id', type: 'uint256' },
      { indexed: false, name: 'takerWants', type: 'uint256' },
      { indexed: false, name: 'takerGives', type: 'uint256' },
      { indexed: false, name: 'penalty', type: 'uint256' },
      { indexed: false, name: 'mgvData', type: 'bytes32' },
      { indexed: false, name: 'posthookData', type: 'bytes32' },
    ],
  },
  {
    anonymous: false,
    name: 'OfferWrite',
    type: 'event',
    inputs: [
      { indexed: true, name: 'olKeyHash', type: 'bytes32' },
      { indexed: true, name: 'maker', type: 'address' },
      { indexed: false, name: 'tick', type: 'int256' },
      { indexed: false, name: 'gives', type: 'uint256' },
      { indexed: false, name: 'gasprice', type: 'uint256' },
      { indexed: false, name: 'gasreq', type: 'uint256' },
      { indexed: false, name: 'id', type: 'uint256' },
    ],
  },
  {
    anonymous: false,
    name: 'OfferRetract',
    type: 'event',
    inputs: [
      { indexed: true, name: 'olKeyHash', type: 'bytes32' },
      { indexed: true, name: 'maker', type: 'address' },
      { indexed: false, name: 'id', type: 'uint256' },
      { indexed: false, name: 'deprovision', type: 'bool' },
    ],
  },
];

export default MangroveCoreEventsABI;
