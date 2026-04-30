# 🌉 BridgeHandler - Multi-Chain Bridge Logic pentru BitSwapDEX

**Status:** ✅ **SCHELET COMPLET - READY FOR BRIDGE INTEGRATION**  
**Data:** 2025-01-27  
**Version:** 1.0.0

---

## 📋 Overview

**BridgeHandler** este un orchestrator modular pentru operațiuni cross-chain bridge între multiple blockchain-uri în BitSwapDEX. Permite transferuri de token-uri și swap-uri cross-chain între SEI Network, EVM chains (BSC, Ethereum) și Solana, cu suport complet pentru OTA (On-Token-Agent) AI integration.

### Caracteristici Principale:

- ✅ **Multi-Chain Support**: SEI (CosmWasm), EVM (BSC, Ethereum), Solana
- ✅ **Modular Architecture**: Un adapter dedicat pentru fiecare blockchain
- ✅ **OTA Integration**: Suport pentru AI-controlled bridge operations
- ✅ **Event Listening**: Ascultă și procesează bridge events în timp real
- ✅ **Cross-Chain Swap**: Execută swap-uri cross-chain (bridge + swap)
- ✅ **Extensible**: Ușor de adăugat noi chains (L2s, etc.)

---

## 🏗️ Structură Componente

```
bridge/
├── BridgeHandler.js          # Orchestrator principal
├── seiBridgeAdapter.js       # SEI Network adapter (CosmJS)
├── evmBridgeAdapter.js       # EVM chains adapter (ethers.js)
├── solanaBridgeAdapter.js    # Solana adapter (web3.js)
├── bridgeConfig.js           # Configurare chains și protocols
├── bridgeUtils.js            # Utilitare comune (logging, conversions, etc.)
└── README.md                 # Documentație (acest fișier)
```

---

## 🔗 Chains Supportate

### SEI Network (CosmWasm)

- **RPC**: `https://rpc-sei.keplr.app`
- **REST**: `https://lcd-sei.keplr.app`
- **Chain ID**: `pacific-1` (mainnet), `atlantic-1` (testnet)
- **Native Token**: `SEI` (usei)
- **Token Standard**: CW-20 (Cosmos)
- **Wallets**: Keplr, Compass, Fin, Leap
- **Bridge Protocols**: Wormhole, Axelar

### EVM Chains

#### BSC (Binance Smart Chain)
- **RPC**: `https://bsc-dataseed.binance.org/`
- **Chain ID**: `56` (mainnet), `97` (testnet)
- **Native Token**: `BNB`
- **Token Standard**: ERC-20
- **Wallets**: MetaMask, WalletConnect
- **Bridge Protocols**: Wormhole, LayerZero

#### Ethereum
- **RPC**: `https://eth.llamarpc.com`
- **Chain ID**: `1` (mainnet), `5` (goerli)
- **Native Token**: `ETH`
- **Token Standard**: ERC-20
- **Wallets**: MetaMask, WalletConnect
- **Bridge Protocols**: Wormhole, Axelar, LayerZero

### Solana

- **RPC**: `https://api.mainnet-beta.solana.com`
- **Chain ID**: `mainnet-beta` (mainnet), `devnet` (testnet)
- **Native Token**: `SOL` (lamports)
- **Token Standard**: SPL
- **Wallets**: Phantom, Solflare
- **Bridge Protocols**: Wormhole, Axelar

---

## 📦 Dependințe

### SEI Network:
- `@cosmjs/stargate` - CosmWasm client
- `@cosmjs/proto-signing` - Transaction signing
- `@keplr-wallet/types` - Keplr wallet integration

### EVM Chains:
- `ethers.js` - EVM blockchain interaction
- `@metamask/detect-provider` - MetaMask detection

### Solana:
- `@solana/web3.js` - Solana blockchain interaction
- `@solana/wallet-adapter-react` - Wallet integration
- `@solana/spl-token` - SPL token operations

### Bridge Protocols:
- **Wormhole**: `@certusone/wormhole-sdk`
- **Axelar**: `@axelar-network/axelarjs-sdk`
- **LayerZero**: `@layerzerolabs/lz-sdk`

---

## 🔧 Setări Bridge

### Bridge Protocols

#### Wormhole
- **Protocol ID**: `wormhole`
- **Core Bridge Addresses**: Configurate în `bridgeConfig.js`
- **API Endpoint**: `https://api.wormhole.com`
- **Support**: SEI ↔ EVM ↔ Solana

