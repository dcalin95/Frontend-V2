# 📜 Smart Contracts - BitSwapDEX

## Overview

Documentație detaliată pentru Smart Contracts BitSwapDEX.

---

## Contract List

### 1. BitSwapDEXWrapper.sol
**Status:** 🟡 Architecture Complete - Ready for Implementation  
**Location:** `contracts/BitSwapDEXWrapper.sol`

**Description:** Main contract care interceptează swap-urile, colectează fee-uri, și execută swap-uri prin PancakeSwap Router.

**Key Functions:**
- `swapTokensForTokens()` - Token → Token swap
- `swapETHForTokens()` - BNB → Token swap
- `swapTokensForETH()` - Token → BNB swap
- `calculateFee()` - Calculate protocol fee (0.1%)
- `_distributeFee()` - Distribute fee între burn/stakers/treasury

**Security Features:**
- ReentrancyGuard
- Pausable
- Ownable
- SafeERC20

**Gas Estimates:**
- swapTokensForTokens: ~150,000 - 200,000 gas
- swapETHForTokens: ~120,000 - 150,000 gas
- swapTokensForETH: ~140,000 - 180,000 gas

---

### 2. BitSwapDEXTreasury.sol (Future)
**Status:** ⏳ Not Started  
**Location:** `contracts/BitSwapDEXTreasury.sol`

**Description:** Treasury management contract pentru fonduri colectate.

**Planned Features:**
- Multi-signature wallet
- Fee distribution automation
- Withdrawal management
- Treasury reporting

---

### 3. BitSwapDEXStaking.sol (Future)
**Status:** ⏳ Not Started  
**Location:** `contracts/BitSwapDEXStaking.sol`

**Description:** Staking mechanism pentru distribuție fee-uri către stakers.

**Planned Features:**
- BITS staking
- Rewards distribution (30% din fees)
- Vesting mechanism
- Unstaking logic

---

## Contract Interfaces

### IPancakeRouter
Interface pentru PancakeSwap Router V2.

**Functions:**
```solidity
function swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
) external returns (uint[] memory amounts);

function swapExactETHForTokens(
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
) external payable returns (uint[] memory amounts);

function swapExactTokensForETH(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
) external returns (uint[] memory amounts);
```

---

## Fee Distribution Mechanism

### Current Plan:
- **50%** → Burn (reduce BITS supply)
- **30%** → Stakers (rewards pentru stakers)
- **20%** → Treasury (operational costs)

### Implementation:
```solidity
function _distributeFee(address token, uint256 feeAmount) internal {
    uint256 burnAmount = (feeAmount * burnPercentage) / 100;
    uint256 stakersAmount = (feeAmount * stakersPercentage) / 100;
    uint256 treasuryAmount = (feeAmount * treasuryPercentage) / 100;
    
    // Burn tokens
    if (burnAmount > 0) {
        // Transfer to burn address or call burn function
    }
    
    // Transfer to stakers contract
    if (stakersAmount > 0) {
        // Transfer to staking contract
    }
    
    // Transfer to treasury
    if (treasuryAmount > 0) {
        // Transfer to treasury wallet
    }
}
```

---

## Security Considerations

### Reentrancy Protection:
- Use `ReentrancyGuard` pentru toate external functions
- Check-effects-interactions pattern

### Access Control:
- `onlyOwner` pentru admin functions
- Multi-signature pentru treasury operations (future)

### Input Validation:
- Check for zero address
- Check for zero amounts
- Validate deadline (must be > block.timestamp)
- Validate slippage (amountOutMin)

### Overflow/Underflow:
- Solidity 0.8+ automatic overflow/underflow protection
- SafeERC20 pentru token transfers

---

## Testing Strategy

### Unit Tests:
- Fee calculation
- Fee distribution
- Swap execution
- Edge cases (zero amounts, invalid addresses, etc.)

### Integration Tests:
- Full swap flow (user → wrapper → PancakeSwap → user)
- Fee collection verification
- Treasury operations

### Security Tests:
- Reentrancy attacks
- Access control tests
- Edge case exploits

---

## Deployment Checklist

### Pre-Deployment:
- [ ] Code review
- [ ] Security audit (extern)
- [ ] Gas optimization
- [ ] Test coverage > 90%
- [ ] Documentation complete

### Deployment:
- [ ] Deploy to testnet
- [ ] Verify contracts on BSCScan
- [ ] Test all functions on testnet
- [ ] Fix any issues
- [ ] Deploy to mainnet
- [ ] Verify contracts on BSCScan (mainnet)
- [ ] Initialize configuration
- [ ] Monitor closely (24-48h)

### Post-Deployment:
- [ ] Monitor transactions
- [ ] Monitor fees collected
- [ ] Monitor gas costs
- [ ] User feedback
- [ ] Bug fixes (if needed)

---

**Last Updated:** 2026-01-08  
**Status:** 🟡 Documentation Complete - Ready for Implementation

