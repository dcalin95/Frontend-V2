/**
 * clobTradeService.js – Execuție ordine pe Mangrove CLOB (Sei EVM).
 *
 * Market order: Mangrove.marketOrderByVolume (consumă oferte existente din book)
 * Limit order:  MangroveOrder.take (postează resting order dacă nu e filled imediat)
 *
 * Wallet: MetaMask sau orice injected EVM provider (window.ethereum), chain ID 1329 (Sei).
 * Token approval: ERC20 approve(Mangrove/MangroveOrder, amount) înainte de orice order.
 *
 * @see https://docs.mangrove.exchange/dev/protocol/technical-references/market-order
 * @see https://docs.mangrove.exchange/dev/protocol/technical-references/makers/mangroveorder
 */

import { ethers } from 'ethers';
import { MANGROVE_SEI, CLOB_SEI_CHAIN_ID, CLOB_SEI_RPC, CLOB_SEI_RPC_FALLBACKS } from '../config';
import { CLOB_MARKET_SLIPPAGE_FRACTION } from '../constants';
import { MangroveABI } from '../abi/MangroveABI';
import { MangroveOrderFullABI } from '../abi/MangroveOrderFullABI';
import { ERC20ABI } from '../abi/ERC20ABI';
import { pickEvmProvider } from '../../utils/evmProviderResolver.js';

// Provision în native SEI pentru limit orders resting (bounty pentru cleanup).
// ~0.1 SEI e suficient pentru gasreq standard.
const LIMIT_ORDER_PROVISION = ethers.utils.parseEther('0.1');

const MARKET_SLIPPAGE = CLOB_MARKET_SLIPPAGE_FRACTION;

// Factorul 1.0001 folosit de Mangrove pentru calculul tick → preț
const MANGROVE_TICK_BASE = 1.0001;

/**
 * Conversie tick Mangrove → preț (inbound per outbound).
 * @param {number|string} tick
 * @returns {number}
 */
export function tickToPrice(tick) {
  return Math.pow(MANGROVE_TICK_BASE, Number(tick));
}

/**
 * Conversie preț → tick Mangrove.
 * @param {number} price – inbound per outbound (ex: USDC per wSEI pentru asks)
 * @returns {number}
 */
export function priceToTick(price) {
  return Math.round(Math.log(price) / Math.log(MANGROVE_TICK_BASE));
}

/**
 * Market order necesită best ask (buy) sau best bid (sell) din order book — fără valori artificiale.
 * @param {'buy'|'sell'} side
 * @param {number|null|undefined} bestAskPrice – quote per base (ex. USDC per wSEI)
 * @param {number|null|undefined} bestBidPrice – quote per base
 * @throws {Error} MARKET_PRICE_UNAVAILABLE
 */
export function assertMarketReferencePrices(side, bestAskPrice, bestBidPrice) {
  if (side === 'buy') {
    const p = bestAskPrice != null ? Number(bestAskPrice) : NaN;
    if (!Number.isFinite(p) || p <= 0) {
      throw new Error(
        'MARKET_PRICE_UNAVAILABLE: Best ask is missing — refresh the Mangrove order book or wait for liquidity before placing a market buy.',
      );
    }
  } else {
    const p = bestBidPrice != null ? Number(bestBidPrice) : NaN;
    if (!Number.isFinite(p) || p <= 0) {
      throw new Error(
        'MARKET_PRICE_UNAVAILABLE: Best bid is missing — refresh the Mangrove order book or wait for liquidity before placing a market sell.',
      );
    }
  }
}

/**
 * Adaugă rețeaua Sei EVM în MetaMask dacă nu există și face switch.
 */
export async function switchToSeiNetwork() {
  const raw = getEthereumProvider();
  if (!raw) throw new Error('No EVM wallet found. Install MetaMask.');
  const provider = new ethers.providers.Web3Provider(raw);
  await addSeiEvmNetwork(provider);
}