#### Axelar
- **Protocol ID**: `axelar`
- **Gateway Addresses**: Configurate în `bridgeConfig.js`
- **API Endpoint**: `https://api.axelarscan.io`
- **Support**: SEI ↔ EVM ↔ Solana

#### LayerZero
- **Protocol ID**: `layerzero`
- **Endpoint Addresses**: Configurate în `bridgeConfig.js`
- **API Endpoint**: `https://api.layerzero.network`
- **Support**: EVM ↔ Solana (nu SEI încă)

### Default Protocol per Chain Pair

```javascript
defaultProtocols: {
  'sei-bsc': 'wormhole',
  'sei-ethereum': 'axelar',
  'sei-solana': 'wormhole',
  'bsc-solana': 'wormhole',
  'ethereum-solana': 'wormhole',
  'bsc-ethereum': 'layerzero',
}
```

---

## 📚 Funcții Cheie

### BridgeHandler

#### `initialize(chains)`
Inițializează Bridge Handler cu chain-urile specificate.

```javascript
const bridgeHandler = new BridgeHandler({
  sei: keplrWallet,
  evm: ethersProvider,
  solana: phantomWallet,
});

await bridgeHandler.initialize(['sei', 'bsc', 'solana']);
```

#### `bridgeToken(fromChain, toChain, token, amount, user, options)`
Execută un bridge transfer între două chains.

```javascript
const result = await bridgeHandler.bridgeToken(
  'sei',           // fromChain
  'bsc',           // toChain
  'native',        // token (sau adresă CW-20/ERC-20/SPL)
  '1000000',       // amount (în usei pentru SEI)
  {
    address: 'sei1...',
    useAI: true,   // OTA-controlled
  },
  {
    protocol: 'wormhole',
    otaControlled: true,
  }
);
```

#### `executeCrossChainSwap(fromChain, toChain, tokenIn, tokenOut, amountIn, user, options)`
Execută un swap cross-chain (bridge + swap pe chain-ul destinație).

```javascript
const result = await bridgeHandler.executeCrossChainSwap(
  'sei',
  'bsc',
  'native',
  '0x...', // BNB token address
  '1000000',
  { address: 'sei1...', useAI: true },
  { slippage: 50 } // 0.5%
);
```

#### `listenForBridgeEvents(chainId, callback, filters)`
Ascultă pentru bridge events pe un chain specificat.

```javascript
await bridgeHandler.listenForBridgeEvents(
  'sei',
  (event) => {
    console.log('Bridge event:', event);
  },
  { toChain: 'bsc' }
);
```

#### `onOTABridgeTrigger(otaCommand)`
Handler pentru OTA-controlled bridge operations (apelat automat când `otaControlled: true`).

---

### SEI Bridge Adapter

#### `bridgeToken(toChain, tokenAddress, amount, recipientAddress, options)`
Bridge token de la SEI către alt chain.

#### `listenForBridgeEvents(callback, filters)`
Ascultă pentru bridge events pe SEI.

#### `onOTABridgeTrigger(otaCommand)`
OTA trigger pentru SEI bridge operations.

---

### EVM Bridge Adapter

#### `bridgeToken(toChain, tokenAddress, amount, recipientAddress, options)`
Bridge token de la EVM către alt chain.

#### `listenForBridgeEvents(callback, filters)`
Ascultă pentru bridge events pe EVM.

#### `onOTABridgeTrigger(otaCommand)`
OTA trigger pentru EVM bridge operations.

---

### Solana Bridge Adapter

#### `bridgeToken(toChain, tokenAddress, amount, recipientAddress, options)`
Bridge token de la Solana către alt chain.

#### `listenForBridgeEvents(callback, filters)`
Ascultă pentru bridge events pe Solana.

#### `onOTABridgeTrigger(otaCommand)`
OTA trigger pentru Solana bridge operations.

---

## 🤖 OTA AI Integration

### OTA-Controlled Bridges

BridgeHandler suportă operațiuni bridge controlate de OTA AI:

```javascript
// Enable OTA mode
bridgeHandler.enableOTAMode({
  minAmountForOTA: {
    sei: '1000000',
    evm: '1000000000000000000',
    solana: '1000000000',
  },
  autoBridgeEnabled: false, // Manual approval by default
});

// Bridge cu OTA control
const result = await bridgeHandler.bridgeToken(
  'sei',
  'bsc',
  'native',
  '1000000',
  {
    address: 'sei1...',
    useAI: true,        // OTA-controlled
  },
  {
    otaControlled: true,
  }
);
```

