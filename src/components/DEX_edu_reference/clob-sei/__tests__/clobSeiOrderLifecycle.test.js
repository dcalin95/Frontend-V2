/**
 * Sursă de adevăr on-chain: olKey hash, merge reconciliere, parsare receipt limit.
 */
import { ethers } from 'ethers';
import { computeOlKeyHash } from '../utils/olKeyHash';
import { mergeByKey } from '../services/clobUserOrdersService';
import { parseLimitOrderReceiptLogs } from '../services/clobTradeService';
import { MangroveOrderFullABI } from '../abi/MangroveOrderFullABI';
import { MANGROVE_SEI } from '../config';

describe('computeOlKeyHash (OLKey → bytes32)', () => {
  it('is deterministic for the same tuple', () => {
    const o = '0x0000000000000000000000000000000000000001';
    const i = '0x0000000000000000000000000000000000000002';
    expect(computeOlKeyHash(o, i, 1)).toBe(computeOlKeyHash(o, i, 1));
  });

  it('changes when outbound/inbound swap', () => {
    const a = '0x0000000000000000000000000000000000000001';
    const b = '0x0000000000000000000000000000000000000002';
    expect(computeOlKeyHash(a, b, 1)).not.toBe(computeOlKeyHash(b, a, 1));
  });
});

describe('mergeByKey (optimistic vs reconciliat)', () => {
  it('tags chain rows as reconciled and keeps local-only rows', () => {
    const merged = mergeByKey(
      [{ k: 'a', v: 1 }],
      [{ k: 'b', v: 2 }],
      (r) => r.k,
    );
    const map = Object.fromEntries(merged.map((r) => [r.k, r]));
    expect(map.a.reconciled).toBe(true);
    expect(map.b.reconciled).toBe(false);
  });

  it('does not duplicate when local key matches chain (stale local dropped)', () => {
    const merged = mergeByKey(
      [{ k: 'x', offerId: '5' }],
      [{ k: 'x', offerId: 'ghost' }],
      (r) => r.k,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].offerId).toBe('5');
    expect(merged[0].reconciled).toBe(true);
  });
});

describe('parseLimitOrderReceiptLogs', () => {
  it('reads offerId from NewOwnedOffer on MangroveOrder', () => {
    const iface = new ethers.utils.Interface(MangroveOrderFullABI);
    const ev = iface.getEvent('NewOwnedOffer');
    const owner = '0x1111111111111111111111111111111111111111';
    const olKeyHash = ethers.utils.hexZeroPad('0xab', 32);
    const offerId = ethers.BigNumber.from(42);
    const encoded = iface.encodeEventLog(ev, [owner, olKeyHash, offerId]);
    const receipt = {
      logs: [
        {
          address: MANGROVE_SEI.MangroveOrder,
          topics: encoded.topics,
          data: encoded.data,
        },
      ],
    };
    expect(parseLimitOrderReceiptLogs(receipt).offerId).toBe('42');
  });

  it('returns null when logs missing or wrong contract', () => {
    expect(parseLimitOrderReceiptLogs({ logs: [] }).offerId).toBeNull();
    const iface = new ethers.utils.Interface(MangroveOrderFullABI);
    const ev = iface.getEvent('NewOwnedOffer');
    const encoded = iface.encodeEventLog(ev, [
      '0x1111111111111111111111111111111111111111',
      ethers.constants.HashZero,
      ethers.BigNumber.from(1),
    ]);
    expect(
      parseLimitOrderReceiptLogs({
        logs: [{ address: '0x0000000000000000000000000000000000000001', topics: encoded.topics, data: encoded.data }],
      }).offerId,
    ).toBeNull();
  });
});
