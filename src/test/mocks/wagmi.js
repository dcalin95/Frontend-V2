const noop = () => {};

const defaultAccount = {
  address: null,
  chain: null,
  chainId: undefined,
  connector: null,
  isConnected: false,
  isConnecting: false,
  isDisconnected: true,
  status: 'disconnected',
};

module.exports = {
  WagmiProvider: ({ children }) => children,
  createConfig: (config) => config,
  http: (url) => ({ type: 'http', url }),
  useAccount: () => defaultAccount,
  useConnect: () => ({
    connect: noop,
    connectAsync: async () => undefined,
    connectors: [],
    isPending: false,
    isLoading: false,
    error: null,
  }),
  useDisconnect: () => ({ disconnect: noop, disconnectAsync: async () => undefined }),
  useChainId: () => undefined,
  useBalance: () => ({ data: null, isLoading: false, isError: false, refetch: async () => ({ data: null }) }),
  useSwitchChain: () => ({ switchChain: noop, switchChainAsync: async () => undefined, chains: [] }),
  useReadContract: () => ({ data: undefined, isLoading: false, isError: false, refetch: async () => ({ data: undefined }) }),
  useWriteContract: () => ({ writeContract: noop, writeContractAsync: async () => undefined, data: undefined, isPending: false, isError: false }),
  useWaitForTransactionReceipt: () => ({ data: undefined, isLoading: false, isSuccess: false, isError: false }),
  useWalletClient: () => ({ data: null, isLoading: false }),
  useReconnect: () => ({ reconnect: noop, reconnectAsync: async () => undefined, connectors: [] }),
};
