const makeConnector = (type) => (options = {}) => ({ type, options });

module.exports = {
  injected: makeConnector('injected'),
  walletConnect: makeConnector('walletConnect'),
  coinbaseWallet: makeConnector('coinbaseWallet'),
};
