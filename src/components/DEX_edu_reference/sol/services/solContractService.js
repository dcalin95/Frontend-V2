/**
 * solContractService.js – Apeluri programe Anchor pe Solana.
 * Folosește @solana/web3.js + wallet adapter (semnare) din WalletContext.
 * @module solContractService
 */

import { SOL_CONTRACTS } from '../solContractConfig';
import { SOL_RPC } from '../solConfig';
import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Fetch account data (read-only) de la un program.
 * @param {string} programId - Program ID (base58)
 * @param {string} accountAddress - Account pubkey (optional, pentru account-specific read)
 * @returns {Promise<object>}
 */
export async function readAccount(programId, accountAddress) {
  if (!programId) {
    throw new Error('SOL program ID not set. Deploy program and set REACT_APP_SOL_*_PROGRAM_ID.');
  }
  const connection = new Connection(SOL_RPC);
  const pubkey = new PublicKey(accountAddress || programId);
  const accountInfo = await connection.getAccountInfo(pubkey).catch(() => null);
  if (!accountInfo) throw new Error('SOL account not found');
  return { data: accountInfo.data, owner: accountInfo.owner.toBase58() };
}

/**
 * Execute swap pe Solana (program ai-trading-executor sau dex-wrapper).
 * Semnare prin Phantom / wallet adapter din WalletContext.
 * @param {object} params - { owner, tokenInMint, tokenOutMint, amountIn, minAmountOut, connection, wallet }
 */
export async function executeSwap(params) {
  const { tokenInMint, tokenOutMint, amountIn, minAmountOut } = params;
  const programId = SOL_CONTRACTS.AI_TRADING_EXECUTOR || SOL_CONTRACTS.DEX_WRAPPER;
  if (!programId) {
    throw new Error('SOL executor or dex wrapper program ID not set.');
  }
  // TODO: build transaction with @solana/web3.js + Jupiter SDK or Raydium; sign with wallet from WalletContext
  throw new Error('executeSwap: Solana signing not yet wired. Add Jupiter/Raydium and pass wallet from context.');
}

export { SOL_CONTRACTS };
