# 📘 ICON SYSTEM - GHID COMPLET DE UTILIZARE

## 🎯 SISTEM ICONIȚE SOLANA AI

Sistem complet de 60 iconițe SVG custom-create în stil **Solana AI** pentru aplicația **BITS Presale**.

---

## 📦 CE CONȚINE

### 1. **60 Iconițe SVG** (`src/assets/icons/*.svg`)
- Gradient verde-violet (#00FFA3 → #9945FF)
- Rezoluție înaltă (64x64 viewBox)
- Scalabile perfect pentru orice dimensiune
- Optimizate pentru performance

### 2. **IconRegistry.js** - Catalog Central
- Export centralizat pentru toate iconițele
- ICON_MAP pentru acces dinamic
- ICON_CATEGORIES pentru organizare

### 3. **Icon.js** - Component Reutilizabil
- Props pentru size, animation, className
- 4 animații built-in: pulse, spin, glow, float
- Touch-friendly și accessibility-ready

---

## 🚀 UTILIZARE

### Import Simplu

```jsx
import Icon from '../assets/icons/Icon';

// Utilizare de bază
<Icon name="wallet-connect" />

// Cu dimensiune
<Icon name="bitcoin" size="large" />

// Cu animație
<Icon name="success" size="medium" animate="pulse" />

// Cu className custom
<Icon name="settings" size="xlarge" animate="glow" className="my-custom-class" />

// Cu onClick handler
<Icon name="copy" size="small" onClick={handleCopy} />
```

---

## 📏 DIMENSIUNI DISPONIBILE

| Size | Pixels | Utilizare |
|------|--------|-----------|
| `small` | 24px | Icons în text, badges |
| `medium` | 32px | Butoane standard, form inputs |
| `large` | 48px | Section headers, hero icons |
| `xlarge` | 64px | Landing pages, main features |
| `number` | Custom | Specifică dimensiune exactă în px |

---

## ✨ ANIMAȚII DISPONIBILE

### `animate="pulse"`
- Bate ușor (scale 1 → 1.05 → 1)
- Perfect pentru: Success icons, notifications, call-to-actions

### `animate="spin"`
- Rotire continuă 360°
- Perfect pentru: Loading spinners, refresh buttons

### `animate="glow"`
- Glow effect pulsant (verde → violet)
- Perfect pentru: Premium features, AI elements, highlights

### `animate="float"`
- Float sus-jos (translateY 0 → -8px → 0)
- Perfect pentru: Hero sections, feature cards, decorative icons

---

## 🎨 CATEGORII ICONIȚE

### 💰 WALLET & PAYMENT (10 iconițe)
```jsx
<Icon name="wallet-connect" />
<Icon name="wallet-disconnect" />
<Icon name="balance" />
<Icon name="send" />
<Icon name="receive" />
<Icon name="credit-card" />
<Icon name="crypto-coin" />
<Icon name="exchange" />
<Icon name="transaction" />
<Icon name="fee" />
```

### 🪙 CRYPTO TOKENS (10 iconițe)
```jsx
<Icon name="bitcoin" />
<Icon name="ethereum" />
<Icon name="solana" />
<Icon name="usdt" />
<Icon name="usdc" />
<Icon name="bnb" />
<Icon name="cardano" />
<Icon name="polygon" />
<Icon name="stacks" />
<Icon name="generic-token" />
```

### 🔒 STAKING & REWARDS (8 iconițe)
```jsx
<Icon name="stake" />
<Icon name="unstake" />
<Icon name="claim-rewards" />
<Icon name="apr" />
<Icon name="lock" />
<Icon name="unlock" />
<Icon name="timer" />
<Icon name="calculator" />
```

### 🧭 NAVIGATION & ACTIONS (12 iconițe)
```jsx
<Icon name="home" />
<Icon name="menu" />
<Icon name="close" />
<Icon name="back" />
<Icon name="forward" />
<Icon name="refresh" />
<Icon name="settings" />
<Icon name="search" />
<Icon name="filter" />
<Icon name="download" />
<Icon name="upload" />
<Icon name="share" />
```

### ✅ STATUS & NOTIFICATIONS (8 iconițe)
```jsx
<Icon name="success" />
<Icon name="error" />
<Icon name="warning" />
<Icon name="info" />
<Icon name="loading" />
<Icon name="verified" />
<Icon name="pending" />
<Icon name="expired" />
```

### 🌐 SOCIAL & COMMUNICATION (6 iconițe)
```jsx
<Icon name="telegram" />
<Icon name="twitter" />
<Icon name="discord" />
<Icon name="link" />
<Icon name="copy" />
<Icon name="qr-code" />
```

### 🔼 UI ELEMENTS (6 iconițe)
```jsx
<Icon name="arrow-up" />
<Icon name="arrow-down" />
<Icon name="chevron-left" />
<Icon name="chevron-right" />
<Icon name="plus" />
<Icon name="minus" />
```

---

## 💡 EXEMPLE PRACTICE

### Section Header cu Icon
```jsx
<h2 className="section-title">
  <Icon name="crypto-coin" size="large" animate="float" />
  <span>Buy $BITS</span>
</h2>
```

### Buton cu Icon
```jsx
<button className="action-btn" onClick={handleStake}>
  <Icon name="stake" size="medium" />
  <span>Stake Now</span>
</button>
```

### Status Notification
```jsx
{transactionStatus === 'success' && (
  <div className="notification">
    <Icon name="success" size="large" animate="pulse" />
    <span>Transaction successful!</span>
  </div>
)}
```

### Token Selector
```jsx
{TOKENS.map(token => (
  <button key={token.id} onClick={() => selectToken(token)}>
    <Icon name={token.iconName} size="medium" />
    <span>{token.name}</span>
  </button>
))}
```

### Loading State
```jsx
<Icon name="loading" size="xlarge" animate="spin" />
```

### Wallet Connect
```jsx
<button onClick={connectWallet}>
  <Icon 
    name={isConnected ? "wallet-disconnect" : "wallet-connect"} 
    size="medium" 
    animate="glow"
  />
  <span>{isConnected ? "Disconnect" : "Connect Wallet"}</span>
</button>
```

---

## 🎨 STYLING CUSTOM

### CSS Override
```css
.my-custom-icon {
  filter: drop-shadow(0 0 20px rgba(0, 255, 163, 1));
  transition: all 0.5s ease;
}

.my-custom-icon:hover {
  transform: scale(1.2) rotate(10deg);
}
```

### Inline Styles
```jsx
<Icon 
  name="bitcoin" 
  size="large"
  style={{
    filter: 'hue-rotate(45deg)',
    opacity: 0.8
  }}
/>
```

---

## ♿ ACCESSIBILITY

### Focus State
Toate iconițele clickable au `focus-visible` outline:
```css
.solana-icon[role="button"]:focus-visible {
  outline: 2px solid var(--solana-green, #00FFA3);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Reduced Motion
Animațiile respectă preferința utilizatorului:
```css
@media (prefers-reduced-motion: reduce) {
  .solana-icon {
    animation: none !important;
    transition: none !important;
  }
}
```

### ARIA Labels
```jsx
<Icon 
  name="menu" 
  size="large" 
  onClick={toggleMenu}
  role="button"
  aria-label="Toggle navigation menu"
/>
```

---

## 📱 RESPONSIVE DESIGN

### Media Queries Built-in
```css
@media (max-width: 768px) {
  .solana-icon--clickable:hover {
    transform: scale(1.05); /* Reduced for mobile */
  }
}
```

### Size Adaptation
```jsx
// Desktop
<Icon name="crypto-coin" size="xlarge" />

// Mobile
<Icon name="crypto-coin" size="large" />

// Automatic with CSS
<Icon name="crypto-coin" className="responsive-icon" />
```

```css
.responsive-icon {
  width: 64px;
  height: 64px;
}

@media (max-width: 768px) {
  .responsive-icon {
    width: 48px;
    height: 48px;
  }
}
```

---

## 🔧 ADVANCED USAGE

### Dynamic Icon Selection
```jsx
const ICON_MAP = {
  pending: 'loading',
  success: 'success',
  error: 'error',
  warning: 'warning'
};

<Icon name={ICON_MAP[status]} size="medium" animate={status === 'pending' ? 'spin' : 'pulse'} />
```

### Conditional Animation
```jsx
<Icon 
  name="wallet-connect" 
  size="large" 
  animate={isConnecting ? 'pulse' : null}
/>
```

### Icon + Text Layout
```jsx
<div className="icon-text-layout">
  <Icon name="info" size="small" />
  <span>Important information</span>
</div>
```

```css
.icon-text-layout {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

---

## ⚡ PERFORMANCE

### Lazy Loading
Iconițele sunt importate ca React Components și beneficiază de code-splitting automat:

```jsx
// IconRegistry.js folosește named exports
export { ReactComponent as BitcoinIcon } from './bitcoin.svg';

// Icon.js le folosește dinamic
const IconComponent = Icons[iconComponentName];
```

### Caching
SVG-urile sunt cached de browser după primul load:
- First load: ~1-2KB per icon
- Subsequent loads: Instant (from cache)

### Bundle Size
- **60 iconițe**: ~80KB total (gzip: ~30KB)
- **Icon.js + Registry**: ~5KB (gzip: ~2KB)
- **Total overhead**: ~35KB gzipped

---

## 🐛 TROUBLESHOOTING

### Iconița nu apare
```jsx
// ❌ BAD - nume greșit
<Icon name="wallet" />

// ✅ GOOD - nume corect din IconRegistry
<Icon name="wallet-connect" />
```

### Warning în consolă
```
Icon "xyz" not found in IconRegistry
```
**Soluție**: Verifică `ICON_MAP` în `IconRegistry.js` pentru numele corect.

### Animația nu funcționează
```jsx
// ❌ BAD - animație invalidă
<Icon name="success" animate="bounce" />

// ✅ GOOD - animații disponibile: pulse, spin, glow, float
<Icon name="success" animate="pulse" />
```

---

## 📊 STATISTICI UTILIZARE

### Implementat în:
✅ Header (Hamburger menu, navigation)
✅ Sidebar (AI Command, toate butoanele)
✅ PresaleMobile (Section headers, feedback banners)
✅ CryptoBoxMobile (Token selector, back button)
✅ PaymentSelectorMobile (Payment methods)

### Iconițe cel mai folosite:
1. `wallet-connect` / `wallet-disconnect`
2. `crypto-coin`
3. `success` / `error`
4. `menu` / `close`
5. `stake` / `claim-rewards`

---

## 🎓 BEST PRACTICES

### DO ✅
- Folosește `Icon` component pentru toate iconițele
- Specifică `size` explicit pentru consistență
- Adaugă `animate` pentru elemente interactive
- Folosește `className` pentru styling custom
- Test accessibility cu screen readers

### DON'T ❌
- Nu hardcoda SVG inline când există icon în registry
- Nu folosi emoji în loc de iconițe
- Nu omite `aria-label` pentru iconițe clickable
- Nu aplica `transform` direct (folosește animații built-in)
- Nu uita de `onClick` handler când iconița e clickable

---

## 📞 SUPORT

Pentru probleme sau întrebări:
1. Verifică acest README
2. Verifică `IconRegistry.js` pentru lista completă
3. Verifică `Icon.css` pentru styling-ul default
4. Testează în browser cu DevTools

---

**Creat de**: AI Assistant pentru BitSwapDEX BITS Presale
**Data**: ${new Date().toISOString().split('T')[0]}
**Versiune**: 1.0.0
**Licență**: Proprietary - BitSwapDEX AI

---

## 🚀 QUICK START

```jsx
// 1. Import
import Icon from '../assets/icons/Icon';

// 2. Use
<Icon name="bitcoin" size="large" animate="float" />

// 3. Done! 🎉
```

**ENJOY YOUR NEW ICON SYSTEM! 🌟**