/** MetaMask / Trust: cod 4902 sau mesaj „unrecognized chain” (formulări diferite pe versiuni). */
function isChainNotAddedError(err) {
  if (!err) return false;
  if (err.code === 4902) return true;
  if (err?.data?.originalError?.code === 4902) return true;
  const msg = `${err.message || ''} ${err.reason || ''} ${err.data || ''}`;
  return /unrecognized chain|not (been )?added|not configured|chain not added/i.test(msg);
}

function buildSeiEvmAddChainParams(chainIdHex) {
  const primary = (typeof CLOB_SEI_RPC === 'string' && CLOB_SEI_RPC.trim()) || CLOB_SEI_RPC_FALLBACKS[0];
  const rpcUrls = [primary, ...CLOB_SEI_RPC_FALLBACKS.filter((u) => u !== primary)];
  return {
    chainId: chainIdHex,
    chainName: 'Sei EVM',
    nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
    rpcUrls,
    blockExplorerUrls: ['https://seistream.app', 'https://seiscan.io'],
  };
}

async function addSeiEvmNetwork(provider) {
  const chainIdHex = `0x${Number(CLOB_SEI_CHAIN_ID).toString(16)}`;
  try {
    await provider.send('wallet_switchEthereumChain', [{ chainId: chainIdHex }]);
    return;
  } catch (switchErr) {
    if (!isChainNotAddedError(switchErr)) {
      throw switchErr;
    }
  }
  await provider.send('wallet_addEthereumChain', [buildSeiEvmAddChainParams(chainIdHex)]);
  await provider.send('wallet_switchEthereumChain', [{ chainId: chainIdHex }]);
}

/**
 * Găsește provider-ul MetaMask chiar dacă Trust Wallet sau alt wallet
 * suprascrie window.ethereum. Caută în window.ethereum.providers[].
 * Fallback: orice provider EVM disponibil.
 */
function getEthereumProvider() {
  return pickEvmProvider();
}

/**
 * Returnează un signer EVM (preferă MetaMask față de Trust Wallet).
 * Solicită conectare dacă nu e conectat și face switch la Sei EVM.
 * @returns {Promise<ethers.providers.JsonRpcSigner>}
 */
export async function getEvmSigner() {
  const raw = getEthereumProvider();
  if (!raw) {
    throw new Error('No EVM wallet found. Install MetaMask.');
  }
  const provider = new ethers.providers.Web3Provider(raw);
  await provider.send('eth_requestAccounts', []);
  const network = await provider.getNetwork();
  if (network.chainId !== Number(CLOB_SEI_CHAIN_ID)) {
    await addSeiEvmNetwork(provider);
    return new ethers.providers.Web3Provider(raw).getSigner();
  }
  return provider.getSigner();
}

/**
 * Citește balanța ERC20 (formatat în unități umane).
 * @param {string} tokenAddress
 * @param {string} userAddress
 * @param {number} decimals
 * @returns {Promise<string>} ex: "12.345"
 */
export async function fetchTokenBalance(tokenAddress, userAddress, decimals) {
  const ethProvider = getEthereumProvider();
  if (!ethProvider || !userAddress) return '0';
  try {
    const provider = new ethers.providers.Web3Provider(ethProvider);
    const token = new ethers.Contract(tokenAddress, ERC20ABI, provider);
    const balanceBN = await token.balanceOf(userAddress);
    return ethers.utils.formatUnits(balanceBN, decimals);
  } catch {
    return '0';
  }
}

/**
 * Aprobă tokenul `tokenAddress` pentru spender dacă allowance < amount.
 * Aprobă MaxUint256 pentru a evita aprobări repetate.
 */
async function ensureApproval({ tokenAddress, spender, amount, signer }) {
  const token = new ethers.Contract(tokenAddress, ERC20ABI, signer);
  const owner = await signer.getAddress();
  const allowance = await token.allowance(owner, spender);
  if (allowance.lt(amount)) {
    const tx = await token.approve(spender, ethers.constants.MaxUint256);
    await tx.wait(1);
  }
}

