# 🌐 BitSwapDEX - Multi-Chain Structure Documentation

**Data:** 2025-01-27  
**Status:** ✅ **STRUCTURĂ MODULARĂ CREATĂ**  
**Scope:** Suport pentru EVM (BSC), Solana și Stacks (Bitcoin Layer)

---

## 📁 Structura Directoare

```
src/components/DEX/
├── solana/                          # ✅ NOU - Solana blockchain components
│   ├── SwapPanel.solana.jsx        # Swap operations pentru SPL tokens
│   ├── WalletConnector.solana.jsx  # Phantom, Solflare wallet connection
│   ├── TokenSelector.solana.jsx    # SPL token selection
│   ├── BridgePanel.solana.jsx      # Cross-chain bridging
│   └── StakingPanel.solana.jsx     # SOL staking și liquid staking
│
├── stacks/                          # ✅ NOU - Stacks (Bitcoin Layer) components
│   ├── SwapPanel.stacks.jsx        # Swap operations pentru SIP-010 tokens
│   ├── WalletConnector.stacks.jsx  # Hiro, Xverse wallet connection
│   ├── TokenSelector.stacks.jsx    # SIP-010 token selection
│   ├── BridgePanel.stacks.jsx      # Bitcoin ↔ Stacks bridging
│   └── StakingPanel.stacks.jsx     # STX stacking (Bitcoin rewards)
│
├── sei/                             # ✅ NOU - SEI Network components
│   ├── SwapPanel.sei.jsx           # Swap operations pentru native/CW-20 tokens
│   ├── WalletConnector.sei.jsx     # Compass, Fin, Keplr wallet connection
│   ├── TokenSelector.sei.jsx       # Native SEI și CW-20 token selection
│   ├── BridgePanel.sei.jsx         # Cross-chain bridging via IBC
│   └── StakingPanel.sei.jsx        # SEI staking și delegation
│
├── ota/                             # ✅ NOU - OTA (On-Token-Agent) components
│   ├── OTASettingsPanel.jsx        # OTA settings și configuration
│   ├── OTAConditionsEditor.jsx     # OTA conditions editing
│   └── OTAAccessControl.jsx        # OTA access control (BITS verification)
│
├── common/                          # ✅ NOU - Shared components
│   └── ChainToggle.jsx             # Blockchain chain selector
│
└── DEXApp.jsx                       # ✅ ACTUALIZAT - Chain selection integration
```

---

## 🎯 Componente Create

### Solana Components (5)

1. **SwapPanel.solana.jsx**
   - Swap între SPL tokens
   - Integration cu Jupiter/Raydium
   - Price calculation și slippage protection

2. **WalletConnector.solana.jsx**
   - Phantom wallet
   - Solflare wallet
   - Ledger support
   - Connection state management

3. **TokenSelector.solana.jsx**
   - Lista de SPL tokens
   - Search și filter
   - Token balance display
   - Custom token add

4. **BridgePanel.solana.jsx**
   - Wormhole integration
   - Allbridge support
   - Cross-chain transfers
   - Bridge status tracking

5. **StakingPanel.solana.jsx**
   - SOL staking
   - Liquid staking (mSOL, stSOL)
   - Staking pools
   - Rewards tracking

### Stacks Components (5)

1. **SwapPanel.stacks.jsx**
   - Swap între SIP-010 tokens
   - Integration cu Alex Protocol
   - Bitcoin-native swaps
   - Price calculation și slippage protection

2. **WalletConnector.stacks.jsx**
   - Hiro wallet
   - Xverse wallet
   - Leather wallet
   - Connection state management

3. **TokenSelector.stacks.jsx**
   - Lista de SIP-010 tokens
   - Search și filter
   - STX native token support
   - Token balance display

4. **BridgePanel.stacks.jsx**
   - Bitcoin ↔ Stacks bridging
   - EVM ↔ Stacks bridging
   - Cross-chain transfers
   - Bridge status tracking

5. **StakingPanel.stacks.jsx**
   - STX stacking (Bitcoin rewards)
   - Stacking pools
   - Rewards tracking
   - Delegation support

### SEI Network Components (5)

1. **SwapPanel.sei.jsx**
   - Swap între native tokens și CW-20 tokens
   - Integration cu SEI DEX protocols
   - Price calculation și slippage protection
   - Cross-chain swaps (EVM/Solana/Stacks ↔ SEI)

2. **WalletConnector.sei.jsx**
   - Compass wallet
   - Fin wallet
   - Keplr wallet (Cosmos ecosystem)
   - Leap wallet
   - Connection state management

3. **TokenSelector.sei.jsx**
   - Native SEI token
   - CW-20 tokens (Cosmos standard)
   - Search și filter
   - Token balance display
   - Custom token add

4. **BridgePanel.sei.jsx**
   - EVM ↔ SEI bridging
   - Solana ↔ SEI bridging
   - Stacks ↔ SEI bridging
   - Cross-chain transfers via IBC (Inter-Blockchain Communication)
   - Bridge status tracking

