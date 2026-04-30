/**
 * ⭐ useTradingPairsFavorites Hook - Gestionare Favorite Trading Pairs
 * 
 * Hook pentru gestionarea perechilor de tranzacționare favorite:
 * - Salvare/ștergere favorite în localStorage
 * - Verificare dacă o pereche este favorită
 * - Listă de favorite
 * 
 * @module useTradingPairsFavorites
 */

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_STORAGE_KEY = 'dex_trading_pairs_favorites';

/**
 * Hook pentru gestionarea favorite-urilor de perechi de tranzacționare
 * @returns {Object} { favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite }
 */
const useTradingPairsFavorites = () => {
  const [favorites, setFavorites] = useState([]);

  // Încarcă favorite-urile din localStorage la mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.error('[useTradingPairsFavorites] Error loading favorites:', err);
      setFavorites([]);
    }
  }, []);

  // Salvează favorite-urile în localStorage
  const saveFavorites = useCallback((newFavorites) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (err) {
      console.error('[useTradingPairsFavorites] Error saving favorites:', err);
    }
  }, []);

  // Verifică dacă o pereche este favorită
  const isFavorite = useCallback((pairSymbol) => {
    if (!pairSymbol) return false;
    // Normalizează simbolul (BTC/USDT sau BTCUSDT -> BTC/USDT)
    const normalized = pairSymbol.includes('/') 
      ? pairSymbol 
      : `${pairSymbol.replace('USDT', '')}/USDT`;
    return favorites.some(fav => {
      const favNormalized = fav.includes('/') 
        ? fav 
        : `${fav.replace('USDT', '')}/USDT`;
      return favNormalized === normalized;
    });
  }, [favorites]);

  // Adaugă o pereche la favorite
  const addFavorite = useCallback((pairSymbol) => {
    if (!pairSymbol || isFavorite(pairSymbol)) return;
    
    // Normalizează simbolul
    const normalized = pairSymbol.includes('/') 
      ? pairSymbol 
      : `${pairSymbol.replace('USDT', '')}/USDT`;
    
    const newFavorites = [...favorites, normalized];
    saveFavorites(newFavorites);
  }, [favorites, isFavorite, saveFavorites]);

  // Elimină o pereche din favorite
  const removeFavorite = useCallback((pairSymbol) => {
    if (!pairSymbol) return;
    
    // Normalizează simbolul
    const normalized = pairSymbol.includes('/') 
      ? pairSymbol 
      : `${pairSymbol.replace('USDT', '')}/USDT`;
    
    const newFavorites = favorites.filter(fav => {
      const favNormalized = fav.includes('/') 
        ? fav 
        : `${fav.replace('USDT', '')}/USDT`;
      return favNormalized !== normalized;
    });
    saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  // Toggle favorite (adaugă dacă nu este, elimină dacă este)
  const toggleFavorite = useCallback((pairSymbol) => {
    if (isFavorite(pairSymbol)) {
      removeFavorite(pairSymbol);
    } else {
      addFavorite(pairSymbol);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return {
    favorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite
  };
};

export default useTradingPairsFavorites;
