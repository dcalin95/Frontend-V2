# Token Registry - Single Source of Truth

## Overview

`tokenRegistry.js` este **SINGLE SOURCE OF TRUTH** pentru toate tokenurile din aplicație. Elimină duplicarea și asigură consistența datelor despre tokeni în întreaga aplicație.

## Arhitectură

```
tokenRegistry.js (SSOT)
    ↓
    ├── walletBalanceService.jsx (import TOKEN_ADDRESSES)
    ├── swapExecutionService.jsx (import TOKEN_ADDRESSES)
    ├── SwapPanel.jsx (import getAllTokens, getAllTokenSymbols)
    ├── LimitOrderPanel.jsx (import getAllTokenSymbols)
    └── OTA AI components (import getAllTokens, getToken)
```

## Token Registry Structure

Fiecare token în registry conține:

```javascript
{
  symbol: 'BTC',              // Token symbol (uppercase)
  name: 'Bitcoin',            // Full name
  address: '0x...',           // Contract address (null for native BNB)
  decimals: 18,               // Token decimals
  logoUrl: null,              // Logo URL (optional)
  isNative: false,            // Is native token (BNB)
  isStablecoin: false,        // Is stablecoin (USDT, BUSD)
  type: 'erc20',              // 'native' | 'erc20' | 'stablecoin'
  displayOrder: 2             // Display order (lower = higher priority)
}
```

## Available Tokens (built-in)

| Symbol | Name | Type | Contract Address |
|--------|------|------|-----------------|
| BNB | Binance Coin | native | null (native) |
| BTC | Bitcoin (Binance-Peg) | erc20 | 0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c |
| USDT | Tether USD | stablecoin | 0x55d398326f99059fF775485246999027B3197955 |
| BITS | BITS Token | erc20 | 0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe |
| ETH | Ethereum (Binance-Peg) | erc20 | 0x2170Ed0880ac9A755fd29B2688956BD959F933F8 |
| BUSD | Binance USD | stablecoin | 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56 |
| SOL | Solana (BSC-Bridge) | erc20 | 0x570a5d26f7765ecb712c0924e4de545b89fd43df |
| MATIC | Polygon (Binance-Peg) | erc20 | 0xcc42724c6683b7e57334c4e856f4c9965ed682bd |

Tokenii **custom** (adaugați de utilizator) apar și ei în listă; sunt salvați în `localStorage` și gestionați de `customTokenManager.js`.

## API Functions

### `getAllTokens()`
Returnează toate tokenurile ca array, sortate după `displayOrder`.

```javascript
import { getAllTokens } from './services/tokenRegistry';

const tokens = getAllTokens();
// [{ symbol: 'BNB', ... }, { symbol: 'BTC', ... }, ...]
```

### `getToken(symbol)`
Obține un token după symbol (case-insensitive).

```javascript
import { getToken } from './services/tokenRegistry';

const btc = getToken('BTC');
// { symbol: 'BTC', name: 'Bitcoin', address: '0x...', ... }
```

### `getTokenAddress(symbol)`
Obține adresa contractului unui token.

```javascript
import { getTokenAddress } from './services/tokenRegistry';

const btcAddress = getTokenAddress('BTC');
// '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c'
```

### `getAllTokenSymbols()`
Returnează array cu toate simbolurile de tokeni.

```javascript
import { getAllTokenSymbols } from './services/tokenRegistry';

const symbols = getAllTokenSymbols();
// ['BNB', 'BTC', 'USDT', 'BITS', 'ETH', 'BUSD']
```

### `getERC20Tokens()`
Returnează doar tokenurile ERC20 (exclude BNB nativ).

```javascript
import { getERC20Tokens } from './services/tokenRegistry';

const erc20Tokens = getERC20Tokens();
// [{ symbol: 'BTC', ... }, { symbol: 'USDT', ... }, ...]
```

### `getStablecoins()`
Returnează doar stablecoins.

```javascript
import { getStablecoins } from './services/tokenRegistry';

const stables = getStablecoins();
// [{ symbol: 'USDT', ... }, { symbol: 'BUSD', ... }]
```

### `hasToken(symbol)`
Verifică dacă un token există în registry.

```javascript
import { hasToken } from './services/tokenRegistry';

if (hasToken('BTC')) {
  // Token exists
}
```

### `getTokenDecimals(symbol)`
Obține zecimalele unui token (default 18).

```javascript
import { getTokenDecimals } from './services/tokenRegistry';

const decimals = getTokenDecimals('BTC');
// 18
```

### `isNativeToken(symbol)`
Verifică dacă token-ul este nativ (BNB).

```javascript
import { isNativeToken } from './services/tokenRegistry';

if (isNativeToken('BNB')) {
  // Use native balance method
}
```

### `isStablecoin(symbol)`
Verifică dacă token-ul este stablecoin.

```javascript
import { isStablecoin } from './services/tokenRegistry';

if (isStablecoin('USDT')) {
  // Price is always ~1 USD
}
```

## Legacy Compatibility

Pentru backward compatibility, `TOKEN_ADDRESSES` object este disponibil:

```javascript
import { TOKEN_ADDRESSES } from './services/tokenRegistry';

const btcAddress = TOKEN_ADDRESSES['BTC'];
// '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c'
```

⚠️ **Deprecat**: Folosește `getTokenAddress()` în loc.

## Usage Examples

### SwapPanel - Load All Tokens

