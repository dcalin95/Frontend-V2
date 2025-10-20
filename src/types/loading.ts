export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface TransactionLoadingProps {
  step: number;
}

export interface BitsEstimateLoadingProps {
  amount?: number;
  token?: string;
}

export interface PricesLoadingProps {
  tokens?: string[];
}

export interface BalancesLoadingProps {
  walletAddress?: string;
}

export interface CountdownLoadingProps {
  endTime?: number;
}

export interface SkeletonLoadingProps {
  lines?: number;
  height?: string;
}

export type LoadingStep = 1 | 2 | 3 | 4 | 5;

export interface LoadingSteps {
  [key: number]: string;
}

export const TRANSACTION_STEPS: LoadingSteps = {
  1: "Connecting to blockchain...",
  2: "Preparing transaction...",
  3: "Waiting for confirmation...",
  4: "Processing payment...",
  5: "Finalizing purchase..."
};

export const BITS_ESTIMATE_STEPS: LoadingSteps = {
  1: "Verifying token prices",
  2: "Calculating bonus rewards",
  3: "Finalizing estimate"
};

export const PRICES_STEPS: LoadingSteps = {
  1: "Fetching token prices",
  2: "Updating exchange rates",
  3: "Calculating USD values"
};

export const BALANCES_STEPS: LoadingSteps = {
  1: "Connecting to wallet",
  2: "Fetching balances",
  3: "Verifying permissions"
}; 