5. **StakingPanel.sei.jsx**
   - Native SEI staking
   - Validator selection
   - Delegation management
   - Rewards tracking
   - Unbonding period management

### Stacks Components (5)

1. **SwapPanel.stacks.jsx**
   - Swap între SIP-010 tokens
   - Integration cu Alex Protocol
   - Bitcoin-native swaps
   - Price calculation și slippage protection

2. **WalletConnector.stacks.jsx**
   - Hiro wallet
   - Xverse wallet
   - Leather wallet
   - Connection state management

3. **TokenSelector.stacks.jsx**
   - Lista de SIP-010 tokens
   - Search și filter
   - STX native token support
   - Token balance display

4. **BridgePanel.stacks.jsx**
   - Bitcoin ↔ Stacks bridging
   - EVM ↔ Stacks bridging
   - Cross-chain transfers
   - Bridge status tracking

5. **StakingPanel.stacks.jsx**
   - STX stacking (Bitcoin rewards)
   - Stacking pools
   - Rewards tracking
   - Delegation support

### OTA Components (3)

1. **OTASettingsPanel.jsx**
   - Enable/disable OTA
   - Risk limits configuration
   - Strategy preferences
   - Auto-execution settings
   - Chain selection (EVM/Solana/Stacks)

2. **OTAConditionsEditor.jsx**
   - Trading conditions
   - Entry/exit rules
   - Stop loss / Take profit rules
   - Risk management rules
   - Conditional execution logic

3. **OTAAccessControl.jsx**
   - BITS token verification
   - User authentication check
   - Privileges display
   - Access level management
   - Multi-chain access control

### Common Components (1)

1. **ChainToggle.jsx**
   - Blockchain chain selector
   - EVM (BSC/Ethereum)
   - Solana
   - Stacks (Bitcoin Layer)
   - SEI Network
   - Chain selection state management

---

## 🔄 Integrare în DEXApp.jsx

### Chain Selection State:

```jsx
const [selectedChain, setSelectedChain] = useState('evm');
```

### Chain Toggle Integration:

```jsx
<ChainToggle onChainChange={handleChainChange} />
```

### Conditional Rendering:

- **EVM (BSC):** Folosește componentele existente din `frontend/pages/`
- **Solana:** Afișează componentele din `solana/`
- **Stacks:** Afișează componentele din `stacks/`

### OTA Components:

- Sunt afișate **întotdeauna** pentru users autentificați cu BITS
- Verificare acces se face în `OTAAccessControl.jsx`

---

## 🎨 Design Pattern

### Naming Convention:

- **Solana:** `*.solana.jsx`
- **Stacks:** `*.stacks.jsx`
- **Common:** `*.jsx` (fără suffix)

### Structure:

- **Modular:** Fiecare blockchain are propriul director
- **Reusable:** Common components pentru logică shared
- **Scalable:** Ușor de adăugat noi blockchain-uri

---

## 📋 Status Componente

| Component | Status | Description |
|-----------|--------|-------------|
| **Solana Components** | ✅ Schelet | 5 componente create cu placeholder |
| **Stacks Components** | ✅ Schelet | 5 componente create cu placeholder |
| **SEI Components** | ✅ Schelet | 5 componente create cu placeholder |
| **OTA Components** | ✅ Schelet | 3 componente create cu placeholder |
| **ChainToggle** | ✅ Funcțional | Chain selection cu state management |
| **DEXApp Integration** | ✅ Actualizat | Chain toggle integrat, conditional rendering |

---

## 🚀 Next Steps (Future Implementation)

### Phase 1: Wallet Integration
- [ ] Integrare Phantom wallet pentru Solana
- [ ] Integrare Hiro/Xverse wallet pentru Stacks
- [ ] Unified wallet context pentru multi-chain

### Phase 2: Swap Functionality
- [ ] Jupiter API integration pentru Solana swaps
- [ ] Alex Protocol integration pentru Stacks swaps
- [ ] Unified swap interface

### Phase 3: Bridge Integration
- [ ] Wormhole integration pentru Solana
- [ ] Bitcoin bridge pentru Stacks
- [ ] Cross-chain transfer UI

### Phase 4: OTA Multi-Chain
- [ ] OTA conditions pentru fiecare chain
- [ ] Cross-chain OTA execution
- [ ] Unified OTA dashboard

---

## 📝 Notes

1. **Placeholder Components:** Toate componentele sunt scheleturi cu placeholder content
2. **No Real Logic:** Nu există logică reală de wallet connection sau swap încă
3. **Chain Toggle:** Funcțional cu state management basic
4. **OTA Access:** Verificare acces se va face în `OTAAccessControl.jsx` (verificare BITS + authentication)

---

**Data Creare:** 2025-01-27  
**Status:** ✅ **STRUCTURĂ MODULARĂ COMPLETĂ**  
**Ready for:** Future Implementation 🚀
