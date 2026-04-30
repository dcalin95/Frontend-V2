/**
 * 🪙 TokenLogo Component - Cryptocurrency Token Logo
 *
 * - Logos: tokenIconMap (SSOT) then tokenRegistry.logoUrl for registry tokens.
 * - Normalizes WBNB→BNB so wrapped native shows native logo.
 * - Sizes: xs, sm, md, lg, xl, 2xl, 24, 30.
 * - Fallback: character + color when no image; onError shows fallback.
 *
 * @module TokenLogo
 */

import React from 'react';
import '../../styles/components/token-logo.css';
import { tokenIconMap as importedTokenIconMap } from '../../assets/icons/tokenIconMap';
import { getToken } from '../../services/tokenRegistry';

const tokenIconMap = importedTokenIconMap || {};

/** Wrapped / alias symbols that should use another token's logo */
const SYMBOL_ALIAS = {
  WBNB: 'BNB',
};

function resolveSymbol(symbol) {
  const s = (symbol && String(symbol).toUpperCase()) || 'DEFAULT';
  return SYMBOL_ALIAS[s] || s;
}

// Token colors pentru fallback (când nu avem logo)
const TOKEN_COLORS = {
  'BTC': '#f7931a',
  'ETH': '#627eea',
  'USDT': '#26a17b',
  'USDC': '#2775ca',
  'BNB': '#f3ba2f',
  'BUSD': '#f0b90b',
  'BITS': '#4facfe',
  'SOL': '#14f195',
  'STX': '#5546ff',
  'XRP': '#23292f',
  'ADA': '#0033ad',
  'DOT': '#e6007a',
  'MATIC': '#8247e5',
  'AVAX': '#e84142',
  'LINK': '#2e5ae6',
  'UNI': '#ff007a',
  'CAKE': '#1fc7d4',
  'DOGE': '#c2a633',
  'SHIB': '#f00500',
  'SEI': '#1a73e8',
  'WSEI': '#1a73e8',
  'WETH': '#627eea',
  'ATOM': '#6f7390',
  'XAU': '#d4af37',
  'XAUT': '#d4af37',
  'OIL': '#555e6e',
  'EURS': '#003087',
  'EURC': '#2775ca',
  'EUR': '#003087',
  'GBP': '#c8102e',
  'JPY': '#bc002d',
  'AUD': '#00843d',
  'CHF': '#ff0000',
  'MXN': '#006847',
  'USD': '#3c6e47',
  'SPY': '#4facfe',
  'QQQ': '#6366f1',
  'DEFAULT': '#8b9bb4'
};

// Fallback characters pentru token-uri fără logo
const TOKEN_FALLBACK = {
  'BTC': '₿',
  'ETH': 'Ξ',
  'USDT': '₮',
  'USDC': '💵',
  'BNB': '🔶',
  'BUSD': '💲',
  'BITS': '🪙',
  'SOL': '◎',
  'STX': 'S',
  'SEI': 'Ⓢ',
  'WSEI': 'Ⓢ',
  'WETH': 'Ξ',
  'ATOM': '⚛',
  'DOGE': 'Ð',
  'SHIB': '🐕',
  'CAKE': '🥞',
  'XRP': '✕',
  'XAU': '◆',
  'XAUT': '◆',
  'OIL': '⬡',
  'EURS': '€',
  'EURC': '€',
  'EUR': '🇪🇺',
  'USD': '🇺🇸',
  'GBP': '£',
  'JPY': '¥',
  'AUD': 'A$',
  'CHF': 'Fr',
  'MXN': '$',
  'SPY': 'S',
  'QQQ': 'Q',
  'DEFAULT': '●'
};

const TokenLogo = ({ 
  symbol = 'DEFAULT',
  size = 'md',
  className = '',
  showBorder = false,
  fallbackImage = null
}) => {
  const resolvedSymbol = resolveSymbol(symbol);
  const tokenSymbol = resolvedSymbol;
  const tokenImage = tokenIconMap[tokenSymbol];
  const registryToken = getToken(symbol);
  const registryLogoUrl = registryToken?.logoUrl || null;
  const tokenColor = TOKEN_COLORS[tokenSymbol] || TOKEN_COLORS['DEFAULT'];
  const fallbackChar = TOKEN_FALLBACK[tokenSymbol] || TOKEN_FALLBACK['DEFAULT'];

  const sizeClass = size === 24 || size === '24' ? '24' : (size === 30 || size === '30' ? '30' : size);
  
  // Prioritate: fallbackImage > tokenIconMap > tokenRegistry.logoUrl > fallback char
  const rawSrc = fallbackImage || tokenImage || (registryLogoUrl && typeof registryLogoUrl === 'string' ? registryLogoUrl : null);
  const imageUrl = typeof rawSrc === 'string' ? rawSrc : (rawSrc && rawSrc.default);
  
  if (imageUrl) {
    return (
      <div 
        className={`token-logo token-logo-${sizeClass} ${showBorder ? 'token-logo-border' : ''} ${className}`}
        style={{ backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
        title={tokenSymbol}
      >
        <img
          src={imageUrl}
          alt=""
          role="presentation"
          className="token-logo-img"
          onError={(e) => {
            e.target.style.display = 'none';
            const fallback = e.target.nextElementSibling;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <span
          className="token-logo-char token-logo-fallback"
          style={{
            display: 'none',
            backgroundColor: `${tokenColor}20`,
            color: tokenColor,
            borderColor: `${tokenColor}40`
          }}
          aria-hidden
        >
          {fallbackChar}
        </span>
      </div>
    );
  }
  
  // Fallback cu char și culoare (fără imagine)
  return (
    <div 
      className={`token-logo token-logo-${sizeClass} ${showBorder ? 'token-logo-border' : ''} ${className}`}
      style={{ 
        backgroundColor: `${tokenColor}20`,
        color: tokenColor,
        borderColor: `${tokenColor}40`
      }}
      title={tokenSymbol}
    >
      <span className="token-logo-char">{fallbackChar}</span>
    </div>
  );
};

export default TokenLogo;
