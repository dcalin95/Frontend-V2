/**
 * skipService.js – Cross-chain swaps via Skip Protocol API.
 * Skip automatizează IBC routing: SEI → Osmosis → ATOM → back to SEI.
 * @see https://api.skip.money/v2
 */

const SKIP_BASE = 'https://api.skip.money/v2';

// Chain IDs
export const SEI_CHAIN_ID    = 'pacific-1';
export const OSMOSIS_CHAIN_ID = 'osmosis-1';
export const COSMOS_CHAIN_ID  = 'cosmoshub-4';

// Denomuri
export const USEI  = 'usei';
export const ATOM_ON_SEI    = 'ibc/6CDD4663F2F09CD62285E2D45891FC149A3568E316CE3EBBE201A71A78A69388';
export const USDC_ON_SEI    = 'ibc/CA6FBFAF399474A06263E10D0CE5AEBBE15189D6D4B2DD9ADE61007E68EB9DB0';
export const UATOM           = 'uatom';
export const UOSMO           = 'uosmo';

/**
 * Găsește cea mai bună rută cross-chain via Skip.
 * @param {object} p
 * @param {string} p.srcDenom  - denom sursă (ex: 'usei')
 * @param {string} p.srcChain  - chain sursă (ex: 'pacific-1')
 * @param {string} p.dstDenom  - denom destinație (ex: ATOM_ON_SEI)
 * @param {string} p.dstChain  - chain destinație (ex: 'pacific-1')
 * @param {string} p.amountIn  - amount în unități minime (ex: '1000000')
 * @returns {Promise<{amountOut, usdOut, route, operations, estimatedMs}>}
 */
export async function getSkipRoute({ srcDenom, srcChain, dstDenom, dstChain, amountIn }) {
  // Skip API v2: route endpoint este POST
  const res = await fetch(`${SKIP_BASE}/fungible/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_asset_denom:    srcDenom,
      source_asset_chain_id: srcChain,
      dest_asset_denom:      dstDenom,
      dest_asset_chain_id:   dstChain,
      amount_in:             String(amountIn),
      allow_multi_tx:        true,
      smart_relay:           true,
      experimental_features: ['CCTP', 'HYPERLANE'],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Skip route error ${res.status}: ${err}`);
  }
  const data = await res.json();

  // Extrage operațiunile și chain-urile implicate
  const operations = data.operations || [];

  // chain_ids în ordine (inclusiv duplicate) — cerut de Skip /msgs address_list
  const chainIds = data.chain_ids || (() => {
    // Fallback: construim din operations păstrând ordinea și duplicatele
    const ids = [];
    ids.push(srcChain); // chain sursă
    for (const op of operations) {
      const c = op.transfer?.chain_id || op.swap?.chain_id;
      if (c) ids.push(c);
    }
    ids.push(dstChain); // chain destinație
    return ids;
  })();

  const chainsInvolved = [...new Set(chainIds)];

  // Construiește label rută
  const routeLabel = chainsInvolved.length > 1
    ? chainsInvolved.map(c => c.split('-')[0].toUpperCase()).join(' → ')
    : srcChain.split('-')[0].toUpperCase();

  return {
    amountOut:   data.amount_out || '0',
    usdOut:      parseFloat(data.usd_amount_out || '0'),
    txsRequired: data.txs_required || 1,
    routeLabel,
    chainsInvolved,
    operations,
    // Reținem parametrii originali pentru buildSkipMsgs
    raw: {
      ...data,
      chain_ids:             chainIds,   // ordinea exactă pentru address_list
      source_asset_denom:    srcDenom,
      source_asset_chain_id: srcChain,
      dest_asset_denom:      dstDenom,
      dest_asset_chain_id:   dstChain,
      amount_in:             String(amountIn),
    },
  };
}

/**
 * Mapare chainId → prefix bech32 standard Cosmos.
 * Toate adresele Cosmos sunt același public key hash cu prefix diferit.
 */
const CHAIN_BECH32_PREFIX = {
  'pacific-1':   'sei',
  'osmosis-1':   'osmo',
  'cosmoshub-4': 'cosmos',
  'axelar-dojo-1': 'axelar',
  'neutron-1':   'neutron',
  'stride-1':    'stride',
};

/**
 * Convertește o adresă bech32 Cosmos (ex: sei1...) în adresa echivalentă
 * pentru un alt chain (ex: osmo1...) folosind același public key hash.
 * Nu necesită Keplr/Compass — funcționează offline.
 */
function convertCosmosAddress(sourceAddress, targetChainId) {
  const prefix = CHAIN_BECH32_PREFIX[targetChainId];
  if (!prefix) throw new Error(`No bech32 prefix known for chain ${targetChainId}`);

  // Decodăm adresa sursă și re-encodăm cu prefix-ul nou
  const words = bech32Decode(sourceAddress);
  return bech32Encode(prefix, words);
}