```javascript
import { getAllTokens, getAllTokenSymbols } from '../../services/tokenRegistry';

// Get all token symbols for price/balance fetching
const symbols = getAllTokenSymbols();
const prices = await tokenPriceService.getAllTokenPrices(symbols);
const balances = await walletBalanceService.getAllTokenBalances(walletAddress, symbols);

// Create tokens list with metadata
const tokensList = getAllTokens().map(token => ({
  symbol: token.symbol,
  name: token.name,
  balance: balances[token.symbol] || '0',
  price: prices[token.symbol] || 0
}));
```

### LimitOrderPanel - Selected Token

```javascript
import { getToken, getAllTokenSymbols } from '../../services/tokenRegistry';

// Get token metadata
const selectedToken = getToken(selectedTokenSymbol);
// { symbol: 'BTC', name: 'Bitcoin', address: '0x...', decimals: 18 }

// Fetch balances for selected + common tokens
const tokensToFetch = [selectedTokenSymbol, 'USDT', 'BNB'];
const balances = await walletBalanceService.getAllTokenBalances(walletAddress, tokensToFetch);
```

### OTA AI - Filter by Type

```javascript
import { getERC20Tokens, getStablecoins } from '../../services/tokenRegistry';

// Get only tradeable tokens (exclude native BNB for some strategies)
const tradeableTokens = getERC20Tokens();

// Get stablecoins for quote currency
const stablecoins = getStablecoins();
```

## Adding New Tokens

### 1) Token built-in (în aplicație pentru toți utilizatorii)

Editează `TOKEN_REGISTRY` în `tokenRegistry.js`. Găsești adresa BSC pe BscScan (token-uri Binance-Peg sunt verificate).

```javascript
export const TOKEN_REGISTRY = {
  // ... existing tokens (BNB, BTC, USDT, BITS, ETH, BUSD, SOL, MATIC)

  // Exemplu: alt token (ex. CAKE)
  CAKE: {
    symbol: 'CAKE',
    name: 'PancakeSwap Token',
    address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    decimals: 18,
    logoUrl: null,
    isNative: false,
    isStablecoin: false,
    type: 'erc20',
    displayOrder: 9  // după MATIC
  }
};
```

**Asta e tot!** Toate selectoarele de tokeni (HeaderTokenSelector) vor afișa automat noul token.

### 2) Token adăugat manual de utilizator (custom, pe viitor)

- **Backend**: există deja `utils/customTokenManager.js` – `addCustomToken({ symbol, name, address, decimals })` salvează în `localStorage`; `getAllTokens()` din tokenRegistry include și tokenii custom.
- **UI pe viitor**: poți adăuga în dropdown-ul HeaderTokenSelector un element „Adaugă token” care deschide un modal: utilizatorul introduce symbol, name, adresa BSC; la salvare se apelează `addCustomToken()`. Detalii în `docs/DEX_ADD_CUSTOM_TOKEN_UI.md`.

## Benefits

✅ **Single Source of Truth** - O singură sursă pentru toate datele despre tokeni  
✅ **Consistență** - Toate componentele folosesc aceleași date  
✅ **Ușor de extins** - Adaugi un token o singură dată, apare peste tot  
✅ **Type Safety** - JSDoc types pentru toate funcțiile  
✅ **Performance** - Sortare și filtrare optimizată  
✅ **Maintainability** - Un singur fișier de modificat

## Migration Guide

### Before (duplicated lists):

```javascript
// ❌ BAD: Hardcoded in each component
const tokensList = [
  { symbol: 'BTC', balance: balances['BTC'] || '0' },
  { symbol: 'USDT', balance: balances['USDT'] || '0' },
  // ... more hardcoded tokens
];
```

### After (centralized registry):

```javascript
// ✅ GOOD: Import from SSOT
import { getAllTokens } from '../../services/tokenRegistry';

const tokensList = getAllTokens().map(token => ({
  symbol: token.symbol,
  name: token.name,
  balance: balances[token.symbol] || '0',
  price: prices[token.symbol] || 0
}));
```

## Testing

Toate funcțiile sunt pure și ușor de testat:

```javascript
import { getToken, hasToken, isStablecoin } from './tokenRegistry';

// Test token existence
expect(hasToken('BTC')).toBe(true);
expect(hasToken('INVALID')).toBe(false);

// Test stablecoin detection
expect(isStablecoin('USDT')).toBe(true);
expect(isStablecoin('BTC')).toBe(false);

// Test token retrieval
const btc = getToken('BTC');
expect(btc.symbol).toBe('BTC');
expect(btc.decimals).toBe(18);
```

## Files Modified

- ✅ **Created**: `src/components/DEX/frontend/services/tokenRegistry.js`
- ✅ **Updated**: `src/components/DEX/frontend/services/walletBalanceService.jsx`
- ✅ **Updated**: `src/components/DEX/frontend/services/swapExecutionService.jsx`
- ✅ **Updated**: `src/components/DEX/frontend/components/trade/SwapPanel.jsx`
- ✅ **Updated**: `src/components/DEX/frontend/components/trade/LimitOrderPanel.jsx`
- ✅ **Updated**: `src/components/DEX/frontend/services/index.js`

## Next Steps

Pentru a conecta și alte componente (OTA AI, Portfolio, etc.), importă funcțiile necesare din `tokenRegistry`:

```javascript
import { getAllTokens, getToken, getAllTokenSymbols } from '../../services/tokenRegistry';
```

Și înlocuiește orice listă hardcoded cu apeluri la aceste funcții.
