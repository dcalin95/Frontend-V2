export interface Wallet {
  address: string;
  balance: string;
  isConnected: boolean;
}

export interface WalletConnection {
  provider: any;
  signer: any;
  address: string;
}

export interface WalletError {
  code: string;
  message: string;
} 