// Mini implementare bech32 fără dependințe externe
// (bech32 e deja bundlat prin @cosmjs/cosmwasm-stargate)
function bech32Decode(address) {
  // Separăm prefix de data
  const sep = address.lastIndexOf('1');
  const dataPart = address.slice(sep + 1);
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  const decoded = [];
  for (const c of dataPart) {
    const val = CHARSET.indexOf(c);
    if (val === -1) throw new Error(`Invalid bech32 char: ${c}`);
    decoded.push(val);
  }
  // Eliminăm ultimii 6 bytes (checksum)
  return decoded.slice(0, decoded.length - 6);
}

function bech32Encode(prefix, words) {
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

  function polymod(values) {
    let chk = 1;
    for (const v of values) {
      const b = chk >> 25;
      chk = ((chk & 0x1ffffff) << 5) ^ v;
      for (let i = 0; i < 5; i++) if ((b >> i) & 1) chk ^= GEN[i];
    }
    return chk;
  }

  function hrpExpand(hrp) {
    const ret = [];
    for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5);
    ret.push(0);
    for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31);
    return ret;
  }

  function createChecksum(hrp, data) {
    const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
    const mod = polymod(values) ^ 1;
    const ret = [];
    for (let p = 0; p < 6; p++) ret.push((mod >> (5 * (5 - p))) & 31);
    return ret;
  }

  const checksum = createChecksum(prefix, words);
  const combined = words.concat(checksum);
  return prefix + '1' + combined.map(d => CHARSET[d]).join('');
}

/**
 * Construiește mesajele de tranzacție pentru Skip swap.
 * address_list trebuie să urmeze exact ordinea chain-urilor din rută (inclusiv duplicate).
 * @param {object} p
 * @param {object} p.route      - rezultatul din getSkipRoute
 * @param {string} p.seiAddress - adresa SEI a utilizatorului
 * @returns {Promise<{txs: Array<{chainId, signerAddress, msgs}>}>}
 */
export async function buildSkipMsgs({ route, seiAddress }) {
  // chain_ids din răspunsul Skip = ordinea exactă cerută pentru address_list
  const chainIds = route.raw.chain_ids || route.chainsInvolved || ['pacific-1'];

  // Derivăm adresele pentru fiecare chain din același public key (fără Keplr/Compass)
  const addressCache = {};
  for (const chainId of [...new Set(chainIds)]) {
    if (chainId === 'pacific-1') {
      addressCache[chainId] = seiAddress;
    } else {
      // Re-encodăm adresa SEI cu prefix-ul chain-ului destinație
      addressCache[chainId] = convertCosmosAddress(seiAddress, chainId);
    }
  }

  // Construim lista în ordinea exactă cerută de Skip (cu duplicate)
  const addressList = chainIds.map(chainId => addressCache[chainId]);

  const body = {
    source_asset_denom:    route.raw.source_asset_denom,
    source_asset_chain_id: route.raw.source_asset_chain_id,
    dest_asset_denom:      route.raw.dest_asset_denom,
    dest_asset_chain_id:   route.raw.dest_asset_chain_id,
    amount_in:             route.raw.amount_in,
    amount_out:            route.amountOut,
    address_list:          addressList,
    operations:            route.operations,
    slippage_tolerance_percent: '3.0',
  };

  const res = await fetch(`${SKIP_BASE}/fungible/msgs`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Skip msgs error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return { txs: data.txs || [] };
}

/**
 * Verifică statusul unui tx Skip.
 * @param {string} txHash
 * @param {string} chainId
 */
export async function getSkipTxStatus(txHash, chainId) {
  const res = await fetch(`${SKIP_BASE}/tx/status?tx_hash=${txHash}&chain_id=${chainId}`);
  if (!res.ok) return null;
  const d = await res.json();
  return {
    status:  d.state || 'unknown', // STATE_COMPLETED, STATE_PENDING, STATE_FAILED
    txs:     d.transfer_sequence || [],
  };
}

/**
 * Convertește denom SEI în denom Skip + chain pentru un simbol dat.
 */
export function symbolToSkip(symbol) {
  const MAP = {
    SEI:  { denom: USEI,       chain: SEI_CHAIN_ID },
    ATOM: { denom: ATOM_ON_SEI, chain: SEI_CHAIN_ID },
    USDC: { denom: USDC_ON_SEI, chain: SEI_CHAIN_ID },
    OSMO: { denom: UOSMO,       chain: OSMOSIS_CHAIN_ID },
  };
  return MAP[symbol] || null;
}
