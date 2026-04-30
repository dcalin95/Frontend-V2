# BitSwapDEXWrapper Integration

## Overview

`swapExecutionService.jsx` a fost actualizat să folosească automat `BitSwapDEXWrapper` pentru colectarea fee-urilor (0.1%) când contractul este deployat și configurat.

## Configuration

### Environment Variables

Adaugă în `.env`:

```env
REACT_APP_USE_BITSWAP_WRAPPER=true
REACT_APP_BITSWAP_WRAPPER_ADDRESS=0xYourDeployedContractAddress
```

### How It Works

1. **Wrapper Detection:**
   - Verifică `REACT_APP_USE_BITSWAP_WRAPPER=true`
   - Verifică că adresa contractului este setată
   - Verifică că contractul este configurat (`isConfigured()`)

2. **Swap Flow:**
   - Dacă wrapper disponibil → Swap prin `BitSwapDEXWrapper` (colectează fee-uri)
   - Dacă wrapper indisponibil → Fallback la PancakeSwap direct (comportament vechi)

3. **Allowance:**
   - Allowance se verifică pentru wrapper (nu PancakeSwap) când wrapper este activ
   - Approve se face pentru wrapper (nu PancakeSwap) când wrapper este activ

## Functions

### `isWrapperAvailable()`
Verifică dacă wrapper este disponibil și configurat.

### `getSpenderAddress()`
Returnează adresa pentru allowance/approve:
- `BITSWAP_WRAPPER_ADDRESS` dacă wrapper este disponibil
- `PANCAKESWAP_ROUTER` dacă wrapper nu este disponibil

### `executeSwapThroughWrapper()`
Execută swap direct prin wrapper (folosit intern de `executeSwap()`).

### `executeSwap()`
Funcția principală care detectează automat dacă să folosească wrapper sau fallback.

## Testing

1. **Test cu wrapper:**
   - Setează `REACT_APP_USE_BITSWAP_WRAPPER=true`
   - Setează `REACT_APP_BITSWAP_WRAPPER_ADDRESS` cu adresa reală
   - Verifică în console: `[SWAP] Using BitSwapDEXWrapper for swap`

2. **Test fără wrapper (fallback):**
   - Setează `REACT_APP_USE_BITSWAP_WRAPPER=false`
   - Verifică în console: `[SWAP] Wrapper not available, using backend/PancakeSwap direct`

## Important Notes

- Wrapper-ul colectează 0.1% fee din fiecare swap
- Fee-urile merg 100% la treasury (burn = 0%)
- Swap-urile se execută prin PancakeSwap în spate (aceeași lichiditate)
- Fallback la PancakeSwap direct dacă wrapper nu este disponibil

## Troubleshooting

**Problem:** Wrapper nu este detectat
- Verifică că `REACT_APP_USE_BITSWAP_WRAPPER=true`
- Verifică că `REACT_APP_BITSWAP_WRAPPER_ADDRESS` este setat
- Verifică că contractul este deployat și verificat pe BSCScan

**Problem:** Allowance insufficient
- Wrapper-ul necesită approve separat (nu PancakeSwap)
- Frontend-ul va detecta automat și va cere approve pentru wrapper

Pentru documentație completă, vezi: `docs/BITSWAP_DEX_WRAPPER_POST_DEPLOYMENT.md`
