// Loading States
export * from './loading';

// Wallet
export * from './wallet';

// Presale
export * from './presale';

// Error Boundary
export * from './error';

// Global types
export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  apiUrl: string;
  blockchain: {
    bsc: {
      rpcUrl: string;
      chainId: number;
      explorerUrl: string;
    };
    ethereum: {
      rpcUrl: string;
      chainId: number;
      explorerUrl: string;
    };
  };
}

export interface User {
  id: string;
  walletAddress: string;
  email?: string;
  username?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} 