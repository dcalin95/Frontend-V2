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

export interface BitsEstimate {
  bits: number;
  usdValue: number;
  bonus: number;
  bonusAmount: number;
  error: string | null;
  loading: boolean;
}

export interface TransactionResult {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  error?: string;
}

export interface BonusTier {
  percent: number;
  limit: number;
}

export type SupportedChains = 'BSC' | 'ETH' | 'POLYGON' | 'AVALANCHE' | 'SOLANA';
export type SupportedTokens = 'BNB' | 'ETH' | 'USDT' | 'USDC' | 'MATIC' | 'AVAX' | 'SOL' | 'SHIB';

export interface PresaleConfig {
  currentRound: number;
  totalRounds: number;
  currentPrice: number;
  endTime: number;
  sold: number;
  supply: number;
}

export interface PaymentBoxProps {
  selectedToken: SupportedTokens;
  selectedChain: SupportedChains;
  amountPay: number;
  setAmountPay: (amount: number) => void;
  tokenPrices: Record<string, { price: number; source: string }>;
  walletAddress: string | null;
  isEstimating: boolean;
  setIsEstimating: (loading: boolean) => void;
  isProcessingTransaction: boolean;
  setIsProcessingTransaction: (loading: boolean) => void;
  transactionStep: number;
  setTransactionStep: (step: number) => void;
}

export interface PresalePageProps {
  // Add any specific props for PresalePage
} 