/**
 * Execută un market order pe Mangrove.
 *
 * Buy:  olKey=asks (outbound=base, inbound=quote). Taker dă quote, primește base.
 * Sell: olKey=bids (outbound=quote, inbound=base). Taker dă base, primește quote.
 *
 * @param {object} p
 * @param {object} p.market      – market din CLOB_SEI_MARKETS
 * @param {'buy'|'sell'} p.side
 * @param {string} p.amountBase  – cantitate base (ex: "1.5")
 * @param {number|null} p.bestAskPrice – preț best ask (USDC/wSEI) din order book
 * @param {number|null} p.bestBidPrice – preț best bid (USDC/wSEI) din order book
 * @param {ethers.Signer} p.signer
 * @returns {Promise<{txHash: string, takerGot: string, takerGave: string}>}
 */
export async function executeMarketOrder({ market, side, amountBase, bestAskPrice, bestBidPrice, signer }) {
  assertMarketReferencePrices(side, bestAskPrice, bestBidPrice);

  const { outboundAddress, inboundAddress, tickSpacing, baseDecimals, quoteDecimals } = market;
  const mangrove = new ethers.Contract(MANGROVE_SEI.Mangrove, MangroveABI, signer);

  if (side === 'buy') {
    // Ask side: outbound=base, inbound=quote
    const olKey = [outboundAddress, inboundAddress, tickSpacing];
    const takerWants = ethers.utils.parseUnits(amountBase, baseDecimals);

    const refPrice = Number(bestAskPrice);
    const maxQuote = Number(amountBase) * refPrice * (1 + MARKET_SLIPPAGE);
    const takerGives = ethers.utils.parseUnits(
      maxQuote.toFixed(quoteDecimals),
      quoteDecimals,
    );

    await ensureApproval({ tokenAddress: inboundAddress, spender: MANGROVE_SEI.Mangrove, amount: takerGives, signer });
    const tx = await mangrove.marketOrderByVolume(olKey, takerWants, takerGives, true);
    const receipt = await tx.wait(1);
    return { txHash: receipt.transactionHash };

  } else {
    // Bid side: outbound=quote, inbound=base
    const olKey = [inboundAddress, outboundAddress, tickSpacing];
    const takerGives = ethers.utils.parseUnits(amountBase, baseDecimals);

    const refPrice = Number(bestBidPrice);
    const minQuote = Number(amountBase) * refPrice * (1 - MARKET_SLIPPAGE);
    const takerWants = minQuote > 0
      ? ethers.utils.parseUnits(minQuote.toFixed(quoteDecimals), quoteDecimals)
      : ethers.BigNumber.from(0);

    await ensureApproval({ tokenAddress: outboundAddress, spender: MANGROVE_SEI.Mangrove, amount: takerGives, signer });
    const tx = await mangrove.marketOrderByVolume(olKey, takerWants, takerGives, false);
    const receipt = await tx.wait(1);
    return { txHash: receipt.transactionHash };
  }
}

/**
 * Execută un limit order via MangroveOrder.take().
 * Dacă ordinul nu e fill imediat, rămâne în book ca resting order.
 * Necesită provision (native SEI) ca msg.value pentru bounty.
 *
 * @param {object} p
 * @param {object} p.market
 * @param {'buy'|'sell'} p.side
 * @param {string} p.amountBase  – cantitate base
 * @param {string} p.limitPrice  – preț limită în quote/base (ex: "0.5" USDC per wSEI)
 * @param {ethers.Signer} p.signer
 * @returns {Promise<{txHash: string, offerId: string}>}
 */
/**
 * Extrage offerId din log-uri MangroveOrder după take (dacă evenimentul e emis pe deployment).
 * @param {ethers.providers.TransactionReceipt} receipt
 * @returns {{ offerId: string|null }}
 */
