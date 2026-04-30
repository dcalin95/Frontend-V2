class SigningCosmWasmClient {
  static async connectWithSigner() {
    return new SigningCosmWasmClient();
  }

  async execute() {
    return { transactionHash: 'mock-tx' };
  }

  async queryContractSmart() {
    return {};
  }
}

module.exports = { SigningCosmWasmClient };
