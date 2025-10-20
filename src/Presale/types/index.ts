// Tipuri pentru Presale
export interface PaymentParams {
  amount: number;
  bitsToReceive: number;
  walletAddress: string;
  selectedChain: string;
  usdInvested: number;
  bonusAmount?: number;
  bonusPercentage?: number;
  fallbackBitsPrice?: number;
}

export interface TokenData {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  chainId: number;
  priceUSD: number;
}

export interface PresaleState {
  endTime: number;
  sold: number;
  supply: number;
  price: number;
  progress: number;
  isLoaded: boolean;
  error: string | null;
  roundActive: boolean;
}

export interface BonusTier {
  percent: number;
  limit: number;
}

export interface TransactionResult {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  error?: string;
}

export interface BitsEstimate {
  bits: number;
  usdValue: number;
  bonus: number;
  bonusAmount: number;
  error: string | null;
}

export type SupportedChains = 'BSC' | 'ETH' | 'POLYGON' | 'AVALANCHE' | 'SOLANA';
export type SupportedTokens = 'BNB' | 'ETH' | 'USDT' | 'USDC' | 'MATIC' | 'AVAX' | 'SOL' | 'SHIB'; 