export function parseLimitOrderReceiptLogs(receipt) {
  if (!receipt?.logs?.length) return { offerId: null };
  const iface = new ethers.utils.Interface(MangroveOrderFullABI);
  const target = MANGROVE_SEI.MangroveOrder.toLowerCase();
  for (const log of receipt.logs) {
    if (!log.address || log.address.toLowerCase() !== target) continue;
    try {
      const ev = iface.parseLog(log);
      if (ev.name === 'NewOwnedOffer' && ev.args?.offerId != null) {
        return { offerId: ev.args.offerId.toString() };
      }
    } catch {
      /* not our event */
    }
  }
  return { offerId: null };
}

/**
 * Retrage ofertă resting postată prin MangroveOrder (aceeași olKey ca la take).
 */
export async function executeRetractOffer({ market, side, offerId, signer, deprovision = true }) {
  const { outboundAddress, inboundAddress, tickSpacing } = market;
  const ts = market.tickSpacing ?? 1;
  const olKey =
    side === 'buy'
      ? [outboundAddress, inboundAddress, ts]
      : [inboundAddress, outboundAddress, ts];
  const mo = new ethers.Contract(MANGROVE_SEI.MangroveOrder, MangroveOrderFullABI, signer);
  const tx = await mo.retractOffer(olKey, ethers.BigNumber.from(offerId), deprovision);
  const receipt = await tx.wait(1);
  return { txHash: receipt.transactionHash, receipt };
}

export async function executeLimitOrder({ market, side, amountBase, limitPrice, signer }) {
  const { outboundAddress, inboundAddress, tickSpacing, baseDecimals, quoteDecimals } = market;
  const price = Number(limitPrice);
  if (!price || price <= 0) throw new Error('Invalid limit price');

  const mangroveOrder = new ethers.Contract(MANGROVE_SEI.MangroveOrder, MangroveOrderFullABI, signer);

  if (side === 'buy') {
    // Ask side: outbound=base, inbound=quote
    // Taker willing to pay at most `price` USDC per wSEI → tick = priceToTick(price)
    const olKey = [outboundAddress, inboundAddress, tickSpacing];
    const tick = priceToTick(price);
    const fillVolume = ethers.utils.parseUnits(amountBase, baseDecimals);

    // Approva quote (USDC) verso MangroveOrder
    const maxQuote = ethers.utils.parseUnits(
      (Number(amountBase) * price * 1.01).toFixed(quoteDecimals),
      quoteDecimals,
    );
    await ensureApproval({ tokenAddress: inboundAddress, spender: MANGROVE_SEI.MangroveOrder, amount: maxQuote, signer });

    const tko = {
      olKey,
      fillOrKill: false,
      fillWants: true,
      fillVolume,
      tick,
      expiryDate: 0,
      offerId: 0,
      data: ethers.constants.HashZero,
    };
    const tx = await mangroveOrder.take(tko, { value: LIMIT_ORDER_PROVISION });
    const receipt = await tx.wait(1);
    const parsed = parseLimitOrderReceiptLogs(receipt);
    return { txHash: receipt.transactionHash, offerId: parsed.offerId };

  } else {
    // Bid side: outbound=quote, inbound=base
    // Taker wants at least `price` USDC per wSEI → tick for bid = priceToTick(1/price)
    const olKey = [inboundAddress, outboundAddress, tickSpacing];
    const tick = priceToTick(1 / price);
    const fillVolume = ethers.utils.parseUnits(amountBase, baseDecimals);

    // Approva base (wSEI) verso MangroveOrder
    await ensureApproval({ tokenAddress: outboundAddress, spender: MANGROVE_SEI.MangroveOrder, amount: fillVolume, signer });

    const tko = {
      olKey,
      fillOrKill: false,
      fillWants: false,
      fillVolume,
      tick,
      expiryDate: 0,
      offerId: 0,
      data: ethers.constants.HashZero,
    };
    const tx = await mangroveOrder.take(tko, { value: LIMIT_ORDER_PROVISION });
    const receipt = await tx.wait(1);
    const parsed = parseLimitOrderReceiptLogs(receipt);
    return { txHash: receipt.transactionHash, offerId: parsed.offerId };
  }
}