### OTA Authorization

Pentru OTA-controlled operations, se verifică:
1. ✅ User authentication
2. ✅ BITS token holdings (minim `minBITSForOTA`)
3. ✅ User registration în `UserVault`
4. ✅ OTA whitelist status (dacă `ota_only_mode = true`)

### OTA Decision Logic

OTA AI poate decide:
- **Când** să execute bridge (bazat pe strategii și market conditions)
- **Către care chain** să migreze asset-uri (liquidity, yield opportunities)
- **Ce token-uri** să bridge (optimizare pentru trading)

---

## 🔄 Flow Example

### Bridge Transfer: SEI → BSC

```
1. User/Frontend: bridgeToken('sei', 'bsc', 'native', '1000000', user)
   ↓
2. BridgeHandler: Validează parametri, verifică OTA authorization
   ↓
3. SEIBridgeAdapter: Verifică balance, determină protocol (Wormhole)
   ↓
4. Execute Bridge TX: Trimite tranzacție către bridge contract SEI
   ↓
5. Event Emission: BridgeInitiated event pe SEI
   ↓
6. Bridge Protocol: Wormhole procesează bridge
   ↓
7. EVMBridgeAdapter: Recepționează bridge pe BSC
   ↓
8. Completion: Token-urile sunt disponibile pe BSC
```

### Cross-Chain Swap: SEI → BSC (SEI → BNB)

```
1. User: executeCrossChainSwap('sei', 'bsc', 'native', 'BNB_ADDRESS', '1000000', user)
   ↓
2. Bridge: Token-urile SEI sunt bridge-uite către BSC
   ↓
3. Swap (Future): După bridge completion, execute swap pe BSC pentru BNB
   ↓
4. Completion: User primește BNB pe BSC
```

---

## 🚀 Integrări Viitoare

### Phase 1: L2 Support ✅ (Planned)

- **zkSync Era**: EVM-compatible L2
- **Base**: Coinbase L2
- **Arbitrum**: Optimistic rollup
- **Polygon**: Sidechain

### Phase 2: LayerZero Universal Messaging

- Universal messaging între toate chains
- Cross-chain smart contract calls
- Omnichain applications support

### Phase 3: Autonomous AI Triggered Swaps

- OTA decide automat când să execute bridge-uri
- Multi-chain liquidity optimization
- Cross-chain arbitrage opportunities
- Automated yield farming across chains

### Phase 4: Advanced Features

- **Bridge Aggregation**: Găsește cel mai bun preț de bridge între multiple protocols
- **Partial Bridge**: Bridge doar o parte din holdings
- **Scheduled Bridges**: Bridge-uri programate pentru optimizare costuri
- **Bridge History**: Istoric complet al bridge-urilor utilizatorului

---

## 📝 Notes

1. **Current Status**: Componentele sunt scheleturi cu logică mock. Implementarea reală va veni când bridge protocols vor fi integrate.

2. **OTA Integration**: OTA authorization verifică BITS holdings și user registration. Integrarea completă cu OTA AI logic va veni în Phase 3.

3. **Event Listening**: Event listening este mock în acest moment. În production, va folosi WebSocket subscriptions sau event indexing services.

4. **Error Handling**: Toate erorile sunt loggate și aruncate ca `BridgeError` cu coduri specifice pentru debugging.

---

## 🧪 Testing

### Unit Tests (Future)

```javascript
// Test bridge transfer
describe('BridgeHandler', () => {
  it('should bridge token from SEI to BSC', async () => {
    // TODO: Implement test
  });

  it('should verify OTA authorization', async () => {
    // TODO: Implement test
  });

  it('should execute cross-chain swap', async () => {
    // TODO: Implement test
  });
});
```

---

## 📞 Support & Resources

- **BitSwapDEX Docs**: `src/components/DEX/`
- **Wormhole Docs**: [https://docs.wormhole.com/](https://docs.wormhole.com/)
- **Axelar Docs**: [https://docs.axelar.dev/](https://docs.axelar.dev/)
- **LayerZero Docs**: [https://layerzero.gitbook.io/](https://layerzero.gitbook.io/)
- **SEI Network Docs**: [https://docs.sei.io/](https://docs.sei.io/)

---

**Status:** ✅ **SCHELET COMPLET - READY FOR BRIDGE INTEGRATION**  
**Next Steps:** Integrare cu bridge protocols (Wormhole, Axelar, LayerZero) 🚀
